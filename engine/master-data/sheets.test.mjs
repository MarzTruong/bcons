import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGs, plain, fakeSheets } from "./helpers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const LOGIC = path.join(here, "apps-script", "Logic.gs");
const SHEETS = path.join(here, "apps-script", "Sheets.gs");
const landing = loadGs([path.join(here, "..", "landing", "apps-script", "Code.gs")]);
const HEADERS = plain(landing.HEADERS);
const KHACH_COLS = ["MaKhach", "SDT", "HoTen", "NgayTao", "NgayCapNhat", "NguonGoc", "NguonChiTiet", "DuAnQuanTam", "NhuCau", "CanXem", "PTTT", "DongYNhanTin", "DongYBangChung", "TrangThaiCRM", "TrangThaiChamSoc", "NguoiChamSoc", "GhiChu", "DongYDuAn", "NgayRutLai"];
const CAU_HINH = ["maDuAn", "landingSheetId", "masterSheetId"];
const NOW = new Date("2026-11-11T01:00:00.000Z");

// Dữ liệu ẩn danh: tên "Khach ...", số 090000000x.
const NAMES = ["Khach Cu", "Khach Moi", "Khach Loi", "Khach Hai"];
const PHONES = ["0900000001", "0900000002", "0900000003", "0900000004"];

/** Dòng landing đúng như Code.gs thật ghi (validateLead_ + rowFor_), rồi bỏ dấu ' ở SĐT như Sheets trả về. */
function leadRow({ ten, sdt, duAn = "bcons-newsky", at = new Date("2026-11-10T03:00:00.000Z"), badPhone, trang = "https://x.pages.dev/" }) {
  const v = landing.validateLead_({ ten, sdt, dongY: true, t: 5000, nguon: "facebook", duAn, trang, nhuCau: "Mua để ở", canLoai: "2PN-2WC", pttt: "PTTT 03" });
  assert.equal(v.ok, true);
  const row = Array.from(landing.rowFor_(v.lead, at));
  row[1] = String(row[1]).replace(/^'/, "");
  row[2] = badPhone !== undefined ? badPhone : String(row[2]).replace(/^'/, "");
  return row;
}
function existingCustomer() {
  const r = Object.fromEntries(KHACH_COLS.map((c) => [c, ""]));
  Object.assign(r, { MaKhach: "KH-000001", SDT: PHONES[0], HoTen: NAMES[0], NgayTao: "2026-10-01T00:00:00.000Z", NgayCapNhat: "2026-10-01T00:00:00.000Z", NguonGoc: "CRM", DuAnQuanTam: "bcons-central-park", DongYNhanTin: "Chưa rõ", TrangThaiCRM: "Đã gọi" });
  return KHACH_COLS.map((c) => r[c]);
}
function setup({ landingRows, cauHinh, extraById = {}, masterExtra = {}, withKhach = true } = {}) {
  const spec = {
    master: {
      CauHinh: cauHinh || [CAU_HINH, ["bcons-newsky", "L1", "M1"]],
      ...(withKhach ? { KhachHang: [KHACH_COLS, existingCustomer()] } : {}),
      ...masterExtra,
    },
    byId: { L1: { Landing: [HEADERS, ...(landingRows || [])] }, ...extraById },
  };
  const F = fakeSheets(spec);
  const ctx = loadGs([LOGIC, SHEETS]);
  const logs = [];
  ctx.Logger = { log: (...a) => logs.push(a.join(" ")) };
  Object.assign(ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService, PropertiesService: F.PropertiesService, UrlFetchApp: F.UrlFetchApp, ScriptApp: F.ScriptApp });
  return { F, ctx, logs };
}
const threeRows = () => [leadRow({ ten: NAMES[1], sdt: PHONES[1] }), leadRow({ ten: "Ten Khac", sdt: PHONES[0], duAn: "bcons-newsky" }), leadRow({ ten: NAMES[2], sdt: PHONES[2], badPhone: "12345" })];
function assertNoLeak({ F, logs }) {
  const all = JSON.stringify(F.calls.fetch) + logs.join("\n");
  for (const s of [...NAMES, ...PHONES, "Ten Khac"]) assert.ok(!all.includes(s), "rò rỉ: " + s);
}

test("TAB_HEADERS_: đúng sáu tab (không còn ChuaPhanDuAn), KhachHang = KHACH_COLS", () => {
  const { ctx } = setup();
  const t = plain(ctx.TAB_HEADERS_);
  assert.deepEqual(Object.keys(t).sort(), ["CauHinh", "KhachHang", "Loi", "NhapCRM", "NhatKy", "TuChoi"]);
  assert.deepEqual(t.KhachHang, KHACH_COLS);
  assert.deepEqual(t.NhapCRM, ["HoTen", "SDT", "DuAnQuanTam", "TrangThaiCRM", "DaGop"]);
  assert.deepEqual(t.Loi, ["Thời gian", "Nguồn", "Dòng", "Lý do"]);
  assert.deepEqual(t.TuChoi, ["SDT", "LyDo", "NgayGhi", "LoaiYeuCau", "DaDongYLai"]);
  assert.deepEqual(t.NhatKy, ["Thời gian", "Nguồn", "Số dòng đọc", "Khách mới", "Gộp trùng", "Lỗi", "Ghi chú"]);
  assert.deepEqual(t.CauHinh, CAU_HINH);
});

test("nextMaKhach_: max + 1, đệm 6 chữ số, bỏ qua giá trị rác", () => {
  const { ctx } = setup();
  assert.equal(ctx.nextMaKhach_([]), "KH-000001");
  assert.equal(ctx.nextMaKhach_(["KH-000001", "KH-000009", "KH-000003"]), "KH-000010");
  assert.equal(ctx.nextMaKhach_(["", null, "abc", "KH-", "KH-12x", "LOI", "KH-000002", 5]), "KH-000003");
  assert.equal(ctx.nextMaKhach_(["KH-999999"]), "KH-1000000");
});

test("ensureTabs_: tạo tab thiếu với tiêu đề, đặt cột SĐT là văn bản; dryRun không tạo gì", () => {
  const { F, ctx } = setup();
  const before = F.snapshot();
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), true);
  assert.equal(F.snapshot(), before);
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
  for (const n of ["KhachHang", "NhapCRM", "Loi", "TuChoi", "NhatKy", "CauHinh"]) assert.ok(F.values(null, n), n);
  assert.equal(F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
  assert.deepEqual(F.values(null, "Loi"), [["Thời gian", "Nguồn", "Dòng", "Lý do"]]);
  // tab có sẵn giữ nguyên dữ liệu
  assert.equal(F.values(null, "KhachHang").length, 2);
  // SĐT là văn bản: ghi chuỗi có số 0 đầu vào cột SĐT các tab đó thì đọc lại vẫn là chuỗi
  for (const [tab, col] of [["KhachHang", 2], ["NhapCRM", 2], ["TuChoi", 1]]) {
    const sh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
    sh.getRange(5, col, 1, 1).setValues([["0900000009"]]);
    assert.equal(sh.getRange(5, col, 1, 1).getValues()[0][0], "0900000009", tab);
  }
});

test("fake: ô không định dạng văn bản làm mất số 0 đầu (quirk Sheets), nên '@' là bắt buộc", () => {
  const { F } = setup();
  const sh = F.SpreadsheetApp.getActiveSpreadsheet().insertSheet("Thu");
  sh.getRange(1, 1, 1, 1).setValues([["0900000009"]]);
  assert.equal(sh.getRange(1, 1, 1, 1).getValues()[0][0], 900000009);
});

test("gopLanding_: 1 mới, 1 trùng SĐT, 1 SĐT sai", () => {
  const T = setup({ landingRows: threeRows() });
  const { F, ctx } = T;
  const r = plain(ctx.gopLanding_({ dryRun: false, now: NOW }));
  assert.deepEqual(r, { doc: 3, moi: 1, trung: 1, loi: 1 });
  const kh = F.values(null, "KhachHang");
  assert.equal(kh.length, 3);
  const col = (n) => kh[0].indexOf(n);
  assert.equal(kh[1][col("MaKhach")], "KH-000001");
  assert.equal(kh[1][col("HoTen")], NAMES[0], "giữ tên cũ của khách đã có");
  assert.equal(kh[1][col("NguonGoc")], "Landing+CRM");
  assert.equal(kh[1][col("TrangThaiCRM")], "Đã gọi");
  assert.equal(kh[1][col("NgayCapNhat")], NOW.toISOString());
  assert.equal(kh[2][col("MaKhach")], "KH-000002");
  assert.equal(kh[2][col("SDT")], PHONES[1]);
  assert.equal(kh[2][col("HoTen")], NAMES[1]);
  assert.equal(kh[2][col("NgayTao")], "2026-11-10T03:00:00.000Z");
  assert.equal(kh[2][col("NgayCapNhat")], NOW.toISOString());
  assert.equal(kh[2][col("NguonGoc")], "Landing");
  assert.equal(kh[2][col("DuAnQuanTam")], "bcons-newsky");
  assert.equal(kh[2][col("DongYNhanTin")], "Có");
  const loi = F.values(null, "Loi");
  assert.deepEqual(loi, [["Thời gian", "Nguồn", "Dòng", "Lý do"], [NOW.toISOString(), "Landing", 4, "SĐT không hợp lệ"]]);
  const ld = F.values("L1", "Landing");
  const iGop = HEADERS.indexOf("Đã gộp");
  assert.deepEqual([ld[1][iGop], ld[2][iGop], ld[3][iGop]], ["KH-000002", "KH-000001", "LOI"]);
  assert.deepEqual(T.F.calls.lock, ["wait", "release"]);
  assertNoLeak(T);
});

test("gopLanding_: chạy lần hai không làm gì", () => {
  const T = setup({ landingRows: threeRows() });
  T.ctx.gopLanding_({ dryRun: false, now: NOW });
  const after1 = T.F.snapshot();
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 0, moi: 0, trung: 0, loi: 0 });
  assert.equal(T.F.snapshot(), after1);
});

test("gopLanding_: dryRun cùng số đếm nhưng không ghi gì (kể cả tab, ô, định dạng)", () => {
  const T = setup({ landingRows: threeRows() });
  const before = T.F.snapshot();
  const r = plain(T.ctx.gopLanding_({ dryRun: true, now: NOW }));
  assert.deepEqual(r, { doc: 3, moi: 1, trung: 1, loi: 1 });
  assert.equal(T.F.snapshot(), before);
  assert.equal(T.F.calls.writes.length, 0);
  assert.equal(T.F.values(null, "Loi"), null);
  assertNoLeak(T);
});

test("gopLanding_: dryRun khi chưa có tab KhachHang coi như rỗng", () => {
  const T = setup({ landingRows: threeRows(), withKhach: false });
  const before = T.F.snapshot();
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: true, now: NOW })), { doc: 3, moi: 2, trung: 0, loi: 1 });
  assert.equal(T.F.snapshot(), before);
});

test("gopLanding_: chết sau khi ghi KhachHang, trước khi đánh dấu; chạy lại không nhân đôi, MaKhach liên tục", () => {
  const rows = [leadRow({ ten: NAMES[1], sdt: PHONES[1] }), leadRow({ ten: NAMES[3], sdt: PHONES[3] })];
  const T = setup({ landingRows: rows });
  let thrown = 0;
  T.F.hooks.onWrite = (w) => {
    if (w.owner === "L1" && w.method === "setValues" && /^KH-/.test(String(w.values[0][0])) && thrown === 0) {
      thrown++;
      throw new Error("chết giả lập");
    }
  };
  assert.throws(() => T.ctx.gopLanding_({ dryRun: false, now: NOW }), /chết giả lập/);
  assert.deepEqual(T.F.calls.lock, ["wait", "release"], "khóa luôn được nhả");
  assert.equal(T.F.values(null, "KhachHang").length, 4, "khách đã ghi trước khi đánh dấu");
  const r = plain(T.ctx.gopLanding_({ dryRun: false, now: NOW }));
  assert.deepEqual(r, { doc: 2, moi: 0, trung: 2, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 4);
  assert.deepEqual(kh.slice(1).map((x) => x[0]), ["KH-000001", "KH-000002", "KH-000003"]);
  assert.deepEqual(kh.slice(1).map((x) => x[1]), [PHONES[0], PHONES[1], PHONES[3]]);
  const ld = T.F.values("L1", "Landing");
  const iGop = HEADERS.indexOf("Đã gộp");
  assert.deepEqual([ld[1][iGop], ld[2][iGop]], ["KH-000002", "KH-000003"]);
  assertNoLeak(T);
});

test("gopLanding_: hai dự án dùng chung một landingSheetId thì chỉ đọc một lần", () => {
  const T = setup({
    landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] })],
    cauHinh: [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["bcons-central-park", "L1", "M2"], ["bcons-x", "", "M3"]],
  });
  const r = plain(T.ctx.gopLanding_({ dryRun: false, now: NOW }));
  assert.deepEqual(r, { doc: 1, moi: 1, trung: 0, loi: 0 });
  assert.deepEqual(T.F.calls.openById, ["L1"]);
});

test("gopLanding_: nhiều Sheet landing khác nhau, MaKhach không trùng giữa các Sheet", () => {
  const T = setup({
    landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] })],
    cauHinh: [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["bcons-central-park", "L2", "M2"]],
    extraById: { L2: { Landing: [HEADERS, leadRow({ ten: NAMES[3], sdt: PHONES[3] })] } },
  });
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 2, moi: 2, trung: 0, loi: 0 });
  assert.deepEqual(T.F.values(null, "KhachHang").slice(1).map((x) => x[0]), ["KH-000001", "KH-000002", "KH-000003"]);
});

test("gopLanding_: dòng landing cũ 17 cột (tiêu đề đã sửa thành 19) vẫn gộp được", () => {
  const old = leadRow({ ten: NAMES[1], sdt: PHONES[1] }).slice(0, 17);
  assert.equal(old.length, 17);
  const T = setup({ landingRows: [old] });
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 1, moi: 1, trung: 0, loi: 0 });
  const ld = T.F.values("L1", "Landing");
  assert.equal(ld[1][HEADERS.indexOf("Đã gộp")], "KH-000002");
  assert.equal(T.F.values(null, "KhachHang")[2][KHACH_COLS.indexOf("DuAnQuanTam")], "");
});

test("gopLanding_: SĐT lưu dạng chuỗi giữ số 0 đầu, qua getValues vẫn là chuỗi", () => {
  const T = setup({ landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] })] });
  T.ctx.gopLanding_({ dryRun: false, now: NOW });
  const v = T.F.values(null, "KhachHang")[2][1];
  assert.strictEqual(v, "0900000002");
  assert.ok(!v.startsWith("'"));
});

test("gopLanding_: SĐT landing bị Sheets đổi thành số (mất số 0) vẫn gộp đúng", () => {
  const row = leadRow({ ten: NAMES[1], sdt: PHONES[1] });
  row[2] = 900000002;
  const T = setup({ landingRows: [row] });
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 1, moi: 1, trung: 0, loi: 0 });
  assert.strictEqual(T.F.values(null, "KhachHang")[2][1], "0900000002");
});

test("gopLanding_: tên bắt đầu bằng = không thành công thức", () => {
  const T = setup({ landingRows: [leadRow({ ten: "=HYPERLINK(1)", sdt: PHONES[1] })] });
  T.ctx.gopLanding_({ dryRun: false, now: NOW });
  assert.equal(T.F.values(null, "KhachHang")[2][KHACH_COLS.indexOf("HoTen")], "'=HYPERLINK(1)");
});

test("gopLanding_: waitLock ném lỗi -> ném lỗi và không ghi gì", () => {
  const T = setup({ landingRows: threeRows() });
  const before = T.F.snapshot();
  T.F.hooks.waitLockError = true;
  assert.throws(() => T.ctx.gopLanding_({ dryRun: false, now: NOW }), /khóa/);
  assert.equal(T.F.snapshot(), before);
  assert.equal(T.F.calls.writes.length, 0);
  assert.deepEqual(T.F.calls.lock, ["wait"]);
});

test("gopLanding_: thiếu tab CauHinh -> lỗi tiếng Việt rõ ràng, không ghi gì", () => {
  const T = setup({ landingRows: threeRows() });
  const spec = { master: { KhachHang: [KHACH_COLS] }, byId: {} };
  const F = fakeSheets(spec);
  Object.assign(T.ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService });
  assert.throws(() => T.ctx.gopLanding_({ dryRun: false, now: NOW }), /Thiếu tab CauHinh/);
  assert.equal(F.calls.writes.length, 0);
  assert.deepEqual(F.calls.lock, ["wait", "release"]);
});

test("gopLanding_: Sheet landing thiếu cột 'Đã gộp' -> lỗi, không ghi gì", () => {
  const hdr = HEADERS.slice(0, 18);
  const T = setup({ landingRows: [], extraById: { L1: { Landing: [hdr, leadRow({ ten: NAMES[1], sdt: PHONES[1] }).slice(0, 18)] } } });
  const before = T.F.snapshot();
  assert.throws(() => T.ctx.gopLanding_({ dryRun: false, now: NOW }), /Thiếu cột Đã gộp/);
  assert.equal(T.F.snapshot(), before);
});

test("gopLanding_: dòng trống hoàn toàn không tính", () => {
  const T = setup({ landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] }), HEADERS.map(() => ""), HEADERS.map(() => "  ")] });
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 1, moi: 1, trung: 0, loi: 0 });
});

test("gopLanding_: hai dòng cùng một SĐT mới trong một lần chạy -> 1 mới, 1 trùng, một dòng KhachHang, cùng MaKhach", () => {
  const T = setup({ landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] }), leadRow({ ten: NAMES[3], sdt: PHONES[1], duAn: "bcons-central-park" })] });
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 2, moi: 1, trung: 1, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 3);
  assert.equal(kh[2][KHACH_COLS.indexOf("HoTen")], NAMES[1]);
  assert.equal(kh[2][KHACH_COLS.indexOf("DuAnQuanTam")], "bcons-newsky;bcons-central-park");
  const ld = T.F.values("L1", "Landing");
  const iGop = HEADERS.indexOf("Đã gộp");
  assert.deepEqual([ld[1][iGop], ld[2][iGop]], ["KH-000002", "KH-000002"]);
  // dryRun cho cùng số đếm
  const D = setup({ landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] }), leadRow({ ten: NAMES[3], sdt: PHONES[1] })] });
  assert.deepEqual(plain(D.ctx.gopLanding_({ dryRun: true, now: NOW })), { doc: 2, moi: 1, trung: 1, loi: 0 });
});

test("gopLanding_: 200 khách mới chỉ tốn số lần ghi hằng số (không tỉ lệ theo số dòng)", () => {
  const rows = [];
  for (let i = 0; i < 200; i++) rows.push(leadRow({ ten: "Khach " + i, sdt: "09123" + String(10000 + i) }));
  rows.push(leadRow({ ten: "Khach Xau", sdt: PHONES[2], badPhone: "12345" }));
  const T = setup({ landingRows: rows });
  T.ctx.ensureTabs_(T.F.SpreadsheetApp.getActiveSpreadsheet(), false);
  T.F.calls.writes.length = 0;
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 201, moi: 200, trung: 0, loi: 1 });
  assert.ok(T.F.calls.writes.length <= 12, "số lần ghi: " + T.F.calls.writes.length);
  assert.equal(T.F.values(null, "KhachHang").length, 202);
  assert.equal(T.F.values(null, "Loi").length, 2);
  const marks = T.F.values("L1", "Landing").slice(1).map((r) => r[HEADERS.indexOf("Đã gộp")]);
  assert.equal(marks.filter((m) => /^KH-/.test(m)).length, 200);
  assert.equal(marks[200], "LOI");
});

test("gopLanding_: gộp khách có sẵn chỉ ghi ô KHACH_COLS thật sự đổi; cột thêm bên phải của anh không bị đụng", () => {
  const ex = existingCustomer();
  const T = setup({ landingRows: [leadRow({ ten: "Ten Khac", sdt: PHONES[0] })] });
  T.ctx.ensureTabs_(T.F.SpreadsheetApp.getActiveSpreadsheet(), false);
  // thêm cột riêng của anh (ngay sau KHACH_COLS) vào tab KhachHang
  const sh = T.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  sh.getRange(1, KHACH_COLS.length + 1, 2, 2).setValues([["Anh1", "Anh2"], ["=A2&B2", "ghi chú"]]);
  T.F.calls.writes.length = 0;
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 1, moi: 0, trung: 1, loi: 0 });
  const khWrites = T.F.calls.writes.filter((w) => w.owner === "MASTER" && w.sheet === "KhachHang" && w.method === "setValues");
  assert.ok(khWrites.length >= 1);
  for (const w of khWrites) assert.ok(w.col + w.nc - 1 <= KHACH_COLS.length, "ghi vào cột ngoài KHACH_COLS: " + JSON.stringify(w));
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh[1][KHACH_COLS.indexOf("NgayCapNhat")], NOW.toISOString());
  assert.equal(kh[1][KHACH_COLS.length], "=A2&B2");
  // không ô nào khác ngoài NguonGoc/DongYNhanTin... bị ghi vô cớ: HoTen, MaKhach, SDT không nằm trong vùng ghi
  for (const col of [1, 2, 3]) assert.ok(!khWrites.some((w) => col >= w.col && col < w.col + w.nc), "cột " + col + " bị ghi");
  assert.ok(ex.length === KHACH_COLS.length);
});

test("gopLanding_: NgayTao/NgayCapNhat đọc về là Date (Sheets đổi chuỗi ISO) vẫn gộp bình thường", () => {
  const T = setup({ landingRows: [leadRow({ ten: "Ten Khac", sdt: PHONES[0] }), leadRow({ ten: NAMES[1], sdt: PHONES[1] })] });
  T.ctx.gopLanding_({ dryRun: false, now: NOW });
  const raw = T.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang").getRange(3, 4, 1, 2).getValues()[0];
  assert.ok(Object.prototype.toString.call(raw[0]) === "[object Date]" && Object.prototype.toString.call(raw[1]) === "[object Date]");
  // lần hai: landing mới trùng khách đã có ngày dạng Date
  const sh = T.F.SpreadsheetApp.getActiveSpreadsheet();
  const L = T.F.SpreadsheetApp.openById("L1").getSheetByName("Landing");
  L.appendRow(leadRow({ ten: "Ten Khac Nua", sdt: PHONES[1] }));
  const NOW2 = new Date("2026-11-12T01:00:00.000Z");
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW2 })), { doc: 1, moi: 0, trung: 1, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh[2][KHACH_COLS.indexOf("NgayTao")], "2026-11-10T03:00:00.000Z");
  assert.equal(kh[2][KHACH_COLS.indexOf("NgayCapNhat")], NOW2.toISOString());
  assert.equal(kh[2][KHACH_COLS.indexOf("HoTen")], NAMES[1]);
  assert.ok(sh);
});

test("gopLanding_: dòng mới nằm ngoài vùng đã định dạng vẫn giữ số 0 đầu (SĐT 11 số)", () => {
  const filler = [];
  for (let i = 0; i < 1200; i++) {
    const r = KHACH_COLS.map(() => "");
    r[0] = "KH-" + String(i + 2).padStart(6, "0");
    filler.push(r);
  }
  const T = setup({ landingRows: [leadRow({ ten: NAMES[1], sdt: "02838123456" })] });
  const spec2 = fakeSheets({ master: { CauHinh: [CAU_HINH, ["bcons-newsky", "L1", "M1"]], KhachHang: [KHACH_COLS, existingCustomer(), ...filler] }, byId: { L1: { Landing: [HEADERS, leadRow({ ten: NAMES[1], sdt: "02838123456" })] } } });
  Object.assign(T.ctx, { SpreadsheetApp: spec2.SpreadsheetApp, LockService: spec2.LockService });
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 1, moi: 1, trung: 0, loi: 0 });
  const kh = spec2.values(null, "KhachHang");
  assert.equal(kh.length, 1202 + 1);
  assert.strictEqual(kh[1202][1], "02838123456");
  assert.equal(kh[1202][0], "KH-001202");
});

test("gopLanding_: thiếu tab Landing -> lỗi nêu landingSheetId", () => {
  const T = setup({ landingRows: [], extraById: { L1: { Khac: [["x"]] } } });
  assert.throws(() => T.ctx.gopLanding_({ dryRun: false, now: NOW }), /L1/);
});

