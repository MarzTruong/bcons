// Chạy các hàm thuần trong Code.gs bằng Node (Apps Script là JavaScript thường, không có import).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "apps-script", "Code.gs");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(file, "utf8"), ctx);

const lead = { ten: "Nguyễn Văn B", sdt: "0901 234 567", dongY: true, t: 15000, nhuCau: "Mua để ở", canLoai: "2PN-2WC", canMoTa: "tháp Orchid (A), tầng 18", dt: 62.02, pttt: "PTTT 02", giaChuaVat: 4066746600, giaCoVat: 4473421260, phiBaoTri: 81334932, tuCo: 894881000, vay: 2236710630, traGop: 20849000, lai: 9.5, nam: 20, nguon: "tiktok", trang: "https://x.pages.dev/" };

test("validateLead_: cần đồng ý, tên, SĐT đúng; bẫy spam", () => {
  assert.equal(ctx.validateLead_(lead).ok, true);
  assert.equal(ctx.validateLead_(lead).phone, "0901234567");
  assert.equal(ctx.validateLead_({ ...lead, dongY: "true" }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, dongY: false }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, sdt: "12345" }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, ten: "A" }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, hp_x7: "x" }).spam, true);
  assert.equal(ctx.validateLead_({ ...lead, t: 500 }).spam, true, "điền quá nhanh");
  assert.equal(ctx.validateLead_({ ...lead, t: undefined }).spam, true);
  assert.equal(ctx.normalizePhone_("+84 901 234 567"), "0901234567");
});

