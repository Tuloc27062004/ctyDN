"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_IMAGE_MAX_FILES,
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
  isAllowedProductImageType,
} from "@/lib/validators";
import { ProductPatternSelector } from "@/components/admin/product-pattern-selector";
import { ProductColorSelector } from "@/components/admin/product-color-selector";
import {
  Product3DModelForm,
  Product3DModelSummary,
} from "@/components/admin/product-3d-model-form";

const ProductLivePreview = dynamic(
  () =>
    import("@/components/admin/product-live-preview").then(
      (mod) => mod.ProductLivePreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Đang tải preview giống khách hàng...
      </div>
    ),
  }
);

export type ProductFormValues = {
  name: string;
  description: string;
  isActive: boolean;
  priority: string;
  minPrice: string;
  maxPrice: string;
  categoryIds: string[];
  patternIds: string[];
  colorIds: string[];
  defaultPatternId: string;
  defaultColorId: string;
  newImages: File[];
  markFirstAsRender: boolean;
};

export type ProductCategoryOption = {
  id: string;
  name: string;
  description: string;
  allowedPatternIds: string[];
  allowedColorIds: string[];
  allowedPatternCount?: number;
  allowedColorCount?: number;
};

export type ProductPatternOption = {
  id: string;
  name: string;
  code: string;
  textureUrl: string;
  defaultScale: number;
  defaultOpacity: number;
  isActive: boolean;
};

export type ProductColorOption = {
  id: string;
  name: string;
  code: string;
  hex: string;
  swatchUrl?: string | null;
  isActive: boolean;
};

type Props = {
  title: string;
  submitLabel: string;
  categories: ProductCategoryOption[];
  patterns: ProductPatternOption[];
  colors: ProductColorOption[];
  initialValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  busy?: boolean;
  dangerSlot?: React.ReactNode;
  showImagePicker?: boolean;
  productId?: string;
  models3d?: Product3DModelSummary[];
  onModels3dChanged?: () => Promise<void> | void;
};

type ProductFormErrors = Partial<
  Record<
    | "name"
    | "description"
    | "priority"
    | "minPrice"
    | "maxPrice"
    | "defaultPatternId"
    | "defaultColorId"
    | "images",
    string
  >
>;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Category no longer restricts selectable pattern/color options.
// Returning null means "allow all" for the selectors.
function buildAllowedSets() {
  return {
    allowedPatternIds: null as string[] | null,
    allowedColorIds: null as string[] | null,
  };
}

function hasPreviewableModelUrl(model: Product3DModelSummary) {
  return Boolean(
    model.pbrModelGlbUrl || model.modelGlbUrl || model.baseModelGlbUrl
  );
}

