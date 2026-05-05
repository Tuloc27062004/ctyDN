"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RenderAssetValue = {
  id?: string;
  viewCode: string;
  baseImageUrl: string;
  maskImageUrl: string;
  shadowImageUrl: string;
  highlightImageUrl: string;
  width: string;
  height: string;
  isDefault: boolean;
};

type Props = {
  value: RenderAssetValue[];
  onChange: (value: RenderAssetValue[]) => void;
  disabled?: boolean;
};

type UploadField =
  | "baseImageUrl"
  | "maskImageUrl"
  | "shadowImageUrl"
  | "highlightImageUrl";

const FIELD_LABELS: Record<UploadField, string> = {
  baseImageUrl: "Ảnh nền base",
  maskImageUrl: "Ảnh mask",
  shadowImageUrl: "Ảnh shadow",
  highlightImageUrl: "Ảnh highlight",
};

function createEmptyAsset(): RenderAssetValue {
  return {
    viewCode: "front",
    baseImageUrl: "",
    maskImageUrl: "",
    shadowImageUrl: "",
    highlightImageUrl: "",
    width: "",
    height: "",
    isDefault: false,
  };
}

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.error || `Không thể tải tệp lên (${res.status})`
    );
  }

  if (!data?.url || typeof data.url !== "string") {
    throw new Error("API upload không trả về URL hợp lệ.");
  }

  return data.url as string;
}

export function ProductRenderAssetsForm({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);

  function updateAsset(index: number, patch: Partial<RenderAssetValue>) {
    onChange(
      value.map((asset, currentIndex) => {
        if (currentIndex !== index) return asset;
        return { ...asset, ...patch };
      })
    );
  }

  function addAsset() {
    const next = [...value, createEmptyAsset()];
    if (next.length === 1) {
      next[0].isDefault = true;
    }
    onChange(next);
  }

  function removeAsset(index: number) {
    const next = value.filter((_, currentIndex) => currentIndex !== index);
    if (next.length > 0 && !next.some((asset) => asset.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    onChange(next);
  }

  function setDefault(index: number) {
    onChange(
      value.map((asset, currentIndex) => ({
        ...asset,
        isDefault: currentIndex === index,
      }))
    );
  }

  async function handleUpload(index: number, field: UploadField, file?: File | null) {
    if (!file) return;

    const key = `${index}:${field}`;
    try {
      setUploadingKey(key);
      const url = await uploadFile(file);
      updateAsset(index, { [field]: url } as Partial<RenderAssetValue>);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải ảnh lên";
      window.alert(message);
    } finally {
      setUploadingKey(null);
    }
  }

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-800">Bộ asset render</div>
          <p className="mt-1 text-base leading-7 text-slate-600">
            Các asset này phục vụ engine render layer-based ở website sau này. Không dùng chung với gallery ảnh sản phẩm.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addAsset}
          disabled={disabled}
          className="h-11 rounded-xl px-5 text-base"
        >
          Thêm asset pack
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Chưa có asset pack nào. Anh có thể thêm nhiều góc nhìn như front, side, top...
        </div>
      ) : null}

      <div className="grid gap-5">
        {value.map((asset, index) => (
          <div key={asset.id ?? `asset-${index}`} className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-800">
                  Asset pack #{index + 1}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Mã view hiện tại: {asset.viewCode || "front"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDefault(index)}
                  disabled={disabled}
                  className="h-10 rounded-xl px-4 text-base"
                >
                  {asset.isDefault ? "Đang là mặc định" : "Đặt mặc định"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeAsset(index)}
                  disabled={disabled}
                  className="h-10 rounded-xl px-4 text-base"
                >
                  Xóa asset pack
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2 md:col-span-2">
                <label className="text-base font-medium text-slate-800">Mã góc nhìn</label>
                <Input
                  value={asset.viewCode}
                  onChange={(e) => updateAsset(index, { viewCode: e.target.value })}
                  placeholder="front"
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={asset.isDefault}
                  onChange={() => setDefault(index)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Asset pack mặc định
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {(
                [
                  "baseImageUrl",
                  "maskImageUrl",
                  "shadowImageUrl",
                  "highlightImageUrl",
                ] as UploadField[]
              ).map((field) => {
                const key = `${index}:${field}`;
                return (
                  <div key={field} className="grid gap-2">
                    <label className="text-base font-medium text-slate-800">
                      {FIELD_LABELS[field]}
                    </label>
                    <Input
                      value={asset[field]}
                      onChange={(e) =>
                        updateAsset(index, { [field]: e.target.value } as Partial<RenderAssetValue>)
                      }
                      placeholder="https://..."
                      className="h-12 rounded-xl text-base"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            void handleUpload(index, field, file);
                            e.currentTarget.value = "";
                          }}
                        />
                        {uploadingKey === key ? "Đang tải..." : `Tải ${FIELD_LABELS[field]}`}
                      </label>
                      {asset[field] ? (
                        <a
                          href={asset[field]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-slate-500 underline"
                        >
                          Mở URL
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-base font-medium text-slate-800">Chiều rộng render</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={asset.width}
                  onChange={(e) => updateAsset(index, { width: e.target.value })}
                  placeholder="1200"
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-base font-medium text-slate-800">Chiều cao render</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={asset.height}
                  onChange={(e) => updateAsset(index, { height: e.target.value })}
                  placeholder="1200"
                  className="h-12 rounded-xl text-base"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
