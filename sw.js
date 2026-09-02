/* ═══ TuitionPro — Smart Advanced Service Worker (Best of Both) ═══ */
const APP_CACHE = 'tuitionpro-smart-v2';

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(APP_CACHE).then(c => Promise.all([
            c.add('./').catch(() => {}),
            c.add('index.html').catch(() => {}),
            // 🚨 আইকন এবং manifest এখানে ক্যাশ করবো না, যাতে ইন্সটল বাটন ব্লক না হয়
            c.add('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js').catch(() => {})
        ]))
    );
    self.skipWaiting(); 
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== APP_CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;

    try {
        const url = new URL(req.url);
        const host = url.hostname;

        /* 🚨 সবচেয়ে গুরুত্বপূর্ণ: আইকন বা ম্যানিফেস্ট ফাইল ক্যাশ থেকে নেবো না! */
        if (url.pathname.includes('.png') || url.pathname.includes('manifest.json')) {
            e.respondWith(fetch(req)); // সরাসরি নেটওয়ার্ক থেকে আনবে (No Cache)
            return;
        }

        /* Fonts: Cache-first */
        if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
            e.respondWith(
                caches.match(req).then(c => 
                    c || fetch(req).then(res => {
                        if (res && res.ok) {
                            const cp = res.clone();
                            caches.open(APP_CACHE).then(cc => cc.put(req, cp)).catch(() => {});
                        }
                        return res;
                    })
                )
            );
            return;
        }

        /* HTML page: Network-first, fallback to cache */
        if (req.mode === 'navigate') {
            e.respondWith(
                fetch(req).then(res => {
                    if (res && res.ok) {
                        const cp = res.clone();
                        caches.open(APP_CACHE).then(c => c.put(new Request(url.pathname), cp)).catch(() => {});
                    }
                    return res;
                }).catch(() => 
                    caches.match(new Request(url.pathname)).then(c => c || caches.match('/index.html'))
                )
            );
            return;
        }

        /* বাকি সব (CDN, Scripts): Cache-first */
        e.respondWith(
            caches.match(req).then(c => {
                if (c) return c;
                return fetch(req).then(res => {
                    if (res && res.ok) {
                        const cp = res.clone();
                        caches.open(APP_CACHE).then(cc => cc.put(req, cp)).catch(() => {});
                    }
                    return res;
                });
            }).catch(() => caches.match(req))
        );
    } catch (error) {
        return;
    }
});
