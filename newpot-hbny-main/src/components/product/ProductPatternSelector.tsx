"use client";

import type { PatternOption } from "@/types/product.type";

interface ProductPatternSelectorProps {
  patterns: PatternOption[];
  selectedPatternId: string | null;
  defaultPatternId?: string | null;
  onChange: (patternId: string | null) => void;
}

export default function ProductPatternSelector({
  patterns,
  selectedPatternId,
  defaultPatternId = null,
  onChange,
}: ProductPatternSelectorProps) {
  if (!patterns.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`overflow-hidden rounded-2xl border text-left transition-all ${
          selectedPatternId === null
            ? "border-green-700 bg-green-50 shadow-sm"
            : "border-stone-200 bg-white hover:border-stone-300"
        }`}
      >
        <div className="flex h-16 w-full items-center justify-center bg-stone-100">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Default
          </span>
        </div>

        <div className="px-3 py-2">
          <p className="text-sm font-medium text-stone-800">Default</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
            No pattern override
          </p>
        </div>
      </button>

      {patterns.map((pattern) => {
        const isActive = selectedPatternId === pattern.id;

        return (
          <button
            key={pattern.id}
            type="button"
            onClick={() => onChange(pattern.id)}
            className={`relative overflow-hidden rounded-2xl border text-left transition-all ${
              isActive
                ? "border-green-700 bg-green-50 shadow-sm"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <div
              className="h-16 w-full bg-stone-100"
              style={{
                backgroundImage: `url(${pattern.textureUrl})`,
                backgroundSize: `${Math.max((pattern.defaultScale ?? 1) * 100, 20)}px`,
                backgroundRepeat: "repeat",
              }}
            />
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-stone-800">{pattern.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                {pattern.code}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
