"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Model3DStatus, Model3DProvider } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
  isAllowedProductImageType,
} from "@/lib/validators";

const Product3DViewer = dynamic(
  () =>
    import("@/components/admin/product-3d-viewer").then(
      (mod) => mod.Product3DViewer
    ),
  {
    ssr: false,
    loading: () => (
      <Card className="space-y-4 rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="text-lg font-semibold text-slate-800">
          Viewer 3D trong admin
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Đang tải trình xem 3D...
        </p>
        <div className="flex h-[480px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
          Đang tải viewer...
        </div>
      </Card>
    ),
  }
);

export type Product3DModelSummary = {
  id: string;
  provider: Model3DProvider | "TRIPO";
  status: Model3DStatus | "DRAFT" | "PROCESSING" | "READY" | "FAILED";
  sourceImageUrl: string;
  sourceImageName?: string | null;
  previewImageUrl?: string | null;
  tripoTaskId?: string | null;
  modelVersion?: string | null;
  faceLimit?: number | null;
  textureEnabled: boolean;
  pbrEnabled: boolean;
  exportUv: boolean;
  orientation?: string | null;
  textureAlignment?: string | null;
  modelGlbUrl?: string | null;
  baseModelGlbUrl?: string | null;
  pbrModelGlbUrl?: string | null;
  errorMessage?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  productId?: string;
  models: Product3DModelSummary[];
  disabled?: boolean;
  onChanged?: () => Promise<void> | void;
  selectedModelId?: string;
  onSelectedModelIdChange?: (id: string) => void;
};

type GeneratePayload = {
  sourceImageUrl: string;
  sourceImageName?: string | null;
  modelVersion: string;
  faceLimit: number;
  textureEnabled: boolean;
  pbrEnabled: boolean;
  exportUv: boolean;
  orientation: string;
  textureAlignment: string;
};

function hasPreviewableModelUrl(model: Product3DModelSummary) {
  return Boolean(
    model.pbrModelGlbUrl || model.modelGlbUrl || model.baseModelGlbUrl
  );
}

function pickInitialModelId(models: Product3DModelSummary[]) {
  return (
    models.find(
      (model) =>
        model.isDefault &&
        model.status === "READY" &&
        hasPreviewableModelUrl(model)
    )?.id ??
    models.find(
      (model) => model.status === "READY" && hasPreviewableModelUrl(model)
    )?.id ??
    models.find((model) => model.isDefault && hasPreviewableModelUrl(model))?.id ??
    models.find((model) => hasPreviewableModelUrl(model))?.id ??
    models.find((model) => model.isDefault)?.id ??
    models[0]?.id ??
    ""
  );
}