// ---- gopNhapCRM_ ----
const CRM_H = ["HoTen", "SDT", "DuAnQuanTam", "TrangThaiCRM", "DaGop"];
function setupCrm(crmRows, opts = {}) {
  return setup({ landingRows: opts.landingRows || [], masterExtra: { NhapCRM: [CRM_H, ...crmRows], ...(opts.masterExtra || {}) }, withKhach: opts.withKhach });
}
const khCol = (kh, n) => kh[0].indexOf(n);

test("gopNhapCRM_: khách CRM mới -> KhachHang NguonGoc CRM, Chưa rõ, không bằng chứng, DaGop = MaKhach", () => {
  const T = setupCrm([["Khach Moi", "0900000002", "bcons-central-park", "Đã gọi", ""]]);
  const r = plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW }));
  assert.deepEqual(r, { doc: 1, moi: 1, trung: 0, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 3);
  const row = kh[2];
  assert.equal(row[khCol(kh, "MaKhach")], "KH-000002");
  assert.equal(row[khCol(kh, "SDT")], "0900000002");
  assert.equal(row[khCol(kh, "NguonGoc")], "CRM");
  assert.equal(row[khCol(kh, "DongYNhanTin")], "Chưa rõ");
  assert.equal(row[khCol(kh, "DongYBangChung")], "");
  assert.equal(row[khCol(kh, "TrangThaiCRM")], "Đã gọi");
  assert.equal(row[khCol(kh, "DuAnQuanTam")], "bcons-central-park");
  assert.equal(row[khCol(kh, "NgayTao")], NOW.toISOString());
  assert.equal(T.F.values(null, "NhapCRM")[1][4], "KH-000002");
  assert.deepEqual(T.F.calls.lock, ["wait", "release"]);
  assertNoLeak(T);
});

test("gopNhapCRM_: cùng SĐT với khách landing -> một dòng Landing+CRM, TrangThaiCRM từ nhập tay, đồng ý và bằng chứng của landing còn nguyên", () => {
  const T = setup({ landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] })], masterExtra: { NhapCRM: [CRM_H, ["Ten Khac", "0900000002", "", "Hẹn xem nhà", ""]] } });
  T.ctx.gopLanding_({ dryRun: false, now: NOW });
  const r = plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW }));
  assert.deepEqual(r, { doc: 1, moi: 0, trung: 1, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 3);
  const row = kh[2];
  assert.equal(row[khCol(kh, "NguonGoc")], "Landing+CRM");
  assert.equal(row[khCol(kh, "TrangThaiCRM")], "Hẹn xem nhà");
  assert.equal(row[khCol(kh, "HoTen")], NAMES[1], "tên landing thắng");
  assert.equal(row[khCol(kh, "DongYNhanTin")], "Có");
  assert.match(row[khCol(kh, "DongYBangChung")], /^bcons-newsky: Có \(2026-11-10T03:00:00\.000Z, mẫu /); // đổi có chủ đích: bằng chứng gắn mã dự án
  assert.equal(T.F.values(null, "NhapCRM")[1][4], "KH-000002");
});

test("gopNhapCRM_: '098.123.4567', '0981234567' và số 981234567 là một người", () => {
  const T = setupCrm([["Khach A", "098.123.4567", "", "", ""], ["Khach B", "0981234567", "", "", ""], ["Khach C", 981234567, "", "", ""]]);
  const r = plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW }));
  assert.deepEqual(r, { doc: 3, moi: 1, trung: 2, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 3);
  assert.equal(kh[2][khCol(kh, "SDT")], "0981234567");
  assert.equal(kh[2][khCol(kh, "HoTen")], "Khach A");
  const marks = T.F.values(null, "NhapCRM").slice(1).map((x) => x[4]);
  assert.deepEqual(marks, ["KH-000002", "KH-000002", "KH-000002"]);
});

test("gopNhapCRM_: thiếu hoặc sai SĐT -> Loi + 'LOI', không vào KhachHang", () => {
  const T = setupCrm([["Khach Loi", "", "", "", ""], ["Khach Hai", "12345", "", "", ""]]);
  const r = plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW }));
  assert.deepEqual(r, { doc: 2, moi: 0, trung: 0, loi: 2 });
  assert.equal(T.F.values(null, "KhachHang").length, 2);
  assert.deepEqual(T.F.values(null, "Loi"), [["Thời gian", "Nguồn", "Dòng", "Lý do"], [NOW.toISOString(), "CRM", 2, "SĐT không hợp lệ"], [NOW.toISOString(), "CRM", 3, "SĐT không hợp lệ"]]);
  assert.deepEqual(T.F.values(null, "NhapCRM").slice(1).map((x) => x[4]), ["LOI", "LOI"]);
  assertNoLeak(T);
});

test("gopNhapCRM_: hai dòng cùng SĐT mới trong một lần -> moi 1, trung 1, một dòng KhachHang", () => {
  const T = setupCrm([["Khach Moi", "0900000002", "", "", ""], ["Khach Hai", "0900000002", "", "Đã gọi", ""]]);
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 2, moi: 1, trung: 1, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 3);
  assert.equal(kh[2][khCol(kh, "TrangThaiCRM")], "Đã gọi", "ô trống được điền từ dòng sau");
  assert.deepEqual(T.F.values(null, "NhapCRM").slice(1).map((x) => x[4]), ["KH-000002", "KH-000002"]);
});

test("gopNhapCRM_: DuAnQuanTam gõ tự do ('Central Park') bị bỏ thành '', khách vẫn được lưu; mã đúng giữ", () => {
  const T = setupCrm([["Khach Moi", "0900000002", "Central Park", "", ""], ["Khach Hai", "0900000004", "bcons-newsky; Central Park", "", ""]]);
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 2, moi: 2, trung: 0, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh[2][khCol(kh, "DuAnQuanTam")], "");
  assert.equal(kh[3][khCol(kh, "DuAnQuanTam")], "bcons-newsky");
});

test("gopNhapCRM_: tên bắt đầu bằng = không thành công thức", () => {
  const T = setupCrm([["=HYPERLINK(1)", "0900000002", "", "=1+1", ""]]);
  T.ctx.gopNhapCRM_({ dryRun: false, now: NOW });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh[2][khCol(kh, "HoTen")], "'=HYPERLINK(1)");
  assert.equal(kh[2][khCol(kh, "TrangThaiCRM")], "'=1+1");
});

test("gopNhapCRM_: dryRun cùng số đếm nhưng không ghi gì", () => {
  const T = setupCrm([["Khach Moi", "0900000002", "", "", ""], ["Khach Loi", "", "", "", ""], ["Khach Cu", "0900000001", "", "", ""]], { masterExtra: {} });
  const before = T.F.snapshot();
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: true, now: NOW })), { doc: 3, moi: 1, trung: 1, loi: 1 });
  assert.equal(T.F.snapshot(), before);
  assert.equal(T.F.calls.writes.length, 0);
});

test("gopNhapCRM_: chạy lần hai sau thành công -> toàn số 0; dòng trống không tính", () => {
  const T = setupCrm([["Khach Moi", "0900000002", "", "", ""], ["", "", "", "", ""], ["Khach Loi", "", "", "", ""]]);
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 2, moi: 1, trung: 0, loi: 1 });
  const after = T.F.snapshot();
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 0, moi: 0, trung: 0, loi: 0 });
  assert.equal(T.F.snapshot(), after);
});

test("gopNhapCRM_: chết sau khi ghi KhachHang, trước khi đánh dấu DaGop; chạy lại không nhân đôi", () => {
  const T = setupCrm([["Khach Moi", "0900000002", "", "", ""], ["Khach Hai", "0900000004", "", "", ""]]);
  T.F.hooks.onWrite = (w) => { if (w.sheet === "NhapCRM" && w.method === "setValues") throw new Error("chết giữa chừng"); };
  assert.throws(() => T.ctx.gopNhapCRM_({ dryRun: false, now: NOW }), /chết giữa chừng/);
  assert.deepEqual(T.F.calls.lock, ["wait", "release"]);
  assert.equal(T.F.values(null, "KhachHang").length, 4);
  T.F.hooks.onWrite = null;
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 2, moi: 0, trung: 2, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 4);
  assert.deepEqual(kh.slice(1).map((r) => r[0]), ["KH-000001", "KH-000002", "KH-000003"]);
  assert.deepEqual(T.F.values(null, "NhapCRM").slice(1).map((x) => x[4]), ["KH-000002", "KH-000003"]);
});

test("gopNhapCRM_: thiếu tab NhapCRM -> toàn số 0, không ném lỗi, không tạo tab (dryRun và thật)", () => {
  const T = setup({});
  const before = T.F.snapshot();
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: true, now: NOW })), { doc: 0, moi: 0, trung: 0, loi: 0 });
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 0, moi: 0, trung: 0, loi: 0 });
  assert.equal(T.F.snapshot(), before);
});

test("gopNhapCRM_: tab NhapCRM thiếu cột DaGop -> lỗi rõ, không ghi gì", () => {
  const T = setup({ masterExtra: { NhapCRM: [["HoTen", "SDT"], ["Khach Moi", "0900000002"]] } });
  const before = T.F.snapshot();
  assert.throws(() => T.ctx.gopNhapCRM_({ dryRun: false, now: NOW }), /NhapCRM thiếu cột/);
  assert.equal(T.F.snapshot(), before);
});

test("gopNhapCRM_: không có tab KhachHang (lần đầu) -> ensureTabs_ tạo, khách CRM được lưu MaKhach KH-000001", () => {
  const T = setupCrm([["Khach Moi", "0900000002", "", "", ""]], { withKhach: false });
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 1, moi: 1, trung: 0, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh[1][0], "KH-000001");
  assert.equal(kh[1][khCol(kh, "SDT")], "0900000002");
});

test("gopLanding_ rồi gopNhapCRM_ cùng SĐT -> một khách Landing+CRM, mã không đổi", () => {
  const T = setup({ landingRows: [leadRow({ ten: NAMES[1], sdt: PHONES[1] })], masterExtra: { NhapCRM: [CRM_H, ["Khach Moi", "090.000.0002", "", "Đã gọi", ""], ["Khach Hai", "0900000004", "", "", ""]] } });
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 1, moi: 1, trung: 0, loi: 0 });
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 2, moi: 1, trung: 1, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 4);
  assert.equal(kh[2][khCol(kh, "MaKhach")], "KH-000002");
  assert.equal(kh[2][khCol(kh, "NguonGoc")], "Landing+CRM");
  assert.equal(kh[2][khCol(kh, "TrangThaiCRM")], "Đã gọi");
  assert.equal(kh[3][khCol(kh, "MaKhach")], "KH-000003");
  assert.equal(kh[3][khCol(kh, "NguonGoc")], "CRM");
  assertNoLeak(T);
});

test("gopNhapCRM_: 200 dòng CRM mới chỉ tốn số lần ghi hằng số", () => {
  const rows = [];
  for (let i = 0; i < 200; i++) rows.push(["Khach " + i, "09123" + String(10000 + i), "", "", ""]);
  rows.push(["Khach Xau", "12345", "", "", ""]);
  const T = setupCrm(rows);
  T.ctx.ensureTabs_(T.F.SpreadsheetApp.getActiveSpreadsheet(), false);
  T.F.calls.writes.length = 0;
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 201, moi: 200, trung: 0, loi: 1 });
  assert.ok(T.F.calls.writes.length <= 12, "số lần ghi: " + T.F.calls.writes.length);
  assert.equal(T.F.values(null, "KhachHang").length, 202);
  const marks = T.F.values(null, "NhapCRM").slice(1).map((r) => r[4]);
  assert.equal(marks.filter((m) => /^KH-/.test(m)).length, 200);
  assert.equal(marks[200], "LOI");
});

// ---- Sau review Task 7: số lần ghi, lưới Sheet, tiêu đề, định dạng tên ----
function bulkCustomer(i, extra) {
  const r = Object.fromEntries(KHACH_COLS.map((c) => [c, ""]));
  Object.assign(r, { MaKhach: "KH-" + String(i + 1).padStart(6, "0"), SDT: "09" + String(10000000 + i), HoTen: "Khach " + i, NguonGoc: "Landing", NgayTao: "2026-10-01T00:00:00.000Z", NgayCapNhat: "2026-10-01T00:00:00.000Z", DongYNhanTin: "Chưa rõ" });
  return KHACH_COLS.map((c) => r[c]).concat(extra === undefined ? [] : [extra]);
}

test("gopNhapCRM_: 1000 dòng, cứ hai dòng có một khách cũ rải rác -> tổng số lần ghi nhỏ, không đụng cột ngoài KHACH_COLS", () => {
  const existing = [];
  for (let i = 0; i < 1000; i++) existing.push(bulkCustomer(i, "=A" + (i + 2)));
  const crm = [];
  for (let i = 0; i < 1000; i++) {
    crm.push(i % 2 === 0 ? ["Ten CRM", "09" + String(10000000 + i), "", "Đã gọi", ""] : ["Khach CRM " + i, "09" + String(20000000 + i), "", "", ""]);
  }
  const T = setup({ withKhach: false, masterExtra: { KhachHang: [[...KHACH_COLS, "CotAnh"], ...existing], NhapCRM: [CRM_H, ...crm] } });
  T.ctx.ensureTabs_(T.F.SpreadsheetApp.getActiveSpreadsheet(), false);
  T.F.calls.writes.length = 0;
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 1000, moi: 500, trung: 500, loi: 0 });
  assert.ok(T.F.calls.writes.length <= 12, "số lần ghi: " + T.F.calls.writes.length);
  for (const w of T.F.calls.writes) if (w.sheet === "KhachHang" && w.method === "setValues") assert.ok(w.col + w.nc - 1 <= KHACH_COLS.length, "ghi ra ngoài KHACH_COLS: cột " + (w.col + w.nc - 1));
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 1501);
  assert.equal(kh[1][khCol(kh, "TrangThaiCRM")], "Đã gọi");
  assert.equal(kh[1][khCol(kh, "NguonGoc")], "Landing+CRM");
  assert.equal(kh[1][khCol(kh, "NgayCapNhat")], NOW.toISOString());
  assert.equal(kh[2][khCol(kh, "TrangThaiCRM")], "");
  assert.equal(kh[2][khCol(kh, "NguonGoc")], "Landing");
  assert.equal(kh[2][khCol(kh, "NgayCapNhat")], "2026-10-01T00:00:00.000Z");
  assert.equal(kh[5][KHACH_COLS.length], "=A6", "cột của anh bên phải giữ nguyên");
  assert.equal(kh[1001][khCol(kh, "NguonGoc")], "CRM");
});

test("lưới Sheet: KhachHang 990 dòng + 50 khách mới thì tự mở rộng lưới (Sheets thật ném lỗi nếu vượt)", () => {
  const existing = [];
  for (let i = 0; i < 989; i++) existing.push(bulkCustomer(i));
  const crm = [];
  for (let i = 0; i < 50; i++) crm.push(["Khach CRM " + i, "09" + String(30000000 + i), "", "", ""]);
  const T = setup({ withKhach: false, masterExtra: { KhachHang: [KHACH_COLS, ...existing], NhapCRM: [CRM_H, ...crm] } });
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 50, moi: 50, trung: 0, loi: 0 });
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh.length, 1040);
  assert.equal(kh[1039][0], "KH-001039");
  assert.equal(kh[1039][khCol(kh, "SDT")], "0930000049");
});

test("lưới Sheet: tab Loi gần cuối lưới vẫn ghi được; dryRun không mở rộng lưới", () => {
  const loiOld = [];
  for (let i = 0; i < 999; i++) loiOld.push([NOW.toISOString(), "CRM", i + 2, "SĐT không hợp lệ"]);
  const mk = () => setup({ masterExtra: { Loi: [["Thời gian", "Nguồn", "Dòng", "Lý do"], ...loiOld], NhapCRM: [CRM_H, ["a", "", "", "", ""], ["b", "", "", "", ""], ["c", "", "", "", ""]] } });
  const D = mk();
  const before = D.F.snapshot();
  assert.deepEqual(plain(D.ctx.gopNhapCRM_({ dryRun: true, now: NOW })), { doc: 3, moi: 0, trung: 0, loi: 3 });
  assert.equal(D.F.snapshot(), before);
  assert.equal(D.F.calls.writes.length, 0);
  const T = mk();
  assert.deepEqual(plain(T.ctx.gopNhapCRM_({ dryRun: false, now: NOW })), { doc: 3, moi: 0, trung: 0, loi: 3 });
  assert.equal(T.F.values(null, "Loi").length, 1003);
});

test("gopNhapCRM_: thiếu tiêu đề HoTen/DuAnQuanTam/TrangThaiCRM -> lỗi tiếng Việt nêu tên cột, không ghi gì", () => {
  for (const miss of ["HoTen", "DuAnQuanTam", "TrangThaiCRM"]) {
    const heads = CRM_H.filter((h) => h !== miss);
    const T = setup({ masterExtra: { NhapCRM: [heads, heads.map((h) => (h === "SDT" ? "0900000002" : ""))] } });
    const before = T.F.snapshot();
    assert.throws(() => T.ctx.gopNhapCRM_({ dryRun: false, now: NOW }), new RegExp("NhapCRM thiếu cột.*" + miss));
    assert.equal(T.F.snapshot(), before);
    assert.deepEqual(T.F.calls.lock, ["wait", "release"]);
  }
});

test("HoTen là văn bản: ensureTabs_ đặt '@' cho cột HoTen, tên '0123' không mất số 0 khi sang KhachHang", () => {
  const T = setupCrm([["0123", "0900000002", "", "", ""], ["12345", "0900000004", "", "", ""]]);
  T.ctx.gopNhapCRM_({ dryRun: false, now: NOW });
  const kh = T.F.values(null, "KhachHang");
  assert.strictEqual(kh[2][khCol(kh, "HoTen")], "0123");
  assert.strictEqual(kh[3][khCol(kh, "HoTen")], "12345");
  const ss = T.F.SpreadsheetApp.getActiveSpreadsheet();
  const fmt = T.F.calls.writes.filter((w) => w.method === "setNumberFormat");
  for (const tab of ["NhapCRM", "KhachHang"]) assert.ok(fmt.some((w) => w.sheet === tab && w.col === 1 || w.sheet === tab && w.col === 3), "chưa định dạng HoTen ở " + tab);
  assert.ok(ss.getSheetByName("NhapCRM"));
});

// ---------------- Task 8: phanBo_ ----------------
const TM = ["MaKhach", "SDT", "HoTen", "NgayCapNhat", "NguonGoc", "DuAnQuanTam", "NhuCau", "CanXem", "PTTT", "DongYNhanTin", "TrangThaiCRM", "TrangThaiChamSoc"];
const CAU2 = [CAU_HINH, ["bcons-newsky", "", "M1"], ["bcons-central-park", "", "M2"]];
function khRow(o) {
  const r = Object.fromEntries(KHACH_COLS.map((c) => [c, ""]));
  Object.assign(r, { NgayTao: "2026-10-01T00:00:00.000Z", NgayCapNhat: "2026-11-01T00:00:00.000Z", NguonGoc: "Landing", DongYNhanTin: "Có", ...o });
  return KHACH_COLS.map((c) => r[c]);
}
const pad = (n) => "KH-" + String(n).padStart(6, "0");
const TC_HEADER = ["SDT", "LyDo", "NgayGhi", "LoaiYeuCau", "DaDongYLai"];
const TC_OLD = "2026-11-05T00:00:00.000Z";
/** Dòng TuChoi: chuỗi = yêu cầu 'Xóa' có ngày; mảng = dòng thô (đủ 5 cột). */
const tcRow = (x) => (Array.isArray(x) ? x : [x, "", TC_OLD, "Xóa", ""]);
function build({ khach, cauHinh = CAU2, tuChoi, byId = { M1: {}, M2: {} } } = {}) {
  const master = { CauHinh: cauHinh, KhachHang: [KHACH_COLS, ...(khach || [])] };
  if (tuChoi) master.TuChoi = [TC_HEADER, ...tuChoi.map(tcRow)];
  const F = fakeSheets({ master, byId });
  const ctx = loadGs([LOGIC, SHEETS]);
  const logs = [];
  ctx.Logger = { log: (...a) => logs.push(a.join(" ")) };
  Object.assign(ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService, PropertiesService: F.PropertiesService, UrlFetchApp: F.UrlFetchApp, ScriptApp: F.ScriptApp });
  return { F, ctx, logs };
}
const run = (ctx, o = {}) => plain(ctx.phanBo_({ dryRun: false, now: NOW, ...o }));
const tab = (F, id, name) => F.values(id, name);
const khDoc = (F) => {
  const v = tab(F, null, "KhachHang");
  return v.slice(1).map((r) => Object.fromEntries(KHACH_COLS.map((c, i) => [c, r[i]])));
};
const masterMa = (F, id) => (tab(F, id, "KhachTuMaster") || []).slice(1).map((r) => r[0]);
const w = (F) => F.calls.writes.length;

test("phanBo_: khách hai dự án có mặt ở cả hai Master, chỉ cột A..L; cột N trở đi của anh không bị đụng sau lần chạy lại", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park" })] });
  const r = run(ctx);
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 1, "bcons-central-park": 1 }, rutLai: 0, dongYLai: 0, xoa: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0, chuaCoDuAn: 0 });
  for (const id of ["M1", "M2"]) {
    const t = tab(F, id, "KhachTuMaster");
    assert.deepEqual(t[0].slice(0, 12), TM);
    assert.equal(t[0][12], "");
    assert.equal(t[0][13], "Ghi chú của anh");
    assert.equal(t[1][0], pad(1));
    assert.equal(t[1][1], PHONES[0]);
    assert.equal(t[1][2], NAMES[0]);
    assert.equal(t[1][5], "bcons-newsky;bcons-central-park");
  }
  // anh ghi chú ở cột N, M1 và M2
  for (const id of ["M1", "M2"]) F.SpreadsheetApp.openById(id).getSheetByName("KhachTuMaster").getRange(2, 14).setValues([["ghi chú của anh"]]);
  // dữ liệu đổi ở KhachHang
  const kh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  kh.getRange(2, 3).setValues([["Ten Moi Doi"]]);
  kh.getRange(2, 14).setValues([["Đã gọi"]]);
  F.calls.writes.length = 0;
  const r2 = run(ctx);
  assert.deepEqual(r2.dayVao, { "bcons-newsky": 1, "bcons-central-park": 1 });
  for (const id of ["M1", "M2"]) {
    const t = tab(F, id, "KhachTuMaster");
    assert.equal(t[1][2], "Ten Moi Doi");
    assert.equal(t[1][10], "Đã gọi");
    assert.equal(t[1][13], "ghi chú của anh");
  }
  const bad = F.calls.writes.filter((x) => x.owner !== "MASTER" && x.col + x.nc - 1 > 12);
  assert.deepEqual(bad, [], "ghi vượt cột L");
  assert.ok(F.calls.writes.every((x) => x.method !== "deleteRow"));
});

test("phanBo_: lần hai không đổi gì thì không ghi gì", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "" })] });
  run(ctx);
  F.calls.writes.length = 0;
  const snap = F.snapshot();
  const r = run(ctx);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, rutLai: 0, dongYLai: 0, xoa: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0, chuaCoDuAn: 1 }); // khách 2 DuAnQuanTam trống: chỉ đếm
});

test("phanBo_: dự án trống ở lại KhachHang (không vào Master, không có tab ChuaPhanDuAn); mã lạ có giá trị không phân bổ, không đếm là trống", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "du-an-la" })] });
  const r = run(ctx);
  assert.equal(r.chuaCoDuAn, 1);
  assert.equal(F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
  assert.deepEqual(masterMa(F, "M1"), []);
  assert.deepEqual(masterMa(F, "M2"), []);
  assert.equal(khDoc(F)[1].DuAnQuanTam, "du-an-la");
});

