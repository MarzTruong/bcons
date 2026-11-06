import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Spring 0 -> 1 bắt đầu từ frame `at`; `bounce` cho nảy quá đà. */
export const usePop = (at: number, bounce = false): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return 0;
  return spring({
    frame: frame - at,
    fps,
    config: bounce
      ? { damping: 6, stiffness: 160, mass: 0.8 }
      : { damping: 14, stiffness: 140 },
  });
};

/** True khi frame hiện tại nằm trong [from, to) (timeline đã dựng). */
export const useWindow = (from: number, to: number): boolean => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to;
};
