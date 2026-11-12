// Dựng phiếu ngay trong trình duyệt từ liên kết `phieu.html?...` (hướng A: máy anh tắt vẫn chạy).
// Hàm thuần, chạy được cả ở Node (test) lẫn trình duyệt. Không nhận ảnh hay số từ máy chủ: mọi số tính lại bằng lõi calc.
import { dungPhieu } from "./phieu-core.mjs";

const sach = (s, max) => String(s ?? "").replace(/[<>&"'`\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const so = (s) => (s != null && s !== "" && /^\d+(\.\d+)?$/.test(String(s)) ? Number(s) : NaN);

/**
 * search: chuỗi "?k=03&g=...". D: dữ liệu trang {duAn, lienHe, plans: {k: plan}, laiMacDinh, namMacDinh}.
 * Tham số: k = mã PTTT, g = giá chưa VAT của PTTT đó (đồng), l = lãi giả định %, n = số năm vay,
 * m = mã căn, c = loại căn, th = tháp, tg = tầng, d = diện tích tim tường, dt = diện tích thông thủy, t = tên khách.
 * Trả {ok: true, phieu} hoặc {ok: false, loi}.
 */
export function phieuTuLienKet(search, D, ngay = new Date()) {
  const q = new URLSearchParams(search);
  const k = String(q.get("k") ?? "");
  const plan = D.plans?.[k];
  if (!plan) return { ok: false, loi: "Liên kết không đúng (thiếu phương thức thanh toán)." };
  const g = so(q.get("g"));
  if (!(g >= 1e9 && g <= 2e10)) return { ok: false, loi: "Liên kết không đúng (giá không hợp lệ)." };
  const lai = q.has("l") ? so(q.get("l")) : D.laiMacDinh ?? 9.5;
  const nam = q.has("n") ? so(q.get("n")) : D.namMacDinh ?? 20;
  if (!(lai >= 0 && lai <= 30) || !(nam >= 1 && nam <= 35)) return { ok: false, loi: "Liên kết không đúng (lãi hoặc số năm vay không hợp lệ)." };
  const ma = String(q.get("m") ?? "").toUpperCase();
  const d = so(q.get("d"));
  const dt = so(q.get("dt"));
  const tg = so(q.get("tg"));
  const can = {
    ma: /^[A-Z0-9.\-]{3,14}$/.test(ma) ? ma : null,
    loai: sach(q.get("c"), 40),
    thap: sach(q.get("th"), 30) || null,
    tang: tg >= 1 && tg <= 99 ? Math.round(tg) : null,
    dtTimTuong: d >= 20 && d <= 200 ? d : 0,
    dtThongThuy: dt >= 20 && dt <= 200 ? dt : null,
  };
  const phieu = dungPhieu({ plan, key: k, P: Math.round(g), can, duAn: D.duAn, lienHe: D.lienHe, lai, nam, khach: { ten: sach(q.get("t"), 30) }, ngay });
  return { ok: true, phieu };
}