test("phanBo_: SĐT vào TuChoi (+84 ...) -> xóa khỏi mọi Master kể cả bản cũ ở dự án chưa từng phân bổ; KhachHang bị xóa SDT/HoTen", () => {
  const stale = [TM, [pad(1), PHONES[0], NAMES[0], "", "Landing", "bcons-newsky", "", "", "", "Có", "", ""]];
  const keep = [pad(2), PHONES[1], NAMES[1], "", "Landing", "bcons-central-park", "", "", "", "Có", "", ""];
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-central-park", NhuCau: "Mua để ở", CanXem: "2PN", DongYBangChung: "Có (x)", GhiChu: "ghi chú của anh" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-central-park" })],
    byId: { M1: { KhachTuMaster: stale }, M2: { KhachTuMaster: [TM] } },
  });
  run(ctx);
  // M1 chưa từng được phân bổ khách 1 (bản cũ)
  F.SpreadsheetApp.openById("M1").getSheetByName("KhachTuMaster").getRange(3, 1, 1, 12).setValues([keep.map(String)]);
  assert.deepEqual(masterMa(F, "M2"), [pad(1), pad(2)]);
  const ss = F.SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName("TuChoi").getRange(1, 1, 2, 5).setValues([TC_HEADER, ["+84 90 000 0001", "", TC_OLD, "Xóa", ""]]);
  const r = run(ctx);
  assert.equal(r.xoa, 1);
  assert.deepEqual(r.lyDo, { tuchoi: 1, khong: 0 });
  assert.deepEqual(masterMa(F, "M1"), [pad(2)]);
  assert.deepEqual(masterMa(F, "M2"), [pad(2)]);
  const k = khDoc(F)[0];
  assert.equal(k.MaKhach, pad(1));
  for (const c of ["SDT", "HoTen", "NhuCau", "CanXem", "DongYBangChung"]) assert.equal(k[c], "", c);
  assert.equal(k.DongYNhanTin, "Đã rút lại");
  assert.equal(k.DongYDuAn, "", "xóa luôn DongYDuAn");
  assert.equal(k.GhiChu, "Rút lại"); // GhiChu là chữ tự do, có thể chứa ghi chú cá nhân: thay bằng dấu
  assert.equal(khDoc(F)[1].HoTen, NAMES[1]);
});

test("phanBo_: lần chạy thứ hai sau khi xóa: không ghi gì, không liệt kê lại, không đếm xoa", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "" })],
    tuChoi: ["0900000001"],
  });
  const r1 = run(ctx);
  assert.equal(r1.xoa, 1);
  assert.equal(khDoc(F)[0].GhiChu, "Rút lại");
  F.calls.writes.length = 0;
  const snap = F.snapshot();
  const r2 = run(ctx);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  assert.deepEqual(r2, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, rutLai: 0, dongYLai: 0, xoa: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0, chuaCoDuAn: 1 }); // khách 2 DuAnQuanTam trống: chỉ đếm
  assert.deepEqual(masterMa(F, "M1"), []);
  // ngay cả khi TuChoi bị xóa dòng, khách đã rút lại không quay lại
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TuChoi").getRange(2, 1).setValues([[""]]);
  F.calls.writes.length = 0;
  run(ctx);
  assert.equal(w(F), 0);
});

test("phanBo_: anh gõ 'không' (thường) ở DongYNhanTin -> rút lại như 'Không': hồ sơ giữ nguyên, chuyển 'Đã rút lại' (NgayRutLai = now), Master 'Đã rút lại', không xóa", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "không" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })] });
  const r = run(ctx);
  assert.equal(r.xoa, 0);
  assert.equal(r.rutLai, 1); // gõ tay: khách vừa được ghi nhận rút lại
  assert.deepEqual(r.lyDo, { tuchoi: 0, khong: 0 });
  assert.deepEqual(masterMa(F, "M1"), [pad(1), pad(2)], "hồ sơ vẫn được phân bổ, với trạng thái đã rút lại");
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  const k = khDoc(F)[0];
  assert.equal(k.DongYNhanTin, "Đã rút lại"); // Task 4: chữ gõ tay được chuẩn hóa thành trạng thái hệ thống
  assert.equal(k.SDT, PHONES[0]);
  assert.equal(k.HoTen, NAMES[0]);
});

test("phanBo_: TuChoi 'Xóa': dòng còn sót SĐT trong Master từ lần chạy cũ bị xóa theo cả SĐT khi MaKhach lệch", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, ["KH-LAC", PHONES[0], NAMES[0], "", "", "", "", "", "", "", "", ""]] }, M2: {} },
  });
  run(ctx);
  assert.deepEqual(masterMa(F, "M1"), []);
});

test("phanBo_: SĐT trống mà không phải rút lại -> bỏ qua, không đẩy đi đâu, không đếm", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: "", HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })] });
  const r = run(ctx);
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, rutLai: 0, dongYLai: 0, xoa: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0, chuaCoDuAn: 0 });
  assert.deepEqual(masterMa(F, "M1"), []);
  assert.equal(F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
});

test("phanBo_: lỗi khi quyết định (dạng lạ) -> ném lỗi trước mọi lần ghi, nhả khóa", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })], tuChoi: ["0900000009"] });
  const orig = ctx.decideDestinations_;
  let n = 0;
  ctx.decideDestinations_ = (...a) => {
    if (++n === 2) throw new Error("tuChoi: dạng không hỗ trợ");
    return orig(...a);
  };
  const snap = F.snapshot();
  assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }), /không hỗ trợ/);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  assert.deepEqual(F.calls.lock, ["wait", "release"]);
});

test("phanBo_: một Master không mở được (không có ai rút lại) -> ném lỗi trước mọi lần ghi, thông báo không chứa tên/SĐT", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], byId: { M1: { KhachTuMaster: [TM, [pad(1), PHONES[0], NAMES[0], "", "", "", "", "", "", "", "", ""]] } } });
  const snap = F.snapshot();
  let err;
  try { ctx.phanBo_({ dryRun: false, now: NOW }); } catch (e) { err = e; }
  assert.ok(err);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  for (const s of [...NAMES, ...PHONES]) assert.ok(!String(err.message).includes(s));
  assert.deepEqual(F.calls.lock, ["wait", "release"]);
});

test("phanBo_: tiêu đề KhachTuMaster sai -> ném lỗi, không ghi gì", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], byId: { M1: { KhachTuMaster: [["a", "b"]] }, M2: {} } });
  assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }), /KhachTuMaster/);
  assert.equal(w(F), 0);
});

test("phanBo_: dryRun không đổi gì (tab, lưới, định dạng) nhưng trả cùng số đếm", () => {
  const mk = () => build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "" }), khRow({ MaKhach: pad(3), SDT: PHONES[2], HoTen: NAMES[2], DuAnQuanTam: "bcons-newsky" })], tuChoi: ["0900000003"] });
  const a = mk();
  const snap = a.F.snapshot();
  const maxBefore = a.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang").getMaxRows();
  const dry = run(a.ctx, { dryRun: true });
  assert.equal(w(a.F), 0);
  assert.equal(a.F.snapshot(), snap);
  assert.equal(a.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang").getMaxRows(), maxBefore);
  assert.equal(a.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
  const b = mk();
  assert.deepEqual(run(b.ctx), dry);
  assert.deepEqual(dry, { dayVao: { "bcons-newsky": 1, "bcons-central-park": 1 }, rutLai: 0, dongYLai: 0, xoa: 1, lyDo: { tuchoi: 1, khong: 0 }, masterLoi: [], tuChoiLoi: 0, chuaCoDuAn: 1 });
});

test("phanBo_: dòng CauHinh thiếu masterSheetId hoặc maDuAn bị bỏ qua; mã đó không phải đích hợp lệ", () => {
  const cau = [CAU_HINH, ["bcons-newsky", "", "M1"], ["bcons-central-park", "", ""], ["", "", "M2"]];
  const { F, ctx } = build({ cauHinh: cau, khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-central-park" })] });
  const r = run(ctx);
  assert.deepEqual(r.dayVao, { "bcons-newsky": 0 });
  assert.equal(r.chuaCoDuAn, 0, "mã dự án có giá trị nhưng không có Master: không phân bổ, không đếm là trống");
  assert.deepEqual(F.calls.openById, ["M1"]);
});

test("phanBo_: 500 khách vào 2 dự án chỉ tốn số lần ghi hằng số", () => {
  const khach = [];
  for (let i = 1; i <= 500; i++) khach.push(khRow({ MaKhach: pad(i), SDT: "09" + String(10000000 + i), HoTen: "Khach " + i, DuAnQuanTam: i % 2 ? "bcons-newsky;bcons-central-park" : "bcons-newsky" }));
  const { F, ctx } = build({ khach });
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false); // các tab chuẩn đã có từ các lần gộp trước
  F.calls.writes.length = 0;
  const r = run(ctx);
  assert.equal(r.dayVao["bcons-newsky"], 500);
  assert.equal(r.dayVao["bcons-central-park"], 250);
  assert.ok(w(F) <= 20, "số lần ghi: " + w(F));
  assert.equal(masterMa(F, "M1").length, 500);
  // đổi hết rồi chạy lại: vẫn ít lần ghi
  const sh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  sh.getRange(2, 14, 500, 1).setValues(Array.from({ length: 500 }, () => ["Đã gọi"]));
  F.calls.writes.length = 0;
  run(ctx);
  assert.ok(w(F) <= 20, "số lần ghi lần hai: " + w(F));
  assert.equal(tab(F, "M1", "KhachTuMaster")[500][10], "Đã gọi");
});

test("phanBo_: không rò tên/SĐT ra Logger, UrlFetchApp; tên '=' không thành công thức", () => {
  const { F, ctx, logs } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: "=HYPERLINK(x)", DuAnQuanTam: "bcons-newsky" })], tuChoi: ["0900000002"] });
  run(ctx);
  assertNoLeak({ F, logs });
  assert.equal(F.calls.fetch.length, 0);
  assert.equal(tab(F, "M1", "KhachTuMaster")[1][2], "'=HYPERLINK(x)");
  run(ctx);
  F.calls.writes.length = 0;
  run(ctx);
  assert.equal(w(F), 0);
});

test("phanBo_: waitLock lỗi -> ném lỗi, không ghi gì", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })] });
  F.hooks.waitLockError = true;
  assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }));
  assert.equal(w(F), 0);
});

// ---------------- Task 8 sửa lỗi review: rút lại phải đóng hẳn ----------------
const mrow = (ma, phone, name = "", extra = {}) => {
  const o = { MaKhach: ma, SDT: phone, HoTen: name, ...extra };
  return TM.map((c) => o[c] ?? "");
};
const PII = ["SDT", "HoTen", "NhuCau", "CanXem", "DongYBangChung", "NguonChiTiet", "PTTT", "NguoiChamSoc"];
const tuChoiPhones = (F) => (tab(F, null, "TuChoi") || []).slice(1).map((r) => r[0]).filter(Boolean);

test("xóa: dòng KhachHang không có MaKhach mà có SĐT trong TuChoi 'Xóa' -> xóa bản sao theo SĐT ở Master, xóa dữ liệu dòng", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: "", SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(7), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const r = run(ctx);
  assert.equal(r.xoa, 1);
  assert.deepEqual(masterMa(F, "M1"), []);
  const k = khDoc(F)[0];
  assert.equal(k.SDT, "");
  assert.equal(k.HoTen, "");
  assert.equal(k.DongYNhanTin, "Đã rút lại");
});

test("xóa: hai dòng KhachHang cùng SĐT (KH-1 'Chưa rõ', KH-2 'Có') trong TuChoi 'Xóa' -> cả hai bị xóa, không ai được thêm lại vào Master", () => {
  const { F, ctx } = build({
    tuChoi: [PHONES[0]],
    khach: [
      khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Chưa rõ" }),
      khRow({ MaKhach: pad(2), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park", DongYNhanTin: "Có" }),
      khRow({ MaKhach: pad(3), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" }),
    ],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(2), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const r = run(ctx);
  assert.equal(r.xoa, 2);
  assert.deepEqual(masterMa(F, "M1"), [pad(3)]);
  assert.deepEqual(masterMa(F, "M2"), []);
  for (const k of khDoc(F).slice(0, 2)) {
    assert.equal(k.SDT, "");
    assert.equal(k.HoTen, "");
    assert.equal(k.DongYNhanTin, "Đã rút lại");
  }
  assert.equal(khDoc(F)[2].HoTen, NAMES[1]);
});

test("làm nốt xóa dở: dòng 'Không' SĐT rỗng, GhiChu = dấu 'Rút lại' do phanBo_ ghi, còn dữ liệu cá nhân (viết hoa/thường lẫn lộn) -> xóa hết và xóa bản sao Master theo MaKhach", () => {
  for (const flag of ["Không", "không", "KHÔNG", " Khong ", "Đã rút lại"]) {
    const { F, ctx } = build({
      khach: [khRow({ MaKhach: pad(1), SDT: "", HoTen: NAMES[0], NhuCau: "Mua để ở", CanXem: "2PN", NguonChiTiet: "facebook", PTTT: "PTTT 03", NguoiChamSoc: "Nhan Vien A", DongYBangChung: "Có (x)", GhiChu: "Rút lại", DongYNhanTin: flag, TrangThaiCRM: "Đã gọi" })],
      byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), "", NAMES[0])] }, M2: { KhachTuMaster: [TM, mrow(pad(1), "", NAMES[0])] } },
    });
    const r = run(ctx);
    assert.equal(r.xoa, 1, flag);
    assert.deepEqual(masterMa(F, "M1"), [], flag);
    assert.deepEqual(masterMa(F, "M2"), [], flag);
    const k = khDoc(F)[0];
    for (const c of PII) assert.equal(k[c], "", flag + c);
    assert.equal(k.GhiChu, "Rút lại", flag);
    assert.equal(k.DongYNhanTin, "Đã rút lại");
    assert.equal(k.TrangThaiCRM, "Đã gọi");
    F.calls.writes.length = 0;
    run(ctx);
    assert.equal(w(F), 0, "lần hai " + flag);
  }
});

test("rút lại: GhiChu chỉ có 'Rút lại' + SĐT rỗng + 'Không' -> bỏ qua, không ghi gì", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: "", GhiChu: "Rút lại", DongYNhanTin: "Không" })] });
  const r = run(ctx);
  assert.equal(r.xoa, 0);
  assert.equal(F.calls.writes.filter((x) => x.sheet === "KhachHang").length, 0);
});

test("xóa: NgayGhi được đóng dấu TRƯỚC khi xóa Master, Master xóa trước khi xóa KhachHang; lần hai không ghi gì; TuChoi không nhân đôi", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [[PHONES[0], "", "", "Xóa", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const order = [];
  F.hooks.onWrite = (i) => order.push(i.sheet + ":" + i.method);
  run(ctx);
  assert.deepEqual(tuChoiPhones(F), [PHONES[0]]);
  assert.ok(order.indexOf("TuChoi:setValues") >= 0 && order.indexOf("TuChoi:setValues") < order.indexOf("KhachTuMaster:deleteRow"));
  assert.ok(order.indexOf("KhachHang:setValues") < order.indexOf("KhachTuMaster:deleteRow"), "dấu ghi trước");
  assert.ok(order.indexOf("KhachTuMaster:deleteRow") < order.lastIndexOf("KhachHang:setValues"), "xóa dữ liệu cá nhân sau cùng");
  assert.equal(String(tab(F, null, "TuChoi")[1][2]), "2026-11-11T01:00:00.000Z");
  F.calls.writes.length = 0;
  run(ctx);
  assert.equal(w(F), 0);
  assert.deepEqual(tuChoiPhones(F), [PHONES[0]]);
});

test("rút lại gõ tay 'Không' không còn ghi TuChoi và không xóa gì", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" })], byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} } });
  run(ctx);
  assert.deepEqual(tuChoiPhones(F), []);
  assert.ok(F.calls.writes.every((x) => x.method !== "deleteRow"));
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
  assert.deepEqual(masterMa(F, "M1"), [pad(1)]); // bản cũ ở Master: Task 4 mới đổi trạng thái
});

test("rút lại: SĐT đã có trong TuChoi thì không ghi thêm dòng; dryRun không ghi TuChoi", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: ["+84 90 000 0001"] });
  run(ctx);
  assert.deepEqual(tuChoiPhones(F), ["+84 90 000 0001"]);
  const b = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: [PHONES[0]] });
  const snap = b.F.snapshot();
  run(b.ctx, { dryRun: true });
  assert.equal(b.F.snapshot(), snap);
  assert.equal(w(b.F), 0);
});

test("KhachTuMaster: K và L (TrangThaiCRM, TrangThaiChamSoc) chỉ điền khi ô đích trống; A..J vẫn cập nhật", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", TrangThaiCRM: "Nóng", TrangThaiChamSoc: "" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky", TrangThaiCRM: "Nóng", TrangThaiChamSoc: "Đã liên hệ" })] });
  run(ctx);
  const sh = F.SpreadsheetApp.openById("M1").getSheetByName("KhachTuMaster");
  sh.getRange(2, 11, 1, 2).setValues([["", "Đã gọi"]]); // anh gõ L cho khách 1, K để trống
  sh.getRange(3, 11, 1, 2).setValues([["Lạnh", ""]]); // anh gõ K cho khách 2, L để trống
  const kh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  kh.getRange(2, 3).setValues([["Ten Doi Moi"]]);
  kh.getRange(2, 15).setValues([["Chăm sóc A"]]); // KhachHang.TrangThaiChamSoc khách 1 (vẫn bị anh L che)
  run(ctx);
  const t = tab(F, "M1", "KhachTuMaster");
  assert.equal(t[1][2], "Ten Doi Moi");
  assert.equal(t[1][10], "Nóng"); // K trống -> điền
  assert.equal(t[1][11], "Đã gọi"); // L anh gõ -> giữ
  assert.equal(t[2][10], "Lạnh"); // K anh gõ -> giữ
  assert.equal(t[2][11], "Đã liên hệ"); // L trống -> điền
});

test("deleteRow an toàn: hàng bị dịch giữa lúc quét và lúc xóa thì không xóa nhầm khách khác", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(2), PHONES[1], NAMES[1]), mrow(pad(1), PHONES[0], NAMES[0]), mrow(pad(3), PHONES[2], NAMES[2])] }, M2: {} },
  });
  let done = false;
  F.hooks.onRead = (i) => {
    // lần đọc kiểm tra một ô ngay trước khi xóa: giả lập anh xóa dòng 2 của Master cùng lúc
    if (!done && i.sheet === "KhachTuMaster" && i.nr === 1 && i.nc === 1) {
      done = true;
      F.hooks.onRead = null;
      F.SpreadsheetApp.openById("M1").getSheetByName("KhachTuMaster").deleteRow(2);
    }
  };
  run(ctx);
  assert.ok(done, "hook không chạy: không có bước kiểm tra trước khi xóa");
  assert.deepEqual(masterMa(F, "M1"), [pad(3)]);
});

test("Master không mở được + có người rút lại: Master mở được vẫn bị xóa, KhachHang giữ dữ liệu, ghi Loi (chỉ mã dự án), masterLoi, không phân bổ", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] } }, // M2 không mở được
  });
  const r = run(ctx);
  assert.deepEqual(r.masterLoi, ["bcons-central-park"]);
  assert.deepEqual(masterMa(F, "M1"), []); // đã xóa bản sao, khách 2 chưa được phân bổ
  assert.equal(r.dayVao["bcons-newsky"], 0);
  const k = khDoc(F);
  assert.equal(k[0].SDT, PHONES[0]);
  assert.equal(k[0].HoTen, NAMES[0]);
  assert.deepEqual(tuChoiPhones(F), ["0900000001"]);
  const loi = tab(F, null, "Loi");
  assert.equal(loi.length, 2);
  assert.deepEqual([loi[1][1], loi[1][2], loi[1][3]], ["Rút lại", 0, "Không mở được Master bcons-central-park"]);
  for (const s of [...NAMES, ...PHONES]) assert.ok(!JSON.stringify(loi).includes(s));
});

test("quy trình ghi: tính hết trước khi ghi -> có người rút lại mà tuChoi dạng lạ thì không ghi gì (kể cả TuChoi)", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })], tuChoi: [PHONES[0]], byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} } });
  const orig = ctx.decideDestinations_;
  let n = 0;
  ctx.decideDestinations_ = (...a) => {
    if (++n === 2) throw new Error("tuChoi: dạng không hỗ trợ");
    return orig(...a);
  };
  const snap = F.snapshot();
  assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }), /không hỗ trợ/);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
});

for (const [label, hit] of [
  ["lúc xóa bản sao ở Master", (i) => i.method === "deleteRow" && i.owner === "M1"],
  ["sau khi xóa Master (lúc xóa dữ liệu cá nhân ở KhachHang)", (i) => i.method === "setValues" && i.owner === "MASTER" && i.sheet === "KhachHang" && i.col === KHACH_COLS.indexOf("SDT") + 1],
]) {
  test("chết giữa chừng " + label + ": SĐT còn ở KhachHang, chạy lại hoàn tất việc xóa", () => {
    const { F, ctx } = build({
      khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })],
      tuChoi: [PHONES[0]],
      byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
    });
    F.hooks.onWrite = (i) => { if (hit(i)) throw new Error("chết"); };
    assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }), /chết/);
    assert.equal(khDoc(F)[0].SDT, PHONES[0], "KhachHang đã bị xóa quá sớm");
    assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
    F.hooks.onWrite = null;
    run(ctx);
    assert.deepEqual(masterMa(F, "M1"), []);
    assert.equal(khDoc(F)[0].SDT, "");
    assert.deepEqual(tuChoiPhones(F), ["0900000001"]);
  });
}

test("hai người rút lại trong cùng một Master: xóa từ dưới lên, đúng hai dòng, khách khác còn nguyên", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(3), SDT: PHONES[2], HoTen: NAMES[2], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(4), SDT: PHONES[3], HoTen: NAMES[3], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [PHONES[0], PHONES[2]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0]), mrow(pad(2), PHONES[1]), mrow(pad(3), PHONES[2]), mrow(pad(4), PHONES[3])] }, M2: {} },
  });
  run(ctx);
  assert.deepEqual(masterMa(F, "M1"), [pad(2), pad(4)]);
  const dels = F.calls.writes.filter((x) => x.method === "deleteRow" && x.owner === "M1").map((x) => x.row);
  assert.deepEqual(dels, [4, 2]);
});

// ---------------- Task 9: nhật ký, báo Telegram, lịch, menu ----------------
const TG = { TELEGRAM_BOT_TOKEN: "TOKEN-BI-MAT-123", TELEGRAM_CHAT_ID: "-100777" };
const SECRET_ID = "SHEETID-RIENG-XYZ";
const SECRET_NAMES = ["Nguyễn Văn Kín", "Khach Cu", "Khach Moi", "Khach Loi", "Ten Khac", "Trần Thị Crm"];
const SECRET_PHONES = ["0900000001", "0900000002", "0900000003", "0981234567", "090 000 0002"];
function full({ props = TG, landingId = "L1", crmRows, landingRows, cauHinh, khach, tuChoi, byId, masterExtra = {} } = {}) {
  const master = {
    CauHinh: cauHinh || [CAU_HINH, ["bcons-newsky", landingId, "M1"]],
    KhachHang: [KHACH_COLS, ...(khach || [existingCustomer()])],
    NhapCRM: [CRM_H, ...(crmRows || [["Trần Thị Crm", "098.123.4567", "bcons-newsky", "Đã gọi", ""], ["Không SĐT", "12", "", "", ""]])],
    ...(tuChoi ? { TuChoi: [TC_HEADER, ...tuChoi.map(tcRow)] } : {}),
    ...masterExtra,
  };
  const F = fakeSheets({
    master,
    props,
    byId: byId || { [landingId]: { Landing: [HEADERS, ...(landingRows || threeRows())] }, M1: {} },
  });
  const ctx = loadGs([LOGIC, SHEETS]);
  const logs = [];
  ctx.Logger = { log: (...a) => logs.push(a.join(" ")) };
  Object.assign(ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService, PropertiesService: F.PropertiesService, UrlFetchApp: F.UrlFetchApp, ScriptApp: F.ScriptApp });
  return { F, ctx, logs };
}
const runAll = (ctx, o = {}) => plain(ctx.chayTatCa_({ dryRun: false, now: NOW, ...o }));
const nhatKy = (F) => F.values(null, "NhatKy");
const tgTexts = (F) => F.calls.fetch.map((c) => JSON.parse(c.options.payload).text);

