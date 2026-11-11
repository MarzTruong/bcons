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

// ---- parseLandingRow_ (Task 3) ----
const HEADERS = plain(landing.HEADERS);
const CONSENT = "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/)";
function landingRow(over = {}) {
  const base = {
    "Thời gian": "2026-11-06T03:15:00.000Z", "Họ tên": "Nguyễn Văn A", "SĐT": "0981234567", "Nhu cầu": "Mua để ở",
    "Căn xem": "A1-12.05", "Loại căn": "2PN-2WC", "PTTT": "PTTT 03", "Nguồn": "facebook", "Đồng ý nhận tin": CONSENT,
    "Trạng thái chăm sóc": "Mới", "Dự án": "bcons-newsky", "Đã gộp": "",
  };
  const m = { ...base, ...over };
  return HEADERS.map((h) => (h in m ? m[h] : ""));
}

test("parseLandingRow_: dòng thật đủ khóa KHACH_COLS và ánh xạ đúng", () => {
  const r = plain(ctx.parseLandingRow_(HEADERS, landingRow()));
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.rec).sort(), [...plain(ctx.KHACH_COLS)].sort());
  for (const k of plain(ctx.KHACH_COLS)) assert.equal(typeof r.rec[k], "string", k);
  assert.equal(r.rec.SDT, "0981234567");
  assert.equal(r.rec.HoTen, "Nguyễn Văn A");
  assert.equal(r.rec.NhuCau, "Mua để ở");
  assert.equal(r.rec.CanXem, "A1-12.05 · 2PN-2WC");
  assert.equal(r.rec.PTTT, "PTTT 03");
  assert.equal(r.rec.NguonChiTiet, "facebook");
  assert.equal(r.rec.DuAnQuanTam, "bcons-newsky");
  assert.equal(r.rec.NgayTao, "2026-11-06T03:15:00.000Z");
  assert.equal(r.rec.NguonGoc, "Landing");
  assert.equal(r.rec.DongYNhanTin, "Có");
  assert.equal(r.rec.DongYBangChung, CONSENT);
  assert.equal(r.rec.MaKhach, "");
});

test("parseLandingRow_: dòng do rowFor_ thật của landing ghi ra (SĐT có dấu ' khi ghi, Sheets trả không dấu)", () => {
  const now = new Date("2026-11-06T03:15:00.000Z");
  const lead = { ten: "Trần B", phone: "0981234567", nhuCau: "Mua cho thuê", canMoTa: "", canLoai: "Studio", pttt: "PTTT 01", giaChuaVat: 1, tuCo: 1, vay: 0, traGop: 0, lai: 0, nam: 0, nguon: "tiktok", trang: "https://x.pages.dev/", duAn: "" };
  const row = landing.rowFor_(lead, now).slice();
  row[2] = String(row[2]).replace(/^'/, "");
  const r = plain(ctx.parseLandingRow_(HEADERS, row));
  assert.equal(r.ok, true);
  assert.equal(r.rec.SDT, "0981234567");
  assert.equal(r.rec.CanXem, "Studio");
  assert.equal(r.rec.DuAnQuanTam, "");
  assert.equal(r.rec.DongYNhanTin, "Có");
  assert.match(r.rec.DongYBangChung, /^Có \(2026-11-06T03:15:00\.000Z, mẫu v1-2026-11-06, https:\/\/x\.pages\.dev\/\)$/);
});

test("parseLandingRow_: SĐT dạng chuỗi, số mất số 0, và +84", () => {
  for (const v of ["0981234567", 981234567, "+84 98 123 4567"]) {
    const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "SĐT": v })));
    assert.equal(r.rec.SDT, "0981234567", String(v));
  }
});

test("parseLandingRow_: SĐT sai -> ok:false lyDo", () => {
  assert.deepEqual(plain(ctx.parseLandingRow_(HEADERS, landingRow({ "SĐT": "12345" }))), { ok: false, lyDo: "SĐT không hợp lệ" });
});

