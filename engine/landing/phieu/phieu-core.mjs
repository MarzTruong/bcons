// Lõi dựng dữ liệu phiếu (hàm thuần, không đọc file): dùng chung cho máy anh (du-lieu.mjs) và trình duyệt (phieu-web.mjs).
// Giao diện phiếu (template) chỉ đọc kết quả này; không thêm logic tính tiền vào template.
import { calcWith, pmt } from "../calc.mjs";

const LOAI = { loan: "nganhang", handover: "bangiao", so: "sohong" };
const dd = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

/**
 * plan: kết quả planFromJson; key: "03"; P: giá chưa VAT của PTTT đó; can: {ma, loai, thap, tang, dtTimTuong, dtThongThuy};
 * duAn: {ma, ten}; lienHe: {ten, qrLink}; lai, nam: giả định vay. Trả Phieu (xem spec phieu-tinh-design).
 */
export function dungPhieu({ plan, key, P, can, duAn, lienHe, lai, nam, khach = {}, ngay = new Date() }) {
  const r = calcWith(plan, P);
  const ten = (khach.ten ?? "").trim();
  return {
    duAn: { ma: duAn.ma, ten: duAn.ten },
    khach: { xungHo: ten ? `anh/chị ${ten}` : "anh/chị" },
    ngay: dd(ngay),
    can: { ma: can.ma ?? null, loai: can.loai, thap: can.thap ?? null, tang: can.tang ?? null, dtTimTuong: can.dtTimTuong, dtThongThuy: can.dtThongThuy ?? null },
    pttt: { ma: key, ten: plan.name, ghiChu: plan.tag, coTranLai: plan.cap, chietKhau: plan.chietKhau },
    gia: { chuaVat: r.P, vat: r.V, coVat: r.G, phiBaoTri: r.fee },
    dot: r.rows.map((x) => ({ nhan: x.l, thoiDiem: x.w, soTien: x.amt, loai: LOAI[x.k] ?? "tuco" })),
    tong: { tuCoTruocBanGiao: r.ownBefore, khoanVay: r.loan, banGiao: r.handover, soHong: r.so },
    vay: r.loan > 0 ? { soTien: r.loan, lai, namVay: nam, traGopThang: Math.round(pmt(r.loan, lai, nam)) } : null,
    lienHe: { ten: lienHe.ten ?? "", qrLink: lienHe.qrLink ?? null, ...(lienHe.qrSvg ? { qrSvg: lienHe.qrSvg } : {}) },
  };
}
