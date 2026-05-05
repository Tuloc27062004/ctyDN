"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import {
  ProductColorOption,
  ProductForm,
  ProductFormValues,
  ProductCategoryOption,
  ProductPatternOption,
} from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePriority(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return 1;

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && (parsed === -999 || parsed > 0) ? parsed : 1;
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

async function uploadProductImages(productId: string, values: ProductFormValues) {
  if (values.newImages.length === 0) return;

  const formData = new FormData();
  values.newImages.forEach((file) => formData.append("files", file));
  formData.append("markFirstAsRender", String(values.markFirstAsRender));

  const res = await fetch(`/api/admin/products/${productId}/images`, {
    method: "POST",
    body: formData,
  });

  const data = await readJsonSafe(res);

  if (!res.ok) {
    throw new Error(getApiErrorMessage(data, "Không thể tải ảnh gallery lên"));
  }
}

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = React.useState<ProductCategoryOption[]>([]);
  const [patterns, setPatterns] = React.useState<ProductPatternOption[]>([]);
  const [colors, setColors] = React.useState<ProductColorOption[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let ignore = false;

    async function loadDependencies() {
      try {
        setLoading(true);

        const [categoriesRes, patternsRes, colorsRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/patterns"),
          fetch("/api/admin/colors"),
        ]);

        const [categoriesData, patternsData, colorsData] = await Promise.all([
          readJsonSafe(categoriesRes),
          readJsonSafe(patternsRes),
          readJsonSafe(colorsRes),
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

        const parsedCategories = categoriesSchema.parse(categoriesData);
        const parsedPatterns = patternsSchema.parse(patternsData);
        const parsedColors = colorsSchema.parse(colorsData);

        if (!ignore) {
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
        }
      } catch (error) {
        if (!ignore) {
          toast({
            title: "Không tải được dữ liệu cấu hình",
            description:
              error instanceof Error
                ? error.message
                : "Vui lòng kiểm tra dữ liệu master rồi thử lại.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadDependencies();

    return () => {
      ignore = true;
    };
  }, [toast]);

  async function handleSubmit(values: ProductFormValues) {
    const message =
      values.newImages.length > 0
        ? `Anh có muốn tạo sản phẩm này và tải lên ${values.newImages.length} ảnh gallery không?`
        : "Anh có muốn tạo sản phẩm này không?";

    if (!window.confirm(message)) return;

    try {
      setBusy(true);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo sản phẩm"));
      }

      const productId = data?.product?.id;
      if (!productId || typeof productId !== "string") {
        throw new Error("API tạo sản phẩm không trả về product.id");
      }

      if (values.newImages.length > 0) {
        await uploadProductImages(productId, values);
      }

      toast({
        title: "Đã tạo sản phẩm",
        description: "Sản phẩm đã được tạo. Bước tiếp theo là mở trang chỉnh sửa để tạo model 3D từ Tripo.",
      });

      router.push(`/admin/products/${productId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Tạo sản phẩm không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="Tạo sản phẩm mới"
        description="Đang tải collection, hoa văn và màu sắc..."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/products">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Đang tải dữ liệu...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Tạo sản phẩm mới"
      description="Tạo dáng chậu cơ sở, cấu hình collection / hoa văn / màu sắc. Sau khi lưu xong, trang chỉnh sửa sẽ cho phép generate model 3D từ Tripo."
      right={
        <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
          <Link href="/admin/products">Hủy / Quay lại</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Collection:</span> {categories.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Hoa văn master:</span> {patterns.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Màu master:</span> {colors.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Ảnh gallery chọn sẵn:</span> 0
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-base text-blue-700">
          <span className="font-medium">3D workflow:</span> tạo sau khi lưu sản phẩm
        </div>
      </div>

      <ProductForm
        title="Thông tin sản phẩm"
        submitLabel="Tạo sản phẩm"
        categories={categories}
        patterns={patterns}
        colors={colors}
        busy={busy}
        showImagePicker
        initialValues={{
          name: "",
          description: "",
          isActive: true,
          priority: "1",
          minPrice: "",
          maxPrice: "",
          categoryIds: [],
          patternIds: [],
          colorIds: [],
          defaultPatternId: "",
          defaultColorId: "",
          newImages: [],
          markFirstAsRender: true,
        }}
        onSubmit={handleSubmit}
      />
    </PageShell>
  );
}
