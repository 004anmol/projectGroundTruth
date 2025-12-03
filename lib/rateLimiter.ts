const requestLog = new Map<string, number[]>();

export type RateLimitOptions = {
  windowMs?: number;
  max?: number;
};

const DEFAULT_WINDOW = 60_000; // 1 minute
const DEFAULT_MAX = 5;

export function rateLimit(
  identifier: string,
  { windowMs = DEFAULT_WINDOW, max = DEFAULT_MAX }: RateLimitOptions = {},
): { limited: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = requestLog.get(identifier) ?? [];
  const recent = existing.filter((timestamp) => timestamp > windowStart);

  if (recent.length >= max) {
    return { limited: true, remaining: 0 };
  }

  recent.push(now);
  requestLog.set(identifier, recent);

  return { limited: false, remaining: Math.max(0, max - recent.length) };
}

