"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Newspaper,
  ShoppingCart,
  Heart,
  Palette,
  Shapes,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Bộ sưu tập", icon: Tags },
  { href: "/admin/patterns", label: "Hoa văn", icon: Shapes },
  { href: "/admin/colors", label: "Màu sắc", icon: Palette },
  { href: "/admin/carts", label: "Sản phẩm quan tâm", icon: Heart },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/blogs", label: "Bài viết", icon: Newspaper },
  { href: "/admin/users", label: "Người dùng", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-slate-200 bg-white lg:h-full lg:border-r">
      <div className="hidden border-b border-slate-200 px-5 py-5 lg:block">
        <div className="text-lg font-semibold text-slate-800">Trang quản trị</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">Chọn mục cần quản lý</p>
      </div>

      <nav className="overflow-x-auto px-3 py-3 lg:overflow-visible lg:py-4">
        <div className="mb-3 hidden px-2 text-sm font-medium uppercase tracking-wide text-slate-500 lg:block">
          Menu chính
        </div>

        <div className="flex gap-2 lg:block lg:space-y-2">
          {items.map((it) => {
            const active = it.exact
              ? pathname === it.href
              : pathname === it.href || pathname.startsWith(`${it.href}/`);

            const Icon = it.icon;

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors lg:gap-3 lg:px-4 lg:py-3 lg:text-base",
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-slate-700" : "text-slate-400"
                  )}
                />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