test("chayTatCa_: chạy đủ ba bước, trả số đếm từng bước, loi rỗng", () => {
  const { ctx } = full();
  const r = runAll(ctx);
  assert.equal(r.loi, "");
  assert.equal(r.skipped, undefined);
  assert.deepEqual([r.landing.doc, r.landing.moi, r.landing.trung, r.landing.loi], [3, 1, 1, 1]);
  assert.deepEqual([r.crm.doc, r.crm.moi, r.crm.loi], [2, 1, 1]);
  assert.equal(typeof r.phanBo.chuaCoDuAn, "number");
  assert.equal(typeof r.phanBo.rutLai, "number");
  assert.deepEqual(r.phanBo.masterLoi, []);
});

test("chayTatCa_: đúng một dòng NhatKy: giờ ISO, nguồn, số đọc, mới, trùng, lỗi, ghi chú chỉ có số", () => {
  const { F, ctx } = full();
  const r = runAll(ctx);
  const nk = nhatKy(F);
  assert.equal(nk.length, 2);
  assert.deepEqual(nk[0], ["Thời gian", "Nguồn", "Số dòng đọc", "Khách mới", "Gộp trùng", "Lỗi", "Ghi chú"]);
  const [t, nguon, doc, moi, trung, loi, ghiChu] = nk[1];
  assert.equal(t instanceof Date ? t.toISOString() : t, NOW.toISOString());
  assert.equal(nguon, "Tự động");
  assert.equal(doc, r.landing.doc + r.crm.doc);
  assert.equal(moi, r.landing.moi + r.crm.moi);
  assert.equal(trung, r.landing.trung + r.crm.trung);
  assert.equal(loi, r.landing.loi + r.crm.loi + r.phanBo.masterLoi.length);
  assert.match(String(ghiChu), /^rutlai=\d+ dongylai=\d+ xoa=\d+ tuchoi=\d+ khong=\d+ vao=\d+ ms=\d+$/);
});

test("chayTatCa_: nguồn 'Gộp ngay' được ghi đúng; mặc định 'Tự động'", () => {
  const { F, ctx } = full();
  runAll(ctx, { source: "Gộp ngay" });
  assert.equal(nhatKy(F)[1][1], "Gộp ngay");
});

test("chayTatCa_: lần hai (không còn gì) vẫn ghi một dòng toàn số 0", () => {
  const { F, ctx } = full();
  runAll(ctx);
  runAll(ctx);
  const nk = nhatKy(F);
  assert.equal(nk.length, 3);
  assert.deepEqual(nk[2].slice(2, 6), [0, 0, 0, 0]);
});

