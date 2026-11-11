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

test("normalizePhone_: tương đương Code.gs của landing (trừ ca 9 chữ số và '+84 (0)', khác biệt có chủ ý)", () => {
  for (const v of [...PHONES_REAL_FORMS, "12345"]) {
    assert.equal(ctx.normalizePhone_(v), landing.normalizePhone_(v), String(v));
  }
});

test("KHACH_COLS: đúng 19 cột, 17 cột đầu giữ nguyên vị trí, hai cột mới ở cuối", () => {
  const cols = plain(ctx.KHACH_COLS);
  assert.equal(cols.length, 19);
  assert.deepEqual(cols.slice(0, 17), ["MaKhach", "SDT", "HoTen", "NgayTao", "NgayCapNhat", "NguonGoc", "NguonChiTiet", "DuAnQuanTam", "NhuCau", "CanXem", "PTTT", "DongYNhanTin", "DongYBangChung", "TrangThaiCRM", "TrangThaiChamSoc", "NguoiChamSoc", "GhiChu"]);
  assert.deepEqual(cols.slice(17), ["DongYDuAn", "NgayRutLai"]);
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
  assert.equal(r.rec.DongYBangChung, "bcons-newsky: " + CONSENT); // đổi có chủ đích: bằng chứng gắn mã dự án
  assert.equal(r.rec.DongYDuAn, "bcons-newsky");
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
  // đổi có chủ đích: dòng landing cũ không có mã dự án -> Chưa rõ (chưa biết đồng ý cho dự án nào), vẫn lưu khách
  assert.equal(r.rec.DongYNhanTin, "Chưa rõ");
  assert.equal(r.rec.DongYDuAn, "");
  const r2 = plain(ctx.parseLandingRow_(HEADERS, landing.rowFor_({ ...lead, duAn: "bcons-newsky" }, now).slice().map((v, i) => (i === 2 ? String(v).replace(/^'/, "") : v)))).rec;
  assert.equal(r2.DongYNhanTin, "Có");
  assert.match(r2.DongYBangChung, /^bcons-newsky: Có \(2026-11-06T03:15:00\.000Z, mẫu v1-2026-11-06, https:\/\/x\.pages\.dev\/\)$/);
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
  const H = ["SĐT", "Họ tên", "Đồng ý nhận tin", "Dự án"];
  const one = (v) => ctx.parseLandingRow_(H, ["0981234567", "Khách Mẫu", v, "bcons-newsky"]).rec;
  for (const bad of [" Có (x)", "\u00a0Có (x)", "Có (", "Có (=1+1)", "Có (x)\nđ", "Có (2026-11-06T03:15:00.000Z, mẫu v1, x)\n", true, 1, new Date(0)]) {
    assert.equal(one(bad).DongYNhanTin, "Chưa rõ", String(bad));
    assert.equal(one(bad).DongYBangChung, "");
  }
  const real = "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/)";
  assert.equal(one(real).DongYNhanTin, "Có");
  assert.equal(one(real).DongYBangChung, "bcons-newsky: " + real); // đổi có chủ đích: gắn mã dự án
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

// ---- mergeCustomer_ (Task 4) ----
const blank = () => Object.fromEntries(ctx.KHACH_COLS.map((c) => [c, ""]));
const mk = (o) => Object.assign(blank(), o);
const NOW = "2026-11-13T02:00:00.000Z";
const MA = "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/)";
const merge = (a, b) => plain(ctx.mergeCustomer_(a, b, NOW));

test("mergeCustomer_: tên anh đã sửa không bị landing ghi đè", () => {
  const ex = mk({ MaKhach: "KH-000001", SDT: "0981234567", HoTen: "Nguyễn Văn Mẫu", NgayTao: "2026-11-01T00:00:00.000Z" });
  const inc = mk({ SDT: "0981234567", HoTen: "mau nguyen", NgayTao: "2026-11-09T00:00:00.000Z", NhuCau: "Ở thực" });
  const r = merge(ex, inc);
  assert.equal(r.HoTen, "Nguyễn Văn Mẫu");
  assert.equal(r.MaKhach, "KH-000001");
  assert.equal(r.NgayTao, "2026-11-01T00:00:00.000Z");
  assert.equal(r.NhuCau, "Ở thực", "ô trống thì điền");
  assert.equal(r.NgayCapNhat, NOW);
  assert.equal(merge(mk({ SDT: "0981234567" }), inc).NgayTao, "2026-11-09T00:00:00.000Z", "NgayTao cũ trống thì lấy mới");
});

test("mergeCustomer_: Landing rồi CRM (và ngược lại) -> Landing+CRM; dự án hợp không lặp", () => {
  const land = mk({ NguonGoc: "Landing", DuAnQuanTam: "bcons-newsky;bcons-central-park" });
  const crm = mk({ NguonGoc: "CRM", DuAnQuanTam: "bcons-central-park;bcons-sora" });
  const r1 = merge(land, crm);
  assert.equal(r1.NguonGoc, "Landing+CRM");
  assert.equal(r1.DuAnQuanTam, "bcons-newsky;bcons-central-park;bcons-sora");
  assert.equal(merge(crm, land).NguonGoc, "Landing+CRM");
  assert.equal(merge(crm, land).DuAnQuanTam, "bcons-central-park;bcons-sora;bcons-newsky");
  assert.equal(merge(land, land).NguonGoc, "Landing");
  assert.equal(merge(mk({}), crm).NguonGoc, "CRM");
  assert.equal(merge(land, mk({})).NguonGoc, "Landing");
  assert.equal(merge(mk({ NguonGoc: "Landing+CRM" }), crm).NguonGoc, "Landing+CRM");
  assert.equal(merge(mk({ DuAnQuanTam: "a-b-c;;" }), mk({ DuAnQuanTam: ";a-b-c; d-e-f" })).DuAnQuanTam, "a-b-c;d-e-f");
});

test("mergeCustomer_: Không thắng Có ở cả hai chiều (nay thành 'Đã rút lại' + NgayRutLai); Chưa rõ + Chưa rõ không thành Có", () => {
  const co = mk({ DongYNhanTin: "Có", DongYBangChung: "bcons-newsky: " + MA, DongYDuAn: "bcons-newsky" });
  const khong = mk({ DongYNhanTin: "Không", DongYBangChung: "Rút lại 2026-11-10" });
  for (const [a, b] of [[co, khong], [khong, co]]) {
    const r = merge(a, b);
    assert.equal(r.DongYNhanTin, "Đã rút lại");
    assert.equal(r.NgayRutLai, NOW);
    assert.equal(r.DongYDuAn, "");
    assert.equal(r.DongYBangChung, "bcons-newsky: " + MA, "chữ 'Rút lại ...' không phải bằng chứng nên bỏ; bằng chứng thật giữ làm lịch sử");
  }
  assert.equal(merge(mk({ DongYNhanTin: "Không" }), mk({ DongYBangChung: "Rút lại 2026-11-10" })).DongYBangChung, "");
  const cr = mk({ DongYNhanTin: "Chưa rõ" });
  const r = merge(cr, cr);
  assert.equal(r.DongYNhanTin, "Chưa rõ");
  assert.equal(r.DongYBangChung, "");
  assert.equal(merge(mk({}), mk({})).DongYNhanTin, "Chưa rõ");
  const up = merge(cr, co);
  assert.equal(up.DongYNhanTin, "Có");
  assert.equal(up.DongYBangChung, "bcons-newsky: " + MA);
  const keep = merge(co, mk({ DongYNhanTin: "Có", DongYBangChung: "Có (khác)" }));
  assert.equal(keep.DongYBangChung, "bcons-newsky: " + MA, "giữ bằng chứng cũ");
});

test("mergeCustomer_: cột anh giữ nguyên; cột anh trống thì nhận giá trị mới", () => {
  const ex = mk({ TrangThaiCRM: "Đã gặp", TrangThaiChamSoc: "Nóng", NguoiChamSoc: "Anh", GhiChu: "Gọi sau 5h", NguonChiTiet: "facebook", PTTT: "PTTT 02" });
  const inc = mk({ TrangThaiCRM: "Mới", TrangThaiChamSoc: "Lạnh", NguoiChamSoc: "Khác", GhiChu: "x", NguonChiTiet: "tiktok", PTTT: "PTTT 03", CanXem: "A1-05" });
  const r = merge(ex, inc);
  for (const k of ["TrangThaiCRM", "TrangThaiChamSoc", "NguoiChamSoc", "GhiChu", "NguonChiTiet", "PTTT"]) assert.equal(r[k], ex[k], k);
  assert.equal(r.CanXem, "A1-05");
  const r2 = merge(mk({ TrangThaiCRM: "" }), mk({ TrangThaiCRM: "Đã gọi" }));
  assert.equal(r2.TrangThaiCRM, "Đã gọi");
});

test("mergeCustomer_: không sửa đầu vào, kết quả đúng 19 khóa, đầu vào thiếu khóa vẫn chạy", () => {
  const ex = mk({ HoTen: "A", DuAnQuanTam: "a-b-c" });
  const inc = mk({ HoTen: "B", DuAnQuanTam: "d-e-f" });
  const exCopy = JSON.stringify(ex), incCopy = JSON.stringify(inc);
  const r = ctx.mergeCustomer_(ex, inc, NOW);
  assert.equal(JSON.stringify(ex), exCopy);
  assert.equal(JSON.stringify(inc), incCopy);
  assert.notEqual(r, ex);
  assert.deepEqual(Object.keys(plain(r)), plain(ctx.KHACH_COLS));
  const r2 = merge({ SDT: "0981234567", HoTen: undefined }, { HoTen: "B" });
  assert.deepEqual(Object.keys(r2), plain(ctx.KHACH_COLS));
  assert.equal(r2.HoTen, "B");
  assert.equal(r2.SDT, "0981234567");
  assert.equal(merge({}, {}).DongYNhanTin, "Chưa rõ");
});

// ---- mergeCustomer_ hardening ----
test("mergeCustomer_: 'Có' chỉ tính khi có bằng chứng đúng khuôn", () => {
  const good = mk({ DongYNhanTin: "Có", DongYBangChung: "bcons-newsky: " + MA });
  const r1 = merge(mk({ DongYNhanTin: "Có", DongYBangChung: "" }), good);
  assert.equal(r1.DongYNhanTin, "Có");
  assert.equal(r1.DongYBangChung, "bcons-newsky: " + MA);
  const r2 = merge(mk({}), mk({ DongYNhanTin: "Có", DongYBangChung: "" }));
  assert.deepEqual([r2.DongYNhanTin, r2.DongYBangChung], ["Chưa rõ", ""]);
  const r3 = merge(mk({ DongYNhanTin: "Chưa rõ" }), mk({ DongYNhanTin: "Có", DongYBangChung: "zzz" }));
  assert.deepEqual([r3.DongYNhanTin, r3.DongYBangChung], ["Chưa rõ", ""]);
  const r4 = merge(mk({ DongYNhanTin: "Có", DongYBangChung: "zzz" }), mk({ DongYNhanTin: "Có", DongYBangChung: "" }));
  assert.deepEqual([r4.DongYNhanTin, r4.DongYBangChung], ["Chưa rõ", ""]);
  assert.equal(ctx.hasConsentEvidence_(MA), true);
  assert.equal(ctx.hasConsentEvidence_("Có (x)"), false);
});

test("mergeCustomer_: 'Không' không mang bằng chứng giống đồng ý", () => {
  const E = mk({ DongYNhanTin: "Không", DongYBangChung: MA });
  let r = merge(E, mk({}));
  assert.deepEqual([r.DongYNhanTin, r.DongYDuAn, r.NgayRutLai], ["Đã rút lại", "", NOW]);
  r = merge(mk({ DongYNhanTin: "Có", DongYBangChung: "bcons-newsky: " + MA }), E);
  assert.deepEqual([r.DongYNhanTin, r.DongYDuAn], ["Đã rút lại", ""]);
});

test("mergeCustomer_: ô Sheets dạng Date/số được chuẩn hóa", () => {
  const d = new Date("2026-11-01T00:00:00.000Z");
  const r = merge(mk({ NgayTao: d, SDT: 981234567 }), mk({ SDT: "098.123.4567" }));
  assert.equal(r.NgayTao, "2026-11-01T00:00:00.000Z");
  assert.equal(r.SDT, "0981234567");
  assert.equal(merge(mk({ NgayTao: new Date("x") }), mk({})).NgayTao, "");
  assert.equal(merge(mk({ SDT: "abc" }), mk({ SDT: "0981234567" })).SDT, "0981234567");
  assert.equal(merge(mk({ SDT: "abc" }), mk({})).SDT, "");
});

test("mergeCustomer_: DuAnQuanTam lọc mã hợp lệ, không phân biệt hoa thường", () => {
  const r = merge(mk({ DuAnQuanTam: "Bcons-X; khong-ro" }), mk({ DuAnQuanTam: "bcons-x;=x" }));
  assert.equal(r.DuAnQuanTam, "bcons-x");
});

test("mergeCustomer_: nhận chữ đã qua cell_ và giữ nguyên; ô toàn khoảng trắng coi là trống", () => {
  assert.equal(merge(mk({ HoTen: "'=x" }), mk({ HoTen: "B" })).HoTen, "'=x");
  assert.equal(merge(mk({ HoTen: "   " }), mk({ HoTen: "Khách Mẫu" })).HoTen, "Khách Mẫu");
});

test("mergeCustomer_: idempotent", () => {
  const a = mk({ SDT: "0981234567", HoTen: "A", NguonGoc: "Landing", DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Có", DongYBangChung: MA });
  const b = mk({ NguonGoc: "CRM", DuAnQuanTam: "bcons-sora", TrangThaiCRM: "Mới", NhuCau: "Ở" });
  const once = merge(a, b);
  assert.deepEqual(plain(ctx.mergeCustomer_(once, b, NOW)), once);
});

test("mergeCustomer_: NguonGoc đủ 25 tổ hợp", () => {
  const V = ["", "Landing", "CRM", "Landing+CRM", "CRM+Landing"];
  for (const x of V) for (const y of V) {
    const toks = new Set(`${x}+${y}`.split("+").filter(Boolean));
    const want = toks.size === 0 ? "" : toks.size === 2 ? "Landing+CRM" : [...toks][0];
    assert.equal(merge(mk({ NguonGoc: x }), mk({ NguonGoc: y })).NguonGoc, want, `${x}|${y}`);
  }
});

// ---- decideDestinations_ ----
const PROJ = ["bcons-newsky", "bcons-sora", "bcons-central-park"];
const decide = (rec, tc, pc = PROJ) => plain(ctx.decideDestinations_(rec, tc, pc));

test("decideDestinations_: hai dự án → dich có cả hai, đúng thứ tự", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora;bcons-newsky" }, new Set()),
    { xoa: false, rutLai: false, dich: ["bcons-sora", "bcons-newsky"], lyDo: "" });
});

test("decideDestinations_: DuAnQuanTam rỗng → dich [], không cờ nào", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "" }, new Set()), { xoa: false, rutLai: false, dich: [], lyDo: "" });
});

test("decideDestinations_: chỉ mã lạ → dich rỗng; lẫn mã lạ → chỉ giữ mã biết", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "xyz-abc" }, []), { xoa: false, rutLai: false, dich: [], lyDo: "" });
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "xyz-abc;bcons-sora" }, []), { xoa: false, rutLai: false, dich: ["bcons-sora"], lyDo: "" });
});

