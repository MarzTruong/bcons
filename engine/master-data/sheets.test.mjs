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

test("TAB_HEADERS_: đúng bảy tab, KhachHang = KHACH_COLS, ChuaPhanDuAn thêm GanDuAn", () => {
  const { ctx } = setup();
  const t = plain(ctx.TAB_HEADERS_);
  assert.deepEqual(Object.keys(t).sort(), ["CauHinh", "ChuaPhanDuAn", "KhachHang", "Loi", "NhapCRM", "NhatKy", "TuChoi"]);
  assert.deepEqual(t.KhachHang, KHACH_COLS);
  assert.deepEqual(t.ChuaPhanDuAn, [...KHACH_COLS, "GanDuAn"]);
  assert.deepEqual(t.NhapCRM, ["HoTen", "SDT", "DuAnQuanTam", "TrangThaiCRM", "DaGop"]);
  assert.deepEqual(t.Loi, ["Thời gian", "Nguồn", "Dòng", "Lý do"]);
  assert.deepEqual(t.TuChoi, ["SDT", "LyDo", "NgayGhi"]);
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
  for (const n of ["KhachHang", "NhapCRM", "Loi", "ChuaPhanDuAn", "TuChoi", "NhatKy", "CauHinh"]) assert.ok(F.values(null, n), n);
  assert.deepEqual(F.values(null, "Loi"), [["Thời gian", "Nguồn", "Dòng", "Lý do"]]);
  // tab có sẵn giữ nguyên dữ liệu
  assert.equal(F.values(null, "KhachHang").length, 2);
  // SĐT là văn bản: ghi chuỗi có số 0 đầu vào cột SĐT các tab đó thì đọc lại vẫn là chuỗi
  for (const [tab, col] of [["KhachHang", 2], ["NhapCRM", 2], ["TuChoi", 1], ["ChuaPhanDuAn", 2]]) {
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
  for (const tab of ["NhapCRM", "KhachHang", "ChuaPhanDuAn"]) assert.ok(fmt.some((w) => w.sheet === tab && w.col === 1 || w.sheet === tab && w.col === 3), "chưa định dạng HoTen ở " + tab);
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
function build({ khach, cauHinh = CAU2, tuChoi, byId = { M1: {}, M2: {} }, chua } = {}) {
  const master = { CauHinh: cauHinh, KhachHang: [KHACH_COLS, ...(khach || [])] };
  if (tuChoi) master.TuChoi = [["SDT", "LyDo", "NgayGhi"], ...tuChoi.map((p) => [p, "", ""])];
  if (chua) master.ChuaPhanDuAn = [[...KHACH_COLS, "GanDuAn"], ...chua];
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
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 1, "bcons-central-park": 1 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0 });
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
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0 });
});

test("phanBo_: dự án lạ hoặc trống -> ChuaPhanDuAn (GanDuAn để trống), không vào Master", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "du-an-la" })] });
  const r = run(ctx);
  assert.equal(r.chua, 2);
  const t = tab(F, null, "ChuaPhanDuAn");
  assert.deepEqual(t.slice(1).map((x) => x[0]), [pad(1), pad(2)]);
  assert.equal(t[0][KHACH_COLS.length], "GanDuAn");
  assert.equal(t[1][KHACH_COLS.length], "");
  assert.equal(t[1][1], PHONES[0]);
  assert.deepEqual(masterMa(F, "M1"), []);
  assert.deepEqual(masterMa(F, "M2"), []);
});

test("phanBo_: anh điền GanDuAn -> khách sang đúng Master, rời ChuaPhanDuAn, KhachHang.DuAnQuanTam có mã", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "" })] });
  run(ctx);
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn").getRange(2, KHACH_COLS.length + 1).setValues([["bcons-central-park"]]);
  const r = run(ctx);
  assert.equal(r.dayVao["bcons-central-park"], 1);
  assert.equal(r.dayVao["bcons-newsky"], 0);
  assert.deepEqual(masterMa(F, "M2"), [pad(1)]);
  assert.deepEqual(masterMa(F, "M1"), []);
  assert.deepEqual(tab(F, null, "ChuaPhanDuAn").slice(1).map((x) => x[0]), [pad(2)]);
  assert.equal(khDoc(F)[0].DuAnQuanTam, "bcons-central-park");
  // lần ba: ổn định
  F.calls.writes.length = 0;
  run(ctx);
  assert.equal(w(F), 0);
});

