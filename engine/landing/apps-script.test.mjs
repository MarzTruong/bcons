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
  assert.ok(tg.includes("Dựng phiếu tính: /phieu_A18_09_02_9p5_20"));
  assert.ok(!ctx.formatTelegram_(ctx.validateLead_(lead).lead).includes("Dựng phiếu"));
});
