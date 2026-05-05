"use client";

import ProductColorSelector from "@/components/product/ProductColorSelector";
import ProductPatternSelector from "@/components/product/ProductPatternSelector";
import type { DetailedProduct } from "@/types/product.type";

interface ProductConfiguratorProps {
  product: DetailedProduct;
  selectedPatternId: string | null;
  selectedColorId: string | null;
  onChangePattern: (id: string | null) => void;
  onChangeColor: (id: string | null) => void;
}

export default function ProductConfigurator({
  product,
  selectedPatternId,
  selectedColorId,
  onChangePattern,
  onChangeColor,
}: ProductConfiguratorProps) {
  const hasPatterns = product.availablePatterns.length > 0;
  const hasColors = product.availableColors.length > 0;

  if (!hasPatterns && !hasColors) {
    return null;
  }

  return (
    <div className="space-y-6 rounded-3xl border border-stone-200 bg-stone-50 p-5 md:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
          Customize
        </p>
        <h2 className="mt-2 text-xl font-serif text-stone-800">
          Configure your pottery finish
        </h2>
      </div>

      {hasPatterns && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            Pattern
          </p>

          <ProductPatternSelector
            patterns={product.availablePatterns}
            selectedPatternId={selectedPatternId}
            defaultPatternId={product.defaultPatternId}
            onChange={onChangePattern}
          />
        </div>
      )}

      {hasColors && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            Color
          </p>

          <ProductColorSelector
            colors={product.availableColors}
            selectedColorId={selectedColorId}
            defaultColorId={product.defaultColorId}
            onChange={onChangeColor}
          />
        </div>
      )}
    </div>
  );
}