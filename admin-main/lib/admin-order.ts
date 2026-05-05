import { Model3DStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminOrderItemInput = {
  productId: string;
  patternId?: string | null;
  colorId?: string | null;
  model3dId?: string | null;
  quantity: number;
};

function normalizeOptionalId(value?: string | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

export function buildAdminOrderItemKey(item: {
  productId: string;
  patternId?: string | null;
  colorId?: string | null;
  model3dId?: string | null;
}) {
  return [
    item.productId,
    normalizeOptionalId(item.patternId) ?? "-",
    normalizeOptionalId(item.colorId) ?? "-",
    normalizeOptionalId(item.model3dId) ?? "-",
  ].join("::");
}

export const adminOrderProductOptionSelect = {
  id: true,
  name: true,
  defaultPatternId: true,
  defaultColorId: true,
  productPatterns: {
    orderBy: { createdAt: "asc" as const },
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
          isActive: true,
        },
      },
    },
  },
  models3d: {
    orderBy: [{ isDefault: "desc" as const }, { createdAt: "desc" as const }],
    select: {
      id: true,
      status: true,
      provider: true,
      previewImageUrl: true,
      modelGlbUrl: true,
      baseModelGlbUrl: true,
      pbrModelGlbUrl: true,
      isDefault: true,
      sourceImageName: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ProductSelect;

const adminOrderPreparationProductSelect = {
  ...adminOrderProductOptionSelect,
  isActive: true,
  images: {
    orderBy: [{ isRender: "desc" as const }, { createdAt: "desc" as const }],
    select: {
      id: true,
      url: true,
      isRender: true,
    },
  },
} satisfies Prisma.ProductSelect;

type AdminOrderPreparationProduct = Prisma.ProductGetPayload<{
  select: typeof adminOrderPreparationProductSelect;
}>;

function getDefaultReadyModel(product: AdminOrderPreparationProduct) {
  return product.models3d.find((model) => model.status === Model3DStatus.READY) ?? null;
}

function getPrimaryPreviewImage(product: AdminOrderPreparationProduct) {
  return product.images[0]?.url ?? null;
}

export async function getAdminOrderProductOptions() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }],
    select: adminOrderProductOptionSelect,
  });
}

export async function prepareAdminOrderItems(items: AdminOrderItemInput[]) {
  const uniqueProductIds = [...new Set(items.map((item) => item.productId))].filter(Boolean);

  const products = await prisma.product.findMany({
    where: {
      id: { in: uniqueProductIds },
      isActive: true,
    },
    select: adminOrderPreparationProductSelect,
  });

  if (products.length !== uniqueProductIds.length) {
    throw new Error("One or more selected products do not exist or are inactive");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product || !product.isActive) {
      throw new Error("One or more selected products do not exist or are inactive");
    }

    const resolvedPatternId =
      normalizeOptionalId(item.patternId) ?? normalizeOptionalId(product.defaultPatternId);
    const resolvedColorId =
      normalizeOptionalId(item.colorId) ?? normalizeOptionalId(product.defaultColorId);
    const defaultReadyModel = getDefaultReadyModel(product);
    const resolvedModelId =
      normalizeOptionalId(item.model3dId) ?? normalizeOptionalId(defaultReadyModel?.id);

    const patternLink = resolvedPatternId
      ? product.productPatterns.find((entry) => entry.patternId === resolvedPatternId)
      : null;
    const colorLink = resolvedColorId
      ? product.productColors.find((entry) => entry.colorId === resolvedColorId)
      : null;
    const model = resolvedModelId
      ? product.models3d.find((entry) => entry.id === resolvedModelId)
      : null;

    if (resolvedPatternId && (!patternLink || !patternLink.pattern.isActive)) {
      throw new Error(`Selected pattern is invalid for product \"${product.name}\"`);
    }

    if (resolvedColorId && (!colorLink || !colorLink.color.isActive)) {
      throw new Error(`Selected color is invalid for product \"${product.name}\"`);
    }

    if (resolvedModelId && !model) {
      throw new Error(`Selected 3D model is invalid for product \"${product.name}\"`);
    }

    if (model && model.status !== Model3DStatus.READY) {
      throw new Error(`Selected 3D model for product \"${product.name}\" is not READY yet`);
    }

    const previewImageSnapshot = getPrimaryPreviewImage(product) ?? model?.previewImageUrl ?? null;
    const modelGlbUrlSnapshot =
      model?.modelGlbUrl ?? model?.pbrModelGlbUrl ?? model?.baseModelGlbUrl ?? null;

    return {
      productId: product.id,
      patternId: patternLink?.patternId ?? null,
      colorId: colorLink?.colorId ?? null,
      quantity: item.quantity,
      patternNameSnapshot: patternLink?.pattern.name ?? null,
      colorNameSnapshot: colorLink?.color.name ?? null,
      previewImageSnapshot,
      patternCodeSnapshot: patternLink?.pattern.code ?? null,
      colorCodeSnapshot: colorLink?.color.code ?? null,
      colorHexSnapshot: colorLink?.color.hex ?? null,
      model3dIdSnapshot: model?.id ?? null,
      modelPreviewImageSnapshot: model?.previewImageUrl ?? null,
      modelGlbUrlSnapshot,
    };
  });
}
