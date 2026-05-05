"use client";

import * as React from "react";
import Script from "next/script";
import { Card } from "@/components/ui/card";

type ModelViewerElement = HTMLElement & {
  src?: string;
  poster?: string;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<ModelViewerElement>,
        ModelViewerElement
      > & {
        src?: string;
        poster?: string;
        "camera-controls"?: boolean | string;
        "auto-rotate"?: boolean | string;
        "shadow-intensity"?: string;
        exposure?: string;
        "interaction-prompt"?: string;
      };
    }
  }
}

export type Product3DViewerProps = {
  modelUrl: string;
  posterUrl?: string | null;
  title?: string;
  description?: string;
  className?: string;
};

export function Product3DViewer({
  modelUrl,
  posterUrl,
  title = "Xem mô hình 3D",
  description = "Kéo để xoay, lăn chuột để zoom và kiểm tra model đã lưu trên blob.",
  className,
}: Product3DViewerProps) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (customElements.get("model-viewer")) {
      setReady(true);
      return;
    }

    const onReady = () => setReady(true);

    customElements.whenDefined("model-viewer").then(onReady).catch(() => {});

    return () => {};
  }, []);

  return (
    <>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.2.0/model-viewer.min.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />

      <Card
        className={[
          "space-y-4 rounded-2xl border border-slate-200 p-5 shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div>
          <div className="text-lg font-semibold text-slate-800">{title}</div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {ready ? (
            <model-viewer
              src={modelUrl}
              poster={posterUrl ?? undefined}
              camera-controls
              auto-rotate
              shadow-intensity="1"
              exposure="1"
              interaction-prompt="auto"
              style={{
                width: "100%",
                height: "480px",
                backgroundColor: "#f8fafc",
              }}
            />
          ) : (
            <div className="flex h-[480px] items-center justify-center px-6 text-sm text-slate-500">
              Đang tải trình xem 3D...
            </div>
          )}
        </div>

        <div className="break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Model URL:</span> {modelUrl}
        </div>
      </Card>
    </>
  );
}
