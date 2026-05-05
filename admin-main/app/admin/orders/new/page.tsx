"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/admin/page-shell";
import {
  OrderForm,
  OrderFormValues,
  OrderProductOption,
  OrderUserOption,
} from "@/components/admin/order-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = React.useState<OrderUserOption[]>([]);
  const [products, setProducts] = React.useState<OrderProductOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<OrderFormValues | null>(null);

  React.useEffect(() => {
    let ignore = false;

    async function loadOptions() {
      try {
        setLoading(true);

        const res = await fetch("/api/admin/orders/options");
        const data = await res.json();
        const parsed = optionsSchema.parse(data);

        if (!ignore) {
          setUsers(parsed.users);
          setProducts(mapProducts(parsed.products));
        }
      } catch (err) {
        console.error("Không tải được dữ liệu tạo đơn hàng:", err);

        if (!ignore) {
          setUsers([]);
          setProducts([]);

          toast({
            title: "Không tải được dữ liệu",
            description: "Không thể lấy danh sách khách hàng và sản phẩm.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      ignore = true;
    };
  }, [toast]);

  async function handleSubmit(values: OrderFormValues) {
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function confirmCreate() {
    if (!pendingValues) return;

    try {
      setBusy(true);

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(pendingValues)),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo đơn hàng"));
      }

      toast({
        title: "Đã tạo đơn hàng",
        description: "Đơn hàng mới đã được lưu thành công.",
      });

      const newId = data?.order?.id;
      if (newId) {
        router.push(`/admin/orders/${newId}`);
      } else {
        router.push("/admin/orders");
      }

      router.refresh();
    } catch (e: any) {
      toast({
        title: "Tạo đơn hàng không thành công",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setPendingValues(null);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="Tạo đơn hàng mới"
        description="Đang tải dữ liệu cần thiết..."
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

  return (
    <PageShell
      title="Tạo đơn hàng mới"
      description="Chọn khách hàng, chọn sản phẩm/cấu hình và tạo đơn hàng B2B thủ công."
      right={
        <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
          <Link href="/admin/orders">Hủy / Quay lại</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Số khách hàng:</span> {users.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Số sản phẩm:</span> {products.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Trạng thái mặc định:</span> Chờ xử lý
        </div>
      </div>

      <OrderForm
        title="Thông tin đơn hàng mới"
        submitLabel="Lưu và tạo đơn hàng"
        users={users}
        products={products}
        busy={busy}
        initialValues={{
          userId: "",
          status: "PENDING",
          note: "",
          items: [
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
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPendingValues(null);
        }}
        title="Tạo đơn hàng này?"
        description="Vui lòng xác nhận trước khi lưu đơn hàng mới."
        confirmText={busy ? "Đang tạo..." : "Lưu và tạo đơn hàng"}
        onConfirm={confirmCreate}
      />
    </PageShell>
  );
}
