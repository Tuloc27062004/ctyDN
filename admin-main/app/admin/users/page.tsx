"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { apiJson } from "@/lib/api";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const userSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  role: z.enum(["ADMIN", "USER"]),
  status: z.enum(["PENDING", "ACCEPTED", "VERIFIED", "REJECTED"]),
  companyName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
});

const listSchema = z.object({
  users: z.array(userSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasPrevPage: z.boolean(),
    hasNextPage: z.boolean(),
  }),
  filters: z.object({
    q: z.string(),
    status: z.string().nullable(),
    active: z.string().nullable(),
  }),
});

type UserRow = z.infer<typeof userSchema>;
type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "VERIFIED" | "REJECTED";
type ActiveFilter = "ALL" | "ACTIVE" | "BLOCKED";
type BulkAction = "approve" | "reject" | "block" | "unblock";

function normalizeStatusFilter(value: string | null): StatusFilter {
  if (
    value === "PENDING" ||
    value === "ACCEPTED" ||
    value === "VERIFIED" ||
    value === "REJECTED"
  ) {
    return value;
  }
  return "ALL";
}

function normalizeActiveFilter(value: string | null): ActiveFilter {
  if (value === "ACTIVE" || value === "BLOCKED") {
    return value;
  }
  return "ALL";
}

