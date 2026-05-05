import { z } from "zod";

export async function apiJson<T>(input: RequestInfo, init: RequestInit | undefined, schema: z.ZodType<T>) {
  const res = await fetch(input, init);
  const text = await res.text();

  if (!res.ok) {
    let msg = text || `Request failed (${res.status})`;
    try {
      const j = JSON.parse(text);
      msg = j?.error ?? msg;
    } catch {}
    throw new Error(msg);
  }

  const data = text ? JSON.parse(text) : null;
  return schema.parse(data);
}
