// Service Worker for ScreenMind PWA
const CACHE_NAME = 'screenmind-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle share target POST requests
  if (event.request.method === 'POST' && url.pathname.includes('index.html')) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // For GET requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => fetch(event.request))
  );
});

// Handle shared images
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const title = formData.get('title') || 'Shared Screenshot';
    const text = formData.get('text') || '';

    if (image) {
      // Convert to base64
      const arrayBuffer = await image.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: image.type });
      const reader = new FileReader();
      
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      });

      const imageData = await base64Promise;
      
      // Store in cache/indexedDB for retrieval
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        '/shared-image-data',
        new Response(JSON.stringify({ imageData, title, text }), {
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Send message to all clients
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clients.forEach(client => {
        client.postMessage({
          type: 'SHARED_IMAGE',
          imageData: imageData,
          title: title,
          text: text
        });
      });
    }
  } catch (error) {
    console.error('Error handling shared image:', error);
  }

  // Always redirect to the app (return 303 See Other)
  return Response.redirect('/', 303);
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
