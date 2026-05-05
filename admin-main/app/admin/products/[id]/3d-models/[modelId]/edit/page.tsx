import { notFound, redirect } from "next/navigation";

import { PageShell } from "@/components/admin/page-shell";
import { Product3DEditor } from "@/components/admin/product-3d-editor";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params:
    | Promise<{ id: string; modelId: string }>
    | { id: string; modelId: string };
};

export default async function Product3DEditPage({ params }: PageProps) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    if (guard.status === 401) {
      redirect("/login");
    }
    notFound();
  }

  const resolved = await Promise.resolve(params);
  const productId = resolved.id;
  const modelId = resolved.modelId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      models3d: {
        where: { id: modelId },
        select: {
          id: true,
          modelGlbUrl: true,
          pbrModelGlbUrl: true,
          baseModelGlbUrl: true,
        },
      },
    },
  });

  if (!product || product.models3d.length === 0) {
    notFound();
  }

  const model = product.models3d[0];
  const modelUrl = model.pbrModelGlbUrl || model.modelGlbUrl || model.baseModelGlbUrl;

  if (!modelUrl) {
    notFound();
  }

  return (
    <PageShell
      title="Chỉnh sửa model 3D"
      description="Move / rotate / scale / hide / delete part, chỉnh material, đổi texture và lưu thành GLB mới."
    >
      <Product3DEditor
        productId={product.id}
        modelId={model.id}
        productName={product.name}
        modelUrl={modelUrl}
        backHref={`/admin/products/${product.id}`}
      />
    </PageShell>
  );
}