test("không rò: chạy cả Master_Data có tên/SĐT nhận dạng được -> không có trong NhatKy, payload Telegram, alert UI, Logger", () => {
  const rows = [
    leadRow({ ten: "Nguyễn Văn Kín", sdt: "0981234567" }),
    leadRow({ ten: "Khach Moi", sdt: "0900000002" }),
    leadRow({ ten: "Khach Loi", sdt: "0900000003", badPhone: "090 000 0002" }),
  ];
  const check = ({ F, logs }) => {
    const all = JSON.stringify(nhatKy(F)) + JSON.stringify(F.calls.fetch.map((c) => c.options)) + F.ui.alerts.join("\n") + logs.join("\n");
    for (const x of [...SECRET_NAMES, ...SECRET_PHONES]) assert.ok(!all.includes(x), "rò rỉ: " + x);
    assert.ok(!JSON.stringify(F.calls.fetch.map((c) => c.options)).includes(TG.TELEGRAM_BOT_TOKEN), "token trong payload");
    assert.ok(!all.includes(SECRET_ID), "ID Sheet bị rò");
  };
  // 1) chạy thường, có khách rút lại và Master hỏng (để có tin báo)
  let e = full({ landingId: SECRET_ID, landingRows: rows, khach: [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Trần Thị Crm", DongYNhanTin: "Không", DuAnQuanTam: "bcons-newsky" })] });
  runAll(e.ctx, { source: "Gộp ngay" });
  e.ctx.chayThu();
  e.ctx.gopNgay();
  e.ctx.baoCaoNgay_({ now: NOW });
  check(e);
  assert.ok(e.F.calls.fetch.length >= 1, "phải có ít nhất một tin để kiểm");
  // 2) lỗi giữa chừng
  e = full({ landingId: SECRET_ID, landingRows: rows, crmRows: [["Nguyễn Văn Kín", "0981234567", "", "", ""]], masterExtra: {} });
  let khReads = 0;
  e.F.hooks.onRead = ({ sheet }) => {
    if (sheet === "KhachHang" && ++khReads === 3) throw new Error("Nguyễn Văn Kín 0981234567 " + SECRET_ID); // bước 3 (phanBo_)
  };
  const r = runAll(e.ctx);
  assert.match(r.loi, /^LOI_[A-Z_]+$/);
  check(e);
  // 3) lỗi mở Sheet landing: thông báo gốc có ID
  e = full({ landingId: SECRET_ID, byId: { M1: {} } });
  const r3 = runAll(e.ctx);
  assert.equal(r3.loi, "LOI_DOC_SHEET");
  check(e);
  assert.equal(tgTexts(e.F).length, 1);
});

test("chayTatCa_: lỗi ở bước 2 -> bước 3 không chạy, một dòng NhatKy với loại lỗi, một tin Telegram, trả loi, không ném", () => {
  // làm hỏng bước 2: NhapCRM thiếu cột DaGop
  const bad = full({ masterExtra: { NhapCRM: [["HoTen", "SDT", "DuAnQuanTam", "TrangThaiCRM"], ["A", "0900000002", "", ""]] } });
  const r = runAll(bad.ctx);
  assert.equal(r.loi, "LOI_TAB");
  assert.ok(r.landing, "bước 1 đã xong, có kết quả");
  assert.equal(r.phanBo, undefined);
  assert.ok(!bad.F.calls.openById.includes("M1"), "bước 3 (phanBo_) không được chạy");
  assert.equal(bad.F.values("M1", "KhachTuMaster"), null);
  const nk = nhatKy(bad.F);
  assert.equal(nk.length, 2);
  assert.equal(nk[1][1], "Tự động");
  assert.match(String(nk[1][6]), /LOI_TAB/);
  assert.ok(nk[1][5] >= 1);
  const tg = tgTexts(bad.F);
  assert.equal(tg.length, 1);
  assert.match(tg[0], /LOI_TAB/);
  assert.ok(!tg[0].includes("DaGop"), "không đưa nguyên thông báo lỗi");
});

test("chayTatCa_: lỗi ở bước 1 (không mở được Sheet landing) -> LOI_DOC_SHEET, bước 2 và 3 không chạy", () => {
  const { F, ctx } = full({ landingId: SECRET_ID, byId: { M1: {} } });
  const r = runAll(ctx);
  assert.equal(r.loi, "LOI_DOC_SHEET");
  assert.equal(r.crm, undefined);
  assert.equal(r.phanBo, undefined);
  assert.equal(F.values(null, "KhachHang").length, 2); // bước 2 không ghi khách CRM
  assert.equal(nhatKy(F).length, 2);
  assert.equal(tgTexts(F).length, 1);
});

test("errorClass_: ánh xạ thông báo lỗi sang mã cố định, lỗi lạ hoặc không phải Error -> LOI_KHAC", () => {
  const { ctx } = full();
  const c = (m) => ctx.errorClass_(m);
  assert.equal(c(new Error("Không mở được Sheet: abc")), "LOI_DOC_SHEET");
  assert.equal(c(new Error("Không mở được hoặc tiêu đề sai ở tab KhachTuMaster của dự án: x.")), "LOI_TAB");
  assert.equal(c(new Error("Tab NhapCRM thiếu cột DaGop.")), "LOI_TAB");
  assert.equal(c(new Error("Thiếu tab CauHinh trong Master_Data.")), "LOI_TAB");
  assert.equal(c(new Error("Sheet landing X không có tab Landing.")), "LOI_TAB");
  assert.equal(c(new Error("Không lấy được khóa")), "LOI_KHOA");
  assert.equal(c(new Error("Lock timeout: Could not obtain lock after 10000 milliseconds")), "LOI_KHOA");
  assert.equal(c("chuỗi"), "LOI_KHAC");
  assert.equal(c(null), "LOI_KHAC");
  assert.equal(c(undefined), "LOI_KHAC");
});

test("chayTatCa_: lỗi khóa (ném giữa chừng) -> LOI_KHOA", () => {
  const { F, ctx } = full();
  F.hooks.onRead = () => { throw new Error("Lock timeout: could not obtain lock"); };
  assert.equal(runAll(ctx).loi, "LOI_KHOA");
});

test("chayTatCa_: dryRun -> không NhatKy, không Telegram, không ghi gì, vẫn trả số đếm", () => {
  const { F, ctx } = full();
  const before = F.snapshot();
  const r = runAll(ctx, { dryRun: true });
  assert.equal(F.snapshot(), before);
  assert.equal(F.calls.writes.length, 0);
  assert.equal(F.calls.fetch.length, 0);
  assert.equal(r.loi, "");
  assert.equal(r.landing.moi, 1);
  assert.equal(F.values(null, "NhatKy"), null);
});

test("chayTatCa_: dryRun gặp lỗi -> trả loi nhưng không NhatKy, không Telegram, không ghi", () => {
  const { F, ctx } = full({ landingId: SECRET_ID, byId: { M1: {} } });
  const before = F.snapshot();
  const r = runAll(ctx, { dryRun: true });
  assert.equal(r.loi, "LOI_DOC_SHEET");
  assert.equal(F.calls.fetch.length, 0);
  assert.equal(F.calls.writes.length, 0);
  assert.equal(F.snapshot(), before);
});

test("chayTatCa_: Master dự án hỏng (masterLoi) -> tin báo chỉ có mã dự án và số, NhatKy đếm vào cột Lỗi", () => {
  const khach = [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Trần Thị Crm", DuAnQuanTam: "bcons-central-park" })];
  const { F, ctx } = full({ khach, tuChoi: ["0900000009"], landingRows: [], crmRows: [], cauHinh: [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["bcons-central-park", "", "M2"]], byId: { L1: { Landing: [HEADERS] }, M1: {} } });
  const r = runAll(ctx);
  assert.deepEqual(r.phanBo.masterLoi, ["bcons-central-park"]);
  assert.equal(r.loi, "LOI_MASTER");
  const tg = tgTexts(F);
  assert.equal(tg.length, 1);
  assert.match(tg[0], /bcons-central-park/);
  assert.match(tg[0], /1/);
  for (const x of ["Trần Thị Crm", "0900000009", "Khach", "M2"]) assert.ok(!tg[0].includes(x));
  const nk = nhatKy(F);
  assert.equal(nk.length, 2);
  assert.equal(nk[1][5], 1);
  assert.match(String(nk[1][6]), /LOI_MASTER/);
});

test("Telegram hỏng (fetch ném lỗi / mã khác 200) không bao giờ làm chayTatCa_ ném; NhatKy vẫn ghi", () => {
  for (const mode of ["throw", 500, 429]) {
    const { F, ctx } = full({ landingId: SECRET_ID, byId: { M1: {} } });
    if (mode === "throw") F.hooks.fetchError = true;
    else F.hooks.fetchCode = mode;
    const r = runAll(ctx);
    assert.equal(r.loi, "LOI_DOC_SHEET", String(mode));
    assert.equal(nhatKy(F).length, 2, String(mode));
  }
});

test("thiếu thuộc tính Telegram -> bỏ qua lặng lẽ, không gọi fetch, vẫn ghi NhatKy", () => {
  for (const props of [{}, { TELEGRAM_BOT_TOKEN: "t" }, { TELEGRAM_CHAT_ID: "1" }, { TELEGRAM_BOT_TOKEN: "  ", TELEGRAM_CHAT_ID: "1" }]) {
    const { F, ctx } = full({ props, landingId: SECRET_ID, byId: { M1: {} } });
    const r = runAll(ctx);
    assert.equal(r.loi, "LOI_DOC_SHEET");
    assert.equal(F.calls.fetch.length, 0);
    assert.equal(nhatKy(F).length, 2);
  }
});

test("baoLoi_: định dạng tin, cắt ngắn, dùng token trong URL, không ghi token ra Logger", () => {
  const { F, ctx, logs } = full();
  ctx.baoLoi_("LOI_TAB", 3);
  assert.equal(F.calls.fetch.length, 1);
  const f = F.calls.fetch[0];
  assert.equal(f.url, "https://api.telegram.org/botTOKEN-BI-MAT-123/sendMessage");
  assert.equal(f.options.method, "post");
  assert.equal(f.options.muteHttpExceptions, true);
  const body = JSON.parse(f.options.payload);
  assert.equal(body.chat_id, "-100777");
  assert.match(body.text, /LOI_TAB/);
  assert.match(body.text, /3/);
  assert.ok(!logs.join("").includes("TOKEN-BI-MAT"));
  ctx.baoLoi_("X".repeat(9000), 1);
  assert.ok(JSON.parse(F.calls.fetch[1].options.payload).text.length <= 4000);
});

test("báo lỗi lặp: cùng loại lỗi trong 6 giờ chỉ gửi một tin; sau 6 giờ hoặc loại khác thì gửi lại", () => {
  const { F, ctx } = full({ landingId: SECRET_ID, byId: { M1: {} } });
  runAll(ctx);
  runAll(ctx, { now: new Date(NOW.getTime() + 15 * 60000) });
  runAll(ctx, { now: new Date(NOW.getTime() + 5 * 3600 * 1000) });
  assert.equal(F.calls.fetch.length, 1);
  assert.equal(nhatKy(F).length, 4, "NhatKy vẫn ghi mỗi lần chạy");
  runAll(ctx, { now: new Date(NOW.getTime() + 6 * 3600 * 1000 + 1000) });
  assert.equal(F.calls.fetch.length, 2);
});

test("báo lỗi lặp: lỗi đổi loại thì gửi ngay; sạch >= 1 giờ rồi lỗi lại thì gửi lại", () => {
  const { F, ctx } = full();
  const at = (min) => ({ now: new Date(NOW.getTime() + min * 60000) });
  F.hooks.onRead = () => { throw new Error("Lock timeout"); };
  assert.equal(runAll(ctx, at(0)).loi, "LOI_KHOA");
  assert.equal(F.calls.fetch.length, 1);
  F.hooks.onRead = () => { throw new Error("Service invoked too many times"); };
  assert.equal(runAll(ctx, at(1)).loi, "LOI_HAN_MUC");
  assert.equal(F.calls.fetch.length, 2);
  runAll(ctx, at(2));
  assert.equal(F.calls.fetch.length, 2, "cùng loại, chưa đủ 6 giờ");
  F.hooks.onRead = null;
  assert.equal(runAll(ctx, at(3)).loi, "");
  assert.equal(runAll(ctx, at(70)).loi, ""); // đã sạch >= 1 giờ kể từ lần sạch đầu
  F.hooks.onRead = () => { throw new Error("Service invoked too many times"); };
  runAll(ctx, at(71));
  assert.equal(F.calls.fetch.length, 3, "sạch đủ lâu rồi lỗi lại phải báo lại");
});

test("báo lỗi chập chờn: lỗi, ổn, lỗi, ổn trong vòng một giờ -> chỉ MỘT tin; lỗi quay lại thì mốc 'sạch' bị đặt lại", () => {
  const { F, ctx } = full();
  const at = (min) => ({ now: new Date(NOW.getTime() + min * 60000) });
  const bad = () => { F.hooks.onRead = () => { throw new Error("Service invoked too many times"); }; };
  const good = () => { F.hooks.onRead = null; };
  bad(); runAll(ctx, at(0));
  good(); runAll(ctx, at(15));
  bad(); runAll(ctx, at(30));
  good(); runAll(ctx, at(45));
  bad(); runAll(ctx, at(60));
  assert.equal(F.calls.fetch.length, 1);
  // lỗi tại phút 60 đã đặt lại mốc sạch: sạch phút 75 và 120 (chỉ 45 phút) chưa đủ xóa, lỗi phút 121 vẫn bị nén
  good(); runAll(ctx, at(75)); runAll(ctx, at(120));
  bad(); runAll(ctx, at(121));
  assert.equal(F.calls.fetch.length, 1);
});

test("báo lỗi lặp: khóa chống lặp theo loại, không theo danh sách mã dự án (LOI_MASTER đổi mã vẫn một tin)", () => {
  const { F, ctx } = full();
  ctx.baoLoi_("LOI_MASTER bcons-aaa, bcons-bbb", 2, NOW, "LOI_MASTER");
  ctx.baoLoi_("LOI_MASTER bcons-aaa", 1, new Date(NOW.getTime() + 60000), "LOI_MASTER");
  assert.equal(F.calls.fetch.length, 1);
});

test("LOI_MASTER qua chayTatCa_: tập mã hỏng thay đổi giữa hai lần chạy vẫn chỉ một tin", () => {
  const khach = [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Trần Thị Crm", DuAnQuanTam: "bcons-newsky" })];
  const cau = [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["bcons-aaa", "", "M2"], ["bcons-bbb", "", "M3"]];
  const { F, ctx } = full({ khach, tuChoi: ["0900000009"], landingRows: [], crmRows: [], cauHinh: cau, byId: { L1: { Landing: [HEADERS] }, M1: {} } });
  assert.deepEqual(runAll(ctx).phanBo.masterLoi, ["bcons-aaa", "bcons-bbb"]);
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CauHinh").getRange(4, 3, 1, 1).setValues([["M1"]]);
  assert.deepEqual(runAll(ctx, { now: new Date(NOW.getTime() + 15 * 60000) }).phanBo.masterLoi, ["bcons-aaa"]);
  assert.equal(F.calls.fetch.length, 1);
});

test("Telegram trả 401/429/500 (muteHttpExceptions không ném): KHÔNG đặt cờ chống lặp, lần lỗi sau thử gửi lại; 200 thì đặt cờ", () => {
  for (const code of [401, 429, 500, 400, 302]) {
    const { F, ctx } = full({ landingId: SECRET_ID, byId: { M1: {} } });
    F.hooks.fetchCode = code;
    runAll(ctx);
    assert.equal(F.props.MD_BAO_LOI_CUOI, undefined, "mã " + code);
    runAll(ctx, { now: new Date(NOW.getTime() + 60000) });
    assert.equal(F.calls.fetch.length, 2, "mã " + code);
    F.hooks.fetchCode = 200;
    runAll(ctx, { now: new Date(NOW.getTime() + 120000) });
    assert.match(F.props.MD_BAO_LOI_CUOI, /^LOI_DOC_SHEET\|\d+$/);
    assert.equal(F.calls.fetch.length, 3);
    runAll(ctx, { now: new Date(NOW.getTime() + 180000) });
    assert.equal(F.calls.fetch.length, 3, "đã gửi được thì nén");
  }
});

test("sendTelegram_: chỉ true khi mã trả về đúng 200", () => {
  const { F, ctx } = full();
  assert.equal(ctx.sendTelegram_("x"), true);
  for (const c of [201, 204, 401, 500]) {
    F.hooks.fetchCode = c;
    assert.equal(ctx.sendTelegram_("x"), false, String(c));
  }
});

test("hai lần chạy chồng: lần hai (gọi lại lúc lần một đang đọc) thoát lặng lẽ skipped:true, không ghi, không báo", () => {
  const { F, ctx } = full();
  let inner = null;
  F.hooks.onRead = () => {
    if (inner) return;
    inner = runAll(ctx);
  };
  const w0 = F.calls.writes.length;
  const r = runAll(ctx);
  assert.equal(inner.skipped, true);
  assert.equal(inner.loi, "");
  assert.equal(r.loi, "");
  assert.equal(F.calls.fetch.length, 0);
  assert.equal(nhatKy(F).length, 2, "chỉ lần chạy ngoài ghi NhatKy");
  assert.ok(F.calls.writes.length > w0);
  assert.equal(F.calls.lock.filter((x) => x === "wait").length, 0, "bước trong dùng khóa của bên ngoài, không tự chờ (không bế tắc)");
});

test("khóa bận (tiến trình khác giữ): skipped:true, không đọc không ghi, không báo lỗi, không NhatKy", () => {
  const { F, ctx } = full();
  F.hooks.lockBusy = true;
  let reads = 0;
  F.hooks.onRead = () => { reads++; };
  const r = runAll(ctx);
  assert.deepEqual([r.skipped, r.loi], [true, ""]);
  assert.equal(reads, 0);
  assert.equal(F.calls.writes.length, 0);
  assert.equal(F.calls.fetch.length, 0);
});

test("khóa luôn được nhả (thành công và khi lỗi), và lần chạy sau chạy được", () => {
  const ok = full();
  runAll(ok.ctx);
  assert.deepEqual(ok.F.calls.lock, ["tryLock", "release"]);
  const bad = full({ landingId: SECRET_ID, byId: { M1: {} } });
  runAll(bad.ctx);
  assert.deepEqual(bad.F.calls.lock, ["tryLock", "release"]);
  const r = runAll(bad.ctx, { now: new Date(NOW.getTime() + 86400000) });
  assert.equal(r.skipped, undefined);
});

test("ghi NhatKy hỏng giữa chừng không ném ra ngoài chayTatCa_: trả LOI_KHAC và báo một tin", () => {
  const { F, ctx } = full();
  F.hooks.onWrite = (i) => { if (i.sheet === "NhatKy" && i.method === "setValues" && i.row > 1) throw new Error("hỏng bất ngờ"); };
  const r = runAll(ctx);
  assert.equal(r.loi, "LOI_KHAC");
  assert.equal(tgTexts(F).length, 1);
  assert.deepEqual(F.calls.lock, ["tryLock", "release"]);
});

test("gopNgay / chayThu / chayTatCaTuDong: nguồn và dryRun đúng; alert chỉ có số", () => {
  const e = full();
  e.ctx.chayThu();
  assert.equal(e.F.calls.writes.length, 0);
  assert.equal(e.F.ui.alerts.length, 1);
  assert.match(e.F.ui.alerts[0], /\d/);
  e.ctx.gopNgay();
  assert.equal(nhatKy(e.F)[1][1], "Gộp ngay");
  assert.equal(e.F.ui.alerts.length, 2);
  for (const x of [...SECRET_NAMES, ...SECRET_PHONES]) assert.ok(!e.F.ui.alerts.join("").includes(x));
  e.ctx.chayTatCaTuDong();
  assert.equal(nhatKy(e.F)[2][1], "Tự động");
  assert.equal(e.F.ui.alerts.length, 2, "chạy tự động không hiện alert");
});

test("chayThu: alert nêu đủ các số của ba bước", () => {
  const e = full();
  e.ctx.chayThu();
  const a = e.F.ui.alerts[0];
  assert.match(a, /^Chạy thử/);
  assert.ok(a.includes("Landing: đọc 3, mới 1, trùng 1, lỗi 1"), a);
  assert.ok(a.includes("CRM: đọc 2, mới 1, trùng 0, lỗi 1"), a);
  assert.match(a, /Phân bổ: .*chưa có mã dự án \d+, rút lại \d+, đồng ý lại \d+, xóa \d+/);
});

test("gopNgay khi bị bỏ qua (khóa bận) báo anh thử lại, không ném", () => {
  const e = full();
  e.F.hooks.lockBusy = true;
  e.ctx.gopNgay();
  assert.equal(e.F.ui.alerts.length, 1);
  assert.match(e.F.ui.alerts[0], /đang chạy/);
});

test("gopNgay khi lỗi: alert chỉ có mã lỗi", () => {
  const e = full({ landingId: SECRET_ID, byId: { M1: {} } });
  e.ctx.gopNgay();
  assert.match(e.F.ui.alerts[0], /LOI_DOC_SHEET/);
  assert.ok(!e.F.ui.alerts[0].includes(SECRET_ID));
});

test("onOpen: menu Master_Data với ba mục đúng tên và hàm", () => {
  const e = full();
  e.ctx.onOpen();
  assert.equal(e.F.ui.menus.length, 1);
  assert.equal(e.F.ui.menus[0].name, "Master_Data");
  assert.deepEqual(plain(e.F.ui.menus[0].items), [["Gộp ngay", "gopNgay"], ["Chạy thử (không ghi)", "chayThu"], ["Cài lịch tự động", "caiLichTuDong"]]);
  for (const [, fn] of e.F.ui.menus[0].items) assert.equal(typeof e.ctx[fn], "function", fn);
});

test("caiLichTuDong (mục menu): cài lịch và báo bằng alert", () => {
  const e = full();
  e.ctx.caiLichTuDong();
  assert.equal(e.F.triggers.length, 2);
  assert.equal(e.F.ui.alerts.length, 1);
});

test("caiLich_: đúng hai trigger (15 phút, 8:00 hằng ngày); chạy hai lần vẫn hai; trigger lạ không bị xóa; trigger cũ trùng tên bị thay", () => {
  const { F, ctx } = full();
  ctx.ScriptApp.newTrigger("khacNua").timeBased().everyMinutes(5).create();
  ctx.ScriptApp.newTrigger("chayTatCaTuDong").timeBased().everyMinutes(30).create();
  ctx.ScriptApp.newTrigger("baoCaoNgayTuDong").timeBased().atHour(3).everyDays(1).create();
  ctx.caiLich_();
  ctx.caiLich_();
  const mine = F.triggers.filter((t) => t.fn !== "khacNua");
  assert.equal(F.triggers.length, 3);
  assert.equal(mine.length, 2);
  const a = mine.find((t) => t.fn === "chayTatCaTuDong");
  const b = mine.find((t) => t.fn === "baoCaoNgayTuDong");
  assert.deepEqual([a.kind, a.every], ["minutes", 15]);
  assert.deepEqual([b.kind, b.every, b.hour], ["days", 1, 8]);
  assert.ok(F.triggers.some((t) => t.fn === "khacNua"));
});

test("hàm điểm vào của trigger tồn tại", () => {
  const { ctx } = full();
  for (const f of ["chayTatCaTuDong", "baoCaoNgayTuDong", "gopNgay", "chayThu", "onOpen", "caiLichTuDong"]) assert.equal(typeof ctx[f], "function", f);
});

test("baoCaoNgayTuDong: lỗi khi đọc -> báo loại lỗi, không ném", () => {
  const { F, ctx } = full();
  F.hooks.onRead = () => { throw new Error("Boom"); };
  assert.doesNotThrow(() => ctx.baoCaoNgayTuDong());
  const t = tgTexts(F);
  assert.equal(t.length, 1);
  assert.match(t[0], /LOI_KHAC/);
});

// baoCaoNgay_: hôm qua theo giờ Asia/Ho_Chi_Minh (UTC+7). NOW = 11/11 08:00 giờ VN, nên "hôm qua" = 10/11.
const khAt = (ngayTao, nguon, i) => khRow({ MaKhach: pad(i), SDT: "09000000" + String(10 + i), NgayTao: ngayTao, NguonGoc: nguon });
function baoCaoFixture(asDate = false) {
  const d = (iso) => (asDate ? new Date(iso) : iso);
  return full({
    khach: [
      khAt(d("2026-11-09T16:59:59.000Z"), "Landing", 1), // 09/11 23:59:59 VN: không tính
      khAt(d("2026-11-09T17:00:00.000Z"), "Landing", 2), // 10/11 00:00:00 VN: tính
      khAt(d("2026-11-10T09:00:00.000Z"), "CRM", 3), // tính
      khAt(d("2026-11-10T16:59:59.000Z"), "Landing", 4), // 10/11 23:59:59 VN: tính
      khAt(d("2026-11-10T17:00:00.000Z"), "CRM", 5), // 11/11 00:00 VN: không tính
      khAt("không phải ngày", "Landing", 6), // rác: không tính, không ném
      khAt(d("2026-11-10T10:00:00.000Z"), "Nguồn lạ Khách A", 7), // tính vào Khác, không in nguồn lạ
    ],
    masterExtra: {
      ChuaPhanDuAn: [[...KHACH_COLS, "GanDuAn"], khRow({ MaKhach: pad(8) }), khRow({ MaKhach: pad(9) }), new Array(KHACH_COLS.length + 1).fill("")],
      Loi: [["Thời gian", "Nguồn", "Dòng", "Lý do"], ["2026-11-10T01:00:00.000Z", "Landing", 3, "SĐT không hợp lệ"]],
      TuChoi: [["SDT", "LyDo", "NgayGhi"], ["0900000099", "x", d("2026-11-10T03:00:00.000Z")], ["0900000098", "x", d("2026-11-09T03:00:00.000Z")]],
    },
  });
}
test("baoCaoNgay_: đếm đúng quanh nửa đêm Asia/Ho_Chi_Minh, theo nguồn, chỉ số", () => {
  for (const asDate of [false, true]) {
    const { F, ctx } = baoCaoFixture(asDate);
    const before = F.snapshot();
    const text = ctx.baoCaoNgay_({ now: NOW });
    assert.equal(text, "📊 Master_Data hôm qua: 4 khách mới (Landing 2, CRM 1, Khác 1). Chưa phân dự án: 2. Dòng lỗi: 1. Rút lại: 1.", String(asDate));
    assert.deepEqual(tgTexts(F), [text]);
    assert.equal(F.snapshot(), before, "chỉ đọc");
    assert.equal(F.calls.writes.length, 0);
  }
});

test("baoCaoNgay_: ngày mặc định là hôm nay theo giờ VN; 17:00 UTC đã sang ngày mới ở VN", () => {
  const { ctx } = baoCaoFixture(false);
  // 10/11 17:00 UTC = 11/11 00:00 VN: hôm qua = 10/11 (đúng như NOW)
  const t = ctx.baoCaoNgay_({ now: new Date("2026-11-10T17:00:00.000Z") });
  assert.match(t, /4 khách mới/);
  // 10/11 16:59 UTC = 10/11 23:59 VN: hôm qua = 09/11, chỉ có 1 khách (09/11 23:59:59 VN)
  const t2 = ctx.baoCaoNgay_({ now: new Date("2026-11-10T16:59:00.000Z") });
  assert.match(t2, /1 khách mới \(Landing 1\)/);
});

test("baoCaoNgay_: không có tab nào -> toàn số 0, không ném; thiếu thuộc tính Telegram -> không gửi", () => {
  const F = fakeSheets({ master: {}, props: {} });
  const ctx = loadGs([LOGIC, SHEETS]);
  Object.assign(ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService, PropertiesService: F.PropertiesService, UrlFetchApp: F.UrlFetchApp, ScriptApp: F.ScriptApp, Logger: { log() {} } });
  const text = ctx.baoCaoNgay_({ now: NOW });
  assert.equal(text, "📊 Master_Data hôm qua: 0 khách mới. Chưa phân dự án: 0. Dòng lỗi: 0. Rút lại: 0.");
  assert.equal(F.calls.fetch.length, 0);
});

test("baoCaoNgay_: Telegram hỏng không làm ném", () => {
  const { F, ctx } = baoCaoFixture();
  F.hooks.fetchError = true;
  assert.doesNotThrow(() => ctx.baoCaoNgay_({ now: NOW }));
  F.hooks.fetchError = false;
  F.hooks.fetchCode = 500;
  assert.doesNotThrow(() => ctx.baoCaoNgay_({ now: NOW }));
});

test("ghiNhatKy_: tab NhatKy chưa có thì tạo kèm tiêu đề rồi ghi một dòng", () => {
  const F = fakeSheets({ master: {} });
  const ctx = loadGs([LOGIC, SHEETS]);
  Object.assign(ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService, PropertiesService: F.PropertiesService, UrlFetchApp: F.UrlFetchApp, ScriptApp: F.ScriptApp, Logger: { log() {} } });
  ctx.ghiNhatKy_(F.SpreadsheetApp.getActiveSpreadsheet(), { now: NOW, nguon: "Gộp ngay", doc: 5, moi: 2, trung: 1, loi: 3, ghiChu: "chua=2 chan=1 tuchoi=1 khong=0" });
  const nk = F.values(null, "NhatKy");
  assert.equal(nk.length, 2);
  assert.deepEqual(nk[1].map((x) => (x instanceof Date ? x.toISOString() : x)), [NOW.toISOString(), "Gộp ngay", 5, 2, 1, 3, "chua=2 chan=1 tuchoi=1 khong=0"]);
});

test("appsscript.json: múi giờ Asia/Ho_Chi_Minh, V8, Stackdriver, đủ và tối thiểu các quyền", () => {
  const j = JSON.parse(fs.readFileSync(path.join(here, "apps-script", "appsscript.json"), "utf8"));
  assert.equal(j.timeZone, "Asia/Ho_Chi_Minh");
  assert.equal(j.runtimeVersion, "V8");
  assert.equal(j.exceptionLogging, "STACKDRIVER");
  assert.deepEqual([...j.oauthScopes].sort(), [
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
});

test("baoLoi_: kho thuộc tính script hỏng (ném lỗi) cũng không làm ném", () => {
  const { ctx } = full();
  ctx.PropertiesService = { getScriptProperties: () => { throw new Error("hỏng"); } };
  assert.doesNotThrow(() => ctx.baoLoi_("LOI_KHAC", 1));
  assert.doesNotThrow(() => ctx.sendTelegram_("x"));
});

// ---------------- Task 9 (sửa theo review) ----------------
const days = (n) => new Date(NOW.getTime() + n * 86400000);
const idleFull = () => full({ landingRows: [], crmRows: [], khach: [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Khach Cu", DongYNhanTin: "Có", DuAnQuanTam: "bcons-newsky" })], byId: { L1: { Landing: [HEADERS] }, M1: {} } });

test("chạy rảnh (không có gì): không ghi NhatKy, trừ một dòng nhịp mỗi ngày giờ VN", () => {
  const { F, ctx } = idleFull();
  runAll(ctx); // lần đầu có phân bổ khách vào M1 -> không rảnh
  const rows0 = nhatKy(F).length;
  const r1 = runAll(ctx, { now: new Date(NOW.getTime() + 15 * 60000) });
  assert.equal(r1.loi, "");
  const nk = nhatKy(F);
  assert.equal(nk.length, rows0 + 1, "nhịp đầu tiên trong ngày");
  assert.equal(nk[nk.length - 1][6], "nhịp: đang chạy, không có gì mới");
  assert.deepEqual(nk[nk.length - 1].slice(2, 6), [0, 0, 0, 0]);
  runAll(ctx, { now: new Date(NOW.getTime() + 30 * 60000) });
  runAll(ctx, { now: new Date(NOW.getTime() + 45 * 60000) });
  assert.equal(nhatKy(F).length, rows0 + 1, "cùng ngày VN chỉ một dòng nhịp");
  // 11/11 08:00 VN; +16h = 12/11 00:00 VN: ngày mới
  runAll(ctx, { now: new Date(NOW.getTime() + 16 * 3600 * 1000) });
  assert.equal(nhatKy(F).length, rows0 + 2, "sang ngày VN mới có thêm một dòng nhịp");
  runAll(ctx, { now: new Date(NOW.getTime() + 16 * 3600 * 1000 + 60000) });
  assert.equal(nhatKy(F).length, rows0 + 2);
  assert.equal(F.props.MD_NHIP_NGAY, "2026-11-12");
});

test("ngày nhịp tính theo giờ Việt Nam, không theo UTC: 16:59Z và 17:00Z (cùng ngày UTC) là hai ngày VN", () => {
  const { F, ctx } = idleFull();
  runAll(ctx, { now: new Date("2026-11-10T00:00:00.000Z") });
  const n0 = nhatKy(F).length;
  runAll(ctx, { now: new Date("2026-11-10T16:59:00.000Z") });
  assert.equal(nhatKy(F).length, n0 + 1); // 10/11 23:59 VN, nhịp của 10/11 (khác ngày của lần chạy đầu? cùng 10/11)
  runAll(ctx, { now: new Date("2026-11-10T17:00:00.000Z") });
  assert.equal(nhatKy(F).length, n0 + 2); // 11/11 00:00 VN
});

test("lần chạy chỉ chuyển khách (dayVao > 0) KHÔNG phải rảnh: luôn ghi NhatKy với vao=", () => {
  const { F, ctx } = idleFull();
  const r = runAll(ctx);
  assert.ok(r.phanBo.dayVao["bcons-newsky"] > 0);
  assert.equal(r.landing.doc + r.crm.doc, 0);
  const nk = nhatKy(F);
  assert.equal(nk.length, 2);
  assert.match(nk[1][6], /vao=1 /);
  assert.notEqual(nk[1][6], "nhịp: đang chạy, không có gì mới");
});

test("mỗi mục làm lần chạy thành không rảnh: đọc, mới, trùng, lỗi, xóa, tuchoi, khong", () => {
  // landing có một dòng lỗi (loi) và một mới
  let e = full({ landingRows: [leadRow({ ten: "Ten A", sdt: "0900000005", badPhone: "12345" })], crmRows: [] });
  runAll(e.ctx);
  const n = nhatKy(e.F).length;
  assert.equal(n, 2);
  // sau lần đầu, các lần sau rảnh: chỉ nhịp
  e = idleFull();
  runAll(e.ctx); runAll(e.ctx, { now: new Date(NOW.getTime() + 60000) });
  const base = nhatKy(e.F).length;
  // TuChoi loại Xóa -> xoa > 0
  const sdt0 = e.F.values(null, "KhachHang")[1][KHACH_COLS.indexOf("SDT")];
  e.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TuChoi").getRange(2, 1, 1, 5).setValues([[sdt0, "", "2026-11-05T00:00:00.000Z", "Xóa", ""]]);
  const r = runAll(e.ctx, { now: new Date(NOW.getTime() + 120000) });
  assert.ok(r.phanBo.xoa >= 1);
  assert.equal(nhatKy(e.F).length, base + 1);
  assert.match(nhatKy(e.F)[base][6], /tuchoi=1/);
});

test("MD_CHAY_CUOI được ghi mỗi lần chạy (kể cả rảnh, lỗi), không ghi khi dryRun hoặc bị bỏ qua", () => {
  const { F, ctx } = idleFull();
  runAll(ctx, { now: new Date(NOW.getTime() + 1000) });
  assert.equal(F.props.MD_CHAY_CUOI, String(NOW.getTime() + 1000));
  runAll(ctx, { now: new Date(NOW.getTime() + 2000) }); // rảnh
  assert.equal(F.props.MD_CHAY_CUOI, String(NOW.getTime() + 2000));
  runAll(ctx, { now: new Date(NOW.getTime() + 3000), dryRun: true });
  assert.equal(F.props.MD_CHAY_CUOI, String(NOW.getTime() + 2000));
  F.hooks.lockBusy = true;
  runAll(ctx, { now: new Date(NOW.getTime() + 4000) });
  assert.equal(F.props.MD_CHAY_CUOI, String(NOW.getTime() + 2000));
  F.hooks.lockBusy = false;
  const bad = full({ landingId: SECRET_ID, byId: { M1: {} } });
  runAll(bad.ctx, { now: new Date(NOW.getTime() + 5000) });
  assert.equal(bad.F.props.MD_CHAY_CUOI, String(NOW.getTime() + 5000));
});

test("ghi chú NhatKy có ms= (thời gian chạy theo đồng hồ chèn vào)", () => {
  const { F, ctx } = full();
  let t = 1000;
  runAll(ctx, { clock: () => (t += 250) });
  assert.match(nhatKy(F)[1][6], / ms=\d+$/);
  assert.ok(Number(/ms=(\d+)/.exec(nhatKy(F)[1][6])[1]) >= 250);
});

test("baoCaoNgay_: thêm 'Lần chạy cuối: N phút trước' từ MD_CHAY_CUOI; thiếu thì bỏ câu", () => {
  const { F, ctx } = baoCaoFixture();
  assert.ok(!ctx.baoCaoNgay_({ now: NOW }).includes("Lần chạy cuối"));
  F.props.MD_CHAY_CUOI = String(NOW.getTime() - 7 * 60000 - 20000);
  assert.ok(ctx.baoCaoNgay_({ now: NOW }).endsWith(" Lần chạy cuối: 7 phút trước."));
  F.props.MD_CHAY_CUOI = String(NOW.getTime() + 5000); // đồng hồ lệch
  assert.ok(ctx.baoCaoNgay_({ now: NOW }).endsWith(" Lần chạy cuối: 0 phút trước."));
  F.props.MD_CHAY_CUOI = "rác";
  assert.ok(!ctx.baoCaoNgay_({ now: NOW }).includes("Lần chạy cuối"));
});

test("errorClass_: bảng thông báo kiểu thật -> mã", () => {
  const { ctx } = full();
  const T = [
    ["Exception: Authorization is required to perform that action.", "LOI_QUYEN"],
    ["Exception: You do not have permission to call SpreadsheetApp.openById. Required permissions: https://www.googleapis.com/auth/spreadsheets", "LOI_QUYEN"],
    ["Exception: You do not have permission to access the requested document.", "LOI_DOC_SHEET"],
    ["Exception: Requested entity was not found.", "LOI_DOC_SHEET"],
    ["Exception: Unexpected error while getting the method or property openById on object SpreadsheetApp.", "LOI_DOC_SHEET"],
    ["Không mở được Sheet: abc", "LOI_DOC_SHEET"],
    ["Exception: Service Spreadsheets failed while accessing document with id 1AbC.", "LOI_DOC_SHEET"],
    ["Exception: Range not found", "LOI_TAB"],
    ["Tab NhapCRM thiếu cột DaGop.", "LOI_TAB"],
    ["Exception: Lock timeout: Could not obtain lock after 10000 milliseconds.", "LOI_KHOA"],
    ["Không lấy được khóa", "LOI_KHOA"],
    ["Exception: Service invoked too many times for one day: urlfetch.", "LOI_HAN_MUC"],
    ["Exception: Service invoked too many times in a short time: exec qps. Try Utilities.sleep(1000) between calls.", "LOI_HAN_MUC"],
    ["Exception: Quota exceeded for this service", "LOI_HAN_MUC"],
    ["Exception: Service Spreadsheets timed out while accessing document with id 1AbC", "LOI_HET_GIO"],
    ["Exceeded maximum execution time", "LOI_HET_GIO"],
    ["TypeError: Cannot read properties of undefined (reading 'getRange')", "LOI_KHAC"],
    ["Block", "LOI_KHAC"],
    ["Sheet 1BlockedXyz bất ngờ", "LOI_KHAC"],
  ];
  for (const [m, want] of T) assert.equal(ctx.errorClass_(new Error(m)), want, m);
  assert.equal(ctx.errorClass_(new TypeError("x is not a function")), "LOI_KHAC");
});

test("giới hạn thời gian: quá 270000 ms giữa các bước -> dừng, không chạy bước tiếp, NhatKy có LOI_HET_GIO, một tin", () => {
  const mk = (seq) => { let i = 0; return () => seq[Math.min(i++, seq.length - 1)]; };
  // sau bước 1
  let e = full();
  let r = runAll(e.ctx, { clock: mk([0, 270001]) });
  assert.equal(r.loi, "LOI_HET_GIO");
  assert.ok(r.landing);
  assert.equal(r.crm, undefined);
  assert.equal(r.phanBo, undefined);
  assert.equal(e.F.values(null, "KhachHang").length, 3, "bước 2 không ghi khách CRM (chỉ khách mới của landing)");
  assert.match(nhatKy(e.F)[1][6], /LOI_HET_GIO/);
  assert.equal(tgTexts(e.F).length, 1);
  assert.match(tgTexts(e.F)[0], /LOI_HET_GIO/);
  // sau bước 2: bước 3 không chạy
  e = full();
  r = runAll(e.ctx, { clock: mk([0, 100, 400000]) });
  assert.equal(r.loi, "LOI_HET_GIO");
  assert.ok(r.crm);
  assert.equal(r.phanBo, undefined);
  assert.ok(!e.F.calls.openById.includes("M1"));
  // đúng 270000 chưa quá
  e = full();
  r = runAll(e.ctx, { clock: mk([0, 270000, 270000, 270000]) });
  assert.equal(r.loi, "");
  assert.ok(r.phanBo);
});

test("giới hạn thời gian: dryRun không ghi NhatKy, không báo", () => {
  const { F, ctx } = full();
  let i = 0;
  const r = runAll(ctx, { dryRun: true, clock: () => (i++ === 0 ? 0 : 999999) });
  assert.equal(r.loi, "LOI_HET_GIO");
  assert.equal(F.calls.fetch.length, 0);
  assert.equal(F.values(null, "NhatKy"), null);
});

test("caiLich_: tạo trigger mới TRƯỚC rồi xóa cũ; newTrigger lỗi thì trigger cũ còn nguyên và không để sót trigger mới", () => {
  for (const failFn of ["chayTatCaTuDong", "baoCaoNgayTuDong"]) {
    const { F, ctx } = full();
    ctx.ScriptApp.newTrigger("chayTatCaTuDong").timeBased().everyMinutes(30).create();
    ctx.ScriptApp.newTrigger("baoCaoNgayTuDong").timeBased().atHour(3).everyDays(1).create();
    const olds = F.triggers.slice();
    F.hooks.triggerFail = failFn;
    assert.throws(() => ctx.caiLich_());
    assert.equal(F.triggers.length, 2, failFn);
    assert.deepEqual(F.triggers.map((t) => t.id), olds.map((t) => t.id), failFn);
    F.hooks.triggerFail = null;
    ctx.caiLich_();
    assert.equal(F.triggers.length, 2);
    assert.ok(F.triggers.every((t) => !olds.includes(t)));
  }
});

test("caiLichTuDong: lời báo nói tin tóm tắt khoảng 8-9 giờ", () => {
  const e = full();
  e.ctx.caiLichTuDong();
  assert.match(e.F.ui.alerts[0], /khoảng 8-9 giờ/);
});

test("mã dự án trong tin báo: chỉ mã đúng dạng ^[a-z][a-z0-9-]{2,39}$; còn lại hiện 'mã lạ'", () => {
  const { ctx } = full();
  assert.equal(ctx.maDuAnAnToan_(["bcons-central-park", "Nguyen Van A", "0981234567", "ab", "a".repeat(41), "bcons-newsky", "ChuaPhanDuAn"]), "bcons-central-park, mã lạ, mã lạ, mã lạ, mã lạ, bcons-newsky, ChuaPhanDuAn");
  assert.equal(ctx.maDuAnAnToan_(["abc"]), "abc");
  assert.equal(ctx.maDuAnAnToan_(["a" + "b".repeat(39)]), "a" + "b".repeat(39));
});

test("mã dự án lạ gõ ở CauHinh (tên người) không tới được Telegram", () => {
  const khach = [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Trần Thị Crm", DuAnQuanTam: "bcons-newsky" })];
  const cau = [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["Nguyễn Văn Kín", "", "M2"]];
  const { F, ctx } = full({ khach, tuChoi: ["0900000009"], landingRows: [], crmRows: [], cauHinh: cau, byId: { L1: { Landing: [HEADERS] }, M1: {} } });
  const r = runAll(ctx);
  assert.equal(r.loi, "LOI_MASTER");
  assert.ok(!tgTexts(F)[0].includes("Nguyễn"));
  assert.match(tgTexts(F)[0], /mã lạ/);
});

test("lần chạy chỉ có khách rút lại (vao = 0) không phải rảnh; khách DuAnQuanTam trống một mình (chỉ đếm chuaCoDuAn) thì rảnh", () => {
  const mk = (khach, tuChoi) => full({ landingRows: [], crmRows: [], khach, tuChoi, byId: { L1: { Landing: [HEADERS] }, M1: {} } });
  const rut = mk([khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Khach Cu", DuAnQuanTam: "bcons-central-park" })], [["0900000009", "", TC_OLD, "Rút lại", ""]]);
  const r = runAll(rut.ctx);
  assert.equal(r.phanBo.rutLai, 1);
  assert.equal(r.phanBo.dayVao["bcons-newsky"], 0);
  assert.equal(nhatKy(rut.F).length, 2);
  assert.match(nhatKy(rut.F)[1][6], /^rutlai=1 dongylai=0 xoa=0 .* vao=0 /);
  assert.notEqual(nhatKy(rut.F)[1][6], "nhịp: đang chạy, không có gì mới");
  const blank = mk([khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Khach Cu", DuAnQuanTam: "" })]);
  const rb = runAll(blank.ctx);
  assert.equal(rb.phanBo.chuaCoDuAn, 1);
  assert.equal(nhatKy(blank.F)[1][6], "nhịp: đang chạy, không có gì mới");
});

test("lần chạy chỉ có khách điền lại (dongYLai > 0, không ai vào dự án) không phải rảnh", () => {
  const { F, ctx } = full({ landingRows: [], crmRows: [], khach: [consented(pad(1), "0900000009", "Khach Cu", "bcons-central-park", "2026-11-10")], tuChoi: [["0900000009", "", TC_OLD, "Rút lại", ""]], byId: { L1: { Landing: [HEADERS] }, M1: {} } });
  const r = runAll(ctx);
  assert.equal(r.phanBo.dongYLai, 1);
  assert.equal(r.phanBo.dayVao["bcons-newsky"], 0);
  assert.match(nhatKy(F)[1][6], /^rutlai=0 dongylai=1 /);
});

// ---------------- Sửa sau review cuối ----------------
const tcLoiRows = (F) => (F.values(null, "Loi") || []).slice(1);

test("M1: SĐT trong TuChoi sai dạng -> Loi 'Rút lại' + số dòng (không ghi giá trị), tuChoiLoi đếm, việc khác vẫn chạy; dryRun không ghi", () => {
  const bad = "090000000"; // thiếu một số
  const mk = () => build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: [PHONES[0], bad, "abc"] });
  const d = mk();
  const snap = d.F.snapshot();
  const rd = run(d.ctx, { dryRun: true });
  assert.equal(rd.tuChoiLoi, 2);
  assert.equal(d.F.snapshot(), snap);
  assert.equal(w(d.F), 0);
  const { F, ctx } = mk();
  const r = run(ctx);
  assert.equal(r.tuChoiLoi, 2);
  assert.equal(r.xoa, 1); // số hợp lệ vẫn chặn
  assert.deepEqual(masterMa(F, "M1"), [pad(1)]); // khách khác vẫn được phân bổ
  const loi = tcLoiRows(F);
  assert.equal(loi.length, 2);
  assert.deepEqual([loi[0][1], loi[0][2], loi[0][3]], ["Rút lại", 3, "SĐT trong TuChoi không hợp lệ"]);
  assert.deepEqual([loi[1][1], loi[1][2]], ["Rút lại", 4]);
  assert.ok(!JSON.stringify(loi).includes(bad));
});

test("M1: chayTatCa_ đếm tuChoiLoi vào cột Lỗi của NhatKy và không coi là chạy rảnh", () => {
  const { F, ctx } = full({ landingRows: [], crmRows: [], khach: [], tuChoi: ["09000"] });
  const r = runAll(ctx);
  assert.equal(r.phanBo.tuChoiLoi, 1);
  assert.equal(r.loi, "");
  const nk = nhatKy(F);
  assert.equal(nk.length, 2);
  assert.equal(nk[1][5], 1);
});

test("M2: lỗi gốc ghi ra console.error đã che chuỗi giống SĐT; NhatKy/Telegram không đổi", () => {
  const { F, ctx } = full();
  const errs = [];
  ctx.console = { error: (...a) => errs.push(a.join(" ")) };
  F.hooks.onRead = () => { throw new Error("Boom 0900000001 va +84 90 000 0002 va 090.000.0003 sheet 1AbCdEf"); };
  const r = runAll(ctx);
  assert.equal(r.loi, "LOI_KHAC");
  const all = errs.join("\n");
  assert.ok(all.includes("Boom"), "phải ghi thông báo gốc");
  assert.ok(all.includes("1AbCdEf"));
  for (const p of ["0900000001", "90 000 0002", "090.000.0003", "0900000003"]) assert.ok(!all.includes(p), "lộ " + p);
  assert.ok(!tgTexts(F).join("").includes("Boom"));
  assert.ok(!JSON.stringify(nhatKy(F)).includes("Boom"));
});

test("M2: không có console (môi trường lạ) cũng không ném", () => {
  const { F, ctx } = full();
  F.hooks.onRead = () => { throw new Error("x"); };
  assert.equal(runAll(ctx).loi, "LOI_KHAC");
});

test("M3: tiêu đề KhachTuMaster sai -> LOI_TAB; tên dự án/thiếu quyền vẫn LOI_DOC_SHEET (bảng)", () => {
  const { ctx } = full();
  const T = [
    ["Không mở được hoặc tiêu đề sai ở tab KhachTuMaster của dự án: x.", "LOI_TAB"],
    ["Tab KhachTuMaster (bcons-x) có tiêu đề cột 3 sai, cần \"HoTen\".", "LOI_TAB"],
    ["Không mở được Sheet: abc", "LOI_DOC_SHEET"],
    ["Exception: Requested entity was not found.", "LOI_DOC_SHEET"],
  ];
  for (const [m, want] of T) assert.equal(ctx.errorClass_(new Error(m)), want, m);
});

test("M3: phanBo_ ném đúng thông báo tiêu đề sai và chayTatCa_ báo LOI_TAB", () => {
  const { F, ctx } = full({ landingRows: [], crmRows: [], khach: [khRow({ MaKhach: pad(1), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })], byId: { L1: { Landing: [HEADERS] }, M1: { KhachTuMaster: [["Sai", ...TM.slice(1)]] } } });
  assert.equal(runAll(ctx).loi, "LOI_TAB");
  assert.equal(tgTexts(F).length, 1);
});

function nBadLanding(n) {
  const rows = [];
  for (let i = 0; i < n; i++) rows.push(leadRow({ ten: "Khach " + i, sdt: PHONES[0], badPhone: "12" + i }));
  return rows;
}
test("M8: dưới ngưỡng (4 dòng lỗi) không báo; từ 5 thì đúng MỘT tin LOI_DONG; chạy lại không báo thêm; dryRun không báo", () => {
  const a = full({ landingRows: nBadLanding(4), crmRows: [] });
  runAll(a.ctx);
  assert.equal(tgTexts(a.F).length, 0);
  const b = full({ landingRows: nBadLanding(5), crmRows: [] });
  const dry = runAll(b.ctx, { dryRun: true });
  assert.equal(tgTexts(b.F).length, 0);
  assert.equal(dry.landing.loi, 5);
  runAll(b.ctx);
  const tg = tgTexts(b.F);
  assert.equal(tg.length, 1);
  assert.match(tg[0], /LOI_DONG/);
  assert.match(tg[0], /5/);
  runAll(b.ctx);
  assert.equal(tgTexts(b.F).length, 1);
});

test("M8: lỗi dòng gộp landing + CRM cộng lại (3 + 2 = 5) -> báo; LOI_DONG_NGUONG_ = 5", () => {
  const { F, ctx } = full({ landingRows: nBadLanding(3), crmRows: [["A", "12", "", "", ""], ["B", "13", "", "", ""]] });
  assert.equal(ctx.LOI_DONG_NGUONG_, 5);
  runAll(ctx);
  assert.equal(tgTexts(F).length, 1);
  assert.match(tgTexts(F)[0], /LOI_DONG/);
});

test("M10: tiêu đề landing gõ kiểu NFD (Unikey/điện thoại) vẫn nhận 'Đã gộp', 'Dự án' và các cột khác", () => {
  const nfd = HEADERS.map((h) => h.normalize("NFD"));
  assert.notEqual(nfd.join("|"), HEADERS.join("|"));
  const T = setup({ landingRows: [], extraById: { L1: { Landing: [nfd, leadRow({ ten: NAMES[1], sdt: PHONES[1] })] } } });
  const r = plain(T.ctx.gopLanding_({ dryRun: false, now: NOW }));
  assert.equal(r.moi, 1);
  const iGop = HEADERS.indexOf("Đã gộp");
  assert.match(String(T.F.values("L1", "Landing")[1][iGop]), /^KH-/);
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh[2][kh[0].indexOf("DuAnQuanTam")], "bcons-newsky");
  assert.equal(kh[2][kh[0].indexOf("NhuCau")], "Mua để ở");
});

test("M10: tiêu đề NhapCRM và tiêu đề tab đích gõ NFD/thừa khoảng trắng vẫn nhận", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })],
    byId: { M1: { KhachTuMaster: [TM.map((h, i) => (i === 2 ? " " + h + " " : h)), mrow(pad(1), PHONES[1], NAMES[1])] }, M2: {} },
  });
  assert.doesNotThrow(() => run(ctx));
  assert.ok(F);
});

test("L1: phanBo_ - 'Không rõ' không rút lại, không xóa, ghi Loi một lần mỗi dòng mỗi lần chạy, xử lý như Chưa rõ", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không rõ" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" })] });
  const r = run(ctx);
  assert.equal(r.xoa, 0);
  assert.equal(r.rutLai, 1); // khách 2 gõ 'Không' đúng khuôn: rút lại (khách 1 'Không rõ' thì không)
  assert.equal(khDoc(F)[0].SDT, PHONES[0]);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Không rõ"); // không ghi đè chữ của anh
  assert.deepEqual(masterMa(F, "M1"), [pad(1), pad(2)]);
  assert.equal(tab(F, "M1", "KhachTuMaster")[1][9], "Chưa rõ");
  assert.equal(tab(F, "M1", "KhachTuMaster")[2][9], "Đã rút lại");
  assert.deepEqual(tuChoiPhones(F), []);
  const loi = tcLoiRows(F);
  assert.equal(loi.length, 1);
  assert.deepEqual([loi[0][1], loi[0][2], loi[0][3]], ["Rút lại", 2, "Giá trị DongYNhanTin cần anh kiểm: ghi đúng Không để rút lại"]);
  assert.ok(!JSON.stringify(loi).includes(PHONES[0]));
});