test("phanBo_: GanDuAn là mã không có trong CauHinh -> vẫn ở ChuaPhanDuAn, GanDuAn của anh giữ nguyên", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" })] });
  run(ctx);
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn").getRange(2, KHACH_COLS.length + 1).setValues([["khong-co-ma"]]);
  run(ctx);
  const t = tab(F, null, "ChuaPhanDuAn");
  assert.equal(t[1][0], pad(1));
  assert.equal(t[1][KHACH_COLS.length], "khong-co-ma");
  assert.equal(khDoc(F)[0].DuAnQuanTam, "");
});

test("phanBo_: SĐT vào TuChoi (+84 ...) -> xóa khỏi mọi Master kể cả bản cũ ở dự án chưa từng phân bổ và ChuaPhanDuAn; KhachHang bị xóa SDT/HoTen", () => {
  const stale = [TM, [pad(1), PHONES[0], NAMES[0], "", "Landing", "bcons-newsky", "", "", "", "Có", "", ""]];
  const keep = [pad(2), PHONES[1], NAMES[1], "", "Landing", "bcons-central-park", "", "", "", "Có", "", ""];
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-central-park", NhuCau: "Mua để ở", CanXem: "2PN", DongYBangChung: "Có (x)", GhiChu: "ghi chú của anh" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-central-park" })],
    byId: { M1: { KhachTuMaster: stale }, M2: { KhachTuMaster: [TM] } },
  });
  run(ctx);
  // M1 chưa từng được phân bổ khách 1 (bản cũ), ChuaPhanDuAn cũng có bản cũ
  F.SpreadsheetApp.openById("M1").getSheetByName("KhachTuMaster").getRange(3, 1, 1, 12).setValues([keep.map(String)]);
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn").getRange(2, 1, 1, 18).setValues([[pad(1), PHONES[0], NAMES[0], ...Array(15).fill("")]]);
  assert.deepEqual(masterMa(F, "M2"), [pad(1), pad(2)]);
  const ss = F.SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName("TuChoi").getRange(1, 1, 2, 3).setValues([["SDT", "LyDo", "NgayGhi"], ["+84 90 000 0001", "", ""]]);
  const r = run(ctx);
  assert.equal(r.chan, 1);
  assert.deepEqual(r.lyDo, { tuchoi: 1, khong: 0 });
  assert.deepEqual(masterMa(F, "M1"), [pad(2)]);
  assert.deepEqual(masterMa(F, "M2"), [pad(2)]);
  assert.deepEqual(tab(F, null, "ChuaPhanDuAn").slice(1).filter((x) => x[0]), []);
  const k = khDoc(F)[0];
  assert.equal(k.MaKhach, pad(1));
  for (const c of ["SDT", "HoTen", "NhuCau", "CanXem", "DongYBangChung"]) assert.equal(k[c], "", c);
  assert.equal(k.DongYNhanTin, "Không");
  assert.equal(k.GhiChu, "Rút lại"); // GhiChu là chữ tự do, có thể chứa ghi chú cá nhân: thay bằng dấu
  assert.equal(khDoc(F)[1].HoTen, NAMES[1]);
});

test("phanBo_: lần chạy thứ hai sau khi rút lại: không ghi gì, không liệt kê lại, không đếm chan/chua", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "" })],
    tuChoi: ["0900000001"],
  });
  const r1 = run(ctx);
  assert.equal(r1.chan, 1);
  assert.equal(khDoc(F)[0].GhiChu, "Rút lại");
  F.calls.writes.length = 0;
  const snap = F.snapshot();
  const r2 = run(ctx);
  assert.equal(w(F), 0);
  assert.equal(F.snapshot(), snap);
  assert.deepEqual(r2, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0 });
  assert.deepEqual(tab(F, null, "ChuaPhanDuAn").slice(1).map((x) => x[0]), [pad(2)]);
  assert.deepEqual(masterMa(F, "M1"), []);
  // ngay cả khi TuChoi bị xóa dòng, khách đã rút lại không quay lại
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TuChoi").getRange(2, 1).setValues([[""]]);
  F.calls.writes.length = 0;
  run(ctx);
  assert.equal(w(F), 0);
});

