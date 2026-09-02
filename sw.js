// ক্যাশ ভার্সন আপডেট করুন যাতে পুরোনো ক্যাশ মুছে যায়
const CACHE_NAME = 'mega-quiz-v3';

// ক্যাশে যুক্ত করার প্রয়োজনীয় ফাইলগুলোর তালিকা
const urlsToCache = [
  './', // মূল পেজ
  'index.html',
  'manifest.json',
  'icon-192.png?v=2', // আইকন ফাইল যুক্ত করুন
  'icon-512.png?v=2'  // আইকন ফাইল যুক্ত করুন
];

// ইনস্টল ইভেন্ট - নতুন ফাইলগুলো ক্যাশে যুক্ত করুন
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// অ্যাক্টিভেট ইভেন্ট - পুরোনো ক্যাশ মুছে ফেলুন
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ফেচ ইভেন্ট - ক্যাশ থেকে ফাইল সরবরাহ করুন
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // ক্যাশে ফাইল থাকলে সেটি ব্যবহার করুন
      if (response) {
        return response;
      }
      // ক্যাশে না থাকলে নেটওয়ার্ক থেকে ডাউনলোড করুন
      return fetch(event.request).then(response => {
        // ইনভ্যালিড রেসপন্স বা ইরর থাকলে ফেরত দিন না
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        return response;
      }).catch(() => {
        // অফলাইনে থাকলে ডিফল্ট প্রতিক্রিয়া ফেরত দিন
        return new Response('অফলাইন', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
