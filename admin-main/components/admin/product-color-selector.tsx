"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type ColorOption = {
  id: string;
  name: string;
  code: string;
  hex: string;
  swatchUrl?: string | null;
  isActive: boolean;
};

type Props = {
  colors: ColorOption[];
  selectedIds: string[];
  defaultColorId: string;
  allowedIds?: string[] | null;
  onSelectedIdsChange: (ids: string[]) => void;
  onDefaultColorIdChange: (id: string) => void;
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function ProductColorSelector({
  colors,
  selectedIds,
  defaultColorId,
  allowedIds = null,
  onSelectedIdsChange,
  onDefaultColorIdChange,
}: Props) {
  const allowedSet = React.useMemo(
    () => (allowedIds ? new Set(allowedIds) : null),
    [allowedIds]
  );

  const visibleColors = React.useMemo(() => {
    if (!allowedSet) return colors;

    const allowed = colors.filter((color) => allowedSet.has(color.id));
    const selectedButBlocked = colors.filter(
      (color) => selectedIds.includes(color.id) && !allowedSet.has(color.id)
    );

    return [...allowed, ...selectedButBlocked];
  }, [colors, selectedIds, allowedSet]);

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Màu sắc cho sản phẩm</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Chọn các màu khách hàng có thể áp dụng cho dáng chậu này.
        </p>
        {allowedSet ? (
          <p className="mt-2 text-sm leading-6 text-amber-700">
            Danh sách bên dưới đang được giới hạn theo các bộ sưu tập đã chọn.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Chưa giới hạn theo bộ sưu tập, admin có thể chọn từ toàn bộ master data.
          </p>
        )}
      </div>

      {visibleColors.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Chưa có màu nào khả dụng.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleColors.map((color) => {
            const isBlocked = allowedSet ? !allowedSet.has(color.id) : false;
            const checked = selectedIds.includes(color.id);

            return (
              <label
                key={color.id}
                className={`rounded-xl border p-4 transition-colors ${
                  checked
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 bg-white"
                } ${isBlocked ? "opacity-70" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isBlocked}
                    onChange={() => {
                      const nextIds = toggleId(selectedIds, color.id);
                      onSelectedIdsChange(nextIds);

                      if (checked && defaultColorId === color.id) {
                        onDefaultColorIdChange("");
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 rounded-full border border-slate-200"
                        style={{ backgroundColor: color.hex }}
                        title={color.hex}
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
                    {color.swatchUrl ? (
                      <div className="mt-2 break-all text-sm text-slate-500">
                        Swatch: {color.swatchUrl}
                      </div>
                    ) : null}

                    {checked ? (
                      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="default-color"
                          checked={defaultColorId === color.id}
                          onChange={() => onDefaultColorIdChange(color.id)}
                          className="h-4 w-4 border-slate-300"
                        />
                        Chọn làm màu mặc định
                      </label>
                    ) : null}

                    {isBlocked ? (
                      <p className="mt-3 text-sm text-amber-700">
                        Màu này không nằm trong bộ quy tắc của collection đang chọn.
                      </p>
                    ) : null}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Đã chọn <span className="font-semibold">{selectedIds.length}</span> màu.
        {defaultColorId ? " Đã cấu hình màu mặc định." : " Chưa chọn màu mặc định."}
      </div>
    </Card>
  );
}
