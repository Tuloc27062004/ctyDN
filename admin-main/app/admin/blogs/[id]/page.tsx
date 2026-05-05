"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { apiJson } from "@/lib/api";
import { PageShell } from "@/components/admin/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import BlogEditor from "@/components/admin/blog-editor";

const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdBy: z
    .object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
    })
    .optional(),
});

const getSchema = z.object({
  item: itemSchema,
});

const saveSchema = z.object({
  title: z
    .string()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  slug: z
    .string()
    .min(1, "Vui lòng nhập đường dẫn")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Đường dẫn chỉ được gồm chữ thường, số và dấu gạch ngang"
    ),
  excerpt: z
    .string()
    .max(500, "Mô tả ngắn không được vượt quá 500 ký tự")
    .optional()
    .or(z.literal("")),
  content: z
    .string()
    .max(50000, "Nội dung quá dài")
    .optional()
    .or(z.literal("")),
  coverImageUrl: z
    .string()
    .url("Liên kết ảnh bìa không hợp lệ")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean(),
});

type SaveValues = z.infer<typeof saveSchema>;

type UploadResponse = {
  url: string;
  pathname?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function asNullable(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function estimateWordCount(value?: string | null) {
  if (!value) return 0;

  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

async function uploadBlogImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ được tải lên file ảnh.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/admin/blog-images", {
    method: "POST",
    body: formData,
  });

  const json = (await res.json()) as
    | UploadResponse
    | { error?: string; message?: string };

  if (!res.ok || !("url" in json)) {
    throw new Error(
      ("error" in json && json.error) ||
        ("message" in json && json.message) ||
        "Không tải được ảnh."
    );
  }

  return json.url;
}

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [blogMeta, setBlogMeta] = React.useState<z.infer<typeof itemSchema> | null>(null);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = React.useState(false);
  const [draggingCover, setDraggingCover] = React.useState(false);

  const coverImageInputRef = React.useRef<HTMLInputElement | null>(null);

  const form = useForm<SaveValues>({
    resolver: zodResolver(saveSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImageUrl: "",
      isPublished: false,
    },
  });

  const titleValue = form.watch("title");
  const excerptValue = form.watch("excerpt") || "";
  const contentValue = form.watch("content") || "";
  const coverImageUrl = form.watch("coverImageUrl") || "";
  const isPublished = form.watch("isPublished");

  const excerptLength = excerptValue.length;
  const contentLength = contentValue.length;
  const contentWordCount = React.useMemo(
    () => estimateWordCount(contentValue),
    [contentValue]
  );

  const slugRegister = form.register("slug");
  const excerptRegister = form.register("excerpt");
  const coverImageUrlRegister = form.register("coverImageUrl");

  React.useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugify(titleValue), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [titleValue, slugTouched, form]);

  React.useEffect(() => {
    async function load() {
      try {
        const data = await apiJson(
          `/api/admin/blogs/${params.id}`,
          { method: "GET" },
          getSchema
        );

        const item = data.item;
        setBlogMeta(item);

        form.reset({
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt ?? "",
          content: item.content ?? "",
          coverImageUrl: item.coverImageUrl ?? "",
          isPublished: item.isPublished,
        });

        setSlugTouched(true);
      } catch (e: any) {
        toast({
          title: "Không tải được bài viết",
          description: e.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      void load();
    }
  }, [params.id, form, toast]);

  async function handleCoverImageUpload(file: File) {
    setUploadingCoverImage(true);

    try {
      const url = await uploadBlogImage(file);

      form.setValue("coverImageUrl", url, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({
        title: "Đã tải ảnh bìa",
        description: "Ảnh đã được tải lên và gắn vào bài viết.",
      });
    } catch (e: any) {
      toast({
        title: "Tải ảnh bìa không thành công",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setUploadingCoverImage(false);
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = "";
      }
    }
  }

  async function onSave(values: SaveValues) {
    const ok = window.confirm(
      `Anh có muốn lưu thay đổi cho bài viết này không?\n\nTiêu đề: ${values.title}\nĐường dẫn: ${values.slug}\nTrạng thái: ${
        values.isPublished ? "Đã xuất bản" : "Chưa xuất bản"
      }`
    );
    if (!ok) return;

    try {
      const data = await apiJson(
        `/api/admin/blogs/${params.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            slug: values.slug,
            excerpt: asNullable(values.excerpt),
            content: asNullable(values.content),
            coverImageUrl: asNullable(values.coverImageUrl),
            isPublished: values.isPublished,
          }),
        },
        z.object({
          item: itemSchema,
        })
      );

      setBlogMeta(data.item);

      toast({
        title: "Đã lưu thay đổi",
        description: "Thông tin bài viết đã được cập nhật.",
      });
    } catch (e: any) {
      toast({
        title: "Lưu không thành công",
        description: e.message,
        variant: "destructive",
      });
    }
  }

  async function onDelete() {
    const ok = window.confirm(
      `Anh có chắc muốn xóa vĩnh viễn bài viết này không?\n\nTiêu đề: ${form.getValues(
        "title"
      )}`
    );
    if (!ok) return;

    try {
      await apiJson(
        `/api/admin/blogs/${params.id}`,
        { method: "DELETE" },
        z.object({ ok: z.boolean() })
      );

      toast({
        title: "Đã xóa bài viết",
      });

      router.push("/admin/blogs");
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Xóa không thành công",
        description: e.message,
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <PageShell title="Bài viết" description="Đang tải dữ liệu...">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-700">
          Đang tải dữ liệu...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Chỉnh sửa bài viết"
      description="Cập nhật nội dung và trạng thái hiển thị của bài viết."
      right={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/blogs">Quay lại</Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            className="h-11 rounded-xl border-red-300 px-5 text-base text-red-700 hover:bg-red-50"
          >
            Xóa bài viết
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={form.handleSubmit(onSave)}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Thông tin chính</h2>
            <p className="mt-1 text-base text-slate-600">
              Điền những thông tin quan trọng của bài viết bên dưới.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-800">Tiêu đề</Label>
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
              <Label className="text-base font-medium text-slate-800">Đường dẫn</Label>
              <Input
                name={slugRegister.name}
                ref={slugRegister.ref}
                value={form.watch("slug") || ""}
                onBlur={slugRegister.onBlur}
                onChange={(e) => {
                  setSlugTouched(true);
                  const nextValue = slugify(e.target.value);
                  form.setValue("slug", nextValue, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                placeholder="vi-du-bai-viet"
                className="h-12 rounded-xl text-base"
              />
              <p className="text-sm text-slate-500">
                Đường dẫn sẽ dùng trong URL của bài viết.
              </p>
              {form.formState.errors.slug && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base font-medium text-slate-800">Mô tả ngắn</Label>
                <span className="text-sm text-slate-500">{excerptLength}/500 ký tự</span>
              </div>

              <Textarea
                rows={4}
                name={excerptRegister.name}
                ref={excerptRegister.ref}
                value={excerptValue}
                onBlur={excerptRegister.onBlur}
                onChange={excerptRegister.onChange}
                placeholder="Nhập vài dòng mô tả ngắn cho bài viết"
                className="rounded-xl text-base leading-7"
              />

              <p className="text-sm leading-6 text-slate-500">
                Mô tả ngắn sẽ hữu ích cho phần giới thiệu bài viết và SEO cơ bản.
              </p>

              {form.formState.errors.excerpt && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.excerpt.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Nội dung bài viết</h2>
              <p className="mt-1 text-base text-slate-600">
                Soạn thảo nội dung chính của bài viết.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div>Số từ ước tính: <span className="font-semibold text-slate-800">{contentWordCount}</span></div>
              <div>Ký tự hiện tại: <span className="font-semibold text-slate-800">{contentLength}</span>/50000</div>
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-800">Markdown nhanh</div>
              <div className="mt-1 font-mono text-xs text-slate-600"># Tiêu đề</div>
              <div className="font-mono text-xs text-slate-600">## Mục con</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-800">Nhấn mạnh</div>
              <div className="mt-1 font-mono text-xs text-slate-600">**chữ đậm**</div>
              <div className="font-mono text-xs text-slate-600">*chữ nghiêng*</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-800">Danh sách</div>
              <div className="mt-1 font-mono text-xs text-slate-600">- Mục 1</div>
              <div className="font-mono text-xs text-slate-600">1. Bước 1</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-800">Liên kết</div>
              <div className="mt-1 font-mono text-xs text-slate-600">[Tên link](https://...)</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-slate-800">Nội dung</Label>
            <BlogEditor
              markdown={contentValue}
              onChange={(value) =>
                form.setValue("content", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              placeholder="Nhập nội dung bài viết tại đây..."
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-600">
                {form.formState.errors.content.message}
              </p>
            )}
            <p className="text-sm leading-6 text-slate-500">
              Hỗ trợ tiêu đề, chữ đậm, chữ nghiêng, danh sách, liên kết, bảng và chèn ảnh trực tiếp vào nội dung.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Ảnh bìa và trạng thái</h2>
            <p className="mt-1 text-base text-slate-600">
              Có thể tải ảnh trực tiếp từ máy hoặc dán URL ảnh có sẵn.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="space-y-3">
              <Label className="text-base font-medium text-slate-800">Tải ảnh bìa từ máy</Label>

              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleCoverImageUpload(file);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggingCover(true);
                }}
                onDragLeave={() => setDraggingCover(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDraggingCover(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    void handleCoverImageUpload(file);
                  }
                }}
                className={`rounded-2xl border-2 border-dashed p-5 transition ${
                  draggingCover
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-medium text-slate-800">
                      Kéo thả ảnh vào đây hoặc chọn file từ máy
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Hỗ trợ JPG, PNG, WEBP, GIF. Dung lượng tối đa theo backend hiện tại là 5MB.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl px-5 text-base"
                    disabled={uploadingCoverImage}
                    onClick={() => coverImageInputRef.current?.click()}
                  >
                    {uploadingCoverImage ? "Đang tải ảnh..." : "Chọn ảnh bìa"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-800">
                Hoặc nhập liên kết ảnh bìa
              </Label>
              <Input
                placeholder="https://..."
                name={coverImageUrlRegister.name}
                ref={coverImageUrlRegister.ref}
                value={coverImageUrl}
                onBlur={coverImageUrlRegister.onBlur}
                onChange={coverImageUrlRegister.onChange}
                className="h-12 rounded-xl text-base"
              />
              <p className="text-sm leading-6 text-slate-500">
                Nếu anh đã có ảnh trên một URL công khai, có thể dán vào đây.
              </p>
              {form.formState.errors.coverImageUrl && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.coverImageUrl.message}
                </p>
              )}
            </div>

            {coverImageUrl.trim() ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-base font-medium text-slate-800">
                    Xem trước ảnh bìa
                  </Label>

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      form.setValue("coverImageUrl", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    Xóa ảnh bìa
                  </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img
                    src={coverImageUrl}
                    alt="Xem trước ảnh bìa"
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              </div>
            ) : null}

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <input
                  id="isPublished"
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) =>
                    form.setValue("isPublished", e.target.checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="h-5 w-5 rounded border-slate-300"
                />
                <Label htmlFor="isPublished" className="text-base font-medium text-slate-800">
                  Hiển thị bài viết công khai
                </Label>
              </div>
              <p className="mt-2 pl-8 text-sm leading-6 text-slate-500">
                Bật mục này nếu anh muốn bài viết được xuất bản để người dùng có thể xem.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Thông tin thêm</h2>
            <p className="mt-1 text-base text-slate-600">
              Các thông tin hỗ trợ để dễ theo dõi bài viết.
            </p>
          </div>

          <div className="grid gap-3 text-base text-slate-700">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-medium">Tác giả:</span>{" "}
              {blogMeta?.createdBy?.fullName ?? "-"}
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-medium">Ngày xuất bản:</span>{" "}
              {formatDateTime(blogMeta?.publishedAt)}
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-medium">Cập nhật lần cuối:</span>{" "}
              {formatDateTime(blogMeta?.updatedAt)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            asChild
            type="button"
            variant="outline"
            className="h-12 rounded-xl px-6 text-base"
          >
            <Link href="/admin/blogs">Hủy / Quay lại</Link>
          </Button>

          <Button
            type="submit"
            disabled={form.formState.isSubmitting || uploadingCoverImage}
            className="h-12 rounded-xl px-6 text-base font-semibold"
          >
            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}