"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { apiJson } from "@/lib/api";
import { PageShell } from "@/components/admin/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  priority: z.number(),
  minPrice: z.number().nullable().optional(),
  maxPrice: z.number().nullable().optional(),
  createdAt: z.string(),
  categories: z.array(
    z.object({
      category: z.object({
        id: z.string(),
        name: z.string(),
      }),
    })
  ),
  _count: z.object({
    images: z.number(),
    cartItems: z.number(),
  }),
});

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
});

const categoriesListSchema = z.object({
  categories: z.array(categorySchema),
});

const listSchema = z.object({
  products: z.array(productSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasPrevPage: z.boolean(),
    hasNextPage: z.boolean(),
  }),
});

type Product = z.infer<typeof productSchema>;
type Category = z.infer<typeof categorySchema>;
type Pagination = z.infer<typeof listSchema>["pagination"];
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";
type ProductSort =
  | "priority_desc"
  | "priority_asc"
  | "created_desc"
  | "created_asc"
  | "cart_users_desc"
  | "cart_users_asc";

function formatPriceRange(minPrice?: number | null, maxPrice?: number | null) {
  if (minPrice == null && maxPrice == null) return "Chưa có";
  if (minPrice != null && maxPrice != null) return `${minPrice} → ${maxPrice}`;
  if (minPrice != null) return `Từ ${minPrice}`;
  return `Đến ${maxPrice}`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminProductsPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingCategories, setLoadingCategories] = React.useState(true);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ActiveFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [sort, setSort] = React.useState<ProductSort>("priority_desc");

  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  React.useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        setLoadingCategories(true);

        const data = await apiJson(
          "/api/admin/categories",
          { method: "GET" },
          categoriesListSchema
        );

        if (!ignore) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Không tải được danh mục:", err);

        if (!ignore) {
          setCategories([]);
          toast({
            title: "Không tải được danh mục",
            description: "Vui lòng thử lại sau.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      ignore = true;
    };
  }, [toast]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, pageSize, sort]);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        params.set("sort", sort);

        if (search) {
          params.set("q", search);
        }

        if (statusFilter === "ACTIVE") {
          params.set("isActive", "true");
        } else if (statusFilter === "INACTIVE") {
          params.set("isActive", "false");
        }

        if (categoryFilter !== "ALL") {
          params.set("categoryId", categoryFilter);
        }

        const data = await apiJson(
          `/api/admin/products?${params.toString()}`,
          { method: "GET" },
          listSchema
        );

        if (!ignore) {
          setItems(data.products);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error("Không tải được danh sách sản phẩm:", err);

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
            title: "Không tải được danh sách sản phẩm",
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
  }, [page, pageSize, search, statusFilter, categoryFilter, sort, toast]);

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

  const activeCount = items.filter((item) => item.isActive).length;
  const inactiveCount = items.filter((item) => !item.isActive).length;

  return (
    <PageShell
      title="Quản lý sản phẩm"
      description="Tạo mới, xem, chỉnh sửa và quản lý hình ảnh sản phẩm."
      right={
        <Button asChild className="h-11 rounded-xl px-5 text-base font-semibold">
          <Link href="/admin/products/new">Tạo sản phẩm mới</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Tổng số sản phẩm:</span> {pagination.totalItems}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Đang sử dụng:</span> {activeCount}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Tạm ngưng:</span> {inactiveCount}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Danh mục hiện có:</span> {categories.length}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-base font-medium text-slate-800">
              Tìm kiếm
            </label>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, mô tả hoặc danh mục"
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
              onChange={(e) => setStatusFilter(e.target.value as ActiveFilter)}
            >
              <option value="ALL">Tất cả sản phẩm</option>
              <option value="ACTIVE">Đang sử dụng</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-slate-800">
              Danh mục
            </label>
            <select
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              disabled={loadingCategories}
            >
              <option value="ALL">
                {loadingCategories ? "Đang tải danh mục..." : "Tất cả danh mục"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-slate-800">
              Sắp xếp
            </label>
            <select
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductSort)}
            >
              <option value="priority_desc">Ưu tiên giảm dần</option>
              <option value="priority_asc">Ưu tiên tăng dần</option>
              <option value="created_desc">Mới nhất</option>
              <option value="created_asc">Cũ nhất</option>
              <option value="cart_users_desc">Nhiều người thêm cart nhất</option>
              <option value="cart_users_asc">Ít người thêm cart nhất</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-base text-slate-600">
            Hiển thị <span className="font-medium">{startItem}</span>-
            <span className="font-medium">{endItem}</span> trong tổng số{" "}
            <span className="font-medium">{pagination.totalItems}</span> sản phẩm
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
          Đang tải danh sách sản phẩm...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Không tìm thấy sản phẩm nào.
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((product) => (
              <Card
                key={product.id}
                className="rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xl font-semibold text-slate-800">
                        {product.name}
                      </div>
                      <div className="mt-1 text-base leading-7 text-slate-600">
                        {product.description}
                      </div>
                    </div>

                    <div className="grid gap-2 text-base text-slate-700">
                      <div>
                        <span className="font-medium">Trạng thái:</span>{" "}
                        {product.isActive ? "Đang sử dụng" : "Tạm ngưng"}
                      </div>

                      <div>
                        <span className="font-medium">Độ ưu tiên:</span>{" "}
                        {product.priority}
                      </div>

                      <div>
                        <span className="font-medium">Khoảng giá:</span>{" "}
                        {formatPriceRange(product.minPrice, product.maxPrice)}
                      </div>

                      <div>
                        <span className="font-medium">Danh mục:</span>{" "}
                        {product.categories.length
                          ? product.categories.map((x) => x.category.name).join(", ")
                          : "Chưa chọn"}
                      </div>

                      <div>
                        <span className="font-medium">Số ảnh:</span>{" "}
                        {product._count.images}
                      </div>

                      <div>
                        <span className="font-medium">Số người thêm vào cart:</span>{" "}
                        {product._count.cartItems}
                      </div>

                      <div>
                        <span className="font-medium">Ngày tạo:</span>{" "}
                        {formatDate(product.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 rounded-xl px-5 text-base"
                    >
                      <Link href={`/admin/products/${product.id}`}>Xem / chỉnh sửa</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="text-base text-slate-600">
              Trang <span className="font-medium">{pagination.page}</span> /{" "}
              <span className="font-medium">{pagination.totalPages}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="h-11 rounded-xl px-5 text-base"
              >
                Trang trước
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  setPage((prev) => Math.min(pagination.totalPages, prev + 1))
                }
                className="h-11 rounded-xl px-5 text-base"
              >
                Trang sau
              </Button>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}