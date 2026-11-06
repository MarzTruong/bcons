import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage, renderPolicy } from "./page.mjs";
import { buildLanding, checkLanding, checkStillForSale } from "./build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROJ = path.join(ROOT, "du-an", "bcons-central-park");
const data = JSON.parse(fs.readFileSync(path.join(PROJ, "landing", "landing.json"), "utf8"));
const project = JSON.parse(fs.readFileSync(path.join(PROJ, "project.json"), "utf8"));
const full = { ...data, dongY: { ...data.dongY, nguoiGiu: "Nguyễn Văn A" }, formUrl: "https://script.google.com/macros/s/x/exec" };

test("trang: ô đồng ý không tick sẵn, nút gửi tắt, có đủ quy tắc giá và pháp lý", () => {
  const html = renderPage(full, project);
  const box = html.match(/<input type="checkbox" id="dongY"[^>]*>/)[0];
  assert.ok(!/checked/.test(box));
  assert.match(html, /id="send" type="submit">/); // nút luôn bật, client.js báo nếu chưa tick
  for (const s of ["chưa VAT", "có VAT", "phí bảo trì 2%", "minh họa", "không bán cho người nước ngoài", "6,9%/năm chỉ áp dụng cho PTTT 03 và 04", "không cam kết lợi nhuận", "Nguyễn Văn A", "chinh-sach.html"]) {
    assert.ok(html.toLowerCase().includes(s.toLowerCase()), s);
  }
  assert.equal((html.match(/class="card"/g) ?? []).length, 5);
  assert.ok(!/A21-26|A15-12|E6-09|A18-09|A15-07/.test(html), "không có mã căn trong trang, kể cả dữ liệu ẩn");
  assert.match(html, /id="hp_x7"/);
  for (const b of html.match(/<button class="card"[\s\S]*?<\/button>/g)) assert.ok(!b.includes("<div"), "không đặt div trong button");
});

test("trang: chữ người dùng nhập được thoát ký tự HTML", () => {
  const html = renderPage({ ...full, tieuDe: "<script>alert(1)</script>" }, project);
  assert.ok(!html.includes("<script>alert(1)"));
  const policy = renderPolicy({ ...full, dongY: { ...full.dongY, nguoiGiu: '"><img onerror=1>' } }, project);
  assert.ok(!policy.includes("<img onerror"));
});

test("checkLanding: chặn khi thiếu tên/URL, thiếu loại căn, có SĐT; bản nháp thì cho qua tên/URL", () => {
  assert.ok(checkLanding(data).some((e) => /nguoiGiu/.test(e)));
  assert.ok(checkLanding(data).some((e) => /formUrl/.test(e)));
  assert.deepEqual(checkLanding(data, { draft: true }), []);
  assert.deepEqual(checkLanding(full), []);
  assert.ok(checkLanding({ ...full, canMau: full.canMau.slice(1) }).some((e) => /Studio/.test(e)));
  assert.ok(checkLanding({ ...full, moTa: "Gọi 0905 935 935" }).some((e) => /số điện thoại/.test(e)));
});

test("buildLanding xuất đủ file; bản chính thức bị chặn khi chưa điền", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "land-"));
  assert.throws(() => buildLanding(PROJ, out), /nguoiGiu/);
  const dir = buildLanding(PROJ, out, { draft: true });
  for (const f of ["index.html", "chinh-sach.html", "calc.js", "client.js", "phoi-canh-tong-the-web.jpg", "_headers"]) {
    assert.ok(fs.existsSync(path.join(dir, f)), f);
  }
  assert.match(fs.readFileSync(path.join(dir, "index.html"), "utf8"), /BẢN NHÁP/);
});

test("checkStillForSale: căn mẫu đã cọc hoặc CĐT LOCK thì chặn; không có bảng giá thì bỏ qua", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csv-"));
  const csv = path.join(dir, "bang-gia.csv");
  fs.writeFileSync(csv, '\uFEFFMã căn,"Giá chưa VAT PTTT 01 (sau CK 8,5%)",Có thể tư vấn? (đã cọc = đã bán)\nA21-26,1,CÒN BÁN\nA15-12,2,ĐÃ BÁN (đã cọc)\nE6-09,3,CĐT LOCK — chưa mở bán\n');
  const errs = checkStillForSale(full, csv);
  assert.equal(errs.length, 2);
  assert.ok(errs.some((e) => /A15-12/.test(e)) && errs.some((e) => /E6-09/.test(e)));
  assert.deepEqual(checkStillForSale(full, path.join(dir, "khong-co.csv")), []);
});
