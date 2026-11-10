// Vệt sáng chạy vòng quanh ranh giới vùng trên bản đồ (anh yêu cầu 06/11/2026, áp dụng video làm từ nay).
// Hàm thuần: tính đoạn [km bắt đầu, km kết thúc] dọc chu vi theo khung hình.

export const VIEN = {
  /** Số khung cho một vòng (3 giây). */
  chuKy: 90,
  /** Độ dài vệt sáng so với chu vi. */
  doDai: 0.12,
} as const;

/** Pha 0..1 của vệt sáng; null khi viền chưa vẽ xong. */
export const cometPhase = (
  frame: number,
  start: number,
  drawFrames: number,
): number | null => {
  const t = frame - (start + drawFrames);
  if (t < 0) return null;
  return (t % VIEN.chuKy) / VIEN.chuKy;
};

/**
 * Pha 0..1 của vệt sáng (dọc tuyến hoặc quanh viền vùng); null khi chưa vẽ xong hoặc vòng hiện tại không kịp chạy hết
 * trước khi cảnh kết thúc (`sceneFrames`), để không bị cắt giữa chừng lúc chuyển cảnh.
 */
export const lineCometPhase = (
  frame: number,
  start: number,
  drawFrames: number,
  sceneFrames: number,
): number | null => {
  const t = frame - (start + drawFrames);
  if (t < 0) return null;
  const fullPasses = Math.floor(
    (sceneFrames - (start + drawFrames)) / VIEN.chuKy,
  );
  if (t >= fullPasses * VIEN.chuKy) return null;
  return (t % VIEN.chuKy) / VIEN.chuKy;
};

/** Đoạn sáng trên chu vi dài `len` (một hoặc hai đoạn khi vượt qua điểm đầu). */
export const cometRanges = (
  phase: number,
  len: number,
  frac: number = VIEN.doDai,
): [number, number][] => {
  const a = phase * len;
  const b = a + frac * len;
  return b <= len
    ? [[a, b]]
    : [
        [a, len],
        [0, b - len],
      ];
};

/** Vệt sáng chạy dọc tuyến (đường hở) từ đầu tới cuối rồi lặp: đoạn [km đầu, km cuối], null khi vệt đang ngoài tuyến. */
export const lineCometRange = (
  phase: number,
  len: number,
  frac: number = VIEN.doDai,
): [number, number] | null => {
  const head = phase * len * (1 + frac);
  const a = Math.max(0, head - frac * len);
  const b = Math.min(len, head);
  return b - a > 1e-9 ? [a, b] : null;
};