test("Task 2 fix A: ba dự án, URL 250 ký tự: ghi lên Sheet (cell dài > 500) rồi đọc lại và gộp tiếp, đồng ý vẫn nguyên", () => {
  const urls = ["a", "b", "c"].map((c) => "https://x.pages.dev/" + c.repeat(230));
  const projects = ["bcons-aaa", "bcons-bbb", "bcons-ccc"];
  const landingRows = projects.map((duAn, i) => leadRow({ ten: NAMES[1], sdt: PHONES[1], duAn, trang: urls[i], at: new Date(`2026-11-0${5 + i}T03:00:00.000Z`) }));
  const T = setup({ landingRows });
  const r = plain(T.ctx.gopLanding_({ dryRun: false, now: NOW }));
  assert.equal(r.moi + r.trung, 3);
  const kh = T.F.values(null, "KhachHang");
  const row = kh.find((x) => x[kh[0].indexOf("SDT")] === PHONES[1]);
  const obj = Object.fromEntries(kh[0].map((c, i) => [c, row[i]]));
  assert.ok(obj.DongYBangChung.length > 500, "cell dài hơn giới hạn 500 của cell_: " + obj.DongYBangChung.length);
  for (const sg of obj.DongYBangChung.split(" || ")) assert.ok(sg.length <= 200, "mỗi đoạn <= 200: " + sg.length);
  assert.equal(obj.DongYDuAn, "bcons-aaa;bcons-bbb;bcons-ccc");
  const again = plain(T.ctx.mergeCustomer_(obj, { ...Object.fromEntries(KHACH_COLS.map((c) => [c, ""])), SDT: PHONES[1] }, "2026-11-11T02:00:00.000Z"));
  assert.equal(again.DongYNhanTin, "Có");
  for (const m of projects) assert.equal(T.ctx.coTheNhan_(again, m), true, m);
  assert.equal(again.DongYBangChung, obj.DongYBangChung);
});

test("Task 2 fix A: cell_ không dùng cho DongYBangChung/DongYDuAn trong upsertKhach_ (khách mới và khách cũ)", () => {
  const long = Array.from({ length: 3 }, (_, i) => leadRow({ ten: NAMES[2], sdt: PHONES[3], duAn: "bcons-" + "abc"[i].repeat(3), trang: "https://x.pages.dev/" + "z".repeat(300), at: new Date(`2026-11-0${5 + i}T03:00:00.000Z`) }));
  const T = setup({ landingRows: long });
  T.ctx.gopLanding_({ dryRun: false, now: NOW });
  const kh = T.F.values(null, "KhachHang");
  const row = kh.find((x) => x[kh[0].indexOf("SDT")] === PHONES[3]);
  assert.equal(row[kh[0].indexOf("DongYBangChung")].split(" || ").length, 3);
});

test("Task 2 fix A: DongYDuAn dài hơn 500 ký tự (14 dự án) không bị cắt khi ghi lên Sheet", () => {
  const projects = Array.from({ length: 14 }, (_, i) => "bcons-" + String.fromCharCode(97 + i).repeat(33));
  const landingRows = projects.map((duAn, i) => leadRow({ ten: NAMES[2], sdt: PHONES[3], duAn, at: new Date(`2026-11-05T03:${String(10 + i)}:00.000Z`) }));
  const T = setup({ landingRows });
  T.ctx.gopLanding_({ dryRun: false, now: NOW });
  const kh = T.F.values(null, "KhachHang");
  const row = kh.find((x) => x[kh[0].indexOf("SDT")] === PHONES[3]);
  const duAn = row[kh[0].indexOf("DongYDuAn")];
  assert.ok(duAn.length > 500, String(duAn.length));
  assert.equal(duAn, projects.join(";"));
});

// ---------------- Task 3: loại yêu cầu, NgayGhi, đồng ý lại (Sheets) ----------------
const ev3 = (d) => `Có (${d}T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/)`;
const consented = (ma, phone, name, duAn, day, extra = {}) =>
  khRow({ MaKhach: ma, SDT: phone, HoTen: name, DuAnQuanTam: duAn, DongYNhanTin: "Có", DongYDuAn: duAn.split(";")[0], DongYBangChung: duAn.split(";")[0] + ": " + ev3(day), ...extra });
const tcTab = (F) => tab(F, null, "TuChoi");
const OLD_TC_HEAD = ["SDT", "LyDo", "NgayGhi"];

test("Task3 (f): tab TuChoi cũ 3 cột được thêm LoaiYeuCau, DaDongYLai ở cuối, dữ liệu nguyên; lần hai không ghi; dryRun không sửa", () => {
  const rows = [["0900000001", "khách gọi điện", TC_OLD], ["0900000002", "", ""]];
  const { F, ctx } = build({ khach: [] });
  const old = F.SpreadsheetApp.getActiveSpreadsheet().insertSheet("TuChoi");
  old.getRange(1, 1, 3, 1).setNumberFormat("@");
  old.getRange(1, 1, 3, 3).setValues([OLD_TC_HEAD, ...rows]);
  const before = F.snapshot();
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), true);
  assert.equal(F.snapshot(), before, "dryRun không sửa tiêu đề");
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
  const t = tcTab(F);
  assert.deepEqual(t[0], TC_HEADER);
  assert.deepEqual(t[1].slice(0, 3), ["0900000001", "khách gọi điện", TC_OLD]);
  assert.deepEqual(t[2].slice(0, 3), ["0900000002", "", ""]);
  assert.deepEqual(t[1].slice(3), ["", ""]);
  // chỉ ô tiêu đề được ghi
  const tcWrites = F.calls.writes.filter((x) => x.sheet === "TuChoi" && x.method === "setValues");
  assert.ok(tcWrites.every((x) => x.row === 1), JSON.stringify(tcWrites));
  F.calls.writes.length = 0;
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
  assert.equal(F.calls.writes.filter((x) => x.sheet === "TuChoi" && x.method === "setValues").length, 0, "lần hai không ghi");
});

test("Task3 (f): tiêu đề cũ gõ dạng NFD/thừa khoảng trắng vẫn nhận ra; chỉ thêm cột còn thiếu, không đè cột lạ", () => {
  const { F, ctx } = build({ khach: [] });
  const old = F.SpreadsheetApp.getActiveSpreadsheet().insertSheet("TuChoi");
  old.getRange(1, 1, 2, 1).setNumberFormat("@");
  old.getRange(1, 1, 2, 4).setValues([[" SDT", "LyDo", "NgayGhi".normalize("NFD"), "LoaiYeuCau"], ["0900000001", "", TC_OLD, "Xóa"]]);
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
  assert.deepEqual(tcTab(F)[0].map((h) => h.trim()), TC_HEADER);
  assert.deepEqual(tcTab(F)[1].slice(0, 4), ["0900000001", "", TC_OLD, "Xóa"]);
});

test("Task3: tab TuChoi mới tạo có đủ 5 tiêu đề", () => {
  const { F, ctx } = build({ khach: [] });
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
  assert.deepEqual(tcTab(F), [TC_HEADER]);
});

test("Task3 (a): TuChoi 'Rút lại' -> khách không bị xóa, đếm rutLai, vẫn được phân bổ (Task 4) với trạng thái 'Đã rút lại'; dòng TuChoi nguyên", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park", NhuCau: "Mua để ở" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]],
  });
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  assert.equal(r.xoa, 0);
  assert.deepEqual(r.dayVao, { "bcons-newsky": 2, "bcons-central-park": 1 });
  assert.deepEqual(masterMa(F, "M1"), [pad(1), pad(2)]);
  assert.deepEqual(masterMa(F, "M2"), [pad(1)]);
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  assert.equal(masterRow(F, "M1", pad(2))[9], "Chưa rõ", "khách 2: đồng ý 'Có' chung nhưng chưa có đồng ý theo dự án");
  const k = khDoc(F)[0];
  assert.equal(k.HoTen, NAMES[0]);
  assert.equal(k.SDT, PHONES[0]);
  assert.equal(k.NhuCau, "Mua để ở");
  assert.deepEqual(tcTab(F)[1], [PHONES[0], "", new Date(TC_OLD).toISOString(), "Rút lại", ""].map((v, i) => (i === 2 ? tcTab(F)[1][2] : v)));
  assert.equal(String(tcTab(F)[1][2]), TC_OLD);
});

test("Task3 (a): khách rutLai có DuAnQuanTam trống: ở lại KhachHang (đánh dấu rút lại), không có tab ChuaPhanDuAn, được đếm ở chuaCoDuAn", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" })], tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]] });
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  assert.equal(r.chuaCoDuAn, 1);
  assert.equal(F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
});

test("Task3 (b)(d): loại 'Xóa' (mọi cách viết) -> luồng xóa cũ; loại trống/lạ -> chỉ rút lại, không xóa", () => {
  for (const [loai, xoa] of [["Xóa", true], ["XÓA", true], ["xoa", true], [" xoá ", true], ["", false], ["Rút lại", false], ["lạ", false], ["Xóa luôn", false]]) {
    const { F, ctx } = build({
      khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", NhuCau: "Mua để ở" })],
      tuChoi: [[PHONES[0], "", TC_OLD, loai, ""]],
      byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
    });
    const r = run(ctx);
    assert.equal(r.xoa, xoa ? 1 : 0, JSON.stringify(loai));
    assert.equal(r.rutLai, xoa ? 0 : 1, JSON.stringify(loai));
    assert.equal(khDoc(F)[0].HoTen, xoa ? "" : NAMES[0], JSON.stringify(loai));
    assert.deepEqual(masterMa(F, "M1"), xoa ? [] : [pad(1)], JSON.stringify(loai)); // bản cũ ở Master: Task 4 mới cập nhật trạng thái
  }
});

test("Task3 (h)(k): cùng SĐT nhiều dòng (số, +84, chuỗi): 'Xóa' thắng 'Rút lại'", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [[PHONES[0], "", "2026-11-09T00:00:00.000Z", "Rút lại", ""], ["+84 90 000 0001", "", "2026-11-05T00:00:00.000Z", "Xóa", ""]],
  });
  const r = run(ctx);
  assert.equal(r.xoa, 1);
  assert.equal(r.rutLai, 0);
  assert.equal(khDoc(F)[0].HoTen, "");
});

test("Task3 (k): SĐT trong TuChoi viết nhiều dạng (số 900000001, +84, 0 đầu) đều khớp khách 0900000001", () => {
  for (const f of [900000001, "900000001", "+84 90 000 0001", "090.000.0001", "(+84) 900 000 001"]) {
    const { ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: [[f, "", TC_OLD, "Rút lại", ""]] });
    assert.equal(run(ctx).rutLai, 1, String(f));
  }
});

test("Task3 (c): đồng ý MỚI HƠN NgayGhi mở lại (Master 'Có', không rutLai, dongYLai); cũ hơn và bằng nhau thì không (Master 'Đã rút lại' / bị xóa)", () => {
  const cases = [["2026-11-12T03:14:59.999Z", true], ["2026-11-12T03:15:00.000Z", false], ["2026-11-13T00:00:00.000Z", false]];
  for (const loai of ["Rút lại", "Xóa"]) {
    for (const [ngayGhi, lifted] of cases) {
      const { F, ctx } = build({ khach: [consented(pad(1), PHONES[0], NAMES[0], "bcons-newsky", "2026-11-12")], tuChoi: [[PHONES[0], "", ngayGhi, loai, ""]] });
      const r = run(ctx, { now: new Date("2026-11-20T00:00:00.000Z") });
      assert.equal(r.dayVao["bcons-newsky"], !lifted && loai === "Xóa" ? 0 : 1, loai + ngayGhi);
      assert.equal(r.rutLai, !lifted && loai === "Rút lại" ? 1 : 0, loai + ngayGhi);
      assert.equal(r.dongYLai, lifted && loai === "Rút lại" ? 1 : 0, loai + ngayGhi);
      if (loai === "Rút lại") assert.equal(masterRow(F, "M1", pad(1))[9], lifted ? "Có" : "Đã rút lại", loai + ngayGhi);
      assert.equal(r.xoa, !lifted && loai === "Xóa" ? 1 : 0, loai + ngayGhi);
      assert.equal(String(tcTab(F)[1][3]), loai, "dòng TuChoi không bị xóa/sửa loại");
    }
  }
});

test("Task3 (e): dòng TuChoi không có NgayGhi (hoặc rác) được ghi NgayGhi = now ở lần chạy đầu, không đụng ô khác, và KHÔNG bị đọc là cũ", () => {
  const { F, ctx } = build({
    // khách có đồng ý ngày 10/11, TuChoi gõ tay không ngày: không được mở lại vì thiếu ngày
    khach: [consented(pad(1), PHONES[0], NAMES[0], "bcons-newsky", "2026-11-10"), consented(pad(2), PHONES[1], NAMES[1], "bcons-newsky", "2026-11-10"), khRow({ MaKhach: pad(3), SDT: PHONES[2], HoTen: NAMES[2], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [[PHONES[0], "gọi cho anh", "", "", ""], [PHONES[1], "", "05-11-2026", "Rút lại", ""], [PHONES[2], "", TC_OLD, "Rút lại", "x"]],
  });
  const r = run(ctx);
  assert.equal(r.rutLai, 3);
  assert.equal(r.dayVao["bcons-newsky"], 3);
  for (const ma of [pad(1), pad(2), pad(3)]) assert.equal(masterRow(F, "M1", ma)[9], "Đã rút lại", ma);
  const t = tcTab(F);
  assert.equal(String(t[1][2]), "2026-11-11T01:00:00.000Z");
  assert.equal(String(t[2][2]), "2026-11-11T01:00:00.000Z");
  assert.equal(String(t[3][2]), TC_OLD, "ngày hợp lệ giữ nguyên");
  assert.equal(t[1][1], "gọi cho anh");
  assert.equal(t[3][4], "x");
  // lần hai (cùng đồng ý 10/11 cũ hơn mốc đã đóng dấu 11/11): vẫn chặn, không ghi gì
  F.calls.writes.length = 0;
  const r2 = run(ctx);
  assert.equal(r2.rutLai, 0); // đã ghi nhận ở lần đầu
  assert.equal(r2.dayVao["bcons-newsky"], 0);
  F.calls.writes.length = 0; // lần hai điền NgayRutLai từ ngày vừa đóng dấu; lần ba thì không còn gì để ghi
  const r3 = run(ctx);
  assert.equal(r3.rutLai, 0);
  assert.equal(w(F), 0);
});

test("Task3 (e): dryRun không ghi NgayGhi (không đổi gì) nhưng đếm như thật", () => {
  const mk = () => build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: [[PHONES[0], "", "", "", ""]] });
  const a = mk();
  const snap = a.F.snapshot();
  const dry = run(a.ctx, { dryRun: true });
  assert.equal(w(a.F), 0);
  assert.equal(a.F.snapshot(), snap);
  assert.equal(dry.rutLai, 1);
  assert.deepEqual(run(mk().ctx), dry);
});

test("Task3 (e): đồng ý ngay SAU lúc đóng dấu thì mở lại ở lần chạy sau", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: [[PHONES[0], "", "", "", ""]] });
  run(ctx); // đóng dấu 2026-11-11T01:00Z
  const kh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  const set = (col, v) => kh.getRange(2, KHACH_COLS.indexOf(col) + 1, 1, 1).setValues([[v]]);
  set("DongYNhanTin", "Có");
  set("DongYDuAn", "bcons-newsky");
  set("DongYBangChung", "bcons-newsky: " + ev3("2026-11-11").replace("2026-11-11T03:15", "2026-11-11T02:00"));
  const r = run(ctx, { now: new Date("2026-11-11T02:30:00.000Z") });
  assert.equal(r.rutLai, 0);
  assert.equal(r.dayVao["bcons-newsky"], 1);
});

