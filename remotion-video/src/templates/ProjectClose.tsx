import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { useTheme } from "../theme";
import { LEAD } from "../timing";
import { clamp, type TemplateProps } from "./common";

/** Mẫu `project-close`: thẻ dự án + thông điệp gõ chữ. Không số điện thoại, không tên cá nhân. */
export const ProjectClose: React.FC<TemplateProps<"project-close">> = ({ props, frames }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const message = props.message;
  const zoom = spring({ frame, fps: 30, config: { damping: 18 }, durationInFrames: 60 });
  const scale = interpolate(zoom, [0, 1], [0.3, 1]);
  const drift = interpolate(frame, [0, frames], [1, 1.04], clamp);
  const chars = Math.floor(
    interpolate(frame, [LEAD + 40, frames - 40], [0, message.length], clamp),
  );
  const glow = 0.5 + 0.5 * Math.sin(frame / 8);
  return (
    <AbsoluteFill style={{ padding: "150px 70px 0", justifyContent: "flex-start" }}>
      <div
        style={{
          transform: `scale(${scale * drift})`,
          opacity: zoom,
          padding: "60px 40px",
          borderRadius: 44,
          background: C.bg2,
          border: `5px solid ${C.teal}`,
          boxShadow: `0 0 ${80 + glow * 60}px ${C.teal}55`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 600, color: C.gold }}>DỰ ÁN</div>
        <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.05, marginTop: 14 }}>
          BCONS
          <br />
          <span style={{ color: C.teal }}>CENTRAL PARK</span>
        </div>
        <div style={{ fontSize: 36, color: C.muted, marginTop: 30 }}>
          236 Phan Trung, Tam Hiệp, Biên Hòa, Đồng Nai
        </div>
      </div>
      <div
        style={{
          marginTop: 50,
          minHeight: 290,
          fontSize: 50,
          fontWeight: 700,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {message.slice(0, chars)}
        <span style={{ color: C.gold, opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 28,
          color: C.faint,
        }}
      >
        Thông tin mang tính tham khảo
      </div>
    </AbsoluteFill>
  );
};
