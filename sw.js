// N-Back — Service Worker
// Стратегия: приложение отдаётся из кэша мгновенно, свежая версия подтягивается
// в фоне и применяется со следующего запуска. Шрифты кэшируются при первом обращении.
const CACHE = 'nback-language-v2-answerfix1';
const PRECACHE = ['./', './index.html', './manifest.json', './language-v2.js', './language-v1.css', './data/words-v2.json', './data/phrases-v2.json'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(async c => {
                await c.addAll(PRECACHE);
                const manifest = await (await c.match('./data/phrases-v2.json')).json();
                const files = Object.values(manifest.lengths).flatMap(x => x.chunks.map(p => './data/' + p.file));
                // Download the bank once, without parsing it in the page or delaying play.
                // Activate this cache only when the complete offline bank is available.
                for (let i = 0; i < files.length; i += 6) await c.addAll(files.slice(i, i + 6));
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(async keys => {
                const cache = await caches.open(CACHE);
                // Retain the original cached typeface across an application update.
                // Do not copy old HTML, scripts or data into the new application cache.
                for (const key of keys.filter(k => k !== CACHE)) {
                    const previous = await caches.open(key);
                    for (const request of await previous.keys()) {
                        const host = new URL(request.url).hostname;
                        if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
                            const response = await previous.match(request);
                            if (response && !await cache.match(request)) await cache.put(request, response);
                        }
                    }
                }
                await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Шрифты Google: кэш → сеть, ответ сохраняем
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        e.respondWith(
            caches.match(req).then(hit => hit || fetch(req).then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(req, copy));
                return res;
            }))
        );
        return;
    }

    if (url.origin === self.location.origin && url.pathname.includes('/data/')) {
        e.respondWith(caches.open(CACHE).then(async cache => {
            const hit = await cache.match(req);
            if (hit) return hit;
            const response = await fetch(req);
            if (response.ok) await cache.put(req, response.clone());
            return response;
        }));
        return;
    }

    // Свои файлы: из кэша мгновенно, в фоне обновляем кэш
    if (url.origin === self.location.origin) {
        e.respondWith(
            caches.match(req, { ignoreSearch: true }).then(hit => {
                const refresh = fetch(req).then(res => {
                    if (res && res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE).then(c => c.put(req, copy));
                    }
                    return res;
                }).catch(() => hit);
                return hit || refresh;
            })
        );
    }
});
