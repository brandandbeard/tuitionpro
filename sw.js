/* ═══ TuitionPro — Offline Service Worker (Safe Version) ═══ */
const APP_CACHE = 'tuitionpro-app-v1';

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(APP_CACHE).then(c => Promise.all([
            c.add('./').catch(() => {}),
            c.add('index.html').catch(() => {}),
            c.add('manifest.json').catch(() => {}),
            c.add('icon-192.png').catch(() => {}),
            c.add('icon-512.png').catch(() => {}),
            // EmailJS CDN ক্যাশ করা
            c.add('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js').catch(() => {})
        ]))
    );
    // নতুন Service Worker-কে সাথে সাথে অ্যাক্টিভ হতে বাধ্য করে
    self.skipWaiting(); 
});

self.addEventListener('activate', e => {
    e.waitUntil(
        // পুরোনো সব ক্যাশ অটোমেটিক ডিলিট করে দেয়
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

        /* বাকি সব (CDN, Images, Scripts): Cache-first, fallback to network */
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
        // URL পাস করতে সমস্যা হলে ডিফল্ট ফেচ
        return;
    }
});
