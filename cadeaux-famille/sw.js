// Service worker : met en cache l'application pour un démarrage rapide et
// hors ligne. Les données (Firebase) passent toujours par le réseau.
const CACHE = "cadeaux-famille-v1";
const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "storage.js",
  "draw.js",
  "firebase-config.js",
  "manifest.webmanifest",
  "icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Réseau d'abord pour récupérer les mises à jour, cache en secours hors ligne.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