function pickStorefrontPreviewModelId(models: Product3DModelSummary[]) {
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

function pickStorefrontPreviewOptionId(
  selectedIds: string[],
  defaultId: string,
  options: Array<{ id: string }>
) {
  if (
    defaultId &&
    selectedIds.includes(defaultId) &&
    options.some((option) => option.id === defaultId)
  ) {
    return defaultId;
  }

  return "";
}

function getPreviewModelUrl(model?: Product3DModelSummary | null) {
  return (
    model?.pbrModelGlbUrl ||
    model?.modelGlbUrl ||
    model?.baseModelGlbUrl ||
    null
  );
}

function validate(values: ProductFormValues, showImagePicker: boolean) {
  const errors: ProductFormErrors = {};

  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) {
    errors.name = "Vui lòng nhập tên sản phẩm";
  }

  if (!description) {
    errors.description = "Vui lòng nhập mô tả sản phẩm";
  }

  const priorityText = values.priority.trim();
  if (!priorityText) {
    errors.priority = "Vui lòng nhập độ ưu tiên";
  } else {
    const parsedPriority = Number(priorityText);
    if (!Number.isInteger(parsedPriority) || (parsedPriority !== -999 && parsedPriority <= 0)) {
      errors.priority = "Độ ưu tiên phải là -999 hoặc số nguyên lớn hơn 0";
    }
  }

  if (values.minPrice.trim()) {
    const minPrice = Number(values.minPrice.trim());
    if (!Number.isFinite(minPrice) || minPrice < 0) {
      errors.minPrice = "Giá thấp nhất phải là số không âm";
    }
  }

  if (values.maxPrice.trim()) {
    const maxPrice = Number(values.maxPrice.trim());
    if (!Number.isFinite(maxPrice) || maxPrice < 0) {
      errors.maxPrice = "Giá cao nhất phải là số không âm";
    }
  }

  if (values.minPrice.trim() && values.maxPrice.trim()) {
    const minPrice = Number(values.minPrice.trim());
    const maxPrice = Number(values.maxPrice.trim());
    if (Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice > maxPrice) {
      errors.minPrice = "Giá thấp nhất không được lớn hơn giá cao nhất";
    }
  }

  if (
    values.defaultPatternId &&
    !values.patternIds.includes(values.defaultPatternId)
  ) {
    errors.defaultPatternId = "Hoa văn mặc định phải nằm trong danh sách đã chọn";
  }

  if (values.defaultColorId && !values.colorIds.includes(values.defaultColorId)) {
    errors.defaultColorId = "Màu mặc định phải nằm trong danh sách đã chọn";
  }

  if (showImagePicker && values.newImages.length > 0) {
    if (values.newImages.length > PRODUCT_IMAGE_MAX_FILES) {
      errors.images = `Tối đa ${PRODUCT_IMAGE_MAX_FILES} ảnh gallery mỗi lần.`;
    }

    for (const file of values.newImages) {
      if (!isAllowedProductImageType(file.type)) {
        errors.images = `File ${file.name} không đúng định dạng ảnh được hỗ trợ.`;
        break;
      }

      if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
        errors.images = `File ${file.name} vượt quá giới hạn ${Math.floor(
          PRODUCT_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)
        )}MB.`;
        break;
      }
    }
  }

  return errors;
}

