"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await props.onConfirm();
      props.onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="rounded-xl border border-slate-200 bg-white px-6 py-5 sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {props.title}
          </DialogTitle>
        </DialogHeader>

        {props.description ? (
          <div className="text-base leading-6 text-slate-600">
            {props.description}
          </div>
        ) : null}

        <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={busy}
            className="h-11 min-w-[110px] text-base font-semibold"
          >
            {props.cancelText ?? "Hủy"}
          </Button>

          <Button
            onClick={confirm}
            disabled={busy}
            className="h-11 min-w-[120px] text-base font-semibold"
          >
            {busy ? "Đang xử lý..." : props.confirmText ?? "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}