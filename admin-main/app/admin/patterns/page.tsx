"use client";

import * as React from "react";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UploadWidget } from "@/components/upload-widget";
import { patternInputSchema } from "@/lib/validators";

const patternSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  textureUrl: z.string(),
  defaultScale: z.number(),
  defaultOpacity: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z
    .object({
      productPatterns: z.number(),
      categoryPatterns: z.number(),
      defaultForProducts: z.number(),
    })
    .optional(),
});

const listSchema = z.object({
  patterns: z.array(patternSchema),
});

type Pattern = z.infer<typeof patternSchema>;
type FormMode = "create" | "edit";

type FieldErrors = Partial<
  Record<"name" | "code" | "textureUrl" | "defaultScale" | "defaultOpacity", string>
>;

function getApiErrorMessage(data: any, fallback: string) {
  if (data?.error && typeof data.error === "string") return data.error;

  const fieldErrors = data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
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

function clampOpacity(value: number) {
  if (Number.isNaN(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function clampScale(value: number) {
  if (Number.isNaN(value) || value <= 0) return 1;
  return Math.max(0.05, value);
}

function getPatternSurfaceStyle(
  textureUrl: string,
  scale: number,
  opacity: number,
): React.CSSProperties {
  const safeScale = clampScale(scale);
  const safeOpacity = clampOpacity(opacity);
  const tileSize = Math.max(24, Math.round(96 * safeScale));

  return {
    backgroundImage: `url("${textureUrl}")`,
    backgroundRepeat: "repeat",
    backgroundPosition: "center",
    backgroundSize: `${tileSize}px ${tileSize}px`,
    opacity: safeOpacity,
  };
}

function PatternPreview({
  textureUrl,
  scale,
  opacity,
  title,
  className = "",
}: {
  textureUrl: string;
  scale: number;
  opacity: number;
  title?: string;
  className?: string;
}) {
  if (!textureUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 ${className}`}
      >
        Chưa có ảnh texture
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}
      title={title}
    >
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#f8fafc_25%,#eef2f7_25%,#eef2f7_50%,#f8fafc_50%,#f8fafc_75%,#eef2f7_75%,#eef2f7_100%)] bg-[length:20px_20px]" />
      <div
        className="absolute inset-0"
        style={getPatternSurfaceStyle(textureUrl, scale, opacity)}
      />
    </div>
  );
}

export default function AdminPatternsPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Pattern[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [mode, setMode] = React.useState<FormMode>("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [textureUrl, setTextureUrl] = React.useState("");
  const [defaultScale, setDefaultScale] = React.useState("1");
  const [defaultOpacity, setDefaultOpacity] = React.useState("1");
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  async function load() {
    const res = await fetch("/api/admin/patterns");
    const data = await readJsonSafe(res);
    if (!res.ok) {
      throw new Error(getApiErrorMessage(data, "Không tải được danh sách hoa văn"));
    }
    setItems(listSchema.parse(data).patterns);
  }

  React.useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => {
        toast({
          title: "Không tải được hoa văn",
          description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q),
    );
  }, [items, search]);

  const previewScale = React.useMemo(() => {
    const value = Number(defaultScale);
    return clampScale(value);
  }, [defaultScale]);

  const previewOpacity = React.useMemo(() => {
    const value = Number(defaultOpacity);
    return clampOpacity(value);
  }, [defaultOpacity]);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setName("");
    setCode("");
    setTextureUrl("");
    setDefaultScale("1");
    setDefaultOpacity("1");
    setIsActive(true);
    setErrors({});
  }

  function startEdit(pattern: Pattern) {
    setMode("edit");
    setEditingId(pattern.id);
    setName(pattern.name);
    setCode(pattern.code);
    setTextureUrl(pattern.textureUrl);
    setDefaultScale(String(pattern.defaultScale));
    setDefaultOpacity(String(pattern.defaultOpacity));
    setIsActive(pattern.isActive);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPayload() {
    return {
      name: name.trim(),
      code: code.trim(),
      textureUrl: textureUrl.trim(),
      defaultScale: Number(defaultScale),
      defaultOpacity: Number(defaultOpacity),
      isActive,
    };
  }

  function validateForm() {
    const parsed = patternInputSchema.safeParse(getPayload());
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        code: fieldErrors.code?.[0],
        textureUrl: fieldErrors.textureUrl?.[0],
        defaultScale: fieldErrors.defaultScale?.[0],
        defaultOpacity: fieldErrors.defaultOpacity?.[0],
      });
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setBusy(true);
      const res = await fetch("/api/admin/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo hoa văn"));
      }
      toast({
        title: "Đã tạo hoa văn",
        description: `${data.pattern.name} đã được thêm.`,
      });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Tạo hoa văn không thành công",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !validateForm()) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/patterns/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật hoa văn"));
      }
      toast({
        title: "Đã cập nhật hoa văn",
        description: `${data.pattern.name} đã được cập nhật.`,
      });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Cập nhật không thành công",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(pattern: Pattern) {
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/patterns/${pattern.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pattern.name,
          code: pattern.code,
          textureUrl: pattern.textureUrl,
          defaultScale: pattern.defaultScale,
          defaultOpacity: pattern.defaultOpacity,
          isActive: !pattern.isActive,
        }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể đổi trạng thái hoa văn"));
      }
      await load();
    } catch (error) {
      toast({
        title: "Đổi trạng thái không thành công",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(pattern: Pattern) {
    const ok = window.confirm(
      `Anh có muốn ngừng sử dụng hoa văn "${pattern.name}" không?`,
    );
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/patterns/${pattern.id}`, {
        method: "DELETE",
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(data, "Không thể ngừng sử dụng hoa văn"),
        );
      }
      toast({
        title: "Đã ngừng sử dụng hoa văn",
        description: `${pattern.name} đã được chuyển sang trạng thái tạm ngưng.`,
      });
      if (editingId === pattern.id) resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Thao tác không thành công",
        description:
          error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Hoa văn"
      description="Quản lý master data hoa văn để tái sử dụng cho collection và sản phẩm."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số hoa văn: <span className="font-semibold">{items.length}</span>
        </div>
      }
    >
      <div className="grid gap-6">
        <form onSubmit={mode === "create" ? handleCreate : handleUpdate}>
          <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  {mode === "create" ? "Tạo hoa văn mới" : "Chỉnh sửa hoa văn"}
                </div>
                <p className="mt-1 text-base text-slate-600">
                  Master hoa văn sẽ được dùng lại cho collection và sản phẩm.
                </p>
              </div>

              {mode === "edit" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="h-11 rounded-xl px-5 text-base"
                >
                  Hủy / Quay lại
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">
                  Tên hoa văn
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
                {errors.name ? (
                  <p className="text-sm text-red-600">{errors.name}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">
                  Mã hoa văn
                </Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
                {errors.code ? (
                  <p className="text-sm text-red-600">{errors.code}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3">
              <Label className="text-base font-medium text-slate-800">
                Ảnh texture
              </Label>

              <UploadWidget
                onUploaded={async (publicUrl) => {
                  setTextureUrl(publicUrl);
                  setErrors((prev) => ({
                    ...prev,
                    textureUrl: undefined,
                  }));
                }}
              />

              {errors.textureUrl ? (
                <p className="text-sm text-red-600">{errors.textureUrl}</p>
              ) : null}

              {textureUrl ? (
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[220px_1fr]">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-700">
                      Ảnh gốc
                    </div>
                    <img
                      src={textureUrl}
                      alt="Texture preview"
                      className="h-52 w-full rounded-xl border border-slate-200 bg-white object-cover"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-700">
                      Xem trước pattern
                    </div>

                    <PatternPreview
                      textureUrl={textureUrl}
                      scale={previewScale}
                      opacity={previewOpacity}
                      title="Pattern preview"
                      className="h-52 w-full"
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">
                          Scale preview:
                        </span>{" "}
                        {previewScale}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">
                          Opacity preview:
                        </span>{" "}
                        {previewOpacity}
                      </div>
                    </div>

                    <div className="break-all rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                      {textureUrl}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTextureUrl("")}
                        className="h-10 rounded-xl px-4 text-base"
                      >
                        Xóa ảnh
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">
                  Scale mặc định
                </Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={defaultScale}
                  onChange={(e) => setDefaultScale(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
                {errors.defaultScale ? (
                  <p className="text-sm text-red-600">{errors.defaultScale}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">
                  Opacity mặc định
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={defaultOpacity}
                  onChange={(e) => setDefaultOpacity(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
                {errors.defaultOpacity ? (
                  <p className="text-sm text-red-600">{errors.defaultOpacity}</p>
                ) : null}
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <label className="flex items-start gap-3 text-base text-slate-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <span>Hoa văn đang được sử dụng</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={busy}
                className="h-11 rounded-xl px-5 text-base font-semibold"
              >
                {busy
                  ? "Đang xử lý..."
                  : mode === "create"
                    ? "Tạo hoa văn"
                    : "Lưu thay đổi"}
              </Button>
            </div>
          </Card>
        </form>

        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">
                Danh sách hoa văn
              </div>
              <p className="mt-1 text-base text-slate-600">
                Theo dõi mức độ sử dụng của từng hoa văn trong collection và sản phẩm.
              </p>
            </div>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã"
              className="h-11 w-full rounded-xl text-base sm:w-[280px]"
            />
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Đang tải dữ liệu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Không có hoa văn nào.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((pattern) => (
                <div
                  key={pattern.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-slate-800">
                          {pattern.name}
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {pattern.code}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            pattern.isActive
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {pattern.isActive ? "Đang dùng" : "Tạm ngưng"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[140px_220px_1fr]">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-slate-700">
                            Ảnh texture
                          </div>
                          <img
                            src={pattern.textureUrl}
                            alt={pattern.name}
                            className="h-28 w-full rounded-xl border border-slate-200 bg-white object-cover"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-slate-700">
                            Pattern preview
                          </div>
                          <PatternPreview
                            textureUrl={pattern.textureUrl}
                            scale={pattern.defaultScale}
                            opacity={pattern.defaultOpacity}
                            title={pattern.name}
                            className="h-28 w-full"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                            <div className="font-medium text-slate-700">
                              Texture URL
                            </div>
                            <div className="mt-1 break-all">
                              {pattern.textureUrl}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span>Scale: {pattern.defaultScale}</span>
                            <span>Opacity: {pattern.defaultOpacity}</span>
                            <span>
                              Dùng trong sản phẩm:{" "}
                              {pattern._count?.productPatterns ?? 0}
                            </span>
                            <span>
                              Dùng trong collection:{" "}
                              {pattern._count?.categoryPatterns ?? 0}
                            </span>
                            <span>
                              Làm mặc định:{" "}
                              {pattern._count?.defaultForProducts ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(pattern)}
                        className="h-10 rounded-xl px-4 text-base"
                      >
                        Chỉnh sửa
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(pattern)}
                        className="h-10 rounded-xl px-4 text-base"
                      >
                        {pattern.isActive ? "Tạm ngưng" : "Kích hoạt"}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(pattern)}
                        className="h-10 rounded-xl px-4 text-base"
                      >
                        Ngừng dùng
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
