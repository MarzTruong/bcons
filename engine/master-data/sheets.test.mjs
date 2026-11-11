import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGs, plain, fakeSheets } from "./helpers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const LOGIC = path.join(here, "apps-script", "Logic.gs");
const SHEETS = path.join(here, "apps-script", "Sheets.gs");
const landing = loadGs([path.join(here, "..", "landing", "apps-script", "Code.gs")]);
const HEADERS = plain(landing.HEADERS);
const KHACH_COLS = ["MaKhach", "SDT", "HoTen", "NgayTao", "NgayCapNhat", "NguonGoc", "NguonChiTiet", "DuAnQuanTam", "NhuCau", "CanXem", "PTTT", "DongYNhanTin", "DongYBangChung", "TrangThaiCRM", "TrangThaiChamSoc", "NguoiChamSoc", "GhiChu"];
const CAU_HINH = ["maDuAn", "landingSheetId", "masterSheetId"];
const NOW = new Date("2026-11-11T01:00:00.000Z");

// Dữ liệu ẩn danh: tên "Khach ...", số 090000000x.
const NAMES = ["Khach Cu", "Khach Moi", "Khach Loi", "Khach Hai"];
const PHONES = ["0900000001", "0900000002", "0900000003", "0900000004"];

/** Dòng landing đúng như Code.gs thật ghi (validateLead_ + rowFor_), rồi bỏ dấu ' ở SĐT như Sheets trả về. */
function leadRow({ ten, sdt, duAn = "bcons-newsky", at = new Date("2026-11-10T03:00:00.000Z"), badPhone }) {
  const v = landing.validateLead_({ ten, sdt, dongY: true, t: 5000, nguon: "facebook", duAn, trang: "https://x.pages.dev/", nhuCau: "Mua để ở", canLoai: "2PN-2WC", pttt: "PTTT 03" });
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
  Object.assign(ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService, PropertiesService: F.PropertiesService, UrlFetchApp: F.UrlFetchApp });
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
  // thêm cột riêng của anh (cột 18, 19) vào tab KhachHang
  const sh = T.F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KhachHang");
  sh.getRange(1, 18, 2, 2).setValues([["Anh1", "Anh2"], ["=A2&B2", "ghi chú"]]);
  T.F.calls.writes.length = 0;
  assert.deepEqual(plain(T.ctx.gopLanding_({ dryRun: false, now: NOW })), { doc: 1, moi: 0, trung: 1, loi: 0 });
  const khWrites = T.F.calls.writes.filter((w) => w.owner === "MASTER" && w.sheet === "KhachHang" && w.method === "setValues");
  assert.ok(khWrites.length >= 1);
  for (const w of khWrites) assert.ok(w.col + w.nc - 1 <= 17, "ghi vào cột ngoài KHACH_COLS: " + JSON.stringify(w));
  const kh = T.F.values(null, "KhachHang");
  assert.equal(kh[1][KHACH_COLS.indexOf("NgayCapNhat")], NOW.toISOString());
  assert.equal(kh[1][17], "=A2&B2");
  // không ô nào khác ngoài NguonGoc/DongYNhanTin... bị ghi vô cớ: HoTen, MaKhach, SDT không nằm trong vùng ghi
  for (const col of [1, 2, 3]) assert.ok(!khWrites.some((w) => col >= w.col && col < w.col + w.nc), "cột " + col + " bị ghi");
  assert.ok(ex.length === 17);
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
