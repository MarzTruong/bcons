// Tính toán thuần cho cảnh `lo-trinh` (bảng lộ trình tiền, AGY phương án 1, anh chọn 16/11/2026).
// Mọi tổng tính từ moc[]: không có số tổng viết sẵn (kiểm AGY 16/11/2026, mục 6). Mốc hiện theo cue thật của giọng, không số giây cứng.
export type Nhom = "tuCo" | "nganHang" | "nhanNha" | "soHong";
export const NHOM_THU_TU: Nhom[] = ["tuCo", "nganHang", "nhanNha", "soHong"];

export type Moc = { nhom: Nhom; soTien: number; cueKey: string; offset?: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Tổng từng nhóm và tổng cả lộ trình, tính từ các mốc. `soDotTuCo` = số mốc tiền mình đóng trước nhận nhà. */
export function tongLoTrinh(moc: Moc[]) {
  const t = { tuCo: 0, nganHang: 0, nhanNha: 0, soHong: 0 };
  let soDotTuCo = 0;
  let lonNhat = 0;
  for (const m of moc) {
    t[m.nhom] += m.soTien;
    if (m.nhom === "tuCo") soDotTuCo += 1;
    if (m.soTien > lonNhat) lonNhat = m.soTien;
  }
  return { ...t, tong: t.tuCo + t.nganHang + t.nhanNha + t.soHong, soDotTuCo, lonNhat };
}

/** 1650 -> "1.650" (dấu chấm ngăn hàng nghìn, theo docs/quy-tac-so-phu-de.md). */
export const dinhDangTr = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Frame nhóm bắt đầu hiện = mốc sớm nhất của nhóm (cue + offset). Nhóm không có mốc nào thì bỏ qua. */
export function nhomHienLuc(moc: Moc[], cue: (key: string) => number): Partial<Record<Nhom, number>> {
  const out: Partial<Record<Nhom, number>> = {};
  for (const m of moc) {
    const at = cue(m.cueKey) + (m.offset ?? 0);
    if (out[m.nhom] === undefined || at < (out[m.nhom] as number)) out[m.nhom] = at;
  }
  return out;
}

/** Độ hiện 0–1 của một hàng/mốc tại frame `f`: vào trong ~0,38 s (11 khung) kể từ cue + offset. */
export function hangHien(m: Moc, f: number, cue: (key: string) => number): number {
  const at = cue(m.cueKey) + (m.offset ?? 0);
  return easeOutCubic(clamp01((f - at) / 11.4));
}

/** Các đoạn thanh xếp chồng "căn này được trả bằng gì": đúng thứ tự nhóm, phần trăm theo tổng. */
export function chiaDoanThanh(moc: Moc[]): { nhom: Nhom; so: number; phanTram: number }[] {
  const t = tongLoTrinh(moc);
  return NHOM_THU_TU.filter((n) => moc.some((m) => m.nhom === n)).map((nhom) => ({
    nhom,
    so: t[nhom],
    phanTram: t.tong > 0 ? (t[nhom] / t.tong) * 100 : 0,
  }));
}