test("decideDestinations_: trùng mã chỉ tính một lần", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora;bcons-sora" }).dich, ["bcons-sora"]);
});

test("decideDestinations_: SĐT trong TuChoi dạng cũ (Set, mảng, khác dạng) → rút lại chưa rõ ngày (dich vẫn tính)", () => {
  const rec = { SDT: "0981234567", DuAnQuanTam: "bcons-sora" };
  const want = { xoa: false, rutLai: true, dich: ["bcons-sora"], lyDo: "rutlai" };
  assert.deepEqual(decide(rec, new Set(["0981234567"])), want);
  assert.deepEqual(decide(rec, ["0981234567"]), want);
  assert.deepEqual(decide(rec, new Set(["+84 98 123 4567"])), want);
  assert.deepEqual(decide(rec, ["0912345678"]).rutLai, false);
});

test("decideDestinations_: DongYNhanTin 'Không' → rutLai (dich vẫn tính); 'Chưa rõ' không", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora", DongYNhanTin: "Không" }, new Set()), { xoa: false, rutLai: true, dich: ["bcons-sora"], lyDo: "khong" });
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora", DongYNhanTin: "Chưa rõ" }, new Set()), { xoa: false, rutLai: false, dich: ["bcons-sora"], lyDo: "" });
});

