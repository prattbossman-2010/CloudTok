const CACHE_NAME = "cloudtok-v1";
const STATIC_ASSETS = [
  "/CloudTok/",
  "/CloudTok/index.html",
  "/CloudTok/assets/css/base.css",
  "/CloudTok/assets/css/style.css",
  "/CloudTok/assets/js/api/api.js",
  "/CloudTok/assets/js/core/engine.js",
  "/CloudTok/assets/js/components/toast.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
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
  if (e.request.url.includes("/api/")) {
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
  if (e.request.url.includes("supabase.co/storage")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          try {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, clone);
            });
          } catch (_) {}
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});