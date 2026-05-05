"use client";

import { Suspense, useEffect, useMemo } from "react";
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

type PreviewPattern = {
  id: string;
  name: string;
  code?: string;
  textureUrl: string;
  defaultScale: number;
  defaultOpacity: number;
};

type PreviewColor = {
  id: string;
  name: string;
  code?: string;
  hex: string;
};

export type ProductLivePreviewProps = {
  modelUrl?: string | null;
  selectedColor?: PreviewColor | null;
  selectedPattern?: PreviewPattern | null;
  title?: string;
  description?: string;
};

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

function ViewerFallback({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-base font-semibold text-slate-800">{title}</div>
      </div>
      <div className="flex h-[480px] items-center justify-center px-6 text-center text-sm text-slate-500">
        {message}
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <Html center>
      <div className="rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
        Đang tải model 3D...
      </div>
    </Html>
  );
}

function clampOpacity(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 0), 1);
}

function safeRepeatScale(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 1;
}

type Product3DSceneProps = {
  modelUrl: string;
  selectedColor?: PreviewColor | null;
  selectedPattern?: PreviewPattern | null;
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

    return result;
  }, [clonedScene]);

  useEffect(() => {
    return () => {
      snapshot.forEach(({ originalMaterials }) => {
        originalMaterials.forEach((material) => material.dispose());
      });
    };
  }, [snapshot]);

  useEffect(() => {
    const hasPattern = Boolean(selectedPattern?.textureUrl);
    const hasColor = Boolean(selectedColor?.hex);

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
        createdMaterials.forEach((material) => material.dispose());
      };
    }

    const textureLoader = new TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    textureLoader.load(
      selectedPattern!.textureUrl,
      (texture) => {
        if (cancelled) {
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
      },
      undefined,
      () => {
        // keep the cloned materials without texture if load fails
      }
    );

    return () => {
      cancelled = true;

      if (activeTexture) {
        activeTexture.dispose();
        activeTexture = null;
      }

      createdMaterials.forEach((material) => material.dispose());
    };
  }, [snapshot, selectedColor, selectedPattern]);

  return (
    <Bounds fit clip margin={1.2}>
      <primitive object={clonedScene} />
    </Bounds>
  );
}

export function ProductLivePreview({
  modelUrl,
  selectedColor,
  selectedPattern,
  title = "Preview giống khách hàng",
  description = "Khối này dùng logic storefront: 1 model GLB + hoa văn texture + màu tint.",
}: ProductLivePreviewProps) {
  if (!modelUrl) {
    return (
      <ViewerFallback
        title={title}
        message="Chưa có model GLB khả dụng để preview theo giao diện khách hàng."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="text-base font-semibold text-slate-800">{title}</div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="text-right text-xs text-slate-500">
          <div>{selectedPattern?.name ?? "Không áp dụng hoa văn"}</div>
          <div>{selectedColor?.name ?? "Không áp dụng màu"}</div>
        </div>
      </div>

      <div className="h-[480px] w-full bg-[radial-gradient(circle_at_top,#ffffff,#e2e8f0)]">
        <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
          <color attach="background" args={["#f8fafc"]} />
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

          <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
        </Canvas>
      </div>
    </div>
  );
}
