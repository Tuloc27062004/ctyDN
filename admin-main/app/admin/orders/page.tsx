"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

const orderSchema = z.object({
  id: z.string(),
  status: z.enum(ORDER_STATUS_OPTIONS),
  note: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    companyName: z.string().nullable().optional(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
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
});

const listSchema = z.object({
  orders: z.array(orderSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasPrevPage: z.boolean(),
    hasNextPage: z.boolean(),
  }),
});

type Order = z.infer<typeof orderSchema>;
type Pagination = z.infer<typeof listSchema>["pagination"];
type StatusFilter = "ALL" | (typeof ORDER_STATUS_OPTIONS)[number];

function getApiErrorMessage(data: any, fallback: string) {
  if (data?.error && typeof data.error === "string") return data.error;
  return fallback;
}

function getStatusLabel(status: (typeof ORDER_STATUS_OPTIONS)[number]) {
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

function getStatusBadgeClass(status: (typeof ORDER_STATUS_OPTIONS)[number]) {
  switch (status) {
    case "DONE":
      return "bg-slate-100 text-slate-700";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderItemSummary(item: Order["items"][number]) {
  const parts = [item.product.name, `× ${item.quantity}`];

  if (item.patternNameSnapshot) {
    parts.push(`Hoa văn: ${item.patternNameSnapshot}`);
  }

  if (item.colorNameSnapshot) {
    parts.push(`Màu: ${item.colorNameSnapshot}`);
  }

  if (item.model3dIdSnapshot) {
    parts.push("3D");
  }

  return parts.join(" • ");
}

export default function AdminOrdersPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Order | null>(null);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [reloadKey, setReloadKey] = React.useState(0);

  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        if (search) {
          params.set("q", search);
        }

        if (statusFilter !== "ALL") {
          params.set("status", statusFilter);
        }

        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        const data = await res.json();
        const parsed = listSchema.parse(data);

        if (!ignore) {
          setItems(parsed.orders);
          setPagination(parsed.pagination);
        }
      } catch (err) {
        console.error("Không tải được danh sách đơn hàng:", err);

        if (!ignore) {
          setItems([]);
          setPagination({
            page: 1,
            pageSize,
            totalItems: 0,
            totalPages: 1,
            hasPrevPage: false,
            hasNextPage: false,
          });

          toast({
            title: "Không tải được danh sách đơn hàng",
            description: "Vui lòng thử lại sau.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [page, pageSize, search, statusFilter, reloadKey, toast]);

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/admin/orders/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể xóa đơn hàng"));
      }

      toast({
        title: "Đã xóa đơn hàng",
        description: `Đơn hàng của ${deleteTarget.user.fullName} đã được xóa.`,
      });

      setDeleteTarget(null);
      setReloadKey((x) => x + 1);
    } catch (e: any) {
      toast({
        title: "Xóa không thành công",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  const startItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;

  const endItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems
  );

  const totalPending = items.filter((item) => item.status === "PENDING").length;
  const totalInProgress = items.filter((item) => item.status === "IN_PROGRESS").length;
  const totalDone = items.filter((item) => item.status === "DONE").length;

  return (
    <PageShell
      title="Quản lý đơn hàng"
      description="Tạo mới, cập nhật, xóa và theo dõi đơn hàng của khách hàng."
      right={
        <Button asChild className="h-11 rounded-xl px-5 text-base font-semibold">
          <Link href="/admin/orders/new">Tạo đơn hàng mới</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Tổng số đơn:</span> {pagination.totalItems}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Chờ xử lý:</span> {totalPending}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Đang thực hiện:</span> {totalInProgress}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Hoàn thành:</span> {totalDone}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-base font-medium text-slate-800">
              Tìm kiếm
            </label>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên khách hàng, công ty, sản phẩm, hoa văn, màu hoặc ghi chú"
              className="h-12 rounded-xl text-base"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-slate-800">
              Trạng thái
            </label>
            <select
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="ALL">Tất cả đơn hàng</option>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-base text-slate-600">
            Hiển thị <span className="font-medium">{startItem}</span>-
            <span className="font-medium">{endItem}</span> trong tổng số{" "}
            <span className="font-medium">{pagination.totalItems}</span> đơn hàng
          </div>

          <div className="flex items-center gap-3">
            <span className="text-base text-slate-600">Số dòng mỗi trang</span>
            <select
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-base"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Đang tải danh sách đơn hàng...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Không tìm thấy đơn hàng nào.
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((order) => (
              <Card
                key={order.id}
                className="rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid gap-3">
                    <div>
                      <div className="text-xl font-semibold text-slate-800">
                        {order.user.fullName}
                      </div>
                      <div className="mt-1 text-base text-slate-600">
                        {order.user.email}
                      </div>
                    </div>

                    <div className="grid gap-2 text-base text-slate-700">
                      <div>
                        <span className="font-medium">Công ty:</span>{" "}
                        {order.user.companyName || "-"}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">Trạng thái:</span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div>
                        <span className="font-medium">Ghi chú:</span>{" "}
                        {order.note.trim() ? order.note : "-"}
                      </div>

                      <div>
                        <span className="font-medium">Cấu hình:</span>{" "}
                        {order.items.length
                          ? order.items.map(renderItemSummary).join(", ")
                          : "-"}
                      </div>

                      <div className="text-slate-500">
                        <span className="font-medium text-slate-700">Ngày tạo:</span>{" "}
                        {formatDateTime(order.createdAt)}
                      </div>

                      <div className="text-slate-500">
                        <span className="font-medium text-slate-700">
                          Cập nhật lần cuối:
                        </span>{" "}
                        {formatDateTime(order.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      asChild
                      className="h-11 rounded-xl px-5 text-base font-semibold"
                    >
                      <Link href={`/admin/orders/${order.id}`}>
                        Xem / Chỉnh sửa
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setDeleteTarget(order)}
                      className="h-11 rounded-xl border-red-300 px-5 text-base text-red-700 hover:bg-red-50"
                    >
                      Xóa đơn hàng
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-base text-slate-600">
              Trang <span className="font-medium">{pagination.page}</span> /{" "}
              <span className="font-medium">{pagination.totalPages}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="h-11 rounded-xl px-5 text-base"
              >
                Trang trước
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={!pagination.hasNextPage}
                className="h-11 rounded-xl px-5 text-base"
              >
                Trang sau
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xóa đơn hàng này?"
        description={
          deleteTarget
            ? `Anh có chắc muốn xóa đơn hàng của ${deleteTarget.user.fullName} không? Thao tác này không thể hoàn tác.`
            : undefined
        }
        confirmText={deleting ? "Đang xóa..." : "Xóa đơn hàng"}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
}
