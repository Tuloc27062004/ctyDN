"use client";

import Script from "next/script";
import { Suspense, createElement, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  Color,
  Material,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import type { Object3D } from "three";
import type { ColorOption, PatternOption } from "@/types/product.type";

interface Product3DViewerProps {
  modelUrl?: string | null;
  selectedColor?: ColorOption | null;
  selectedPattern?: PatternOption | null;
}

type DynamicMaterial = Material & {
  color?: Color;
  map?: Texture | null;
  transparent?: boolean;
  opacity?: number;
  needsUpdate?: boolean;
};

type MeshSnapshot = {
  mesh: Mesh;
  originalMaterials: DynamicMaterial[];
};

const DEBUG_3D = true;

function debugLog(message: string, payload?: unknown) {
  if (!DEBUG_3D) return;
  if (payload !== undefined) {
    console.log(`[Product3DViewer] ${message}`, payload);
    return;
  }
  console.log(`[Product3DViewer] ${message}`);
}

function debugWarn(message: string, payload?: unknown) {
  if (!DEBUG_3D) return;
  if (payload !== undefined) {
    console.warn(`[Product3DViewer] ${message}`, payload);
    return;
  }
  console.warn(`[Product3DViewer] ${message}`);
}

function debugError(message: string, payload?: unknown) {
  if (!DEBUG_3D) return;
  if (payload !== undefined) {
    console.error(`[Product3DViewer] ${message}`, payload);
    return;
  }
  console.error(`[Product3DViewer] ${message}`);
}

function ViewerFallback({ message }: { message: string }) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
      {message}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <Html center>
      <div className="rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">
        Loading 3D model...
      </div>
    </Html>
  );
}

function clampOpacity(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 0), 1);
}

function safeRepeatScale(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1;
}

type Product3DSceneProps = Omit<Product3DViewerProps, "modelUrl"> & {
  modelUrl: string;
};

function Product3DScene({
  modelUrl,
  selectedColor,
  selectedPattern,
}: Product3DSceneProps) {
  const gltf = useGLTF(modelUrl) as { scene: Object3D };
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  const snapshot = useMemo<MeshSnapshot[]>(() => {
    const result: MeshSnapshot[] = [];
    clonedScene.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      result.push({
        mesh: child,
        originalMaterials: materials.map(
          (material) => material.clone() as DynamicMaterial
        ),
      });
    });
    debugLog("snapshot:captured-originals", {
      modelUrl,
      meshCount: result.length,
    });
    return result;
  }, [clonedScene, modelUrl]);

  useEffect(() => {
    return () => {
      debugLog("snapshot:dispose-on-unmount", {
        modelUrl,
        meshCount: snapshot.length,
      });
      snapshot.forEach(({ originalMaterials }) => {
        originalMaterials.forEach((material) => material.dispose());
      });
    };
  }, [snapshot, modelUrl]);

  useEffect(() => {
    const hasPattern = Boolean(selectedPattern?.textureUrl);
    const hasColor = Boolean(selectedColor?.hex);

    debugLog("appearance-effect:start", {
      modelUrl,
      hasPattern,
      hasColor,
      selectedColor: selectedColor
        ? { id: selectedColor.id, name: selectedColor.name, hex: selectedColor.hex }
        : null,
      selectedPattern: selectedPattern
        ? {
            id: selectedPattern.id,
            name: selectedPattern.name,
            textureUrl: selectedPattern.textureUrl,
            defaultScale: selectedPattern.defaultScale,
            defaultOpacity: selectedPattern.defaultOpacity,
          }
        : null,
    });

    let cancelled = false;
    let activeTexture: Texture | null = null;
    const createdMaterials: DynamicMaterial[] = [];

    snapshot.forEach(({ mesh, originalMaterials }) => {
      const workingMaterials = originalMaterials.map((original) => {
        const working = original.clone() as DynamicMaterial;

        if (working.color instanceof Color) {
          if (hasColor) {
            working.color.set(selectedColor!.hex);
          } else if (hasPattern) {
            working.color.set("#ffffff");
          }
        }

        if ("map" in working && hasPattern) {
          working.map = null;
        }

        working.needsUpdate = true;
        createdMaterials.push(working);
        return working;
      });

      mesh.material =
        workingMaterials.length === 1 ? workingMaterials[0] : workingMaterials;
    });

    if (!hasPattern) {
      return () => {
        cancelled = true;
        debugLog("appearance-effect:cleanup (no-pattern)", {
          modelUrl,
          createdMaterials: createdMaterials.length,
        });
        createdMaterials.forEach((material) => material.dispose());
      };
    }

    const textureLoader = new TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    debugLog("textureLoader.load:start", {
      modelUrl,
      textureUrl: selectedPattern?.textureUrl,
    });

    textureLoader.load(
      selectedPattern!.textureUrl!,
      (texture) => {
        if (cancelled) {
          debugLog("textureLoader.load:success-but-cancelled", {
            modelUrl,
            textureUrl: selectedPattern?.textureUrl,
          });
          texture.dispose();
          return;
        }

        activeTexture = texture;

        texture.colorSpace = SRGBColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;

        const safeScale = safeRepeatScale(selectedPattern?.defaultScale);
        texture.repeat.set(safeScale, safeScale);
        texture.needsUpdate = true;

        const opacity = clampOpacity(selectedPattern?.defaultOpacity);

        createdMaterials.forEach((material) => {
          if ("map" in material) {
            material.map = texture;
          }
          if (material instanceof MeshStandardMaterial) {
            material.transparent = opacity < 1;
            material.opacity = opacity;
          }
          material.needsUpdate = true;
        });

        debugLog("textureLoader.load:success", {
          modelUrl,
          textureUrl: selectedPattern?.textureUrl,
          safeScale,
          opacity,
        });
      },
      undefined,
      (error) => {
        if (cancelled) return;
        debugError("textureLoader.load:failed", {
          modelUrl,
          textureUrl: selectedPattern?.textureUrl,
          error,
        });
      }
    );

    return () => {
      cancelled = true;
      debugLog("appearance-effect:cleanup", {
        modelUrl,
        createdMaterials: createdMaterials.length,
        hasActiveTexture: Boolean(activeTexture),
      });

      if (activeTexture) {
        activeTexture.dispose();
        activeTexture = null;
      }

      createdMaterials.forEach((material) => material.dispose());
    };
  }, [snapshot, modelUrl, selectedColor, selectedPattern]);

  return (
    <Bounds fit clip margin={1.2}>
      <primitive object={clonedScene} />
    </Bounds>
  );
}

