import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { productInputSchema, zodFieldErrors } from "@/lib/validators";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

type ProductSort =
  | "priority_desc"
  | "priority_asc"
  | "created_desc"
  | "created_asc"
  | "cart_users_desc"
  | "cart_users_asc";

function parseSort(value: string | null): ProductSort {
  switch (value) {
    case "priority_asc":
    case "created_desc":
    case "created_asc":
    case "cart_users_desc":
    case "cart_users_asc":
      return value;
    case "priority_desc":
    default:
      return "priority_desc";
  }
}

function getProductOrderBy(
  sort: ProductSort
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "priority_asc":
      return [{ priority: "asc" }, { createdAt: "desc" }];
    case "created_desc":
      return [{ createdAt: "desc" }];
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "cart_users_desc":
      return [{ cartItems: { _count: "desc" } }, { createdAt: "desc" }];
    case "cart_users_asc":
      return [{ cartItems: { _count: "asc" } }, { createdAt: "desc" }];
    case "priority_desc":
    default:
      return [{ priority: "desc" }, { createdAt: "desc" }];
  }
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)].filter(Boolean);
}

async function validateConfiguratorInput(input: {
  categoryIds: string[];
  patternIds: string[];
  colorIds: string[];
  defaultPatternId?: string | null;
  defaultColorId?: string | null;
}) {
  const categoryIds = uniqueIds(input.categoryIds);
  const patternIds = uniqueIds(input.patternIds);
  const colorIds = uniqueIds(input.colorIds);

  const [categoryCount, patternCount, colorCount] = await Promise.all([
    categoryIds.length > 0
      ? prisma.category.count({ where: { id: { in: categoryIds } } })
      : Promise.resolve(0),
    patternIds.length > 0
      ? prisma.pattern.count({ where: { id: { in: patternIds } } })
      : Promise.resolve(0),
    colorIds.length > 0
      ? prisma.color.count({ where: { id: { in: colorIds } } })
      : Promise.resolve(0),
  ]);

  if (categoryIds.length > 0 && categoryCount !== categoryIds.length) {
    return { ok: false as const, error: "One or more selected categories do not exist" };
  }

  if (patternIds.length > 0 && patternCount !== patternIds.length) {
    return { ok: false as const, error: "One or more selected patterns do not exist" };
  }

  if (colorIds.length > 0 && colorCount !== colorIds.length) {
    return { ok: false as const, error: "One or more selected colors do not exist" };
  }

  if (input.defaultPatternId && !patternIds.includes(input.defaultPatternId)) {
    return { ok: false as const, error: "Default pattern must be selected from patternIds" };
  }

  if (input.defaultColorId && !colorIds.includes(input.defaultColorId)) {
    return { ok: false as const, error: "Default color must be selected from colorIds" };
  }

  return {
    ok: true as const,
    categoryIds,
    patternIds,
    colorIds,
  };
}

export async function GET(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const url = new URL(req.url);
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInt(url.searchParams.get("pageSize"), 20),
    100
  );
  const q = url.searchParams.get("q")?.trim() || "";
  const rawIsActive = url.searchParams.get("isActive");
  const categoryId = url.searchParams.get("categoryId")?.trim() || "";
  const sort = parseSort(url.searchParams.get("sort"));

  let isActive: boolean | undefined;
  if (rawIsActive === "true") isActive = true;
  if (rawIsActive === "false") isActive = false;

  const where: Prisma.ProductWhereInput = {
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(categoryId
      ? {
          categories: {
            some: {
              categoryId,
            },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            {
              categories: {
                some: {
                  category: {
                    name: { contains: q, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  try {
    const [totalItems, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: getProductOrderBy(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          priority: true,
          minPrice: true,
          maxPrice: true,
          createdAt: true,
          updatedAt: true,
          defaultPatternId: true,
          defaultColorId: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              images: true,
              cartItems: true,
              productPatterns: true,
              productColors: true,
              renderAssets: true,
              models3d: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      filters: {
        sort,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
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

  const parsed = productInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid product input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const validation = await validateConfiguratorInput(input);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const duplicate = await prisma.product.findFirst({
    where: {
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "A product with this name already exists" },
      { status: 409 }
    );
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
          priority: input.priority,
          minPrice: input.minPrice ?? null,
          maxPrice: input.maxPrice ?? null,
          defaultPatternId: input.defaultPatternId ?? null,
          defaultColorId: input.defaultColorId ?? null,
        },
        select: { id: true },
      });

      if (validation.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: validation.categoryIds.map((categoryId) => ({
            productId: created.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.patternIds.length > 0) {
        await tx.productPattern.createMany({
          data: validation.patternIds.map((patternId) => ({
            productId: created.id,
            patternId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.colorIds.length > 0) {
        await tx.productColor.createMany({
          data: validation.colorIds.map((colorId) => ({
            productId: created.id,
            colorId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.product.findUnique({
        where: { id: created.id },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          priority: true,
          minPrice: true,
          maxPrice: true,
          defaultPatternId: true,
          defaultColorId: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              productPatterns: true,
              productColors: true,
              renderAssets: true,
              models3d: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}