import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { patternInputSchema, zodFieldErrors } from "@/lib/validators";

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const patterns = await prisma.pattern.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      textureUrl: true,
      defaultScale: true,
      defaultOpacity: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          productPatterns: true,
          categoryPatterns: true,
          defaultForProducts: true,
        },
      },
    },
  });

  return NextResponse.json({ patterns });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = patternInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid pattern input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const normalizedCode = normalizeCode(body.code);

  const duplicate = await prisma.pattern.findFirst({
    where: {
      OR: [
        {
          code: {
            equals: normalizedCode,
            mode: "insensitive",
          },
        },
        {
          name: {
            equals: body.name,
            mode: "insensitive",
          },
        },
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Pattern name or code already exists" },
      { status: 409 }
    );
  }

  const pattern = await prisma.pattern.create({
    data: {
      name: body.name,
      code: normalizedCode,
      textureUrl: body.textureUrl,
      defaultScale: body.defaultScale,
      defaultOpacity: body.defaultOpacity,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ ok: true, pattern }, { status: 201 });
}
