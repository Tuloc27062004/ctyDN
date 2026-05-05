"use client";

import * as React from "react";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { colorInputSchema } from "@/lib/validators";

const colorSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  hex: z.string(),
  swatchUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z
    .object({
      productColors: z.number(),
      categoryColors: z.number(),
      defaultForProducts: z.number(),
    })
    .optional(),
});

const listSchema = z.object({
  colors: z.array(colorSchema),
});

type ColorItem = z.infer<typeof colorSchema>;
type FormMode = "create" | "edit";

type FieldErrors = Partial<
  Record<"name" | "code" | "hex" | "swatchUrl", string>
>;

const COLOR_PRESETS = [
  "#000000",
  "#1F2937",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#F3F4F6",
  "#FFFFFF",

  "#7F1D1D",
  "#B91C1C",
  "#DC2626",
  "#EF4444",
  "#F87171",
  "#FCA5A5",

  "#7C2D12",
  "#C2410C",
  "#EA580C",
  "#F97316",
  "#FB923C",
  "#FDBA74",

  "#78350F",
  "#CA8A04",
  "#EAB308",
  "#FACC15",
  "#FDE047",
  "#FEF08A",

  "#365314",
  "#4D7C0F",
  "#65A30D",
  "#84CC16",
  "#A3E635",
  "#BEF264",

  "#14532D",
  "#15803D",
  "#16A34A",
  "#22C55E",
  "#4ADE80",
  "#86EFAC",

  "#134E4A",
  "#0F766E",
  "#0D9488",
  "#14B8A6",
  "#2DD4BF",
  "#5EEAD4",

  "#164E63",
  "#0369A1",
  "#0284C7",
  "#0EA5E9",
  "#38BDF8",
  "#7DD3FC",

  "#1E3A8A",
  "#1D4ED8",
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",

  "#312E81",
  "#4338CA",
  "#4F46E5",
  "#6366F1",
  "#818CF8",
  "#A5B4FC",

  "#581C87",
  "#7E22CE",
  "#9333EA",
  "#A855F7",
  "#C084FC",
  "#D8B4FE",

  "#86198F",
  "#A21CAF",
  "#C026D3",
  "#D946EF",
  "#E879F9",
  "#F0ABFC",

  "#831843",
  "#BE185D",
  "#DB2777",
  "#EC4899",
  "#F472B6",
  "#F9A8D4",

  "#7F1D1D",
  "#A16207",
  "#57534E",
  "#78716C",
  "#A8A29E",
  "#D6D3D1",
];

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

function normalizeHex(value: string) {
  const raw = value.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(raw)) return raw;
  if (/^[0-9A-F]{6}$/.test(raw)) return `#${raw}`;
  return "#000000";
}

function isValidHex(value: string) {
  return /^#[0-9A-F]{6}$/i.test(value.trim());
}

