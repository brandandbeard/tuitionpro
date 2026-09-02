/* ═══ TuitionPro — Bulletproof Service Worker ═══ */
const APP_CACHE = 'tuitionpro-final-v1';

self.addEventListener('install', e => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
    // 🚨 শুধুমাত্র HTTP/HTTPS GET রিকোয়েস্ট ধরবে (Extension error এড়ানোর জন্য)
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

    e.respondWith(
        fetch(e.request)
            .then(response => {
                // সফল হলে ক্যাশে সেভ করবে
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(APP_CACHE).then(cache => {
                        cache.put(e.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // অফলাইনে পেজ লোড না হলে ক্যাশ থেকে দেবে
                if (e.request.mode === 'navigate') {
                    return caches.match('index.html');
                }
                return new Response('Offline Content', { status: 503 });
            })
    );
});
