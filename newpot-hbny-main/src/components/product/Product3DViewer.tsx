"use client";

import Script from "next/script";
import {
  Suspense,
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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

type ModelViewerElement = HTMLElement & {
  activateAR?: () => Promise<void> | void;
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

function isMobileOrTabletDevice() {
  const userAgent = navigator.userAgent || "";
  const mobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const iPadOSDesktopMode =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
  const tabletSizedTouchDevice =
    coarsePointer && Math.min(window.innerWidth, window.innerHeight) <= 1024;

  return mobileUserAgent || iPadOSDesktopMode || tabletSizedTouchDevice;
}

async function exportConfiguredModelBuffer(
  modelUrl: string,
  selectedColor?: ColorOption | null,
  selectedPattern?: PatternOption | null
) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const scene = gltf.scene.clone(true);
  const textureLoader = new TextureLoader();
  textureLoader.setCrossOrigin("anonymous");

  const patternTexture = selectedPattern?.textureUrl
    ? await textureLoader.loadAsync(selectedPattern.textureUrl)
    : null;

  if (patternTexture) {
    patternTexture.colorSpace = SRGBColorSpace;
    patternTexture.wrapS = RepeatWrapping;
    patternTexture.wrapT = RepeatWrapping;
    const safeScale = safeRepeatScale(selectedPattern?.defaultScale);
    patternTexture.repeat.set(safeScale, safeScale);
    patternTexture.needsUpdate = true;
  }

  scene.traverse((child) => {
    if (!(child instanceof Mesh)) return;

    const sourceMaterials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    const workingMaterials = sourceMaterials.map((sourceMaterial) => {
      const material = sourceMaterial.clone() as DynamicMaterial;

      if (material.color instanceof Color) {
        if (selectedColor?.hex) {
          material.color.set(selectedColor.hex);
        } else if (patternTexture) {
          material.color.set("#ffffff");
        }
      }

      if ("map" in material && patternTexture) {
        material.map = patternTexture;
      }

      if (material instanceof MeshStandardMaterial) {
        const opacity = clampOpacity(selectedPattern?.defaultOpacity);
        material.transparent = opacity < 1;
        material.opacity = opacity;
      }

      material.needsUpdate = true;
      return material;
    });

    child.material =
      workingMaterials.length === 1 ? workingMaterials[0] : workingMaterials;
  });

  const exporter = new GLTFExporter();
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
          return;
        }

        resolve(new TextEncoder().encode(JSON.stringify(result)).buffer);
      },
      reject,
      { binary: true }
    );
  });

  return arrayBuffer;
}

