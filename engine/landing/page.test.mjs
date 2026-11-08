import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage, renderPolicy, esc } from "./page.mjs";
import { buildLanding, checkLanding, checkStillForSale } from "./build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROJ = path.join(ROOT, "du-an", "bcons-central-park");
const data = JSON.parse(fs.readFileSync(path.join(PROJ, "landing", "landing.json"), "utf8"));
const project = JSON.parse(fs.readFileSync(path.join(PROJ, "project.json"), "utf8"));
const full = { ...data, formUrl: "https://script.google.com/macros/s/x/exec" };
const noUrl = { ...data, formUrl: "" };

test("trang: ô đồng ý không tick sẵn, có đủ lưu ý giá đúng chỗ, không in câu nội bộ", () => {
  const html = renderPage(full, project);
  const box = html.match(/<input type="checkbox" id="dongY"[^>]*>/)[0];
  assert.ok(!/checked/.test(box));
  assert.match(html, /id="send" type="submit">/); // nút luôn bật, client.js báo nếu chưa tick
  assert.ok(html.includes("Tôi đồng ý để chuyên viên tư vấn của Bcons PS Land") && html.includes("chinh-sach.html"));
  // Lưu ý giá: đúng một dòng ngay dưới bảng giá (anh dặn 08/11/2026), không lặp ở chỗ khác.
  assert.equal((html.match(/chưa VAT, chưa phí bảo trì 2%/g) ?? []).length, 1);
  assert.ok(html.indexOf("chưa VAT, chưa phí bảo trì 2%") > html.indexOf('id="cards"'));
  // Chiết khấu và trần lãi chỉ hiện trong công cụ tính khi khách chọn PTTT (calc.mjs), không in tĩnh trên trang.
  for (const s of ["8,5%", "2,45%", "6,9%"]) assert.ok(!html.includes(s), `không in tĩnh ${s}`);
  // Câu nội bộ/"tự bảo vệ" không được lên trang khách (CLAUDE.md, mục "Quy tắc nào được hiện cho khách xem").
  for (const s of ["người nước ngoài", "cam kết lợi nhuận", "giá trị tăng thêm", "theo bảng giá chủ đầu tư", "bảng giá chủ đầu tư ngày", "mang tính tham khảo", "17/10/2026"]) {
    assert.ok(!html.toLowerCase().includes(s.toLowerCase()), `không in "${s}"`);
  }
  // Hình ảnh minh họa: nhãn nhỏ gắn trên chính tấm phối cảnh, một lần.
  assert.equal((html.match(/minh họa/gi) ?? []).length, 1);
  assert.match(html, /<figure class="hero">[\s\S]*?minh họa[\s\S]*?<\/figure>/i);
  assert.equal((html.match(/class="unit"/g) ?? []).length, 5);
  assert.ok(!/A21-26|A15-12|E6-09|A18-09|A15-07/.test(html), "không có mã căn trong trang, kể cả dữ liệu ẩn");
  assert.match(html, /id="hp_x7"/);
  for (const b of html.match(/<button class="unit"[\s\S]*?<\/button>/g)) assert.ok(!b.includes("<div"), "không đặt div trong button");
});

test("trang: số liệu và ảnh nhà mẫu lấy từ landing.json, không viết cứng", () => {
  const html = renderPage(full, project);
  for (const x of data.soLieu) assert.ok(html.includes(esc(x.so)) && html.includes(esc(x.nhan)), x.so);
  assert.ok(data.anhNhaMau.length >= 3);
  for (const a of data.anhNhaMau) assert.ok(html.includes(path.basename(a.file)), a.file);
  const altered = renderPage({ ...full, soLieu: [{ so: "9 tháp", nhan: "thử" }] }, project);
  assert.ok(altered.includes("9 tháp") && !altered.includes("2.820"));
});

test("trang: có nút Gọi và Zalo của tư vấn viên (không hiện tên) khi project.json có lienHe; không có thì không hiện", () => {
  const html = renderPage(full, project);
  assert.match(html, /href="tel:0938323139"/);
  assert.match(html, /href="https:\/\/zalo\.me\/0938323139"/);
  assert.ok(!html.includes("Tuấn Trương"), "anh bỏ chữ tên khỏi trang (08/11/2026)");
  const none = renderPage(full, { ...project, lienHe: undefined });
  assert.ok(!/tel:|zalo\.me/.test(none));
  assert.ok(!/tel:|zalo\.me|0938/.test(renderPolicy(full, project)), "trang chính sách không cần SĐT");
});

test("trang: chữ người dùng nhập được thoát ký tự HTML", () => {
  const html = renderPage({ ...full, tieuDe: "<script>alert(1)</script>" }, project);
  assert.ok(!html.includes("<script>alert(1)"));
  const policy = renderPolicy({ ...full, dongY: { ...full.dongY, vaiTro: '"><img onerror=1>' } }, project);
  assert.ok(!policy.includes("<img onerror"));
});

test("checkLanding: chặn khi thiếu tên/URL, thiếu loại căn, có SĐT; bản nháp thì cho qua tên/URL", () => {
  assert.ok(checkLanding({ ...data, dongY: { ...data.dongY, vaiTro: "" } }).some((e) => /vaiTro/.test(e)));
  assert.ok(checkLanding(noUrl).some((e) => /formUrl/.test(e)));
  assert.deepEqual(checkLanding(noUrl, { draft: true }), []);
  assert.deepEqual(checkLanding(full), []);
  assert.ok(checkLanding({ ...full, canMau: full.canMau.slice(1) }).some((e) => /Studio/.test(e)));
  assert.ok(checkLanding({ ...full, moTa: "Gọi 0905 935 935" }).some((e) => /số điện thoại/.test(e)));
});

test("buildLanding xuất đủ file; bản chính thức bị chặn khi chưa điền", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "land-"));
  const dir = buildLanding(PROJ, out, { draft: true });
  for (const f of ["index.html", "chinh-sach.html", "calc.js", "client.js", path.basename(data.anhChinh), ...data.anhNhaMau.map((a) => path.basename(a.file)), "_headers", "_redirects"]) {
    assert.ok(fs.existsSync(path.join(dir, f)), f);
  }
  assert.match(fs.readFileSync(path.join(dir, "index.html"), "utf8"), /BẢN NHÁP/);
  const redirects = fs.readFileSync(path.join(dir, "_redirects"), "utf8");
  assert.match(redirects, /^\/QR \/\?utm_source=qr 302$/m, "QR trong video (viết hoa) về landing, ghi nguồn qr");
  assert.match(redirects, /^\/qr \/\?utm_source=qr 302$/m);
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
