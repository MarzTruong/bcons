import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { TOTAL_FRAMES, clipStart, cue } from "./data";
import { usePop } from "./pop";
import { PANEL_TOP, T, clamp, font, glass } from "./style";

/** Clip 8-9: callout nhịp đập + nút liên hệ. */
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clipStart(8);
  const p = usePop(from);
  const btn = usePop(cue("liên hệ"), true);
  const pulse = 1 + 0.035 * Math.sin((frame / 30) * Math.PI * 2.4);
  const fade = interpolate(
    frame,
    [TOTAL_FRAMES - 8, TOTAL_FRAMES],
    [1, 0],
    clamp,
  );
  if (frame < from) return null;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div
        style={{
          ...glass,
          position: "absolute",
          left: 40,
          right: 40,
          top: PANEL_TOP + 10,
          padding: "20px 28px",
          border: `4px solid ${T.gold}`,
          boxShadow: `0 0 ${24 + 20 * Math.abs(Math.sin(frame / 10))}px rgba(240,192,64,0.6)`,
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 1.15,
          textAlign: "center",
          opacity: p,
          transform: `scale(${(0.85 + 0.15 * p) * pulse})`,
        }}
      >
        NHẬN{" "}
        <span style={{ color: T.gold }}>BẢNG TÍNH DÒNG TIỀN PTTT SỐ 4</span>{" "}
        &amp; XEM NHÀ MẪU 1PN - 2PN
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: PANEL_TOP + 190,
          padding: "20px 24px",
          borderRadius: 60,
          background: `linear-gradient(135deg, ${T.red}, #be123c)`,
          border: "4px solid #fff",
          boxShadow: "0 12px 36px rgba(225,29,72,0.6)",
          fontFamily: font,
          fontWeight: 800,
          fontSize: 46,
          textAlign: "center",
          color: T.white,
          opacity: Math.min(1, btn),
          transform: `scale(${btn * (1 + 0.03 * Math.sin(frame / 4))})`,
        }}
      >
        📞 LIÊN HỆ EM TUẤN: 0938.32.31.39
      </div>
    </AbsoluteFill>
  );
};
