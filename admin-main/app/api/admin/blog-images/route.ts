import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/authz";
import {
  BLOG_IMAGE_MAX_SIZE_BYTES,
  isAllowedBlogImageType,
} from "@/lib/validators";

export const runtime = "nodejs";

function getExtension(filename: string, contentType: string) {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpg" ? "jpeg" : fromName;
  }

  switch (contentType) {
    case "image/jpeg":
      return "jpeg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
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

  if (!isAllowedBlogImageType(file.type)) {
    return NextResponse.json(
      { error: "This blog image type is not allowed" },
      { status: 400 }
    );
  }

  if (file.size > BLOG_IMAGE_MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File exceeds ${Math.floor(
          BLOG_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)
        )}MB`,
      },
      { status: 400 }
    );
  }

  const ext = getExtension(file.name, file.type);

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  const pathname = `blog-content/${yyyy}/${mm}/${randomUUID()}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
  });
}