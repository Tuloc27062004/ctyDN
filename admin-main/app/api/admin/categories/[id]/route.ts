import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  categoryConfiguratorSchema,
  cuidSchema,
  zodFieldErrors,
} from "@/lib/validators";

function uniqueIds(ids: string[]) {
  return [...new Set(ids)].filter(Boolean);
}

function mapCategory(category: any) {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    categoryPatterns: category.categoryPatterns,
    categoryColors: category.categoryColors,
    allowedPatternIds: category.categoryPatterns.map((item: any) => item.patternId),
    allowedColorIds: category.categoryColors.map((item: any) => item.colorId),
    _count: category._count,
  };
}

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

async function validateOptionIds(patternIds: string[], colorIds: string[]) {
  const [patternCount, colorCount] = await Promise.all([
    patternIds.length > 0
      ? prisma.pattern.count({ where: { id: { in: patternIds } } })
      : Promise.resolve(0),
    colorIds.length > 0
      ? prisma.color.count({ where: { id: { in: colorIds } } })
      : Promise.resolve(0),
  ]);

  if (patternIds.length > 0 && patternCount !== patternIds.length) {
    return "One or more selected patterns do not exist";
  }

  if (colorIds.length > 0 && colorCount !== colorIds.length) {
    return "One or more selected colors do not exist";
  }

  return null;
}

async function getCategoryDetail(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      categoryPatterns: {
        orderBy: { createdAt: "asc" },
        select: {
          patternId: true,
          pattern: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },
        },
      },
      categoryColors: {
        orderBy: { createdAt: "asc" },
        select: {
          colorId: true,
          color: {
            select: {
              id: true,
              name: true,
              code: true,
              hex: true,
              isActive: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: true,
          categoryPatterns: true,
          categoryColors: true,
        },
      },
    },
  });
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
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const category = await getCategoryDetail(idParsed.data);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ category: mapCategory(category) });
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
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = categoryConfiguratorSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid category input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const patternIds = uniqueIds(body.patternIds);
  const colorIds = uniqueIds(body.colorIds);

  const [existing, duplicate, optionError] = await Promise.all([
    prisma.category.findUnique({
      where: { id: idParsed.data },
      select: { id: true },
    }),
    prisma.category.findFirst({
      where: {
        NOT: { id: idParsed.data },
        name: {
          equals: body.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
    validateOptionIds(patternIds, colorIds),
  ]);

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (duplicate) {
    return NextResponse.json(
      { error: "Another category already uses this name" },
      { status: 409 }
    );
  }

  if (optionError) {
    return NextResponse.json({ error: optionError }, { status: 400 });
  }

  const category = await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id: idParsed.data },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      },
    });

    await tx.categoryPattern.deleteMany({
      where: { categoryId: idParsed.data },
    });
    await tx.categoryColor.deleteMany({
      where: { categoryId: idParsed.data },
    });

    if (patternIds.length > 0) {
      await tx.categoryPattern.createMany({
        data: patternIds.map((patternId) => ({
          categoryId: idParsed.data,
          patternId,
        })),
        skipDuplicates: true,
      });
    }

    if (colorIds.length > 0) {
      await tx.categoryColor.createMany({
        data: colorIds.map((colorId) => ({
          categoryId: idParsed.data,
          colorId,
        })),
        skipDuplicates: true,
      });
    }

    return tx.category.findUnique({
      where: { id: idParsed.data },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        categoryPatterns: {
          orderBy: { createdAt: "asc" },
          select: {
            patternId: true,
            pattern: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
          },
        },
        categoryColors: {
          orderBy: { createdAt: "asc" },
          select: {
            colorId: true,
            color: {
              select: {
                id: true,
                name: true,
                code: true,
                hex: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            categoryPatterns: true,
            categoryColors: true,
          },
        },
      },
    });
  });

  return NextResponse.json({ ok: true, category: mapCategory(category) });
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
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category._count.products > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete category because it is still used by products",
      },
      { status: 400 }
    );
  }

  await prisma.category.delete({
    where: { id: idParsed.data },
  });

  return NextResponse.json({ ok: true });
}
