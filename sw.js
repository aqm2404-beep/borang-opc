/* Service worker: rangkaian dahulu, simpanan (cache) sebagai sandaran supaya boleh guna offline. */
var CACHE = "opc-borang-v1.0.0";
var FILES = [
  "./",
  "index.html",
  "tetapan.html",
  "style.css",
  "common.js",
  "pdf.js",
  "form.js",
  "tetapan.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "vendor/jspdf.umd.min.js",
  "vendor/jspdf.plugin.autotable.min.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
    })
  );
});
