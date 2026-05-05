"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { apiJson } from "@/lib/api";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const CART_SORT_OPTIONS = [
  { value: "UPDATED_DESC", label: "Mới cập nhật trước" },
  { value: "UPDATED_ASC", label: "Cập nhật cũ nhất" },
  { value: "CREATED_DESC", label: "Mới tạo trước" },
  { value: "CREATED_ASC", label: "Tạo cũ nhất" },
  { value: "QUANTITY_DESC", label: "Số lượng cao nhất" },
  { value: "QUANTITY_ASC", label: "Số lượng thấp nhất" },
] as const;

type CartSort = (typeof CART_SORT_OPTIONS)[number]["value"];

function normalizeSort(value: string | null): CartSort {
  return CART_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as CartSort)
    : "UPDATED_DESC";
}

const userSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  isActive: z.boolean(),
  status: z.enum(["PENDING", "ACCEPTED", "VERIFIED", "REJECTED"]),
});

const cartItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  patternId: z.string().nullable(),
  colorId: z.string().nullable(),
  model3dId: z.string().nullable(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    isActive: z.boolean(),
  }),
  pattern: z
    .object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
    })
    .nullable(),
  color: z
    .object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      hex: z.string(),
    })
    .nullable(),
  model3d: z
    .object({
      id: z.string(),
      status: z.enum(["DRAFT", "PROCESSING", "READY", "FAILED"]),
      previewImageUrl: z.string().nullable(),
      modelGlbUrl: z.string().nullable(),
    })
    .nullable(),
});

const responseSchema = z.object({
  user: userSchema,
  cartItems: z.array(cartItemSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasPrevPage: z.boolean(),
    hasNextPage: z.boolean(),
  }),
  filters: z.object({
    productQ: z.string(),
    sort: z.enum([
      "UPDATED_DESC",
      "UPDATED_ASC",
      "CREATED_DESC",
      "CREATED_ASC",
      "QUANTITY_DESC",
      "QUANTITY_ASC",
    ]),
  }),
});

type UserInfo = z.infer<typeof userSchema>;
type CartItemRow = z.infer<typeof cartItemSchema>;

