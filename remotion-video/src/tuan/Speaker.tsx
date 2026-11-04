import React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { RAW_VIDEO, SEGMENTS, clipEnd, clipStart } from "./data";
import { clamp } from "./style";

/** Clip logic bắt buộc punch-in khi cắt vào (clip 3 và 6 theo yêu cầu). */
const FORCED_PUNCH_CLIPS = new Set([3, 6]);
/** Clip 4 chia đôi màn hình: người nói ở nửa dưới, bản đồ ở nửa trên. */
const SPLIT_CLIP = 4;
const HALF = 960;
const AUDIO_FADE = 2;

/**
 * Mỗi lần cắt đổi giữa khung 1.0 và punch-in 1.08 để che vết nhảy;
 * clip 3 và 6 luôn punch-in. Segment đầu không punch.
 */
const PUNCH: boolean[] = SEGMENTS.reduce<boolean[]>((acc, seg, i) => {
  if (i === 0) return [false];
  return [...acc, FORCED_PUNCH_CLIPS.has(seg.clip) && SEGMENTS[i - 1].clip !== seg.clip ? true : !acc[i - 1]];
}, []);

const SpeakerClip: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seg = SEGMENTS[index];
  const scale = PUNCH[index]
    ? 1 + 0.08 * spring({ frame, fps, config: { damping: 18, stiffness: 220 } })
    : interpolate(frame, [0, seg.frames], [1, 1.03], clamp);
  return (
    <OffthreadVideo
      src={staticFile(RAW_VIDEO)}
      startFrom={seg.srcFrom}
      endAt={seg.srcTo}
      volume={(f) =>
        interpolate(f, [0, AUDIO_FADE, seg.frames - AUDIO_FADE, seg.frames], [0, 1, 1, 0], clamp)
      }
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: seg.clip === SPLIT_CLIP ? "50% 30%" : "50% 50%",
        transform: `scale(${scale})`,
        transformOrigin: "50% 40%",
      }}
    />
  );
};

/** Video người nói: nối 9 phân đoạn bằng Series, khung co lại thành nửa dưới trong clip 4. */
export const Speaker: React.FC = () => {
  const frame = useCurrentFrame();
  const a = clipStart(SPLIT_CLIP);
  const b = clipEnd(SPLIT_CLIP);
  const ease = Easing.inOut(Easing.cubic);
  const split = interpolate(frame, [a - 8, a + 8, b - 8, b + 8], [0, 1, 1, 0], {
    ...clamp,
    easing: ease,
  });
  return (
    <AbsoluteFill style={{ background: "#0b1220" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 1080,
          top: split * HALF,
          height: 1920 - split * HALF,
          overflow: "hidden",
        }}
      >
        <Series>
          {SEGMENTS.map((seg, i) => (
            <Series.Sequence key={i} durationInFrames={seg.frames}>
              <SpeakerClip index={i} />
            </Series.Sequence>
          ))}
        </Series>
      </div>
    </AbsoluteFill>
  );
};
