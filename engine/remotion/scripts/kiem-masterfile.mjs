// Kiểm Master File (do AI làm) theo "đáp án" của CĐT: du-an/<mã>/nguon/pttt-cdt.json (chép từ 5 thông báo PTTT).
// Mỗi căn: PTTT 01 = PTTT 02 trừ 8,5%; PTTT 03 = PTTT 02; PTTT 04 = PTTT 05 = PTTT 02 trừ 2,45% (sai lệch ≤ 1.000 đồng).
// Chỉ đọc sheet có cột giá PTTT (tự dò theo tiêu đề), KHÔNG đọc sheet khách hàng/hoa hồng. Không ghi gì ra ngoài.
// Chạy trên máy anh: npm run kiem-gia   (bot: /kiemgia). File lấy từ Drive data/<mã>/gia/*.xlsx.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { sharedDir, takeProjectFlag } from "./project.mjs";

const TOL = 1000;
const SKIP_SHEET = /khach|hoa ?hong|thuong|kh\b/i;
const fold = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

/** Vị trí cột "Mã căn" và cột giá từng PTTT trong một dòng tiêu đề; thiếu PTTT nào thì null. */
export function findPriceColumns(header) {
  const out = {};
  header.forEach((h, i) => {
    const t = fold(h);
    if (out.ma === undefined && /ma can|ma\s*$|^ma\b/.test(t)) out.ma = i;
    const m = t.match(/pttt\s*0?([1-5])\b/);
    if (m && /gia|vat/.test(t) || (m && !/tien|dot|vay|so tien/.test(t))) {
      const k = `0${m[1]}`;
      if (out[k] === undefined) out[k] = i;
    }
  });
  return ["01", "02", "03", "04", "05"].every((k) => out[k] !== undefined) && out.ma !== undefined ? out : null;
}

const num = (v) => {
  if (v && typeof v === "object" && "result" in v) v = v.result; // ô công thức
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function kiemMasterFile(file, cdt) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  for (const ws of wb.worksheets) {
    if (SKIP_SHEET.test(fold(ws.name))) continue;
    let cols = null;
    let headerRow = 0;
    for (let r = 1; r <= Math.min(ws.rowCount, 15) && !cols; r++) {
      const vals = (ws.getRow(r).values ?? []).slice(1).map((v) => (v && typeof v === "object" && "richText" in v ? v.richText.map((x) => x.text).join("") : v));
      cols = findPriceColumns(vals);
      headerRow = r;
    }
    if (!cols) continue;
    const ck1 = cdt.pttt["01"].chietKhau;
    const ck4 = cdt.pttt["04"].chietKhau;
    const ck5 = cdt.pttt["05"].chietKhau;
    const loi = [];
    let soCan = 0;
    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r).values ?? [];
      const ma = String(row[cols.ma + 1] ?? "").trim();
      const g = Object.fromEntries(["01", "02", "03", "04", "05"].map((k) => [k, num(row[cols[k] + 1])]));
      if (!ma || !g["02"]) continue;
      soCan++;
      const want = { "01": g["02"] * (1 - ck1), "03": g["02"], "04": g["02"] * (1 - ck4), "05": g["02"] * (1 - ck5) };
      for (const [k, w] of Object.entries(want)) {
        if (g[k] == null || Math.abs(g[k] - w) > TOL) loi.push({ ma, pttt: k, co: g[k], dung: Math.round(w) });
      }
    }
    return { sheet: ws.name, soCan, loi };
  }
  throw new Error("Không thấy sheet có đủ cột giá PTTT 01–05 (dò theo tiêu đề trong 15 dòng đầu).");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
  const ma = path.basename(projDir);
  const cdt = JSON.parse(fs.readFileSync(path.join(projDir, "nguon", "pttt-cdt.json"), "utf8"));
  const dir = path.join(sharedDir("data"), ma, "gia");
  const file = rest[0] ?? (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.xlsx$/i.test(f) && !f.startsWith("~$")).map((f) => path.join(dir, f))[0] : null);
  if (!file) {
    console.error(`Không thấy Master File (.xlsx) trong ${dir}`);
    process.exit(1);
  }
  kiemMasterFile(file, cdt)
    .then((r) => {
      console.log(`Master File: ${path.basename(file)}, sheet ${r.sheet}: ${r.soCan} căn.`);
      if (!r.loi.length) console.log("✅ Mọi căn khớp tỷ lệ của CĐT (PTTT 01 −8,5%; 03 = 02; 04, 05 −2,45%).");
      else {
        console.log(`❌ ${r.loi.length} chỗ lệch (hiện 30 dòng đầu):`);
        for (const e of r.loi.slice(0, 30)) console.log(`- ${e.ma} PTTT ${e.pttt}: file ghi ${e.co ?? "trống"}, đúng phải ≈ ${e.dung}`);
      }
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
