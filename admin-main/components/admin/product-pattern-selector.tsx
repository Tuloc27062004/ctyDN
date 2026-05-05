"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type PatternOption = {
  id: string;
  name: string;
  code: string;
  textureUrl: string;
  defaultScale: number;
  defaultOpacity: number;
  isActive: boolean;
};

type Props = {
  patterns: PatternOption[];
  selectedIds: string[];
  defaultPatternId: string;
  allowedIds?: string[] | null;
  onSelectedIdsChange: (ids: string[]) => void;
  onDefaultPatternIdChange: (id: string) => void;
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function ProductPatternSelector({
  patterns,
  selectedIds,
  defaultPatternId,
  allowedIds = null,
  onSelectedIdsChange,
  onDefaultPatternIdChange,
}: Props) {
  const allowedSet = React.useMemo(
    () => (allowedIds ? new Set(allowedIds) : null),
    [allowedIds]
  );

  const visiblePatterns = React.useMemo(() => {
    if (!allowedSet) return patterns;

    const allowed = patterns.filter((pattern) => allowedSet.has(pattern.id));
    const selectedButBlocked = patterns.filter(
      (pattern) => selectedIds.includes(pattern.id) && !allowedSet.has(pattern.id)
    );

    return [...allowed, ...selectedButBlocked];
  }, [patterns, selectedIds, allowedSet]);

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Hoa văn cho sản phẩm</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Chọn các hoa văn khách hàng có thể áp dụng cho dáng chậu này.
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

      {visiblePatterns.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Chưa có hoa văn nào khả dụng.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visiblePatterns.map((pattern) => {
            const isBlocked = allowedSet ? !allowedSet.has(pattern.id) : false;
            const checked = selectedIds.includes(pattern.id);

            return (
              <label
                key={pattern.id}
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
                      const nextIds = toggleId(selectedIds, pattern.id);
                      onSelectedIdsChange(nextIds);

                      if (checked && defaultPatternId === pattern.id) {
                        onDefaultPatternIdChange("");
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <div className="min-w-0 flex-1">
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
                    <div className="mt-2 text-sm text-slate-500">
                      Scale mặc định: {pattern.defaultScale} • Opacity mặc định: {pattern.defaultOpacity}
                    </div>
                    <div className="mt-2 break-all text-sm text-slate-500">
                      Texture: {pattern.textureUrl}
                    </div>
                    {checked ? (
                      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="default-pattern"
                          checked={defaultPatternId === pattern.id}
                          onChange={() => onDefaultPatternIdChange(pattern.id)}
                          className="h-4 w-4 border-slate-300"
                        />
                        Chọn làm hoa văn mặc định
                      </label>
                    ) : null}
                    {isBlocked ? (
                      <p className="mt-3 text-sm text-amber-700">
                        Hoa văn này không nằm trong bộ quy tắc của collection đang chọn.
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
        Đã chọn <span className="font-semibold">{selectedIds.length}</span> hoa văn.
        {defaultPatternId ? " Đã cấu hình hoa văn mặc định." : " Chưa chọn hoa văn mặc định."}
      </div>
    </Card>
  );
}