export function ProductForm({
  title,
  submitLabel,
  categories,
  patterns,
  colors,
  initialValues,
  onSubmit,
  busy = false,
  dangerSlot,
  showImagePicker = false,
  productId,
  models3d = [],
  onModels3dChanged,
}: Props) {
  const [values, setValues] = React.useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = React.useState<ProductFormErrors>({});
  const [previewPatternId, setPreviewPatternId] = React.useState(() =>
    pickStorefrontPreviewOptionId(
      initialValues.patternIds,
      initialValues.defaultPatternId,
      patterns
    )
  );
  const [previewColorId, setPreviewColorId] = React.useState(() =>
    pickStorefrontPreviewOptionId(
      initialValues.colorIds,
      initialValues.defaultColorId,
      colors
    )
  );
  const [previewModelId, setPreviewModelId] = React.useState(() =>
    pickStorefrontPreviewModelId(models3d)
  );

  React.useEffect(() => {
    setValues(initialValues);
    setErrors({});
    setPreviewPatternId(
      pickStorefrontPreviewOptionId(
        initialValues.patternIds,
        initialValues.defaultPatternId,
        patterns
      )
    );
    setPreviewColorId(
      pickStorefrontPreviewOptionId(
        initialValues.colorIds,
        initialValues.defaultColorId,
        colors
      )
    );
    setPreviewModelId(pickStorefrontPreviewModelId(models3d));
  }, [initialValues]);

  React.useEffect(() => {
    setPreviewPatternId((current) => {
      const stillValid =
        current &&
        values.patternIds.includes(current) &&
        patterns.some((pattern) => pattern.id === current);

      if (stillValid) return current;

      return pickStorefrontPreviewOptionId(
        values.patternIds,
        values.defaultPatternId,
        patterns
      );
    });
  }, [values.patternIds, values.defaultPatternId, patterns]);

  React.useEffect(() => {
    setPreviewColorId((current) => {
      const stillValid =
        current &&
        values.colorIds.includes(current) &&
        colors.some((color) => color.id === current);

      if (stillValid) return current;

      return pickStorefrontPreviewOptionId(
        values.colorIds,
        values.defaultColorId,
        colors
      );
    });
  }, [values.colorIds, values.defaultColorId, colors]);

  React.useEffect(() => {
    setPreviewModelId((current) => {
      if (current && models3d.some((model) => model.id === current)) {
        return current;
      }

      return pickStorefrontPreviewModelId(models3d);
    });
  }, [models3d]);

  const isLandingCover = values.priority.trim() === "-999";
  const allowedOptionSets = React.useMemo(() => buildAllowedSets(), []);

  const previewPatterns = React.useMemo(
    () => patterns.filter((pattern) => values.patternIds.includes(pattern.id)),
    [patterns, values.patternIds]
  );

  const previewColors = React.useMemo(
    () => colors.filter((color) => values.colorIds.includes(color.id)),
    [colors, values.colorIds]
  );

  const previewPattern =
    previewPatterns.find((pattern) => pattern.id === previewPatternId) ?? null;

  const previewColor =
    previewColors.find((color) => color.id === previewColorId) ?? null;

  const previewModel =
    models3d.find((model) => model.id === previewModelId) ?? null;

  const previewModelUrl = getPreviewModelUrl(previewModel);

  function setCategoriesWithRules(nextCategoryIds: string[]) {
    setValues((prev) => ({
      ...prev,
      categoryIds: nextCategoryIds,
    }));
  }

  function toggleCategory(id: string) {
    const nextIds = values.categoryIds.includes(id)
      ? values.categoryIds.filter((item) => item !== id)
      : [...values.categoryIds, id];

    setCategoriesWithRules(nextIds);
  }

  function removeSelectedImage(index: number) {
    setValues((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({ ...prev, images: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = validate(values, showImagePicker);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <div className="text-xl font-semibold text-slate-800">{title}</div>
          <p className="mt-1 text-base leading-7 text-slate-600">
            1 sản phẩm tương ứng với 1 dáng chậu cơ sở. Phần hoa văn và màu sắc được chọn trực tiếp tại sản phẩm, không còn bị giới hạn theo collection.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name" className="text-base font-medium text-slate-800">
            Tên sản phẩm / dáng chậu
          </Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, name: e.target.value }));
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Ví dụ: Chậu tròn thấp"
            aria-invalid={Boolean(errors.name)}
            className="h-12 rounded-xl text-base"
          />
          {errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label
            htmlFor="description"
            className="text-base font-medium text-slate-800"
          >
            Mô tả sản phẩm
          </Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, description: e.target.value }));
              setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Ví dụ: Dáng chậu cơ sở dùng cho bộ sưu tập men gốm thủ công"
            rows={5}
            aria-invalid={Boolean(errors.description)}
            className="rounded-xl text-base leading-7"
          />
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label
                htmlFor="priority"
                className="text-base font-medium text-slate-800"
              >
                Độ ưu tiên
              </Label>
              <Input
                id="priority"
                type="number"
                min="1"
                step="1"
                disabled={isLandingCover}
                value={isLandingCover ? "" : values.priority}
                onChange={(e) => {
                  const nextValue = e.target.value;

                  if (nextValue === "") {
                    setValues((prev) => ({ ...prev, priority: "" }));
                    setErrors((prev) => ({ ...prev, priority: undefined }));
                    return;
                  }

                  const parsed = Number(nextValue);
                  if (Number.isInteger(parsed) && parsed > 0) {
                    setValues((prev) => ({ ...prev, priority: nextValue }));
                    setErrors((prev) => ({ ...prev, priority: undefined }));
                  }
                }}
                placeholder={
                  isLandingCover
                    ? "Đang dùng chế độ cover landing page"
                    : "Ví dụ: 1"
                }
                aria-invalid={Boolean(errors.priority)}
                className="h-12 rounded-xl text-base disabled:bg-slate-100 disabled:text-slate-500"
              />

              {errors.priority ? (
                <p className="text-sm text-red-600">{errors.priority}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  Nhập số nguyên lớn hơn 0 cho thứ tự ưu tiên thông thường.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <label className="flex items-start gap-3 text-base text-slate-800">
                <input
                  type="checkbox"
                  checked={isLandingCover}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    setValues((prev) => ({
                      ...prev,
                      priority: checked
                        ? "-999"
                        : prev.priority.trim() === "-999"
                          ? "1"
                          : prev.priority.trim() === ""
                            ? "1"
                            : prev.priority,
                    }));

                    setErrors((prev) => ({ ...prev, priority: undefined }));
                  }}
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />
                <span>
                  Đặt sản phẩm này làm ảnh cover ở landing page
                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    Khi bật mục này, hệ thống sẽ tự lưu priority = -999. Đây là giá trị đặc biệt để đánh dấu sản phẩm dùng làm cover trên landing page.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="minPrice"
              className="text-base font-medium text-slate-800"
            >
              Giá thấp nhất
            </Label>
            <Input
              id="minPrice"
              type="number"
              min="0"
              step="0.01"
              value={values.minPrice}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, minPrice: e.target.value }));
                setErrors((prev) => ({ ...prev, minPrice: undefined }));
              }}
              placeholder="1200"
              aria-invalid={Boolean(errors.minPrice)}
              className="h-12 rounded-xl text-base"
            />
            {errors.minPrice ? (
              <p className="text-sm text-red-600">{errors.minPrice}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="maxPrice"
              className="text-base font-medium text-slate-800"
            >
              Giá cao nhất
            </Label>
            <Input
              id="maxPrice"
              type="number"
              min="0"
              step="0.01"
              value={values.maxPrice}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, maxPrice: e.target.value }));
                setErrors((prev) => ({ ...prev, maxPrice: undefined }));
              }}
              placeholder="1500"
              aria-invalid={Boolean(errors.maxPrice)}
              className="h-12 rounded-xl text-base"
            />
            {errors.maxPrice ? (
              <p className="text-sm text-red-600">{errors.maxPrice}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <label className="flex items-start gap-3 text-base text-slate-800">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />
            <span>
              Sản phẩm đang được sử dụng
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Bỏ chọn nếu anh muốn tạm ngưng sản phẩm này mà không xóa khỏi hệ thống.
              </span>
            </span>
          </label>
        </div>
      </Card>

      <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <div className="text-xl font-semibold text-slate-800">Collection áp dụng</div>
          <p className="mt-1 text-base leading-7 text-slate-600">
            Collection chỉ dùng để nhóm sản phẩm. Hoa văn và màu sắc được chọn trực tiếp tại sản phẩm.
          </p>
        </div>

        {categories.length === 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
            Hiện chưa có collection nào.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-base hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={values.categoryIds.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="mt-1 h-5 w-5 rounded border-slate-300"
              />
              <div>
                <div className="font-medium text-slate-800">{cat.name}</div>
                <div className="mt-1 leading-6 text-slate-600">{cat.description}</div>
                <div className="mt-2 text-sm text-slate-500">
                  Tất cả hoa văn • Tất cả màu
                </div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <ProductPatternSelector
        patterns={patterns}
        selectedIds={values.patternIds}
        defaultPatternId={values.defaultPatternId}
        allowedIds={allowedOptionSets.allowedPatternIds}
        onSelectedIdsChange={(patternIds) => {
          setValues((prev) => ({
            ...prev,
            patternIds,
            defaultPatternId: patternIds.includes(prev.defaultPatternId)
              ? prev.defaultPatternId
              : "",
          }));
          setErrors((prev) => ({ ...prev, defaultPatternId: undefined }));
        }}
        onDefaultPatternIdChange={(defaultPatternId) => {
          setValues((prev) => ({ ...prev, defaultPatternId }));
          setErrors((prev) => ({ ...prev, defaultPatternId: undefined }));
        }}
      />
      {errors.defaultPatternId ? (
        <p className="-mt-3 text-sm text-red-600">{errors.defaultPatternId}</p>
      ) : null}

      <ProductColorSelector
        colors={colors}
        selectedIds={values.colorIds}
        defaultColorId={values.defaultColorId}
        allowedIds={allowedOptionSets.allowedColorIds}
        onSelectedIdsChange={(colorIds) => {
          setValues((prev) => ({
            ...prev,
            colorIds,
            defaultColorId: colorIds.includes(prev.defaultColorId)
              ? prev.defaultColorId
              : "",
          }));
          setErrors((prev) => ({ ...prev, defaultColorId: undefined }));
        }}
        onDefaultColorIdChange={(defaultColorId) => {
          setValues((prev) => ({ ...prev, defaultColorId }));
          setErrors((prev) => ({ ...prev, defaultColorId: undefined }));
        }}
      />
      {errors.defaultColorId ? (
        <p className="-mt-3 text-sm text-red-600">{errors.defaultColorId}</p>
      ) : null}

      <Product3DModelForm
        productId={productId}
        models={models3d}
        disabled={busy}
        onChanged={onModels3dChanged}
        selectedModelId={previewModelId}
        onSelectedModelIdChange={setPreviewModelId}
      />

      <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <div className="text-xl font-semibold text-slate-800">
            Preview giống khách hàng
          </div>
          <p className="mt-1 text-base leading-7 text-slate-600">
            Admin có thể kiểm tra trước đúng model 3D, hoa văn và màu sắc mà người dùng sẽ thấy ở storefront.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-2">
            <Label className="text-base font-medium text-slate-800">
              Model 3D để preview
            </Label>
            <select
              value={previewModelId}
              onChange={(e) => setPreviewModelId(e.target.value)}
              className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              disabled={models3d.length === 0}
            >
              {models3d.length === 0 ? (
                <option value="">Chưa có model 3D</option>
              ) : (
                models3d.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.sourceImageName || model.id}
                    {model.isDefault ? " • default" : ""}
                    {model.status ? ` • ${model.status}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid gap-2">
            <Label className="text-base font-medium text-slate-800">
              Hoa văn preview
            </Label>
            <select
              value={previewPatternId}
              onChange={(e) => setPreviewPatternId(e.target.value)}
              className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              disabled={previewPatterns.length === 0}
            >
              <option value="">Không áp dụng hoa văn</option>
              {previewPatterns.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.name}
                  {values.defaultPatternId === pattern.id ? " • mặc định" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label className="text-base font-medium text-slate-800">
              Màu preview
            </Label>
            <select
              value={previewColorId}
              onChange={(e) => setPreviewColorId(e.target.value)}
              className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              disabled={previewColors.length === 0}
            >
              <option value="">Không áp dụng màu</option>
              {previewColors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                  {values.defaultColorId === color.id ? " • mặc định" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">Model:</span>{" "}
            {previewModel
              ? `${previewModel.sourceImageName || previewModel.id}${
                  previewModel.isDefault ? " • default" : ""
                }`
              : "Chưa có"}
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">Hoa văn:</span>{" "}
            {previewPattern?.name || "Không áp dụng"}
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">Màu:</span>{" "}
            {previewColor?.name || "Không áp dụng"}
          </div>
        </div>

        <ProductLivePreview
          modelUrl={previewModelUrl}
          selectedPattern={previewPattern}
          selectedColor={previewColor}
        />
      </Card>

      {showImagePicker && (
        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div>
            <div className="text-xl font-semibold text-slate-800">Gallery ảnh sản phẩm</div>
            <p className="mt-1 text-base leading-7 text-slate-600">
              Chọn một hoặc nhiều ảnh gallery thường để tải lên cùng sản phẩm. Đây là luồng riêng, không phải model 3D cũng không phải asset pack cũ.
            </p>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="product-images"
              className="text-base font-medium text-slate-800"
            >
              Chọn ảnh gallery
            </Label>
            <Input
              id="product-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setValues((prev) => ({
                  ...prev,
                  newImages: files,
                }));
                setErrors((prev) => ({ ...prev, images: undefined }));
              }}
              aria-invalid={Boolean(errors.images)}
              className="h-12 rounded-xl text-base file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-sm leading-6 text-slate-500">
              Tối đa {PRODUCT_IMAGE_MAX_FILES} ảnh. Mỗi ảnh không vượt quá 5MB.
            </p>
            {errors.images ? (
              <p className="text-sm text-red-600">{errors.images}</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <label className="flex items-start gap-3 text-base text-slate-800">
              <input
                type="checkbox"
                checked={values.markFirstAsRender}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    markFirstAsRender: e.target.checked,
                  }))
                }
                className="mt-1 h-5 w-5 rounded border-slate-300"
              />
              <span>
                Đặt ảnh đầu tiên đã chọn làm ảnh hiển thị chính
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Nếu bật mục này, ảnh đầu tiên trong danh sách sẽ được dùng làm ảnh đại diện cho gallery.
                </span>
              </span>
            </label>
          </div>

          {values.newImages.length > 0 && (
            <div className="grid gap-3">
              {values.newImages.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-slate-800">
                      {file.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {formatFileSize(file.size)}
                      {index === 0 && values.markFirstAsRender ? " • Ảnh chính" : ""}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeSelectedImage(index)}
                    className="h-10 rounded-xl px-4 text-base"
                  >
                    Bỏ ảnh này
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl px-5 text-base font-semibold"
        >
          {busy ? "Đang xử lý..." : submitLabel}
        </Button>
        {dangerSlot}
      </div>
    </form>
  );
}
