import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
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
  const kb = interpolate(frame, [0, frames], [1, 1.1], clamp);
  return (
    <AbsoluteFill style={{ padding: "150px 70px 0", justifyContent: "flex-start" }}>
      {props.image ? (
        <div
          style={{
            position: "relative",
            height: 900,
            borderRadius: 44,
            overflow: "hidden",
            border: `5px solid ${C.teal}`,
            opacity: zoom,
            boxShadow: `0 0 ${80 + glow * 60}px ${C.teal}55`,
          }}
        >
          <Img src={staticFile(props.image.file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, #0000 45%, ${C.scrim}f0 100%)` }} />
          <div style={{ position: "absolute", left: 40, right: 40, bottom: 34, textAlign: "center" }}>
            <div style={{ fontSize: 34, fontWeight: 600, color: C.gold }}>DỰ ÁN</div>
            <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>
              BCONS <span style={{ color: C.teal }}>CENTRAL PARK</span>
            </div>
            <div style={{ fontSize: 34, color: C.muted, marginTop: 10 }}>236 Phan Trung, Tam Hiệp, Biên Hòa, Đồng Nai</div>
          </div>
          <div style={{ position: "absolute", top: 20, right: 26, fontSize: 24, color: "#fffc", textShadow: "0 2px 8px #000" }}>{props.image.label}</div>
        </div>
      ) : (
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
      )}
      <div
        style={{
          marginTop: props.image ? 36 : 50,
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
