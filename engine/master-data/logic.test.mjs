import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGs, plain } from "./helpers.mjs";
import { PHONES_REAL_FORMS } from "./fixtures.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ctx = loadGs([path.join(here, "apps-script", "Logic.gs")]);
const landing = loadGs([path.join(here, "..", "landing", "apps-script", "Code.gs")]);

test("normalizePhone_: mọi dạng SĐT thật về 0981234567", () => {
  for (const f of PHONES_REAL_FORMS) assert.equal(ctx.normalizePhone_(f), "0981234567", f);
});

test("normalizePhone_: sai dạng và rỗng trả ''", () => {
  for (const v of ["12345", "", null, undefined]) assert.equal(ctx.normalizePhone_(v), "");
});

test("normalizePhone_: số 9 chữ số (Sheets làm mất số 0) được thêm 0", () => {
  assert.equal(ctx.normalizePhone_(981234567), "0981234567");
  assert.equal(ctx.normalizePhone_("981234567"), "0981234567");
});

test("normalizePhone_: chỉ nhận 9 chữ số bắt đầu 3,5,7,8,9; các dạng sai độ dài/ký tự bị từ chối", () => {
  for (const v of ["123456789", "212345678", "412345678", "612345678", "+8498123456", "0981a34567", "981234567890123456789", "098123456789", "0981234", "+0981234567", "084981234567", "9.81234567E8"]) {
    assert.equal(ctx.normalizePhone_(v), "", v);
  }
  assert.equal(ctx.normalizePhone_("812345678"), "0812345678");
  assert.equal(ctx.normalizePhone_("\t981234567"), "0981234567");
  assert.equal(ctx.normalizePhone_("+84981234567"), "0981234567");
});

test("normalizePhone_: các dạng sai Code.gs của landing cũng từ chối (tương đương)", () => {
  for (const v of ["+0981234567", "084981234567", "0981a34567", "098123456789", "9.81234567E8"]) {
    assert.equal(landing.normalizePhone_(v), ctx.normalizePhone_(v), v);
  }
});

test("normalizePhone_: ca 9 chữ số là khác biệt có chủ ý so với landing", () => {
  assert.equal(landing.normalizePhone_("981234567"), "");
  assert.equal(ctx.normalizePhone_("981234567"), "0981234567");
});

test("normalizePhone_: tương đương Code.gs của landing (trừ ca 9 chữ số, khác biệt có chủ ý)", () => {
  for (const v of [...PHONES_REAL_FORMS, "12345"]) {
    assert.equal(ctx.normalizePhone_(v), landing.normalizePhone_(v), String(v));
  }
});

test("KHACH_COLS: đúng 17 cột, đúng thứ tự", () => {
  assert.deepEqual(plain(ctx.KHACH_COLS), ["MaKhach", "SDT", "HoTen", "NgayTao", "NgayCapNhat", "NguonGoc", "NguonChiTiet", "DuAnQuanTam", "NhuCau", "CanXem", "PTTT", "DongYNhanTin", "DongYBangChung", "TrangThaiCRM", "TrangThaiChamSoc", "NguoiChamSoc", "GhiChu"]);
});
