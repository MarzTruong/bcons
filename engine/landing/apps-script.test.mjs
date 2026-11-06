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

const lead = { ten: "Nguyễn Văn B", sdt: "0901 234 567", dongY: true, nhuCau: "Mua để ở", canMa: "A18-09", canLoai: "2PN-2WC", dt: 62.02, pttt: "PTTT 02", giaChuaVat: 4066746600, tuCo: 894881000, vay: 2236710630, traGop: 20849000, lai: 9.5, nam: 20, nguon: "tiktok" };

test("validateLead_: cần đồng ý, tên, SĐT đúng; bẫy spam", () => {
  assert.equal(ctx.validateLead_(lead).ok, true);
  assert.equal(ctx.validateLead_(lead).phone, "0901234567");
  assert.equal(ctx.validateLead_({ ...lead, dongY: "true" }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, dongY: false }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, sdt: "12345" }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, ten: "A" }).ok, false);
  assert.equal(ctx.validateLead_({ ...lead, website: "x" }).spam, true);
  assert.equal(ctx.normalizePhone_("+84 901 234 567"), "0901234567");
});

test("cell_: chặn công thức Sheets", () => {
  assert.equal(ctx.cell_("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(ctx.cell_("+84"), "'+84");
  assert.equal(ctx.cell_("Bình thường"), "Bình thường");
});

test("tin Telegram và Zalo: đủ thông tin, Zalo ghi rõ ước tính + VAT + phí bảo trì, không hứa", () => {
  const tg = ctx.formatTelegram_(lead, "0901234567");
  for (const s of ["Nguyễn Văn B", "0901234567", "A18-09", "PTTT 02", "tiktok", "20,8 triệu"]) assert.ok(tg.includes(s), s);
  const z = ctx.formatZalo_(lead);
  for (const s of ["ước tính", "VAT 10%", "phí bảo trì 2%", "Nguyễn Văn B"]) assert.ok(z.includes(s), s);
  assert.ok(!/cam kết|chắc chắn|tăng giá/i.test(z));
});
