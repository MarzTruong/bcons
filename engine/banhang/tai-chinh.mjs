// Tài chính của công cụ bán hàng: một chỗ duy nhất để giao diện lấy số tiền, dùng lõi calc.mjs + pttt-cdt.json.
// Giao diện (AGY) không tự viết công thức; mọi số hiện ra khách đều đi qua `phuongAn`.
// File này chạy cả trong trình duyệt (chỉ nhập calc.mjs, không nhập fs); plan dựng ở build từ pttt-cdt.json (plans-json.mjs).
import { calcWith, pmt, VAT } from "../landing/calc.mjs";

/** Lãi suất và kỳ hạn giả định để ước tính trả góp (giao diện cho chỉnh). */
export const LAI_GIA_DINH = 9.5;
export const NAM_VAY = 20;

/** Giá có VAT của một căn theo giá chưa VAT (làm tròn đồng). */
export const giaCoVat = (chuaVat) => Math.round(chuaVat * (1 + VAT));

/**
 * Phương án thanh toán của một căn.
 * vay: "auto" = theo lịch đợt của CĐT; hoặc một tỷ lệ 0..1 trên giá có VAT (khách tự chọn vay ngân hàng, ngoài lịch CĐT).
 * Khi vay tùy chọn, tự có = giá có VAT − khoản vay − tiền nhận nhà − đợt sổ hồng (cộng lại luôn đủ giá có VAT).
 */
export function phuongAn(plan, giaChuaVat, { vay = "auto", lai = LAI_GIA_DINH, nam = NAM_VAY } = {}) {
  const r = calcWith(plan, giaChuaVat);
  let khoanVay = r.loan;
  let tuCo = r.ownBefore;
  if (vay !== "auto") {
    const t = Number(vay);
    if (!(t >= 0 && t <= 1)) throw new Error(`Tỷ lệ vay không hợp lệ: ${vay}`);
    khoanVay = Math.round(r.G * t);
    tuCo = Math.max(0, r.G - khoanVay - r.handover - r.so);
  }
  return {
    ...r,
    khoanVay,
    tuCo,
    traGopThang: khoanVay > 0 ? Math.round(pmt(khoanVay, lai, nam)) : 0,
    nhanNha: r.handover + r.fee, // gồm phí bảo trì 2%
    // Trần lãi 6,9% chỉ là điều kiện của PTTT có `cap`, và chỉ khi khoản vay là của lịch CĐT.
    coTranLai: Boolean(plan.cap) && vay === "auto" && khoanVay > 0,
  };
}
