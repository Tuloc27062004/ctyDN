import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  productInputSchema,
  zodFieldErrors,
} from "@/lib/validators";

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
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

const productSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  priority: true,
  minPrice: true,
  maxPrice: true,
  defaultPatternId: true,
  defaultColorId: true,
  createdAt: true,
  updatedAt: true,
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
  productPatterns: {
    orderBy: { createdAt: "asc" as const },
    select: {
      patternId: true,
      pattern: {
        select: {
          id: true,
          name: true,
          code: true,
          textureUrl: true,
          defaultScale: true,
          defaultOpacity: true,
          isActive: true,
        },
      },
    },
  },
  productColors: {
    orderBy: { createdAt: "asc" as const },
    select: {
      colorId: true,
      color: {
        select: {
          id: true,
          name: true,
          code: true,
          hex: true,
          swatchUrl: true,
          isActive: true,
        },
      },
    },
  },
  renderAssets: {
    orderBy: [{ isDefault: "desc" as const }, { createdAt: "asc" as const }],
    select: {
      id: true,
      viewCode: true,
      baseImageUrl: true,
      maskImageUrl: true,
      shadowImageUrl: true,
      highlightImageUrl: true,
      width: true,
      height: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  models3d: {
    orderBy: [{ isDefault: "desc" as const }, { createdAt: "desc" as const }],
    select: {
      id: true,
      provider: true,
      status: true,
      sourceImageUrl: true,
      sourceImageName: true,
      previewImageUrl: true,
      tripoTaskId: true,
      modelVersion: true,
      faceLimit: true,
      textureEnabled: true,
      pbrEnabled: true,
      exportUv: true,
      orientation: true,
      textureAlignment: true,
      modelGlbUrl: true,
      baseModelGlbUrl: true,
      pbrModelGlbUrl: true,
      errorMessage: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  images: {
    orderBy: [{ isRender: "desc" as const }, { createdAt: "desc" as const }],
    select: {
      id: true,
      url: true,
      description: true,
      isRender: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      cartItems: true,
      productPatterns: true,
      productColors: true,
      renderAssets: true,
      models3d: true,
    },
  },
};

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
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const id = idParsed.data;

  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
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
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const id = idParsed.data;

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

  const exists = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const duplicate = await prisma.product.findFirst({
    where: {
      NOT: { id },
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Another product already uses this name" },
      { status: 409 }
    );
  }

  const validation = await validateConfiguratorInput(input);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
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
      });

      await tx.productCategory.deleteMany({ where: { productId: id } });
      await tx.productPattern.deleteMany({ where: { productId: id } });
      await tx.productColor.deleteMany({ where: { productId: id } });

      if (validation.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: validation.categoryIds.map((categoryId) => ({
            productId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.patternIds.length > 0) {
        await tx.productPattern.createMany({
          data: validation.patternIds.map((patternId) => ({
            productId: id,
            patternId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.colorIds.length > 0) {
        await tx.productColor.createMany({
          data: validation.colorIds.map((colorId) => ({
            productId: id,
            colorId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.product.findUnique({
        where: { id },
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

    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
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
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const id = idParsed.data;

  const exists = await prisma.product.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({ ok: true, softDeleted: true, product });
  } catch {
    return NextResponse.json(
      { error: "Failed to deactivate product" },
      { status: 500 }
    );
  }
}