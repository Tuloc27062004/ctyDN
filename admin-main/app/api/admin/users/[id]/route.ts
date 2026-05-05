import { NextResponse } from "next/server";
import { UserStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { sendApprovedEmail } from "@/lib/mail";
import { cuidSchema } from "@/lib/validators";

const patchSchema = z
  .object({
    status: z.nativeEnum(UserStatus).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((body) => body.status !== undefined || body.isActive !== undefined, {
    message: "No changes provided",
  });

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const id = idParsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        country: true,
        companyName: true,
        companyAddress: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Failed to load user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const id = idParsed.data;

  try {
    const json = await req.json();
    const body = patchSchema.parse(json);

    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        isActive: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let shouldSendApprovalEmail = false;

    const updateData: {
      status?: UserStatus;
      isActive?: boolean;
      verifyToken?: string | null;
      verifyTokenExp?: Date | null;
    } = {};

    if (body.status !== undefined) {
      updateData.status = body.status;

      // Clear old token fields because email flow no longer uses set-password token links
      updateData.verifyToken = null;
      updateData.verifyTokenExp = null;

      if (body.status === UserStatus.ACCEPTED) {
        shouldSendApprovalEmail =
          currentUser.status !== UserStatus.ACCEPTED &&
          currentUser.status !== UserStatus.VERIFIED;
      }
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        country: true,
        companyName: true,
        companyAddress: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let approvalEmailSent = false;
    let warning: string | null = null;

    if (shouldSendApprovalEmail) {
      try {
        const emailResult = await sendApprovedEmail({
          to: updatedUser.email,
          name: updatedUser.fullName || "User",
        });

        if (emailResult.error) {
          throw new Error(emailResult.error.message);
        }

        approvalEmailSent = true;
      } catch (error) {
        console.error("Failed to send approval email via Resend:", error);
        warning =
          "User was updated, but the approval email could not be sent.";
      }
    }

    return NextResponse.json({
      ok: true,
      user: updatedUser,
      approvalEmailSent,
      warning,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid data",
          fieldErrors: error.flatten().fieldErrors,
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("PATCH User Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}