test("cell_: chặn công thức Sheets", () => {
  assert.equal(ctx.cell_("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(ctx.cell_("+84"), "'+84");
  assert.equal(ctx.cell_("Bình thường"), "Bình thường");
});

test("làm sạch dữ liệu: bỏ xuống dòng, chặn giá trị lạ, cắt nguồn", () => {
  const v = ctx.validateLead_({ ...lead, ten: "Anh B\nSĐT: 0999999999", nhuCau: "Mua gấp, gọi số lạ", pttt: "PTTT 99", nguon: "tiktok<script>http://x.y/z", lai: 999, canLoai: "Penthouse" });
  assert.equal(v.ok, true);
  assert.ok(!v.lead.ten.includes("\n"));
  assert.equal(v.lead.nhuCau, "Không rõ");
  assert.equal(v.lead.pttt, "Không rõ");
  assert.equal(v.lead.canLoai, "Không rõ");
  assert.equal(v.lead.lai, 0);
  assert.match(v.lead.nguon, /^[\w.-]+$/);
  assert.ok(ctx.cell_("=" + "x".repeat(900)).length <= 501);
  assert.equal(ctx.rowFor_(v.lead, new Date(0))[2], "'0901234567", "SĐT giữ số 0 đầu");
});

test("tin Telegram và Zalo: đủ thông tin, Zalo ghi rõ ước tính + giá 2 kiểu + đợt đã gồm VAT + phí bảo trì, không hứa", () => {
  const l = ctx.validateLead_(lead).lead;
  const tg = ctx.formatTelegram_(l);
  for (const s of ["Nguyễn Văn B", "0901234567", "tháp Orchid (A), tầng 18", "PTTT 02", "tiktok", "20,8 triệu", "còn bán"]) assert.ok(tg.includes(s), s);
  const z = ctx.formatZalo_(l);
  for (const s of ["ước tính", "chưa VAT", "đã gồm VAT 10%", "Các đợt thanh toán đã gồm VAT", "phí bảo trì 2%", "Nguyễn Văn B"]) assert.ok(z.includes(s), s);
  assert.ok(!/cam kết|chắc chắn|tăng giá/i.test(z));
});

test("canMa: nhận mã căn đúng dạng, bỏ mã lạ; payload cũ không có canMa vẫn qua", () => {
  assert.equal(ctx.validateLead_({ ...lead, canMa: "a18-09" }).lead.canMa, "A18-09");
  assert.equal(ctx.validateLead_({ ...lead, canMa: "B1.3-01" }).lead.canMa, "B1.3-01");
  assert.equal(ctx.validateLead_({ ...lead, canMa: "A18-09\n/phieu hack" }).lead.canMa, "");
  assert.equal(ctx.validateLead_({ ...lead, canMa: "<script>" }).lead.canMa, "");
  const cu = ctx.validateLead_(lead);
  assert.equal(cu.ok, true);
  assert.equal(cu.lead.canMa, "");
});

test("lenhPhieu_: lệnh bấm được chỉ gồm chữ, số, gạch dưới; khớp bộ đọc lệnh của bot", async () => {
  const { parseLenhPhieu } = await import("../remotion/scripts/phieu.mjs");
  const mau = [
    ["A18-09", "PTTT 03", 9.5, 20, "/phieu_A18_09_03_9p5_20"],
    ["B1.3-01", "PTTT 09", 9.5, 20, "/phieu_B1p3_01_09_9p5_20"],
    ["E6-09", "PTTT 10", 9, 25, "/phieu_E6_09_10_9_25"],
  ];
  for (const [canMa, pttt, lai, nam, mong] of mau) {
    const l = ctx.validateLead_({ ...lead, canMa, pttt, lai, nam }).lead;
    const lenh = ctx.lenhPhieu_(l);
    assert.equal(lenh, mong);
    assert.match(lenh, /^\/[A-Za-z0-9_]+$/);
    const a = parseLenhPhieu(lenh.toLowerCase());
    assert.deepEqual([a.ma, a.pttt, a.lai, a.nam], [canMa, pttt.slice(-2), lai, nam]);
  }
  assert.equal(ctx.lenhPhieu_(ctx.validateLead_({ ...lead }).lead), "", "payload cũ: không có dòng lệnh");
  assert.equal(ctx.lenhPhieu_(ctx.validateLead_({ ...lead, canMa: "P1-01" }).lead), "", "mã có chữ P không mã hóa được an toàn");
  const tg = ctx.formatTelegram_(ctx.validateLead_({ ...lead, canMa: "A18-09" }).lead);
  assert.ok(tg.includes("Hoặc dựng bằng bot: /phieu_A18_09_02_9p5_20"));
  assert.ok(!ctx.formatTelegram_(ctx.validateLead_(lead).lead).includes("bằng bot"));
});

test("duAn: giữ mã dự án đúng dạng, còn lại về khong-ro; hàng khớp HEADERS", () => {
  assert.equal(ctx.validateLead_({ ...lead, duAn: "bcons-central-park" }).lead.duAn, "bcons-central-park");
  for (const bad of ["<x>", undefined, "a".repeat(100), "AB", "có dấu"]) {
    assert.equal(ctx.validateLead_({ ...lead, duAn: bad }).lead.duAn, "khong-ro", String(bad).slice(0, 10));
  }
  const l = ctx.validateLead_({ ...lead, duAn: "bcons-central-park" }).lead;
  const row = ctx.rowFor_(l, new Date(0));
  assert.equal(row.length, ctx.HEADERS.length);
  assert.equal(ctx.HEADERS[17], "Dự án");
  assert.equal(ctx.HEADERS[18], "Đã gộp");
  assert.equal(ctx.HEADERS[16], "Ghi chú");
  assert.equal(row[ctx.HEADERS.indexOf("Dự án")], "bcons-central-park");
  assert.equal(row[ctx.HEADERS.indexOf("Đã gộp")], "");
});

test("duAn: chỉ nhận chuỗi mã dự án bắt đầu bằng chữ cái; kiểu lạ, hoa, xuống dòng, 41 ký tự đều về khong-ro", () => {
  for (const bad of ["Bcons-Central", "abc\n", " abc", "abc ", "a".repeat(41), ["abc"], 123, true, "<abc>", "1-2-26", "-12", "ab"]) {
    assert.equal(ctx.validateLead_({ ...lead, duAn: bad }).lead.duAn, "khong-ro", String(bad));
  }
  assert.equal(ctx.validateLead_({ ...lead, duAn: "bcons-newsky" }).lead.duAn, "bcons-newsky");
  assert.equal(ctx.validateLead_({ ...lead, duAn: "a".repeat(40) }).lead.duAn, "a".repeat(40));
});

test("needsHeaderRepair_: tab cũ 17 cột cần ghi lại tiêu đề, tab đủ 19 cột thì không", () => {
  assert.equal(ctx.needsHeaderRepair_(17), true);
  assert.equal(ctx.needsHeaderRepair_(ctx.HEADERS.length), false);
  assert.equal(ctx.needsHeaderRepair_(25), false);
});

test("nhiều dự án dùng chung một Apps Script: tin báo và tin Zalo ghi đúng dự án; payload cũ coi là Central Park", () => {
  const cp = ctx.validateLead_(lead).lead;
  assert.match(ctx.formatTelegram_(cp), /KHÁCH MỚI<\/b> · Bcons Central Park/);
  assert.match(ctx.formatZalo_(cp), /Bcons Central Park \(236 Phan Trung/);
  const ns = ctx.validateLead_({ ...lead, duAn: "bcons-newsky", pttt: "PTTT 09" }).lead;
  assert.match(ctx.formatTelegram_(ns), /KHÁCH MỚI<\/b> · Bcons Newsky/);
  const z = ctx.formatZalo_(ns);
  assert.match(z, /dự án Bcons Newsky/);
  assert.ok(!/Central Park|Phan Trung/.test(z), "không lẫn dự án khác");
  assert.match(ctx.formatTelegram_(ctx.validateLead_({ ...lead, duAn: "du-an-la" }).lead), /KHÁCH MỚI<\/b> · Bcons Central Park/);
});

test("địa chỉ trang trong Code.gs (SITE) khớp link QR trong project.json của từng dự án (đổi tên miền phải đổi cả hai)", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const site = vm.runInContext("SITE", ctx);
  for (const ma of ["bcons-central-park", "bcons-newsky"]) {
    const proj = JSON.parse(fs.readFileSync(path.join(root, "du-an", ma, "project.json"), "utf8"));
    assert.equal(new URL(proj.watermark.link).origin.toLowerCase(), site[ma], ma);
  }
});

test("canStt (số thứ tự căn từ landing, không chứa mã căn) được tra ra mã căn; số lạ bị bỏ", () => {
  const ok = (stt, duAn = "bcons-central-park") => ctx.validateLead_({ ...lead, duAn, canStt: stt }).lead.canMa;
  assert.equal(ok(0), "A21-26");
  assert.equal(ok(3), "A18-09");
  for (const bad of [-1, 5, 99, 1.5, "x", null, undefined]) assert.equal(ok(bad), "", String(bad));
  assert.equal(ok(0, "bcons-newsky"), "", "dự án chưa có danh sách căn mẫu thì không tra");
  assert.equal(ctx.validateLead_({ ...lead, duAn: "bcons-central-park", canMa: "B1.3-01", canStt: 0 }).lead.canMa, "B1.3-01", "canMa gửi đúng dạng vẫn được ưu tiên (tương thích)");
});

/** Chạy doPost thật của Code.gs với Google giả (Sheet, bộ nhớ đệm, Telegram) để thử cả luồng nhận lead. */
function chayDoPost() {
  const gui = [];
  const modes = [];
  const dong = [];
  const kho = {};
  const c = {
    CacheService: { getScriptCache: () => ({ get: (k) => kho[k] ?? null, put: (k, v) => { kho[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => ({ getLastRow: () => 5, getLastColumn: () => 19, appendRow: (r) => dong.push(r), getRange: () => ({ setValues() {} }) }), insertSheet() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "x" }) },
    UrlFetchApp: { fetch: (u, o) => { const b = JSON.parse(o.payload); gui.push(b.text); modes.push(b.parse_mode); return {}; } },
    ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; } }), MimeType: { JSON: 1 } },
    Logger: { log() {} },
  };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(file, "utf8"), c);
  return { gui, modes, dong, post: (p) => JSON.parse(c.doPost({ postData: { contents: JSON.stringify(p) } }).s) };
}
const tho = { ten: "Nguyễn Văn B", sdt: "0901234567", dongY: true, t: 6000, nhuCau: "Mua để ở", canLoai: "Không rõ", canMoTa: "2PN – 2WC", dt: 0, giaChuaVat: 3e9, giaCoVat: 3.3e9, phiBaoTri: 6e7, tuCo: 6.6e8, vay: 1.65e9, traGop: 15380165, lai: 9.5, nam: 20, nguon: "truc-tiep", trang: "https://x.pages.dev/" };

