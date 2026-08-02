self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  if (event.request.method != "GET") {
    return;
  }

  if (event.request.url.indexOf("http") != 0) {
    return;
  }

  function onFail() {
    return fetch(event.request);
  }

  event.respondWith(
    fetch(event.request.url, { cache: "no-store" }).catch(onFail)
  );
});
