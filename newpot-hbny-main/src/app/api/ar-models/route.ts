import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_AR_MODEL_SIZE_BYTES = 25 * 1024 * 1024;

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No GLB file uploaded" }, { status: 400 });
  }

  if (file.type && file.type !== "model/gltf-binary") {
    return NextResponse.json(
      { error: "Only GLB files are supported for AR" },
      { status: 400 }
    );
  }

  if (file.size > MAX_AR_MODEL_SIZE_BYTES) {
    return NextResponse.json(
      { error: "AR model is too large" },
      { status: 400 }
    );
  }

  const pathname = `ar-models/${Date.now()}-${randomUUID()}-${safeFileName(
    file.name || "configured-model.glb"
  )}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: "model/gltf-binary",
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload AR model",
      },
      { status: 500 }
    );
  }
}