test("phanBo_: anh gõ 'không' (thường) ở DongYNhanTin -> rút lại như 'Không'", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "không" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })] });
  const r = run(ctx);
  assert.equal(r.chan, 1);
  assert.deepEqual(r.lyDo, { tuchoi: 0, khong: 1 });
  assert.deepEqual(masterMa(F, "M1"), [pad(2)]);
  const k = khDoc(F)[0];
  assert.equal(k.DongYNhanTin, "Không");
  assert.equal(k.SDT, "");
  assert.equal(k.HoTen, "");
});

test("phanBo_: dòng 'không' còn sót SĐT trong Master từ lần chạy cũ bị xóa theo cả SĐT khi MaKhach lệch", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" })],
    byId: { M1: { KhachTuMaster: [TM, ["KH-LAC", PHONES[0], NAMES[0], "", "", "", "", "", "", "", "", ""]] }, M2: {} },
  });
  run(ctx);
  assert.deepEqual(masterMa(F, "M1"), []);
});

test("phanBo_: SĐT trống mà không phải rút lại -> bỏ qua, không đẩy đi đâu, không đếm", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: "", HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })] });
  const r = run(ctx);
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: 0 });
  assert.deepEqual(masterMa(F, "M1"), []);
  assert.equal(tab(F, null, "ChuaPhanDuAn").length, 1);
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
  assert.deepEqual(dry, { dayVao: { "bcons-newsky": 1, "bcons-central-park": 1 }, chua: 1, chan: 1, lyDo: { tuchoi: 1, khong: 0 }, masterLoi: [], tuChoiLoi: 0 });
});

test("phanBo_: dòng CauHinh thiếu masterSheetId hoặc maDuAn bị bỏ qua; mã đó không phải đích hợp lệ", () => {
  const cau = [CAU_HINH, ["bcons-newsky", "", "M1"], ["bcons-central-park", "", ""], ["", "", "M2"]];
  const { F, ctx } = build({ cauHinh: cau, khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-central-park" })] });
  const r = run(ctx);
  assert.deepEqual(r.dayVao, { "bcons-newsky": 0 });
  assert.equal(r.chua, 1);
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

test("rút lại: dòng KhachHang không có MaKhach mà có SĐT + 'Không' -> xóa bản sao theo SĐT ở Master, xóa dữ liệu dòng", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: "", SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" })],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(7), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const r = run(ctx);
  assert.equal(r.chan, 1);
  assert.deepEqual(masterMa(F, "M1"), []);
  const k = khDoc(F)[0];
  assert.equal(k.SDT, "");
  assert.equal(k.HoTen, "");
  assert.equal(k.DongYNhanTin, "Không");
});

test("rút lại: hai dòng KhachHang cùng SĐT (KH-1 'Không', KH-2 'Có') -> cả hai bị coi là rút lại, không ai được thêm lại vào Master", () => {
  const { F, ctx } = build({
    khach: [
      khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" }),
      khRow({ MaKhach: pad(2), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park", DongYNhanTin: "Có" }),
      khRow({ MaKhach: pad(3), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" }),
    ],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(2), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const r = run(ctx);
  assert.equal(r.chan, 2);
  assert.deepEqual(masterMa(F, "M1"), [pad(3)]);
  assert.deepEqual(masterMa(F, "M2"), []);
  for (const k of khDoc(F).slice(0, 2)) {
    assert.equal(k.SDT, "");
    assert.equal(k.HoTen, "");
    assert.equal(k.DongYNhanTin, "Không");
  }
  assert.equal(khDoc(F)[2].HoTen, NAMES[1]);
});

test("rút lại: dòng 'Không' SĐT rỗng nhưng còn dữ liệu cá nhân (kể cả GhiChu, viết hoa/thường lẫn lộn) -> vẫn xóa hết và xóa bản sao Master theo MaKhach", () => {
  for (const flag of ["Không", "không", "KHÔNG", " Khong "]) {
    const { F, ctx } = build({
      khach: [khRow({ MaKhach: pad(1), SDT: "", HoTen: NAMES[0], NhuCau: "Mua để ở", CanXem: "2PN", NguonChiTiet: "facebook", PTTT: "PTTT 03", NguoiChamSoc: "Nhan Vien A", DongYBangChung: "Có (x)", GhiChu: "gọi lại sau 3 giờ", DongYNhanTin: flag, TrangThaiCRM: "Đã gọi" })],
      byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), "", NAMES[0])] }, M2: { KhachTuMaster: [TM, mrow(pad(1), "", NAMES[0])] } },
    });
    const r = run(ctx);
    assert.equal(r.chan, 1, flag);
    assert.deepEqual(masterMa(F, "M1"), [], flag);
    assert.deepEqual(masterMa(F, "M2"), [], flag);
    const k = khDoc(F)[0];
    for (const c of PII) assert.equal(k[c], "", flag + c);
    assert.equal(k.GhiChu, "Rút lại", flag);
    assert.equal(k.DongYNhanTin, "Không");
    assert.equal(k.TrangThaiCRM, "Đã gọi");
    F.calls.writes.length = 0;
    run(ctx);
    assert.equal(w(F), 0, "lần hai " + flag);
  }
});

test("rút lại: GhiChu chỉ có 'Rút lại' + SĐT rỗng + 'Không' -> bỏ qua, không ghi gì", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: "", GhiChu: "Rút lại", DongYNhanTin: "Không" })] });
  const r = run(ctx);
  assert.equal(r.chan, 0);
  assert.equal(F.calls.writes.filter((x) => x.sheet === "KhachHang").length, 0);
});

