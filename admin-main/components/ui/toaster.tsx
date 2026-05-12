"use client";

import { Toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] flex-col gap-2 sm:w-[360px]">
      {toasts.map((t) => (
        <Toast key={t.id} title={t.title} description={t.description} variant={t.variant} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
