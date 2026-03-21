const CACHE_NAME = "nebula-strike-v2";

// All files to cache
const ASSETS = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
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
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png",
    "./screenshots/shot1.png",
    "./screenshots/shot2.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
