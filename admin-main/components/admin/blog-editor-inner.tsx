"use client";

import "@mdxeditor/editor/style.css";

import * as React from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertImage,
  ListsToggle,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  imagePlugin,
} from "@mdxeditor/editor";

type Props = {
  markdown: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type UploadResponse = {
  url: string;
  pathname?: string;
};

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
        "Không tải được ảnh bài viết."
    );
  }

  return json.url;
}

function estimateWordCount(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

export default function BlogEditorInner({
  markdown,
  onChange,
  placeholder = "Nhập nội dung bài viết tại đây...",
}: Props) {
  const [uploading, setUploading] = React.useState(false);

  const wordCount = React.useMemo(() => estimateWordCount(markdown || ""), [markdown]);
  const charCount = markdown.length;

  const imageUploadHandler = React.useCallback(async (file: File) => {
    setUploading(true);
    try {
      return await uploadBlogImage(file);
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-800">
              Soạn nội dung bài viết
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Anh có thể viết như trình soạn thảo bình thường hoặc gõ theo Markdown.
              Hệ thống sẽ lưu nội dung dưới dạng Markdown.
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Có thể chèn ảnh từ toolbar, kéo thả ảnh, hoặc dán ảnh trực tiếp vào nội dung.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <div className="text-slate-500">Số từ</div>
              <div className="text-lg font-semibold text-slate-800">{wordCount}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <div className="text-slate-500">Ký tự</div>
              <div className="text-lg font-semibold text-slate-800">{charCount}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-800">Tiêu đề</div>
            <div className="mt-1 font-mono text-xs text-slate-600"># Tiêu đề lớn</div>
            <div className="font-mono text-xs text-slate-600">## Tiêu đề nhỏ</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-800">Nhấn mạnh</div>
            <div className="mt-1 font-mono text-xs text-slate-600">**chữ đậm**</div>
            <div className="font-mono text-xs text-slate-600">*chữ nghiêng*</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-800">Danh sách</div>
            <div className="mt-1 font-mono text-xs text-slate-600">- Mục nội dung</div>
            <div className="font-mono text-xs text-slate-600">1. Bước thực hiện</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-800">Liên kết</div>
            <div className="mt-1 font-mono text-xs text-slate-600">[Tên liên kết](https://...)</div>
          </div>
        </div>

        {uploading ? (
          <p className="mt-3 text-sm font-medium text-blue-600">
            Đang tải ảnh lên...
          </p>
        ) : null}
      </div>

      <MDXEditor
        key={markdown ? "has-content" : "empty-content"}
        markdown={markdown}
        onChange={onChange}
        placeholder={placeholder}
        className="min-h-[560px] bg-white text-slate-800"
        contentEditableClassName="prose prose-slate max-w-none min-h-[420px] px-6 py-6 text-[17px] leading-8 focus:outline-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          imagePlugin({
            imageUploadHandler,
          }),
          toolbarPlugin({
            toolbarClassName: "border-b border-slate-200 bg-white px-4 py-4",
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">
                    Chỉnh sửa
                  </span>
                  <UndoRedo />
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">
                    Kiểu chữ
                  </span>
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">
                    Danh sách
                  </span>
                  <ListsToggle />
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">
                    Chèn nội dung
                  </span>
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                </div>
              </div>
            ),
          }),
        ]}
      />

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-white px-3 py-1 border border-slate-200">
            Hỗ trợ kéo thả ảnh
          </span>
          <span className="rounded-full bg-white px-3 py-1 border border-slate-200">
            Hỗ trợ dán ảnh trực tiếp
          </span>
          <span className="rounded-full bg-white px-3 py-1 border border-slate-200">
            Có toolbar trực quan
          </span>
          <span className="rounded-full bg-white px-3 py-1 border border-slate-200">
            Gõ Markdown nhanh
          </span>
        </div>
      </div>
    </div>
  );
}