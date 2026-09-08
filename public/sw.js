const CACHE_NAME = "speaker-portal-v1";
const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/icon.svg",
    "/manifest.webmanifest"
];

// Install: Cache static app shell assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network-first for dynamic API/DB requests, Cache-first for static bundled assets
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Bypass caching for Supabase API and WebSocket connections
    if (url.hostname.includes("supabase.co") || event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Save successful static asset responses to cache
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Fallback to cache when offline
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (event.request.mode === "navigate") {
                        return caches.match("/index.html");
                    }
                });
            })
    );
});
