import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { colorInputSchema, zodFieldErrors } from "@/lib/validators";

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

  const colors = await prisma.color.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      hex: true,
      swatchUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          productColors: true,
          categoryColors: true,
          defaultForProducts: true,
        },
      },
    },
  });

  return NextResponse.json({ colors });
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
  const parsed = colorInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid color input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const normalizedCode = normalizeCode(body.code);

  const duplicate = await prisma.color.findFirst({
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
      { error: "Color name or code already exists" },
      { status: 409 }
    );
  }

  const color = await prisma.color.create({
    data: {
      name: body.name,
      code: normalizedCode,
      hex: body.hex,
      swatchUrl: body.swatchUrl ?? null,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ ok: true, color }, { status: 201 });
}