test("Task3 (i): gõ 'Không' ở DongYNhanTin (có SĐT) -> rutLai, KHÔNG xóa dữ liệu, không ghi TuChoi; 'Không rõ' không phải", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không rõ" })],
  });
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  assert.equal(r.xoa, 0);
  assert.deepEqual(masterMa(F, "M1"), [pad(1), pad(2)]);
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  assert.equal(masterRow(F, "M1", pad(2))[9], "Chưa rõ");
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  assert.deepEqual(tcTab(F), [TC_HEADER]);
});

test("Task3 (j): khách DuAnQuanTam rỗng không bị coi là rút lại/xóa, ở lại KhachHang (chỉ đếm chuaCoDuAn)", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" })] });
  const r = run(ctx);
  assert.equal(r.rutLai, 0);
  assert.equal(r.xoa, 0);
  assert.equal(r.chuaCoDuAn, 1);
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
});

test("Task3 (g): TuChoi thiếu cột SDT hoặc SDT không ở cột A -> ném lỗi trước mọi lần ghi, không PII trong lỗi", () => {
  for (const head of [["LyDo", "NgayGhi", "LoaiYeuCau"], ["LyDo", "SDT", "NgayGhi", "LoaiYeuCau"]]) {
    const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })] });
    F.SpreadsheetApp.getActiveSpreadsheet().insertSheet("TuChoi").getRange(1, 1, 2, head.length).setValues([head, head.map((h) => (h === "SDT" ? PHONES[0] : "x"))]);
    const snap = F.snapshot();
    let err;
    try { ctx.phanBo_({ dryRun: false, now: NOW }); } catch (e) { err = e; }
    assert.ok(err, head.join());
    assert.equal(F.snapshot(), snap);
    for (const s of [...NAMES, ...PHONES]) assert.ok(!String(err.message).includes(s));
  }
});

test("Task3 (l): không PII ở Loi/NhatKy/Logger khi có rutLai, đóng dấu NgayGhi, SĐT sai trong TuChoi", () => {
  const { F, ctx, logs } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: [[PHONES[0], "", "", "Rút lại", ""], ["090000000", "", "", "Xóa", ""]],
  });
  const r = run(ctx);
  assert.equal(r.tuChoiLoi, 1);
  assertNoLeak({ F, logs });
  const loi = JSON.stringify(F.values(null, "Loi"));
  for (const s of [...NAMES, ...PHONES, "090000000"]) assert.ok(!loi.includes(s), s);
});

test("Task3: cùng SĐT hai dòng KhachHang, một dòng rút lại (TuChoi 'Rút lại') -> cả hai dòng đều 'Đã rút lại' ở Master (rút lại là theo khách/SĐT), đếm một khách", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(2), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-central-park", DongYNhanTin: "Có" }), khRow({ MaKhach: pad(3), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })],
  });
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  assert.deepEqual(masterMa(F, "M1"), [pad(1), pad(3)]);
  assert.deepEqual(masterMa(F, "M2"), [pad(2)]);
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  assert.equal(masterRow(F, "M2", pad(2))[9], "Đã rút lại");
  assert.notEqual(masterRow(F, "M1", pad(3))[9], "Đã rút lại");
  assert.equal(khDoc(F)[1].HoTen, NAMES[0]);
});

// ---------------- Review Task 3 ----------------
const CHUNG = "bcons-newsky";
const LATER = new Date("2026-11-20T00:00:00.000Z");
const kh2 = (F) => khDoc(F);
const sdtOf = (F, i) => kh2(F)[i].SDT;
const setKh = (F, row, col, v) => F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang").getRange(row, KHACH_COLS.indexOf(col) + 1, 1, 1).setValues([[v]]);

test("Review 1 (Sheets): Xóa 05/11 bị đồng ý 10/11 mở + Rút lại 12/11 còn hiệu lực -> rutLai, KHÔNG xóa gì", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], CHUNG, "2026-11-10", { NhuCau: "Mua để ở" })],
    tuChoi: [[PHONES[0], "", "2026-11-05T00:00:00.000Z", "Xóa", ""], [PHONES[0], "", "2026-11-12T00:00:00.000Z", "Rút lại", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const r = run(ctx, { now: LATER });
  assert.equal(r.xoa, 0);
  assert.equal(r.rutLai, 1);
  assert.ok(F.calls.writes.every((x) => x.method !== "deleteRow"));
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
  assert.equal(khDoc(F)[0].NhuCau, "Mua để ở");
  assert.deepEqual(masterMa(F, "M1"), [pad(1)]);
});

test("Review 1 (Sheets): Xóa cũ đã bị mở + Rút lại KHÔNG ngày -> rutLai, không xóa", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], CHUNG, "2026-11-10")],
    tuChoi: [[PHONES[0], "", "2026-11-05T00:00:00.000Z", "Xóa", ""], [PHONES[0], "", "", "Rút lại", ""]],
  });
  const r = run(ctx, { now: LATER });
  assert.equal(r.xoa, 0);
  assert.equal(r.rutLai, 1);
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
});

test("Review 2 (Sheets): NgayGhi là Date 0 giờ VN (T17:00Z) -> đồng ý cùng ngày VN không mở lại: Rút lại -> rutLai (vẫn phân bổ, 'Đã rút lại'), Xóa -> xóa", () => {
  const cell = new Date("2026-11-10T17:00:00.000Z");
  for (const loai of ["Rút lại", "Xóa"]) {
    const { F, ctx } = build({ khach: [consented(pad(1), PHONES[0], NAMES[0], CHUNG, "2026-11-11")], tuChoi: [[PHONES[0], "", cell, loai, ""]] });
    // đồng ý lúc 03:15Z cùng ngày VN 11/11 (đã sớm hơn cuối ngày VN)
    const r = run(ctx, { now: LATER });
    assert.equal(r.dayVao[CHUNG], loai === "Xóa" ? 0 : 1, loai);
    assert.equal(loai === "Xóa" ? r.xoa : r.rutLai, 1, loai);
    assert.equal(khDoc(F)[0].HoTen, loai === "Xóa" ? "" : NAMES[0], loai);
  }
  // ngày hôm sau: mở lại
  const { ctx } = build({ khach: [consented(pad(1), PHONES[0], NAMES[0], CHUNG, "2026-11-12")], tuChoi: [[PHONES[0], "", cell, "Rút lại", ""]] });
  assert.equal(run(ctx, { now: LATER }).dayVao[CHUNG], 1);
});

test("Review 3: dòng không SĐT 'Không' gõ tay, còn dữ liệu và GhiChu của anh -> KHÔNG xóa gì, không ghi gì", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: "", HoTen: NAMES[0], NhuCau: "Mua để ở", GhiChu: "anh đánh dấu Không", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(2), SDT: "", HoTen: NAMES[1], NhuCau: "x", GhiChu: "", DongYNhanTin: "Không" })],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), "", NAMES[0])] }, M2: {} },
  });
  const r = run(ctx);
  assert.equal(r.xoa, 0);
  assert.equal(F.calls.writes.filter((x) => x.sheet === "KhachHang").length, 0);
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
  assert.equal(khDoc(F)[1].HoTen, NAMES[1]);
  assert.deepEqual(masterMa(F, "M1"), [pad(1)]);
});

test("Review 3: dấu 'Rút lại' mà HẾT dữ liệu cá nhân thì bỏ qua (không ghi gì)", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: "", GhiChu: "Rút lại", DongYNhanTin: "Không" })] });
  assert.equal(run(ctx).xoa, 0);
  assert.equal(F.calls.writes.filter((x) => x.sheet === "KhachHang").length, 0);
});

test("Review 3: xóa ghi dấu (DongYNhanTin='Không', GhiChu='Rút lại') TRƯỚC khi xóa dữ liệu cá nhân; chết ngay sau lần ghi dấu -> chạy lại hoàn tất", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], NhuCau: "Mua để ở", GhiChu: "ghi chú của anh", DuAnQuanTam: CHUNG, DongYBangChung: "x" })],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
  });
  F.hooks.onWrite = (i) => {
    if (i.sheet === "KhachHang" && i.method === "setValues" && i.col === KHACH_COLS.indexOf("SDT") + 1) throw new Error("chết"); // lần ghi xóa dữ liệu cá nhân
  };
  assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }), /chết/);
  const k = khDoc(F)[0];
  assert.equal(k.DongYNhanTin, "Đã rút lại", "dấu phải có trước");
  assert.equal(k.GhiChu, "Rút lại");
  F.hooks.onWrite = null;
  run(ctx);
  const k2 = khDoc(F)[0];
  for (const c of PII) assert.equal(k2[c], "", c);
  assert.deepEqual(masterMa(F, "M1"), []);
});

test("Review 3: chết giữa lúc xóa dữ liệu cá nhân (SĐT đã mất, HoTen còn) với dấu đã ghi -> chạy lại xóa nốt", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: "", HoTen: NAMES[0], NhuCau: "Mua để ở", GhiChu: "Rút lại", DongYNhanTin: "Không" })],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), "", NAMES[0])] }, M2: {} },
  });
  const r = run(ctx);
  assert.equal(r.xoa, 1);
  assert.equal(khDoc(F)[0].HoTen, "");
  assert.deepEqual(masterMa(F, "M1"), []);
});

test("Review 4: rút lại hiện rõ — KhachHang 'Đã rút lại' + NgayRutLai = NgayGhi mới nhất (không phải now); dòng Master có sẵn đổi sang 'Đã rút lại'; lần hai không ghi gì", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: CHUNG })],
    tuChoi: [[PHONES[0], "", "2026-11-05T00:00:00.000Z", "Rút lại", ""], [PHONES[0], "", "2026-11-08T00:00:00.000Z", "Rút lại", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" }), mrow(pad(2), PHONES[1], NAMES[1], { DongYNhanTin: "Có" })] }, M2: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" })] } },
  });
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  assert.equal(r.xoa, 0);
  const k = khDoc(F)[0];
  assert.equal(k.DongYNhanTin, "Đã rút lại");
  assert.equal(String(k.NgayRutLai), "2026-11-08T00:00:00.000Z");
  assert.equal(k.HoTen, NAMES[0]);
  assert.equal(khDoc(F)[1].DongYNhanTin, "Có");
  const mcol = (id, i) => tab(F, id, "KhachTuMaster")[i][9];
  assert.equal(mcol("M1", 1), "Đã rút lại");
  assert.equal(mcol("M1", 2), "Chưa rõ", "khách khác: tính lại theo dự án (chưa có DongYDuAn) chứ không còn chép 'Có' chung");
  assert.equal(mcol("M2", 1), "Đã rút lại");
  assert.deepEqual(masterMa(F, "M1"), [pad(1), pad(2)], "không thêm/xóa dòng");
  assert.deepEqual(masterMa(F, "M2"), [pad(1)]);
  F.calls.writes.length = 0;
  const r2 = run(ctx);
  assert.equal(r2.rutLai, 0);
  assert.equal(w(F), 0);
});

test("Review 4: dryRun không ghi nhưng đếm rutLai như thật", () => {
  const mk = () => build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG })], tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]], byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" })] }, M2: {} } });
  const a = mk();
  const snap = a.F.snapshot();
  const dry = run(a.ctx, { dryRun: true });
  assert.equal(w(a.F), 0);
  assert.equal(a.F.snapshot(), snap);
  assert.equal(dry.rutLai, 1);
  assert.deepEqual(run(mk().ctx), dry);
});

test("Review 4: dòng TuChoi chưa có ngày: hiện 'Đã rút lại' ngay, NgayRutLai chỉ điền khi đã có ngày đóng dấu (không phải now của lần chạy đầu), lần ba không ghi gì", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG })], tuChoi: [[PHONES[0], "", "", "Rút lại", ""]] });
  const r1 = run(ctx);
  assert.equal(r1.rutLai, 1);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  assert.equal(khDoc(F)[0].NgayRutLai, "");
  assert.equal(String(tab(F, null, "TuChoi")[1][2]), "2026-11-11T01:00:00.000Z");
  const r2 = run(ctx, { now: new Date("2026-11-11T02:00:00.000Z") });
  assert.equal(r2.rutLai, 0);
  assert.equal(String(khDoc(F)[0].NgayRutLai), "2026-11-11T01:00:00.000Z");
  F.calls.writes.length = 0;
  run(ctx, { now: new Date("2026-11-11T03:00:00.000Z") });
  assert.equal(w(F), 0);
});

test("Review 4: NgayRutLai không bao giờ lùi (ô đã có ngày muộn hơn thì giữ; ô rác giữ)", () => {
  for (const [cur, want] of [["2026-11-15T00:00:00.000Z", "2026-11-15T00:00:00.000Z"], ["mai", "mai"], ["2026-11-01T00:00:00.000Z", "2026-11-05T00:00:00.000Z"]]) {
    const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG, NgayRutLai: cur })], tuChoi: [[PHONES[0], "", "2026-11-05T00:00:00.000Z", "Rút lại", ""]] });
    run(ctx);
    assert.equal(String(khDoc(F)[0].NgayRutLai), want, cur);
  }
});

test("Review 4: đồng ý mới hơn NgayGhi sau khi đã hiện rút lại -> mở lại: vào Master, ô trạng thái Master về 'Có', rutLai 0", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG })],
    tuChoi: [[PHONES[0], "", "2026-11-05T00:00:00.000Z", "Rút lại", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" })] }, M2: {} },
  });
  run(ctx, { now: LATER });
  assert.equal(tab(F, "M1", "KhachTuMaster")[1][9], "Đã rút lại");
  setKh(F, 2, "DongYNhanTin", "Có");
  setKh(F, 2, "DongYDuAn", CHUNG);
  setKh(F, 2, "DongYBangChung", CHUNG + ": " + ev3("2026-11-12"));
  const r = run(ctx, { now: LATER });
  assert.equal(r.rutLai, 0);
  assert.equal(r.dayVao[CHUNG], 1);
  assert.equal(tab(F, "M1", "KhachTuMaster")[1][9], "Có");
});

test("Review 4 (Task 4): Master không mở được khi có người rút lại (không có xóa) -> KHÔNG ném: KhachHang đánh dấu rút lại, masterLoi, không PII", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG })], tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]], byId: { M1: { KhachTuMaster: [TM] } } });
  const r = run(ctx);
  assert.deepEqual(r.masterLoi, [CP]);
  assert.equal(r.rutLai, 1);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
  assert.equal(JSON.stringify(tab(F, null, "Loi")).includes(PHONES[0]), false);
});

test("Review 5: LoaiYeuCau lạ ('Xóa dữ liệu') -> vẫn Rút lại (không xóa) và MỘT dòng Loi {Rút lại, số dòng, lý do}, đếm vào tuChoiLoi; chạy lại không lặp", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: CHUNG })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Xóa dữ liệu", ""], [PHONES[1], "", TC_OLD, "xóa hết", ""], ["090000000", "", TC_OLD, "lạ", ""], [PHONES[2], "", TC_OLD, "", ""], [PHONES[3], "", TC_OLD, " rút lại ", ""]],
  });
  const dry = run(ctx, { dryRun: true });
  assert.equal(dry.tuChoiLoi, 3); // 2 loại lạ + 1 SĐT sai
  assert.equal(F.values(null, "Loi"), null);
  const r = run(ctx);
  assert.equal(r.xoa, 0);
  assert.equal(r.rutLai, 2);
  assert.equal(r.tuChoiLoi, 3);
  const loi = tcLoiRows(F).filter((x) => String(x[3]).startsWith("Loại yêu cầu lạ"));
  assert.deepEqual(loi.map((x) => [x[1], x[2], x[3]]), [["Rút lại", 2, "Loại yêu cầu lạ: ghi Rút lại hoặc Xóa"], ["Rút lại", 3, "Loại yêu cầu lạ: ghi Rút lại hoặc Xóa"]]);
  assert.ok(!JSON.stringify(F.values(null, "Loi")).includes(PHONES[0]));
  const r2 = run(ctx);
  assert.equal(tcLoiRows(F).filter((x) => String(x[3]).startsWith("Loại yêu cầu lạ")).length, 2, "không lặp");
  assert.equal(r2.tuChoiLoi, 1); // chỉ SĐT sai (như cũ)
});

test("Review 6: sửa tiêu đề TuChoi có cột lạ ở giữa: thêm SAU cột cuối, không ghi đè; tiêu đề trống ở cuối cũng không bị đè", () => {
  for (const head of [["SDT", "LyDo", "NgayGhi", "GhiChuAnh"], ["SDT", "LyDo", "NgayGhi", "", ""]]) {
    const { F, ctx } = build({ khach: [] });
    const sh = F.SpreadsheetApp.getActiveSpreadsheet().insertSheet("TuChoi");
    sh.getRange(1, 1, 2, 1).setNumberFormat("@");
    sh.getRange(1, 1, 2, head.length).setValues([head, [PHONES[0], "x", TC_OLD, "dữ liệu của anh", "y"].slice(0, head.length)]);
    ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
    const t = tcTab(F);
    assert.deepEqual(t[0].slice(0, head.length), head);
    assert.deepEqual(t[0].slice(head.length), ["LoaiYeuCau", "DaDongYLai"]);
    assert.deepEqual(t[1].slice(0, head.length), [PHONES[0], "x", TC_OLD, "dữ liệu của anh", "y"].slice(0, head.length).map((v, i) => (i === 2 ? t[1][2] : v)));
    assert.ok(F.calls.writes.filter((x) => x.sheet === "TuChoi" && x.method === "setValues").every((x) => x.row === 1));
  }
});

test("Review 6: hai dòng KhachHang cùng SĐT, chỉ một dòng có đồng ý mới hơn NgayGhi: dòng cũ bị xóa, dòng mới được phân bổ và dòng Master của nó còn nguyên", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG, NhuCau: "cũ" }), consented(pad(2), PHONES[0], NAMES[0], CHUNG, "2026-11-12", { NhuCau: "mới" })],
    tuChoi: [[PHONES[0], "", "2026-11-05T00:00:00.000Z", "Xóa", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0]), mrow(pad(2), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const r = run(ctx, { now: LATER });
  assert.equal(r.xoa, 1);
  assert.equal(khDoc(F)[0].HoTen, "");
  assert.equal(khDoc(F)[1].HoTen, NAMES[0]);
  assert.equal(khDoc(F)[1].NhuCau, "mới");
  assert.deepEqual(masterMa(F, "M1"), [pad(2)]);
  assert.equal(r.dayVao[CHUNG], 1);
  // dòng Master của khách được mở lại không bị xóa rồi thêm lại: chỉ đúng MỘT lần xóa (dòng của khách bị xóa)
  assert.equal(F.calls.writes.filter((x) => x.method === "deleteRow" && x.owner === "M1").length, 1);
});

test("Review 2: NgayGhi chỉ có ngày (Date 0 giờ VN, 'YYYY-MM-DD', 'DD/MM/YYYY') là ngày hợp lệ: không bị đóng dấu đè bằng now", () => {
  const cells = [new Date("2026-11-10T17:00:00.000Z"), "2026-11-11", "11/11/2026"];
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: CHUNG })], tuChoi: cells.map((c, i) => [PHONES[0], "", c, "Rút lại", ""]) });
  const T = F.SpreadsheetApp.getActiveSpreadsheet();
  run(ctx);
  const t = tcTab(F);
  assert.equal(String(t[1][2]), "2026-11-10T17:00:00.000Z");
  assert.equal(String(t[2][2]), "2026-11-11");
  assert.equal(String(t[3][2]), "11/11/2026");
  // NgayRutLai = cuối ngày VN 11/11
  assert.equal(String(khDoc(F)[0].NgayRutLai), "2026-11-11T17:00:00.000Z");
  assert.ok(T);
});

// ======================= Task 4: rút lại giữ hồ sơ, đồng ý lại, bỏ ChuaPhanDuAn =======================
const NEWSKY = "bcons-newsky";
const CP = "bcons-central-park";
const BOTH = NEWSKY + ";" + CP;
const T4_NOW = new Date("2026-11-20T00:00:00.000Z");
const T4_ZERO = { dayVao: { [NEWSKY]: 0, [CP]: 0 }, rutLai: 0, dongYLai: 0, xoa: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0, chuaCoDuAn: 0 };
const zero4 = (o = {}) => ({ ...T4_ZERO, ...o });
/** Như build() nhưng có Sheet landing L1 để thử điền lại form qua gopLanding_ (mergeCustomer_ thật). */
function buildL({ khach, tuChoi, landingRows = [], masters = { M1: {}, M2: {} } } = {}) {
  return build({ khach, tuChoi, cauHinh: [CAU_HINH, [NEWSKY, "L1", "M1"], [CP, "", "M2"]], byId: { L1: { Landing: [HEADERS, ...landingRows] }, ...masters } });
}
const gop = (ctx, now = T4_NOW) => plain(ctx.gopLanding_({ dryRun: false, now }));
const appendLanding = (F, row) => {
  const sh = F.SpreadsheetApp.openById("L1").getSheetByName("Landing");
  sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
};
const masterRow = (F, id, ma) => (tab(F, id, "KhachTuMaster") || []).slice(1).find((r) => r[0] === ma);
const iso = (v) => (v instanceof Date ? v.toISOString() : String(v));

test("Task4 (a): TuChoi 'Rút lại' -> hồ sơ giữ nguyên mọi dữ liệu, dòng Master được thêm/cập nhật với trạng thái 'Đã rút lại'; lần hai không ghi gì", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], BOTH, "2026-11-01", { NhuCau: "Mua để ở", CanXem: "2PN", PTTT: "PTTT 03", NguoiChamSoc: "An", GhiChu: "ghi chú của anh" })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" })] }, M2: {} },
  });
  const r = run(ctx);
  assert.deepEqual(r, zero4({ dayVao: { [NEWSKY]: 1, [CP]: 1 }, rutLai: 1 }));
  const k = khDoc(F)[0];
  assert.equal(k.SDT, PHONES[0]);
  assert.equal(k.HoTen, NAMES[0]);
  assert.equal(k.NhuCau, "Mua để ở");
  assert.equal(k.CanXem, "2PN");
  assert.equal(k.PTTT, "PTTT 03");
  assert.equal(k.NguoiChamSoc, "An");
  assert.equal(k.GhiChu, "ghi chú của anh");
  assert.ok(k.DongYBangChung.includes("mẫu v1"), "bằng chứng còn nguyên");
  assert.equal(k.DongYNhanTin, "Đã rút lại");
  assert.equal(String(k.NgayRutLai), TC_OLD);
  for (const id of ["M1", "M2"]) {
    const m = masterRow(F, id, pad(1));
    assert.ok(m, id);
    assert.equal(m[1], PHONES[0]);
    assert.equal(m[2], NAMES[0]);
    assert.equal(m[6], "Mua để ở", "A..J vẫn được cập nhật");
    assert.equal(m[9], "Đã rút lại", id);
  }
  assert.ok(F.calls.writes.every((x) => x.method !== "deleteRow"));
  F.calls.writes.length = 0;
  const snap = F.snapshot();
  const r2 = run(ctx);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  assert.deepEqual(r2, zero4());
});

test("Task4 (a2): 'Không' gõ tay -> KhachHang 'Đã rút lại' + NgayRutLai = now, Master 'Đã rút lại', hồ sơ giữ; lần hai không ghi gì", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: NEWSKY, DongYNhanTin: "Không", NhuCau: "x" })],
  });
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  assert.equal(r.xoa, 0);
  const k = khDoc(F)[0];
  assert.equal(k.DongYNhanTin, "Đã rút lại");
  assert.equal(String(k.NgayRutLai), NOW.toISOString());
  assert.equal(k.HoTen, NAMES[0]);
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  F.calls.writes.length = 0;
  const r2 = run(ctx);
  assert.equal(w(F), 0);
  assert.equal(r2.rutLai, 0);
  assert.equal(String(khDoc(F)[0].NgayRutLai), NOW.toISOString(), "ngày không bị đẩy");
});