test("rút lại qua cột DongYNhanTin: ghi SĐT vào TuChoi (văn bản) TRƯỚC khi xóa; SĐT đã có trong TuChoi thì không ghi thêm", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })],
    tuChoi: ["0900000002"],
    byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
  });
  const order = [];
  F.hooks.onWrite = (i) => order.push(i.sheet + ":" + i.method);
  run(ctx);
  assert.deepEqual(tuChoiPhones(F), ["0900000002", "0900000001"]);
  const row = tab(F, null, "TuChoi")[2];
  assert.equal(row[1], "Rút lại (cột)");
  assert.ok(String(row[2]).startsWith("2026-11-11T01:00:00"));
  assert.ok(order.indexOf("TuChoi:setValues") < order.indexOf("KhachTuMaster:deleteRow"));
  assert.ok(order.indexOf("KhachTuMaster:deleteRow") < order.indexOf("KhachHang:setValues"));
  // lần hai: không ghi gì, TuChoi không nhân đôi
  F.calls.writes.length = 0;
  run(ctx);
  assert.equal(w(F), 0);
  assert.deepEqual(tuChoiPhones(F), ["0900000002", "0900000001"]);
});

test("rút lại: SĐT đã có trong TuChoi thì không ghi thêm dòng; dryRun không ghi TuChoi", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: ["+84 90 000 0001"] });
  run(ctx);
  assert.deepEqual(tuChoiPhones(F), ["+84 90 000 0001"]);
  const b = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DongYNhanTin: "Không" })] });
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
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" })],
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
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky;bcons-central-park", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })],
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
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" })], byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} } });
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
  ["sau khi ghi TuChoi (lúc xóa Master)", (i) => i.method === "deleteRow" && i.owner === "M1"],
  ["sau khi xóa Master (lúc xóa ChuaPhanDuAn)", (i) => i.method === "deleteRow" && i.owner === "MASTER" && i.sheet === "ChuaPhanDuAn"],
  ["sau khi xóa ChuaPhanDuAn (lúc ghi KhachHang)", (i) => i.method === "setValues" && i.owner === "MASTER" && i.sheet === "KhachHang"],
]) {
  test("chết giữa chừng " + label + ": SĐT còn ở KhachHang, chạy lại hoàn tất việc xóa", () => {
    const { F, ctx } = build({
      khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" })],
      chua: [[pad(1), PHONES[0], NAMES[0], ...Array(15).fill("")]],
      byId: { M1: { KhachTuMaster: [TM, mrow(pad(1), PHONES[0], NAMES[0])] }, M2: {} },
    });
    F.hooks.onWrite = (i) => { if (hit(i)) throw new Error("chết"); };
    assert.throws(() => ctx.phanBo_({ dryRun: false, now: NOW }), /chết/);
    assert.equal(khDoc(F)[0].SDT, PHONES[0], "KhachHang đã bị xóa quá sớm");
    assert.equal(khDoc(F)[0].HoTen, NAMES[0]);
    F.hooks.onWrite = null;
    run(ctx);
    assert.deepEqual(masterMa(F, "M1"), []);
    assert.equal(tab(F, null, "ChuaPhanDuAn").slice(1).filter((x) => x[0]).length, 0);
    assert.equal(khDoc(F)[0].SDT, "");
    assert.deepEqual(tuChoiPhones(F), ["0900000001"]);
  });
}

