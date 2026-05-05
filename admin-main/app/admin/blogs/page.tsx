"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { apiJson } from "@/lib/api";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable().optional(),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
  createdBy: z
    .object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
    })
    .optional(),
});

const listSchema = z.object({
  items: z.array(itemSchema),
});

const createSchema = z.object({
  title: z
    .string()
    .min(2, "Tiêu đề phải có ít nhất 2 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  slug: z
    .string()
    .min(2, "Đường dẫn phải có ít nhất 2 ký tự")
    .regex(
      /^[a-z0-9-]+$/,
      "Đường dẫn chỉ được gồm chữ thường, số và dấu gạch ngang"
    ),
});

type CreateValues = z.infer<typeof createSchema>;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function BlogsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [items, setItems] = React.useState<z.infer<typeof itemSchema>[]>([]);
  const [open, setOpen] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", slug: "" },
  });

  const titleValue = form.watch("title");

  React.useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugify(titleValue), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [titleValue, slugTouched, form]);

  async function load() {
    try {
      setLoading(true);

      const data = await apiJson(
        "/api/admin/blogs",
        { method: "GET" },
        listSchema
      );

      setItems(data.items);
    } catch (e: any) {
      toast({
        title: "Không tải được danh sách bài viết",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  function handleOpenCreate() {
    setOpen(true);
    setSlugTouched(false);
    form.reset({ title: "", slug: "" });
  }

  function handleCloseCreate() {
    setOpen(false);
    setSlugTouched(false);
    form.reset({ title: "", slug: "" });
  }

  async function handleCreate(values: CreateValues) {
    const ok = window.confirm(
      `Anh có muốn tạo bài viết mới không?\n\nTiêu đề: ${values.title}\nĐường dẫn: ${values.slug}`
    );
    if (!ok) return;

    try {
      const data = await apiJson(
        "/api/admin/blogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            slug: values.slug,
            excerpt: null,
            content: "",
            coverImageUrl: null,
            isPublished: false,
          }),
        },
        z.object({
          item: z.object({
            id: z.string(),
            title: z.string(),
            slug: z.string(),
            isPublished: z.boolean(),
          }),
        })
      );

      toast({
        title: "Đã tạo bài viết mới",
        description: "Đang mở trình soạn thảo để anh viết nội dung.",
      });

      handleCloseCreate();
      router.push(`/admin/blogs/${data.item.id}`);
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Tạo bài viết không thành công",
        description: e.message,
        variant: "destructive",
      });
    }
  }

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
      },
      {
        accessorKey: "slug",
        header: "Đường dẫn",
      },
      {
        accessorKey: "isPublished",
        header: "Trạng thái",
        cell: ({ row }: any) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              row.original.isPublished
                ? "bg-slate-100 text-slate-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {row.original.isPublished ? "Đã xuất bản" : "Bản nháp"}
          </span>
        ),
      },
      {
        accessorKey: "publishedAt",
        header: "Ngày xuất bản",
        cell: ({ row }: any) => formatDate(row.original.publishedAt),
      },
      {
        accessorKey: "createdBy",
        header: "Người tạo",
        cell: ({ row }: any) => row.original.createdBy?.fullName ?? "-",
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }: any) => (
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl px-4 text-base"
          >
            <Link href={`/admin/blogs/${row.original.id}`}>Xem / Chỉnh sửa</Link>
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <PageShell
      title="Quản lý bài viết"
      description="Tạo mới, xem và chỉnh sửa các bài viết hiển thị trên website."
      right={
        <Button
          onClick={handleOpenCreate}
          className="h-11 rounded-xl px-5 text-base font-semibold"
        >
          Tạo bài viết mới
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 text-base text-slate-700 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-medium">Tổng số bài viết:</span> {items.length}
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-medium">Đã xuất bản:</span>{" "}
              {items.filter((item) => item.isPublished).length}
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-medium">Bản nháp:</span>{" "}
              {items.filter((item) => !item.isPublished).length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="p-6 text-base text-slate-600">
              Đang tải danh sách bài viết...
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-base text-slate-600">
              Hiện chưa có bài viết nào. Anh bấm <strong>Tạo bài viết mới</strong> để bắt đầu.
            </div>
          ) : (
            <DataTable columns={columns as any} data={items} />
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : handleCloseCreate())}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              Tạo bài viết mới
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-5" onSubmit={form.handleSubmit(handleCreate)}>
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-800">
                Tiêu đề
              </Label>
              <Input
                {...form.register("title")}
                placeholder="Nhập tiêu đề bài viết"
                className="h-12 rounded-xl text-base"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-800">
                Đường dẫn
              </Label>
              <Input
                placeholder="vi-du-bai-viet-dau-tien"
                {...form.register("slug")}
                className="h-12 rounded-xl text-base"
                onChange={(e) => {
                  setSlugTouched(true);
                  form.setValue("slug", slugify(e.target.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
              <p className="text-sm leading-6 text-slate-500">
                Đường dẫn sẽ dùng trong URL của bài viết.
              </p>
              {form.formState.errors.slug && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-3 sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={handleCloseCreate}
                className="h-11 rounded-xl px-5 text-base"
              >
                Hủy / Quay lại
              </Button>

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 rounded-xl px-5 text-base font-semibold"
              >
                {form.formState.isSubmitting ? "Đang tạo..." : "Lưu và tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}