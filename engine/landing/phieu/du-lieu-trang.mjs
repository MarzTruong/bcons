// Dữ liệu nhúng vào trang phieu.html khi dựng landing (chỉ chạy ở Node, lúc build): lịch đợt + thông tin dự án, không SĐT.
import fs from "node:fs";
import path from "node:path";
import { loadCdt, planFromJson } from "../plans-json.mjs";
import { qrSvgSync } from "./render.mjs";

/** Mã QR: lấy bản lưu sẵn trong repo (build trên Cloudflare không cài thư viện); không có thì tự dựng nếu có thư viện. */
function qrChoLink(projDir, link) {
  const f = path.join(projDir, "landing", "phieu-qr.json");
  const kho = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
  if (kho?.link === link && kho.svg) return kho.svg;
  try {
    return qrSvgSync(link);
  } catch {
    throw new Error("Thiếu mã QR lưu sẵn cho link hiện tại: chạy `npm run phieu:qr` rồi commit du-an/<mã>/landing/phieu-qr.json");
  }
}

const docJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {});

/** keys: các mã PTTT cho phép xem ("03", ...). */
export function duLieuTrang(projDir, keys) {
  const cdt = loadCdt(projDir);
  const project = docJson(path.join(projDir, "project.json"));
  const landing = docJson(path.join(projDir, "landing", "landing.json"));
  const plans = {};
  for (const k of keys) plans[k] = planFromJson(cdt, k);
  return {
    duAn: { ma: project.ma, ten: project.ten },
    lienHe: { ten: project.lienHe?.ten ?? "", qrLink: project.watermark?.link ?? null, ...(project.watermark?.link ? { qrSvg: qrChoLink(projDir, project.watermark.link) } : {}) },
    plans,
    laiMacDinh: landing.laiGiaDinh ?? 9.5,
    namMacDinh: landing.namGiaDinh ?? 20,
  };
}