test("Task4 (c)(Focus 6): điền lại form có đồng ý mới -> KhachHang 'Có' đúng dự án đó, DaDongYLai ghi ngày bằng chứng, dòng TuChoi còn nguyên; Master dự án đó 'Có', dự án kia 'Chưa rõ'; lần hai không ghi gì", () => {
  const T = buildL({
    khach: [consented(pad(1), PHONES[0], NAMES[0], BOTH, "2026-11-01", { NhuCau: "Mua để ở" })],
    tuChoi: [[PHONES[0], "gọi cho anh", TC_OLD, "Rút lại", ""]],
  });
  const { F, ctx } = T;
  run(ctx, { now: T4_NOW });
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  assert.equal(masterRow(F, "M2", pad(1))[9], "Đã rút lại");
  appendLanding(F, leadRow({ ten: "Ten Moi", sdt: PHONES[0], duAn: NEWSKY, at: new Date("2026-11-12T03:00:00.000Z") }));
  const g = gop(ctx);
  assert.equal(g.trung, 1);
  const r = run(ctx, { now: T4_NOW });
  assert.equal(r.dongYLai, 1);
  assert.equal(r.rutLai, 0);
  assert.equal(r.xoa, 0);
  const k = khDoc(F)[0];
  assert.equal(k.DongYNhanTin, "Có");
  assert.equal(k.DongYDuAn, NEWSKY);
  assert.equal(String(k.NgayRutLai), TC_OLD, "ngày rút lại giữ làm lịch sử");
  assert.equal(k.HoTen, NAMES[0]);
  const t = tcTab(F);
  assert.equal(t.length, 2, "dòng TuChoi không bị xóa");
  assert.deepEqual([t[1][0], t[1][1], iso(t[1][2]), t[1][3]], [PHONES[0], "gọi cho anh", TC_OLD, "Rút lại"]);
  assert.equal(iso(t[1][4]), "2026-11-12T03:00:00.000Z");
  assert.equal(masterRow(F, "M1", pad(1))[9], "Có");
  assert.equal(masterRow(F, "M2", pad(1))[9], "Chưa rõ", "đồng ý dự án A không mở nhắn dự án B");
  F.calls.writes.length = 0;
  const snap = F.snapshot();
  const r2 = run(ctx, { now: T4_NOW });
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  assert.deepEqual(r2, zero4());
});

test("Task4 (d): bằng chứng CŨ hơn ngày rút lại bị đọc lại từ landing -> vẫn 'Đã rút lại', Master 'Đã rút lại', dongYLai 0, DaDongYLai trống", () => {
  const T = buildL({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: NEWSKY, DongYNhanTin: "Chưa rõ" })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]],
    landingRows: [leadRow({ ten: "Ten Cu", sdt: PHONES[0], duAn: NEWSKY, at: new Date("2026-11-01T03:00:00.000Z") })],
  });
  const { F, ctx } = T;
  gop(ctx);
  const r = run(ctx, { now: T4_NOW });
  assert.equal(r.rutLai, 1);
  assert.equal(r.dongYLai, 0);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  // lần sau lại có một dòng landing cũ khác
  appendLanding(F, leadRow({ ten: "Ten Cu 2", sdt: PHONES[0], duAn: NEWSKY, at: new Date("2026-11-02T03:00:00.000Z") }));
  gop(ctx);
  const r2 = run(ctx, { now: T4_NOW });
  assert.equal(r2.dongYLai, 0);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  assert.equal(String(tcTab(F)[1][4]), "");
});

test("Task4 (n): KhachHang còn 'Đã rút lại' cũ nhưng đã có bằng chứng mới hơn NgayRutLai (không qua landing) -> tính lại 'Có', Master 'Có', DaDongYLai được ghi", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], NEWSKY, "2026-11-12", { DongYNhanTin: "Đã rút lại", NgayRutLai: TC_OLD })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]],
  });
  const r = run(ctx, { now: T4_NOW });
  assert.equal(r.rutLai, 0);
  assert.equal(r.dongYLai, 1);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Có");
  assert.equal(khDoc(F)[0].DongYDuAn, NEWSKY);
  assert.equal(masterRow(F, "M1", pad(1))[9], "Có");
  assert.equal(iso(tcTab(F)[1][4]), "2026-11-12T03:15:00.000Z");
});

test("Task4 (b2): DaDongYLai đã có thì không ghi đè và không đếm lại; dòng 'Xóa' bị mở không ghi DaDongYLai", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], NEWSKY, "2026-11-12"), consented(pad(2), PHONES[1], NAMES[1], NEWSKY, "2026-11-12")],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", "đã ghi tay"], [PHONES[1], "", TC_OLD, "Xóa", ""]],
  });
  const r = run(ctx, { now: T4_NOW });
  assert.equal(r.dongYLai, 0);
  const t = tcTab(F);
  assert.equal(t[1][4], "đã ghi tay");
  assert.equal(t[2][4], "");
});

test("Task4 (e): 'Xóa' -> xóa mọi Master, giữ MaKhach, xóa dữ liệu cá nhân VÀ DongYDuAN/DongYBangChung, trạng thái 'Đã rút lại', SĐT còn trong TuChoi; lần hai không ghi gì", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], BOTH, "2026-11-01", { NhuCau: "Mua để ở", GhiChu: "ghi chú" }), consented(pad(2), PHONES[1], NAMES[1], BOTH, "2026-11-01")],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0]), mrow(pad(2), PHONES[1], NAMES[1])] }, M2: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] } },
  });
  const r = run(ctx);
  assert.equal(r.xoa, 1);
  assert.deepEqual(r.lyDo, { tuchoi: 1, khong: 0 });
  assert.equal(r.rutLai, 0);
  assert.deepEqual(r.dayVao, { [NEWSKY]: 1, [CP]: 1 });
  const k = khDoc(F)[0];
  assert.equal(k.MaKhach, pad(1));
  for (const c of [...PII, "DongYDuAn"]) assert.equal(k[c], "", c);
  assert.equal(k.DongYNhanTin, "Đã rút lại");
  assert.equal(k.GhiChu, "Rút lại");
  assert.equal(masterRow(F, "M1", pad(1)), undefined);
  assert.equal(masterRow(F, "M2", pad(1)), undefined);
  assert.ok(masterRow(F, "M1", pad(2)) && masterRow(F, "M2", pad(2)));
  assert.deepEqual(tuChoiPhones(F), [PHONES[0]]);
  F.calls.writes.length = 0;
  const snap = F.snapshot();
  const r2 = run(ctx);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  assert.equal(r2.xoa, 0);
});

test("Task4 (e2): 'Xóa' rồi khách điền lại form với đồng ý mới -> HỒ SƠ MỚI (MaKhach mới) 'Có', vào Master với 'Có'; hồ sơ cũ vẫn trống", () => {
  const T = buildL({
    khach: [consented(pad(1), PHONES[0], NAMES[0], NEWSKY, "2026-11-01", { NhuCau: "cũ" })],
    tuChoi: [PHONES[0]],
    masters: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const { F, ctx } = T;
  run(ctx, { now: T4_NOW });
  assert.equal(khDoc(F)[0].SDT, "");
  appendLanding(F, leadRow({ ten: "Ten Moi", sdt: PHONES[0], duAn: NEWSKY, at: new Date("2026-11-12T03:00:00.000Z") }));
  const g = gop(ctx);
  assert.equal(g.moi, 1);
  const r = run(ctx, { now: T4_NOW });
  assert.equal(r.xoa, 0);
  assert.equal(r.dayVao[NEWSKY], 1);
  const kh = khDoc(F);
  assert.equal(kh.length, 2);
  assert.equal(kh[0].SDT, "");
  assert.equal(kh[0].NhuCau, "");
  assert.equal(kh[1].MaKhach, pad(2));
  assert.equal(kh[1].SDT, PHONES[0]);
  assert.equal(kh[1].DongYNhanTin, "Có");
  assert.equal(kh[1].DongYDuAn, NEWSKY);
  assert.equal(masterRow(F, "M1", pad(1)), undefined);
  assert.equal(masterRow(F, "M1", pad(2))[9], "Có");
});

test("Task4 (f): khách DuAnQuanTam trống ở lại KhachHang nguyên vẹn, chuaCoDuAn đếm; không tạo, không đọc, không ghi ChuaPhanDuAn (kể cả tab cũ còn sót)", () => {
  const stale = [[...KHACH_COLS, "GanDuAn"], khRow({ MaKhach: pad(9), HoTen: "Cu Sot" }).concat(["bcons-central-park"])];
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "du-an-la" }), khRow({ MaKhach: "", SDT: PHONES[2], HoTen: NAMES[2], DuAnQuanTam: "" }), khRow({ MaKhach: pad(4), SDT: PHONES[3], HoTen: NAMES[3], DuAnQuanTam: NEWSKY })],
  });
  const r = run(ctx);
  assert.equal(r.chuaCoDuAn, 2, 'mã lạ du-an-la có giá trị nên không tính là trống');
  assert.equal(r.xoa + r.rutLai + r.dongYLai, 0);
  assert.equal(F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
  const kh = khDoc(F);
  assert.equal(kh[0].HoTen, NAMES[0]);
  assert.equal(kh[1].HoTen, NAMES[1]);
  assert.deepEqual(masterMa(F, "M1"), [pad(4)]);
  assert.deepEqual(masterMa(F, "M2"), []);
  // tab cũ còn sót: không đọc, không ghi
  const T2 = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" })] });
  T2.F.SpreadsheetApp.getActiveSpreadsheet().insertSheet("ChuaPhanDuAn").getRange(1, 1, 2, stale[0].length).setValues(stale);
  const before = T2.F.snapshot();
  const reads = [];
  T2.F.hooks.onRead = (i) => { if (i.sheet === "ChuaPhanDuAn") reads.push(i); };
  const writesBefore = T2.F.calls.writes.length;
  run(T2.ctx);
  T2.ctx.ensureTabs_(T2.F.SpreadsheetApp.getActiveSpreadsheet(), false);
  assert.deepEqual(reads, [], "không đọc ChuaPhanDuAn");
  assert.deepEqual(T2.F.calls.writes.slice(writesBefore).filter((x) => x.sheet === "ChuaPhanDuAn"), [], "không ghi ChuaPhanDuAn");
  assert.deepEqual(tab(T2.F, null, "ChuaPhanDuAn"), stale);
  assert.ok(before);
});

test("Task4 (f2): TAB_HEADERS_ không còn ChuaPhanDuAn; ensureTabs_ không tạo tab đó", () => {
  const { F, ctx } = build({ khach: [] });
  assert.ok(!("ChuaPhanDuAn" in plain(ctx.TAB_HEADERS_)));
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
  assert.equal(F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
});

test("Task4 (g): dryRun không ghi gì ở cả bốn kiểu (phân bổ thường, rút lại, đồng ý lại, xóa) và trả cùng số đếm như chạy thật", () => {
  const mk = () => build({
    khach: [
      khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: BOTH }), // phân bổ thường
      khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: NEWSKY }), // rút lại
      consented(pad(3), PHONES[2], NAMES[2], NEWSKY, "2026-11-12"), // đồng ý lại
      khRow({ MaKhach: pad(4), SDT: PHONES[3], HoTen: NAMES[3], DuAnQuanTam: NEWSKY }), // xóa
      khRow({ MaKhach: pad(5), SDT: "0900000005", HoTen: "Khach Nam", DuAnQuanTam: "" }),
    ],
    tuChoi: [[PHONES[1], "", TC_OLD, "Rút lại", ""], [PHONES[2], "", TC_OLD, "Rút lại", ""], [PHONES[3], "", TC_OLD, "Xóa", ""]],
  });
  const a = mk();
  const snap = a.F.snapshot();
  const maxBefore = a.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang").getMaxRows();
  const dry = run(a.ctx, { dryRun: true, now: T4_NOW });
  assert.equal(w(a.F), 0);
  assert.equal(a.F.snapshot(), snap);
  assert.equal(a.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang").getMaxRows(), maxBefore);
  assert.equal(a.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn"), null);
  assert.equal(a.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Loi"), null);
  assert.equal(a.F.SpreadsheetApp.openById("M1").getSheetByName("KhachTuMaster"), null);
  assert.deepEqual(dry, { dayVao: { [NEWSKY]: 3, [CP]: 1 }, rutLai: 1, dongYLai: 1, xoa: 1, lyDo: { tuchoi: 1, khong: 0 }, masterLoi: [], tuChoiLoi: 0, chuaCoDuAn: 1 });
  assert.deepEqual(run(mk().ctx, { now: T4_NOW }), dry);
});

test("Task4 (h1): rút lại + một Master không mở được -> KHÔNG ném: KhachHang đánh dấu trước, Master mở được cập nhật 'Đã rút lại', masterLoi + Loi chỉ có mã dự án, không phân bổ khách khác", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: BOTH }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: NEWSKY })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" })] } }, // M2 không mở được
  });
  const order = [];
  F.hooks.onWrite = (i) => order.push(i.owner + ":" + i.sheet + ":" + i.method);
  const r = run(ctx);
  assert.deepEqual(r.masterLoi, [CP]);
  assert.equal(r.rutLai, 1);
  assert.deepEqual(r.dayVao, { [NEWSKY]: 0, [CP]: 0 });
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  assert.equal(masterRow(F, "M1", pad(2)), undefined, "không phân bổ khi còn Master hỏng");
  assert.ok(order.indexOf("MASTER:KhachHang:setValues") < order.indexOf("M1:KhachTuMaster:setValues"), "KhachHang trước");
  const loi = tab(F, null, "Loi");
  assert.deepEqual([loi[1][1], loi[1][3]], ["Rút lại", "Không mở được Master " + CP]);
  for (const s of [...NAMES, ...PHONES]) assert.ok(!JSON.stringify(loi).includes(s));
  assert.ok(F.calls.writes.every((x) => x.method !== "deleteRow"));
});

test("Task4 (h2): 'Xóa' + Master không mở được -> KhachHang giữ dữ liệu cá nhân (kể cả DongYDuAn) cho tới khi mọi Master xóa xong; sau khi Master mở lại, chạy lại hoàn tất", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], BOTH, "2026-11-01", { NhuCau: "x" })],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] } },
  });
  const r = run(ctx);
  assert.deepEqual(r.masterLoi, [CP]);
  assert.equal(r.xoa, 1);
  const k = khDoc(F)[0];
  assert.equal(k.SDT, PHONES[0]);
  assert.equal(k.DongYDuAn, NEWSKY);
  assert.equal(k.DongYNhanTin, "Đã rút lại", "đã đánh dấu");
  assert.equal(masterRow(F, "M1", pad(1)), undefined);
  const again = run(ctx);
  assert.deepEqual(again.masterLoi, [CP]);
  assert.equal(khDoc(F)[0].SDT, PHONES[0]);
});

test("Task4 (h3): Master hỏng, KHÔNG có việc rút lại/xóa mới -> vẫn ném lỗi trước mọi lần ghi (cả khi đã có khách rút lại từ trước)", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: NEWSKY, DongYNhanTin: "Đã rút lại", NgayRutLai: TC_OLD }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: NEWSKY })],
    byId: { M1: {} }, // M2 hỏng
  });
  const snap = F.snapshot();
  assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }), /KhachTuMaster/);
  assert.equal(F.snapshot(), snap);
  assert.equal(w(F), 0);
  assert.throws(() => ctx.phanBo_({ dryRun: true, now: NOW }), /KhachTuMaster/);
});

test("Task4 (i): 500 khách (cả rút lại) vào 2 dự án vẫn chỉ tốn số lần ghi hằng số", () => {
  const khach = [], tc = [];
  for (let i = 1; i <= 500; i++) {
    const ph = "09" + String(10000000 + i);
    khach.push(khRow({ MaKhach: pad(i), SDT: ph, HoTen: "Khach " + i, DuAnQuanTam: i % 2 ? BOTH : NEWSKY }));
    if (i % 5 === 0) tc.push([ph, "", TC_OLD, "Rút lại", ""]);
  }
  const { F, ctx } = build({ khach, tuChoi: tc });
  ctx.ensureTabs_(F.SpreadsheetApp.getActiveSpreadsheet(), false);
  F.calls.writes.length = 0;
  const r = run(ctx);
  assert.equal(r.dayVao[NEWSKY], 500);
  assert.equal(r.rutLai, 100);
  assert.ok(w(F) <= 20, "số lần ghi: " + w(F));
  assert.equal(tab(F, "M1", "KhachTuMaster")[5][9], "Đã rút lại");
  F.calls.writes.length = 0;
  const r2 = run(ctx);
  assert.equal(w(F), 0);
  assert.equal(r2.rutLai, 0);
});

test("Task4 (k): cột K/L fill-only và cột N trở đi của anh sống sót trên dòng đã rút lại; ghi không vượt cột L", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: NEWSKY, TrangThaiCRM: "Nóng", TrangThaiChamSoc: "Đã gọi" })],
    byId: { M1: { KhachTuMaster: [[...TM, "", "Ghi chú của anh"], [...mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có", TrangThaiCRM: "Lạnh" }), "", "ghi chú của anh"]] }, M2: {} },
  });
  F.SpreadsheetApp.getActiveSpreadsheet().insertSheet("TuChoi").getRange(1, 1, 2, 5).setValues([TC_HEADER, [PHONES[0], "", TC_OLD, "Rút lại", ""]]);
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  const m = tab(F, "M1", "KhachTuMaster")[1];
  assert.equal(m[9], "Đã rút lại");
  assert.equal(m[10], "Lạnh", "K của anh giữ");
  assert.equal(m[11], "Đã gọi", "L trống -> điền");
  assert.equal(m[13], "ghi chú của anh");
  assert.deepEqual(F.calls.writes.filter((x) => x.owner === "M1" && x.method === "setValues" && x.col + x.nc - 1 > 12), []);
});

test("Task4 (l)(Focus 6): khách chỉ đồng ý Newsky nhưng quan tâm cả hai -> Master Central Park hiện 'Chưa rõ', Master Newsky 'Có'; khách 'Chưa rõ' hiện 'Chưa rõ' ở cả hai", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], BOTH, "2026-11-01"), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: BOTH, DongYNhanTin: "Chưa rõ" })],
  });
  run(ctx, { now: T4_NOW });
  assert.equal(masterRow(F, "M1", pad(1))[9], "Có");
  assert.equal(masterRow(F, "M2", pad(1))[9], "Chưa rõ");
  assert.equal(masterRow(F, "M1", pad(2))[9], "Chưa rõ");
  assert.equal(masterRow(F, "M2", pad(2))[9], "Chưa rõ");
  // đổi sau: khách đồng ý thêm dự án thứ hai (bằng chứng mới) -> cả hai 'Có'
  const sh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  const set = (col, v) => sh.getRange(2, KHACH_COLS.indexOf(col) + 1, 1, 1).setValues([[v]]);
  set("DongYDuAn", BOTH);
  set("DongYBangChung", NEWSKY + ": " + ev3("2026-11-01") + " || " + CP + ": " + ev3("2026-11-02"));
  run(ctx, { now: T4_NOW });
  assert.equal(masterRow(F, "M2", pad(1))[9], "Có");
});

test("Task4 (m): không rò tên/SĐT/ID Sheet ra Logger, Loi, NhatKy, Telegram khi rút lại + điền lại + xóa", () => {
  const T = buildL({
    khach: [consented(pad(1), PHONES[0], NAMES[0], NEWSKY, "2026-11-01"), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: NEWSKY })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""], [PHONES[1], "", TC_OLD, "Xóa", ""], ["090000000", "", TC_OLD, "Xóa", ""]],
  });
  run(T.ctx, { now: T4_NOW });
  appendLanding(T.F, leadRow({ ten: "Ten Moi", sdt: PHONES[0], duAn: NEWSKY, at: new Date("2026-11-12T03:00:00.000Z") }));
  gop(T.ctx);
  run(T.ctx, { now: T4_NOW });
  assertNoLeak(T);
  const loi = JSON.stringify(T.F.values(null, "Loi"));
  for (const s of [...NAMES, ...PHONES, "Ten Moi", "090000000"]) assert.ok(!loi.includes(s), s);
});

test("Task4: rút lại khi các dòng Master sẵn có khác dự án (khách bỏ dự án khỏi DuAnQuanTam) vẫn được đổi sang 'Đã rút lại'", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: NEWSKY })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]],
    byId: { M1: {}, M2: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" })] } },
  });
  run(ctx);
  assert.equal(masterRow(F, "M2", pad(1))[9], "Đã rút lại");
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
});

// ---- Task 4: bổ sung sau kiểm đột biến ----
test("Task4 (c2): dongYLai đếm KHÁCH (mỗi SĐT một lần), nhiều dòng TuChoi cùng SĐT chỉ đếm một; DaDongYLai ghi cho cả hai dòng", () => {
  const { F, ctx } = build({
    khach: [consented(pad(1), PHONES[0], NAMES[0], NEWSKY, "2026-11-12"), consented(pad(2), PHONES[1], NAMES[1], NEWSKY, "2026-11-12"), consented(pad(3), PHONES[2], NAMES[2], NEWSKY, "2026-11-12")],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""], [PHONES[0], "", "2026-11-06T00:00:00.000Z", "Rút lại", ""], [PHONES[1], "", TC_OLD, "Rút lại", ""]],
  });
  const r = run(ctx, { now: T4_NOW });
  assert.equal(r.dongYLai, 2);
  const t = tcTab(F);
  assert.deepEqual([1, 2, 3].map((i) => iso(t[i][4])), ["2026-11-12T03:15:00.000Z", "2026-11-12T03:15:00.000Z", "2026-11-12T03:15:00.000Z"]);
  assert.equal(run(ctx, { now: T4_NOW }).dongYLai, 0);
});

test("Task4 (f3): chuaCoDuAn chỉ đếm dòng có SĐT hoặc MaKhach (dòng chỉ có tên thì không)", () => {
  const { ctx } = build({ khach: [khRow({ MaKhach: "", SDT: "", HoTen: "chỉ có tên", DuAnQuanTam: "" }), khRow({ MaKhach: pad(2), SDT: "", HoTen: "", DuAnQuanTam: "" }), khRow({ MaKhach: "", SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: " " })] });
  assert.equal(run(ctx).chuaCoDuAn, 2);
});

test("Task4 (e3): xóa dở ở một Master (không xóa được dòng) -> Master đó KHÔNG bị ghi gì thêm, Master khác vẫn cập nhật, KhachHang giữ dữ liệu cá nhân, masterLoi + Loi chỉ mã", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: NEWSKY }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: BOTH })],
    tuChoi: [PHONES[0]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
  });
  F.SpreadsheetApp.openById("M1").getSheetByName("KhachTuMaster").deleteRow = () => {}; // xóa không có tác dụng
  const m1Before = JSON.stringify(tab(F, "M1", "KhachTuMaster"));
  const r = run(ctx);
  assert.deepEqual(r.masterLoi, [NEWSKY]);
  assert.equal(JSON.stringify(tab(F, "M1", "KhachTuMaster")), m1Before, "Master xóa dở không bị ghi thêm");
  assert.equal(masterRow(F, "M2", pad(2))[1], PHONES[1], "Master khác vẫn được phân bổ");
  assert.equal(khDoc(F)[0].SDT, PHONES[0]);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Đã rút lại");
  const loi = JSON.stringify(tab(F, null, "Loi"));
  assert.ok(loi.includes("Không xóa được dòng ở Master " + NEWSKY));
  for (const x of [...NAMES, ...PHONES]) assert.ok(!loi.includes(x));
});

test("Task4 (a3): KhachHang đã 'Đã rút lại' nhưng dòng Master còn 'Có' (cũ) -> rutLai đếm lần sửa Master, lần hai không ghi gì", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: NEWSKY, DongYNhanTin: "Đã rút lại", NgayRutLai: TC_OLD })],
    tuChoi: [[PHONES[0], "", TC_OLD, "Rút lại", ""]],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0], { DongYNhanTin: "Có" })] }, M2: {} },
  });
  const r = run(ctx);
  assert.equal(r.rutLai, 1);
  assert.equal(masterRow(F, "M1", pad(1))[9], "Đã rút lại");
  F.calls.writes.length = 0;
  assert.equal(run(ctx).rutLai, 0);
  assert.equal(w(F), 0);
});
