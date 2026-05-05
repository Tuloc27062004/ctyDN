"use client";

import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function UploadWidget(props: {
  onUploaded: (publicUrl: string) => Promise<void> | void;
}) {
  const [busy, setBusy] = React.useState(false);
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function onPick(file: File) {
    setBusy(true);

    try {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Chỉ hỗ trợ ảnh JPEG, PNG, WEBP, GIF.");
      }

      if (file.size > MAX_SIZE) {
        throw new Error("Ảnh vượt quá 5MB.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        throw new Error(json.error || "Đã xảy ra lỗi khi tải ảnh lên.");
      }

      await props.onUploaded(json.url);

      toast({
        title: "Tải ảnh lên thành công",
        description: "Ảnh đã được lưu.",
      });
    } catch (e: any) {
      toast({
        title: "Tải ảnh lên thất bại",
        description: e?.message ?? "Đã xảy ra lỗi khi tải ảnh lên.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={busy}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void onPick(file);
          }
          e.currentTarget.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={busy}
          className="h-11 min-w-[140px] text-base font-semibold"
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Đang tải..." : "Chọn ảnh"}
        </Button>

        <div className="text-base text-slate-600">
          {busy ? "Vui lòng chờ trong giây lát." : "Chỉ hỗ trợ tệp hình ảnh."}
        </div>
      </div>
    </div>
  );
}