function ColorSwatch({
  hex,
  selected = false,
  onClick,
  label,
}: {
  hex: string;
  selected?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label ?? hex}
      aria-label={label ?? hex}
      className={`relative h-11 w-11 rounded-xl border-2 transition ${
        selected
          ? "border-slate-900 ring-2 ring-slate-200"
          : "border-slate-200 hover:border-slate-400"
      }`}
      style={{ backgroundColor: hex }}
    >
      {selected ? (
        <span
          className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
            hex.toUpperCase() === "#FFFFFF" || hex.toUpperCase() === "#F3F4F6"
              ? "text-slate-900"
              : "text-white"
          }`}
        >
          ✓
        </span>
      ) : null}
    </button>
  );
}

export default function AdminColorsPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<ColorItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [mode, setMode] = React.useState<FormMode>("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [hex, setHex] = React.useState("#000000");
  const [swatchUrl, setSwatchUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  async function load() {
    const res = await fetch("/api/admin/colors");
    const data = await readJsonSafe(res);
    if (!res.ok) {
      throw new Error(getApiErrorMessage(data, "Không tải được danh sách màu"));
    }
    setItems(listSchema.parse(data).colors);
  }

  React.useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => {
        toast({
          title: "Không tải được màu",
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
        item.code.toLowerCase().includes(q) ||
        item.hex.toLowerCase().includes(q),
    );
  }, [items, search]);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setName("");
    setCode("");
    setHex("#000000");
    setSwatchUrl("");
    setIsActive(true);
    setErrors({});
  }

  function startEdit(color: ColorItem) {
    setMode("edit");
    setEditingId(color.id);
    setName(color.name);
    setCode(color.code);
    setHex(normalizeHex(color.hex));
    setSwatchUrl(color.swatchUrl ?? "");
    setIsActive(color.isActive);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPayload() {
    return {
      name: name.trim(),
      code: code.trim(),
      hex: normalizeHex(hex),
      swatchUrl: swatchUrl.trim(),
      isActive,
    };
  }

  function validateForm() {
    const payload = getPayload();
    const parsed = colorInputSchema.safeParse(payload);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        code: fieldErrors.code?.[0],
        hex: fieldErrors.hex?.[0],
        swatchUrl: fieldErrors.swatchUrl?.[0],
      });
      return false;
    }

    if (!isValidHex(payload.hex)) {
      setErrors((prev) => ({
        ...prev,
        hex: "Màu đã chọn không hợp lệ.",
      }));
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
      const res = await fetch("/api/admin/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo màu"));
      }
      toast({
        title: "Đã tạo màu",
        description: `${data.color.name} đã được thêm.`,
      });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Tạo màu không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
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
      const res = await fetch(`/api/admin/colors/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật màu"));
      }
      toast({
        title: "Đã cập nhật màu",
        description: `${data.color.name} đã được cập nhật.`,
      });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Cập nhật không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(color: ColorItem) {
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/colors/${color.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: color.name,
          code: color.code,
          hex: color.hex,
          swatchUrl: color.swatchUrl ?? "",
          isActive: !color.isActive,
        }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể đổi trạng thái màu"));
      }
      await load();
    } catch (error) {
      toast({
        title: "Đổi trạng thái không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(color: ColorItem) {
    const ok = window.confirm(`Anh có muốn ngừng sử dụng màu "${color.name}" không?`);
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/colors/${color.id}`, {
        method: "DELETE",
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể ngừng sử dụng màu"));
      }
      toast({
        title: "Đã ngừng sử dụng màu",
        description: `${color.name} đã được chuyển sang trạng thái tạm ngưng.`,
      });
      if (editingId === color.id) resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Thao tác không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Màu sắc"
      description="Quản lý master data màu sắc để tái sử dụng cho collection và sản phẩm."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số màu: <span className="font-semibold">{items.length}</span>
        </div>
      }
    >
      <div className="grid gap-6">
        <form onSubmit={mode === "create" ? handleCreate : handleUpdate}>
          <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  {mode === "create" ? "Tạo màu mới" : "Chỉnh sửa màu"}
                </div>
                <p className="mt-1 text-base text-slate-600">
                  Master màu sẽ được dùng lại cho collection và sản phẩm.
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
                  Tên màu
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
                  Mã màu
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

            <div className="grid gap-4 lg:grid-cols-[1.2fr_220px]">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-base font-medium text-slate-800">
                    Chọn màu trực quan
                  </Label>
                  <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12">
                    {COLOR_PRESETS.map((preset) => (
                      <ColorSwatch
                        key={preset}
                        hex={preset}
                        selected={normalizeHex(hex) === preset}
                        onClick={() => {
                          setHex(preset);
                          setErrors((prev) => ({ ...prev, hex: undefined }));
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <span className="text-sm font-medium text-slate-700">
                      Chọn màu bất kỳ
                    </span>
                    <input
                      type="color"
                      value={normalizeHex(hex)}
                      onChange={(e) => {
                        setHex(normalizeHex(e.target.value));
                        setErrors((prev) => ({ ...prev, hex: undefined }));
                      }}
                      className="h-12 w-16 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    />
                  </div>

                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm text-slate-500">Mã màu đã chọn</div>
                    <div className="mt-1 font-semibold text-slate-800">
                      {normalizeHex(hex)}
                    </div>
                  </div>
                </div>

                {errors.hex ? (
                  <p className="text-sm text-red-600">{errors.hex}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">
                  Xem trước
                </Label>
                <div
                  className="h-full min-h-[180px] rounded-2xl border border-slate-200 shadow-inner"
                  style={{ backgroundColor: normalizeHex(hex) }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-base font-medium text-slate-800">
                Swatch URL (tùy chọn)
              </Label>
              <Input
                value={swatchUrl}
                onChange={(e) => setSwatchUrl(e.target.value)}
                placeholder="https://..."
                className="h-12 rounded-xl text-base"
              />
              {errors.swatchUrl ? (
                <p className="text-sm text-red-600">{errors.swatchUrl}</p>
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
                <span>Màu sắc đang được sử dụng</span>
              </label>
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
                    ? "Tạo màu"
                    : "Lưu thay đổi"}
              </Button>
            </div>
          </Card>
        </form>

        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">
                Danh sách màu
              </div>
              <p className="mt-1 text-base text-slate-600">
                Theo dõi mức độ sử dụng của từng màu trong collection và sản phẩm.
              </p>
            </div>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã hoặc hex"
              className="h-11 w-full rounded-xl text-base sm:w-[300px]"
            />
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Đang tải dữ liệu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Không có màu nào.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((color) => (
                <div
                  key={color.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-slate-800">
                          {color.name}
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {color.code}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {normalizeHex(color.hex)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            color.isActive
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {color.isActive ? "Đang dùng" : "Tạm ngưng"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[120px_1fr]">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-slate-700">
                            Màu preview
                          </div>
                          <div
                            className="h-24 w-full rounded-xl border border-slate-200"
                            style={{ backgroundColor: normalizeHex(color.hex) }}
                          />
                        </div>

                        <div className="min-w-0">
                          {color.swatchUrl ? (
                            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                              <img
                                src={color.swatchUrl}
                                alt={color.name}
                                className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-700">
                                  Swatch ảnh
                                </div>
                                <div className="truncate text-sm text-slate-500">
                                  {color.swatchUrl}
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                            <span>
                              Dùng trong sản phẩm:{" "}
                              {color._count?.productColors ?? 0}
                            </span>
                            <span>
                              Dùng trong collection:{" "}
                              {color._count?.categoryColors ?? 0}
                            </span>
                            <span>
                              Làm mặc định:{" "}
                              {color._count?.defaultForProducts ?? 0}
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
                        onClick={() => startEdit(color)}
                        className="h-10 rounded-xl px-4 text-base"
                      >
                        Chỉnh sửa
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(color)}
                        className="h-10 rounded-xl px-4 text-base"
                      >
                        {color.isActive ? "Tạm ngưng" : "Kích hoạt"}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(color)}
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
