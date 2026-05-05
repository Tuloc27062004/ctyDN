"use client";

import { useEffect, useState } from "react";
import { renderProductPreview } from "@/lib/product-preview";
import type {
  ColorOption,
  PatternOption,
  ProductRenderAsset,
} from "@/types/product.type";

interface UseProductPreviewRendererResult {
  previewUrl: string | null;
  isRendering: boolean;
  error: string | null;
}

export function useProductPreviewRenderer(
  renderAsset: ProductRenderAsset | null,
  selectedPattern: PatternOption | null,
  selectedColor: ColorOption | null
): UseProductPreviewRendererResult {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function generatePreview() {
      if (!renderAsset) {
        setPreviewUrl(null);
        setError(null);
        setIsRendering(false);
        return;
      }

      setIsRendering(true);
      setError(null);

      try {
        const nextPreviewUrl = await renderProductPreview({
          renderAsset,
          selectedPattern,
          selectedColor,
        });

        if (!isCancelled) {
          setPreviewUrl(nextPreviewUrl ?? renderAsset.baseImageUrl ?? null);
        }
      } catch (previewError) {
        if (!isCancelled) {
          setPreviewUrl(renderAsset.baseImageUrl ?? null);
          setError(
            previewError instanceof Error
              ? previewError.message
              : "Failed to render preview."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    void generatePreview();

    return () => {
      isCancelled = true;
    };
  }, [renderAsset, selectedPattern, selectedColor]);

  return { previewUrl, isRendering, error };
}
