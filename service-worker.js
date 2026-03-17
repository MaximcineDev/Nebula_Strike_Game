// Nebula Strike - Service Worker
// Version: 1.0.0
// Handles caching, offline gameplay, and background sync

const CACHE_NAME = 'nebula-strike-v1.0.0';
const DYNAMIC_CACHE = 'nebula-strike-dynamic-v1.0.0';
const GAME_CACHE = 'nebula-strike-game-v1.0.0';

// Core app shell - must be available for offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/offline.html',
  
  // Icons
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  
  // UI Assets
  '/assets/ui/logo.png',
  '/assets/ui/button-start.png',
  '/assets/ui/button-shop.png',
  '/assets/ui/coin-icon.png',
  '/assets/ui/heart-icon.png',
  '/assets/ui/shield-icon.png',
  '/assets/ui/laser-icon.png',
  
  // Fonts
  '/fonts/orbitron.woff2',
  '/fonts/roboto.woff2',
  
  // Audio (essential SFX)
  '/audio/laser-shoot.mp3',
  '/audio/explosion.mp3',
  '/audio/powerup.mp3',
  '/audio/game-over.mp3',
  '/audio/background-music.mp3'
];

// Game assets - cached on demand
const GAME_ASSETS = [
  // Shaders
  '/shaders/vertex.glsl',
  '/shaders/fragment.glsl',
  '/shaders/particle.glsl',
  
  // Textures
  '/textures/spaceship-diffuse.png',
  '/textures/spaceship-normal.png',
  '/textures/asteroid-diffuse.png',
  '/textures/nebula-background.png',
  '/textures/particle-fire.png',
  '/textures/particle-spark.png',
  
  // 3D Models (simplified for web)
  '/models/spaceship.json',
  '/models/asteroid-small.json',
  '/models/asteroid-medium.json',
  '/models/asteroid-large.json',
  
  // Levels
  '/levels/level1.json',
  '/levels/level2.json',
  '/levels/level3.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Nebula Strike...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Nebula Strike...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('nebula-strike-') && 
                     name !== CACHE_NAME && 
                     name !== DYNAMIC_CACHE &&
                     name !== GAME_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients...');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API calls - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Game assets - cache first, network fallback
  if (isGameAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, GAME_CACHE));
    return;
  }
  
  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }
  
  // Everything else - stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncHighScores());
  } else if (event.tag === 'sync-purchases') {
    event.waitUntil(syncPendingPurchases());
  }
});

// Push notifications for daily rewards
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Your daily rewards are ready, pilot!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image || '/assets/daily-reward.png',
    tag: data.tag || 'daily-reward',
    requireInteraction: false,
    actions: [
      {
        action: 'claim',
        title: 'Claim Now',
        icon: '/icons/check.png'
      },
      {
        action: 'dismiss',
        title: 'Later',
        icon: '/icons/close.png'
      }
    ],
    data: {
      url: data.url || '/?action=rewards',
      reward: data.reward
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Nebula Strike', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, notification } = event;
  const data = notification.data || {};
  
  if (action === 'claim' || !action) {
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_GAME_ASSETS':
      cacheGameAssets();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    case 'SYNC_DATA':
      syncGameData(payload);
      break;
  }
});

// ==================== STRATEGIES ====================

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Return cached and update in background
    fetchAndCache(request, cacheName);
    return cached;
  }
  
  // Not in cache - fetch and store
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed - return offline fallback
    return getOfflineFallback(request);
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Update cache
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed - try cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are offline. Some features may be unavailable.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  return cached || fetchPromise;
}

// ==================== HELPERS ====================

function isStaticAsset(pathname) {
  const staticPaths = [
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/offline.html',
    '/icons/',
    '/assets/ui/',
    '/fonts/',
    '/audio/'
  ];
  return staticPaths.some(path => pathname.startsWith(path));
}

function isGameAsset(pathname) {
  const gamePaths = [
    '/shaders/',
    '/textures/',
    '/models/',
    '/levels/'
  ];
  return gamePaths.some(path => pathname.startsWith(path));
}