export default function Product3DViewer({
  modelUrl,
  selectedColor,
  selectedPattern,
}: Product3DViewerProps) {
  const [arOpen, setArOpen] = useState(false);

  useEffect(() => {
    debugLog("Product3DViewer props changed", {
      modelUrl,
      selectedColor: selectedColor
        ? { id: selectedColor.id, name: selectedColor.name, hex: selectedColor.hex }
        : null,
      selectedPattern: selectedPattern
        ? {
            id: selectedPattern.id,
            name: selectedPattern.name,
            textureUrl: selectedPattern.textureUrl,
            defaultScale: selectedPattern.defaultScale,
            defaultOpacity: selectedPattern.defaultOpacity,
          }
        : null,
    });
  }, [modelUrl, selectedColor, selectedPattern]);

  useEffect(() => {
    if (!arOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setArOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [arOpen]);

  if (!modelUrl) {
    debugWarn("viewer rendered without modelUrl");
    return <ViewerFallback message="3D model is not available for this product yet." />;
  }

  return (
    <>
      <Script
        id="google-model-viewer"
        src="https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
      />

      <div
        data-protect-content="true"
        className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-100 via-white to-stone-200 shadow-sm"
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white/80 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
              3D Preview
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Orbit, zoom, and inspect the stored product model.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs text-stone-500 sm:block">
              <div>{selectedPattern?.name ?? "Default pattern"}</div>
              <div>{selectedColor?.name ?? "Default color"}</div>
            </div>

            <button
              type="button"
              onClick={() => setArOpen(true)}
              className="shrink-0 rounded-full bg-green-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-green-800"
            >
              AR
            </button>
          </div>
        </div>

        <div className="aspect-square w-full bg-[radial-gradient(circle_at_top,#ffffff,#e7e5e4)]">
          <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
            <color attach="background" args={["#f8f6f2"]} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[4, 6, 6]} intensity={2.2} />
            <directionalLight position={[-5, -2, -4]} intensity={0.6} />

            <Suspense fallback={<LoadingOverlay />}>
              <Product3DScene
                modelUrl={modelUrl}
                selectedColor={selectedColor}
                selectedPattern={selectedPattern}
              />
            </Suspense>

            <OrbitControls
              enablePan={false}
              enableZoom={false}
              autoRotate={false}
            />
          </Canvas>
        </div>
      </div>

      {arOpen ? (
        <div
          className="fixed inset-0 z-50 grid bg-stone-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Product AR viewer"
          onClick={() => setArOpen(false)}
        >
          <div
            className="m-auto grid h-[min(760px,100%)] w-[min(960px,100%)] grid-rows-[auto,1fr] overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  AR Preview
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Use a supported phone to place this model in your room.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setArOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone-300 text-xl leading-none text-stone-700 transition hover:bg-stone-50"
                aria-label="Close AR viewer"
              >
                x
              </button>
            </div>

            <div className="min-h-0 bg-[radial-gradient(circle_at_top,#ffffff,#e7e5e4)]">
              {createElement(
                "model-viewer",
                {
                  src: modelUrl,
                  alt: "Product model in augmented reality",
                  ar: true,
                  "ar-modes": "webxr scene-viewer quick-look",
                  "ar-placement": "floor",
                  "ar-scale": "auto",
                  "auto-rotate": true,
                  "camera-controls": true,
                  "camera-orbit": "35deg 70deg 3m",
                  exposure: "0.9",
                  "shadow-intensity": "1",
                  "touch-action": "pan-y",
                  style: {
                    width: "100%",
                    height: "100%",
                    minHeight: "520px",
                    background: "transparent",
                  },
                },
                createElement(
                  "button",
                  {
                    slot: "ar-button",
                    type: "button",
                    className:
                      "absolute bottom-5 right-5 rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-green-800",
                  },
                  "View in my room"
                ),
                createElement(
                  "div",
                  {
                    slot: "ar-prompt",
                    className:
                      "absolute bottom-20 left-1/2 w-[min(320px,calc(100%-32px))] -translate-x-1/2 rounded-full bg-stone-900/85 px-4 py-3 text-center text-sm font-semibold text-white",
                  },
                  "Move your phone to scan the floor"
                )
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
