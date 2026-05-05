"use client";

import ProtectedImage from "@/components/protection/ProtectedImage";
import { useProductPreviewRenderer } from "@/hooks/useProductPreviewRenderer";
import { getFallbackPreviewImage } from "@/lib/product-preview";
import type {
  ColorOption,
  PatternOption,
  ProductImage,
  ProductRenderAsset,
} from "@/types/product.type";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/800?text=Preview";

interface ProductPreviewCanvasProps {
  renderAsset: ProductRenderAsset | null;
  selectedPattern: PatternOption | null;
  selectedColor: ColorOption | null;
  fallbackImages?: ProductImage[];
  previewUrl?: string | null;
  isRendering?: boolean;
  error?: string | null;
  className?: string;
}

export default function ProductPreviewCanvas({
  renderAsset,
  selectedPattern,
  selectedColor,
  fallbackImages = [],
  previewUrl: previewUrlProp,
  isRendering: isRenderingProp,
  error: errorProp,
  className = "",
}: ProductPreviewCanvasProps) {
  const rendererState = useProductPreviewRenderer(
    previewUrlProp === undefined ? renderAsset : null,
    previewUrlProp === undefined ? selectedPattern : null,
    previewUrlProp === undefined ? selectedColor : null
  );

  const previewUrl = previewUrlProp ?? rendererState.previewUrl;
  const isRendering = isRenderingProp ?? rendererState.isRendering;
  const error = errorProp ?? rendererState.error;
  const fallbackImage = getFallbackPreviewImage(fallbackImages) ?? PLACEHOLDER_IMAGE;
  const displayImage = previewUrl || renderAsset?.baseImageUrl || fallbackImage;

  return (
    <div className={`rounded-3xl border border-stone-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            Live Preview
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Updates when you change pattern or color.
          </p>
        </div>
        {isRendering && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
            Rendering...
          </span>
        )}
      </div>

      <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
        <ProtectedImage
          src={displayImage}
          alt="Configured product preview"
          className="h-full w-full object-cover"
        />

        {isRendering && (
          <div className="absolute inset-0 animate-pulse bg-white/35" aria-hidden="true" />
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-amber-700">
          Preview fallback is being shown because the live render could not be completed.
        </p>
      )}
    </div>
  );
}
