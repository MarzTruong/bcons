import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clipEnd, cue } from "./data";
import { usePop } from "./pop";
import { PANEL_TOP, T, clamp, font, glass } from "./style";

const Badge: React.FC<{
  at: number;
  text: string;
  color: string;
  top: number;
}> = ({ at, text, color, top }) => {
  const p = usePop(at);
  return (
    <div
      style={{
        ...glass,
        position: "absolute",
        left: 40,
        right: 40,
        top,
        padding: "16px 28px",
        borderColor: color,
        borderWidth: 3,
        fontWeight: 800,
        fontSize: 44,
        lineHeight: 1.15,
        opacity: p,
        transform: `translateX(${(1 - p) * -200}px) scale(${0.9 + 0.1 * p})`,
      }}
    >
      <span style={{ color }}>● </span>
      {text}
    </div>
  );
};

/** Clip 1: banner đỉnh màn hình + 2 badge khi nhắc lãi suất. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const end = clipEnd(1);
  const p = usePop(0);
  const out = interpolate(frame, [end - 10, end], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 40,
          right: 40,
          padding: "26px 30px",
          borderRadius: 24,
          background: `linear-gradient(135deg, ${T.red}, #9f1239)`,
          border: `3px solid ${T.gold}`,
          boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
          fontFamily: font,
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 1.12,
          textAlign: "center",
          color: T.white,
          transform: `translateY(${(1 - p) * -260}px) scale(${0.85 + 0.15 * p})`,
          opacity: Math.min(1, p * 2),
        }}
      >
        CHỈ <span style={{ color: T.gold }}>150 TRIỆU</span> SỞ HỮU CĂN 2PN
        TRUNG TÂM BIÊN HÒA
      </div>
      <Badge
        at={cue("hai phòng ngủ")}
        text="Căn hộ 2 Phòng Ngủ"
        color={T.teal}
        top={PANEL_TOP + 20}
      />
      <Badge
        at={cue("bảo lãnh")}
        text="Bảo lãnh lãi suất trần 6,9%/năm suốt 4 năm"
        color={T.gold}
        top={PANEL_TOP + 140}
      />
    </AbsoluteFill>
  );
};
