"use client";

import type { ColorOption } from "@/types/product.type";

interface ProductColorSelectorProps {
  colors: ColorOption[];
  selectedColorId: string | null;
  defaultColorId?: string | null;
  onChange: (colorId: string | null) => void;
}

export default function ProductColorSelector({
  colors,
  selectedColorId,
  defaultColorId = null,
  onChange,
}: ProductColorSelectorProps) {
  if (!colors.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
          selectedColorId === null
            ? "border-green-700 bg-green-50 shadow-sm"
            : "border-stone-200 bg-white hover:border-stone-300"
        }`}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-stone-400 bg-transparent text-xs text-stone-500">
          —
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-stone-800">
            Default
          </span>
          <span className="mt-1 block text-xs uppercase tracking-wide text-stone-500">
            No color override
          </span>
        </span>
      </button>

      {colors.map((color) => {
        const isActive = selectedColorId === color.id;

        return (
          <button
            key={color.id}
            type="button"
            onClick={() => onChange(color.id)}
            className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
              isActive
                ? "border-green-700 bg-green-50 shadow-sm"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <span
              className="h-8 w-8 rounded-full border border-stone-300"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-stone-800">
                {color.name}
              </span>
              <span className="mt-1 block text-xs uppercase tracking-wide text-stone-500">
                {color.code}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
