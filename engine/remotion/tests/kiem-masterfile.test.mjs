import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { kiemMasterFile, findPriceColumns } from "../scripts/kiem-masterfile.mjs";

const cdt = JSON.parse(fs.readFileSync(new URL("../../../du-an/bcons-central-park/nguon/pttt-cdt.json", import.meta.url), "utf8"));

async function makeBook(rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("GiaTongHop");
  ws.addRow(["Bảng giá"]);
  ws.addRow(["Mã căn", "Loại", "Giá chưa VAT PTTT 01", "Giá chưa VAT PTTT 02", "Giá chưa VAT PTTT 03", "Giá chưa VAT PTTT 04", "Giá chưa VAT PTTT 05", "Tình trạng"]);
  for (const r of rows) ws.addRow(r);
  wb.addWorksheet("KhachHang").addRow(["Tên khách", "SĐT"]);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mf-")), "m.xlsx");
  await wb.xlsx.writeFile(f);
  return f;
}

test("findPriceColumns: dò cột giá PTTT 01–05 theo tiêu đề (không cần biết vị trí cột)", () => {
  const cols = findPriceColumns(["Mã căn", "x", "Giá chưa VAT PTTT 01", "Giá PTTT02", "PTTT 03 (chưa VAT)", "Giá chưa VAT PTTT 04", "Giá chưa VAT PTTT 05"]);
  assert.deepEqual(cols, { ma: 0, "01": 2, "02": 3, "03": 4, "04": 5, "05": 6 });
});

test("kiemMasterFile: căn đúng tỷ lệ CĐT thì qua; căn sai thì liệt kê; không đọc sheet khách/hoa hồng", async () => {
  const p2 = 4_000_000_000;
  const ok = ["A1-01", "2PN", Math.round(p2 * 0.915), p2, p2, Math.round(p2 * 0.9755), Math.round(p2 * 0.9755), "CÒN BÁN"];
  const sai = ["A1-02", "2PN", Math.round(p2 * 0.92), p2, p2 + 5_000_000, Math.round(p2 * 0.9755), Math.round(p2 * 0.97), "CÒN BÁN"];
  const r = await kiemMasterFile(await makeBook([ok, sai]), cdt);
  assert.equal(r.sheet, "GiaTongHop");
  assert.equal(r.soCan, 2);
  const loi = r.loi.map((e) => `${e.ma} ${e.pttt}`);
  assert.deepEqual(loi.sort(), ["A1-02 01", "A1-02 03", "A1-02 05"]);
  assert.ok(!JSON.stringify(r).includes("Tên khách"));
});

test("findPriceColumns: tiêu đề thật của Master File gộp cột PTTT 02 / 03 và 04 / 05, bỏ cột đơn giá, có VAT, phí bảo trì, chênh lệch", () => {
  const header = [
    "Mã căn", "Block", "Tầng", "Vị trí", "Loại căn", "PN", "WC", "DT tim tường (m²)", "DT thông thủy (m²)",
    "Giá chưa VAT\nPTTT 01 (sau CK 8,5%)", "Đơn giá tim tường\nPTTT 01", "Giá có VAT\nPTTT 01",
    "Giá chưa VAT\nPTTT 02 / 03", "Đơn giá tim tường\nPTTT 02 / 03", "Giá có VAT\nPTTT 02 / 03",
    "Phí bảo trì 2%\nPTTT 01", "Phí bảo trì 2%\nPTTT 02 / 03", "Chênh lệch giá chưa VAT\n(PTTT 02/03 − 01)",
    "Rổ giá tốt", "Số KH đang giữ/mua", "Tình trạng trong Master",
    "Giá chưa VAT\nPTTT 04 / 05 (CK 2,45%)", "Đơn giá tim tường\nPTTT 04 / 05", "Giá có VAT\nPTTT 04 / 05", "Phí bảo trì 2%\nPTTT 04 / 05",
  ];
  assert.deepEqual(findPriceColumns(header), { ma: 0, "01": 9, "02": 12, "03": 12, "04": 21, "05": 21 });
});
