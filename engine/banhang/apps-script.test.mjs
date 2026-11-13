// Apps Script giỏ hàng: chạy Code.gs trong vm với Sheet giả có đúng tiêu đề cột của Master File Newsky (gộp, trùng, xuống dòng).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { timCotMaster } from "../landing/phieu/can.mjs";

const SRC = fs.readFileSync(new URL("./apps-script/Code.gs", import.meta.url), "utf8");

// Tiêu đề thật của GiaTongHop (Master File Newsky), chỉ các cột giỏ hàng; cột khác là chỗ giữ vị trí (có cột nội bộ).
const HEADER = Array.from({ length: 36 }, (_, i) => `cột nội bộ ${i}`);
Object.assign(HEADER, {
  0: "Mã căn", 1: "Block", 2: "Tầng", 3: "Block", 4: "Loại căn", 7: "DT tim tường (m²)", 8: "DT thông thủy (m²)",
  9: "Giá chưa VAT\nPTTT 08 (giá CĐT)", 12: "Giá chưa VAT\nPTTT 09 (giá gốc)", 21: "Giá chưa VAT\nPTTT 10 (giá CĐT)",
  25: "Tình trạng trên\nGIỎ HÀNG CHUNG", 34: "Hướng view",
});
const hang = (ma, over = {}) => {
  const r = Array(36).fill("");
  const m = /^B(\d)\.(\d+)-(\d+)$/i.exec(ma);
  Object.assign(r, { 0: ma, 1: `B${m[1]}`, 2: Number(m[2]), 3: "KHÔNG DÙNG", 4: "2PN-2WC", 7: 55.15, 8: 49.8, 9: 2_800_000_000, 12: 2_968_000_000, 21: 2_904_000_000, 25: "Trống", 34: "Tây Nam", 30: "HOA HỒNG NỘI BỘ 123", 31: "Nguyễn Văn Khách 0909 000 000" }, over);
  return r;
};
const SHEET = [["Bảng giá tổng hợp"], [], [], HEADER, hang("B1.3-02"), hang("b2.10-3", { 25: "ĐÃ CỌC" }), hang("B2.4-01", { 25: "CĐT LOCK" }), ["", "", "tổng"], hang("B1.29-12", { 9: "", 34: "" })];

function chay({ khoa = "BI-MAT", dua = "BI-MAT", values = SHEET } = {}) {
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === "KHOA" ? khoa : null) }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ s, setMimeType() { return this; } }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => (n === "GiaTongHop" ? { getDataRange: () => ({ getValues: () => values }) } : null) }) },
    Date, JSON, Number, String, Math, Object, Error, RegExp,
  };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return JSON.parse(vm.runInContext("doGet", ctx)({ parameter: dua === null ? {} : { khoa: dua } }).s);
}

test("đúng khóa: trả giỏ hàng đúng hợp đồng, bỏ dòng tổng, chuẩn hóa mã, đủ 3 PTTT, có hướng và tình trạng", () => {
  const d = chay();
  assert.equal(d.can.length, 4);
  assert.deepEqual(d.can.map((c) => c.ma), ["B1.3-02", "B2.10-03", "B2.4-01", "B1.29-12"]);
  const c = d.can[0];
  assert.deepEqual(c, { ma: "B1.3-02", thap: "B", block: "B1", tang: 3, viTri: 2, loai: "2PN-2WC", huong: "Tây Nam", dtTimTuong: 55.15, dtThongThuy: 49.8,
    giaChuaVat: { "08": 2_800_000_000, "09": 2_968_000_000, "10": 2_904_000_000 }, tinhTrang: "Trống" });
  assert.equal(d.can[1].tinhTrang, "ĐÃ CỌC");
  assert.equal(d.can[2].tinhTrang, "CĐT LOCK"); // lọc LOCK là việc của lõi giohang.mjs/giao diện, nhưng dữ liệu vẫn đủ để lõi quyết
  assert.equal(d.can[3].huong, null);
  assert.ok(!("08" in d.can[3].giaChuaVat));
  assert.ok(Date.parse(d.capNhat) > 0);
});

test("không rò cột nội bộ: không có hoa hồng, tên/SĐT khách trong kết quả", () => {
  const s = JSON.stringify(chay());
  assert.ok(!/HOA HỒNG|Nguyễn Văn Khách|0909|KHÔNG DÙNG/.test(s));
});

test("sai khóa, thiếu khóa, chưa đặt khóa: chỉ báo lỗi khoa, không có dữ liệu", () => {
  for (const o of [{ dua: "SAI" }, { dua: null }, { dua: "" }, { khoa: null, dua: "" }, { khoa: "", dua: "" }]) {
    const d = chay(o);
    assert.deepEqual(d, { loi: "khoa" });
  }
});

test("sheet đổi cấu trúc (không còn bảng giá) thì báo lỗi máy chủ, không trả nửa vời", () => {
  assert.deepEqual(chay({ values: [["a"], ["b"]] }), { loi: "may-chu" });
});

test("cột Master dò đúng như lõi phiếu (can.mjs): cùng vị trí mã, loại, tầng, diện tích, giá, tình trạng", () => {
  const cot = timCotMaster(HEADER);
  assert.equal(cot.ma, 0);
  assert.equal(cot.block, 1); // tiêu đề Block lặp: lấy cột đầu
  assert.deepEqual(cot.gia, { "08": 9, "09": 12, "10": 21 });
  const d = chay();
  assert.equal(d.can[0].dtTimTuong, SHEET[4][cot.tim]);
  assert.equal(d.can[0].giaChuaVat["09"], SHEET[4][cot.gia["09"]]);
  assert.equal(d.can[0].tinhTrang, SHEET[4][cot.tinhTrang]);
});

test("cột giá gộp 'PTTT 02 / 03' (Central Park) vẫn thành hai PTTT dùng chung một cột", () => {
  const h = [...HEADER];
  h[9] = "Giá chưa VAT\nPTTT 02 / 03 (giá niêm yết)";
  const d = chay({ values: [h, hang("B1.3-02")] });
  assert.equal(d.can[0].giaChuaVat["02"], d.can[0].giaChuaVat["03"]);
});