async function uploadConfiguredArModel(arrayBuffer: ArrayBuffer) {
  const formData = new FormData();
  formData.append(
    "file",
    new File([arrayBuffer], "configured-product.glb", {
      type: "model/gltf-binary",
    })
  );

  const res = await fetch("/api/ar-models", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;

  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Failed to upload AR model"
    );
  }

  if (!data || typeof data.url !== "string") {
    throw new Error("AR model upload did not return a URL");
  }

  return data.url;
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
  const [arQrUrl, setArQrUrl] = useState("");
  const [arModelUrl, setArModelUrl] = useState<string | null>(null);
  const [arModelBusy, setArModelBusy] = useState(false);
  const [arModelError, setArModelError] = useState<string | null>(null);
  const [showPhoneArViewer, setShowPhoneArViewer] = useState(false);
  const [autoArAttemptKey, setAutoArAttemptKey] = useState("");
  const modelViewerRef = useRef<ModelViewerElement | null>(null);

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
    const url = new URL(window.location.href);
    const shouldOpenAr = url.searchParams.get("ar") === "1";

    url.searchParams.set("ar", "1");
    if (selectedPattern?.id) {
      url.searchParams.set("patternId", selectedPattern.id);
    } else {
      url.searchParams.delete("patternId");
    }

    if (selectedColor?.id) {
      url.searchParams.set("colorId", selectedColor.id);
    } else {
      url.searchParams.delete("colorId");
    }

    const nextArQrUrl = url.toString();
    const timer = window.setTimeout(() => {
      setArQrUrl(nextArQrUrl);

      if (shouldOpenAr) {
        setShowPhoneArViewer(true);
        setArOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedColor?.id, selectedPattern?.id]);

  useEffect(() => {
    if (!showPhoneArViewer || !modelUrl) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setArModelBusy(true);
      setArModelError(null);

      exportConfiguredModelBuffer(modelUrl, selectedColor, selectedPattern)
        .then((arrayBuffer) => uploadConfiguredArModel(arrayBuffer))
        .then((publicUrl) => {
          if (cancelled) return;
          setArModelUrl(publicUrl);
        })
        .catch((error) => {
          if (cancelled) return;
          debugError("ar-export:failed", error);
          setArModelUrl(null);
          setArModelError("Could not prepare the configured AR model. Showing the original model instead.");
        })
        .finally(() => {
          if (!cancelled) setArModelBusy(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [modelUrl, selectedColor, selectedPattern, showPhoneArViewer]);

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

  useEffect(() => {
    const activeModelUrl = arModelUrl || modelUrl;
    if (
      !arOpen ||
      !showPhoneArViewer ||
      !activeModelUrl ||
      arModelBusy ||
      autoArAttemptKey === activeModelUrl
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const viewer = modelViewerRef.current;
      if (!viewer?.activateAR) return;

      setAutoArAttemptKey(activeModelUrl);
      Promise.resolve(viewer.activateAR()).catch((error) => {
        debugWarn("auto-ar:activation-blocked", error);
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    arModelBusy,
    arModelUrl,
    arOpen,
    autoArAttemptKey,
    modelUrl,
    showPhoneArViewer,
  ]);

  if (!modelUrl) {
    debugWarn("viewer rendered without modelUrl");
    return <ViewerFallback message="3D model is not available for this product yet." />;
  }

  const openCameraAr = () => {
    const viewer = document.getElementById(
      "product-ar-model-viewer"
    ) as ModelViewerElement | null;

    if (!viewer?.activateAR) {
      debugWarn("manual-ar:activateAR-unavailable");
      return;
    }

    Promise.resolve(viewer.activateAR()).catch((error) => {
      debugWarn("manual-ar:activation-blocked", error);
    });
  };

  return (
    <>
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
              onClick={() => {
                setShowPhoneArViewer(isMobileOrTabletDevice());
                setArOpen(true);
              }}
              className="shrink-0 rounded-full bg-green-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
            >
              View in my room
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
            className="m-auto grid h-[min(760px,100%)] w-[min(1040px,100%)] grid-rows-[auto,1fr] overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {showPhoneArViewer ? "View in my room" : "Open AR on phone"}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {showPhoneArViewer
                    ? "Tap the AR button to place this model through your phone camera."
                    : "Scan the QR code with a supported phone."}
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

            <div className="grid min-h-0 place-items-center bg-[radial-gradient(circle_at_top,#ffffff,#e7e5e4)] p-5">
              {showPhoneArViewer ? (
                <>
                  <Script
                    id="google-model-viewer"
                    src="https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js"
                    type="module"
                    strategy="afterInteractive"
                  />

                  <div className="relative h-full min-h-[520px] w-full">
                    {arModelBusy ? (
                      <div className="absolute left-1/2 top-24 z-10 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">
                        Preparing selected color for AR...
                      </div>
                    ) : null}

                    {arModelError ? (
                      <div className="absolute left-1/2 top-24 z-10 w-[min(420px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 shadow-sm">
                        {arModelError}
                      </div>
                    ) : null}

                    {createElement(
                      "model-viewer",
                      {
                        id: "product-ar-model-viewer",
                        src: arModelUrl || modelUrl,
                        ref: modelViewerRef,
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
                          "aria-label": "Open camera AR",
                          className:
                            "absolute bottom-5 left-1/2 w-[min(320px,calc(100%-32px))] -translate-x-1/2 rounded-full bg-green-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-green-800",
                        },
                        "Open camera AR"
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

                    <button
                      type="button"
                      onClick={openCameraAr}
                      className="absolute bottom-5 left-1/2 z-20 w-[min(320px,calc(100%-32px))] -translate-x-1/2 rounded-full bg-green-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-green-800"
                    >
                      Open camera AR
                    </button>
                  </div>
                </>
              ) : (
                <aside className="grid w-full max-w-sm content-center gap-4 rounded-3xl border border-stone-200 bg-white/92 p-5 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      View in my room
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Scan this QR code with your phone to open AR through the camera.
                    </p>
                  </div>

                  {arQrUrl ? (
                    <div className="grid place-items-center rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(
                          arQrUrl
                        )}`}
                        alt="QR code to open product AR on a phone"
                        className="h-60 w-60 max-w-full"
                      />
                    </div>
                  ) : null}

                  <input
                    value={arQrUrl}
                    readOnly
                    className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-xs text-stone-600"
                    aria-label="AR product link"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </aside>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
