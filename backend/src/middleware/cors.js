const ALLOWED_ORIGINS = [
  "https://prattbossman-2010.github.io",
  "https://cloudtok.pages.dev",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000"
];

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), payment=(self)",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://cloudtok-api.bossmanp16.workers.dev https://*.supabase.co wss:; font-src 'self';"
};

function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return null;
}

export function getAllowedOriginForRequest(request) {
  return getAllowedOrigin(request) || ALLOWED_ORIGINS[0];
}

export function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true"
  };
}

export function handleCORS(request) {
  if (request.method === "OPTIONS") {
    const origin = getAllowedOrigin(request);
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin)
    });
  }
  return null;
}

export async function withCORS(responseOrPromise, request) {
  try {
    const response = await responseOrPromise;
    const origin = (request && getAllowedOrigin(request)) || ALLOWED_ORIGINS[0];
    const newHeaders = new Headers(response.headers);
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    newHeaders.set("Access-Control-Allow-Origin", origin);
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": (request && getAllowedOrigin(request)) || ALLOWED_ORIGINS[0]
        }
      }
    );
  }
}
