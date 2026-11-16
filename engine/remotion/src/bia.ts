// Ảnh bìa video (AGY phương án 1, anh chọn 16/11/2026) và khung mở đầu dùng chung dữ liệu, màu và cỡ chữ:
// khung 0 của video chính là bìa (lưới TikTok lấy đúng khung này).
import { z } from "zod";

/** 4 chủ đề cố định: cùng chủ đề luôn ra cùng một màu; thiếu thì dùng màu dự án. */
export const CHU_DE_MAU = { "ha-tang": "#7ee0c3", "tien-do": "#ffe14d", "tai-chinh": "#ff9e44", "du-an": "#7cc4ff" } as const;
export type ChuDe = keyof typeof CHU_DE_MAU;
export const CHU_DE = Object.keys(CHU_DE_MAU) as [ChuDe, ...ChuDe[]];
export const mauChuDe = (c?: ChuDe) => CHU_DE_MAU[c ?? "du-an"];

/** Cỡ chữ (px) theo độ dài số nhấn, ghi chú và dòng tiêu đề dài nhất, công thức của AGY. */
export function kichCoBia(d: { tieuDe: string[]; diemNhan?: string; ghiChuNhan?: string }) {
  const nLen = (d.diemNhan ?? "").length;
  const gLen = (d.ghiChuNhan ?? "").length;
  const num = nLen >= 6 ? 124 : nLen >= 4 ? 156 : nLen >= 2 ? 196 : 220;
  const unit = gLen >= 18 ? (nLen >= 6 ? 27 : nLen >= 5 ? 32 : 38) : gLen >= 13 ? (nLen >= 4 ? 38 : 44) : 56;
  const maxLine = d.tieuDe.length ? Math.max(...d.tieuDe.map((s) => s.length)) : 0;
  return { num, unit, title: maxLine >= 18 ? 78 : 92 };
}

/** Dữ liệu một bìa: `du-an/<mã>/video/<tên>/bia.json`. */
export const BiaSchema = z.object({
  tieuDe: z.array(z.string().min(1)).min(1).max(3),
  diemNhan: z.string().optional(),
  ghiChuNhan: z.string().optional(),
  chuDe: z.enum(CHU_DE).optional(),
  anhNen: z.string().min(1),
  /** CSS object-position của ảnh nền, vd. "center 60%". */
  viTriAnh: z.string().optional(),
  nhanAnh: z.string().min(1),
  duAn: z.string().min(1),
});
export type Bia = z.infer<typeof BiaSchema>;

/** Dữ liệu khung mở đầu tương đương một bìa (cùng chữ, màu, ảnh). */
export function hookTuBia(b: Bia) {
  return {
    lines: b.tieuDe,
    soNhan: b.diemNhan,
    donVi: b.ghiChuNhan,
    chuDe: b.chuDe,
    viTriAnh: b.viTriAnh,
    image: { file: b.anhNen, label: b.nhanAnh },
  };
}
