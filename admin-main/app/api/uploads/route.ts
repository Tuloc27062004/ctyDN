import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import {
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
  isAllowedProductImageType,
} from "@/lib/validators";

export const runtime = "nodejs";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to upload file";
}

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!isAllowedProductImageType(file.type)) {
    return NextResponse.json(
      { error: "This file type is not allowed" },
      { status: 400 }
    );
  }

  if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File exceeds ${Math.floor(
          PRODUCT_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)
        )}MB`,
      },
      { status: 400 }
    );
  }

  const pathname = `uploads/${Date.now()}-${randomUUID()}-${safeFileName(file.name)}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("[api/uploads] Blob upload failed", {
      pathname,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      error,
    });

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
