/* AnesDose — chạy offline.
   Trang chính: lấy bản mới từ mạng trước (để luôn cập nhật khi có mạng),
   mất mạng thì dùng bản đã lưu. Biểu tượng/manifest: dùng bản đã lưu. */
const CACHE = "anesdose-v15";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const u = new URL(req.url);
  // Bộ đọc PDF (pdf.js) từ cdnjs: lưu lại để xem tài liệu khi mất mạng
  if(u.hostname === "cdnjs.cloudflare.com" && u.pathname.includes("/pdf.js/")){
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res;
    })));
    return;
  }
  if(u.origin !== location.origin) return;
  const isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  if(isPage){
    e.respondWith(
      fetch(req, {cache: "no-store"}).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
