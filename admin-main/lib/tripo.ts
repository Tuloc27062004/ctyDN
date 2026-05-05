import "server-only";

const TRIPO_API_BASE_URL = "https://api.tripo3d.ai/v2/openapi";
const DEFAULT_MODEL_VERSION = "P1-20260311";

export type TripoImageToModelInput = {
  sourceImageUrl: string;
  sourceImageName?: string | null;
  modelVersion?: string;
  faceLimit?: number;
  textureEnabled?: boolean;
  pbrEnabled?: boolean;
  exportUv?: boolean;
  orientation?: string;
  textureAlignment?: string;
};

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type TripoKeyCandidate = {
  label: string;
  value: string;
};

type TripoRequestError = Error & {
  status?: number;
  payload?: unknown;
  keyLabel?: string;
};

function normalizeEnvValue(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getTripoApiKeys(): TripoKeyCandidate[] {
  const rawCandidates: Array<[string, string | undefined]> = [
    ["TRIPO_API_KEY_1", process.env.TRIPO_API_KEY_1],
    ["TRIPO_API_KEY_2", process.env.TRIPO_API_KEY_2],
    ["TRIPO_API_KEY_3", process.env.TRIPO_API_KEY_3],
    ["TRIPO_API_KEY", process.env.TRIPO_API_KEY], // fallback for old config
  ];

  const seen = new Set<string>();
  const keys: TripoKeyCandidate[] = [];

  for (const [label, rawValue] of rawCandidates) {
    const value = normalizeEnvValue(rawValue);
    if (!value) continue;
    if (seen.has(value)) continue;

    seen.add(value);
    keys.push({ label, value });
  }

  if (keys.length === 0) {
    throw new Error(
      "Thiếu biến môi trường Tripo. Hãy cấu hình TRIPO_API_KEY_1 / TRIPO_API_KEY_2 / TRIPO_API_KEY_3."
    );
  }

  return keys;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }

    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail;
    }

    if (record.error && typeof record.error === "object") {
      const nested = record.error as Record<string, unknown>;

      if (typeof nested.message === "string" && nested.message.trim()) {
        return nested.message;
      }

      if (typeof nested.detail === "string" && nested.detail.trim()) {
        return nested.detail;
      }
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallback;
}

function getErrorCode(payload: unknown): number | string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (typeof record.code === "number" || typeof record.code === "string") {
    return record.code;
  }

  if (record.error && typeof record.error === "object") {
    const nested = record.error as Record<string, unknown>;
    if (typeof nested.code === "number" || typeof nested.code === "string") {
      return nested.code;
    }
  }

  return null;
}

function inferFileType(url: string, name?: string | null) {
  const candidates = [name ?? "", url];

  for (const candidate of candidates) {
    const lowered = candidate.toLowerCase();
    if (lowered.endsWith(".png")) return "png";
    if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg")) return "jpeg";
    if (lowered.endsWith(".webp")) return "webp";
    if (lowered.endsWith(".gif")) return "gif";
  }

  return "png";
}

function findFirstString(
  value: unknown,
  predicates: Array<(path: string, current: string) => boolean>,
  path = "root"
): string | null {
  if (typeof value === "string") {
    return predicates.some((predicate) => predicate(path, value)) ? value : null;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const match = findFirstString(entry, predicates, `${path}[${index}]`);
      if (match) return match;
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const match = findFirstString(entry, predicates, `${path}.${key}`);
      if (match) return match;
    }
  }

  return null;
}

function collectStrings(
  value: unknown,
  path = "root",
  result: Array<{ path: string; value: string }> = []
) {
  if (typeof value === "string") {
    result.push({ path, value });
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectStrings(entry, `${path}[${index}]`, result));
    return result;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) =>
      collectStrings(entry, `${path}.${key}`, result)
    );
  }

  return result;
}

function makeTripoError(args: {
  keyLabel: string;
  status?: number;
  payload?: unknown;
  fallback: string;
}) {
  const message = getErrorMessage(args.payload, args.fallback);
  const error = new Error(`[${args.keyLabel}] ${message}`) as TripoRequestError;
  error.status = args.status;
  error.payload = args.payload;
  error.keyLabel = args.keyLabel;
  return error;
}

function normalizeThrownError(
  error: unknown,
  keyLabel: string,
  fallback: string
): TripoRequestError {
  if (error instanceof Error) {
    const existing = error as TripoRequestError;
    existing.keyLabel = existing.keyLabel ?? keyLabel;
    return existing;
  }

  const wrapped = new Error(`[${keyLabel}] ${fallback}`) as TripoRequestError;
  wrapped.keyLabel = keyLabel;
  return wrapped;
}

function isQuotaLikeError(error: TripoRequestError) {
  const status = error.status ?? 0;
  const code = getErrorCode(error.payload);
  const message = error.message.toLowerCase();

  if (status === 429) return true;
  if (code === 2000 || code === "2000") return true;

  return (
    message.includes("quota") ||
    message.includes("credit") ||
    message.includes("balance") ||
    message.includes("limit") ||
    message.includes("rate limit") ||
    message.includes("retry later") ||
    message.includes("exceeded")
  );
}

function shouldTryNextKeyForCreate(error: TripoRequestError) {
  const status = error.status ?? 0;
  const message = error.message.toLowerCase();

  if (isQuotaLikeError(error)) return true;
  if (status === 401 || status === 403) return true;
  if (status >= 500) return true;

  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("socket")
  );
}

function shouldTryNextKeyForGetTask(error: TripoRequestError) {
  const status = error.status ?? 0;

  if (shouldTryNextKeyForCreate(error)) return true;

  // Important for different accounts:
  // a task may only be visible from the account that created it
  if (status === 404) return true;

  return false;
}

