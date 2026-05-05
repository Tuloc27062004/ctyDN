"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { z } from "zod";
import { apiJson } from "@/lib/api";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

const detailUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "USER"]),
  status: z.enum(["PENDING", "ACCEPTED", "VERIFIED", "REJECTED"]),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const detailSchema = z.object({
  user: detailUserSchema,
});

const patchSchema = z.object({
  ok: z.boolean(),
  user: detailUserSchema.optional(),
  approvalEmailSent: z.boolean().optional(),
  warning: z.string().nullable().optional(),
});

type DetailUser = z.infer<typeof detailUserSchema>;
type ActionType = "approve" | "reject" | "block" | "unblock" | null;

const ACTION_META: Record<
  Exclude<ActionType, null>,
  {
    title: string;
    description: string;
    confirmText: string;
    payload: Record<string, unknown>;
    successTitle: string;
  }
> = {
  approve: {
    title: "Duyệt người dùng này?",
    description: "Người dùng sẽ được chuyển sang trạng thái đã duyệt.",
    confirmText: "Duyệt người dùng",
    payload: { status: "ACCEPTED" },
    successTitle: "Đã duyệt người dùng",
  },
  reject: {
    title: "Từ chối người dùng này?",
    description: "Người dùng sẽ được chuyển sang trạng thái từ chối.",
    confirmText: "Từ chối người dùng",
    payload: { status: "REJECTED" },
    successTitle: "Đã từ chối người dùng",
  },
  block: {
    title: "Khóa tài khoản này?",
    description: "Tài khoản sẽ bị chuyển sang trạng thái ngừng hoạt động.",
    confirmText: "Khóa tài khoản",
    payload: { isActive: false },
    successTitle: "Đã khóa tài khoản",
  },
  unblock: {
    title: "Mở khóa tài khoản này?",
    description: "Tài khoản sẽ hoạt động trở lại.",
    confirmText: "Mở khóa tài khoản",
    payload: { isActive: true },
    successTitle: "Đã mở khóa tài khoản",
  },
};

function getStatusLabel(status: DetailUser["status"]) {
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

function statusClass(status: DetailUser["status"]) {
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

function activeClass(isActive: boolean) {
  return isActive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-rose-50 text-rose-700";
}

function getRoleLabel(role: DetailUser["role"]) {
  return role === "ADMIN" ? "Quản trị viên" : "Người dùng";
}

function getActiveLabel(isActive: boolean) {
  return isActive ? "Đang hoạt động" : "Đã khóa";
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

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { toast } = useToast();

  const [user, setUser] = React.useState<DetailUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [action, setAction] = React.useState<ActionType>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);

      const data = await apiJson(
        `/api/admin/users/${userId}`,
        { method: "GET" },
        detailSchema
      );

      setUser(data.user);
    } catch (e: any) {
      setUser(null);
      toast({
        title: "Không tải được người dùng",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, userId]);

  React.useEffect(() => {
    if (!userId) return;
    void load();
  }, [userId, load]);

  async function mutateUser(payload: Record<string, unknown>, successTitle: string) {
    const result = await apiJson(
      `/api/admin/users/${userId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      patchSchema
    );

    toast({ title: successTitle });

    if (result.warning) {
      toast({
        title: "Cảnh báo",
        description: result.warning,
        variant: "destructive",
      });
    }

    if (result.user) {
      setUser(result.user);
    } else {
      await load();
    }
  }

  async function handleConfirmAction() {
    if (!action) return;

    try {
      const meta = ACTION_META[action];
      await mutateUser(meta.payload, meta.successTitle);
      setAction(null);
    } catch (e: any) {
      toast({
        title: "Thao tác không thành công",
        description: e.message,
        variant: "destructive",
      });
      throw e;
    }
  }

  const actionMeta = action ? ACTION_META[action] : null;

  return (
    <>
      <PageShell
        title={user ? `Người dùng: ${user.fullName}` : "Chi tiết người dùng"}
        description="Xem thông tin hồ sơ, trạng thái duyệt và tình trạng tài khoản."
        right={
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/admin/users/${userId}/cart`}>
              <Button variant="outline" className="h-11 rounded-xl px-5 text-base">
                Xem sản phẩm quan tâm
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => void load()}
              className="h-11 rounded-xl px-5 text-base"
            >
              Tải lại
            </Button>

            <Link href="/admin/users">
              <Button variant="outline" className="h-11 rounded-xl px-5 text-base">
                Quay lại danh sách
              </Button>
            </Link>
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
            Đang tải thông tin người dùng...
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
            Không tìm thấy người dùng hoặc không thể tải dữ liệu.
          </div>
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
                <span className="font-medium">Vai trò:</span> {getRoleLabel(user.role)}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
                <span className="font-medium">Trạng thái duyệt:</span> {getStatusLabel(user.status)}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
                <span className="font-medium">Tình trạng tài khoản:</span> {getActiveLabel(user.isActive)}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
                <div>
                  <div className="text-xl font-semibold text-slate-800">
                    Thông tin người dùng
                  </div>
                  <p className="mt-1 text-base text-slate-600">
                    Các thông tin cơ bản của tài khoản.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-slate-500">Họ và tên</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {user.fullName}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="mt-1 break-all text-base font-medium text-slate-800">
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Số điện thoại</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {user.phone || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Quốc gia</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {user.country || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Công ty</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {user.companyName || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Vai trò</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {getRoleLabel(user.role)}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm text-slate-500">Địa chỉ công ty</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {user.companyAddress || "-"}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div>
                  <div className="text-xl font-semibold text-slate-800">
                    Trạng thái tài khoản
                  </div>
                  <p className="mt-1 text-base text-slate-600">
                    Duyệt, từ chối, khóa hoặc mở khóa tài khoản.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm text-slate-500">Trạng thái duyệt</div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusClass(
                        user.status
                      )}`}
                    >
                      {getStatusLabel(user.status)}
                    </span>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-500">Tình trạng tài khoản</div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${activeClass(
                        user.isActive
                      )}`}
                    >
                      {getActiveLabel(user.isActive)}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Ngày tạo</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {formatDateTime(user.createdAt)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Cập nhật lần cuối</div>
                    <div className="mt-1 text-base font-medium text-slate-800">
                      {formatDateTime(user.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 pt-2">
                  {user.status !== "ACCEPTED" && user.status !== "VERIFIED" && (
                    <Button
                      onClick={() => setAction("approve")}
                      className="h-11 rounded-xl px-5 text-base font-semibold"
                    >
                      Duyệt người dùng
                    </Button>
                  )}

                  {user.status !== "REJECTED" && (
                    <Button
                      variant="outline"
                      onClick={() => setAction("reject")}
                      className="h-11 rounded-xl px-5 text-base"
                    >
                      Từ chối người dùng
                    </Button>
                  )}

                  {user.isActive ? (
                    <Button
                      variant="outline"
                      onClick={() => setAction("block")}
                      className="h-11 rounded-xl border-red-300 px-5 text-base text-red-700 hover:bg-red-50"
                    >
                      Khóa tài khoản
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setAction("unblock")}
                      className="h-11 rounded-xl px-5 text-base font-semibold"
                    >
                      Mở khóa tài khoản
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </PageShell>

      {actionMeta && (
        <ConfirmDialog
          open={!!action}
          onOpenChange={(open) => {
            if (!open) setAction(null);
          }}
          title={actionMeta.title}
          description={actionMeta.description}
          confirmText={actionMeta.confirmText}
          onConfirm={handleConfirmAction}
        />
      )}
    </>
  );
}