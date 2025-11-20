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
  // Handle share target POST requests
  if (event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Handle shared images
async function handleShareTarget(request) {
  const formData = await request.formData();
  const image = formData.get('image');
  const title = formData.get('title') || 'Shared Screenshot';
  const text = formData.get('text') || '';

  if (image) {
    // Store the shared image data
    const imageData = await image.arrayBuffer();
    const blob = new Blob([imageData], { type: image.type });
    
    // Send message to all clients to process the shared image
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    
    if (clients.length > 0) {
      // Convert blob to base64 for messaging
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = () => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SHARED_IMAGE',
            imageData: reader.result,
            title: title,
            text: text
          });
        });
      };
    }
  }

  // Redirect to the app
  return Response.redirect('/', 303);
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