test("decideDestinations_: tuChoi undefined, projectCodes rỗng, SĐT sai", () => {
  assert.equal(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora" }, undefined).rutLai, false);
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora" }, undefined, []), { xoa: false, rutLai: false, dich: [], lyDo: "" });
  assert.deepEqual(decide({ SDT: "abc", DuAnQuanTam: "bcons-sora" }, ["abc"]), { xoa: false, rutLai: false, dich: [], lyDo: "" });
});

test("decideDestinations_: không sửa đầu vào", () => {
  const rec = { SDT: "0981234567", DuAnQuanTam: "bcons-sora;x" };
  const tc = ["0981234567"], pc = PROJ.slice();
  const r0 = JSON.stringify([rec, tc, pc]);
  ctx.decideDestinations_(rec, tc, pc);
  assert.equal(JSON.stringify([rec, tc, pc]), r0);
});

const R = { SDT: "0981234567", DuAnQuanTam: "bcons-sora" };

test("decideDestinations_: 'Không' nhận mọi biến thể (fail closed)", () => {
  for (const v of ["không", "KHÔNG", "Khong", "Không.", "Không".normalize("NFD"), "Không\u200b", " Không ", "K-hông"]) {
    const r = decide({ ...R, DongYNhanTin: v }, []);
    assert.equal(r.rutLai, true, JSON.stringify(v));
    assert.equal(r.lyDo, "khong");
  }
  for (const v of ["Chưa rõ", "", "Có", undefined]) assert.equal(decide({ ...R, DongYNhanTin: v }, []).rutLai, false, String(v));
});

test("decideDestinations_: chỉ đúng 'Không' mới rút lại; 'Không rõ', 'Không biết' KHÔNG chặn (L1)", () => {
  for (const v of ["Không rõ", "không biết", "Khong ro", "Không chắc", "Không muốn nhận tin nhưng gọi được"]) {
    const r = decide({ ...R, DongYNhanTin: v }, []);
    assert.equal(r.rutLai, false, v);
    assert.equal(r.lyDo, "", v);
    assert.deepEqual(r.dich, ["bcons-sora"], v);
  }
});

test("dongYKieu_: khong (đúng) / la (bắt đầu bằng khong nhưng không đúng) / rỗng", () => {
  for (const v of ["Không", "KHÔNG", "khong", " Không. ", "Không".normalize("NFD"), "Không\u200b"]) assert.equal(ctx.dongYKieu_(v), "khong", JSON.stringify(v));
  for (const v of ["Không rõ", "Không biết", "khong chac"]) assert.equal(ctx.dongYKieu_(v), "la", v);
  for (const v of ["Có", "Chưa rõ", "", null, undefined]) assert.equal(ctx.dongYKieu_(v), "", String(v));
  for (const v of ["Rút lại", "Từ chối", "No", "Không nhận tin", "Biết rồi"]) assert.equal(ctx.dongYKieu_(v), "la", v);
});

test("decideDestinations_: tuChoi mọi dạng cũ đều rút lại", () => {
  const P = "0981234567";
  for (const t of [[P], new Set([P]), new Map([[P, 1]]), { [P]: true }, P, `0912345678\n${P}`, `0912345678, ${P}`, `0912345678;${P}`, `0912345678 ${P}`]) {
    assert.equal(decide(R, t).rutLai, true, JSON.stringify([...(t instanceof Set ? t : [])]) + String(t));
    assert.equal(decide(R, t).lyDo, "rutlai");
  }
  assert.equal(decide(R, null).rutLai, false);
  assert.equal(decide(R, "").rutLai, false);
});

test("decideDestinations_: tuChoi dạng lạ thì ném lỗi", () => {
  for (const t of [123, true, () => 1]) assert.throws(() => ctx.decideDestinations_(R, t, PROJ), /tuChoi/);
});

test("decideDestinations_: phần tử rác trong tuChoi bị bỏ qua, không chặn tất cả", () => {
  assert.equal(decide(R, [null, "", {}, NaN, undefined, "abc"]).rutLai, false);
  assert.equal(decide(R, new Set([null, "", NaN])).rutLai, false);
  assert.equal(decide(R, [null, "0981234567"]).rutLai, true);
});

test("decideDestinations_: projectCodes không phải mảng → không ném, dich rỗng", () => {
  for (const pc of ["bcons-sora", { a: 1 }, new Set(["bcons-sora"]), null, undefined]) {
    assert.deepEqual(plain(ctx.decideDestinations_(R, [], pc)), { xoa: false, rutLai: false, dich: [], lyDo: "" });
  }
});

test("decideDestinations_: projectCodes cắt khoảng trắng, không phân biệt hoa thường, trả đúng cách viết của cấu hình", () => {
  assert.deepEqual(decide(R, [], [" bcons-sora"]).dich, ["bcons-sora"]);
  assert.deepEqual(decide(R, [], ["Bcons-Sora"]).dich, ["Bcons-Sora"]);
  assert.deepEqual(decide(R, [], ["Bcons-Sora", "bcons-sora"]).dich, ["Bcons-Sora"]);
});

test("normalizePhone_: '+84 (0) 981234567' chỉ Master_Data nhận (khác biệt có chủ ý so với landing)", () => {
  assert.equal(ctx.normalizePhone_("+84 (0) 981234567"), "0981234567");
  assert.equal(ctx.normalizePhone_("84(0)981234567"), "0981234567");
  // landing không xử lý (0): ra số sai '00981234567', không bao giờ ra số đúng
  assert.notEqual(landing.normalizePhone_("+84 (0) 981234567"), "0981234567");
});

// ---- Task 1 (đồng ý theo dự án) ----
const EV = "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/)";

test("parseLandingRow_: dự án A có bằng chứng -> DongYDuAn A, bằng chứng gắn mã, Có; coTheNhan_ đúng A, sai B", () => {
  const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": "bcons-newsky" }))).rec;
  assert.equal(r.DongYDuAn, "bcons-newsky");
  assert.equal(r.DongYBangChung, "bcons-newsky: " + CONSENT);
  assert.equal(r.DongYNhanTin, "Có");
  assert.equal(r.NgayRutLai, "");
  assert.equal(ctx.coTheNhan_(r, "bcons-newsky"), true);
  assert.equal(ctx.coTheNhan_(r, "bcons-central-park"), false);
});

test("parseLandingRow_: hai dòng hai dự án khác nhau -> mỗi dòng đúng dự án của mình", () => {
  const a = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": "bcons-newsky" }))).rec;
  const b = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": "bcons-central-park" }))).rec;
  assert.equal(a.DongYDuAn, "bcons-newsky");
  assert.equal(b.DongYDuAn, "bcons-central-park");
  assert.ok(b.DongYBangChung.startsWith("bcons-central-park: "));
  assert.equal(ctx.coTheNhan_(a, "bcons-central-park"), false);
});

test("parseLandingRow_: không có Dự án (rỗng / khong-ro / dòng cũ) -> Chưa rõ, DongYDuAn rỗng, vẫn ok:true, không nhắn được", () => {
  for (const v of ["", "khong-ro"]) {
    const o = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": v })));
    assert.equal(o.ok, true, v);
    assert.equal(o.rec.DongYDuAn, "", v);
    assert.equal(o.rec.DongYNhanTin, "Chưa rõ", v);
    assert.equal(o.rec.DongYBangChung, "", v);
    assert.equal(ctx.coTheNhan_(o.rec, "bcons-newsky"), false, v);
  }
  const old = plain(ctx.parseLandingRow_(HEADERS, landingRow().slice(0, 17)));
  assert.equal(old.ok, true);
  assert.equal(old.rec.DongYNhanTin, "Chưa rõ");
});

test("parseLandingRow_: có dự án nhưng bằng chứng hỏng -> Chưa rõ, DongYDuAn rỗng", () => {
  for (const v of ["", "Có", "Không", "có (x)", " " + CONSENT]) {
    const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Đồng ý nhận tin": v }))).rec;
    assert.equal(r.DongYDuAn, "", JSON.stringify(v));
    assert.equal(r.DongYNhanTin, "Chưa rõ", JSON.stringify(v));
    assert.equal(r.DongYBangChung, "", JSON.stringify(v));
  }
});

test("ngayDongY_: lấy ISO từ chuỗi thật; sai khuôn hoặc không phải chuỗi -> ''", () => {
  assert.equal(ctx.ngayDongY_(CONSENT), "2026-11-06T03:15:00.000Z");
  assert.equal(ctx.ngayDongY_(EV), "2026-11-06T03:15:00.000Z");
  for (const v of [" Có (x)", "Có (", "", "Có (x)", " " + CONSENT, null, undefined, 5, {}, ["Có (2026-11-06T03:15:00.000Z, mẫu v1, x)"]]) {
    assert.equal(ctx.ngayDongY_(v), "", JSON.stringify(v));
  }
});

test("coTheNhan_: Đã rút lại thì luôn sai, kể cả dự án có trong DongYDuAn", () => {
  const rec = { DongYDuAn: "bcons-newsky;bcons-central-park", DongYNhanTin: "Đã rút lại" };
  assert.equal(ctx.coTheNhan_(rec, "bcons-newsky"), false);
  assert.equal(ctx.coTheNhan_(rec, "bcons-central-park"), false);
  assert.equal(ctx.coTheNhan_({ ...rec, DongYNhanTin: "Có" }, "bcons-central-park"), true);
});

test("coTheNhan_: khớp đúng từng mã, không khớp tiền tố/chuỗi con, không phân biệt hoa thường; đầu vào lạ -> false", () => {
  const rec = { DongYDuAn: "aaa;abc-d", DongYNhanTin: "Có" };
  assert.equal(ctx.coTheNhan_(rec, "aaa"), true);
  assert.equal(ctx.coTheNhan_(rec, "abc-d"), true);
  assert.equal(ctx.coTheNhan_(rec, "AAA"), true);
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "AAA; Abc-D ", DongYNhanTin: "Có" }, "abc-d"), true);
  assert.equal(ctx.coTheNhan_(rec, "aa"), false);
  assert.equal(ctx.coTheNhan_(rec, "aaab"), false);
  assert.equal(ctx.coTheNhan_(rec, "abc"), false);
  assert.equal(ctx.coTheNhan_(rec, ""), false);
  assert.equal(ctx.coTheNhan_(rec, null), false);
  assert.equal(ctx.coTheNhan_(null, "aaa"), false);
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "", DongYNhanTin: "Chưa rõ" }, "aaa"), false);
});

test("mergeCustomer_ (chuyển tiếp Task 1): bằng chứng gắn mã dự án vẫn được tính là hợp lệ; 'Đã rút lại' thắng như 'Không'", () => {
  const inc = mk({ DongYNhanTin: "Có", DongYDuAn: "bcons-newsky", DongYBangChung: "bcons-newsky: " + CONSENT });
  const r = merge(mk({}), inc);
  assert.equal(r.DongYNhanTin, "Có");
  assert.equal(r.DongYDuAn, "bcons-newsky");
  assert.equal(r.DongYBangChung, "bcons-newsky: " + CONSENT);
  const w = merge(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: "2026-11-10T00:00:00.000Z" }), inc);
  assert.equal(w.DongYNhanTin, "Đã rút lại");
  assert.equal(w.NgayRutLai, "2026-11-10T00:00:00.000Z");
});

test("decideDestinations_ (chuyển tiếp Task 1): 'Đã rút lại' không ngày vẫn là rút lại (fail closed), dich vẫn tính", () => {
  const d = plain(ctx.decideDestinations_({ SDT: "0981234567", DongYNhanTin: "Đã rút lại", DuAnQuanTam: "bcons-newsky" }, [], ["bcons-newsky"]));
  assert.equal(d.rutLai, true);
  assert.deepEqual(d.dich, ["bcons-newsky"]);
});

test("parseLandingRow_: ô Dự án có nhiều mã -> đồng ý chỉ gắn mã đầu tiên (bảo thủ), DuAnQuanTam giữ đủ", () => {
  const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": "bcons-newsky;bcons-central-park" }))).rec;
  assert.equal(r.DuAnQuanTam, "bcons-newsky;bcons-central-park");
  assert.equal(r.DongYDuAn, "bcons-newsky");
  assert.equal(ctx.coTheNhan_(r, "bcons-central-park"), false);
});

test("mergeCustomer_ (chuyển tiếp Task 1): bằng chứng gắn mã nhưng hỏng, hoặc một đoạn hỏng trong nhiều đoạn, không nâng lên Có", () => {
  for (const bad of ["bcons-newsky: zzz", "bcons-newsky: Có (x)", "bcons-newsky: " + CONSENT + " || zzz", "Bcons-Newsky: " + CONSENT, "x: " + CONSENT, " || ", ""]) {
    const r = merge(mk({}), mk({ DongYNhanTin: "Có", DongYDuAn: "bcons-newsky", DongYBangChung: bad }));
    assert.equal(r.DongYNhanTin, "Chưa rõ", JSON.stringify(bad));
    assert.equal(r.DongYBangChung, "", JSON.stringify(bad));
  }
  const two = "bcons-newsky: " + CONSENT + " || bcons-central-park: " + CONSENT;
  assert.equal(merge(mk({}), mk({ DongYNhanTin: "Có", DongYBangChung: two })).DongYNhanTin, "Có");
});

// ---- Task 1 review: fail closed ----
test("coTheNhan_: chỉ true khi DongYNhanTin đúng 'Có' (sau trim); mọi giá trị khác false dù mã có trong DongYDuAn", () => {
  const rec = (v) => ({ DongYDuAn: "abc", DongYNhanTin: v });
  for (const v of ["Không", "Không ", "Chưa rõ", "", "có", "CÓ", "Đã rút lại", "Có (x)", undefined, null, 1, true]) {
    assert.equal(ctx.coTheNhan_(rec(v), "abc"), false, JSON.stringify(v));
  }
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "abc" }, "abc"), false, "thiếu DongYNhanTin");
  assert.equal(ctx.coTheNhan_(rec("Có"), "abc"), true);
  assert.equal(ctx.coTheNhan_(rec(" Có "), "abc"), true, "ô Sheets có thể dính khoảng trắng");
  // hồ sơ đã rút lại/xóa mà DongYDuAn chưa được xóa: không bao giờ nhắn được
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "abc;def", DongYNhanTin: "Đã rút lại", NgayRutLai: "2026-11-10T00:00:00.000Z" }, "def"), false);
});

test("coTheNhan_: mã rỗng/không phải chuỗi -> false (không khớp mục rỗng của DongYDuAn)", () => {
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "", DongYNhanTin: "Có" }, ""), false);
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "abc", DongYNhanTin: "Có" }, ""), false);
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "abc;", DongYNhanTin: "Có" }, ""), false);
  assert.equal(ctx.coTheNhan_({ DongYDuAn: "abc", DongYNhanTin: "Có" }, "  "), false);
  for (const m of [undefined, null, 5, {}, ["abc"]]) assert.equal(ctx.coTheNhan_({ DongYDuAn: "abc", DongYNhanTin: "Có" }, m), false, String(m));
});

test("parseLandingRow_: bằng chứng chứa ' || ' hoặc xuống dòng -> không hợp lệ (Chưa rõ, DongYDuAn rỗng)", () => {
  for (const ev of [
    "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/?a= || bcons-central-park: Có (2026-11-06T03:15:00.000Z, mẫu v1, x))",
    "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, a || b)",
    "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, a\nb)",
    "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, a\rb)",
  ]) {
    const r = plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Đồng ý nhận tin": ev }))).rec;
    assert.equal(r.DongYNhanTin, "Chưa rõ", JSON.stringify(ev));
    assert.equal(r.DongYDuAn, "", JSON.stringify(ev));
    assert.equal(r.DongYBangChung, "", JSON.stringify(ev));
  }
});

test("mergeCustomer_ (chuyển tiếp): bằng chứng cũ không mã chứa ' || ' cũng không hợp lệ", () => {
  const ev = "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, a || b)";
  const r = merge(mk({}), mk({ DongYNhanTin: "Có", DongYBangChung: ev }));
  assert.deepEqual([r.DongYNhanTin, r.DongYBangChung], ["Chưa rõ", ""]);
});

