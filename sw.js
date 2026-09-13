const CACHE_NAME = "cloudtok-v4";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = e.request.url;

  // NEVER intercept video/streaming/storage - fixes cloudinary ERR_CONNECTION_CLOSED
  if (
    e.request.destination === "video" ||
    e.request.destination === "audio" ||
    url.includes("cloudinary.com") ||
    url.includes("imagekit.io") ||
    url.includes("backblazeb2.com") ||
    url.includes("r2.dev") ||
    url.includes("supabase.co/storage") ||
    url.includes(".m3u8") ||
    url.includes(".ts") ||
    e.request.headers.get("range")
  ) return;

  // NEVER intercept script files - fixes CloudTokAPI not defined
  if (
    e.request.destination === "script" ||
    url.includes("/assets/js/") ||
    url.includes("hls.js")
  ) return;

  // NEVER intercept manifest.json - fixes the TypeError crash
  if (url.includes("manifest.json")) return;

  // API requests - network only, no cache
  if (url.includes("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline" }), {
          headers: { "Content-Type": "application/json" },
          status: 503
        });
      })
    );
    return;
  }

  // Static assets - stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          try {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, clone);
            });
          } catch (_) {}
        }
        return response;
      }).catch(() => {
        // If network fails and we have cache, return cache
        // If no cache, return a basic offline page for HTML
        if (cached) return cached;
        if (e.request.headers.get("accept")?.includes("text/html")) {
          return new Response("<h1>Offline</h1>", {
            headers: { "Content-Type": "text/html" },
            status: 503
          });
        }
        return new Response("", { status: 503 });
      });
      return cached || fetchPromise;
    })
  );
});
