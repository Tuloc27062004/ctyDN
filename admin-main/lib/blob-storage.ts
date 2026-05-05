import "server-only";

import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extensionFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : "bin";
  } catch {
    return "bin";
  }
}

function guessContentType(url: string, fallback?: string | null) {
  if (fallback && fallback.trim()) {
    return fallback;
  }

  const ext = extensionFromUrl(url);

  switch (ext) {
    case "glb":
      return "model/gltf-binary";
    case "gltf":
      return "model/gltf+json";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export function createBlobPath(parts: Array<string | number | null | undefined>) {
  return parts
    .filter((part): part is string | number => part !== null && part !== undefined && String(part).trim() !== "")
    .map((part) => safeFileName(String(part)))
    .join("/");
}

export async function uploadRemoteFileToBlob(options: {
  remoteUrl: string;
  pathnamePrefix: string;
  preferredFileName?: string | null;
}) {
  const remoteRes = await fetch(options.remoteUrl);

  if (!remoteRes.ok) {
    throw new Error(`Không tải được file từ nguồn ngoài (${remoteRes.status})`);
  }

  const arrayBuffer = await remoteRes.arrayBuffer();
  const contentType = guessContentType(
    options.remoteUrl,
    remoteRes.headers.get("content-type")
  );
  const extension = extensionFromUrl(options.remoteUrl);
  const baseName = options.preferredFileName?.trim()
    ? safeFileName(options.preferredFileName)
    : `${Date.now()}-${randomUUID()}.${extension}`;

  const pathname = `${options.pathnamePrefix}/${baseName}`;

  const blob = await put(pathname, Buffer.from(arrayBuffer), {
    access: "public",
    addRandomSuffix: false,
    contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType,
  };
}
