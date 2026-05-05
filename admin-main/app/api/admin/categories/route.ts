import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  categoryConfiguratorSchema,
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

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
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

  return NextResponse.json({ categories: categories.map(mapCategory) });
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

  const [existing, optionError] = await Promise.all([
    prisma.category.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
    validateOptionIds(patternIds, colorIds),
  ]);

  if (existing) {
    return NextResponse.json(
      { error: "Category name already exists" },
      { status: 409 }
    );
  }

  if (optionError) {
    return NextResponse.json({ error: optionError }, { status: 400 });
  }

  const category = await prisma.$transaction(async (tx) => {
    const created = await tx.category.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      },
      select: { id: true },
    });

    if (patternIds.length > 0) {
      await tx.categoryPattern.createMany({
        data: patternIds.map((patternId) => ({
          categoryId: created.id,
          patternId,
        })),
        skipDuplicates: true,
      });
    }

    if (colorIds.length > 0) {
      await tx.categoryColor.createMany({
        data: colorIds.map((colorId) => ({
          categoryId: created.id,
          colorId,
        })),
        skipDuplicates: true,
      });
    }

    const fullCategory = await tx.category.findUnique({
      where: { id: created.id },
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

    return fullCategory;
  });

  return NextResponse.json({ ok: true, category: mapCategory(category) });
}
