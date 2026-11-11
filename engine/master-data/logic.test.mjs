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
const NOW = "2026-11-11T02:00:00.000Z";
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

test("mergeCustomer_: Không thắng Có ở cả hai chiều; Chưa rõ + Chưa rõ không thành Có", () => {
  const co = mk({ DongYNhanTin: "Có", DongYBangChung: MA });
  const khong = mk({ DongYNhanTin: "Không", DongYBangChung: "Rút lại 2026-11-10" });
  for (const [a, b] of [[co, khong], [khong, co]]) {
    const r = merge(a, b);
    assert.equal(r.DongYNhanTin, "Không");
    assert.equal(r.DongYBangChung, "Rút lại 2026-11-10");
  }
  assert.equal(merge(mk({ DongYNhanTin: "Không" }), co).DongYBangChung, "");
  const cr = mk({ DongYNhanTin: "Chưa rõ" });
  const r = merge(cr, cr);
  assert.equal(r.DongYNhanTin, "Chưa rõ");
  assert.equal(r.DongYBangChung, "");
  assert.equal(merge(mk({}), mk({})).DongYNhanTin, "Chưa rõ");
  const up = merge(cr, co);
  assert.equal(up.DongYNhanTin, "Có");
  assert.equal(up.DongYBangChung, MA);
  const keep = merge(co, mk({ DongYNhanTin: "Có", DongYBangChung: "Có (khác)" }));
  assert.equal(keep.DongYBangChung, MA, "giữ bằng chứng cũ");
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

test("mergeCustomer_: không sửa đầu vào, kết quả đúng 17 khóa, đầu vào thiếu khóa vẫn chạy", () => {
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
  const good = mk({ DongYNhanTin: "Có", DongYBangChung: MA });
  const r1 = merge(mk({ DongYNhanTin: "Có", DongYBangChung: "" }), good);
  assert.equal(r1.DongYNhanTin, "Có");
  assert.equal(r1.DongYBangChung, MA);
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
  assert.deepEqual([r.DongYNhanTin, r.DongYBangChung], ["Không", ""]);
  r = merge(mk({ DongYNhanTin: "Có", DongYBangChung: MA }), E);
  assert.deepEqual([r.DongYNhanTin, r.DongYBangChung], ["Không", ""]);
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
    { chan: false, chua: false, dich: ["bcons-sora", "bcons-newsky"], lyDo: "" });
});

test("decideDestinations_: DuAnQuanTam rỗng → chưa phân dự án", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "" }, new Set()), { chan: false, chua: true, dich: [], lyDo: "" });
});

test("decideDestinations_: chỉ mã lạ → chưa; lẫn mã lạ → chỉ giữ mã biết", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "xyz-abc" }, []), { chan: false, chua: true, dich: [], lyDo: "" });
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "xyz-abc;bcons-sora" }, []), { chan: false, chua: false, dich: ["bcons-sora"], lyDo: "" });
});

test("decideDestinations_: trùng mã chỉ tính một lần", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora;bcons-sora" }).dich, ["bcons-sora"]);
});

test("decideDestinations_: SĐT trong TuChoi (Set, mảng, khác dạng) → chặn", () => {
  const rec = { SDT: "0981234567", DuAnQuanTam: "bcons-sora" };
  const want = { chan: true, chua: false, dich: [], lyDo: "tuchoi" };
  assert.deepEqual(decide(rec, new Set(["0981234567"])), want);
  assert.deepEqual(decide(rec, ["0981234567"]), want);
  assert.deepEqual(decide(rec, new Set(["+84 98 123 4567"])), want);
  assert.deepEqual(decide(rec, ["0912345678"]).chan, false);
});

test("decideDestinations_: DongYNhanTin 'Không' → chặn; 'Chưa rõ' không chặn", () => {
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora", DongYNhanTin: "Không" }, new Set()), { chan: true, chua: false, dich: [], lyDo: "khong" });
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora", DongYNhanTin: "Chưa rõ" }, new Set()), { chan: false, chua: false, dich: ["bcons-sora"], lyDo: "" });
});