function getStatusLabel(status: UserRow["status"]) {
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

function getRoleLabel(role: UserRow["role"]) {
  return role === "ADMIN" ? "Quản trị viên" : "Người dùng";
}

function getAccountLabel(isActive: boolean | undefined) {
  return isActive === false ? "Đã khóa" : "Đang hoạt động";
}

function statusClass(status: UserRow["status"]) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "ACCEPTED":
      return "bg-blue-50 text-blue-700";
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function activeClass(isActive: boolean | undefined) {
  return isActive === false
    ? "bg-rose-50 text-rose-700"
    : "bg-emerald-50 text-emerald-700";
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

function buildQueryString(params: {
  search: string;
  statusFilter: StatusFilter;
  activeFilter: ActiveFilter;
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams();

  const trimmedSearch = params.search.trim();

  if (trimmedSearch) query.set("q", trimmedSearch);
  if (params.statusFilter !== "ALL") query.set("status", params.statusFilter);
  if (params.activeFilter !== "ALL") query.set("active", params.activeFilter);

  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  return query.toString();
}

function actionLabel(action: BulkAction) {
  switch (action) {
    case "approve":
      return "duyệt";
    case "reject":
      return "từ chối";
    case "block":
      return "khóa";
    case "unblock":
      return "mở khóa";
    default:
      return "cập nhật";
  }
}

function actionSuccessTitle(action: BulkAction) {
  switch (action) {
    case "approve":
      return "Đã duyệt người dùng đã chọn";
    case "reject":
      return "Đã từ chối người dùng đã chọn";
    case "block":
      return "Đã khóa người dùng đã chọn";
    case "unblock":
      return "Đã mở khóa người dùng đã chọn";
    default:
      return "Đã cập nhật người dùng đã chọn";
  }
}

function actionErrorFallback(action: BulkAction) {
  switch (action) {
    case "approve":
    case "reject":
      return "Không thể thực hiện thao tác duyệt hàng loạt";
    case "block":
    case "unblock":
      return "Không thể thực hiện thao tác tài khoản hàng loạt";
    default:
      return "Không thể thực hiện thao tác hàng loạt";
  }
}

export default function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [items, setItems] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    normalizeStatusFilter(searchParams.get("status"))
  );
  const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>(
    normalizeActiveFilter(searchParams.get("active"))
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
  }, [search, statusFilter, activeFilter, pageSize]);

  const queryString = React.useMemo(
    () =>
      buildQueryString({
        search,
        statusFilter,
        activeFilter,
        page,
        pageSize,
      }),
    [search, statusFilter, activeFilter, page, pageSize]
  );

  const load = React.useCallback(async () => {
    try {
      setLoading(true);

      const url = queryString ? `/api/admin/users?${queryString}` : "/api/admin/users";
      const data = await apiJson(url, { method: "GET" }, listSchema);

      setItems(data.users);
      setPagination(data.pagination);
    } catch (e: any) {
      console.error("Không tải được danh sách người dùng:", e);
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
        title: "Không tải được danh sách người dùng",
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

  React.useEffect(() => {
    const allowed = new Set(items.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [items]);

  const selectedUsers = React.useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return items.filter((user) => selectedSet.has(user.id));
  }, [items, selectedIds]);

  const allSelectedArePending =
    selectedUsers.length > 0 &&
    selectedUsers.every((user) => user.status === "PENDING");

  const allSelectedAreNonPending =
    selectedUsers.length > 0 &&
    selectedUsers.every((user) => user.status !== "PENDING");

  async function runBulkAction(action: BulkAction) {
    if (selectedIds.length === 0) return;

    const ok = window.confirm(
      `Anh có muốn ${actionLabel(action)} ${selectedIds.length} người dùng đã chọn không?`
    );
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
          action,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, actionErrorFallback(action)));
      }

      toast({
        title: actionSuccessTitle(action),
        description: `${data.updatedCount} người dùng đã được cập nhật.`,
      });

      setSelectedIds([]);
      await load();
    } catch (e: any) {
      toast({
        title: "Thao tác hàng loạt không thành công",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "fullName",
      header: "Họ và tên",
      cell: ({ row }) => (
        <div className="text-base font-medium text-slate-800">
          {row.original.fullName}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-base text-slate-700 break-all">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => (
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {getRoleLabel(row.original.role)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái duyệt",
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusClass(
            row.original.status
          )}`}
        >
          {getStatusLabel(row.original.status)}
        </span>
      ),
    },
    {
      id: "accountState",
      header: "Tình trạng tài khoản",
      accessorFn: (row: UserRow) =>
        row.isActive === false ? "BLOCKED" : "ACTIVE",
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${activeClass(
            row.original.isActive
          )}`}
        >
          {getAccountLabel(row.original.isActive)}
        </span>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Công ty",
      cell: ({ row }) => (
        <div className="text-base text-slate-700">
          {row.original.companyName || "-"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
      cell: ({ row }) => (
        <div className="text-base text-slate-700">
          {row.original.phone || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col gap-2">
          <Link href={`/admin/users/${row.original.id}`}>
            <Button size="sm" variant="outline" className="h-10 rounded-xl px-4 text-base">
              Xem chi tiết
            </Button>
          </Link>

          <Link href={`/admin/users/${row.original.id}/cart`}>
            <Button size="sm" variant="outline" className="h-10 rounded-xl px-4 text-base">
              Xem cart
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const startItem =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems
  );

  const pendingCount = items.filter((item) => item.status === "PENDING").length;
  const activeCount = items.filter((item) => item.isActive !== false).length;
  const blockedCount = items.filter((item) => item.isActive === false).length;

  return (
    <PageShell
      title="Quản lý người dùng"
      description="Xem, duyệt, khóa và theo dõi tài khoản người dùng trong một nơi."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số người dùng: <span className="font-semibold">{pagination.totalItems}</span>
        </div>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Tổng số:</span> {pagination.totalItems}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Chờ duyệt:</span> {pendingCount}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Đang hoạt động:</span> {activeCount}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Đã khóa:</span> {blockedCount}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-base font-medium text-slate-800">
              Tìm kiếm
            </label>
            <Input
              placeholder="Tìm theo họ tên, email, công ty, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-slate-800">
              Trạng thái duyệt
            </label>
            <select
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="ACCEPTED">Đã duyệt</option>
              <option value="VERIFIED">Đã xác minh</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-slate-800">
              Tình trạng tài khoản
            </label>
            <select
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
            >
              <option value="ALL">Tất cả tài khoản</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="BLOCKED">Đã khóa</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="p-4 text-base text-slate-600">Đang tải danh sách người dùng...</div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={items}
              emptyMessage="Không tìm thấy người dùng nào."
              enableRowSelection
              getRowId={(row) => row.id}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              bulkActionsSlot={
                selectedIds.length > 0 ? (
                  <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-base text-slate-700">
                      Đã chọn <span className="font-semibold">{selectedIds.length}</span> người dùng
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {allSelectedArePending ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => runBulkAction("approve")}
                            disabled={busy}
                            className="h-10 rounded-xl px-4 text-base font-semibold"
                          >
                            {busy ? "Đang xử lý..." : "Duyệt đã chọn"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runBulkAction("reject")}
                            disabled={busy}
                            className="h-10 rounded-xl px-4 text-base"
                          >
                            {busy ? "Đang xử lý..." : "Từ chối đã chọn"}
                          </Button>
                        </>
                      ) : allSelectedAreNonPending ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runBulkAction("block")}
                            disabled={busy}
                            className="h-10 rounded-xl px-4 text-base"
                          >
                            {busy ? "Đang xử lý..." : "Khóa đã chọn"}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => runBulkAction("unblock")}
                            disabled={busy}
                            className="h-10 rounded-xl px-4 text-base font-semibold"
                          >
                            {busy ? "Đang xử lý..." : "Mở khóa đã chọn"}
                          </Button>
                        </>
                      ) : (
                        <div className="text-sm leading-6 text-amber-700">
                          Chỉ chọn cùng một nhóm phù hợp:
                          <br />
                          Người dùng đang chờ duyệt để duyệt hoặc từ chối,
                          <br />
                          hoặc người dùng không còn chờ duyệt để khóa hoặc mở khóa.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              }
            />

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-base text-slate-600">
                Hiển thị <span className="font-medium">{startItem}</span>-
                <span className="font-medium">{endItem}</span> trong tổng số{" "}
                <span className="font-medium">{pagination.totalItems}</span> kết quả
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-base text-slate-600">Số dòng mỗi trang</span>
                  <select
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-base"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
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
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}