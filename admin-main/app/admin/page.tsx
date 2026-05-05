"use client";

import * as React from "react";
import { z } from "zod";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { PageShell } from "@/components/admin/page-shell";
import { StatCards, type StatCardItem } from "@/components/admin/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiJson } from "@/lib/api";

const overviewSchema = z.object({
  users: z.object({
    total: z.number(),
    pending: z.number(),
    accepted: z.number(),
    blocked: z.number(),
  }),
  products: z.object({
    total: z.number(),
    active: z.number(),
    inactive: z.number(),
    withoutImages: z.number(),
  }),
  categories: z.object({
    total: z.number(),
    inactive: z.number(),
  }),
  orders: z.object({
    total: z.number(),
    pending: z.number(),
    inProgress: z.number(),
    done: z.number(),
    cancelled: z.number(),
    thisWeek: z.number(),
    doneThisMonth: z.number(),
  }),
  interests: z.object({
    totalItems: z.number(),
    users: z.number(),
    products: z.number(),
    withNote: z.number(),
    thisWeek: z.number(),
  }),
  series: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
    })
  ),
});

type OverviewData = z.infer<typeof overviewSchema>;

function formatShortDate(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-80 w-full rounded-2xl" />

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    apiJson("/api/admin/overview", { method: "GET" }, overviewSchema)
      .then((res) => {
        if (!active) return;
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải trang tổng quan");
      });

    return () => {
      active = false;
    };
  }, []);

  if (!data && !error) {
    return (
      <PageShell
        title="Tổng quan quản trị"
        description="Các thông tin chính về người dùng, sản phẩm và đơn hàng."
      >
        <LoadingState />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell
        title="Tổng quan quản trị"
        description="Các thông tin chính về người dùng, sản phẩm và đơn hàng."
      >
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800">
              Không tải được bảng điều khiển
            </CardTitle>
          </CardHeader>

          <CardContent className="text-base leading-7 text-slate-600">
            {error}
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell
        title="Tổng quan quản trị"
        description="Các thông tin chính về người dùng, sản phẩm và đơn hàng."
      >
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800">
              Không có dữ liệu tổng quan
            </CardTitle>
          </CardHeader>

          <CardContent className="text-base leading-7 text-slate-600">
            Hệ thống chưa trả về dữ liệu để hiển thị bảng điều khiển.
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const topCards: StatCardItem[] = [
    {
      title: "Tổng số người dùng",
      value: data.users.total,
      subtitle: `${data.users.pending} tài khoản đang chờ duyệt`,
    },
    {
      title: "Sản phẩm đang sử dụng",
      value: data.products.active,
      subtitle: `${data.products.withoutImages} sản phẩm chưa có ảnh`,
    },
    {
      title: "Đơn hàng trong tuần",
      value: data.orders.thisWeek,
      subtitle: `${data.orders.doneThisMonth} đơn đã hoàn thành trong tháng`,
    },
    {
      title: "Danh mục đang dùng",
      value: data.categories.total - data.categories.inactive,
      subtitle: `${data.categories.inactive} danh mục đang tạm ngưng`,
    },
  ];

  const userCards: StatCardItem[] = [
    { title: "Tổng số", value: data.users.total },
    { title: "Chờ duyệt", value: data.users.pending },
    { title: "Đã duyệt / xác minh", value: data.users.accepted },
    { title: "Đã khóa", value: data.users.blocked },
  ];

  const productCards: StatCardItem[] = [
    { title: "Tổng số", value: data.products.total },
    { title: "Đang sử dụng", value: data.products.active },
    { title: "Tạm ngưng", value: data.products.inactive },
    { title: "Chưa có ảnh", value: data.products.withoutImages },
  ];

  const orderCards: StatCardItem[] = [
    { title: "Tổng số", value: data.orders.total },
    { title: "Chờ xử lý", value: data.orders.pending },
    { title: "Đang thực hiện", value: data.orders.inProgress },
    {
      title: "Hoàn thành",
      value: data.orders.done,
      subtitle: `${data.orders.cancelled} đơn đã hủy`,
    },
  ];

  const interestCards: StatCardItem[] = [
    { title: "Tổng lượt quan tâm", value: data.interests.totalItems },
    { title: "Người dùng đã thêm", value: data.interests.users },
    { title: "Sản phẩm được quan tâm", value: data.interests.products },
    {
      title: "Có ghi chú",
      value: data.interests.withNote,
      subtitle: `${data.interests.thisWeek} lượt trong tuần`,
    },
  ];

  return (
    <PageShell
      title="Tổng quan quản trị"
      description="Các thông tin chính về người dùng, sản phẩm và đơn hàng."
    >
      <div className="space-y-6">
        <StatCards items={topCards} columns={4} />

        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-slate-800">
              Xu hướng đơn hàng 14 ngày gần đây
            </CardTitle>
            <p className="text-base leading-7 text-slate-600">
              Biểu đồ giúp anh nhìn nhanh số lượng đơn hàng theo ngày.
            </p>
          </CardHeader>

          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 13 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                <Tooltip
                  labelFormatter={(value) => `Ngày: ${formatShortDate(String(value))}`}
                  formatter={(value) => [`${value}`, "Số đơn hàng"]}
                />
                <Line type="monotone" dataKey="count" dot={false} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-800">
                Người dùng
              </CardTitle>
            </CardHeader>

            <CardContent>
              <StatCards items={userCards} columns={2} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-800">
                Sản phẩm
              </CardTitle>
            </CardHeader>

            <CardContent>
              <StatCards items={productCards} columns={2} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-800">
                Đơn hàng
              </CardTitle>
            </CardHeader>

            <CardContent>
              <StatCards items={orderCards} columns={2} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-800">
                Sản phẩm quan tâm
              </CardTitle>
            </CardHeader>

            <CardContent>
              <StatCards items={interestCards} columns={2} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}