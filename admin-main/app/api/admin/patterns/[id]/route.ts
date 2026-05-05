import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  patternInputSchema,
  zodFieldErrors,
} from "@/lib/validators";

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
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
    return NextResponse.json({ error: "Invalid pattern id" }, { status: 400 });
  }

  const pattern = await prisma.pattern.findUnique({
    where: { id: idParsed.data },
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

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  return NextResponse.json({ pattern });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
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
    return NextResponse.json({ error: "Invalid pattern id" }, { status: 400 });
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

  const existing = await prisma.pattern.findUnique({
    where: { id: idParsed.data },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const duplicate = await prisma.pattern.findFirst({
    where: {
      NOT: { id: idParsed.data },
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
      { error: "Another pattern already uses this name or code" },
      { status: 409 }
    );
  }

  const pattern = await prisma.pattern.update({
    where: { id: idParsed.data },
    data: {
      name: body.name,
      code: normalizedCode,
      textureUrl: body.textureUrl,
      defaultScale: body.defaultScale,
      defaultOpacity: body.defaultOpacity,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ ok: true, pattern });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
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
    return NextResponse.json({ error: "Invalid pattern id" }, { status: 400 });
  }

  const pattern = await prisma.pattern.findUnique({
    where: { id: idParsed.data },
    select: { id: true, isActive: true },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const updated = await prisma.pattern.update({
    where: { id: idParsed.data },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true, softDisabled: true, pattern: updated });
}
