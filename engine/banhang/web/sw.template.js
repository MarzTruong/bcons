// Service worker: mở được khi mất mạng. Trang/mã: ưu tiên mạng (sửa xong là dùng ngay), rơi về bản đã lưu. Ảnh, font: dùng bản đã lưu trước.
// Không bao giờ lưu cuộc gọi lấy giỏ hàng (Apps Script, khác máy chủ): dữ liệu do nguon.mjs giữ trong máy.
const PHIEN_BAN = "__PHIEN_BAN__";
const CACHE = "ban-hang-" + PHIEN_BAN;
const TAI_TRUOC = __TAI_TRUOC__;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(TAI_TRUOC)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith("ban-hang-")).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  const cungNguon = u.origin === self.location.origin;
  const font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!cungNguon && !font) return;
  const tinh = font || /\.(jpe?g|png|webp|svg|woff2?)$/i.test(u.pathname);
  if (tinh) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; })));
    return;
  }
  e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req).then((hit) => hit || caches.match("index.html"))));
});