function logFailover(operation: string, error: TripoRequestError) {
  console.warn("[tripo] switching api key", {
    operation,
    key: error.keyLabel ?? "unknown",
    status: error.status ?? null,
    message: error.message,
    code: getErrorCode(error.payload),
  });
}

export function extractTripoTaskId(payload: unknown) {
  return findFirstString(payload, [
    (path) => /task_id$/i.test(path),
    (path) => /\.id$/i.test(path) && /task/i.test(path),
  ]);
}

export function extractTripoStatus(payload: unknown) {
  const status = findFirstString(payload, [
    (path, value) =>
      /status$/i.test(path) &&
      /^(queued|waiting|pending|running|processing|success|succeeded|failed|error|completed)$/i.test(
        value
      ),
  ]);

  return status?.toLowerCase() ?? null;
}

export function extractTripoError(payload: unknown) {
  return findFirstString(payload, [
    (path) => /error/i.test(path) || /message/i.test(path),
  ]);
}

export function extractTripoAssets(payload: unknown) {
  const strings = collectStrings(payload);
  const httpUrls = strings.filter((entry) => /^https?:\/\//i.test(entry.value));
  const modelUrls = httpUrls.filter((entry) => /\.(glb|gltf)(?:\?|$)/i.test(entry.value));
  const imageUrls = httpUrls.filter((entry) => /\.(png|jpg|jpeg|webp)(?:\?|$)/i.test(entry.value));

  const pickModel = (matchers: RegExp[]) =>
    modelUrls.find(
      (entry) => matchers.some((matcher) => matcher.test(entry.path) || matcher.test(entry.value))
    )?.value ?? null;

  const pickImage = (matchers: RegExp[]) =>
    imageUrls.find(
      (entry) => matchers.some((matcher) => matcher.test(entry.path) || matcher.test(entry.value))
    )?.value ?? null;

  const modelGlbUrl =
    pickModel([/\.model/i, /mesh/i, /output/i]) ?? modelUrls[0]?.value ?? null;

  const baseModelGlbUrl =
    pickModel([/base/i, /raw/i]) ?? null;

  const pbrModelGlbUrl =
    pickModel([/pbr/i, /textured/i]) ?? null;

  const previewImageUrl =
    pickImage([/preview/i, /thumbnail/i, /cover/i, /render/i]) ?? imageUrls[0]?.value ?? null;

  return {
    modelGlbUrl,
    baseModelGlbUrl,
    pbrModelGlbUrl,
    previewImageUrl,
    allModelUrls: modelUrls.map((entry) => entry.value),
  };
}

export async function createTripoImageToModelTask(input: TripoImageToModelInput) {
  const keys = getTripoApiKeys();
  let lastError: TripoRequestError | null = null;

  for (const key of keys) {
    try {
      const res = await fetch(`${TRIPO_API_BASE_URL}/task`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key.value}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "image_to_model",
          model_version: input.modelVersion ?? DEFAULT_MODEL_VERSION,
          file: {
            type: inferFileType(input.sourceImageUrl, input.sourceImageName),
            url: input.sourceImageUrl,
          },
          face_limit: input.faceLimit ?? 5000,
          texture: input.textureEnabled ?? true,
          pbr: input.pbrEnabled ?? true,
          export_uv: input.exportUv ?? true,
          enable_image_autofix: true,
          orientation: input.orientation ?? "align_image",
          texture_alignment: input.textureAlignment ?? "geometry",
        }),
      });

      const payload = await readJsonSafe(res);

      if (!res.ok) {
        const error = makeTripoError({
          keyLabel: key.label,
          status: res.status,
          payload,
          fallback: "Gọi Tripo tạo model thất bại",
        });

        if (shouldTryNextKeyForCreate(error)) {
          lastError = error;
          logFailover("create-task", error);
          continue;
        }

        throw error;
      }

      const taskId = extractTripoTaskId(payload);

      if (!taskId) {
        throw makeTripoError({
          keyLabel: key.label,
          payload,
          fallback: "Tripo không trả về task_id hợp lệ",
        });
      }

      return {
        taskId,
        payload,
        usedKeyLabel: key.label,
      };
    } catch (error) {
      const normalized = normalizeThrownError(
        error,
        key.label,
        "Gọi Tripo tạo model thất bại"
      );

      if (shouldTryNextKeyForCreate(normalized)) {
        lastError = normalized;
        logFailover("create-task", normalized);
        continue;
      }

      throw normalized;
    }
  }

  throw lastError ?? new Error("Không có API key Tripo nào khả dụng để tạo task");
}

export async function getTripoTask(taskId: string) {
  const keys = getTripoApiKeys();
  let lastError: TripoRequestError | null = null;

  for (const key of keys) {
    try {
      const res = await fetch(`${TRIPO_API_BASE_URL}/task/${taskId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key.value}`,
        },
        cache: "no-store",
      });

      const payload = await readJsonSafe(res);

      if (!res.ok) {
        const error = makeTripoError({
          keyLabel: key.label,
          status: res.status,
          payload,
          fallback: "Không lấy được trạng thái task từ Tripo",
        });

        if (shouldTryNextKeyForGetTask(error)) {
          lastError = error;
          logFailover("get-task", error);
          continue;
        }

        throw error;
      }

      return payload;
    } catch (error) {
      const normalized = normalizeThrownError(
        error,
        key.label,
        "Không lấy được trạng thái task từ Tripo"
      );

      if (shouldTryNextKeyForGetTask(normalized)) {
        lastError = normalized;
        logFailover("get-task", normalized);
        continue;
      }

      throw normalized;
    }
  }

  throw lastError ?? new Error("Không có API key Tripo nào khả dụng để đọc task");
}