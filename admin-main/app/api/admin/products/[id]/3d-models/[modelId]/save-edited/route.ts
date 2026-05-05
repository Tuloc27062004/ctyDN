import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { Model3DStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { cuidSchema } from "@/lib/validators";

export const runtime = "nodejs";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function getParams(
  params:
    | Promise<{ id: string; modelId: string }>
    | { id: string; modelId: string }
): Promise<{ id: string; modelId: string }> {
  return Promise.resolve(params);
}

export async function POST(
  req: Request,
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

  const formData = await req.formData();
  const file = formData.get("file");
  const setDefault = formData.get("setDefault") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No GLB file uploaded" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".glb")) {
    return NextResponse.json({ error: "Only .glb files are supported" }, { status: 400 });
  }

  const originalModel = await prisma.product3DModel.findFirst({
    where: {
      id: modelId,
      productId,
    },
    select: {
      id: true,
      productId: true,
      provider: true,
      sourceImageUrl: true,
      sourceImageName: true,
      previewImageUrl: true,
      modelVersion: true,
      faceLimit: true,
      textureEnabled: true,
      pbrEnabled: true,
      exportUv: true,
      orientation: true,
      textureAlignment: true,
    },
  });

  if (!originalModel) {
    return NextResponse.json({ error: "Original 3D model not found" }, { status: 404 });
  }

  const pathname = [
    "products",
    productId,
    "models3d",
    "edited",
    `${Date.now()}-${randomUUID()}-${safeFileName(file.name)}`,
  ].join("/");

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: "model/gltf-binary",
    });

    const model = await prisma.$transaction(async (tx) => {
      if (setDefault) {
        await tx.product3DModel.updateMany({
          where: { productId },
          data: { isDefault: false },
        });
      }

      return tx.product3DModel.create({
        data: {
          productId,
          provider: originalModel.provider,
          status: Model3DStatus.READY,
          sourceImageUrl: originalModel.sourceImageUrl,
          sourceImageName: originalModel.sourceImageName,
          previewImageUrl: originalModel.previewImageUrl,
          tripoTaskId: null,
          modelVersion: originalModel.modelVersion,
          faceLimit: originalModel.faceLimit,
          textureEnabled: originalModel.textureEnabled,
          pbrEnabled: originalModel.pbrEnabled,
          exportUv: originalModel.exportUv,
          orientation: originalModel.orientation,
          textureAlignment: originalModel.textureAlignment,
          modelGlbUrl: blob.url,
          modelGlbPath: blob.pathname,
          baseModelGlbUrl: null,
          baseModelGlbPath: null,
          pbrModelGlbUrl: null,
          pbrModelGlbPath: null,
          errorMessage: null,
          isDefault: setDefault,
        },
        select: {
          id: true,
          productId: true,
          status: true,
          modelGlbUrl: true,
          modelGlbPath: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json({ ok: true, model }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save edited GLB" },
      { status: 500 }
    );
  }
}