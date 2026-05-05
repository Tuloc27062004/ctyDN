import type {
  ColorOption,
  PatternOption,
  ProductImage,
  ProductRenderAsset,
} from "@/types/product.type";

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

async function safeLoadImage(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src) return null;

  try {
    return await loadImage(src);
  } catch {
    return null;
  }
}

function createTexturePattern(
  ctx: CanvasRenderingContext2D,
  textureImage: HTMLImageElement,
  scale = 1
): CanvasPattern | null {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  if (Math.abs(safeScale - 1) < 0.001) {
    return ctx.createPattern(textureImage, "repeat");
  }

  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = Math.max(8, Math.round(textureImage.naturalWidth * safeScale));
  patternCanvas.height = Math.max(8, Math.round(textureImage.naturalHeight * safeScale));

  const patternCtx = patternCanvas.getContext("2d");
  if (!patternCtx) return ctx.createPattern(textureImage, "repeat");

  patternCtx.drawImage(textureImage, 0, 0, patternCanvas.width, patternCanvas.height);
  return ctx.createPattern(patternCanvas, "repeat");
}

export function getFallbackPreviewImage(images?: ProductImage[]): string | null {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  return images.find((image) => image.isRender)?.url ?? images[0]?.url ?? null;
}

export interface RenderProductPreviewOptions {
  renderAsset: ProductRenderAsset;
  selectedPattern?: PatternOption | null;
  selectedColor?: ColorOption | null;
  targetWidth?: number;
  targetHeight?: number;
}

export async function renderProductPreview({
  renderAsset,
  selectedPattern,
  selectedColor,
  targetWidth,
  targetHeight,
}: RenderProductPreviewOptions): Promise<string | null> {
  try {
    const [baseImage, maskImage, shadowImage, highlightImage, textureImage] =
      await Promise.all([
        loadImage(renderAsset.baseImageUrl),
        safeLoadImage(renderAsset.maskImageUrl),
        safeLoadImage(renderAsset.shadowImageUrl),
        safeLoadImage(renderAsset.highlightImageUrl),
        safeLoadImage(selectedPattern?.textureUrl ?? null),
      ]);

    const width =
      targetWidth ?? renderAsset.width ?? baseImage.naturalWidth ?? baseImage.width;
    const height =
      targetHeight ?? renderAsset.height ?? baseImage.naturalHeight ?? baseImage.height;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return renderAsset.baseImageUrl;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    const shouldComposeOverlay = Boolean(
      maskImage && (selectedColor?.hex || textureImage)
    );

    if (shouldComposeOverlay && maskImage) {
      const overlayCanvas = document.createElement("canvas");
      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;

      const overlayCtx = overlayCanvas.getContext("2d");
      if (overlayCtx) {
        if (selectedColor?.hex) {
          overlayCtx.save();
          overlayCtx.globalAlpha = 0.9;
          overlayCtx.fillStyle = selectedColor.hex;
          overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          overlayCtx.restore();
        }

        if (textureImage) {
          const pattern = createTexturePattern(
            overlayCtx,
            textureImage,
            selectedPattern?.defaultScale ?? 1
          );

          if (pattern) {
            overlayCtx.save();
            overlayCtx.globalAlpha =
              selectedPattern?.defaultOpacity != null
                ? Math.min(Math.max(selectedPattern.defaultOpacity, 0), 1)
                : 0.85;
            overlayCtx.fillStyle = pattern;
            overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            overlayCtx.restore();
          }
        }

        overlayCtx.globalCompositeOperation = "destination-in";
        overlayCtx.drawImage(maskImage, 0, 0, overlayCanvas.width, overlayCanvas.height);
        overlayCtx.globalCompositeOperation = "source-over";

        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
      }
    }

    if (shadowImage) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.7;
      ctx.drawImage(shadowImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    if (highlightImage) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.55;
      ctx.drawImage(highlightImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    return canvas.toDataURL("image/png");
  } catch {
    return renderAsset.baseImageUrl ?? null;
  }
}
