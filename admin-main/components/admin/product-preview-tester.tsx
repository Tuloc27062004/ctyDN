"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type PatternOption = {
  id: string;
  name: string;
  textureUrl: string;
};

type ColorOption = {
  id: string;
  name: string;
  hex: string;
};

type RenderAsset = {
  id?: string;
  viewCode: string;
  baseImageUrl: string;
  maskImageUrl: string;
  shadowImageUrl: string;
  highlightImageUrl: string;
  isDefault: boolean;
};

type Props = {
  patterns: PatternOption[];
  colors: ColorOption[];
  renderAssets: RenderAsset[];
  defaultPatternId?: string | null;
  defaultColorId?: string | null;
};

export function ProductPreviewTester({
  patterns,
  colors,
  renderAssets,
  defaultPatternId,
  defaultColorId,
}: Props) {
  const [patternId, setPatternId] = React.useState(defaultPatternId || patterns[0]?.id || "");
  const [colorId, setColorId] = React.useState(defaultColorId || colors[0]?.id || "");
  const [assetId, setAssetId] = React.useState(
    renderAssets.find((asset) => asset.isDefault)?.id || renderAssets.find((asset) => asset.isDefault)?.viewCode || renderAssets[0]?.id || renderAssets[0]?.viewCode || ""
  );

  React.useEffect(() => {
    if (!patternId && patterns[0]?.id) {
      setPatternId(defaultPatternId || patterns[0].id);
    }
  }, [patterns, patternId, defaultPatternId]);

  React.useEffect(() => {
    if (!colorId && colors[0]?.id) {
      setColorId(defaultColorId || colors[0].id);
    }
  }, [colors, colorId, defaultColorId]);

  React.useEffect(() => {
    if (!assetId && (renderAssets[0]?.id || renderAssets[0]?.viewCode)) {
      setAssetId(renderAssets.find((asset) => asset.isDefault)?.id || renderAssets.find((asset) => asset.isDefault)?.viewCode || renderAssets[0].id || renderAssets[0].viewCode || "");
    }
  }, [renderAssets, assetId]);

  const selectedPattern = patterns.find((item) => item.id === patternId) || null;
  const selectedColor = colors.find((item) => item.id === colorId) || null;
  const selectedAsset = renderAssets.find((item) => (item.id ?? item.viewCode) === assetId) || renderAssets[0] || null;

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Tester preview nội bộ</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Khối này chỉ giúp admin kiểm tra nhanh luồng dữ liệu pattern + color + asset pack. Đây chưa phải engine render hoàn chỉnh.
        </p>
      </div>

      {patterns.length === 0 || colors.length === 0 || renderAssets.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Cần có ít nhất 1 hoa văn, 1 màu và 1 asset pack để dùng tester.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-base font-medium text-slate-800">Hoa văn</label>
              <select
                value={patternId}
                onChange={(e) => setPatternId(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              >
                {patterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-base font-medium text-slate-800">Màu sắc</label>
              <select
                value={colorId}
                onChange={(e) => setColorId(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              >
                {colors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-base font-medium text-slate-800">Asset pack</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              >
                {renderAssets.map((asset) => (
                  <option key={asset.id ?? asset.viewCode} value={asset.id ?? asset.viewCode}>
                    {asset.viewCode}{asset.isDefault ? " (mặc định)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-base font-semibold text-slate-800">Xem cấu trúc layer</div>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {selectedAsset?.baseImageUrl ? (
                  <img
                    src={selectedAsset.baseImageUrl}
                    alt="Base layer"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}
                {selectedPattern?.textureUrl ? (
                  <img
                    src={selectedPattern.textureUrl}
                    alt="Pattern layer"
                    className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-70"
                  />
                ) : null}
                {selectedAsset?.maskImageUrl ? (
                  <img
                    src={selectedAsset.maskImageUrl}
                    alt="Mask layer"
                    className="absolute inset-0 h-full w-full object-contain opacity-80"
                  />
                ) : null}
                {selectedAsset?.shadowImageUrl ? (
                  <img
                    src={selectedAsset.shadowImageUrl}
                    alt="Shadow layer"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}
                {selectedAsset?.highlightImageUrl ? (
                  <img
                    src={selectedAsset.highlightImageUrl}
                    alt="Highlight layer"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}
                {selectedColor ? (
                  <div
                    className="absolute bottom-3 right-3 rounded-full border border-white/80 px-3 py-1 text-sm font-medium text-slate-800 shadow"
                    style={{ backgroundColor: selectedColor.hex }}
                  >
                    {selectedColor.name}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <div className="text-base font-semibold text-slate-800">Thông tin đang kiểm tra</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Frontend renderer sau này sẽ đọc đúng các URL và metadata này để dựng preview thật.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div><span className="font-medium">Hoa văn:</span> {selectedPattern?.name || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Texture URL:</span> {selectedPattern?.textureUrl || "-"}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Màu:</span>
                  <span>{selectedColor?.name || "-"}</span>
                  {selectedColor ? (
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-slate-200"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                  ) : null}
                </div>
                <div className="mt-2"><span className="font-medium">Hex:</span> {selectedColor?.hex || "-"}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div><span className="font-medium">View:</span> {selectedAsset?.viewCode || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Base:</span> {selectedAsset?.baseImageUrl || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Mask:</span> {selectedAsset?.maskImageUrl || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Shadow:</span> {selectedAsset?.shadowImageUrl || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Highlight:</span> {selectedAsset?.highlightImageUrl || "-"}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
