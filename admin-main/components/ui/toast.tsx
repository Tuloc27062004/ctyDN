"use client";

import { cn } from "@/lib/utils";

export function Toast(props: { title?: string; description?: string; variant?: "default" | "destructive"; onClose?: () => void }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-3 shadow-lg",
        props.variant === "destructive" ? "border-red-200" : "border-zinc-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {props.title ? <div className="font-medium">{props.title}</div> : null}
          {props.description ? <div className="text-sm text-zinc-600">{props.description}</div> : null}
        </div>
        <button className="text-sm text-zinc-500" onClick={props.onClose} aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}
