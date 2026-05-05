"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import {
  ProductColorOption,
  ProductForm,
  ProductFormValues,
  ProductCategoryOption,
  ProductPatternOption,
} from "@/components/admin/product-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const model3DProviderSchema = z.enum(["TRIPO"]);
const model3DStatusSchema = z.enum(["DRAFT", "PROCESSING", "READY", "FAILED"]);

const categoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      allowedPatternIds: z.array(z.string()).default([]),
      allowedColorIds: z.array(z.string()).default([]),
      _count: z
        .object({
          categoryPatterns: z.number().optional(),
          categoryColors: z.number().optional(),
        })
        .optional(),
    })
  ),
});

const patternsSchema = z.object({
  patterns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      textureUrl: z.string(),
      defaultScale: z.number(),
      defaultOpacity: z.number(),
      isActive: z.boolean(),
    })
  ),
});

const colorsSchema = z.object({
  colors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      hex: z.string(),
      swatchUrl: z.string().nullable().optional(),
      isActive: z.boolean(),
    })
  ),
});

const productSchema = z.object({
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    isActive: z.boolean(),
    priority: z.number(),
    minPrice: z.number().nullable().optional(),
    maxPrice: z.number().nullable().optional(),
    defaultPatternId: z.string().nullable().optional(),
    defaultColorId: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    categories: z.array(
      z.object({
        category: z.object({
          id: z.string(),
          name: z.string(),
        }),
      })
    ),
    productPatterns: z.array(
      z.object({
        patternId: z.string(),
        pattern: z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          textureUrl: z.string(),
          defaultScale: z.number(),
          defaultOpacity: z.number(),
          isActive: z.boolean(),
        }),
      })
    ),
    productColors: z.array(
      z.object({
        colorId: z.string(),
        color: z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          hex: z.string(),
          swatchUrl: z.string().nullable().optional(),
          isActive: z.boolean(),
        }),
      })
    ),
    models3d: z.array(
      z.object({
        id: z.string(),
        provider: model3DProviderSchema,
        status: model3DStatusSchema,
        sourceImageUrl: z.string(),
        sourceImageName: z.string().nullable().optional(),
        previewImageUrl: z.string().nullable().optional(),
        tripoTaskId: z.string().nullable().optional(),
        modelVersion: z.string().nullable().optional(),
        faceLimit: z.number().nullable().optional(),
        textureEnabled: z.boolean(),
        pbrEnabled: z.boolean(),
        exportUv: z.boolean(),
        orientation: z.string().nullable().optional(),
        textureAlignment: z.string().nullable().optional(),
        modelGlbUrl: z.string().nullable().optional(),
        baseModelGlbUrl: z.string().nullable().optional(),
        pbrModelGlbUrl: z.string().nullable().optional(),
        errorMessage: z.string().nullable().optional(),
        isDefault: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    images: z.array(
      z.object({
        id: z.string(),
        url: z.string(),
        description: z.string(),
        isRender: z.boolean(),
        createdAt: z.string(),
      })
    ),
    _count: z.object({
      cartItems: z.number(),
      productPatterns: z.number(),
      productColors: z.number(),
      renderAssets: z.number(),
      models3d: z.number(),
    }),
  }),
});

type ProductDetail = z.infer<typeof productSchema>["product"];

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function parsePriority(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return 1;

  const num = Number(trimmed);
  return Number.isInteger(num) && (num === -999 || num > 0) ? num : 1;
}