test("parseLandingRow_: ô Dự án nhiều mã -> đồng ý chỉ cho mã hợp lệ đầu tiên, bất kể thứ tự; mã đầu không hợp lệ bị bỏ", () => {
  const p = (v) => plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Dự án": v }))).rec;
  const ab = p("bcons-aaa;bcons-bbb"), ba = p("bcons-bbb;bcons-aaa");
  assert.equal(ab.DongYDuAn, "bcons-aaa");
  assert.equal(ba.DongYDuAn, "bcons-bbb");
  assert.equal(ctx.coTheNhan_(ab, "bcons-bbb"), false);
  assert.equal(ctx.coTheNhan_(ba, "bcons-aaa"), false);
  const sk = p("khong-ro;bcons-bbb;bcons-aaa");
  assert.equal(sk.DongYDuAn, "bcons-bbb");
  assert.equal(ctx.coTheNhan_(sk, "bcons-aaa"), false);
  assert.equal(ctx.coTheNhan_(sk, "khong-ro"), false);
});

// ---- Task 2: gộp đồng ý theo dự án, ngày rút lại ----
const evAt = (d, page = "https://x.pages.dev/") => `Có (${d}T03:15:00.000Z, mẫu v1-2026-11-06, ${page})`;
const seg = (ma, d) => `${ma}: ${evAt(d)}`;
const consent = (ma, d) => mk({ DongYNhanTin: "Có", DongYDuAn: ma, DongYBangChung: seg(ma, d) });
const T10 = "2026-11-10T00:00:00.000Z";

test("Task 2 (a): đồng ý A rồi landing đồng ý B -> 'A;B' (cũ trước), Có, đủ hai đoạn bằng chứng", () => {
  const r = merge(consent("aaa-aaa", "2026-11-05"), consent("bbb-bbb", "2026-11-06"));
  assert.equal(r.DongYDuAn, "aaa-aaa;bbb-bbb");
  assert.equal(r.DongYNhanTin, "Có");
  assert.equal(r.DongYBangChung, seg("aaa-aaa", "2026-11-05") + " || " + seg("bbb-bbb", "2026-11-06"));
  assert.equal(r.NgayRutLai, "");
  assert.equal(ctx.coTheNhan_(r, "aaa-aaa"), true);
  assert.equal(ctx.coTheNhan_(r, "bbb-bbb"), true);
});

test("Task 2 (b): NgayRutLai 10/11 + bằng chứng 05/11 -> vẫn Đã rút lại, DongYDuAn rỗng", () => {
  const ex = mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: T10 });
  const r = merge(ex, consent("aaa-aaa", "2026-11-05"));
  assert.equal(r.DongYNhanTin, "Đã rút lại");
  assert.equal(r.DongYDuAn, "");
  assert.equal(r.NgayRutLai, T10);
  assert.equal(r.DongYBangChung, seg("aaa-aaa", "2026-11-05"), "giữ làm lịch sử, không cho nhắn");
  assert.equal(ctx.coTheNhan_(r, "aaa-aaa"), false);
});

test("Task 2 (c): bằng chứng 12/11 -> Có, chỉ dự án mới, NgayRutLai giữ nguyên", () => {
  const ex = mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: T10, DongYDuAn: "", DongYBangChung: seg("old-old", "2026-11-05") });
  const r = merge(ex, consent("aaa-aaa", "2026-11-12"));
  assert.equal(r.DongYNhanTin, "Có");
  assert.equal(r.DongYDuAn, "aaa-aaa");
  assert.equal(r.NgayRutLai, T10);
  assert.equal(ctx.coTheNhan_(r, "old-old"), false);
  assert.equal(ctx.coTheNhan_(r, "aaa-aaa"), true);
});

test("Task 2 (d): đồng ý A và B, rút lại, điền lại chỉ A -> chỉ A nhắn được", () => {
  const both = merge(consent("aaa-aaa", "2026-11-05"), consent("bbb-bbb", "2026-11-05"));
  const withdrawn = merge(Object.assign({}, both, { DongYNhanTin: "Đã rút lại", NgayRutLai: T10 }), mk({}));
  assert.equal(withdrawn.DongYNhanTin, "Đã rút lại");
  const r = merge(withdrawn, consent("aaa-aaa", "2026-11-12"));
  assert.equal(r.DongYNhanTin, "Có");
  assert.equal(r.DongYDuAn, "aaa-aaa");
  assert.equal(ctx.coTheNhan_(r, "aaa-aaa"), true);
  assert.equal(ctx.coTheNhan_(r, "bbb-bbb"), false);
  assert.match(r.DongYBangChung, /bbb-bbb: /, "bằng chứng cũ của B còn làm lịch sử");
});

test("Task 2 (e): bằng chứng rác/không hợp lệ không bao giờ ra Có", () => {
  const bads = ["zzz", "Có (x)", "aaa-aaa: zzz", "aaa-aaa: Có (2026-13-45, mẫu v1, x)", "Có (không-ngày, mẫu v1, x)", "AAA-AAA: " + evAt("2026-11-12"), "x: " + evAt("2026-11-12"), seg("aaa-aaa", "2026-11-12") + " || zzz", " || ", "aaa-aaa: Có (2026-11-12T03:15:00.000Z, mẫu v1, a || b)"];
  for (const bad of bads) {
    for (const ex of [mk({}), mk({ NgayRutLai: T10, DongYNhanTin: "Đã rút lại" })]) {
      const r = merge(ex, mk({ DongYNhanTin: "Có", DongYDuAn: "aaa-aaa", DongYBangChung: bad }));
      assert.notEqual(r.DongYNhanTin, "Có", JSON.stringify(bad));
      assert.equal(r.DongYDuAn, "", JSON.stringify(bad));
      assert.equal(ctx.coTheNhan_(r, "aaa-aaa"), false);
    }
  }
});

test("Task 2 (f): gộp cùng incoming hai lần cho cùng kết quả; cả khi có rút lại", () => {
  const ex = merge(consent("aaa-aaa", "2026-11-05"), mk({ NhuCau: "Ở" }));
  const inc = consent("bbb-bbb", "2026-11-06");
  const once = merge(ex, inc);
  assert.deepEqual(merge(once, inc), once);
  const w = merge(mk({ DongYNhanTin: "Không", DongYDuAn: "aaa-aaa", DongYBangChung: seg("aaa-aaa", "2026-11-05") }), mk({}));
  assert.deepEqual(merge(w, mk({})), w);
  const w2 = merge(w, consent("aaa-aaa", "2026-11-05"));
  assert.deepEqual(merge(w2, consent("aaa-aaa", "2026-11-05")), w2);
});

test("Task 2 (g): DongYDuAn gõ tay 'zzz' không bằng chứng + incoming 'abc' -> chỉ 'abc'", () => {
  const ex = mk({ DongYNhanTin: "Có", DongYDuAn: "zzz", DongYBangChung: "" });
  const r = merge(ex, consent("abc-abc", "2026-11-06"));
  assert.equal(r.DongYDuAn, "abc-abc");
  assert.equal(ctx.coTheNhan_(r, "zzz"), false);
  const r2 = merge(mk({ DongYNhanTin: "Có", DongYDuAn: "zzz-zzz", DongYBangChung: seg("abc-abc", "2026-11-06") }), mk({}));
  assert.equal(r2.DongYDuAn, "abc-abc", "DongYDuAn suy ra từ bằng chứng, không từ ô gõ tay");
  const r3 = merge(mk({ DongYNhanTin: "Có", DongYDuAn: "zzz-zzz" }), mk({}));
  assert.deepEqual([r3.DongYNhanTin, r3.DongYDuAn], ["Chưa rõ", ""]);
});

test("Task 2 (h): bằng chứng của hai dự án cùng được giữ; cùng dự án giữ bản mới nhất", () => {
  const r = merge(consent("aaa-aaa", "2026-11-05"), consent("bbb-bbb", "2026-11-06"));
  assert.match(r.DongYBangChung, /aaa-aaa: /);
  assert.match(r.DongYBangChung, /bbb-bbb: /);
  const newer = merge(consent("aaa-aaa", "2026-11-05"), consent("aaa-aaa", "2026-11-08"));
  assert.equal(newer.DongYBangChung, seg("aaa-aaa", "2026-11-08"));
  const older = merge(consent("aaa-aaa", "2026-11-08"), consent("aaa-aaa", "2026-11-05"));
  assert.equal(older.DongYBangChung, seg("aaa-aaa", "2026-11-08"));
  const tie = merge(mk({ DongYBangChung: "aaa-aaa: " + evAt("2026-11-08", "https://old/"), DongYNhanTin: "Có" }), mk({ DongYBangChung: "aaa-aaa: " + evAt("2026-11-08", "https://new/"), DongYNhanTin: "Có" }));
  assert.match(tie.DongYBangChung, /https:\/\/old\//, "bằng nhau: giữ bản cũ");
});

test("Task 2 (i): bằng chứng đúng bằng NgayRutLai KHÔNG mở lại nhắn tin; 1 ms sau thì mở", () => {
  const ex = mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: "2026-11-10T03:15:00.000Z" });
  const eq = merge(ex, consent("aaa-aaa", "2026-11-10"));
  assert.deepEqual([eq.DongYNhanTin, eq.DongYDuAn], ["Đã rút lại", ""]);
  const later = merge(Object.assign({}, ex, { NgayRutLai: "2026-11-10T03:14:59.999Z" }), consent("aaa-aaa", "2026-11-10"));
  assert.deepEqual([later.DongYNhanTin, later.DongYDuAn], ["Có", "aaa-aaa"]);
});

test("Task 2 (j): existing Có + incoming 'Đã rút lại' -> Đã rút lại, NgayRutLai = now, DongYDuAn rỗng", () => {
  const r = merge(consent("aaa-aaa", "2026-11-05"), mk({ DongYNhanTin: "Đã rút lại" }));
  assert.equal(r.DongYNhanTin, "Đã rút lại");
  assert.equal(r.NgayRutLai, NOW);
  assert.equal(r.DongYDuAn, "");
  assert.equal(ctx.coTheNhan_(r, "aaa-aaa"), false);
  const r2 = merge(mk({ DongYNhanTin: "Đã rút lại", DongYBangChung: seg("aaa-aaa", "2026-11-05") }), mk({}));
  assert.equal(r2.NgayRutLai, NOW, "existing đã rút lại mà chưa có ngày");
});