function getStatusMeta(status: Product3DModelSummary["status"]) {
  switch (status) {
    case "READY":
      return {
        label: "READY",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "FAILED":
      return {
        label: "FAILED",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    case "PROCESSING":
      return {
        label: "PROCESSING",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "DRAFT":
    default:
      return {
        label: "DRAFT",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }

  if (
    data &&
    typeof data === "object" &&
    "fieldErrors" in data &&
    typeof (data as { fieldErrors?: unknown }).fieldErrors === "object" &&
    (data as { fieldErrors?: unknown }).fieldErrors !== null
  ) {
    const fieldErrors = (data as { fieldErrors: Record<string, unknown> })
      .fieldErrors;

    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

export function Product3DModelForm({
  productId,
  models,
  disabled = false,
  onChanged,
  selectedModelId: controlledSelectedModelId,
  onSelectedModelIdChange,
}: Props) {
  const { toast } = useToast();

  const isControlled = controlledSelectedModelId !== undefined;
  const [internalSelectedModelId, setInternalSelectedModelId] =
    React.useState<string>(pickInitialModelId(models));

  const selectedModelId = isControlled
    ? controlledSelectedModelId ?? ""
    : internalSelectedModelId;

  const updateSelectedModelId = React.useCallback(
    (id: string) => {
      if (!isControlled) {
        setInternalSelectedModelId(id);
      }
      onSelectedModelIdChange?.(id);
    },
    [isControlled, onSelectedModelIdChange]
  );

  const [sourceFile, setSourceFile] = React.useState<File | null>(null);
  const [modelVersion, setModelVersion] = React.useState("P1-20260311");
  const [faceLimit, setFaceLimit] = React.useState("5000");
  const [textureEnabled, setTextureEnabled] = React.useState(true);
  const [pbrEnabled, setPbrEnabled] = React.useState(true);
  const [exportUv, setExportUv] = React.useState(true);
  const [orientation, setOrientation] = React.useState("align_image");
  const [textureAlignment, setTextureAlignment] = React.useState("geometry");
  const [busyAction, setBusyAction] = React.useState<
    null | "generate" | "sync" | "delete"
  >(null);

  React.useEffect(() => {
    const nextId = pickInitialModelId(models);
    const hasSelected = selectedModelId && models.some((item) => item.id === selectedModelId);

    if (!hasSelected && nextId !== selectedModelId) {
      updateSelectedModelId(nextId);
    }
  }, [models, selectedModelId, updateSelectedModelId]);

  const selectedModel = React.useMemo(
    () => models.find((item) => item.id === selectedModelId) ?? models[0] ?? null,
    [models, selectedModelId]
  );

  React.useEffect(() => {
    if (!selectedModel) return;

    setModelVersion(selectedModel.modelVersion || "P1-20260311");
    setFaceLimit(String(selectedModel.faceLimit ?? 5000));
    setTextureEnabled(selectedModel.textureEnabled);
    setPbrEnabled(selectedModel.pbrEnabled);
    setExportUv(selectedModel.exportUv);
    setOrientation(selectedModel.orientation || "align_image");
    setTextureAlignment(selectedModel.textureAlignment || "geometry");
  }, [selectedModel]);

  const viewerUrl =
    selectedModel?.pbrModelGlbUrl ||
    selectedModel?.modelGlbUrl ||
    selectedModel?.baseModelGlbUrl ||
    null;

  async function notifyChanged() {
    await onChanged?.();
  }

  async function uploadSourceImage(file: File) {
    if (!isAllowedProductImageType(file.type)) {
      throw new Error("Chỉ hỗ trợ file ảnh JPEG, PNG, WEBP hoặc GIF");
    }

    if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
      throw new Error(
        `Ảnh nguồn vượt quá ${Math.floor(
          PRODUCT_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)
        )}MB`
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });

    const data = await readJsonSafe(res);

    if (!res.ok) {
      throw new Error(getApiErrorMessage(data, "Không tải được ảnh nguồn lên blob"));
    }

    return {
      url: typeof data?.url === "string" ? data.url : "",
      pathname: typeof data?.pathname === "string" ? data.pathname : "",
    };
  }

  function buildGeneratePayload(
    sourceImageUrl: string,
    sourceImageName?: string | null
  ): GeneratePayload {
    const parsedFaceLimit = Number(faceLimit);

    return {
      sourceImageUrl,
      sourceImageName: sourceImageName ?? null,
      modelVersion: modelVersion.trim() || "P1-20260311",
      faceLimit:
        Number.isInteger(parsedFaceLimit) && parsedFaceLimit > 0
          ? parsedFaceLimit
          : 5000,
      textureEnabled,
      pbrEnabled,
      exportUv,
      orientation: orientation.trim() || "align_image",
      textureAlignment: textureAlignment.trim() || "geometry",
    };
  }

  async function handleGenerate(regenerate = false) {
    if (!productId) {
      toast({
        title: "Chưa thể tạo 3D",
        description: "Hãy lưu sản phẩm trước để có productId rồi mới tạo model 3D.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBusyAction("generate");

      let sourceImageUrl = selectedModel?.sourceImageUrl || "";
      let sourceImageName = selectedModel?.sourceImageName || null;

      if (sourceFile) {
        const uploaded = await uploadSourceImage(sourceFile);
        sourceImageUrl = uploaded.url;
        sourceImageName = sourceFile.name;
      }

      if (!sourceImageUrl) {
        throw new Error("Hãy chọn ảnh nguồn trước khi gửi sang Tripo");
      }

      const payload = buildGeneratePayload(sourceImageUrl, sourceImageName);
      const res = await fetch(`/api/admin/products/${productId}/3d-models/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không tạo được task 3D từ Tripo"));
      }

      setSourceFile(null);

      toast({
        title: regenerate ? "Đã tạo lại task 3D" : "Đã gửi ảnh sang Tripo",
        description:
          "Task đã được tạo ở server. Anh có thể bấm Đồng bộ kết quả sau khi Tripo xử lý xong.",
      });

      await notifyChanged();
    } catch (error) {
      toast({
        title: regenerate ? "Tạo lại thất bại" : "Tạo 3D thất bại",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra khi gọi Tripo",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSync() {
    if (!productId || !selectedModel) return;

    try {
      setBusyAction("sync");

      const res = await fetch(
        `/api/admin/products/${productId}/3d-models/${selectedModel.id}/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không đồng bộ được kết quả từ Tripo"));
      }

      const state = typeof data?.state === "string" ? data.state : "processing";

      toast({
        title: state === "ready" ? "Model 3D đã sẵn sàng" : "Task vẫn đang xử lý",
        description:
          state === "ready"
            ? "File model đã được tải về và lưu lên blob thành công."
            : "Tripo chưa hoàn tất. Anh có thể bấm Đồng bộ kết quả lại sau.",
      });

      await notifyChanged();
    } catch (error) {
      toast({
        title: "Đồng bộ thất bại",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra khi đồng bộ",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    if (!productId || !selectedModel) return;

    const ok = window.confirm("Anh có chắc muốn xóa model 3D đang chọn không?");
    if (!ok) return;

    try {
      setBusyAction("delete");

      const res = await fetch(
        `/api/admin/products/${productId}/3d-models/${selectedModel.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không xóa được model 3D"));
      }

      toast({
        title: "Đã xóa model 3D",
        description: "Bản ghi model và các file blob liên quan đã được xóa.",
      });

      await notifyChanged();
    } catch (error) {
      toast({
        title: "Xóa model thất bại",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa model",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Mô hình 3D</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Luồng mới dùng 1 ảnh nguồn để server gọi Tripo Studio, lưu task vào DB và
          đồng bộ file GLB về blob storage.
        </p>
      </div>

      {!productId ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Hãy tạo sản phẩm trước. Sau khi có product ID, trang chỉnh sửa sẽ cho phép
          tải ảnh nguồn và tạo model 3D từ Tripo.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label
              htmlFor="product-3d-source"
              className="text-base font-medium text-slate-800"
            >
              Ảnh nguồn cho dáng chậu
            </Label>
            <Input
              id="product-3d-source"
              type="file"
              accept="image/*"
              disabled={disabled || !productId || busyAction !== null}
              onChange={(e) => setSourceFile(e.target.files?.[0] ?? null)}
              className="h-12 rounded-xl text-base file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-sm leading-6 text-slate-500">
              Ảnh sẽ được tải lên blob trước, sau đó server mới gửi public URL sang
              Tripo. Tối đa {formatFileSize(PRODUCT_IMAGE_MAX_SIZE_BYTES)}.
            </p>

            {sourceFile ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Đã chọn:</span> {sourceFile.name} •{" "}
                {formatFileSize(sourceFile.size)}
              </div>
            ) : null}

            {!sourceFile && selectedModel?.sourceImageUrl ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Ảnh nguồn hiện tại:</span>{" "}
                {selectedModel.sourceImageName || selectedModel.sourceImageUrl}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-base font-medium text-slate-800">
                Model version
              </Label>
              <Input
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                disabled={disabled || busyAction !== null}
                className="h-12 rounded-xl text-base"
                placeholder="P1-20260311"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-base font-medium text-slate-800">
                Face limit
              </Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={faceLimit}
                onChange={(e) => setFaceLimit(e.target.value)}
                disabled={disabled || busyAction !== null}
                className="h-12 rounded-xl text-base"
                placeholder="5000"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-base text-slate-800">
              <input
                type="checkbox"
                checked={textureEnabled}
                onChange={(e) => setTextureEnabled(e.target.checked)}
                disabled={disabled || busyAction !== null}
                className="mt-1 h-5 w-5 rounded border-slate-300"
              />
              <span>Bật texture</span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-base text-slate-800">
              <input
                type="checkbox"
                checked={pbrEnabled}
                onChange={(e) => setPbrEnabled(e.target.checked)}
                disabled={disabled || busyAction !== null}
                className="mt-1 h-5 w-5 rounded border-slate-300"
              />
              <span>Bật PBR</span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-base text-slate-800">
              <input
                type="checkbox"
                checked={exportUv}
                onChange={(e) => setExportUv(e.target.checked)}
                disabled={disabled || busyAction !== null}
                className="mt-1 h-5 w-5 rounded border-slate-300"
              />
              <span>Export UV</span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-base font-medium text-slate-800">
                Orientation
              </Label>
              <Input
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                disabled={disabled || busyAction !== null}
                className="h-12 rounded-xl text-base"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-base font-medium text-slate-800">
                Texture alignment
              </Label>
              <Input
                value={textureAlignment}
                onChange={(e) => setTextureAlignment(e.target.value)}
                disabled={disabled || busyAction !== null}
                className="h-12 rounded-xl text-base"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={disabled || !productId || busyAction !== null}
              onClick={() => void handleGenerate(false)}
              className="h-11 rounded-xl px-5 text-base font-semibold"
            >
              {busyAction === "generate" ? "Đang gửi Tripo..." : "Tạo 3D từ Tripo"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled || !selectedModel || busyAction !== null}
              onClick={() => void handleSync()}
              className="h-11 rounded-xl px-5 text-base"
            >
              {busyAction === "sync" ? "Đang đồng bộ..." : "Đồng bộ kết quả"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={
                disabled ||
                !productId ||
                busyAction !== null ||
                (!sourceFile && !selectedModel?.sourceImageUrl)
              }
              onClick={() => void handleGenerate(true)}
              className="h-11 rounded-xl px-5 text-base"
            >
              {busyAction === "generate" ? "Đang tạo lại..." : "Tạo lại"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled || !selectedModel || busyAction !== null}
              onClick={() => void handleDelete()}
              className="h-11 rounded-xl border-red-300 px-5 text-base text-red-700 hover:bg-red-50"
            >
              {busyAction === "delete" ? "Đang xóa..." : "Xóa model 3D"}
            </Button>

            {productId && selectedModel && viewerUrl ? (
              <Button asChild type="button" variant="outline">
                <Link
                  href={`/admin/products/${productId}/3d-models/${selectedModel.id}/edit`}
                >
                  Open editor
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-base font-semibold text-slate-800">
              Trạng thái hiện tại
            </div>

            {!selectedModel ? (
              <div className="mt-3 rounded-xl bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                Chưa có model 3D nào cho sản phẩm này. Hãy chọn ảnh nguồn và bấm{" "}
                <strong>Tạo 3D từ Tripo</strong>.
              </div>
            ) : (
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      getStatusMeta(selectedModel.status).className,
                    ].join(" ")}
                  >
                    {getStatusMeta(selectedModel.status).label}
                  </span>

                  {selectedModel.isDefault ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Mặc định
                    </span>
                  ) : null}
                </div>

                <div>
                  <span className="font-medium">Task ID:</span>{" "}
                  {selectedModel.tripoTaskId || "-"}
                </div>
                <div>
                  <span className="font-medium">Tạo lúc:</span>{" "}
                  {formatDateTime(selectedModel.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Cập nhật:</span>{" "}
                  {formatDateTime(selectedModel.updatedAt)}
                </div>

                {selectedModel.errorMessage ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                    <span className="font-medium">Lỗi:</span>{" "}
                    {selectedModel.errorMessage}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {selectedModel ? (
            <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              <div className="text-base font-semibold text-slate-800">URL đã lưu</div>
              <div className="mt-3 space-y-3 break-all">
                <div>
                  <span className="font-medium">modelGlbUrl:</span>{" "}
                  {selectedModel.modelGlbUrl || "-"}
                </div>
                <div>
                  <span className="font-medium">baseModelGlbUrl:</span>{" "}
                  {selectedModel.baseModelGlbUrl || "-"}
                </div>
                <div>
                  <span className="font-medium">pbrModelGlbUrl:</span>{" "}
                  {selectedModel.pbrModelGlbUrl || "-"}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {models.length > 0 ? (
        <div className="grid gap-3">
          <div className="text-base font-semibold text-slate-800">
            Các model đã tạo
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {models.map((model) => {
              const active = model.id === (selectedModel?.id || "");
              const statusMeta = getStatusMeta(model.status);

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => updateSelectedModelId(model.id)}
                  className={[
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-slate-900 bg-slate-50 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        statusMeta.className,
                      ].join(" ")}
                    >
                      {statusMeta.label}
                    </span>

                    {model.isDefault ? (
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        Default
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 line-clamp-2 text-sm text-slate-700">
                    {model.sourceImageName || model.sourceImageUrl}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {formatDateTime(model.createdAt)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {viewerUrl ? (
        <Product3DViewer
          modelUrl={viewerUrl}
          posterUrl={
            selectedModel?.previewImageUrl || selectedModel?.sourceImageUrl || null
          }
          title="Viewer 3D trong admin"
          description="Viewer này đọc trực tiếp file model đã lưu trong blob. Frontend user sau này chỉ cần render URL này, không gọi Tripo."
        />
      ) : selectedModel ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Model đang ở trạng thái {selectedModel.status}. Khi có URL GLB/glTF sau
          bước đồng bộ, viewer sẽ xuất hiện tại đây.
        </div>
      ) : null}
    </Card>
  );
}
