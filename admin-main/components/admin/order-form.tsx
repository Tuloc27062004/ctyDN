"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number];

export type OrderUserOption = {
  id: string;
  fullName: string;
  email: string;
  companyName: string | null;
};

export type OrderProductPatternOption = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

export type OrderProductColorOption = {
  id: string;
  name: string;
  code: string;
  hex: string;
  isActive: boolean;
};

export type OrderProductModelOption = {
  id: string;
  status: "DRAFT" | "PROCESSING" | "READY" | "FAILED";
  provider: "TRIPO";
  previewImageUrl: string | null;
  modelGlbUrl: string | null;
  baseModelGlbUrl: string | null;
  pbrModelGlbUrl: string | null;
  isDefault: boolean;
  sourceImageName: string | null;
  createdAt: string;
};

export type OrderProductOption = {
  id: string;
  name: string;
  defaultPatternId: string | null;
  defaultColorId: string | null;
  patterns: OrderProductPatternOption[];
  colors: OrderProductColorOption[];
  models3d: OrderProductModelOption[];
};

export type OrderFormItemValues = {
  productId: string;
  patternId: string;
  colorId: string;
  model3dId: string;
  quantity: string;
};

export type OrderFormValues = {
  userId: string;
  status: OrderStatusValue;
  note: string;
  items: OrderFormItemValues[];
};

type Props = {
  title: string;
  submitLabel: string;
  users: OrderUserOption[];
  products: OrderProductOption[];
  initialValues: OrderFormValues;
  onSubmit: (values: OrderFormValues) => Promise<void>;
  busy?: boolean;
  dangerSlot?: React.ReactNode;
};

type ItemError = {
  productId?: string;
  patternId?: string;
  colorId?: string;
  model3dId?: string;
  quantity?: string;
};

type OrderFormErrors = {
  userId?: string;
  note?: string;
  items?: string;
  itemErrors?: ItemError[];
};

