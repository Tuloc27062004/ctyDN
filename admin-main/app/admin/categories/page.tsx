"use client";

import * as React from "react";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { categoryConfiguratorSchema } from "@/lib/validators";

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  allowedPatternIds: z.array(z.string()).default([]),
  allowedColorIds: z.array(z.string()).default([]),
  _count: z.object({
    products: z.number(),
    categoryPatterns: z.number(),
    categoryColors: z.number(),
  }),
});

const listSchema = z.object({
  categories: z.array(categorySchema),
});

type Category = z.infer<typeof categorySchema>;
type FormMode = "create" | "edit";

type CategoryFieldErrors = Partial<
  Record<"name" | "description" | "patternIds" | "colorIds", string>
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

export default function AdminCategoriesPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Category[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [mode, setMode] = React.useState<FormMode>("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  // Keep these states so existing DB values are preserved on edit/toggle,
  // but do not expose them in the UI anymore.
  const [patternIds, setPatternIds] = React.useState<string[]>([]);
  const [colorIds, setColorIds] = React.useState<string[]>([]);

  const [fieldErrors, setFieldErrors] = React.useState<CategoryFieldErrors>({});

  async function load() {
    const categoriesRes = await fetch("/api/admin/categories");
    const categoriesData = await readJsonSafe(categoriesRes);

    if (!categoriesRes.ok) {
      throw new Error(getApiErrorMessage(categoriesData, "Không tải được collection"));
    }

    setItems(listSchema.parse(categoriesData).categories);
  }

  React.useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => {
        toast({
          title: "Không tải được dữ liệu",
          description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((cat) => {
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(filteredItems.map((x) => x.id));
      return prev.filter((id) => allowed.has(id));
    });
  }, [filteredItems]);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setPatternIds([]);
    setColorIds([]);
    setFieldErrors({});
  }

  function startEdit(category: Category) {
    setMode("edit");
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description);
    setIsActive(category.isActive);

    // Preserve current DB values even though they are hidden from UI
    setPatternIds(category.allowedPatternIds);
    setColorIds(category.allowedColorIds);

    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateCurrentForm() {
    const parsed = categoryConfiguratorSchema.safeParse({
      name: name.trim(),
      description: description.trim(),
      isActive,
      patternIds,
      colorIds,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        description: errors.description?.[0],
        patternIds: errors.patternIds?.[0],
        colorIds: errors.colorIds?.[0],
      });
      return false;
    }

    setFieldErrors({});
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCurrentForm()) return;

    const ok = window.confirm(`Anh có muốn tạo collection mới không?\n\nTên collection: ${name.trim()}`);
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isActive,
          patternIds,
          colorIds,
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo collection"));
      }

      toast({
        title: "Đã tạo collection",
        description: `${data.category.name} đã được thêm thành công.`,
      });

      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Tạo collection không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!validateCurrentForm()) return;

    const ok = window.confirm(`Anh có muốn lưu thay đổi cho collection này không?\n\nTên collection: ${name.trim()}`);
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isActive,
          patternIds,
          colorIds,
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật collection"));
      }

      toast({
        title: "Đã lưu thay đổi",
        description: `${data.category.name} đã được cập nhật.`,
      });

      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Lưu không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(category: Category) {
    const nextStatus = !category.isActive;
    const ok = window.confirm(
      nextStatus
        ? `Anh có muốn kích hoạt collection "${category.name}" không?`
        : `Anh có muốn tạm ngưng collection "${category.name}" không?`
    );
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          isActive: nextStatus,
          patternIds: category.allowedPatternIds,
          colorIds: category.allowedColorIds,
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể đổi trạng thái collection"));
      }

      toast({
        title: nextStatus ? "Đã kích hoạt collection" : "Đã tạm ngưng collection",
        description: `Trạng thái của "${category.name}" đã được cập nhật.`,
      });

      if (editingId === category.id) {
        setIsActive(nextStatus);
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

  async function handleDelete(category: Category) {
    const ok = window.confirm(
      `Anh có chắc muốn xóa collection "${category.name}" không?\n\nChỉ có thể xóa nếu chưa có sản phẩm nào đang dùng collection này.`
    );
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể xóa collection"));
      }

      toast({
        title: "Đã xóa collection",
        description: `"${category.name}" đã được xóa.`,
      });

      if (editingId === category.id) {
        resetForm();
      }

      await load();
    } catch (error) {
      toast({
        title: "Xóa không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function runBulk(action: "activate" | "deactivate") {
    if (selectedIds.length === 0) return;

    const ok = window.confirm(
      action === "activate"
        ? `Anh có muốn kích hoạt ${selectedIds.length} collection đã chọn không?`
        : `Anh có muốn tạm ngưng ${selectedIds.length} collection đã chọn không?`
    );
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch("/api/admin/categories/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật hàng loạt"));
      }

      toast({
        title:
          action === "activate"
            ? "Đã kích hoạt các collection đã chọn"
            : "Đã tạm ngưng các collection đã chọn",
        description: `${data.updatedCount} collection đã được cập nhật.`,
      });

      setSelectedIds([]);
      await load();
    } catch (error) {
      toast({
        title: "Thao tác hàng loạt không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Quản lý collection"
      description="Collection chỉ dùng để nhóm sản phẩm. Hoa văn và màu sắc sẽ được chọn trực tiếp ở từng sản phẩm."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số collection: <span className="font-semibold">{items.length}</span>
        </div>
      }
    >
      <div className="grid gap-6">
        <form onSubmit={mode === "create" ? handleCreate : handleUpdate}>
          <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  {mode === "create" ? "Thêm collection mới" : "Chỉnh sửa collection"}
                </div>
                <p className="mt-1 text-base text-slate-600">
                  Điền thông tin cơ bản cho collection. Hoa văn và màu sắc sẽ không còn cấu hình ở đây.
                </p>
              </div>

              {mode === "edit" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={busy}
                  className="h-11 rounded-xl px-5 text-base"
                >
                  Hủy / Quay lại
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-base font-medium text-slate-800">
                  Tên collection
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Ví dụ: Bộ sưu tập men rạn"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="h-12 rounded-xl text-base"
                />
                {fieldErrors.name ? <p className="text-sm text-red-600">{fieldErrors.name}</p> : null}
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <label className="flex items-start gap-3 text-base text-slate-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <span>
                    Collection đang được sử dụng
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      Bỏ chọn nếu anh muốn tạm ngưng collection mà không xóa khỏi hệ thống.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-base font-medium text-slate-800">
                Mô tả collection
              </Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, description: undefined }));
                }}
                placeholder="Mô tả ngắn về phong cách, chất liệu hoặc bộ sưu tập"
                className="rounded-xl text-base leading-7"
              />
              {fieldErrors.description ? (
                <p className="text-sm text-red-600">{fieldErrors.description}</p>
              ) : null}
            </div>
          </Card>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={busy} className="h-11 rounded-xl px-5 text-base font-semibold">
              {busy
                ? "Đang xử lý..."
                : mode === "create"
                  ? "Tạo collection"
                  : "Lưu thay đổi collection"}
            </Button>
          </div>
        </form>

        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">Danh sách collection</div>
              <p className="mt-1 text-base text-slate-600">
                Theo dõi collection và số sản phẩm đang sử dụng. Hoa văn và màu sắc được chọn trực tiếp tại từng sản phẩm.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mô tả"
                className="h-11 w-full rounded-xl text-base sm:w-[280px]"
              />
              <Button type="button" variant="outline" onClick={() => runBulk("activate")} disabled={busy || selectedIds.length === 0} className="h-11 rounded-xl px-5 text-base">
                Kích hoạt đã chọn
              </Button>
              <Button type="button" variant="outline" onClick={() => runBulk("deactivate")} disabled={busy || selectedIds.length === 0} className="h-11 rounded-xl px-5 text-base">
                Tạm ngưng đã chọn
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Đang tải danh sách collection...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Không có collection nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((category) => {
                const checked = selectedIds.includes(category.id);
                return (
                  <div key={category.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, category.id]
                                : prev.filter((id) => id !== category.id)
                            );
                          }}
                          className="mt-1 h-5 w-5 rounded border-slate-300"
                        />

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-lg font-semibold text-slate-800">{category.name}</div>
                            <span className={`rounded-full px-3 py-1 text-sm font-medium ${category.isActive ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                              {category.isActive ? "Đang dùng" : "Tạm ngưng"}
                            </span>
                          </div>
                          <p className="mt-2 max-w-4xl text-base leading-7 text-slate-600">
                            {category.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span>Sản phẩm: {category._count.products}</span>
                            <span>Hoa văn / màu sắc: chọn trực tiếp ở sản phẩm</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(category)} disabled={busy} className="h-10 rounded-xl px-4 text-base">
                          Chỉnh sửa
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => handleToggleActive(category)} disabled={busy} className="h-10 rounded-xl px-4 text-base">
                          {category.isActive ? "Tạm ngưng" : "Kích hoạt"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(category)} disabled={busy || category._count.products > 0} className="h-10 rounded-xl px-4 text-base">
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}