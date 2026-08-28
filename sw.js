const CACHE_NAME = 'tuitionpro-cache-v2'; // v2 করা হয়েছে যাতে নতুন করে ইন্সটল হয়
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install event - ফাইলগুলো ক্যাশ করবে
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // দ্রুত অ্যাক্টিভ করার জন্য
});

// Fetch event - ক্যাশ থেকে ডাটা লোড করবে, না পেলে নেটওয়ার্ক থেকে আনবে
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Activate event - পুরনো ক্যাশ ক্লিয়ার করবে
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // দ্রুত কন্ট্রোল নেওয়ার জন্য
});
