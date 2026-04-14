// Simple Service Worker for PWA installation support
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for now - just needed for installability
  event.respondWith(fetch(event.request));
});
