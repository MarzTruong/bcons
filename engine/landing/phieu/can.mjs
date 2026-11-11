// Tìm căn để lập phiếu: Master File (sheet GiaTongHop, tự dò cột theo tiêu đề) hoặc căn mẫu trong landing.json.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { sharedDir } from "../../remotion/scripts/project.mjs";

const ExcelJS = createRequire(new URL("../../remotion/package.json", import.meta.url))("exceljs");
const fold = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/\s+/g, " ").trim();
const chuan = (ma) => String(ma ?? "").trim().toUpperCase();
const hai = (n) => String(n).padStart(2, "0");

/** Căn mẫu trong du-an/<mã>/landing/landing.json (canMau). */
export function timCanMau(projDir, ma) {
  const file = path.join(projDir, "landing", "landing.json");
  if (!fs.existsSync(file)) return null;
  const u = JSON.parse(fs.readFileSync(file, "utf8")).canMau?.find((c) => chuan(c.ma) === chuan(ma));
  if (!u) return null;
  return { ma: u.ma, loai: u.loai, thap: u.thap, tang: u.tang, dtTimTuong: u.dtTimTuong, dtThongThuy: u.dtThongThuy, giaChuaVat: u.giaChuaVat };
}

/** Vị trí các cột trong một dòng tiêu đề của GiaTongHop; null nếu không phải bảng giá. Cột "PTTT 02 / 03" là một cột giá dùng chung. */
export function timCotMaster(header) {
  const out = { gia: {} };
  header.forEach((h, i) => {
    const t = fold(h);
    if (out.ma === undefined && /^ma can$/.test(t)) out.ma = i;
    else if (/^loai can$/.test(t)) out.loai = i;
    else if (/^block$/.test(t)) out.block = i;
    else if (/^tang$/.test(t)) out.tang = i;
    else if (/^dt tim tuong/.test(t)) out.tim = i;
    else if (/^dt thong thuy/.test(t)) out.thongThuy = i;
    else if (/^tinh trang tren gio hang chung/.test(t)) out.tinhTrang = i;
    else if (/^gia chua vat/.test(t)) {
      const m = t.match(/pttt\s*(\d{1,2}(?:\s*\/\s*\d{1,2})*)/);
      if (m) for (const n of m[1].split("/")) out.gia[hai(n.trim())] ??= i;
    }
  });
  return out.ma !== undefined && Object.keys(out.gia).length ? out : null;
}

const giaTri = (v) => (v && typeof v === "object" && "result" in v ? v.result : v && typeof v === "object" && "richText" in v ? v.richText.map((x) => x.text).join("") : v);

/** Đọc căn `ma` từ Master File .xlsx (sheet GiaTongHop); null nếu không thấy sheet hoặc mã. */
export async function docCanTuMaster(file, ma) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet("GiaTongHop");
  if (!ws) return null;
  let cot = null;
  let hang = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 15) && !cot; r++) {
    cot = timCotMaster((ws.getRow(r).values ?? []).slice(1).map(giaTri));
    hang = r;
  }
  if (!cot) return null;
  const can = chuan(ma);
  for (let r = hang + 1; r <= ws.rowCount; r++) {
    const v = (ws.getRow(r).values ?? []).slice(1).map(giaTri);
    if (chuan(v[cot.ma]) !== can) continue;
    const giaChuaVat = {};
    for (const [k, i] of Object.entries(cot.gia)) if (Number(v[i]) > 0) giaChuaVat[k] = Number(v[i]);
    return {
      ma: can, loai: cot.loai !== undefined ? String(v[cot.loai] ?? "") : "", thap: cot.block !== undefined ? String(v[cot.block] ?? "") : undefined,
      tang: cot.tang !== undefined ? Number(v[cot.tang]) || undefined : undefined,
      dtTimTuong: Number(v[cot.tim]) || 0, dtThongThuy: Number(v[cot.thongThuy]) || undefined,
      giaChuaVat, tinhTrang: cot.tinhTrang !== undefined && v[cot.tinhTrang] ? String(v[cot.tinhTrang]) : undefined,
    };
  }
  return null;
}

/** MasterFile_*.xlsx của dự án trong data/<mã>/gia (Drive hoặc repo), bỏ file tạm ~$; null nếu không có. */
export function timMasterFile(projDir, opts = {}) {
  const dir = path.join(sharedDir("data", opts), path.basename(projDir), "gia");
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).filter((n) => /^MasterFile_.*\.xlsx$/i.test(n) && !n.startsWith("~$")).sort()[0];
  return f ? path.join(dir, f) : null;
}

/** Master File trước (có tình trạng giỏ hàng), căn mẫu trong landing.json sau. */
export async function timCan(projDir, ma, opts = {}) {
  const f = timMasterFile(projDir, opts);
  if (f) {
    const c = await docCanTuMaster(f, ma);
    if (c) return c;
  }
  return timCanMau(projDir, ma);
}
