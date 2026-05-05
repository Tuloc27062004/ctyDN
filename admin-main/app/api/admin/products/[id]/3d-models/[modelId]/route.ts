import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { cuidSchema } from "@/lib/validators";

async function getParams(
  params:
    | Promise<{ id: string; modelId: string }>
    | { id: string; modelId: string }
): Promise<{ id: string; modelId: string }> {
  return Promise.resolve(params);
}

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: {
    params:
      | Promise<{ id: string; modelId: string }>
      | { id: string; modelId: string };
  }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const { id: rawProductId, modelId: rawModelId } = await getParams(ctx.params);
  const productIdParsed = cuidSchema.safeParse(rawProductId);
  const modelIdParsed = cuidSchema.safeParse(rawModelId);

  if (!productIdParsed.success || !modelIdParsed.success) {
    return NextResponse.json({ error: "Invalid product/model id" }, { status: 400 });
  }

  const productId = productIdParsed.data;
  const modelId = modelIdParsed.data;

  const model = await prisma.product3DModel.findFirst({
    where: {
      id: modelId,
      productId,
    },
    select: {
      id: true,
      productId: true,
      isDefault: true,
      modelGlbUrl: true,
      baseModelGlbUrl: true,
      pbrModelGlbUrl: true,
    },
  });

  if (!model) {
    return NextResponse.json({ error: "3D model not found" }, { status: 404 });
  }

  const urlsToDelete = [model.modelGlbUrl, model.baseModelGlbUrl, model.pbrModelGlbUrl].filter(
    (value): value is string => Boolean(value)
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product3DModel.delete({
        where: { id: modelId },
      });

      if (model.isDefault) {
        const fallback = await tx.product3DModel.findFirst({
          where: { productId },
          orderBy: [{ createdAt: "desc" }],
          select: { id: true },
        });

        if (fallback) {
          await tx.product3DModel.update({
            where: { id: fallback.id },
            data: { isDefault: true },
          });
        }
      }
    });

    if (urlsToDelete.length > 0) {
      await del(urlsToDelete).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete 3D model" },
      { status: 500 }
    );
  }
}
