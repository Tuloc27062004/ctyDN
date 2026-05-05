import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { cuidSchema } from "@/lib/validators";
import {
  PRODUCT_IMAGE_MAX_FILES,
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
  isAllowedProductImageType,
} from "@/lib/validators";

export const runtime = "nodejs";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function POST(req: Request, ctx: RouteContext) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const productId = idParsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);

  const markFirstAsRender = formData.get("markFirstAsRender") === "true";

  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  if (files.length > PRODUCT_IMAGE_MAX_FILES) {
    return NextResponse.json(
      {
        error: `At most ${PRODUCT_IMAGE_MAX_FILES} images can be uploaded at once`,
      },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!isAllowedProductImageType(file.type)) {
      return NextResponse.json(
        { error: `File ${file.name} is not a supported image type` },
        { status: 400 }
      );
    }

    if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File ${file.name} exceeds ${Math.floor(
            PRODUCT_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)
          )}MB`,
        },
        { status: 400 }
      );
    }
  }

  const existingRenderCount = await prisma.image.count({
    where: { productId, isRender: true },
  });

  const shouldAssignFirstAsRender =
    markFirstAsRender || existingRenderCount === 0;

  const uploadedUrls: string[] = [];
  const createdImages: Array<{
    url: string;
    description: string;
    isRender: boolean;
    productId: string;
  }> = [];

  try {
    for (const [index, file] of files.entries()) {
      const pathname = `products/${productId}/${Date.now()}-${randomUUID()}-${safeFileName(file.name)}`;

      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });

      uploadedUrls.push(blob.url);

      createdImages.push({
        url: blob.url,
        description: file.name,
        isRender: shouldAssignFirstAsRender && index === 0,
        productId,
      });
    }

    await prisma.$transaction(async (tx) => {
      if (shouldAssignFirstAsRender) {
        await tx.image.updateMany({
          where: { productId },
          data: { isRender: false },
        });
      }

      await tx.image.createMany({
        data: createdImages,
      });
    });

    return NextResponse.json({
      ok: true,
      createdCount: createdImages.length,
      renderAssigned: shouldAssignFirstAsRender,
    });
  } catch (error: unknown) {
    if (uploadedUrls.length > 0) {
      await del(uploadedUrls).catch(() => {});
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload product images",
      },
      { status: 500 }
    );
  }
}