function toPayload(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    isActive: values.isActive,
    priority: parsePriority(values.priority),
    minPrice: parseNullableNumber(values.minPrice),
    maxPrice: parseNullableNumber(values.maxPrice),
    categoryIds: values.categoryIds,
    patternIds: values.patternIds,
    colorIds: values.colorIds,
    defaultPatternId: values.defaultPatternId || null,
    defaultColorId: values.defaultColorId || null,
  };
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
    (data as { fieldErrors?: unknown }).fieldErrors &&
    typeof (data as { fieldErrors?: unknown }).fieldErrors === "object"
  ) {
    const fieldErrors = (data as { fieldErrors: Record<string, unknown> }).fieldErrors;

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

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [categories, setCategories] = React.useState<ProductCategoryOption[]>([]);
  const [patterns, setPatterns] = React.useState<ProductPatternOption[]>([]);
  const [colors, setColors] = React.useState<ProductColorOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [markFirstAsRender, setMarkFirstAsRender] = React.useState(true);

  async function loadAll() {
    if (!productId) {
      throw new Error("Thiếu mã sản phẩm");
    }

    const [categoriesRes, patternsRes, colorsRes, productRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/patterns"),
      fetch("/api/admin/colors"),
      fetch(`/api/admin/products/${productId}`),
    ]);

    const [categoriesData, patternsData, colorsData, productData] = await Promise.all([
      readJsonSafe(categoriesRes),
      readJsonSafe(patternsRes),
      readJsonSafe(colorsRes),
      readJsonSafe(productRes),
    ]);

    if (!categoriesRes.ok) {
      throw new Error(getApiErrorMessage(categoriesData, "Không tải được collection"));
    }
    if (!patternsRes.ok) {
      throw new Error(getApiErrorMessage(patternsData, "Không tải được hoa văn"));
    }
    if (!colorsRes.ok) {
      throw new Error(getApiErrorMessage(colorsData, "Không tải được màu sắc"));
    }
    if (!productRes.ok) {
      throw new Error(getApiErrorMessage(productData, "Không tải được sản phẩm"));
    }

    const parsedCategories = categoriesSchema.parse(categoriesData);
    const parsedPatterns = patternsSchema.parse(patternsData);
    const parsedColors = colorsSchema.parse(colorsData);
    const parsedProduct = productSchema.parse(productData);

    setCategories(
      parsedCategories.categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        allowedPatternIds: category.allowedPatternIds,
        allowedColorIds: category.allowedColorIds,
        allowedPatternCount:
          category._count?.categoryPatterns ?? category.allowedPatternIds.length,
        allowedColorCount:
          category._count?.categoryColors ?? category.allowedColorIds.length,
      }))
    );
    setPatterns(parsedPatterns.patterns);
    setColors(parsedColors.colors);
    setProduct(parsedProduct.product);
  }

  React.useEffect(() => {
    if (!productId) {
      setLoading(false);
      setProduct(null);
      setCategories([]);
      setPatterns([]);
      setColors([]);
      return;
    }

    setLoading(true);

    loadAll()
      .catch((err) => {
        console.error("Không tải được trang sản phẩm:", err);
        setProduct(null);
        setCategories([]);
        setPatterns([]);
        setColors([]);

        toast({
          title: "Không tải được sản phẩm",
          description:
            err instanceof Error
              ? err.message
              : "Dữ liệu sản phẩm hoặc master data hiện không khả dụng.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, toast]);

  async function handleUpdate(values: ProductFormValues) {
    const ok = window.confirm(
      `Anh có muốn lưu thay đổi cho sản phẩm này không?\n\nTên sản phẩm: ${values.name.trim()}`
    );
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật sản phẩm"));
      }

      toast({
        title: "Đã lưu thay đổi",
        description: "Thông tin sản phẩm đã được cập nhật.",
      });

      await loadAll();
    } catch (e) {
      toast({
        title: "Lưu không thành công",
        description: e instanceof Error ? e.message : "Có lỗi xảy ra khi lưu sản phẩm",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    if (!productId || !product) return;

    const ok = window.confirm(
      `Anh có muốn tạm ngưng sản phẩm này không?\n\nTên sản phẩm: ${product.name}`
    );
    if (!ok) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạm ngưng sản phẩm"));
      }

      toast({
        title: "Đã tạm ngưng sản phẩm",
        description: "Sản phẩm đã được đánh dấu ngưng hoạt động.",
      });

      await loadAll();
      router.refresh();
    } catch (e) {
      toast({
        title: "Thao tác không thành công",
        description: e instanceof Error ? e.message : "Có lỗi xảy ra khi cập nhật sản phẩm",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  function removeSelectedFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (!productId || files.length === 0) return;

    try {
      setUploading(true);

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("markFirstAsRender", String(markFirstAsRender));

      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tải ảnh gallery lên"));
      }

      toast({
        title: "Đã tải ảnh gallery",
        description: `Đã thêm ${files.length} ảnh vào sản phẩm.`,
      });

      setFiles([]);
      await loadAll();
    } catch (error) {
      toast({
        title: "Upload thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải ảnh lên",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="Đang tải sản phẩm"
        description="Vui lòng chờ trong giây lát..."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/products">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Đang tải dữ liệu sản phẩm...
        </div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell
        title="Không tìm thấy sản phẩm"
        description="Sản phẩm có thể đã bị xóa hoặc đường dẫn không hợp lệ."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/products">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-base text-red-700 shadow-sm">
          Không tìm thấy dữ liệu sản phẩm để chỉnh sửa.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Chỉnh sửa sản phẩm: ${product.name}`}
      description="Cập nhật thông tin configurator, quản lý gallery ảnh và xem model 3D đã sinh từ Tripo. Khối preview 2D cũ chỉ còn vai trò legacy nếu anh cần giữ lại sau này."
      right={
        <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
          <Link href="/admin/products">Hủy / Quay lại</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Collection:</span> {product.categories.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Gallery ảnh:</span> {product.images.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Hoa văn:</span> {product._count.productPatterns}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Màu sắc:</span> {product._count.productColors}
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-base text-blue-700">
          <span className="font-medium">Model 3D:</span> {product._count.models3d}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Cập nhật:</span> {formatDateTime(product.updatedAt)}
        </div>
      </div>

      <ProductForm
        title="Thông tin sản phẩm"
        submitLabel="Lưu thay đổi"
        categories={categories}
        patterns={patterns}
        colors={colors}
        busy={busy}
        productId={product.id}
        models3d={product.models3d}
        onModels3dChanged={loadAll}
        initialValues={{
          name: product.name,
          description: product.description,
          isActive: product.isActive,
          priority: String(product.priority ?? 1),
          minPrice: product.minPrice != null ? String(product.minPrice) : "",
          maxPrice: product.maxPrice != null ? String(product.maxPrice) : "",
          categoryIds: product.categories.map((x) => x.category.id),
          patternIds: product.productPatterns.map((x) => x.patternId),
          colorIds: product.productColors.map((x) => x.colorId),
          defaultPatternId: product.defaultPatternId ?? "",
          defaultColorId: product.defaultColorId ?? "",
          newImages: [],
          markFirstAsRender: true,
        }}
        onSubmit={handleUpdate}
        dangerSlot={
          <Button
            type="button"
            variant="outline"
            onClick={handleDeactivate}
            disabled={deleting}
            className="h-11 rounded-xl border-amber-300 px-5 text-base text-amber-700 hover:bg-amber-50"
          >
            {deleting ? "Đang xử lý..." : "Tạm ngưng sản phẩm"}
          </Button>
        }
      />

      <Card className="mt-6 space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Tải gallery ảnh lên</h2>
          <p className="mt-1 text-base text-slate-600">
            Đây là khu vực quản lý ảnh gallery thường. Luồng này giữ nguyên và hoàn toàn tách biệt với model 3D của Tripo.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-base font-medium text-slate-800">
            Chọn ảnh gallery
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <label className="flex items-start gap-3 text-base text-slate-800">
            <input
              type="checkbox"
              checked={markFirstAsRender}
              onChange={(e) => setMarkFirstAsRender(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />
            <span>Đặt ảnh đầu tiên vừa tải lên làm ảnh hiển thị chính</span>
          </label>
          <p className="mt-2 pl-8 text-sm leading-6 text-slate-500">
            Nếu bật mục này, ảnh đầu tiên trong danh sách tải lên sẽ được đánh dấu là ảnh hiển thị chính.
          </p>
        </div>

        <div className="text-base text-slate-700">
          <span className="font-medium">Số ảnh đã chọn:</span> {files.length}
        </div>

        {files.length > 0 && (
          <div className="grid gap-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-slate-800">
                    {file.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                    {index === 0 && markFirstAsRender ? " • Ảnh chính" : ""}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeSelectedFile(index)}
                  className="h-10 rounded-xl px-4 text-base"
                >
                  Bỏ ảnh này
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="h-11 rounded-xl px-5 text-base font-semibold"
          >
            {uploading ? "Đang tải ảnh..." : "Tải ảnh gallery lên"}
          </Button>
        </div>
      </Card>

      <Card className="mt-6 space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Gallery ảnh hiện có</h2>
          <p className="mt-1 text-base text-slate-600">
            Danh sách các ảnh gallery đang gắn với sản phẩm này.
          </p>
        </div>

        {product.images.length === 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
            Sản phẩm này hiện chưa có ảnh gallery nào.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {product.images.map((img) => (
            <div
              key={img.id}
              className="space-y-3 rounded-2xl border border-slate-200 p-4"
            >
              <img
                src={img.url}
                alt={img.description || "Ảnh sản phẩm"}
                className="h-48 w-full rounded-xl border border-slate-200 object-cover"
                loading="lazy"
              />

              <div className="break-all text-base font-medium text-slate-800">
                {img.description || "Ảnh sản phẩm"}
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Ảnh chính: {img.isRender ? "Có" : "Không"}
              </div>

              <div className="text-sm text-slate-500">
                Ngày thêm: {formatDateTime(img.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
