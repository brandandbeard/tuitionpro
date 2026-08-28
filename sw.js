/* ═══ TuitionPro — Offline Service Worker (safe version) ═══ */
const APP_CACHE = 'tuitionpro-app-v1';

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(APP_CACHE).then(c => Promise.all([
            c.add('./').catch(() => {}),
            c.add('./index.html').catch(() => {}),
            c.add('./manifest.json').catch(() => {}),
            c.add('./icon-192.png').catch(() => {}),
            c.add('./icon-512.png').catch(() => {})
        ]))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== APP_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    
    const url = new URL(req.url);
    const host = url.hostname;

    /* Firebase & Auth APIs: cache করবো না — সরাসরি network থেকে চলবে (যাতে লগইন/ডাটা সিঙ্কে এরর না আসে) */
    if (host.includes('firestore.googleapis.com') || 
        host.includes('securetoken.googleapis.com') || 
        host.includes('identitytoolkit.googleapis.com') || 
        host.includes('googleusercontent.com')) {
        return;
    }

    /* Fonts: cache থেকে দাও */
    if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
        e.respondWith(caches.match(req).then(c => c || fetch(req).then(res => { 
            if (res && res.ok) { 
                const cp = res.clone(); 
                caches.open(APP_CACHE).then(cc => cc.put(req, cp)).catch(() => {}); 
            } 
            return res; 
        })));
        return;
    }

    /* HTML page: online হলে fresh নাও, offline হলে cache থেকে দাও */
    if (req.mode === 'navigate') {
        e.respondWith(fetch(req).then(res => { 
            if (res && res.ok) { 
                const cp = res.clone(); 
                caches.open(APP_CACHE).then(c => c.put(new Request(url.pathname), cp)).catch(() => {}); 
            } 
            return res; 
        }).catch(() => caches.match(new Request(url.pathname)).then(c => c || caches.match('./index.html'))));
        return;
    }

    /* বাকি সব (CDN script, EmailJS, icons): আগে cache, নাহলে network */
    e.respondWith(caches.match(req).then(c => { 
        if (c) return c; 
        return fetch(req).then(res => { 
            if (res && res.ok) { 
                const cp = res.clone(); 
                caches.open(APP_CACHE).then(cc => cc.put(req, cp)).catch(() => {}); 
            } 
            return res; 
        }); 
    }).catch(() => caches.match(req)));
});
