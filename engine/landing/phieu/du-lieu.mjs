// Dựng dữ liệu phiếu tính (phieu.json) từ một căn + PTTT. Template HTML chỉ đọc cấu trúc này.
import fs from "node:fs";
import path from "node:path";
import { loadCdt, planFromJson } from "../plans-json.mjs";
import { dungPhieu } from "./phieu-core.mjs";

const KHONG_LAP = new Set(["ĐÃ CỌC", "LOCK", "Không có trong GHC"]);

const docJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {});

/** o: {projDir, can: CanInfo, pttt: "03"|"PTTT 03", lai?, nam?, khach?: {ten?}, ngay?: Date} → Phieu. Lỗi bắt đầu bằng "Không lập phiếu:". */
export function taoPhieu({ projDir, can, pttt, lai, nam, khach = {}, ngay = new Date() }) {
  const key = String(pttt).replace(/\D/g, "").padStart(2, "0");
  if (KHONG_LAP.has(can.tinhTrang)) throw new Error(`Không lập phiếu: căn ${can.ma} ${can.tinhTrang === "LOCK" ? "đang LOCK (chưa mở bán)" : can.tinhTrang === "ĐÃ CỌC" ? "đã cọc (đã bán)" : "không có trong giỏ hàng"}.`);
  const cdt = loadCdt(projDir);
  if (!cdt.pttt?.[key]) throw new Error(`Không lập phiếu: dự án không có PTTT ${key}.`);
  const P = can.giaChuaVat?.[key];
  if (!(P > 0)) throw new Error(`Không lập phiếu: căn ${can.ma} chưa có giá PTTT ${key}.`);
  const plan = planFromJson(cdt, key);
  const project = docJson(path.join(projDir, "project.json"));
  const landing = docJson(path.join(projDir, "landing", "landing.json"));
  return dungPhieu({
    plan, key, P, can, ngay, khach,
    duAn: { ma: project.ma, ten: project.ten },
    lienHe: { ten: project.lienHe?.ten, qrLink: project.watermark?.link },
    lai: lai ?? landing.laiGiaDinh ?? 9.5,
    nam: nam ?? landing.namGiaDinh ?? 20,
  });
}

