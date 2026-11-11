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
  assert.match(row[khCol(kh, "DongYBangChung")], /^Có \(2026-11-10T03:00:00\.000Z, mẫu /);
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
  assert.equal(kh[5][18 - 1], "=A6", "cột của anh bên phải giữ nguyên");
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
  Object.assign(ctx, { SpreadsheetApp: F.SpreadsheetApp, LockService: F.LockService, PropertiesService: F.PropertiesService, UrlFetchApp: F.UrlFetchApp });
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
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 1, "bcons-central-park": 1 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 } });
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
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 } });
});

test("phanBo_: dự án lạ hoặc trống -> ChuaPhanDuAn (GanDuAn để trống), không vào Master", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "du-an-la" })] });
  const r = run(ctx);
  assert.equal(r.chua, 2);
  const t = tab(F, null, "ChuaPhanDuAn");
  assert.deepEqual(t.slice(1).map((x) => x[0]), [pad(1), pad(2)]);
  assert.equal(t[0][17], "GanDuAn");
  assert.equal(t[1][17], "");
  assert.equal(t[1][1], PHONES[0]);
  assert.deepEqual(masterMa(F, "M1"), []);
  assert.deepEqual(masterMa(F, "M2"), []);
});

test("phanBo_: anh điền GanDuAn -> khách sang đúng Master, rời ChuaPhanDuAn, KhachHang.DuAnQuanTam có mã", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "" }), khRow({ MaKhach: pad(2), SDT: PHONES[1], HoTen: NAMES[1], DuAnQuanTam: "" })] });
  run(ctx);
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn").getRange(2, 18).setValues([["bcons-central-park"]]);
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
  F.SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ChuaPhanDuAn").getRange(2, 18).setValues([["khong-co-ma"]]);
  run(ctx);
  const t = tab(F, null, "ChuaPhanDuAn");
  assert.equal(t[1][0], pad(1));
  assert.equal(t[1][17], "khong-co-ma");
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
  assert.equal(k.GhiChu, "ghi chú của anh");
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
  assert.deepEqual(r2, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 } });
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
  assert.deepEqual(r, { dayVao: { "bcons-newsky": 0, "bcons-central-park": 0 }, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 } });
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

test("phanBo_: một Master không mở được -> ném lỗi trước mọi lần ghi (kể cả xóa), thông báo không chứa tên/SĐT", () => {
  const { F, ctx } = build({ khach: [khRow({ MaKhach: pad(1), SDT: PHONES[0], HoTen: NAMES[0], DuAnQuanTam: "bcons-newsky" })], tuChoi: ["0900000001"], byId: { M1: { KhachTuMaster: [TM, [pad(1), PHONES[0], NAMES[0], "", "", "", "", "", "", "", "", ""]] } } });
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
  assert.deepEqual(dry, { dayVao: { "bcons-newsky": 1, "bcons-central-park": 1 }, chua: 1, chan: 1, lyDo: { tuchoi: 1, khong: 0 } });
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
