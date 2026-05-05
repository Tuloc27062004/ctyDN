type Bucket = { count: number; resetAt: number };
const KEY = "__lead_rate_limit__";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function store(): Map<string, Bucket> {
  const g = globalThis as any;
  if (!g[KEY]) g[KEY] = new Map<string, Bucket>();
  return g[KEY];
}

export function rateLimitIp(ip: string, opts: { windowMs: number; limit: number }) {
  const s = store();
  const now = Date.now();
  const b = s.get(ip);

  if (!b || b.resetAt <= now) {
    s.set(ip, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs };
  }

  if (b.count >= opts.limit) return { ok: false, remaining: 0, resetAt: b.resetAt };

  b.count += 1;
  s.set(ip, b);
  return { ok: true, remaining: opts.limit - b.count, resetAt: b.resetAt };
}
