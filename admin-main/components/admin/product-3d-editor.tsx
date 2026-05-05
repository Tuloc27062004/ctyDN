"use client";

import * as React from "react";
import Link from "next/link";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type EditableMeshInfo = {
  uuid: string;
  name: string;
  visible: boolean;
};

type Props = {
  productId: string;
  modelId: string;
  productName: string;
  modelUrl: string;
  backHref: string;
};

function getMeshList(root: THREE.Object3D | null): EditableMeshInfo[] {
  if (!root) return [];

  const meshes: EditableMeshInfo[] = [];

  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes.push({
        uuid: obj.uuid,
        name: obj.name || `Mesh-${meshes.length + 1}`,
        visible: obj.visible,
      });
    }
  });

  return meshes;
}

function getObjectByUuid(
  root: THREE.Object3D | null,
  uuid: string | null
): THREE.Object3D | null {
  if (!root || !uuid) return null;
  return root.getObjectByProperty("uuid", uuid) ?? null;
}

function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D
) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fov = camera.fov * (Math.PI / 180);
  let distance = Math.abs((maxDim / 2) / Math.tan(fov / 2));
  distance *= 1.8;

  camera.position.set(center.x + distance * 0.8, center.y + distance * 0.6, center.z + distance);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

function ensureStandardMaterials(mesh: THREE.Mesh): THREE.MeshStandardMaterial[] {
  if (Array.isArray(mesh.material)) {
    const next = mesh.material.map((mat) => {
      if (mat instanceof THREE.MeshStandardMaterial) return mat;

      return new THREE.MeshStandardMaterial({
        color:
          "color" in mat && mat.color instanceof THREE.Color
            ? mat.color.clone()
            : new THREE.Color("#ffffff"),
      });
    });

    mesh.material = next;
    return next;
  }

  if (mesh.material instanceof THREE.MeshStandardMaterial) {
    return [mesh.material];
  }

  const next = new THREE.MeshStandardMaterial({
    color:
      "color" in mesh.material && mesh.material.color instanceof THREE.Color
        ? mesh.material.color.clone()
        : new THREE.Color("#ffffff"),
  });

  mesh.material = next;
  return [next];
}

function exportGlb(root: THREE.Object3D): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();

    root.updateMatrixWorld(true);

    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
          return;
        }

        reject(new Error("GLTFExporter did not return binary GLB data"));
      },
      (error) => {
        reject(error instanceof Error ? error : new Error("Failed to export GLB"));
      },
      {
        binary: true,
        trs: true,
        onlyVisible: true,
        includeCustomExtensions: true,
      }
    );
  });
}

