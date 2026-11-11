// Dựng dữ liệu phiếu tính (phieu.json) từ một căn + PTTT. Template HTML chỉ đọc cấu trúc này.
import fs from "node:fs";
import path from "node:path";
import { calcWith, pmt } from "../calc.mjs";
import { loadCdt, planFromJson } from "../plans-json.mjs";

const KHONG_LAP = new Set(["ĐÃ CỌC", "LOCK", "Không có trong GHC"]);
const LOAI = { loan: "nganhang", handover: "bangiao", so: "sohong" };

const docJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {});
const dd = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

/** o: {projDir, can: CanInfo, pttt: "03"|"PTTT 03", lai?, nam?, khach?: {ten?}, ngay?: Date} → Phieu. Lỗi bắt đầu bằng "Không lập phiếu:". */
export function taoPhieu({ projDir, can, pttt, lai, nam, khach = {}, ngay = new Date() }) {
  const key = String(pttt).replace(/\D/g, "").padStart(2, "0");
  if (KHONG_LAP.has(can.tinhTrang)) throw new Error(`Không lập phiếu: căn ${can.ma} ${can.tinhTrang === "LOCK" ? "đang LOCK (chưa mở bán)" : can.tinhTrang === "ĐÃ CỌC" ? "đã cọc (đã bán)" : "không có trong giỏ hàng"}.`);
  const cdt = loadCdt(projDir);
  if (!cdt.pttt?.[key]) throw new Error(`Không lập phiếu: dự án không có PTTT ${key}.`);
  const P = can.giaChuaVat?.[key];
  if (!(P > 0)) throw new Error(`Không lập phiếu: căn ${can.ma} chưa có giá PTTT ${key}.`);
  const plan = planFromJson(cdt, key);
  const r = calcWith(plan, P);
  const project = docJson(path.join(projDir, "project.json"));
  const landing = docJson(path.join(projDir, "landing", "landing.json"));
  const laiDung = lai ?? landing.laiGiaDinh ?? 9.5;
  const namDung = nam ?? landing.namGiaDinh ?? 20;
  const ten = (khach.ten ?? "").trim();
  return {
    duAn: { ma: project.ma, ten: project.ten },
    khach: { xungHo: ten ? `anh/chị ${ten}` : "anh/chị" },
    ngay: dd(ngay),
    can: { ma: can.ma, loai: can.loai, thap: can.thap ?? null, tang: can.tang ?? null, dtTimTuong: can.dtTimTuong, dtThongThuy: can.dtThongThuy ?? null },
    pttt: { ma: key, ten: plan.name, ghiChu: plan.tag, coTranLai: plan.cap, chietKhau: plan.chietKhau },
    gia: { chuaVat: r.P, vat: r.V, coVat: r.G, phiBaoTri: r.fee },
    dot: r.rows.map((x) => ({ nhan: x.l, thoiDiem: x.w, soTien: x.amt, loai: LOAI[x.k] ?? "tuco" })),
    tong: { tuCoTruocBanGiao: r.ownBefore, khoanVay: r.loan, banGiao: r.handover, soHong: r.so },
    vay: r.loan > 0 ? { soTien: r.loan, lai: laiDung, namVay: namDung, traGopThang: Math.round(pmt(r.loan, laiDung, namDung)) } : null,
    lienHe: { ten: project.lienHe?.ten ?? "", qrLink: project.watermark?.link ?? null },
  };
}