test("hai người rút lại trong cùng một Master: xóa từ dưới lên, đúng hai dòng, khách khác còn nguyên", () => {
  const { F, ctx } = build({
    khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "bcons-newsky" }), khRow({ MaKhach: pad(3), SDT: PHONES[2], HoTen: NAMES[2], DuAnQuanTam: "bcons-newsky", DongYNhanTin: "Không" }), khRow({ MaKhach: pad(4), SDT: PHONES[3], HoTen: NAMES[3], DuAnQuanTam: "bcons-newsky" })],
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
    ...(tuChoi ? { TuChoi: [["SDT", "LyDo", "NgayGhi"], ...tuChoi.map((x) => [x, "", ""])] } : {}),
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
  assert.equal(typeof r.phanBo.chua, "number");
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
  assert.match(String(ghiChu), /^chua=\d+ chan=\d+ tuchoi=\d+ khong=\d+ vao=\d+ ms=\d+$/);
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
  const khach = [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Trần Thị Crm", DongYNhanTin: "Không", DuAnQuanTam: "bcons-central-park" })];
  const { F, ctx } = full({ khach, landingRows: [], crmRows: [], cauHinh: [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["bcons-central-park", "", "M2"]], byId: { L1: { Landing: [HEADERS] }, M1: {} } });
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
  const khach = [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Trần Thị Crm", DongYNhanTin: "Không", DuAnQuanTam: "bcons-newsky" })];
  const cau = [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["bcons-aaa", "", "M2"], ["bcons-bbb", "", "M3"]];
  const { F, ctx } = full({ khach, landingRows: [], crmRows: [], cauHinh: cau, byId: { L1: { Landing: [HEADERS] }, M1: {} } });
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
  assert.match(a, /Phân bổ: .*chưa phân \d+, rút lại \d+/);
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

test("mỗi mục làm lần chạy thành không rảnh: đọc, mới, trùng, lỗi, chặn, chưa phân, tuchoi, khong", () => {
  // landing có một dòng lỗi (loi) và một mới
  let e = full({ landingRows: [leadRow({ ten: "Ten A", sdt: "0900000005", badPhone: "12345" })], crmRows: [] });
  runAll(e.ctx);
  const n = nhatKy(e.F).length;
  assert.equal(n, 2);
  // sau lần đầu, các lần sau rảnh: chỉ nhịp
  e = idleFull();
  runAll(e.ctx); runAll(e.ctx, { now: new Date(NOW.getTime() + 60000) });
  const base = nhatKy(e.F).length;
  // rút lại -> chan > 0
  e.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang").getRange(2, KHACH_COLS.indexOf("DongYNhanTin") + 1, 1, 1).setValues([["Không"]]);
  const r = runAll(e.ctx, { now: new Date(NOW.getTime() + 120000) });
  assert.ok(r.phanBo.chan >= 1);
  assert.equal(nhatKy(e.F).length, base + 1);
  assert.match(nhatKy(e.F)[base][6], /khong=1/);
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
  const khach = [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Trần Thị Crm", DongYNhanTin: "Không", DuAnQuanTam: "bcons-newsky" })];
  const cau = [CAU_HINH, ["bcons-newsky", "L1", "M1"], ["Nguyễn Văn Kín", "", "M2"]];
  const { F, ctx } = full({ khach, landingRows: [], crmRows: [], cauHinh: cau, byId: { L1: { Landing: [HEADERS] }, M1: {} } });
  const r = runAll(ctx);
  assert.equal(r.loi, "LOI_MASTER");
  assert.ok(!tgTexts(F)[0].includes("Nguyễn"));
  assert.match(tgTexts(F)[0], /mã lạ/);
});

test("lần chạy chỉ đưa khách vào ChuaPhanDuAn (chua > 0, vao = 0) không phải rảnh", () => {
  const { F, ctx } = full({ landingRows: [], crmRows: [], khach: [khRow({ MaKhach: pad(1), SDT: "0900000009", HoTen: "Khach Cu", DuAnQuanTam: "" })], byId: { L1: { Landing: [HEADERS] }, M1: {} } });
  const r = runAll(ctx);
  assert.equal(r.phanBo.chua, 1);
  assert.equal(r.phanBo.dayVao["bcons-newsky"], 0);
  assert.equal(nhatKy(F).length, 2);
  assert.match(nhatKy(F)[1][6], /^chua=1 .* vao=0 /);
  assert.notEqual(nhatKy(F)[1][6], "nhịp: đang chạy, không có gì mới");
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
  assert.equal(r.chan, 1); // số hợp lệ vẫn chặn
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

test("M5: ChuaPhanDuAn - cột anh gõ (TrangThaiCRM, TrangThaiChamSoc, NguoiChamSoc, GhiChu) chỉ điền khi trống, không bị KhachHang ghi đè", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "", TrangThaiCRM: "Nóng", TrangThaiChamSoc: "Đã gọi", NguoiChamSoc: "An", GhiChu: "ghi chú KH" })] });
  run(ctx);
  const sh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn");
  let t = tab(F, null, "ChuaPhanDuAn");
  const col = (c) => t[0].indexOf(c);
  assert.equal(t[1][col("GhiChu")], "ghi chú KH"); // trống -> đã điền lần đầu
  sh.getRange(2, col("GhiChu") + 1).setValues([["anh gõ ở đây"]]);
  sh.getRange(2, col("TrangThaiCRM") + 1).setValues([["Lạnh"]]);
  sh.getRange(2, col("NguoiChamSoc") + 1).setValues([[""]]); // anh xóa -> trống -> được điền lại
  const kh = F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  kh.getRange(2, 15).setValues([["Chăm sóc B"]]); // TrangThaiChamSoc đổi ở KhachHang
  kh.getRange(2, 3).setValues([["Ten Doi Moi"]]); // cột hệ thống khác vẫn cập nhật
  run(ctx);
  t = tab(F, null, "ChuaPhanDuAn");
  assert.equal(t[1][col("GhiChu")], "anh gõ ở đây");
  assert.equal(t[1][col("TrangThaiCRM")], "Lạnh");
  assert.equal(t[1][col("TrangThaiChamSoc")], "Đã gọi");
  assert.equal(t[1][col("NguoiChamSoc")], "An");
  assert.equal(t[1][col("HoTen")], "Ten Doi Moi");
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
  assert.equal(r.chan, 1);
  assert.equal(khDoc(F)[0].SDT, PHONES[0]);
  assert.equal(khDoc(F)[0].DongYNhanTin, "Không rõ"); // không ghi đè chữ của anh
  assert.deepEqual(masterMa(F, "M1"), [pad(1)]);
  assert.equal(tab(F, "M1", "KhachTuMaster")[1][9], "Chưa rõ");
  assert.deepEqual(tuChoiPhones(F), ["0900000002"]);
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