async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response);
    }
  } catch (error) {
    console.log('[SW] Background fetch failed:', error);
  }
}

async function getOfflineFallback(request) {
  // Return offline page for HTML requests
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(CACHE_NAME);
    return cache.match('/offline.html');
  }
  
  // Return transparent pixel for images
  if (request.destination === 'image') {
    return new Response(
      new Blob([new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
      ])], { type: 'image/png' }),
      { headers: { 'Content-Type': 'image/png' } }
    );
  }
  
  return new Response('Offline', { status: 503 });
}

// ==================== CACHE MANAGEMENT ====================

async function cacheGameAssets() {
  const cache = await caches.open(GAME_CACHE);
  const keys = await cache.keys();
  const cachedUrls = keys.map(req => req.url);
  
  const toCache = GAME_ASSETS.filter(asset => {
    const fullUrl = new URL(asset, self.location.origin).href;
    return !cachedUrls.includes(fullUrl);
  });
  
  if (toCache.length === 0) {
    console.log('[SW] All game assets already cached');
    return;
  }
  
  console.log(`[SW] Caching ${toCache.length} game assets...`);
  
  // Cache in chunks to avoid overwhelming the browser
  const chunkSize = 5;
  for (let i = 0; i < toCache.length; i += chunkSize) {
    const chunk = toCache.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (asset) => {
        try {
          const response = await fetch(asset);
          if (response.ok) {
            await cache.put(asset, response);
            console.log('[SW] Cached:', asset);
          }
        } catch (error) {
          console.error('[SW] Failed to cache:', asset, error);
        }
      })
    );
  }
  
  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'ASSETS_CACHED',
      count: toCache.length
    });
  });
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('nebula-strike-'))
      .map(name => caches.delete(name))
  );
  console.log('[SW] All caches cleared');
}

async function getCacheStatus() {
  const staticCache = await caches.open(CACHE_NAME);
  const gameCache = await caches.open(GAME_CACHE);
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  
  const [staticKeys, gameKeys, dynamicKeys] = await Promise.all([
    staticCache.keys(),
    gameCache.keys(),
    dynamicCache.keys()
  ]);
  
  const calculateSize = async (cache, keys) => {
    let size = 0;
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        size += blob.size;
      }
    }
    return size;
  };
  
  return {
    version: CACHE_NAME,
    static: {
      count: staticKeys.length,
      size: await calculateSize(staticCache, staticKeys)
    },
    game: {
      count: gameKeys.length,
      size: await calculateSize(gameCache, gameKeys)
    },
    dynamic: {
      count: dynamicKeys.length,
      size: await calculateSize(dynamicCache, dynamicKeys)
    }
  };
}

// ==================== BACKGROUND SYNC ====================

async function syncHighScores() {
  const db = await openDB('nebula-strike-db', 1);
  const pendingScores = await db.getAll('pending-scores');
  
  for (const score of pendingScores) {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score)
      });
      
      if (response.ok) {
        await db.delete('pending-scores', score.id);
        console.log('[SW] Synced score:', score.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync score:', error);
      break; // Stop trying, will retry later
    }
  }
}

async function syncPendingPurchases() {
  // Similar implementation for purchase verification
  console.log('[SW] Syncing pending purchases...');
}

async function syncGameData(payload) {
  // Generic sync handler
  console.log('[SW] Syncing game data:', payload);
}

// ==================== INDEXEDDB HELPER ====================

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-scores')) {
        db.createObjectStore('pending-scores', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('game-state')) {
        db.createObjectStore('game-state', { keyPath: 'key' });
      }
    };
  });
}

// ==================== PERIODIC SYNC ====================

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reward-check') {
    event.waitUntil(checkDailyRewards());
  }
});

async function checkDailyRewards() {
  // Check if user has claimed daily reward
  // Send push notification if not
  console.log('[SW] Checking daily rewards...');
}

console.log('[SW] Nebula Strike Service Worker loaded');
