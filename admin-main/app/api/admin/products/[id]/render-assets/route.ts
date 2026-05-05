import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  renderAssetInputSchema,
  zodFieldErrors,
} from "@/lib/validators";
import { z } from "zod";

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

const updateSchema = renderAssetInputSchema.extend({
  id: cuidSchema,
});

const deleteSchema = z.object({
  id: cuidSchema,
});

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

  const renderAssets = await prisma.productRenderAsset.findMany({
    where: { productId: idParsed.data },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ renderAssets });
}

export async function POST(
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

  const rawProductId = await getId(ctx.params);
  const productIdParsed = cuidSchema.safeParse(rawProductId);

  if (!productIdParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = renderAssetInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid render asset input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productIdParsed.data },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const currentCount = await prisma.productRenderAsset.count({
    where: { productId: productIdParsed.data },
  });

  const asset = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault || currentCount === 0) {
      await tx.productRenderAsset.updateMany({
        where: { productId: productIdParsed.data },
        data: { isDefault: false },
      });
    }

    return tx.productRenderAsset.create({
      data: {
        productId: productIdParsed.data,
        viewCode: parsed.data.viewCode,
        baseImageUrl: parsed.data.baseImageUrl,
        maskImageUrl: parsed.data.maskImageUrl,
        shadowImageUrl: parsed.data.shadowImageUrl,
        highlightImageUrl: parsed.data.highlightImageUrl,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        isDefault: parsed.data.isDefault || currentCount === 0,
      },
    });
  });

  return NextResponse.json({ ok: true, renderAsset: asset }, { status: 201 });
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

  const rawProductId = await getId(ctx.params);
  const productIdParsed = cuidSchema.safeParse(rawProductId);

  if (!productIdParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid render asset input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const existing = await prisma.productRenderAsset.findFirst({
    where: {
      id: parsed.data.id,
      productId: productIdParsed.data,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Render asset not found" }, { status: 404 });
  }

  const asset = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.productRenderAsset.updateMany({
        where: {
          productId: productIdParsed.data,
          NOT: { id: parsed.data.id },
        },
        data: { isDefault: false },
      });
    }

    return tx.productRenderAsset.update({
      where: { id: parsed.data.id },
      data: {
        viewCode: parsed.data.viewCode,
        baseImageUrl: parsed.data.baseImageUrl,
        maskImageUrl: parsed.data.maskImageUrl,
        shadowImageUrl: parsed.data.shadowImageUrl,
        highlightImageUrl: parsed.data.highlightImageUrl,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        isDefault: parsed.data.isDefault,
      },
    });
  });

  return NextResponse.json({ ok: true, renderAsset: asset });
}

export async function DELETE(
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

  const rawProductId = await getId(ctx.params);
  const productIdParsed = cuidSchema.safeParse(rawProductId);

  if (!productIdParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid render asset delete payload",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const existing = await prisma.productRenderAsset.findFirst({
    where: {
      id: parsed.data.id,
      productId: productIdParsed.data,
    },
    select: { id: true, isDefault: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Render asset not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.productRenderAsset.delete({
      where: { id: parsed.data.id },
    });

    if (existing.isDefault) {
      const nextDefault = await tx.productRenderAsset.findFirst({
        where: { productId: productIdParsed.data },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (nextDefault) {
        await tx.productRenderAsset.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
