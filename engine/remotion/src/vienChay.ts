// Vệt sáng chạy vòng quanh ranh giới vùng trên bản đồ (anh yêu cầu 06/11/2026, áp dụng video làm từ nay).
// Hàm thuần: tính đoạn [km bắt đầu, km kết thúc] dọc chu vi theo khung hình.

export const VIEN = {
  /** Số khung cho một vòng (3 giây). */
  chuKy: 90,
  /** Độ dài vệt sáng so với chu vi. */
  doDai: 0.12,
} as const;

/** Pha 0..1 của vệt sáng; null khi viền chưa vẽ xong. */
export const cometPhase = (frame: number, start: number, drawFrames: number): number | null => {
  const t = frame - (start + drawFrames);
  if (t < 0) return null;
  return (t % VIEN.chuKy) / VIEN.chuKy;
};

/** Đoạn sáng trên chu vi dài `len` (một hoặc hai đoạn khi vượt qua điểm đầu). */
export const cometRanges = (phase: number, len: number, frac: number = VIEN.doDai): [number, number][] => {
  const a = phase * len;
  const b = a + frac * len;
  return b <= len ? [[a, b]] : [[a, len], [0, b - len]];
};