function getStatusLabel(status: OrderStatusValue) {
  switch (status) {
    case "PENDING":
      return "Chờ xử lý";
    case "IN_PROGRESS":
      return "Đang thực hiện";
    case "DONE":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

function getModelStatusLabel(status: OrderProductModelOption["status"]) {
  switch (status) {
    case "READY":
      return "READY";
    case "PROCESSING":
      return "PROCESSING";
    case "FAILED":
      return "FAILED";
    case "DRAFT":
    default:
      return "DRAFT";
  }
}

function buildSelectionKey(item: OrderFormItemValues) {
  return [
    item.productId,
    item.patternId.trim() || "-",
    item.colorId.trim() || "-",
    item.model3dId.trim() || "-",
  ].join("::");
}

function getDefaultSelections(product: OrderProductOption | undefined) {
  if (!product) {
    return {
      patternId: "",
      colorId: "",
      model3dId: "",
    };
  }

  const defaultReadyModel =
    product.models3d.find((model) => model.isDefault && model.status === "READY") ??
    product.models3d.find((model) => model.status === "READY") ??
    product.models3d.find((model) => model.isDefault) ??
    product.models3d[0] ??
    null;

  return {
    patternId: product.defaultPatternId ?? product.patterns[0]?.id ?? "",
    colorId: product.defaultColorId ?? product.colors[0]?.id ?? "",
    model3dId: defaultReadyModel?.id ?? "",
  };
}

function validate(values: OrderFormValues, productMap: Map<string, OrderProductOption>) {
  const errors: OrderFormErrors = {};
  const itemErrors: ItemError[] = values.items.map(() => ({}));

  if (!values.userId) {
    errors.userId = "Vui lòng chọn khách hàng.";
  }

  if (values.note.trim().length > 5000) {
    errors.note = "Ghi chú quá dài.";
  }

  if (values.items.length === 0) {
    errors.items = "Vui lòng thêm ít nhất một sản phẩm.";
  }

  const seen = new Set<string>();

  values.items.forEach((item, index) => {
    const product = productMap.get(item.productId);

    if (!item.productId) {
      itemErrors[index].productId = "Vui lòng chọn sản phẩm.";
    } else if (!product) {
      itemErrors[index].productId = "Sản phẩm không hợp lệ.";
    }

    const quantity = Number(item.quantity);

    if (item.quantity.trim() === "") {
      itemErrors[index].quantity = "Vui lòng nhập số lượng.";
    } else if (!Number.isInteger(quantity) || quantity <= 0) {
      itemErrors[index].quantity = "Số lượng phải là số nguyên dương.";
    }

    if (product && item.patternId && !product.patterns.some((entry) => entry.id === item.patternId)) {
      itemErrors[index].patternId = "Hoa văn không thuộc sản phẩm này.";
    }

    if (product && item.colorId && !product.colors.some((entry) => entry.id === item.colorId)) {
      itemErrors[index].colorId = "Màu không thuộc sản phẩm này.";
    }

    if (product && item.model3dId && !product.models3d.some((entry) => entry.id === item.model3dId)) {
      itemErrors[index].model3dId = "Model 3D không thuộc sản phẩm này.";
    }

    const selectionKey = buildSelectionKey(item);

    if (item.productId && seen.has(selectionKey)) {
      itemErrors[index].productId =
        "Tổ hợp sản phẩm + hoa văn + màu + model 3D này đã có trong đơn.";
    }

    if (item.productId) {
      seen.add(selectionKey);
    }
  });

  if (
    itemErrors.some(
      (x) => x.productId || x.patternId || x.colorId || x.model3dId || x.quantity
    )
  ) {
    errors.itemErrors = itemErrors;
  }

  return errors;
}

export function OrderForm({
  title,
  submitLabel,
  users,
  products,
  initialValues,
  onSubmit,
  busy = false,
  dangerSlot,
}: Props) {
  const [values, setValues] = React.useState<OrderFormValues>(initialValues);
  const [errors, setErrors] = React.useState<OrderFormErrors>({});

  const productMap = React.useMemo(
    () => new Map(products.map((product) => [product.id, product] as const)),
    [products]
  );

  React.useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  function updateItem(index: number, patch: Partial<OrderFormItemValues>) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));

    setErrors((prev) => {
      if (!prev.itemErrors) return prev;

      const nextItemErrors = [...prev.itemErrors];
      nextItemErrors[index] = {
        ...nextItemErrors[index],
        ...(patch.productId !== undefined ? { productId: undefined } : {}),
        ...(patch.patternId !== undefined ? { patternId: undefined } : {}),
        ...(patch.colorId !== undefined ? { colorId: undefined } : {}),
        ...(patch.model3dId !== undefined ? { model3dId: undefined } : {}),
        ...(patch.quantity !== undefined ? { quantity: undefined } : {}),
      };

      return {
        ...prev,
        itemErrors: nextItemErrors,
        items: undefined,
      };
    });
  }

  function handleProductChange(index: number, productId: string) {
    const product = productMap.get(productId);
    const defaults = getDefaultSelections(product);

    updateItem(index, {
      productId,
      patternId: defaults.patternId,
      colorId: defaults.colorId,
      model3dId: defaults.model3dId,
    });
  }

  function addItem() {
    setValues((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          patternId: "",
          colorId: "",
          model3dId: "",
          quantity: "1",
        },
      ],
    }));

    setErrors((prev) => ({
      ...prev,
      items: undefined,
      itemErrors: [...(prev.itemErrors ?? []), {}],
    }));
  }

  function removeItem(index: number) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

    setErrors((prev) => ({
      ...prev,
      itemErrors: prev.itemErrors?.filter((_, i) => i !== index),
      items: undefined,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = validate(values, productMap);
    setErrors(nextErrors);

    if (
      nextErrors.userId ||
      nextErrors.note ||
      nextErrors.items ||
      nextErrors.itemErrors
    ) {
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
            Vui lòng chọn khách hàng, trạng thái và ghi chú nếu cần.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="userId" className="text-base font-medium text-slate-800">
            Khách hàng
          </Label>
          <select
            id="userId"
            className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-800"
            value={values.userId}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, userId: e.target.value }));
              setErrors((prev) => ({ ...prev, userId: undefined }));
            }}
            disabled={busy}
          >
            <option value="">Chọn khách hàng</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} - {user.email}
                {user.companyName ? ` - ${user.companyName}` : ""}
              </option>
            ))}
          </select>
          {errors.userId ? (
            <p className="text-sm text-red-600">{errors.userId}</p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="status" className="text-base font-medium text-slate-800">
              Trạng thái đơn hàng
            </Label>
            <select
              id="status"
              className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-800"
              value={values.status}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  status: e.target.value as OrderStatusValue,
                }))
              }
              disabled={busy}
            >
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note" className="text-base font-medium text-slate-800">
              Ghi chú
            </Label>
            <Textarea
              id="note"
              value={values.note}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, note: e.target.value }));
                setErrors((prev) => ({ ...prev, note: undefined }));
              }}
              rows={4}
              placeholder="Nhập ghi chú nếu cần"
              disabled={busy}
              className="rounded-xl text-base leading-7"
            />
            {errors.note ? (
              <p className="text-sm text-red-600">{errors.note}</p>
            ) : (
              <p className="text-sm text-slate-500">
                Có thể để trống nếu không cần ghi chú thêm.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-800">
              Danh sách sản phẩm
            </div>
            <p className="mt-1 text-base leading-7 text-slate-600">
              Chọn sản phẩm, cấu hình hoa văn / màu / model 3D và nhập số lượng cho từng dòng.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            disabled={busy}
            className="h-11 rounded-xl px-5 text-base"
          >
            Thêm sản phẩm
          </Button>
        </div>

        {errors.items ? <p className="text-sm text-red-600">{errors.items}</p> : null}

        <div className="grid gap-4">
          {values.items.map((item, index) => {
            const product = productMap.get(item.productId);
            const itemError = errors.itemErrors?.[index];

            return (
              <div
                key={`${index}-${item.productId || "empty"}`}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-800">
                      Dòng sản phẩm #{index + 1}
                    </div>
                    <div className="text-sm text-slate-500">
                      {product
                        ? `Đang chọn: ${product.name}`
                        : "Chưa chọn sản phẩm cho dòng này"}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeItem(index)}
                    disabled={busy || values.items.length === 1}
                    className="h-10 rounded-xl px-4 text-base"
                  >
                    Xóa dòng
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-base font-medium text-slate-800">Sản phẩm</Label>
                    <select
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-800"
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      disabled={busy}
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map((productOption) => (
                        <option key={productOption.id} value={productOption.id}>
                          {productOption.name}
                        </option>
                      ))}
                    </select>
                    {itemError?.productId ? (
                      <p className="text-sm text-red-600">{itemError.productId}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-base font-medium text-slate-800">Số lượng</Label>
                    <Input
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      placeholder="Nhập số lượng"
                      disabled={busy}
                      className="h-12 rounded-xl text-base"
                    />
                    {itemError?.quantity ? (
                      <p className="text-sm text-red-600">{itemError.quantity}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="grid gap-2">
                    <Label className="text-base font-medium text-slate-800">Hoa văn</Label>
                    <select
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-800"
                      value={item.patternId}
                      onChange={(e) => updateItem(index, { patternId: e.target.value })}
                      disabled={busy || !product}
                    >
                      <option value="">Không chọn hoa văn</option>
                      {(product?.patterns ?? []).map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {pattern.name} ({pattern.code})
                        </option>
                      ))}
                    </select>
                    {itemError?.patternId ? (
                      <p className="text-sm text-red-600">{itemError.patternId}</p>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {product?.patterns.length
                          ? "Để trống nếu dòng này không cần chốt hoa văn cụ thể."
                          : "Sản phẩm này hiện chưa cấu hình hoa văn."}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-base font-medium text-slate-800">Màu sắc</Label>
                    <select
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-800"
                      value={item.colorId}
                      onChange={(e) => updateItem(index, { colorId: e.target.value })}
                      disabled={busy || !product}
                    >
                      <option value="">Không chọn màu</option>
                      {(product?.colors ?? []).map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.name} ({color.code}) - {color.hex}
                        </option>
                      ))}
                    </select>
                    {itemError?.colorId ? (
                      <p className="text-sm text-red-600">{itemError.colorId}</p>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {product?.colors.length
                          ? "Để trống nếu dòng này không cần chốt màu cụ thể."
                          : "Sản phẩm này hiện chưa cấu hình màu."}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-base font-medium text-slate-800">Model 3D</Label>
                    <select
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-800"
                      value={item.model3dId}
                      onChange={(e) => updateItem(index, { model3dId: e.target.value })}
                      disabled={busy || !product}
                    >
                      <option value="">Không gắn model 3D</option>
                      {(product?.models3d ?? []).map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.isDefault ? "[Default] " : ""}
                          {model.sourceImageName || model.id} - {getModelStatusLabel(model.status)}
                        </option>
                      ))}
                    </select>
                    {itemError?.model3dId ? (
                      <p className="text-sm text-red-600">{itemError.model3dId}</p>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {product?.models3d.length
                          ? "Server sẽ chỉ chấp nhận model ở trạng thái READY khi lưu đơn."
                          : "Sản phẩm này hiện chưa có model 3D."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl px-6 text-base font-semibold"
        >
          {busy ? "Đang xử lý..." : submitLabel}
        </Button>

        {dangerSlot}
      </div>
    </form>
  );
}
