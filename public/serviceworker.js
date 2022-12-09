var webId = "4ec7f136-95cd-499e-b23c-5e8642f4450f";

self.addEventListener('install', function (e) {
    self.skipWaiting();
    e.waitUntil(
        caches.open(webId).then(function (cache) {
            return cache.addAll([
                '/offline.html',
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