function buildQueryString(params: {
  productQ: string;
  sort: CartSort;
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams();

  const productQ = params.productQ.trim();

  if (productQ) query.set("productQ", productQ);
  if (params.sort !== "UPDATED_DESC") query.set("sort", params.sort);

  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  return query.toString();
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

function displayNote(note: string | null | undefined) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : "-";
}

function statusLabel(status: UserInfo["status"]) {
  switch (status) {
    case "PENDING":
      return "Chờ duyệt";
    case "ACCEPTED":
      return "Đã duyệt";
    case "VERIFIED":
      return "Đã xác minh";
    case "REJECTED":
      return "Từ chối";
    default:
      return status;
  }
}

function getSelectionSummary(item: CartItemRow) {
  const parts: string[] = [];

  if (item.pattern) {
    parts.push(`Hoa văn: ${item.pattern.name} (${item.pattern.code})`);
  }

  if (item.color) {
    parts.push(`Màu: ${item.color.name} (${item.color.hex})`);
  }

  if (item.model3d) {
    parts.push(`3D: ${item.model3d.status}`);
  }

  return parts.length ? parts.join(" • ") : "Không có cấu hình thêm";
}

export default function UserCartPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [items, setItems] = React.useState<CartItemRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [productQ, setProductQ] = React.useState(searchParams.get("productQ") ?? "");
  const [sort, setSort] = React.useState<CartSort>(normalizeSort(searchParams.get("sort")));
  const [page, setPage] = React.useState(Math.max(1, Number(searchParams.get("page") || "1")));
  const [pageSize, setPageSize] = React.useState(Math.max(1, Number(searchParams.get("pageSize") || "10")));

  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  React.useEffect(() => {
    setPage(1);
  }, [productQ, sort, pageSize]);

  const queryString = React.useMemo(
    () => buildQueryString({ productQ, sort, page, pageSize }),
    [productQ, sort, page, pageSize]
  );

  const load = React.useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const url = queryString
        ? `/api/admin/users/${userId}/cart?${queryString}`
        : `/api/admin/users/${userId}/cart`;

      const data = await apiJson(url, { method: "GET" }, responseSchema);
      setUser(data.user);
      setItems(data.cartItems);
      setPagination(data.pagination);
    } catch (e: any) {
      console.error("Không tải được cart của user:", e);
      setUser(null);
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
        title: "Không tải được cart người dùng",
        description: e?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pageSize, queryString, toast, userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const href = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(href, { scroll: false });
  }, [pathname, queryString, router]);

  React.useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  const startItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;

  const endItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems
  );

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const noteCount = items.filter((item) => item.note?.trim()).length;

  return (
    <PageShell
      title={user ? `Cart của ${user.fullName}` : "Cart người dùng"}
      description="Xem các sản phẩm người dùng đang quan tâm cùng cấu hình và ghi chú của họ."
      right={
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/admin/users/${userId}`}>
            <Button variant="outline" className="h-11 rounded-xl px-5 text-base">
              Quay lại hồ sơ user
            </Button>
          </Link>

          <Link href="/admin/carts">
            <Button variant="outline" className="h-11 rounded-xl px-5 text-base">
              Xem tất cả cart
            </Button>
          </Link>
        </div>
      }
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Đang tải cart của người dùng...
        </div>
      ) : !user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Không tìm thấy người dùng hoặc không thể tải dữ liệu.
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
              <span className="font-medium">Người dùng:</span> {user.fullName}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
              <span className="font-medium">Trạng thái:</span> {statusLabel(user.status)}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
              <span className="font-medium">Tổng số lượng trên trang:</span> {totalQuantity}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
              <span className="font-medium">Mục có ghi chú:</span> {noteCount}
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-base font-medium text-slate-800">
                  Lọc theo sản phẩm
                </label>
                <Input
                  placeholder="Nhập tên sản phẩm..."
                  value={productQ}
                  onChange={(e) => setProductQ(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div>
                <label className="mb-2 block text-base font-medium text-slate-800">
                  Sắp xếp
                </label>
                <select
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as CartSort)}
                >
                  {CART_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-base font-medium text-slate-800">
                  Số dòng mỗi trang
                </label>
                <select
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {items.length === 0 ? (
              <div className="p-4 text-base text-slate-600">
                User này chưa có sản phẩm quan tâm phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left">
                        <th className="px-4 py-3 text-base font-semibold text-slate-800">
                          Sản phẩm / Cấu hình
                        </th>
                        <th className="px-4 py-3 text-base font-semibold text-slate-800">
                          Số lượng
                        </th>
                        <th className="px-4 py-3 text-base font-semibold text-slate-800">
                          Ghi chú
                        </th>
                        <th className="px-4 py-3 text-base font-semibold text-slate-800">
                          Cập nhật
                        </th>
                        <th className="px-4 py-3 text-base font-semibold text-slate-800">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 align-top">
                          <td className="px-4 py-4 text-base text-slate-700">
                            <div className="font-medium text-slate-800">
                              {item.product.name}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                              {getSelectionSummary(item)}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                                  item.product.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {item.product.isActive ? "Đang hoạt động" : "Đã ẩn"}
                              </span>
                              {item.model3d ? (
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                                  3D {item.model3d.status}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-base font-medium text-slate-800">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-4 text-base text-slate-700">
                            <div className="max-w-md whitespace-pre-wrap break-words">
                              {displayNote(item.note)}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-base text-slate-600">
                            <div>{formatDateTime(item.updatedAt)}</div>
                            <div className="mt-1 text-sm text-slate-400">
                              Tạo: {formatDateTime(item.createdAt)}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <Link href={`/admin/products/${item.product.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 rounded-xl px-4 text-base"
                              >
                                Xem sản phẩm
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-base text-slate-600">
                    Hiển thị <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> trong tổng số <span className="font-medium">{pagination.totalItems}</span> kết quả
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="h-11 rounded-xl px-5 text-base"
                    >
                      Trang trước
                    </Button>

                    <div className="min-w-[110px] text-center text-base text-slate-600">
                      Trang {pagination.page} / {pagination.totalPages}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNextPage}
                      className="h-11 rounded-xl px-5 text-base"
                    >
                      Trang sau
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
