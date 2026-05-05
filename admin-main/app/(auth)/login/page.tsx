"use client";

import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

type FormValues = z.infer<typeof schema>;

function toSafeRelativePath(input: string | null | undefined): string {
  if (!input) return "/admin";

  // Chỉ cho phép relative path nội bộ
  if (!input.startsWith("/")) return "/admin";
  if (input.startsWith("//")) return "/admin";

  return input;
}

export default function LoginPage() {
  const params = useSearchParams();
  const { toast } = useToast();

  const next = toSafeRelativePath(params.get("next"));

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const normalizedEmail = values.email.trim().toLowerCase();

    console.log("[LOGIN PAGE] submit", {
      at: new Date().toISOString(),
      email: normalizedEmail,
      passwordLength: values.password.length,
      callbackUrl: next,
    });

    try {
      const res = await signIn("credentials", {
        email: normalizedEmail,
        password: values.password,
        redirect: false,
        callbackUrl: next,
      });

      console.log("[LOGIN PAGE] signIn response", {
        at: new Date().toISOString(),
        res,
      });

      if (!res) {
        toast({
          title: "Đăng nhập không thành công",
          description: "Không nhận được phản hồi từ hệ thống xác thực.",
          variant: "destructive",
        });
        return;
      }

      if (res.error) {
        console.error("[LOGIN PAGE] signIn failed", {
          at: new Date().toISOString(),
          error: res.error,
          status: res.status,
          ok: res.ok,
          url: res.url,
        });

        toast({
          title: "Đăng nhập không thành công",
          description:
            "Email, mật khẩu không đúng hoặc tài khoản chưa được phép truy cập.",
          variant: "destructive",
        });
        return;
      }

      console.log("[LOGIN PAGE] signIn success", {
        at: new Date().toISOString(),
        status: res.status,
        ok: res.ok,
        url: res.url,
        redirectTo: next,
      });

      toast({
        title: "Đăng nhập thành công",
        description: "Đang chuyển vào trang quản trị.",
      });

      // Dùng hard redirect để đảm bảo cookie/session được áp dụng đầy đủ
      window.location.assign(next);
    } catch (error) {
      console.error("[LOGIN PAGE] signIn threw", {
        at: new Date().toISOString(),
        error,
      });

      toast({
        title: "Đăng nhập không thành công",
        description: "Có lỗi xảy ra trong quá trình đăng nhập.",
        variant: "destructive",
      });
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-slate-800">
            Đăng nhập quản trị
          </CardTitle>
          <CardDescription className="text-base leading-6 text-slate-600">
            Vui lòng nhập thông tin để vào trang quản lý.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-base font-medium text-slate-800"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vd: admin@congty.com"
              className="h-12 text-base rounded-xl"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-base font-medium text-slate-800"
            >
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              className="h-12 text-base rounded-xl"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="h-12 w-full text-base font-semibold rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}