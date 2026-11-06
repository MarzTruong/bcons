import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, SceneOf } from "../spec";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Props chung cho mọi mẫu cảnh. `cue(key)` = frame (tương đối trong cảnh) khi từ gắn với `cues[key]` được đọc. */
export type TemplateProps<T extends Scene["template"]> = {
  props: SceneOf<T>["props"];
  cue: (key: string) => number;
  frames: number;
};

export const useSpring = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};