export function Product3DEditor({
  productId,
  modelId,
  productName,
  modelUrl,
  backHref,
}: Props) {
  const { toast } = useToast();

  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const orbitRef = React.useRef<OrbitControls | null>(null);
  const transformRef = React.useRef<TransformControls | null>(null);
  const rootRef = React.useRef<THREE.Object3D | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [meshList, setMeshList] = React.useState<EditableMeshInfo[]>([]);
  const [selectedUuid, setSelectedUuid] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"translate" | "rotate" | "scale">("translate");
  const [setAsDefault, setSetAsDefault] = React.useState(true);

  const [materialColor, setMaterialColor] = React.useState("#ffffff");
  const [roughness, setRoughness] = React.useState(0.8);
  const [metalness, setMetalness] = React.useState(0.0);

  const refreshMeshList = React.useCallback(() => {
    setMeshList(getMeshList(rootRef.current));
  }, []);

  const syncMaterialUiFromSelected = React.useCallback(() => {
    const selected = getObjectByUuid(rootRef.current, selectedUuid);
    if (!selected || !(selected as THREE.Mesh).isMesh) return;

    const mesh = selected as THREE.Mesh;
    const mats = ensureStandardMaterials(mesh);
    const first = mats[0];

    setMaterialColor(`#${first.color.getHexString()}`);
    setRoughness(first.roughness ?? 0.8);
    setMetalness(first.metalness ?? 0.0);
  }, [selectedUuid]);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fafc");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.01,
      2000
    );
    camera.position.set(2, 2, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dir1.position.set(6, 8, 6);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.7);
    dir2.position.set(-5, 4, -5);
    scene.add(dir2);

    const grid = new THREE.GridHelper(10, 10, 0xcbd5e1, 0xe2e8f0);
    scene.add(grid);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbitRef.current = orbit;

    const transform = new TransformControls(camera, renderer.domElement);
    const transformHelper = transform.getHelper();
    transform.setMode(mode);
    transform.addEventListener("dragging-changed", (event) => {
      orbit.enabled = !event.value;
    });
    scene.add(transformHelper);
    transformRef.current = transform;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onClick(event: MouseEvent) {
      if (!rendererRef.current || !cameraRef.current || !rootRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, cameraRef.current);
      const hits = raycaster.intersectObjects(rootRef.current.children, true);
      const hit = hits.find((entry) => (entry.object as THREE.Mesh).isMesh);

      if (hit) {
        setSelectedUuid(hit.object.uuid);
      }
    }

    renderer.domElement.addEventListener("click", onClick);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;

        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((mat) => mat.clone());
            } else if (mesh.material) {
              mesh.material = mesh.material.clone();
            }

            const mats = ensureStandardMaterials(mesh);
            mats.forEach((mat) => {
              if (mat.map) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
                mat.map.needsUpdate = true;
              }
              mat.needsUpdate = true;
            });
          }
        });

        rootRef.current = root;
        scene.add(root);
        refreshMeshList();
        fitCameraToObject(camera, orbit, root);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error(error);
        setLoading(false);
        toast({
          title: "Không tải được model",
          description: "File GLB hiện tại không mở được trong editor.",
          variant: "destructive",
        });
      }
    );

    const animate = () => {
      orbit.update();
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = Math.max(mountRef.current.clientHeight, 1);

      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      scene.remove(transformHelper);
      orbit.dispose();
      transform.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, mode, refreshMeshList, toast]);

  React.useEffect(() => {
    if (!transformRef.current || !rootRef.current) return;

    transformRef.current.setMode(mode);

    const selected = getObjectByUuid(rootRef.current, selectedUuid);
    if (selected) {
      transformRef.current.attach(selected);
      syncMaterialUiFromSelected();
    } else {
      transformRef.current.detach();
    }
  }, [mode, selectedUuid, syncMaterialUiFromSelected]);

  function toggleVisibility(uuid: string) {
    const obj = getObjectByUuid(rootRef.current, uuid);
    if (!obj) return;

    const nextVisible = !obj.visible;
    obj.visible = nextVisible;

    if (!nextVisible && selectedUuid === uuid) {
      setSelectedUuid(null);
    }

    refreshMeshList();
  }

  function deleteSelected() {
    const selected = getObjectByUuid(rootRef.current, selectedUuid);
    if (!selected || !selected.parent) return;

    selected.parent.remove(selected);
    setSelectedUuid(null);
    refreshMeshList();
  }

  function applyMaterialChanges(next: {
    color?: string;
    roughness?: number;
    metalness?: number;
  }) {
    const selected = getObjectByUuid(rootRef.current, selectedUuid);
    if (!selected || !(selected as THREE.Mesh).isMesh) return;

    const mesh = selected as THREE.Mesh;
    const mats = ensureStandardMaterials(mesh);

    mats.forEach((mat) => {
      if (next.color) {
        mat.color.set(next.color);
      }
      if (typeof next.roughness === "number") {
        mat.roughness = next.roughness;
      }
      if (typeof next.metalness === "number") {
        mat.metalness = next.metalness;
      }
      mat.needsUpdate = true;
    });
  }

  async function onTexturePicked(file: File | null) {
    if (!file || !selectedUuid) return;

    const selected = getObjectByUuid(rootRef.current, selectedUuid);
    if (!selected || !(selected as THREE.Mesh).isMesh) return;

    const mesh = selected as THREE.Mesh;
    const mats = ensureStandardMaterials(mesh);

    const objectUrl = URL.createObjectURL(file);
    const loader = new THREE.TextureLoader();

    loader.load(
      objectUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        mats.forEach((mat) => {
          mat.map = texture;
          mat.needsUpdate = true;
        });

        URL.revokeObjectURL(objectUrl);

        toast({
          title: "Đã đổi texture",
          description: "Đã áp texture mới cho mesh đang chọn.",
        });
      },
      undefined,
      () => {
        URL.revokeObjectURL(objectUrl);

        toast({
          title: "Không áp được texture",
          description: "File ảnh này không load được vào material.",
          variant: "destructive",
        });
      }
    );
  }

  async function saveEditedGlb() {
    if (!rootRef.current) return;

    try {
      setSaving(true);

      const arrayBuffer = await exportGlb(rootRef.current);
      const file = new File([arrayBuffer], `edited-${modelId}.glb`, {
        type: "model/gltf-binary",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("setDefault", String(setAsDefault));

      const res = await fetch(
        `/api/admin/products/${productId}/3d-models/${modelId}/save-edited`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Không lưu được bản GLB đã chỉnh sửa");
      }

      toast({
        title: "Đã lưu model mới",
        description: "Một bản GLB mới đã được tạo và lưu vào blob.",
      });

      window.location.href = `/admin/products/${productId}`;
    } catch (error) {
      toast({
        title: "Lưu thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const selected = getObjectByUuid(rootRef.current, selectedUuid);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
      <Card className="space-y-4 rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-slate-800">3D Editor</div>
            <p className="mt-1 text-sm text-slate-600">
              {productName} • Model ID: {modelId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={mode === "translate" ? "default" : "outline"} onClick={() => setMode("translate")}>
              Move
            </Button>
            <Button type="button" variant={mode === "rotate" ? "default" : "outline"} onClick={() => setMode("rotate")}>
              Rotate
            </Button>
            <Button type="button" variant={mode === "scale" ? "default" : "outline"} onClick={() => setMode("scale")}>
              Scale
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href={backHref}>Quay lại sản phẩm</Link>
            </Button>
          </div>
        </div>

        <div
          ref={mountRef}
          className="h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
        />

        {loading ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Đang tải editor...
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6">
        <Card className="space-y-4 rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-lg font-semibold text-slate-800">Mesh list</div>

          <div className="max-h-[320px] space-y-2 overflow-auto">
            {meshList.map((mesh) => (
              <div
                key={mesh.uuid}
                className={`rounded-xl border p-3 ${
                  mesh.uuid === selectedUuid
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedUuid(mesh.uuid)}
                >
                  <div className="font-medium text-slate-800">{mesh.name}</div>
                  <div className="mt-1 text-xs break-all text-slate-500">{mesh.uuid}</div>
                </button>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => toggleVisibility(mesh.uuid)}>
                    {mesh.visible ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            ))}

            {meshList.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Không tìm thấy mesh nào trong model.
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={!selected}
            onClick={deleteSelected}
          >
            Delete selected part
          </Button>
        </Card>

        <Card className="space-y-4 rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-lg font-semibold text-slate-800">Material</div>

          <div className="grid gap-2">
            <Label htmlFor="mat-color">Base color</Label>
            <Input
              id="mat-color"
              type="color"
              value={materialColor}
              disabled={!selected}
              onChange={(e) => {
                const value = e.target.value;
                setMaterialColor(value);
                applyMaterialChanges({ color: value });
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="roughness">Roughness: {roughness.toFixed(2)}</Label>
            <Input
              id="roughness"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={roughness}
              disabled={!selected}
              onChange={(e) => {
                const value = Number(e.target.value);
                setRoughness(value);
                applyMaterialChanges({ roughness: value });
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="metalness">Metalness: {metalness.toFixed(2)}</Label>
            <Input
              id="metalness"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={metalness}
              disabled={!selected}
              onChange={(e) => {
                const value = Number(e.target.value);
                setMetalness(value);
                applyMaterialChanges({ metalness: value });
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="texture">Swap texture</Label>
            <Input
              id="texture"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!selected}
              onChange={(e) => void onTexturePicked(e.target.files?.[0] ?? null)}
            />
          </div>
        </Card>

        <Card className="space-y-4 rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-lg font-semibold text-slate-800">Save</div>

          <label className="flex items-start gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <span>Đặt bản GLB mới làm model mặc định</span>
          </label>

          <Button type="button" disabled={saving || loading} onClick={saveEditedGlb}>
            {saving ? "Đang lưu..." : "Save as new .glb"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
