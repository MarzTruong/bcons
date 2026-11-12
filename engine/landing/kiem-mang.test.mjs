import { test } from "node:test";
import assert from "node:assert/strict";
import { thamChieuTrang, laTrangChuGia, danhGiaPhienBan } from "../remotion/scripts/kiem-mang.mjs";

test("thamChieuTrang: lấy đúng file ảnh/script/pdf nội bộ, bỏ link ngoài và mailto/tel", () => {
  const html = `<img src="assets/a.jpg"><script type="module" src="client.js"></script><a href="tai-lieu/x.pdf">x</a><a href="https://maps.google.com/x">g</a><a href="tel:0938">t</a><iframe src="https://www.openstreetmap.org/e"></iframe><link href="https://fonts.googleapis.com/css" rel="stylesheet"><a href="chinh-sach.html">c</a><a href="#top">t</a>`;
  assert.deepEqual(thamChieuTrang(html).sort(), ["assets/a.jpg", "chinh-sach.html", "client.js", "tai-lieu/x.pdf"]);
});

test("laTrangChuGia: Cloudflare trả trang chủ (200 text/html) cho file không có: phải bị bắt", () => {
  assert.equal(laTrangChuGia("client.js", "text/html; charset=utf-8"), true);
  assert.equal(laTrangChuGia("tai-lieu/x.pdf", "text/html"), true);
  assert.equal(laTrangChuGia("client.js", "application/javascript"), false);
  assert.equal(laTrangChuGia("chinh-sach.html", "text/html; charset=utf-8"), false);
});

test("danhGiaPhienBan: bản trên mạng cũ hơn main = chưa cập nhật (build lỗi hoặc đang chờ)", () => {
  assert.equal(danhGiaPhienBan("abc123", "abc123").ok, true);
  assert.equal(danhGiaPhienBan("abc123", "def456").ok, false);
  assert.equal(danhGiaPhienBan(null, "def456").ok, false);
  assert.equal(danhGiaPhienBan("abc123def", "abc123").ok, true, "so theo tiền tố ngắn");
});