test("Task 2 (k): rút lại và đồng ý mới (bằng chứng mới hơn) trong cùng một lần gộp -> Có", () => {
  const inc = Object.assign(consent("aaa-aaa", "2026-11-12"), {});
  const r = merge({ ...consent("bbb-bbb", "2026-11-05"), NgayCapNhat: "2026-11-11T00:00:00.000Z" }, Object.assign({}, inc, { DongYNhanTin: "Đã rút lại" }));
  assert.equal(r.DongYNhanTin, "Có");
  assert.equal(r.DongYDuAn, "aaa-aaa");
  assert.equal(r.NgayRutLai, "2026-11-11T00:00:00.000Z", "ngày rút lại = lần chạm gần nhất của hàng, ghi làm lịch sử");
  assert.equal(ctx.coTheNhan_(r, "bbb-bbb"), false, "đồng ý cũ của B đã bị rút");
});

test("Task 2 (l): 'Không rõ' và chữ lạ không phải rút lại và không bao giờ cho Có", () => {
  for (const v of ["Không rõ", "Không biết", "abc", "Chưa rõ"]) {
    const r = merge(mk({ DongYNhanTin: v }), mk({}));
    assert.equal(r.DongYNhanTin, "Chưa rõ", v);
    assert.equal(r.NgayRutLai, "", v);
  }
  const r = merge(mk({ DongYNhanTin: "Không rõ" }), consent("aaa-aaa", "2026-11-06"));
  assert.deepEqual([r.DongYNhanTin, r.NgayRutLai], ["Có", ""]);
});

test("Task 2: anh gõ 'Không' (mọi cách gõ) vào existing là rút lại; 'Không' mới thắng bằng chứng cũ cả khi đã có ngày rút lại cũ", () => {
  for (const v of ["Không", " không ", "KHONG", "Khong."]) {
    const r = merge(mk({ DongYNhanTin: v, DongYDuAn: "aaa-aaa", DongYBangChung: seg("aaa-aaa", "2026-11-05") }), mk({}));
    assert.deepEqual([r.DongYNhanTin, r.NgayRutLai, r.DongYDuAn], ["Đã rút lại", NOW, ""], JSON.stringify(v));
  }
  // đã từng rút (10/11), điền lại 12/11 (nay Có), rồi anh gõ Không: rút mới ở NOW (11/11 < 12/11 giả lập) -> dùng NOW sau đó
  const later = "2026-11-20T02:00:00.000Z";
  const refilled = { ...merge(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: T10 }), consent("aaa-aaa", "2026-11-12")) };
  assert.equal(refilled.DongYNhanTin, "Có");
  const typed = plain(ctx.mergeCustomer_({ ...refilled, DongYNhanTin: "Không" }, mk({}), later));
  assert.deepEqual([typed.DongYNhanTin, typed.NgayRutLai, typed.DongYDuAn], ["Đã rút lại", later, ""]);
});

test("Task 2: NgayRutLai hỏng (không phải ISO) -> fail closed: không bao giờ Có; giữ nguyên giá trị", () => {
  const r = merge(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: "mai" }), consent("aaa-aaa", "2026-12-30"));
  assert.deepEqual([r.DongYNhanTin, r.DongYDuAn, r.NgayRutLai], ["Đã rút lại", "", "mai"]);
  const d = merge(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: new Date(T10) }), mk({}));
  assert.equal(d.NgayRutLai, T10, "ô Date của Sheets");
});

test("Task 2: bằng chứng cũ không mã không cấp đồng ý cho dự án nào; giữ làm lịch sử chỉ khi không có đoạn có mã", () => {
  const r = merge(mk({ DongYNhanTin: "Có", DongYBangChung: MA }), mk({}));
  assert.deepEqual([r.DongYNhanTin, r.DongYDuAn, r.DongYBangChung], ["Chưa rõ", "", MA]);
  assert.deepEqual(merge(r, mk({})), r, "idempotent");
  const r2 = merge(mk({ DongYNhanTin: "Có", DongYBangChung: MA }), consent("aaa-aaa", "2026-11-12"));
  assert.deepEqual([r2.DongYNhanTin, r2.DongYDuAn, r2.DongYBangChung], ["Có", "aaa-aaa", seg("aaa-aaa", "2026-11-12")]);
  const r3 = merge(mk({ DongYNhanTin: "Có", DongYBangChung: MA, DongYDuAn: "aaa-aaa" }), mk({}));
  assert.equal(ctx.coTheNhan_(r3, "aaa-aaa"), false);
});

test("Task 2: một đoạn hỏng làm cả ô bằng chứng của bên đó bị bỏ (fail closed); bên kia vẫn dùng được", () => {
  const corrupt = seg("aaa-aaa", "2026-11-12") + " || zzz";
  const r = merge(mk({ DongYNhanTin: "Có", DongYBangChung: corrupt }), consent("bbb-bbb", "2026-11-12"));
  assert.deepEqual([r.DongYDuAn, r.DongYBangChung], ["bbb-bbb", seg("bbb-bbb", "2026-11-12")]);
});

test("Task 2: trangThaiDongY_ (trực tiếp)", () => {
  const t = (d, b, n) => ctx.trangThaiDongY_(d, b, n);
  const A = seg("aaa-aaa", "2026-11-12");
  assert.equal(t("aaa-aaa", A, ""), "Có");
  assert.equal(t("aaa-aaa", A, T10), "Có");
  assert.equal(t("", A, T10), "Đã rút lại", "DongYDuAn không liệt kê -> không Có");
  assert.equal(t("aaa-aaa", "", ""), "Chưa rõ", "không bằng chứng");
  assert.equal(t("aaa-aaa", "", T10), "Đã rút lại");
  assert.equal(t("aaa-aaa", seg("aaa-aaa", "2026-11-05"), T10), "Đã rút lại");
  assert.equal(t("bbb-bbb", A, ""), "Chưa rõ", "mã khác");
  assert.equal(t("aaa-aaa", MA, ""), "Chưa rõ", "không mã");
  assert.equal(t(undefined, undefined, undefined), "Chưa rõ");
});

test("Task 2: cùng một mã xuất hiện hai lần trong một ô -> giữ bản mới nhất, bất kể thứ tự", () => {
  for (const cell of [seg("aaa-aaa", "2026-11-05") + " || " + seg("aaa-aaa", "2026-11-08"), seg("aaa-aaa", "2026-11-08") + " || " + seg("aaa-aaa", "2026-11-05")]) {
    const r = merge(mk({ DongYNhanTin: "Có", DongYBangChung: cell }), mk({}));
    assert.equal(r.DongYBangChung, seg("aaa-aaa", "2026-11-08"));
    const w = merge(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: "2026-11-06T00:00:00.000Z", DongYBangChung: cell }), mk({}));
    assert.equal(w.DongYNhanTin, "Có", "bản mới 08/11 > ngày rút 06/11");
  }
});

// ---- Task 2 fix: cắt/giới hạn ô, ngày rút lại, bằng chứng tương lai ----
const consentRow = (ev) => plain(ctx.parseLandingRow_(HEADERS, landingRow({ "Đồng ý nhận tin": ev }))).rec;

test("fix A: parseLandingRow_ cắt phần trang của bằng chứng để mỗi đoạn lưu <= 200 ký tự, vẫn đúng khuôn", () => {
  const ev = "Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/" + "q".repeat(600) + ")";
  const r = consentRow(ev);
  assert.ok(r.DongYBangChung.length <= 200, String(r.DongYBangChung.length));
  assert.equal(r.DongYBangChung.length, 200, "cắt vừa đủ, không cắt thừa");
  assert.equal(r.DongYNhanTin, "Có");
  assert.equal(r.DongYDuAn, "bcons-newsky");
  const e = r.DongYBangChung.slice("bcons-newsky: ".length);
  assert.equal(ctx.hasConsentEvidence_(e), true);
  assert.equal(ctx.ngayDongY_(e), "2026-11-06T03:15:00.000Z");
  assert.equal(ctx.bangChungHopLe_(r.DongYBangChung), true);
  // bằng chứng ngắn giữ nguyên
  assert.equal(consentRow(CONSENT).DongYBangChung, "bcons-newsky: " + CONSENT);
  // trang rỗng sau khi cắt vẫn hợp lệ
  const long = "Có (2026-11-06T03:15:00.000Z, mẫu " + "v".repeat(100) + ", " + "q".repeat(300) + ")";
  const r2 = consentRow(long);
  assert.ok(r2.DongYBangChung.length <= 200);
  assert.equal(r2.DongYNhanTin, "Có");
  // phần đầu (ngày + phiên bản) đã vượt giới hạn: không thể cắt hợp lệ -> không đồng ý (fail closed)
  const r3 = consentRow("Có (2026-11-06T03:15:00.000Z, mẫu " + "v".repeat(300) + ", x)");
  assert.deepEqual([r3.DongYNhanTin, r3.DongYDuAn, r3.DongYBangChung], ["Chưa rõ", "", ""]);
});

test("fix A: cellDai_ giữ chặn công thức, giới hạn 45000, bỏ nguyên đoạn cũ nhất và không bao giờ cắt giữa đoạn", () => {
  assert.equal(ctx.cellDai_("=x"), "'=x");
  assert.equal(ctx.cellDai_("+x"), "'+x");
  assert.equal(ctx.cellDai_(null), "");
  const short = "a".repeat(1000);
  assert.equal(ctx.cellDai_(short), short, "không cắt ở 500");
  const segs = Array.from({ length: 300 }, (_, i) => `bcons-p${String(i).padStart(3, "0")}: ${"e".repeat(190)}`);
  const out = ctx.cellDai_(segs.join(" || "));
  assert.ok(out.length <= 45000);
  const parts = out.split(" || ");
  assert.ok(parts.length > 100 && parts.length < 300);
  assert.deepEqual(parts, segs.slice(300 - parts.length), "bỏ các đoạn đầu (cũ nhất), phần còn lại nguyên vẹn");
  assert.equal(ctx.cellDai_("x".repeat(46000)), "", "một đoạn quá dài: bỏ cả đoạn");
  assert.equal(ctx.cellDai_("a-b-c;".repeat(9000), ";").length <= 45000, true);
});

const CU = "2026-11-12T03:00:00.000Z";
test("fix B: 'Đã rút lại' không ngày -> đóng dấu NgayCapNhat của existing (không phải now), bằng chứng mới hơn vẫn ra Có", () => {
  const ex = mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: "", NgayCapNhat: CU });
  const evNew = "2026-11-12T03:30:00.000Z";
  const inc = mk({ DongYNhanTin: "Có", DongYDuAn: "aaa-aaa", DongYBangChung: `aaa-aaa: Có (${evNew}, mẫu v1, x)` });
  const r = plain(ctx.mergeCustomer_(ex, inc, "2026-11-12T03:30:05.000Z"));
  assert.deepEqual([r.DongYNhanTin, r.DongYDuAn, r.NgayRutLai], ["Có", "aaa-aaa", CU]);
  const r2 = plain(ctx.mergeCustomer_({ ...ex, NgayCapNhat: "" }, inc, "2026-11-12T03:30:05.000Z"));
  assert.deepEqual([r2.DongYNhanTin, r2.DongYDuAn, r2.NgayRutLai], ["Đã rút lại", "", "2026-11-12T03:30:05.000Z"], "không có NgayCapNhat -> now (bằng chứng 03:30:00 < now)");
  const r3 = plain(ctx.mergeCustomer_({ ...ex, NgayCapNhat: "rác" }, inc, "2026-11-12T03:30:05.000Z"));
  assert.equal(r3.NgayRutLai, "2026-11-12T03:30:05.000Z", "NgayCapNhat không hợp lệ -> nowIso");
  assert.equal(r3.DongYNhanTin, "Đã rút lại");
  // incoming 'Đã rút lại' cũng dùng NgayCapNhat của existing
  const r4 = plain(ctx.mergeCustomer_(mk({ NgayCapNhat: CU }), mk({ DongYNhanTin: "Đã rút lại" }), "2026-11-13T00:00:00.000Z"));
  assert.equal(r4.NgayRutLai, CU);
  // ô Date của Sheets
  const r5 = plain(ctx.mergeCustomer_(mk({ DongYNhanTin: "Đã rút lại", NgayCapNhat: new Date(CU) }), mk({}), "2026-11-13T00:00:00.000Z"));
  assert.equal(r5.NgayRutLai, CU);
});

