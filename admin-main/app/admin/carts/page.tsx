"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

const cartItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  patternId: z.string().nullable(),
  colorId: z.string().nullable(),
  model3dId: z.string().nullable(),
  user: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    companyName: z.string().nullable().optional(),
  }),
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

const listSchema = z.object({
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
    userId: z.string().nullable(),
    userQ: z.string(),
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

type CartItemRow = z.infer<typeof cartItemSchema>;

function buildQueryString(params: {
  userQ: string;
  productQ: string;
  sort: CartSort;
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams();

  const userQ = params.userQ.trim();
  const productQ = params.productQ.trim();

  if (userQ) query.set("userQ", userQ);
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

export default function AdminCartsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [items, setItems] = React.useState<CartItemRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [userQ, setUserQ] = React.useState(searchParams.get("userQ") ?? "");
  const [productQ, setProductQ] = React.useState(
    searchParams.get("productQ") ?? ""
  );
  const [sort, setSort] = React.useState<CartSort>(
    normalizeSort(searchParams.get("sort"))
  );
  const [page, setPage] = React.useState(
    Math.max(1, Number(searchParams.get("page") || "1"))
  );
  const [pageSize, setPageSize] = React.useState(
    Math.max(1, Number(searchParams.get("pageSize") || "10"))
  );

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
  }, [userQ, productQ, sort, pageSize]);

  const queryString = React.useMemo(
    () =>
      buildQueryString({
        userQ,
        productQ,
        sort,
        page,
        pageSize,
      }),
    [userQ, productQ, sort, page, pageSize]
  );

  const load = React.useCallback(async () => {
    try {
      setLoading(true);

      const url = queryString ? `/api/admin/carts?${queryString}` : "/api/admin/carts";
      const data = await apiJson(url, { method: "GET" }, listSchema);

      setItems(data.cartItems);
      setPagination(data.pagination);
    } catch (e: any) {
      console.error("Không tải được danh sách cart items:", e);
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
        title: "Không tải được danh sách sản phẩm quan tâm",
        description: e?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [queryString, pageSize, toast]);

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

  const uniqueUserCount = new Set(items.map((item) => item.user.id)).size;
  const uniqueProductCount = new Set(items.map((item) => item.product.id)).size;
  const noteCount = items.filter((item) => item.note?.trim()).length;

  return (
    <PageShell
      title="Sản phẩm người dùng quan tâm"
      description="Xem các sản phẩm mà người dùng đã lưu, kèm cấu hình hoa văn, màu, 3D, số lượng và ghi chú."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số mục: <span className="font-semibold">{pagination.totalItems}</span>
        </div>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Tổng số:</span> {pagination.totalItems}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Người dùng trên trang:</span> {uniqueUserCount}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Sản phẩm trên trang:</span> {uniqueProductCount}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Có ghi chú:</span> {noteCount}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-base font-medium text-slate-800">
              Lọc theo người dùng
            </label>
            <Input
              placeholder="Tên, email, công ty, số điện thoại..."
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>

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
        {loading ? (
          <div className="p-4 text-base text-slate-600">
            Đang tải danh sách sản phẩm quan tâm...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-base text-slate-600">
            Không có dữ liệu phù hợp.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-4 py-3 text-base font-semibold text-slate-800">
                      Người dùng
                    </th>
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
                          {item.user.fullName}
                        </div>
                        <div className="mt-1 break-all text-sm text-slate-500">
                          {item.user.email}
                        </div>
                        {item.user.companyName ? (
                          <div className="mt-1 text-sm text-slate-500">
                            Công ty: {item.user.companyName}
                          </div>
                        ) : null}
                        {item.user.phone ? (
                          <div className="mt-1 text-sm text-slate-500">
                            SĐT: {item.user.phone}
                          </div>
                        ) : null}
                      </td>

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
                        <div className="flex flex-col gap-2">
                          <Link href={`/admin/users/${item.user.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 rounded-xl px-4 text-base"
                            >
                              Xem user
                            </Button>
                          </Link>

                          <Link href={`/admin/users/${item.user.id}/cart`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 rounded-xl px-4 text-base"
                            >
                              Cart của user
                            </Button>
                          </Link>

                          <Link href={`/admin/products/${item.product.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 rounded-xl px-4 text-base"
                            >
                              Xem sản phẩm
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-base text-slate-600">
                Hiển thị <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> trong tổng số{" "}
                <span className="font-medium">{pagination.totalItems}</span> kết quả
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
    </PageShell>
  );
}
