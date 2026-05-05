"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <div className="text-lg font-semibold text-slate-800">
          Khu vực quản trị
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Quản lý sản phẩm, đơn hàng, bài viết và người dùng
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="h-11 rounded-xl px-5 text-base"
        >
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}