test("fix C (đổi có chủ ý ở Review Task 4 C1): 'Không' gõ lại là lần rút mới -> NgayRutLai = now; chạy lại kết quả ('Đã rút lại') thì không đẩy ngày", () => {
  let cur = merge(mk({ DongYNhanTin: "Không", DongYDuAn: "aaa-aaa", DongYBangChung: seg("aaa-aaa", "2026-11-05") }), mk({}));
  assert.equal(cur.NgayRutLai, NOW);
  for (const n of ["2026-11-12T00:00:00.000Z", "2026-11-13T00:00:00.000Z", "2026-12-01T00:00:00.000Z"]) {
    const nx = plain(ctx.mergeCustomer_(cur, mk({ DongYNhanTin: "Không" }), n));
    const want = n > cur.NgayRutLai ? n : cur.NgayRutLai; // max, không bao giờ lùi
    assert.equal(nx.NgayRutLai, want);
    assert.equal(nx.DongYNhanTin, "Đã rút lại");
    const rerun = plain(ctx.mergeCustomer_(nx, mk({}), "2026-12-15T00:00:00.000Z"));
    assert.equal(rerun.NgayRutLai, want, "ô đã là 'Đã rút lại': không đẩy");
    cur = nx;
  }
  const same = plain(ctx.mergeCustomer_(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: T10 }), mk({ DongYNhanTin: "Không" }), "2026-11-20T00:00:00.000Z"));
  assert.equal(same.NgayRutLai, "2026-11-20T00:00:00.000Z", "'Không' gõ chồng lên 'Đã rút lại' vẫn là lần rút mới");
  // rút -> điền lại -> gõ Không
  const refilled = plain(ctx.mergeCustomer_(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: T10 }), consent("aaa-aaa", "2026-11-12"), "2026-11-12T10:00:00.000Z"));
  assert.equal(refilled.DongYNhanTin, "Có");
  const again = plain(ctx.mergeCustomer_({ ...refilled, DongYNhanTin: "Không" }, mk({}), "2026-11-15T00:00:00.000Z"));
  assert.deepEqual([again.DongYNhanTin, again.NgayRutLai, again.DongYDuAn], ["Đã rút lại", "2026-11-15T00:00:00.000Z", ""]);
  // 'Không' phía incoming cũng vậy
  const inc = plain(ctx.mergeCustomer_(refilled, mk({ DongYNhanTin: "Không" }), "2026-11-15T00:00:00.000Z"));
  assert.deepEqual([inc.DongYNhanTin, inc.NgayRutLai], ["Đã rút lại", "2026-11-15T00:00:00.000Z"]);
});

test("fix D: NgayRutLai là max các ngày hợp lệ của hai phía; phía nào có ngày rác thì đóng vĩnh viễn; dấu 'Không' không hạ ngày", () => {
  const a = plain(ctx.mergeCustomer_(mk({ NgayRutLai: T10, DongYNhanTin: "Đã rút lại" }), { ...consent("aaa-aaa", "2026-11-11"), NgayRutLai: "2026-11-15T00:00:00.000Z" }, "2026-11-16T00:00:00.000Z"));
  assert.equal(a.NgayRutLai, "2026-11-15T00:00:00.000Z");
  assert.notEqual(a.DongYNhanTin, "Có");
  assert.equal(a.DongYDuAn, "");
  const b = plain(ctx.mergeCustomer_(mk({ NgayRutLai: "2030-01-01T00:00:00.000Z", DongYNhanTin: "Không" }), mk({}), "2026-11-12T00:00:00.000Z"));
  assert.deepEqual([b.NgayRutLai, b.DongYNhanTin], ["2030-01-01T00:00:00.000Z", "Đã rút lại"]);
  for (const [x, y] of [[T10, "rác"], ["rác", T10], [new Date(T10), "mai"]]) {
    const g = plain(ctx.mergeCustomer_(mk({ NgayRutLai: x }), { ...consent("aaa-aaa", "2026-12-30"), NgayRutLai: y }, "2027-01-01T00:00:00.000Z"));
    assert.equal(g.DongYNhanTin, "Đã rút lại");
    assert.equal(g.DongYDuAn, "");
    assert.ok(!ctx.coTheNhan_(g, "aaa-aaa"));
  }
  const c = plain(ctx.mergeCustomer_(mk({}), { ...mk({}), NgayRutLai: "2026-11-09T00:00:00.000Z" }, NOW));
  assert.equal(c.NgayRutLai, "2026-11-09T00:00:00.000Z", "ngày rút chỉ có ở incoming vẫn được giữ");
});

test("fix E: bằng chứng ghi ngày quá now + 5 phút bị coi là không hợp lệ (sheet sửa tay)", () => {
  const now = "2026-11-12T03:00:00.000Z";
  const at = (iso) => plain(ctx.mergeCustomer_(mk({}), { ...mk({}), DongYNhanTin: "Có", DongYDuAn: "aaa-aaa", DongYBangChung: `aaa-aaa: Có (${iso}, mẫu v1, x)` }, now));
  for (const iso of ["2026-11-12T03:00:00.000Z", "2026-11-12T03:04:00.000Z", "2026-11-12T03:05:00.000Z"]) {
    assert.equal(at(iso).DongYNhanTin, "Có", iso);
  }
  for (const iso of ["2026-11-12T03:05:00.001Z", "2026-11-12T03:06:00.000Z", "2999-01-01T00:00:00.000Z"]) {
    const r = at(iso);
    assert.deepEqual([r.DongYNhanTin, r.DongYDuAn, r.DongYBangChung], ["Chưa rõ", "", ""], iso);
  }
  // bản tương lai không che bản hợp lệ của cùng dự án
  const both = plain(ctx.mergeCustomer_(mk({}), { ...mk({}), DongYBangChung: `aaa-aaa: Có (2999-01-01T00:00:00.000Z, mẫu v1, x) || aaa-aaa: Có (2026-11-12T02:00:00.000Z, mẫu v1, y)` }, now));
  assert.equal(both.DongYNhanTin, "Có");
  assert.match(both.DongYBangChung, /, y\)$/);
  // nowIso hỏng -> không bằng chứng nào được tin
  assert.equal(plain(ctx.mergeCustomer_(mk({}), consent("aaa-aaa", "2026-11-12"), "rác")).DongYNhanTin, "Chưa rõ");
});

test("fix C: 'Không' gõ khi bằng chứng mới hơn ngày rút nhưng nằm trong khoảng now + 5 phút -> vẫn rút (dấu không thấp hơn bằng chứng)", () => {
  const now = "2026-11-15T00:00:00.000Z";
  const ex = { ...mk({ DongYNhanTin: "Không", NgayRutLai: T10 }), DongYDuAn: "aaa-aaa", DongYBangChung: "aaa-aaa: Có (2026-11-15T00:02:00.000Z, mẫu v1, x)" };
  const r = plain(ctx.mergeCustomer_(ex, mk({}), now));
  assert.deepEqual([r.DongYNhanTin, r.DongYDuAn], ["Đã rút lại", ""]);
  assert.equal(r.NgayRutLai, "2026-11-15T00:02:00.000Z");
});

// ---- Task 3: tuChoiMap_ và decideDestinations_ mới (xoa / rutLai / dich / lyDo) ----
const T3_NOW = "2026-11-20T00:00:00.000Z";
const T3_P = "0981234567";
const T3_EV = "2026-11-12T03:15:00.000Z"; // evAt("2026-11-12") ghi đúng giờ này
const t3rec = (o = {}) => ({ SDT: T3_P, DuAnQuanTam: "bcons-sora;bcons-newsky", DongYNhanTin: "Chưa rõ", ...o });
const t3consent = (page = "bcons-sora", d = "2026-11-12") => ({ DongYNhanTin: "Có", DongYDuAn: page, DongYBangChung: page + ": " + evAt(d) });
const t3d = (rec, map, pc = PROJ) => plain(ctx.decideDestinations_(rec, map, pc, T3_NOW));
const entry = (loai, ngayGhi = "2026-11-10T00:00:00.000Z") => ({ [T3_P]: { loai, ngayGhi } });

test("Task3 (a): loại 'Rút lại' -> rutLai, dich vẫn đủ dự án (hồ sơ được giữ)", () => {
  assert.deepEqual(t3d(t3rec(), entry("Rút lại")), { xoa: false, rutLai: true, dich: ["bcons-sora", "bcons-newsky"], lyDo: "rutlai" });
});

test("Task3 (b): loại 'Xóa' -> xoa, dich rỗng; kết quả không còn chan/chua", () => {
  const d = t3d(t3rec(), entry("Xóa"));
  assert.deepEqual(d, { xoa: true, rutLai: false, dich: [], lyDo: "xoa" });
  assert.ok(!("chan" in d) && !("chua" in d));
});

test("Task3 (c): bằng chứng đồng ý mới hơn NgayGhi mở cả hai; bằng nhau KHÔNG mở; cũ hơn KHÔNG mở", () => {
  for (const loai of ["Rút lại", "Xóa"]) {
    const rec = t3rec(t3consent());
    const lifted = t3d(rec, entry(loai, "2026-11-12T03:14:59.999Z"));
    assert.equal(lifted.xoa, false, loai);
    assert.equal(lifted.rutLai, false, loai);
    assert.equal(lifted.lyDo, "", loai);
    assert.deepEqual(lifted.dich, ["bcons-sora", "bcons-newsky"], loai);
    for (const g of [T3_EV, "2026-11-12T03:15:00.001Z", "2026-11-13T00:00:00.000Z"]) {
      const blocked = t3d(rec, entry(loai, g));
      assert.equal(loai === "Xóa" ? blocked.xoa : blocked.rutLai, true, loai + g);
    }
  }
});