test("parseLandingRow_: Dự án 'khong-ro' hoặc rỗng -> ''; mã thật giữ", () => {
  assert.equal(plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": "khong-ro" }))).rec.DuAnQuanTam, "");
  assert.equal(plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": "" }))).rec.DuAnQuanTam, "");
  assert.equal(plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": "bcons-newsky" }))).rec.DuAnQuanTam, "bcons-newsky");
});

test("parseLandingRow_: chặn công thức trong chữ tự do", () => {
  const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Họ tên": "=HYPERLINK(1)", "Nhu cầu": "+1", "Căn xem": "@x", "Loại căn": "", "PTTT": "-2", "Nguồn": "=cmd" })));
  assert.equal(r.rec.HoTen, "'=HYPERLINK(1)");
  assert.equal(r.rec.NhuCau, "'+1");
  assert.equal(r.rec.CanXem, "'@x");
  assert.equal(r.rec.PTTT, "'-2");
  assert.equal(r.rec.NguonChiTiet, "'=cmd");
  assert.equal(ctx.cell_("a".repeat(600)).length, 500);
  assert.equal(ctx.cell_(null), "");
});

test("parseLandingRow_: ô đồng ý rỗng hoặc lạ -> Chưa rõ, không có bằng chứng", () => {
  for (const v of ["", "Không", "Có", "có (x)"]) {
    const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Đồng ý nhận tin": v })));
    assert.equal(r.rec.DongYNhanTin, "Chưa rõ", v);
    assert.equal(r.rec.DongYBangChung, "", v);
  }
});

test("parseLandingRow_: Thời gian là Date -> ISO", () => {
  const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Thời gian": new Date("2026-11-06T03:15:00.000Z") })));
  assert.equal(r.rec.NgayTao, "2026-11-06T03:15:00.000Z");
});

test("parseLandingRow_: dòng cũ 17 ô (chưa có Dự án/Đã gộp) vẫn đọc được", () => {
  const row = landingRow().slice(0, 17);
  const r = plain(ctx.parseLandingRow_(HEADERS, row));
  assert.equal(r.ok, true);
  assert.equal(r.rec.DuAnQuanTam, "");
  assert.equal(r.rec.SDT, "0981234567");
});

test("parseLandingRow_: đổi thứ tự cột vẫn ánh xạ đúng, cột lạ bị bỏ, không sửa đầu vào", () => {
  const row = landingRow();
  const idx = HEADERS.map((_, i) => i).reverse();
  const h2 = [...idx.map((i) => HEADERS[i]), "Cột lạ"];
  const r2 = [...idx.map((i) => row[i]), "x"];
  const h2copy = [...h2], r2copy = [...r2];
  const a = plain(ctx.parseLandingRow_(h2, r2));
  const b = plain(ctx.parseLandingRow_(HEADERS, row));
  assert.deepEqual(a, b);
  assert.deepEqual(h2, h2copy);
  assert.deepEqual(r2, r2copy);
});

test("parseLandingRow_: dòng rỗng -> ok:false", () => {
  assert.equal(plain(ctx.parseLandingRow_(HEADERS, [])).ok, false);
  assert.equal(plain(ctx.parseLandingRow_(HEADERS, HEADERS.map(() => ""))).ok, false);
});

test("parseLandingRow_: chỉ coi là đã đồng ý khi đúng khuôn bằng chứng của Code.gs", () => {
  const H = ["SĐT", "Họ tên", "Đồng ý nhận tin"];
  const one = (v) => ctx.parseLandingRow_(H, ["0981234567", "Khách Mẫu", v]).rec;
  for (const bad of [" Có (x)", "\u00a0Có (x)", "Có (", "Có (=1+1)", "Có (x)\nđ", "Có (2026-11-06T03:15:00.000Z, mẫu v1, x)\n", true, 1, new Date(0)]) {
    assert.equal(one(bad).DongYNhanTin, "Chưa rõ", String(bad));
    assert.equal(one(bad).DongYBangChung, "");
  }
  const real = "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/)";
  assert.equal(one(real).DongYNhanTin, "Có");
  assert.equal(one(real).DongYBangChung, real);
  assert.equal(one("Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, )").DongYNhanTin, "Có", "trang rỗng vẫn đúng khuôn");
});

test("parseLandingRow_: Dự án chỉ giữ mã hợp lệ; Thời gian chỉ nhận ISO; không lọt công thức", () => {
  const H = ["SĐT", "Dự án", "Thời gian"];
  const p = (da, tg) => ctx.parseLandingRow_(H, ["0981234567", da, tg]).rec;
  assert.equal(p("=HYPERLINK(1)", "=1+1").DuAnQuanTam, "");
  assert.equal(p("=HYPERLINK(1)", "=1+1").NgayTao, "");
  assert.equal(p("Khong-ro", "").DuAnQuanTam, "");
  assert.equal(p("Bcons-Newsky; bcons-central-park;bcons-newsky", "").DuAnQuanTam, "bcons-newsky;bcons-central-park");
  assert.equal(p("", 46000.5).NgayTao, "");
  assert.equal(p("", "2026-11-06T03:15:00.000Z").NgayTao, "2026-11-06T03:15:00.000Z");
  assert.equal(p("", new Date("2026-11-06T03:15:00.000Z")).NgayTao, "2026-11-06T03:15:00.000Z");
});
