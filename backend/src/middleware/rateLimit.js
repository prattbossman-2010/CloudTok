const buckets = new Map();

function getClientIP(request) {
  return request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown";
}

export function rateLimit({ windowMs = 60000, max = 60, message = "Too many requests" } = {}) {
  return function checkRateLimit(request) {
    const ip = getClientIP(request);
    const now = Date.now();
    const key = `${ip}:${request.url}`;

    if (!buckets.has(key)) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return null;
    }

    const bucket = buckets.get(key);

    if (now > bucket.resetAt) {
      bucket.count = 1;
      bucket.resetAt = now + windowMs;
      return null;
    }

    bucket.count++;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return new Response(
        JSON.stringify({ error: message, retryAfter }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000))
          }
        }
      );
    }

    return null;
  };
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again later."
});

export const apiRateLimit = rateLimit({
  windowMs: 60000,
  max: 100,
  message: "Rate limit exceeded. Please slow down."
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Upload limit reached. Please try again later."
});

export function cleanupBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}


