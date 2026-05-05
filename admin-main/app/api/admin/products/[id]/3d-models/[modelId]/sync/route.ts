import { Model3DStatus } from "@prisma/client";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  product3DModelSyncRequestSchema,
  zodFieldErrors,
} from "@/lib/validators";
import {
  extractTripoAssets,
  extractTripoError,
  extractTripoStatus,
  getTripoTask,
} from "@/lib/tripo";
import { createBlobPath, uploadRemoteFileToBlob } from "@/lib/blob-storage";

function nonEmpty(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isHttpUrl(value: string | null | undefined): value is string {
  const v = nonEmpty(value);
  return v !== null && /^https?:\/\//i.test(v);
}

const DEBUG_SYNC = true;

function debugLog(message: string, payload?: unknown) {
  if (!DEBUG_SYNC) return;
  if (payload !== undefined) {
    console.log(`[admin sync 3d-model] ${message}`, payload);
    return;
  }
  console.log(`[admin sync 3d-model] ${message}`);
}

function debugWarn(message: string, payload?: unknown) {
  if (!DEBUG_SYNC) return;
  if (payload !== undefined) {
    console.warn(`[admin sync 3d-model] ${message}`, payload);
    return;
  }
  console.warn(`[admin sync 3d-model] ${message}`);
}

function debugError(message: string, payload?: unknown) {
  if (!DEBUG_SYNC) return;
  if (payload !== undefined) {
    console.error(`[admin sync 3d-model] ${message}`, payload);
    return;
  }
  console.error(`[admin sync 3d-model] ${message}`);
}

async function getParams(
  params:
    | Promise<{ id: string; modelId: string }>
    | { id: string; modelId: string }
): Promise<{ id: string; modelId: string }> {
  return Promise.resolve(params);
}

function selectModel() {
  return {
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
  } as const;
}

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: {
    params:
      | Promise<{ id: string; modelId: string }>
      | { id: string; modelId: string };
  }
) {
  debugLog("POST:start");

  const guard = await requireAdmin();

  if (!guard.ok) {
    debugWarn("POST:auth-failed", {
      status: guard.status,
    });

    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const { id: rawProductId, modelId: rawModelId } = await getParams(ctx.params);

  debugLog("POST:raw-params", {
    rawProductId,
    rawModelId,
  });

  const productIdParsed = cuidSchema.safeParse(rawProductId);
  const modelIdParsed = cuidSchema.safeParse(rawModelId);

  if (!productIdParsed.success || !modelIdParsed.success) {
    debugWarn("POST:invalid-params", {
      rawProductId,
      rawModelId,
      productIdParseSuccess: productIdParsed.success,
      modelIdParseSuccess: modelIdParsed.success,
    });

    return NextResponse.json({ error: "Invalid product/model id" }, { status: 400 });
  }

  let body: unknown = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
    debugLog("POST:parsed-body", body);
  } catch (error) {
    debugError("POST:invalid-json-body", error);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = product3DModelSyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = zodFieldErrors(parsed.error);

    debugWarn("POST:validation-failed", {
      body,
      fieldErrors,
    });

    return NextResponse.json(
      {
        error: "Invalid 3D sync input",
        fieldErrors,
      },
      { status: 400 }
    );
  }

  const productId = productIdParsed.data;
  const modelId = modelIdParsed.data;

  debugLog("POST:validated-params", {
    productId,
    modelId,
  });

  const model = await prisma.product3DModel.findFirst({
    where: {
      id: modelId,
      productId,
    },
    select: {
      id: true,
      productId: true,
      sourceImageUrl: true,
      sourceImageName: true,
      tripoTaskId: true,
      modelGlbUrl: true,
      baseModelGlbUrl: true,
      pbrModelGlbUrl: true,
      isDefault: true,
    },
  });

  debugLog("POST:db-model", model);

  if (!model) {
    debugWarn("POST:model-not-found", {
      productId,
      modelId,
    });

    return NextResponse.json({ error: "3D model not found" }, { status: 404 });
  }

  if (!model.tripoTaskId) {
    debugWarn("POST:model-missing-tripoTaskId", {
      productId,
      modelId,
      model,
    });

    return NextResponse.json(
      { error: "Model này chưa có tripoTaskId để đồng bộ" },
      { status: 400 }
    );
  }

  try {
    debugLog("POST:getTripoTask:start", {
      tripoTaskId: model.tripoTaskId,
    });

    const task = await getTripoTask(model.tripoTaskId);
    const status = extractTripoStatus(task);
    const taskError = extractTripoError(task);

    debugLog("POST:getTripoTask:result", {
      tripoTaskId: model.tripoTaskId,
      status,
      taskError,
      task,
    });

    if (!status || ["queued", "waiting", "pending", "running", "processing"].includes(status)) {
      const updated = await prisma.product3DModel.update({
        where: { id: modelId },
        data: {
          status: Model3DStatus.PROCESSING,
          errorMessage: null,
        },
        select: selectModel(),
      });

      debugLog("POST:model-still-processing", {
        productId,
        modelId,
        updated,
      });

      return NextResponse.json({
        ok: true,
        state: "processing",
        model: updated,
      });
    }

    if (["failed", "error"].includes(status)) {
      const updated = await prisma.product3DModel.update({
        where: { id: modelId },
        data: {
          status: Model3DStatus.FAILED,
          errorMessage: taskError ?? "Task Tripo thất bại",
        },
        select: selectModel(),
      });

      debugWarn("POST:tripo-failed", {
        productId,
        modelId,
        status,
        updated,
      });

      return NextResponse.json(
        {
          error: updated.errorMessage || "Task Tripo thất bại",
          model: updated,
        },
        { status: 502 }
      );
    }

    const assets = extractTripoAssets(task);

    debugLog("POST:extractTripoAssets", {
      productId,
      modelId,
      assets,
    });

    const pbrUrl = isHttpUrl(assets.pbrModelGlbUrl) ? assets.pbrModelGlbUrl : null;
    const modelUrl = isHttpUrl(assets.modelGlbUrl) ? assets.modelGlbUrl : null;
    const baseUrl = isHttpUrl(assets.baseModelGlbUrl) ? assets.baseModelGlbUrl : null;

    const primaryModelUrl = pbrUrl ?? modelUrl ?? baseUrl;

    const primaryModelSource = pbrUrl
      ? "pbrModelGlbUrl"
      : modelUrl
      ? "modelGlbUrl"
      : baseUrl
      ? "baseModelGlbUrl"
      : null;

    debugLog("POST:primary-model-selection", {
      productId,
      modelId,
      primaryModelUrl,
      primaryModelSource,
      rawAssetUrls: {
        pbrModelGlbUrl: assets.pbrModelGlbUrl ?? null,
        modelGlbUrl: assets.modelGlbUrl ?? null,
        baseModelGlbUrl: assets.baseModelGlbUrl ?? null,
        previewImageUrl: assets.previewImageUrl ?? null,
      },
    });

    if (!primaryModelUrl) {
      const updated = await prisma.product3DModel.update({
        where: { id: modelId },
        data: {
          status: Model3DStatus.FAILED,
          errorMessage: "Task Tripo đã hoàn thành nhưng không tìm thấy URL model GLB/glTF",
        },
        select: selectModel(),
      });

      debugError("POST:no-primary-model-url", {
        productId,
        modelId,
        assets,
        updated,
      });

      return NextResponse.json(
        {
          error: updated.errorMessage,
          model: updated,
        },
        { status: 502 }
      );
    }

    const basePathPrefix = createBlobPath([
      "products",
      productId,
      "3d-models",
      modelId,
    ]);

    debugLog("POST:blob-base-path", {
      productId,
      modelId,
      basePathPrefix,
    });

    const uploadPrimary = await uploadRemoteFileToBlob({
      remoteUrl: primaryModelUrl,
      pathnamePrefix: basePathPrefix,
      preferredFileName: "model.glb",
    });

    debugLog("POST:uploadPrimary:result", {
      productId,
      modelId,
      uploadPrimary,
    });

    const uploadBase = baseUrl
      ? await uploadRemoteFileToBlob({
          remoteUrl: baseUrl,
          pathnamePrefix: basePathPrefix,
          preferredFileName: "base-model.glb",
        }).catch((error) => {
          debugError("POST:uploadBase:failed", {
            productId,
            modelId,
            remoteUrl: baseUrl,
            error,
          });
          return null;
        })
      : null;

    debugLog("POST:uploadBase:result", {
      productId,
      modelId,
      uploadBase,
    });

    const uploadPbr = pbrUrl
      ? await uploadRemoteFileToBlob({
          remoteUrl: pbrUrl,
          pathnamePrefix: basePathPrefix,
          preferredFileName: "pbr-model.glb",
        }).catch((error) => {
          debugError("POST:uploadPbr:failed", {
            productId,
            modelId,
            remoteUrl: pbrUrl,
            error,
          });
          return null;
        })
      : null;

    debugLog("POST:uploadPbr:result", {
      productId,
      modelId,
      uploadPbr,
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.product3DModel.updateMany({
        where: {
          productId,
          NOT: { id: modelId },
        },
        data: { isDefault: false },
      });

      return tx.product3DModel.update({
        where: { id: modelId },
        data: {
          status: Model3DStatus.READY,
          errorMessage: null,
          previewImageUrl: assets.previewImageUrl ?? undefined,
          modelGlbUrl: uploadPrimary.url,
          modelGlbPath: uploadPrimary.pathname ?? undefined,
          baseModelGlbUrl: uploadBase?.url ?? undefined,
          baseModelGlbPath: uploadBase?.pathname ?? undefined,
          pbrModelGlbUrl: uploadPbr?.url ?? undefined,
          pbrModelGlbPath: uploadPbr?.pathname ?? undefined,
          isDefault: true,
        },
        select: selectModel(),
      });
    });

    debugLog("POST:transaction-updated-model", {
      productId,
      modelId,
      updated,
    });

    const newUrls = new Set(
      [uploadPrimary.url, uploadBase?.url, uploadPbr?.url].filter(
        (value): value is string => Boolean(value)
      )
    );
    const staleUrls = [
      model.modelGlbUrl,
      model.baseModelGlbUrl,
      model.pbrModelGlbUrl,
    ].filter(
      (value): value is string => Boolean(value) && !newUrls.has(value as string)
    );

    if (staleUrls.length > 0) {
      try {
        await del(staleUrls);
        debugLog("POST:stale-blobs-deleted", { productId, modelId, staleUrls });
      } catch (error) {
        debugError("POST:stale-blobs-delete-failed", {
          productId,
          modelId,
          staleUrls,
          error,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      state: "ready",
      model: updated,
    });
  } catch (error) {
    debugError("POST:unexpected-error", {
      productId,
      modelId,
      error,
    });

    const updated = await prisma.product3DModel.update({
      where: { id: modelId },
      data: {
        status: Model3DStatus.FAILED,
        errorMessage:
          error instanceof Error ? error.message : "Đồng bộ model 3D thất bại",
      },
      select: selectModel(),
    });

    debugError("POST:updated-model-after-error", {
      productId,
      modelId,
      updated,
    });

    return NextResponse.json(
      {
        error: updated.errorMessage || "Đồng bộ model 3D thất bại",
        model: updated,
      },
      { status: 500 }
    );
  }
}
