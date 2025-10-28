const CACHE_NAME = "smd-static-v5";
const APP_SHELL = [
  "/",
  "/landing",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-192.png",
  "/icons/maskable-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const urls = APP_SHELL.slice();
      await Promise.allSettled(
        urls.map(async (url) => {
          try {
            const request = new Request(url, { cache: "reload" });
            const response = await fetch(request);
            if (!response || !response.ok) {
              throw new Error(`Unexpected response (${response?.status})`);
            }
            await cache.put(request, response.clone());
          } catch (error) {
            console.warn("[sw] failed to precache", url, error);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache API/auth/session requests so login state stays fresh
  if (url.pathname.startsWith("/api/")) {
    return; // fall through to network
  }

  // Navigation requests: try network, fallback to cached landing page
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match("/landing").then((m) => m || caches.match("/")))
    );
    return;
  }

  // Other GETs: cache-first, then network
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached)
    )
  );
});
