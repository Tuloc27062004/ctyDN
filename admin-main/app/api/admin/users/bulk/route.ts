import { NextResponse } from "next/server";
import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const bulkUserActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(["approve", "reject", "block", "unblock"]),
});

function zodFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bulkUserActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid bulk user action",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const ids = [...new Set(parsed.data.ids)].filter(Boolean);
  const { action } = parsed.data;

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No user ids provided" },
      { status: 400 }
    );
  }

  try {
    if (action === "approve") {
      const result = await prisma.user.updateMany({
        where: {
          id: { in: ids },
          role: Role.USER,
          status: UserStatus.PENDING,
        },
        data: {
          status: UserStatus.ACCEPTED,
          isActive: true,
        },
      });

      return NextResponse.json({
        ok: true,
        action,
        updatedCount: result.count,
      });
    }

    if (action === "reject") {
      const result = await prisma.user.updateMany({
        where: {
          id: { in: ids },
          role: Role.USER,
          status: UserStatus.PENDING,
        },
        data: {
          status: UserStatus.REJECTED,
          isActive: false,
          verifyToken: null,
          verifyTokenExp: null,
        },
      });

      return NextResponse.json({
        ok: true,
        action,
        updatedCount: result.count,
      });
    }

    if (action === "block") {
      const result = await prisma.user.updateMany({
        where: {
          id: { in: ids },
          role: Role.USER,
          status: {
            not: UserStatus.PENDING,
          },
        },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({
        ok: true,
        action,
        updatedCount: result.count,
      });
    }

    const result = await prisma.user.updateMany({
      where: {
        id: { in: ids },
        role: Role.USER,
        status: {
          in: [UserStatus.ACCEPTED, UserStatus.VERIFIED],
        },
      },
      data: {
        isActive: true,
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      updatedCount: result.count,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update users" },
      { status: 500 }
    );
  }
}