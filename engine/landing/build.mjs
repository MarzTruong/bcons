// Xuất landing page tĩnh cho một dự án: engine/landing/dist/<mã>/
// Chạy ở gốc repo: node engine/landing/build.mjs [--du-an <mã>] [--nhap]
//   --nhap: cho phép thiếu tên/URL form (dải "BẢN NHÁP"), chỉ để xem thử, không đăng.
// Cloudflare Pages: build command "node engine/landing/build.mjs", output "engine/landing/dist/bcons-central-park".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readProjectConfig, takeProjectFlag } from "../remotion/scripts/project.mjs";
import { renderPage, renderPolicy } from "./page.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TYPES = ["Studio", "1PN-1WC", "2PN-1WC", "2PN-2WC", "3PN-2WC"];
const PHONE_RE = /(?<![\d.,])(?:\+?84|0)(?:[\s.-]?\d){8,10}(?!\d)/;

/** Lỗi dữ liệu landing (rỗng = đăng được). draft = true thì bỏ qua tên/URL form. */
export function checkLanding(data, { draft = false } = {}) {
  const errs = [];
  if (!draft && !data.dongY?.nguoiGiu?.trim()) errs.push("Chưa điền tên người giữ dữ liệu (dongY.nguoiGiu) cho ô đồng ý");
  if (!draft && !/^https:\/\/script\.google\.com\//.test(data.formUrl ?? "")) errs.push("Chưa có link nhận form (formUrl, link Web App của Apps Script)");
  const types = (data.canMau ?? []).map((u) => u.loai);
  for (const t of TYPES) if (!types.includes(t)) errs.push(`Thiếu căn mẫu loại ${t}`);
  for (const u of data.canMau ?? []) {
    for (const k of ["01", "02", "03", "04", "05"]) if (!(u.giaChuaVat?.[k] > 0)) errs.push(`Căn ${u.ma}: thiếu giá PTTT ${k}`);
    if (u.giaChuaVat?.["02"] !== u.giaChuaVat?.["03"]) errs.push(`Căn ${u.ma}: giá PTTT 02 và 03 phải bằng nhau`);
    if (u.giaChuaVat?.["04"] !== u.giaChuaVat?.["05"]) errs.push(`Căn ${u.ma}: giá PTTT 04 và 05 phải bằng nhau`);
  }
  const text = JSON.stringify({ ...data, canMau: undefined, formUrl: undefined });
  if (PHONE_RE.test(text)) errs.push("Nội dung landing có số điện thoại (không đưa SĐT lên trang)");
  return errs;
}

/** Trên máy có bảng giá (data/<mã>/bang-gia.csv): căn mẫu phải còn bán (không đã cọc, không CĐT LOCK). Cloudflare không có file này thì bỏ qua. */
export function checkStillForSale(data, csvPath) {
  if (!fs.existsSync(csvPath)) return [];
  const lines = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  // Cột cuối là "Có thể tư vấn? (đã cọc = đã bán)"; mã căn và cột cuối không chứa dấu phẩy.
  if (!/Có thể tư vấn/.test(lines[0].split(",").at(-1))) return [];
  const status = new Map(lines.slice(1).filter(Boolean).map((l) => [l.split(",")[0], l.split(",").at(-1).trim()]));
  return data.canMau.filter((u) => status.has(u.ma) && status.get(u.ma) !== "CÒN BÁN").map((u) => `Căn mẫu ${u.ma} không còn bán (${status.get(u.ma)}), chọn căn khác`);
}

export function buildLanding(projDir, outRoot, { draft = false } = {}) {
  const project = readProjectConfig(projDir);
  const data = JSON.parse(fs.readFileSync(path.join(projDir, "landing", "landing.json"), "utf8"));
  const errs = [...checkLanding(data, { draft }), ...checkStillForSale(data, path.join(projDir, "..", "..", "data", project.ma, "bang-gia.csv"))];
  if (errs.length) throw new Error(`Chưa đăng được landing:\n- ${errs.join("\n- ")}`);
  const out = path.join(outRoot, project.ma);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), renderPage(data, project, { draft }));
  fs.writeFileSync(path.join(out, "chinh-sach.html"), renderPolicy(data, project));
  // .js (không phải .mjs) để mọi máy chủ trả đúng loại file JavaScript
  fs.copyFileSync(path.join(HERE, "calc.mjs"), path.join(out, "calc.js"));
  fs.copyFileSync(path.join(HERE, "client.js"), path.join(out, "client.js"));
  fs.copyFileSync(path.join(projDir, data.anhChinh), path.join(out, path.basename(data.anhChinh)));
  fs.writeFileSync(path.join(out, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n");
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
    const out = buildLanding(projDir, path.join(HERE, "dist"), { draft: rest.includes("--nhap") });
    console.log(`Đã xuất landing: ${path.relative(process.cwd(), out)}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
