// Hình học thuần (không React) của phong cách bản vẽ, để test được bằng node.

/** strokeDashoffset cho nét "bút vẽ": ẩn hết trước `start`, vẽ xong sau `start + dur` frame. Ease-out. */
export function penDraw(frame: number, start: number, dur: number, len: number): number {
  const t = Math.min(1, Math.max(0, (frame - start) / dur));
  const eased = 1 - Math.pow(1 - t, 3);
  return len * (1 - eased);
}
