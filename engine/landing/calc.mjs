// Lõi tính tiền theo thông báo PTTT của CĐT Bcons Central Park (chép từ công cụ "Tính nhanh", hàm thuần).
// Dùng chung cho trình duyệt (landing) và Node (test). Đối chiếu sheet TraGia của Master File.
// P = giá chưa VAT của PTTT đó (đồng). VAT 10%, phí bảo trì 2% giá chưa VAT.
export const VAT = 0.1;
export const FEE = 0.02;
export const CAP = 6.9;

const row = (l, p, k, w) => ({ l, p, k, w });
const TT = row("Ký thỏa thuận đăng ký", 5, "tt", "Khi ký thỏa thuận");
const BG = (p) => row("Thông báo bàn giao căn hộ", p, "handover", "Dự kiến Quý II/2029");
const SO = row("Thông báo bàn giao sổ hồng", 5, "so", "Theo thông báo của CĐT");

export const PLANS = {
  "01": {
    name: "PTTT 01", tag: "Thanh toán giãn, không vay (giá đã trừ 8,5%)",
    rows: [
      TT, row("Ký hợp đồng mua bán", 15, "hdmb", "Khi ký HĐMB"),
      row("Đợt 3", 5, "mid", "2 tháng sau HĐMB"), row("Đợt 4", 5, "mid", "4 tháng sau HĐMB"),
      row("Đợt 5", 5, "mid", "6 tháng sau HĐMB"), row("Đợt 6", 10, "mid", "8 tháng sau HĐMB"),
      row("Đợt 7", 5, "mid", "10 tháng sau HĐMB"), row("Đợt 8", 5, "mid", "12 tháng sau HĐMB"),
      row("Đợt 9", 5, "mid", "14 tháng sau HĐMB"), row("Đợt 10", 10, "mid", "18 tháng sau HĐMB"),
      BG(25), SO,
    ],
  },
  "02": {
    name: "PTTT 02", tag: "Vay 50%, CĐT hỗ trợ lãi và ân hạn gốc tối đa 24 tháng (giá niêm yết)",
    rows: [TT, row("Ký hợp đồng mua bán", 15, "hdmb", "Khi ký HĐMB"), row("Ngân hàng giải ngân", 50, "loan", "15 ngày sau HĐMB"), BG(25), SO],
  },
  "03": {
    name: "PTTT 03", tag: "Vay 50%, lãi trần 6,9%/năm theo điều kiện của CĐT (không chiết khấu)", cap: true,
    rows: [
      TT, row("Ký hợp đồng mua bán", 5, "hdmb", "Khi ký HĐMB"), row("Ngân hàng giải ngân", 50, "loan", "7 ngày sau HĐMB"),
      row("Đợt 4", 5, "mid", "2 tháng sau HĐMB"), row("Đợt 5", 5, "mid", "4 tháng sau HĐMB"), BG(25), SO,
    ],
  },
  "04": {
    name: "PTTT 04", tag: "Vay 3 đợt, lãi trần 6,9%/năm theo điều kiện của CĐT (giá trừ 2,45%)", cap: true,
    rows: [
      TT, row("Ký hợp đồng mua bán", 5, "hdmb", "Khi ký HĐMB"), row("Ngân hàng giải ngân lần 1", 10, "loan", "7 ngày sau HĐMB"),
      row("Đợt 4", 5, "mid", "5 tháng sau HĐMB"), row("Ngân hàng giải ngân lần 2", 20, "loan", "7 ngày sau đợt 4"),
      row("Đợt 6", 5, "mid", "10 tháng sau HĐMB"), row("Ngân hàng giải ngân lần 3", 20, "loan", "7 ngày sau đợt 6"), BG(25), SO,
    ],
  },
  "05": {
    name: "PTTT 05", tag: "Vay 3 đợt, CĐT hỗ trợ lãi và ân hạn gốc tối đa 24 tháng (giá trừ 2,45%, không có trần 6,9%)",
    rows: [
      TT, row("Ký hợp đồng mua bán", 5, "hdmb", "Khi ký HĐMB"), row("Ngân hàng giải ngân lần 1", 10, "loan", "7 ngày sau HĐMB"),
      row("Đợt 4", 5, "mid", "5 tháng sau HĐMB"), row("Ngân hàng giải ngân lần 2", 20, "loan", "7 ngày sau đợt 4"),
      row("Đợt 6", 5, "mid", "10 tháng sau HĐMB"), row("Ngân hàng giải ngân lần 3", 20, "loan", "7 ngày sau đợt 6"), BG(25), SO,
    ],
  },
};

/** Các đợt thanh toán của một PTTT. Đợt 2 gồm VAT của đợt 1 + 2; đợt giữa và vay tính trên giá có VAT; bàn giao gồm VAT của đợt sổ. */
export function calc(key, P) {
  const plan = PLANS[key];
  if (!plan) throw new Error(`Không có PTTT ${key}`);
  const V = P * VAT;
  const G = P + V;
  const pct = (k) => plan.rows.find((r) => r.k === k)?.p ?? 0;
  const p1 = pct("tt");
  const p2 = pct("hdmb");
  const pSo = pct("so");
  const rows = plan.rows.map((r) => {
    let a;
    if (r.k === "tt") a = (r.p / 100) * P;
    else if (r.k === "hdmb") a = (r.p / 100) * P + ((p1 + p2) / 100) * V;
    else if (r.k === "mid" || r.k === "loan") a = (r.p / 100) * G;
    else if (r.k === "handover") a = (r.p / 100) * G + (pSo / 100) * V;
    else a = (r.p / 100) * P;
    return { ...r, amt: Math.round(a), bank: r.k === "loan" };
  });
  let ownBefore = 0;
  let loan = 0;
  let handover = 0;
  let so = 0;
  for (const r of rows) {
    if (r.bank) loan += r.amt;
    else if (r.k === "handover") handover = r.amt;
    else if (r.k === "so") so = r.amt;
    else ownBefore += r.amt;
  }
  return { key, P, V: Math.round(V), G: Math.round(G), fee: Math.round(P * FEE), rows, ownBefore, loan, handover, so };
}

/** Trả đều gốc + lãi hàng tháng. rate: %/năm, years: số năm. */
export function pmt(L, rate, years) {
  if (!(L > 0)) return 0;
  const n = Math.round(years * 12);
  if (!(n > 0)) return 0;
  const r = rate / 100 / 12;
  if (r === 0) return L / n;
  return (L * r) / (1 - Math.pow(1 + r, -n));
}