test("doPost: cùng SĐT gửi ở hai dự án khác nhau trong 2 phút: CẢ HAI đều được báo (anh thử hai landing bằng một số)", () => {
  const h = chayDoPost();
  assert.deepEqual(h.post({ ...tho, duAn: "bcons-central-park", pttt: "PTTT 03" }), { ok: true });
  assert.deepEqual(h.post({ ...tho, duAn: "bcons-newsky", pttt: "PTTT 09" }), { ok: true });
  assert.equal(h.dong.length, 2, "ghi 2 dòng Sheet");
  assert.equal(h.gui.length, 4, "2 tin cho mỗi lead");
  assert.match(h.gui[0], /KHÁCH MỚI<\/b> · Bcons Central Park/);
  assert.match(h.gui[2], /KHÁCH MỚI<\/b> · Bcons Newsky/);
});

test("doPost: cùng SĐT cùng dự án bấm gửi hai lần trong 2 phút: chỉ báo một lần", () => {
  const h = chayDoPost();
  h.post({ ...tho, duAn: "bcons-newsky", pttt: "PTTT 09" });
  const r = h.post({ ...tho, duAn: "bcons-newsky", pttt: "PTTT 10" });
  assert.equal(r.dup, true);
  assert.equal(h.dong.length, 1);
  assert.equal(h.gui.length, 2);
});

