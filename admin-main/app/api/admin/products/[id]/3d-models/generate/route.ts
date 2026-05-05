import { Model3DProvider, Model3DStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  product3DGenerateRequestSchema,
  zodFieldErrors,
} from "@/lib/validators";
import { createTripoImageToModelTask } from "@/lib/tripo";

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export const runtime = "nodejs";

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

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = product3DGenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid 3D generate input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const productId = productIdParsed.data;
  const input = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const createdModel = await prisma.$transaction(async (tx) => {
    await tx.product3DModel.updateMany({
      where: { productId },
      data: { isDefault: false },
    });

    return tx.product3DModel.create({
      data: {
        productId,
        provider: Model3DProvider.TRIPO,
        status: Model3DStatus.PROCESSING,
        sourceImageUrl: input.sourceImageUrl,
        sourceImageName: input.sourceImageName ?? null,
        modelVersion: input.modelVersion,
        faceLimit: input.faceLimit,
        textureEnabled: input.textureEnabled,
        pbrEnabled: input.pbrEnabled,
        exportUv: input.exportUv,
        orientation: input.orientation,
        textureAlignment: input.textureAlignment,
        previewImageUrl: input.sourceImageUrl,
        isDefault: true,
      },
      select: {
        id: true,
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
    });
  });

  try {
    const tripo = await createTripoImageToModelTask({
      sourceImageUrl: input.sourceImageUrl,
      sourceImageName: input.sourceImageName,
      modelVersion: input.modelVersion,
      faceLimit: input.faceLimit,
      textureEnabled: input.textureEnabled,
      pbrEnabled: input.pbrEnabled,
      exportUv: input.exportUv,
      orientation: input.orientation,
      textureAlignment: input.textureAlignment,
    });

    const model = await prisma.product3DModel.update({
      where: { id: createdModel.id },
      data: {
        tripoTaskId: tripo.taskId,
        status: Model3DStatus.PROCESSING,
        errorMessage: null,
      },
      select: {
        id: true,
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
    });

    return NextResponse.json({ ok: true, model }, { status: 201 });
  } catch (error) {
    const model = await prisma.product3DModel.update({
      where: { id: createdModel.id },
      data: {
        status: Model3DStatus.FAILED,
        errorMessage:
          error instanceof Error ? error.message : "Không tạo được task Tripo",
      },
      select: {
        id: true,
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
    });

    return NextResponse.json(
      {
        error: model.errorMessage || "Không tạo được task Tripo",
        model,
      },
      { status: 502 }
    );
  }
}
