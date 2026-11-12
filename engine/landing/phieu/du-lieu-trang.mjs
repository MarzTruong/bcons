// Dữ liệu nhúng vào trang phieu.html khi dựng landing (chỉ chạy ở Node, lúc build): lịch đợt + thông tin dự án, không SĐT.
import fs from "node:fs";
import path from "node:path";
import { loadCdt, planFromJson } from "../plans-json.mjs";
import { qrSvgSync } from "./render.mjs";

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
    lienHe: { ten: project.lienHe?.ten ?? "", qrLink: project.watermark?.link ?? null, ...(project.watermark?.link ? { qrSvg: qrSvgSync(project.watermark.link) } : {}) },
    plans,
    laiMacDinh: landing.laiGiaDinh ?? 9.5,
    namMacDinh: landing.namGiaDinh ?? 20,
  };
}
