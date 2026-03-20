// Nebula Strike - Service Worker
// Version: 1.0.1

const CACHE_NAME = 'nebula-strike-v1.0.1';
const DYNAMIC_CACHE = 'nebula-strike-dynamic-v1.0.1';
const GAME_CACHE = 'nebula-strike-game-v1.0.1';

const BASE_PATH = self.location.pathname.replace('/service-worker.js', '');
const BASE_URL = self.location.origin + BASE_PATH;

// Helper to create proper URLs
const url = (path) => BASE_PATH + path;

// Core app shell
const STATIC_ASSETS = [
  url('/'),
  url('/index.html'),
  url('/styles.css'),
  url('/app.js'),
  url('/manifest.json'),
  
  // Icons
  url('/icons/icon-72x72.png'),
  url('/icons/icon-96x96.png'),
  url('/icons/icon-128x128.png'),
  url('/icons/icon-144x144.png'),
  url('/icons/icon-192x192.png'),
  url('/icons/icon-512x512.png'),
  
  // Add your actual game assets here
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Nebula Strike v1.0.1...');
  console.log('[SW] Base path:', BASE_PATH);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        
        return Promise.all(
          STATIC_ASSETS.map(asset => 
            cache.add(asset).catch(err => {
              console.warn('[SW] Failed to cache:', asset, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
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
      .then(() => {
        // Notify all clients that SW is active
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_ACTIVATED' });
          });
        });
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
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Only handle requests within our scope
  if (!url.pathname.startsWith(BASE_PATH)) {
    return;
  }
  
  // HTML requests - network first, cache fallback (for updates)
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // API calls - network first
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Everything else - cache first
  event.respondWith(cacheFirst(request, CACHE_NAME));
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      // Acknowledge receipt
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ type: 'SKIP_WAITING_ACK' });
      }
      break;
      
    case 'GET_VERSION':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ 
          type: 'VERSION', 
          version: CACHE_NAME,
          basePath: BASE_PATH 
        });
      }
      break;
  }
});

// ==================== STRATEGIES ====================

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', request.url, error);
    // Return a simple offline response instead of failing
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Network First Strategy (for HTML/API)
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
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving cached:', request.url);
      return cached;
    }
    
    // Complete failure - return offline page for HTML
    if (request.destination === 'document') {
      const offlineCache = await caches.open(CACHE_NAME);
      const offlinePage = await offlineCache.match(url('/index.html'));
      if (offlinePage) return offlinePage;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

console.log('[SW] Nebula Strike Service Worker loaded - Base:', BASE_PATH);
