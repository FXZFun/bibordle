var webId = "12a18ec0-b470-4b3c-8d6d-ef655712196a";

self.addEventListener('install', function (e) {
    self.skipWaiting();
    e.waitUntil(
        caches.open(webId).then(function (cache) {
            return cache.addAll([
                '/offline.html',
                "/res/styles/main.min.css",
                "/res/fonts/MaterialIcons-Regular.ttf",
                "/res/fonts/MavenPro-VariableFont_wght.ttf"
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request)
            .then(function (response) {
                return response || fetch(event.request).catch(() => caches.match("/offline.html"));
            })
        );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});