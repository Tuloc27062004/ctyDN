"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import {
  OrderForm,
  OrderFormValues,
  OrderProductOption,
  OrderUserOption,
} from "@/components/admin/order-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

const optionsSchema = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
      companyName: z.string().nullable(),
    })
  ),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      defaultPatternId: z.string().nullable(),
      defaultColorId: z.string().nullable(),
      productPatterns: z.array(
        z.object({
          patternId: z.string(),
          pattern: z.object({
            id: z.string(),
            name: z.string(),
            code: z.string(),
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
            isActive: z.boolean(),
          }),
        })
      ),
      models3d: z.array(
        z.object({
          id: z.string(),
          status: z.enum(["DRAFT", "PROCESSING", "READY", "FAILED"]),
          provider: z.enum(["TRIPO"]),
          previewImageUrl: z.string().nullable(),
          modelGlbUrl: z.string().nullable(),
          baseModelGlbUrl: z.string().nullable(),
          pbrModelGlbUrl: z.string().nullable(),
          isDefault: z.boolean(),
          sourceImageName: z.string().nullable(),
          createdAt: z.string(),
        })
      ),
    })
  ),
});

const orderDetailSchema = z.object({
  order: z.object({
    id: z.string(),
    userId: z.string(),
    status: z.enum(ORDER_STATUS_OPTIONS),
    note: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        productId: z.string(),
        patternId: z.string().nullable(),
        colorId: z.string().nullable(),
        quantity: z.number(),
        patternNameSnapshot: z.string().nullable(),
        colorNameSnapshot: z.string().nullable(),
        model3dIdSnapshot: z.string().nullable(),
        product: z.object({
          id: z.string(),
          name: z.string(),
        }),
      })
    ),
  }),
});

type OrderDetail = z.infer<typeof orderDetailSchema>["order"];

function mapProducts(products: z.infer<typeof optionsSchema>["products"]): OrderProductOption[] {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    defaultPatternId: product.defaultPatternId,
    defaultColorId: product.defaultColorId,
    patterns: product.productPatterns.map((entry) => ({
      id: entry.pattern.id,
      name: entry.pattern.name,
      code: entry.pattern.code,
      isActive: entry.pattern.isActive,
    })),
    colors: product.productColors.map((entry) => ({
      id: entry.color.id,
      name: entry.color.name,
      code: entry.color.code,
      hex: entry.color.hex,
      isActive: entry.color.isActive,
    })),
    models3d: product.models3d,
  }));
}

function toPayload(values: OrderFormValues) {
  return {
    userId: values.userId,
    status: values.status,
    note: values.note.trim(),
    items: values.items.map((item) => ({
      productId: item.productId,
      patternId: item.patternId || null,
      colorId: item.colorId || null,
      model3dId: item.model3dId || null,
      quantity: Number(item.quantity),
    })),
  };
}

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

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = React.useState<OrderUserOption[]>([]);
  const [products, setProducts] = React.useState<OrderProductOption[]>([]);
  const [order, setOrder] = React.useState<OrderDetail | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [confirmSaveOpen, setConfirmSaveOpen] = React.useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<OrderFormValues | null>(null);

  async function loadAll() {
    const [optionsRes, orderRes] = await Promise.all([
      fetch("/api/admin/orders/options").then(async (res) =>
        optionsSchema.parse(await res.json())
      ),
      fetch(`/api/admin/orders/${orderId}`).then(async (res) =>
        orderDetailSchema.parse(await res.json())
      ),
    ]);

    setUsers(optionsRes.users);
    setProducts(mapProducts(optionsRes.products));
    setOrder(orderRes.order);
  }

  React.useEffect(() => {
    if (!orderId) return;

    setLoading(true);

    loadAll()
      .catch((err) => {
        console.error("Không tải được trang đơn hàng:", err);
        setUsers([]);
        setProducts([]);
        setOrder(null);

        toast({
          title: "Không tải được đơn hàng",
          description: "Dữ liệu đơn hàng hoặc danh sách lựa chọn hiện không khả dụng.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, toast]);

  async function handleSubmit(values: OrderFormValues) {
    setPendingValues(values);
    setConfirmSaveOpen(true);
  }

  async function confirmSave() {
    if (!pendingValues) return;

    try {
      setBusy(true);

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(pendingValues)),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật đơn hàng"));
      }

      toast({
        title: "Đã lưu thay đổi",
        description: "Thông tin đơn hàng đã được cập nhật.",
      });

      await loadAll();
      setConfirmSaveOpen(false);
    } catch (e: any) {
      toast({
        title: "Lưu không thành công",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setPendingValues(null);
    }
  }

  async function confirmDelete() {
    try {
      setDeleting(true);

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể xóa đơn hàng"));
      }

      toast({
        title: "Đã xóa đơn hàng",
        description: "Đơn hàng đã được xóa khỏi hệ thống.",
      });

      router.push("/admin/orders");
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Xóa không thành công",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="Chỉnh sửa đơn hàng"
        description="Đang tải thông tin đơn hàng..."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/orders">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Đang tải dữ liệu...
        </div>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell
        title="Chỉnh sửa đơn hàng"
        description="Không tìm thấy đơn hàng cần chỉnh sửa."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/orders">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Không thể tải đơn hàng được yêu cầu.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Chỉnh sửa đơn hàng"
      description="Cập nhật thông tin hoặc xóa đơn hàng B2B thủ công."
      right={
        <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
          <Link href="/admin/orders">Hủy / Quay lại</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Mã đơn hàng:</span> {order.id}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Số dòng cấu hình:</span> {order.items.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Cập nhật lần cuối:</span>{" "}
          {new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(order.updatedAt))}
        </div>
      </div>

      <OrderForm
        title="Thông tin đơn hàng"
        submitLabel="Lưu thay đổi"
        users={users}
        products={products}
        busy={busy}
        initialValues={{
          userId: order.userId,
          status: order.status,
          note: order.note,
          items: order.items.length
            ? order.items.map((item) => ({
                productId: item.productId,
                patternId: item.patternId ?? "",
                colorId: item.colorId ?? "",
                model3dId: item.model3dIdSnapshot ?? "",
                quantity: String(item.quantity),
              }))
            : [
                {
                  productId: "",
                  patternId: "",
                  colorId: "",
                  model3dId: "",
                  quantity: "1",
                },
              ],
        }}
        onSubmit={handleSubmit}
        dangerSlot={
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleting}
            className="h-11 rounded-xl border-red-300 px-5 text-base text-red-700 hover:bg-red-50"
          >
            {deleting ? "Đang xóa..." : "Xóa đơn hàng"}
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmSaveOpen}
        onOpenChange={(open) => {
          setConfirmSaveOpen(open);
          if (!open) setPendingValues(null);
        }}
        title="Lưu thay đổi cho đơn hàng này?"
        description="Vui lòng xác nhận trước khi cập nhật thông tin đơn hàng."
        confirmText={busy ? "Đang lưu..." : "Lưu thay đổi"}
        onConfirm={confirmSave}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Xóa đơn hàng này?"
        description="Thao tác này không thể hoàn tác."
        confirmText={deleting ? "Đang xóa..." : "Xóa đơn hàng"}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
}
