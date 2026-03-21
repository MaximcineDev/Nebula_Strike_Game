const CACHE_NAME = "nebula-strike-v1";

// List of files to cache for offline use
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",

  "./icons/icon-72x72.png",
  "./icons/icon-96x96.png",
  "./icons/icon-128x128.png",
  "./icons/icon-144x144.png",
  "./icons/icon-152x152.png",
  "./icons/icon-192x192.png",
  "./icons/icon-384x384.png",
  "./icons/icon-512x512.png",

  "./screenshots/shot1.png",
  "./screenshots/shot2.png",

  "./assets/player.png",
  "./assets/enemy.png",
  "./assets/boss.png",
  "./assets/explosion.png",
  "./assets/star.png",
  "./assets/ui/coin-icon.png",
  "./assets/ui/locked-level.png",
  "./assets/ui/premium-badge.png",
  "./assets/ui/premium-screen.png",
  "./assets/ui/shop-premium.png",
  "./assets/ui/upgrade-button.png",

  "./assets/sounds/explosion.wav",
  "./assets/sounds/shoot.wav"
];

// Install event: cache app shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate event: clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

// Fetch event: serve cached content when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
