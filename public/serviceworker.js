var webId = "2F57D8C1-5E08-45AD-93CF-761FDDAD0B20";

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(webId).then(function (cache) {
            return cache.addAll([
                '/offline.html',
                '/practice/',
                "/res/scripts/words.min.js",
                "/res/scripts/bibordle-practice.min.js",
                "/res/scripts/kjv.min.js",
                "/res/styles/main.min.css",
                "/res/fonts/MaterialIcons-Regular.ttf",
                "/res/fonts/MavenPro-VariableFont_wght.ttf"
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    if (!event.request.url.includes("practice") && (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html')))) {
        event.respondWith(
            fetch(event.request.url).catch(error => {
                return caches.match("/offline.html");
            })
        );
    }
    else {
        event.respondWith(caches.match(event.request)
            .then(function (response) {
                return response || fetch(event.request);
            })
        );
    }
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});