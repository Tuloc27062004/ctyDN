"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type PatternOption = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

type ColorOption = {
  id: string;
  name: string;
  code: string;
  hex: string;
  isActive: boolean;
};

type Props = {
  patterns: PatternOption[];
  colors: ColorOption[];
  patternIds: string[];
  colorIds: string[];
  onPatternIdsChange: (ids: string[]) => void;
  onColorIdsChange: (ids: string[]) => void;
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function CategoryOptionRulesForm({
  patterns,
  colors,
  patternIds,
  colorIds,
  onPatternIdsChange,
  onColorIdsChange,
}: Props) {
  return (
    <Card className="space-y-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Quy tắc tùy chọn theo collection</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Collection quyết định tập hoa văn và màu sắc nào được phép dùng cho các sản phẩm thuộc collection đó.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="text-base font-semibold text-slate-800">Hoa văn được phép</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Chọn các hoa văn hợp lệ cho collection này.
            </p>
          </div>

          {patterns.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Chưa có master hoa văn.
            </div>
          ) : (
            <div className="grid gap-3">
              {patterns.map((pattern) => (
                <label
                  key={pattern.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={patternIds.includes(pattern.id)}
                    onChange={() => onPatternIdsChange(toggleId(patternIds, pattern.id))}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-800">{pattern.name}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {pattern.code}
                      </span>
                      {!pattern.isActive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Tạm ngưng master
                        </span>
                      ) : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-base font-semibold text-slate-800">Màu sắc được phép</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Chọn các màu hợp lệ cho collection này.
            </p>
          </div>

          {colors.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Chưa có master màu sắc.
            </div>
          ) : (
            <div className="grid gap-3">
              {colors.map((color) => (
                <label
                  key={color.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={colorIds.includes(color.id)}
                    onChange={() => onColorIdsChange(toggleId(colorIds, color.id))}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 rounded-full border border-slate-200"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="font-medium text-slate-800">{color.name}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {color.code}
                      </span>
                      {!color.isActive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Tạm ngưng master
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">Hex: {color.hex}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