test("Task3 (c): bằng chứng ghi ngày ở tương lai (> now + 5 phút) không mở khóa; NgayGhi chưa biết ('') chặn mọi thứ", () => {
  const future = t3rec(t3consent("bcons-sora", "2026-12-30"));
  assert.equal(t3d(future, entry("Rút lại")).rutLai, true);
  assert.equal(t3d(future, entry("Xóa")).xoa, true);
  const unknown = t3rec(t3consent());
  assert.equal(t3d(unknown, entry("Rút lại", "")).rutLai, true);
  assert.equal(t3d(unknown, entry("Xóa", "")).xoa, true);
});

test("Task3 (c): bằng chứng của dự án không nằm trong DongYDuAn, hoặc bằng chứng hỏng, không mở khóa", () => {
  const notListed = t3rec({ DongYNhanTin: "Có", DongYDuAn: "bcons-newsky", DongYBangChung: "bcons-sora: " + evAt("2026-11-12") });
  assert.equal(t3d(notListed, entry("Rút lại")).rutLai, true);
  const junk = t3rec({ DongYNhanTin: "Có", DongYDuAn: "bcons-sora", DongYBangChung: "bcons-sora: zzz" });
  assert.equal(t3d(junk, entry("Xóa")).xoa, true);
  const legacy = t3rec({ DongYNhanTin: "Có", DongYDuAn: "bcons-sora", DongYBangChung: evAt("2026-11-12") }); // cũ, không mã
  assert.equal(t3d(legacy, entry("Rút lại")).rutLai, true);
});

test("Task3 (c): đồng ý mới cho dự án khác cũng mở (rút lại là cả khách, đồng ý mới là mở cho dự án đó)", () => {
  const r = t3d(t3rec(t3consent("bcons-newsky")), entry("Rút lại"));
  assert.equal(r.rutLai, false);
});

test("Task3 (i): gõ đúng 'Không' -> rutLai lyDo 'khong', dich vẫn đủ; 'Không rõ' không phải; 'Đã rút lại' không ngày -> rutLai", () => {
  const k = t3d(t3rec({ DongYNhanTin: "Không" }), {});
  assert.deepEqual(k, { xoa: false, rutLai: true, dich: ["bcons-sora", "bcons-newsky"], lyDo: "khong" });
  for (const v of ["không", "KHÔNG", " Khong ", "Không."]) assert.equal(t3d(t3rec({ DongYNhanTin: v }), {}).rutLai, true, v);
  for (const v of ["Không rõ", "Không biết", "Chưa rõ", "Có", ""]) {
    const r = t3d(t3rec({ DongYNhanTin: v }), {});
    assert.equal(r.rutLai, false, v);
    assert.equal(r.xoa, false, v);
    assert.equal(r.lyDo, "", v);
  }
  assert.equal(t3d(t3rec({ DongYNhanTin: "Đã rút lại" }), {}).rutLai, true);
});

test("Task3: 'Không' gõ tay không bị bằng chứng cũ trong hàng mở khóa; 'Đã rút lại' có NgayRutLai và bằng chứng mới hơn thì mở", () => {
  const typed = t3rec({ ...t3consent(), DongYNhanTin: "Không", NgayRutLai: "2026-11-01T00:00:00.000Z" });
  assert.equal(t3d(typed, {}).rutLai, true);
  const sys = t3rec({ ...t3consent(), DongYNhanTin: "Đã rút lại", NgayRutLai: "2026-11-01T00:00:00.000Z" });
  assert.equal(t3d(sys, {}).rutLai, false);
  const sysOld = t3rec({ ...t3consent(), DongYNhanTin: "Đã rút lại", NgayRutLai: "2026-11-15T00:00:00.000Z" });
  assert.equal(t3d(sysOld, {}).rutLai, true);
  const garbage = t3rec({ ...t3consent(), DongYNhanTin: "Đã rút lại", NgayRutLai: "mai" });
  assert.equal(t3d(garbage, {}).rutLai, true);
});

test("Task3 (j): DuAnQuanTam rỗng -> dich [], không cờ chua, không bị coi là rút lại/xóa", () => {
  const d = t3d(t3rec({ DuAnQuanTam: "" }), {});
  assert.deepEqual(d, { xoa: false, rutLai: false, dich: [], lyDo: "" });
  assert.deepEqual(t3d(t3rec({ DuAnQuanTam: "xyz-abc" }), {}), { xoa: false, rutLai: false, dich: [], lyDo: "" });
});

test("Task3: SĐT sai hoặc rỗng -> không xoa/rutLai theo bản đồ, dich []; vẫn ném lỗi với tuChoi dạng lạ", () => {
  assert.deepEqual(t3d({ SDT: "abc", DuAnQuanTam: "bcons-sora" }, entry("Xóa")), { xoa: false, rutLai: false, dich: [], lyDo: "" });
  for (const t of [123, true, () => 1]) assert.throws(() => ctx.decideDestinations_(t3rec(), t, PROJ, T3_NOW), /tuChoi/);
  for (const t of [123, true]) assert.throws(() => ctx.decideDestinations_({ SDT: "abc" }, t, PROJ, T3_NOW), /tuChoi/);
});

test("Task3: dạng cũ (mảng/Set/chuỗi SĐT) = rút lại chưa rõ ngày, chặn mọi thứ, không mở được; entry lạ trong bản đồ -> Rút lại", () => {
  for (const t of [[T3_P], new Set([T3_P]), T3_P, new Map([[T3_P, 1]]), { [T3_P]: true }]) {
    const r = t3d(t3rec(t3consent()), t);
    assert.equal(r.rutLai, true, String(t));
    assert.equal(r.xoa, false);
  }
  assert.equal(t3d(t3rec(), { [T3_P]: { loai: "lạ", ngayGhi: "" } }).rutLai, true);
  assert.equal(t3d(t3rec(), { [T3_P]: { loai: "xoa", ngayGhi: "" } }).xoa, true);
  assert.equal(t3d(t3rec(), { "+84 98 123 4567": { loai: "Xóa", ngayGhi: "2026-11-10T00:00:00.000Z" } }).xoa, true);
});

test("Task3: dich theo DuAnQuanTam y như cũ (thứ tự, cách viết cấu hình, trùng, mã lạ) và không sửa đầu vào", () => {
  assert.deepEqual(t3d(t3rec({ DuAnQuanTam: "xyz-abc;bcons-sora;BCONS-SORA;bcons-newsky" }), {}, ["Bcons-Sora", "bcons-newsky"]).dich, ["Bcons-Sora", "bcons-newsky"]);
  const rec = t3rec(), map = entry("Rút lại"), pc = PROJ.slice();
  const snap = JSON.stringify([rec, map, pc]);
  ctx.decideDestinations_(rec, map, pc, T3_NOW);
  assert.equal(JSON.stringify([rec, map, pc]), snap);
});

test("Task3 (d)(h)(k): tuChoiMap_ — loại trống/lạ -> Rút lại; 'Xóa' khớp sau gấp chữ; trùng SĐT Xóa thắng; mọi dạng SĐT", () => {
  const H = ["SDT", "LyDo", "NgayGhi", "LoaiYeuCau", "DaDongYLai"];
  const m = (rows) => plain(ctx.tuChoiMap_([H, ...rows]));
  const D = "2026-11-10T00:00:00.000Z";
  assert.deepEqual(m([["0981234567", "", D, "", ""]]), { "0981234567": [{ loai: "Rút lại", ngayGhi: D }] });
  for (const v of ["lạ", "Xoá luôn đi", "Xóa vĩnh viễn", "Rút lại", "rut lai", "?"]) assert.equal(m([["0981234567", "", D, v, ""]])["0981234567"][0].loai, "Rút lại", v);
  for (const v of ["Xóa", "XÓA", "xoa", " Xóa ", "Xóa".normalize("NFD"), "x-ó-a", "XOA​"]) assert.equal(m([["0981234567", "", D, v, ""]])["0981234567"][0].loai, "Xóa", v);
  // trùng SĐT: mỗi dòng giữ riêng (không gộp loại/ngày), theo thứ tự dòng
  const A = "2026-11-05T00:00:00.000Z", B = "2026-11-15T00:00:00.000Z";
  assert.deepEqual(m([["0981234567", "", A, "Xóa", ""], ["+84 98 123 4567", "", B, "Rút lại", ""]])["0981234567"], [{ loai: "Xóa", ngayGhi: A }, { loai: "Rút lại", ngayGhi: B }]);
  assert.deepEqual(m([["0981234567", "", B, "Rút lại", ""], [981234567, "", A, "Xóa", ""]])["0981234567"], [{ loai: "Rút lại", ngayGhi: B }, { loai: "Xóa", ngayGhi: A }]);
  // nhiều dạng SĐT cùng ra một khóa; không có khóa thừa
  const forms = ["+84 98 123 4567", 981234567, "98.123.4567", "(+84) 981 234 567"];
  for (const f of forms) assert.deepEqual(Object.keys(m([[f, "", D, "", ""]])), ["0981234567"], String(f));
});

test("Task3 (e): tuChoiMap_ — NgayGhi rác/trống = '' (chưa biết, không bao giờ 'rất cũ'); Date của Sheets đọc được; mỗi dòng giữ ngày riêng (dòng rác = chưa biết)", () => {
  const H = ["SDT", "LyDo", "NgayGhi", "LoaiYeuCau", "DaDongYLai"];
  const m = (rows) => plain(ctx.tuChoiMap_([H, ...rows]));
  for (const g of ["", "mai", "05-11-2026", "31/02/2026", "9999", "2026-13-45T00:00:00.000Z", null]) assert.equal(m([["0981234567", "", g, "", ""]])["0981234567"][0].ngayGhi, "", String(g));
  assert.equal(m([["0981234567", "", new Date("2026-11-10T00:00:00.000Z"), "", ""]])["0981234567"][0].ngayGhi, "2026-11-10T00:00:00.000Z");
  assert.deepEqual(m([["0981234567", "", "2026-11-10T00:00:00.000Z", "", ""], ["0981234567", "", "mai", "", ""]])["0981234567"].map((e) => e.ngayGhi), ["2026-11-10T00:00:00.000Z", ""]);
});

test("Task3: tuChoiMap_ — không có dòng tiêu đề thì theo thứ tự cột chuẩn; thiếu cột LoaiYeuCau (tab cũ) -> Rút lại; SĐT sai bị bỏ; đầu vào rác không ném", () => {
  const D = "2026-11-10T00:00:00.000Z";
  assert.deepEqual(plain(ctx.tuChoiMap_([["0981234567", "", D, "Xóa"]])), { "0981234567": [{ loai: "Xóa", ngayGhi: D }] });
  assert.deepEqual(plain(ctx.tuChoiMap_([["SDT", "LyDo", "NgayGhi"], ["0981234567", "x", D]])), { "0981234567": [{ loai: "Rút lại", ngayGhi: D }] });
  assert.deepEqual(plain(ctx.tuChoiMap_([["SDT", "LyDo", "NgayGhi"], ["abc", "", D], ["", "", D], [null, 5]])), {});
  assert.deepEqual(plain(ctx.tuChoiMap_(null)), {});
  assert.deepEqual(plain(ctx.tuChoiMap_([])), {});
  // cột đảo thứ tự: theo TÊN cột
  assert.deepEqual(plain(ctx.tuChoiMap_([["LoaiYeuCau", "NgayGhi", "SDT"], ["Xóa", D, "0981234567"]])), { "0981234567": [{ loai: "Xóa", ngayGhi: D }] });
});

