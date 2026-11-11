import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { timCanMau, timCotMaster, docCanTuMaster, timMasterFile, timCan } from "./can.mjs";

const ExcelJS = createRequire(new URL("../../remotion/package.json", import.meta.url))("exceljs");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CP = path.join(ROOT, "du-an", "bcons-central-park");

// Tiêu đề cột THẬT của hai Master File (Central Park gộp "PTTT 02 / 03"; Newsky có cột "Tính lại" phải bỏ qua)
const H_CP = ["Mã căn", "Block", "Tầng", "Vị trí", "Loại căn", "PN", "WC", "DT tim tường (m²)", "DT thông thủy (m²)",
  "Giá chưa VAT\nPTTT 01 (sau CK 8,5%)", "Đơn giá tim tường\nPTTT 01", "Giá có VAT\nPTTT 01", "Giá chưa VAT\nPTTT 02 / 03", "Đơn giá tim tường\nPTTT 02 / 03", "Giá có VAT\nPTTT 02 / 03",
  "Phí bảo trì 2%\nPTTT 01", "Phí bảo trì 2%\nPTTT 02 / 03", "Chênh lệch giá chưa VAT\n(PTTT 02/03 − 01)", "Rổ giá tốt", "Số KH đang giữ/mua", "Tình trạng trong Master",
  "Giá chưa VAT\nPTTT 04 / 05 (CK 2,45%)", "Đơn giá tim tường\nPTTT 04 / 05", "Giá có VAT\nPTTT 04 / 05", "Phí bảo trì 2%\nPTTT 04 / 05", "Tình trạng trên\nGIỎ HÀNG CHUNG"];
const H_NS = ["Mã căn", "Block", "Tầng", "Vị trí", "Loại căn", "PN", "WC", "Hướng view", "DT tim tường (m²)", "DT thông thủy (m²)",
  "Giá chưa VAT\nPTTT 08 (giá CĐT)", "Đơn giá tim tường\nPTTT 08", "Giá có VAT\nPTTT 08", "Giá chưa VAT\nPTTT 09 (giá gốc)", "Đơn giá tim tường\nPTTT 09", "Giá có VAT\nPTTT 09",
  "Phí bảo trì 2%\nPTTT 08", "Phí bảo trì 2%\nPTTT 09", "Chênh lệch giá chưa VAT\n(PTTT 09 − 08)", "Rổ giá tốt", "Số KH đang giữ/mua", "Tình trạng trong Master",
  "Giá chưa VAT\nPTTT 10 (giá CĐT)", "Đơn giá tim tường\nPTTT 10", "Giá có VAT\nPTTT 10", "Phí bảo trì 2%\nPTTT 10", "Tình trạng trên\nGIỎ HÀNG CHUNG",
  "Tính lại PTTT 08\n(giá 09 − CK 5,65%)", "Tính lại PTTT 10\n(giá 09 − CK 2,15%)"];

test("timCotMaster: Central Park, cột gộp 'PTTT 02 / 03' cho cả 02 và 03, bỏ đơn giá/có VAT/phí", () => {
  const c = timCotMaster(H_CP);
  assert.equal(c.ma, 0);
  assert.deepEqual(c.gia, { "01": 9, "02": 12, "03": 12, "04": 21, "05": 21 });
  assert.equal(c.tinhTrang, 25);
  assert.equal(c.tim, 7);
  assert.equal(c.thongThuy, 8);
});

test("timCotMaster: Newsky PTTT 08, 09, 10; bỏ cột 'Tính lại'", () => {
  const c = timCotMaster(H_NS);
  assert.deepEqual(c.gia, { "08": 10, "09": 13, "10": 22 });
  assert.equal(c.tinhTrang, 26);
  assert.equal(timCotMaster(["Họ tên", "SĐT"]), null);
});

async function taoMaster(file, headers, rows, tenSheet = "GiaTongHop") {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet("KhachHang").addRow(["Tên khách", "SĐT"]);
  const ws = wb.addWorksheet(tenSheet);
  ws.addRow(["BẢNG GIÁ TỔNG HỢP"]); ws.addRow([]); ws.addRow([]);
  ws.addRow(headers);
  for (const r of rows) ws.addRow(r);
  await wb.xlsx.writeFile(file);
}

test("docCanTuMaster: đọc căn B1.3-01 của Newsky (cả ô công thức) và trả null cho mã lạ", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "can-"));
  const f = path.join(tmp, "MasterFile_BconsNewsky.xlsx");
  const row = (ma, tt) => { const r = new Array(H_NS.length).fill(null); r[0] = ma; r[1] = "B1"; r[2] = 3; r[4] = { formula: 'IF(F5=0,"Studio",F5&"PN")', result: "3PN-2WC" }; r[8] = 77.81; r[9] = 70.06; r[10] = 3831261156; r[13] = 4060690141; r[22] = 3973385292; r[26] = { formula: "IF(1,\"Trống\")", result: tt }; return r; };
  await taoMaster(f, H_NS, [row("B1.3-01", "Trống"), row("B1.3-03", "ĐÃ CỌC")]);
  const c = await docCanTuMaster(f, " b1.3-01 ");
  assert.equal(c.ma, "B1.3-01");
  assert.equal(c.loai, "3PN-2WC");
  assert.equal(c.dtTimTuong, 77.81);
  assert.deepEqual(c.giaChuaVat, { "08": 3831261156, "09": 4060690141, "10": 3973385292 });
  assert.equal(c.tinhTrang, "Trống");
  assert.equal((await docCanTuMaster(f, "B1.3-03")).tinhTrang, "ĐÃ CỌC");
  assert.equal(await docCanTuMaster(f, "Z9.9-99"), null);
});

test("timCanMau: lấy căn từ landing.json; timCan rơi về căn mẫu khi không có Master File", async () => {
  const m = timCanMau(CP, "a18-09");
  assert.equal(m.ma, "A18-09");
  assert.equal(m.giaChuaVat["03"], 4066746600);
  assert.equal(timCanMau(CP, "KHONG-CO"), null);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "drv-"));
  assert.equal(timMasterFile(CP, { env: { DRIVE_DIR: tmp } }), null);
  assert.equal((await timCan(CP, "A18-09", { env: { DRIVE_DIR: tmp } })).ma, "A18-09");
});

test("timMasterFile: bỏ file tạm ~$ của Excel, lấy MasterFile_*.xlsx trong data/<mã>/gia", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "drv-"));
  const dir = path.join(tmp, "data", "bcons-central-park", "gia");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "~$MasterFile_BconsCentralPark.xlsx"), "x");
  assert.equal(timMasterFile(CP, { env: { DRIVE_DIR: tmp } }), null);
  fs.writeFileSync(path.join(dir, "MasterFile_BconsCentralPark.xlsx"), "x");
  assert.equal(path.basename(timMasterFile(CP, { env: { DRIVE_DIR: tmp } })), "MasterFile_BconsCentralPark.xlsx");
});