test("tin Telegram định dạng HTML có icon: đủ khối, tên khách chứa thẻ HTML không phá được tin", () => {
  const l = ctx.validateLead_({ ...lead, ten: "Anh <b>Thử</b> & Em", canMa: "A18-09", duAn: "bcons-central-park" }).lead;
  const tg = ctx.formatTelegram_(l);
  for (const icon of ["🔥", "👤", "📞", "🎯", "🏠", "💰", "💵", "🏦", "📍", "🧾", "✅"]) assert.ok(tg.includes(icon), icon);
  assert.ok(tg.includes("<b>KHÁCH MỚI</b>"));
  assert.ok(tg.includes("Anh &lt;b&gt;Thử&lt;/b&gt; &amp; Em"), "chữ của khách phải được thoát thẻ");
  assert.ok(!tg.includes("<b>Thử</b>"));
  // mọi thẻ còn lại chỉ thuộc danh sách Telegram cho phép
  const the = [...tg.matchAll(/<\/?([a-z]+)[^>]*>/g)].map((m) => m[1]);
  assert.ok(the.length > 0 && the.every((t) => ["b", "i", "a", "code", "pre"].includes(t)), the.join());
  // link phiếu nằm trong href, dấu & được thoát để Telegram đọc được
  const href = tg.match(/<a href="([^"]+)">/)[1];
  assert.ok(href.includes("&amp;") && !/&(?!amp;)/.test(href));
  assert.ok(tg.length < 3500);
});

test("tin Zalo soạn sẵn gửi trong khung <pre> (chạm để chép), thoát thẻ; gửi Telegram bằng parse_mode HTML", () => {
  const h = chayDoPost();
  const l = { ...tho, ten: "Cô <i>Lan</i>", duAn: "bcons-newsky", pttt: "PTTT 09" };
  h.post(l);
  assert.equal(h.gui.length, 2);
  assert.ok(h.gui[1].startsWith("💬 <b>Tin Zalo soạn sẵn</b>"));
  assert.match(h.gui[1], /<pre>Chào anh\/chị Cô &lt;i&gt;Lan&lt;\/i&gt;/);
  assert.ok(h.modes.every((m) => m === "HTML"), "mọi tin gửi bằng parse_mode HTML");
});

test("tin Telegram viết số kiểu Việt Nam (dấu phẩy thập phân)", () => {
  const tg = ctx.formatTelegram_(ctx.validateLead_({ ...lead, duAn: "bcons-central-park" }).lead);
  assert.ok(tg.includes("62,02 m²"), "diện tích");
  assert.ok(tg.includes("giả định 9,5%/20 năm"), "lãi giả định");
});