// ---- Review Task 3: xét từng dòng TuChoi, ngày chỉ có ngày, loại lạ ----
const rowsOf = (...r) => ctx.tuChoiMap_([["SDT", "LyDo", "NgayGhi", "LoaiYeuCau"], ...r]);
const evT = (iso) => ({ DongYNhanTin: "Có", DongYDuAn: "bcons-sora", DongYBangChung: "bcons-sora: " + `Có (${iso}, mẫu v1-2026-11-06, https://x.pages.dev/)` });

test("Review 1: xét TỪNG dòng — Xóa 05/11 bị đồng ý 10/11 mở, Rút lại 12/11 còn hiệu lực -> rutLai (KHÔNG xoa), dich giữ", () => {
  const map = rowsOf([T3_P, "", "2026-11-05T00:00:00.000Z", "Xóa"], [T3_P, "", "2026-11-12T00:00:00.000Z", "Rút lại"]);
  const d = t3d(t3rec(evT("2026-11-10T03:00:00.000Z")), map);
  assert.deepEqual(d, { xoa: false, rutLai: true, dich: ["bcons-sora", "bcons-newsky"], lyDo: "rutlai" });
});

test("Review 1: Xóa cũ đã bị mở + Rút lại KHÔNG ngày -> rutLai; thứ tự dòng không đổi kết quả; cả hai còn hiệu lực -> Xóa thắng", () => {
  const rows = [[T3_P, "", "2026-11-05T00:00:00.000Z", "Xóa"], [T3_P, "", "", "Rút lại"]];
  for (const r of [rows, rows.slice().reverse()]) {
    assert.equal(t3d(t3rec(evT("2026-11-10T03:00:00.000Z")), rowsOf(...r)).rutLai, true);
    assert.equal(t3d(t3rec(evT("2026-11-10T03:00:00.000Z")), rowsOf(...r)).xoa, false);
    assert.equal(t3d(t3rec(), rowsOf(...r)).xoa, true);
  }
  assert.equal(t3d(t3rec(evT("2026-11-10T03:00:00.000Z")), rowsOf([T3_P, "", "2026-11-05T00:00:00.000Z", "Xóa"], [T3_P, "", "2026-11-12T00:00:00.000Z", "Xóa"])).xoa, true);
  assert.deepEqual(t3d(t3rec(evT("2026-11-13T03:00:00.000Z")), rowsOf([T3_P, "", "2026-11-05T00:00:00.000Z", "Xóa"], [T3_P, "", "2026-11-12T00:00:00.000Z", "Rút lại"])), { xoa: false, rutLai: false, dich: ["bcons-sora", "bcons-newsky"], lyDo: "" });
});

test("Review 2: ngayGhiNorm_ — 0 giờ VN (T17:00:00.000Z) là CUỐI ngày VN; chuỗi 'YYYY-MM-DD', 'DD/MM/YYYY' cũng vậy; dấu hệ thống giữ nguyên; ngày sai -> ''", () => {
  const n = (v) => ctx.ngayGhiNorm_(v);
  assert.equal(n("2026-11-10T17:00:00.000Z"), "2026-11-11T17:00:00.000Z");
  assert.equal(n(new Date("2026-11-10T17:00:00.000Z")), "2026-11-11T17:00:00.000Z");
  assert.equal(n("2026-11-11"), "2026-11-11T17:00:00.000Z");
  assert.equal(n("11/11/2026"), "2026-11-11T17:00:00.000Z");
  assert.equal(n("1/2/2026"), "2026-02-01T17:00:00.000Z");
  assert.equal(n("2026-11-11T01:00:00.000Z"), "2026-11-11T01:00:00.000Z");
  assert.equal(n("2026-11-10T00:00:00.000Z"), "2026-11-10T00:00:00.000Z");
  for (const bad of ["", "mai", "31/02/2026", "2026-13-01", "2026-02-30", null, undefined, "11-11-2026"]) assert.equal(n(bad), "", String(bad));
});

test("Review 2: NgayGhi chỉ có ngày — đồng ý CÙNG ngày VN (sớm hơn trong ngày) không mở; đồng ý ngày sau thì mở", () => {
  const sameDay = t3rec(evT("2026-11-11T01:00:00.000Z"));
  for (const cell of [new Date("2026-11-10T17:00:00.000Z"), "2026-11-11", "11/11/2026"]) {
    assert.equal(t3d(sameDay, rowsOf([T3_P, "", cell, "Rút lại"])).rutLai, true, String(cell));
    assert.equal(t3d(sameDay, rowsOf([T3_P, "", cell, "Xóa"])).xoa, true, String(cell));
    assert.equal(t3d(sameDay, rowsOf([T3_P, "", cell, "Xóa"])).rutLai, false);
  }
  const nextDay = t3rec(evT("2026-11-12T01:00:00.000Z"));
  assert.deepEqual(t3d(nextDay, rowsOf([T3_P, "", new Date("2026-11-10T17:00:00.000Z"), "Rút lại"])), { xoa: false, rutLai: false, dich: ["bcons-sora", "bcons-newsky"], lyDo: "" });
  assert.equal(t3d(sameDay, rowsOf([T3_P, "", "2026-11-11T00:30:00.000Z", "Rút lại"])).rutLai, false);
});

test("Review 5: loaiLa_ — chỉ chữ khác trống mà không phải Xóa/Rút lại; vẫn gấp về 'Rút lại'", () => {
  for (const v of ["Xóa dữ liệu", "xóa hết", "delete", "?", "Rút lại luôn"]) {
    assert.equal(ctx.loaiLa_(v), true, v);
    assert.equal(ctx.loaiYeuCau_(v), "Rút lại", v);
  }
  for (const v of ["", "  ", null, undefined, "Xóa", "XÓA", "xoa", "Rút lại", "rut lai", " RÚT LẠI "]) assert.equal(ctx.loaiLa_(v), false, String(v));
});

test("Review 6: tuChoiMap_ đầu vào không phải mảng thì ném lỗi; dòng không phải mảng cũng ném", () => {
  for (const bad of ["0981234567", 5, true, {}, new Set(["0981234567"])]) assert.throws(() => ctx.tuChoiMap_(bad), /tuChoi/, String(bad));
  assert.throws(() => ctx.tuChoiMap_([["SDT"], "0981234567"]), /tuChoi/);
});

test("Review 4: rutLaiTuChoi_ — ngày = mới nhất trong các dòng Rút lại còn hiệu lực; có dòng chưa biết ngày -> ''; Xóa còn hiệu lực -> không", () => {
  const f = (rec, map) => plain(ctx.rutLaiTuChoi_(rec, map, T3_NOW));
  const two = rowsOf([T3_P, "", "2026-11-05T00:00:00.000Z", "Rút lại"], [T3_P, "", "2026-11-12T00:00:00.000Z", "Rút lại"]);
  assert.deepEqual(f(t3rec(), two), { co: true, ngay: "2026-11-12T00:00:00.000Z" });
  assert.deepEqual(f(t3rec(evT("2026-11-10T03:00:00.000Z")), two), { co: true, ngay: "2026-11-12T00:00:00.000Z" });
  assert.deepEqual(f(t3rec(), rowsOf([T3_P, "", "", "Rút lại"], [T3_P, "", "2026-11-12T00:00:00.000Z", "Rút lại"])), { co: true, ngay: "" });
  assert.deepEqual(f(t3rec(), rowsOf([T3_P, "", "2026-11-12T00:00:00.000Z", "Xóa"])), { co: false, ngay: "" });
  assert.deepEqual(f(t3rec(), {}), { co: false, ngay: "" });
  assert.deepEqual(f(t3rec(evT("2026-11-13T03:00:00.000Z")), two), { co: false, ngay: "" });
});

// ---- Review Task 4 (C1): 'Không' là chữ chỉ anh gõ (hệ thống ghi 'Đã rút lại') nên mỗi lần thấy là một lần rút MỚI ----
test("C1 merge: 'Không' gõ (existing hoặc incoming) luôn đóng NgayRutLai = max(ngày hợp lệ hiện có, now, bằng chứng mới nhất); rút lại cũ không còn giữ ngày cũ", () => {
  const later = "2026-11-20T00:00:00.000Z";
  const a = plain(ctx.mergeCustomer_(mk({ DongYNhanTin: "Đã rút lại", NgayRutLai: T10 }), mk({ DongYNhanTin: "Không" }), later));
  assert.deepEqual([a.DongYNhanTin, a.NgayRutLai], ["Đã rút lại", later]);
  const b = plain(ctx.mergeCustomer_(mk({ DongYNhanTin: "Không", NgayRutLai: T10 }), mk({}), later));
  assert.deepEqual([b.DongYNhanTin, b.NgayRutLai], ["Đã rút lại", later]);
  // ngày rút trong tương lai xa không bị hạ
  const c = plain(ctx.mergeCustomer_(mk({ DongYNhanTin: "Không", NgayRutLai: "2030-01-01T00:00:00.000Z" }), mk({}), later));
  assert.equal(c.NgayRutLai, "2030-01-01T00:00:00.000Z");
  // chạy lại với kết quả (đã là 'Đã rút lại') thì không đẩy ngày
  const d = plain(ctx.mergeCustomer_(b, mk({}), "2026-11-25T00:00:00.000Z"));
  assert.equal(d.NgayRutLai, later);
});

test("C1 merge: một lượt có 'Không' + bằng chứng cũ phát lại + bằng chứng mới (<= now) -> 'Đã rút lại', NgayRutLai >= now; lượt sau không mở lại", () => {
  const now = "2026-11-11T02:00:00.000Z";
  const fresh = mk({ DongYNhanTin: "Có", DongYDuAn: "aaa-aaa", DongYBangChung: seg("aaa-aaa", "2026-11-11") }); // 03:15Z? evAt dùng giờ cố định
  const ex = mk({ DongYNhanTin: "Không", DongYDuAn: "aaa-aaa", DongYBangChung: seg("aaa-aaa", "2026-11-10"), NgayRutLai: T10 });
  const r1 = plain(ctx.mergeCustomer_(ex, fresh, "2026-11-11T12:00:00.000Z"));
  assert.equal(r1.DongYNhanTin, "Đã rút lại");
  assert.ok(r1.NgayRutLai >= "2026-11-11T12:00:00.000Z", r1.NgayRutLai);
  const r2 = plain(ctx.mergeCustomer_(r1, fresh, "2026-11-11T13:00:00.000Z"));
  assert.equal(r2.DongYNhanTin, "Đã rút lại");
  assert.equal(r2.NgayRutLai, r1.NgayRutLai);
  assert.ok(now);
});