test("decideDestinations_: tuChoi undefined, projectCodes rỗng, SĐT sai", () => {
  assert.equal(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora" }, undefined).chan, false);
  assert.deepEqual(decide({ SDT: "0981234567", DuAnQuanTam: "bcons-sora" }, undefined, []), { chan: false, chua: true, dich: [], lyDo: "" });
  assert.deepEqual(decide({ SDT: "abc", DuAnQuanTam: "bcons-sora" }, ["abc"]), { chan: false, chua: true, dich: [], lyDo: "" });
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
    assert.equal(r.chan, true, JSON.stringify(v));
    assert.equal(r.lyDo, "khong");
  }
  for (const v of ["Chưa rõ", "", "Có", undefined]) assert.equal(decide({ ...R, DongYNhanTin: v }, []).chan, false, String(v));
});

test("decideDestinations_: chỉ đúng 'Không' mới rút lại; 'Không rõ', 'Không biết' KHÔNG chặn (L1)", () => {
  for (const v of ["Không rõ", "không biết", "Khong ro", "Không chắc", "Không muốn nhận tin nhưng gọi được"]) {
    const r = decide({ ...R, DongYNhanTin: v }, []);
    assert.equal(r.chan, false, v);
    assert.equal(r.lyDo, "", v);
    assert.deepEqual(r.dich, ["bcons-sora"], v);
  }
});

test("dongYKieu_: khong (đúng) / la (bắt đầu bằng khong nhưng không đúng) / rỗng", () => {
  for (const v of ["Không", "KHÔNG", "khong", " Không. ", "Không".normalize("NFD"), "Không\u200b"]) assert.equal(ctx.dongYKieu_(v), "khong", JSON.stringify(v));
  for (const v of ["Không rõ", "Không biết", "khong chac"]) assert.equal(ctx.dongYKieu_(v), "la", v);
  for (const v of ["Có", "Chưa rõ", "", null, undefined, "Biết rồi"]) assert.equal(ctx.dongYKieu_(v), "", String(v));
});

test("decideDestinations_: tuChoi mọi dạng đều chặn", () => {
  const P = "0981234567";
  for (const t of [[P], new Set([P]), new Map([[P, 1]]), { [P]: true }, P, `0912345678\n${P}`, `0912345678, ${P}`, `0912345678;${P}`, `0912345678 ${P}`]) {
    assert.equal(decide(R, t).chan, true, JSON.stringify([...(t instanceof Set ? t : [])]) + String(t));
    assert.equal(decide(R, t).lyDo, "tuchoi");
  }
  assert.equal(decide(R, null).chan, false);
  assert.equal(decide(R, "").chan, false);
});

test("decideDestinations_: tuChoi dạng lạ thì ném lỗi", () => {
  for (const t of [123, true, () => 1]) assert.throws(() => ctx.decideDestinations_(R, t, PROJ), /tuChoi/);
});

test("decideDestinations_: phần tử rác trong tuChoi bị bỏ qua, không chặn tất cả", () => {
  assert.equal(decide(R, [null, "", {}, NaN, undefined, "abc"]).chan, false);
  assert.equal(decide(R, new Set([null, "", NaN])).chan, false);
  assert.equal(decide(R, [null, "0981234567"]).chan, true);
});

test("decideDestinations_: projectCodes không phải mảng → không ném, chua", () => {
  for (const pc of ["bcons-sora", { a: 1 }, new Set(["bcons-sora"]), null, undefined]) {
    assert.deepEqual(plain(ctx.decideDestinations_(R, [], pc)), { chan: false, chua: true, dich: [], lyDo: "" });
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

test("decideDestinations_ (chuyển tiếp Task 1): 'Đã rút lại' bị chặn như 'Không' (fail closed)", () => {
  const d = plain(ctx.decideDestinations_({ SDT: "0981234567", DongYNhanTin: "Đã rút lại", DuAnQuanTam: "bcons-newsky" }, [], ["bcons-newsky"]));
  assert.equal(d.chan, true);
  assert.deepEqual(d.dich, []);
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
