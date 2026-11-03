import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { C, fontFamily } from "./theme";
import { Captions } from "./Captions";
import { SatelliteMap } from "./MapScene";
import { LEAD, SCENE_DATA, SCENE_STARTS, cueFrame } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Fade in/out wrapper for a scene (duration in frames). */
const Fade: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 10, duration - 10, duration],
    [0, 1, 1, 0],
    clamp,
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.035) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${(frame * 0.4) % 90}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, ${C.teal}22 0%, transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const useSpring = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

/* ---------------- Cảnh 1 ---------------- */
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const badge = useSpring(0);
  const l1 = useSpring(10);
  const l2 = useSpring(18);
  const l3 = useSpring(26);
  const cue = cueFrame(0, "2,4");
  const card = useSpring(cue - 50);
  const value = interpolate(frame, [cue - 15, cue + 35], [0, 2.4], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const title = (t: string, p: number, color = C.white) => (
    <div
      style={{
        fontSize: 76,
        fontWeight: 800,
        lineHeight: 1.15,
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 60}px)`,
      }}
    >
      {t}
    </div>
  );
  return (
    <AbsoluteFill style={{ padding: "110px 70px" }}>
      <div
        style={{
          alignSelf: "flex-start",
          padding: "18px 36px",
          borderRadius: 999,
          border: `3px solid ${C.teal}`,
          color: C.teal,
          fontSize: 38,
          fontWeight: 600,
          opacity: badge,
          transform: `scale(${0.8 + 0.2 * badge})`,
        }}
      >
        Nguồn: Thông tin Chính phủ
      </div>
      <div style={{ marginTop: 130 }}>
        {title("ĐỒNG NAI", l1, C.teal)}
        {title("ĐÔ THỊ TRỰC THUỘC", l2)}
        {title("TRUNG ƯƠNG", l3)}
      </div>
      <div
        style={{
          marginTop: 90,
          padding: "50px 50px",
          borderRadius: 36,
          background: C.bg2,
          border: `3px solid ${C.gold}`,
          opacity: card,
          transform: `translateY(${(1 - card) * 80}px)`,
          boxShadow: `0 0 80px ${C.gold}22`,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 600, color: C.white }}>
          Vốn FDI (9 tháng đầu năm)
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 64,
            fontWeight: 600,
            color: C.gold,
          }}
        >
          Gần
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <span
            style={{
              fontSize: 220,
              fontWeight: 800,
              color: C.teal,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {value.toFixed(1).replace(".", ",")}
          </span>
          <span style={{ fontSize: 80, fontWeight: 700, color: C.white }}>
            Tỷ USD
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Cảnh 2 ---------------- */
const Scene2: React.FC = () => {
  const title = useSpring(0);
  const cueDate = cueFrame(1, "ngày");
  const label = useSpring(cueDate - 10, 12);
  return (
    <AbsoluteFill>
      <SatelliteMap />
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 70,
          right: 70,
          opacity: title,
          transform: `translateY(${(1 - title) * 40}px)`,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 600, color: C.teal }}>
          KẾT NỐI HẠ TẦNG
        </div>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1 }}>
          Tam giác kết nối Đồng Nai
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1210,
          padding: "30px 40px",
          borderRadius: 28,
          background: "rgba(20,20,20,0.88)",
          border: `3px solid ${C.teal}`,
          opacity: label,
          transform: `translateY(${(1 - label) * 50}px)`,
        }}
      >
        <div style={{ fontSize: 38, color: C.teal, fontWeight: 600 }}>
          Cao tốc Bến Lức - Long Thành
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, marginTop: 6 }}>
          Khai thác toàn tuyến từ 01/10/2026
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          width: "100%",
          textAlign: "center",
          fontSize: 28,
          color: "#ffffffb0",
          opacity: label,
        }}
      >
        Vị trí và tuyến đường mô phỏng, không đúng tỷ lệ
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Cảnh 3 ---------------- */
const DataCard: React.FC<{
  delay: number;
  tag: string;
  big: string;
  sub: string;
}> = ({ delay, tag, big, sub }) => {
  const p = useSpring(delay, 13);
  return (
    <div
      style={{
        padding: "32px 50px",
        borderRadius: 32,
        background: C.bg2,
        border: `4px solid ${C.gold}`,
        boxShadow: `0 0 60px ${C.gold}22`,
        opacity: p,
        transform: `translateX(${(1 - p) * 300}px)`,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 600, color: C.gold }}>{tag}</div>
      <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>
        {big}
      </div>
      <div style={{ fontSize: 46, fontWeight: 600, color: C.teal, marginTop: 6 }}>
        {sub}
      </div>
    </div>
  );
};

const Scene3: React.FC = () => {
  const t = useSpring(0);
  return (
    <AbsoluteFill style={{ padding: "110px 70px" }}>
      <div style={{ opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}>
        <div style={{ fontSize: 40, fontWeight: 600, color: C.teal }}>
          CÚ HÍCH LỚN
        </div>
        <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.1 }}>
          Khu thương mại tự do Long Thành
        </div>
      </div>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 34 }}>
        <DataCard delay={cueFrame(2, "quy") - 10} tag="QUY MÔ & VỐN" big="Hơn 8.200 ha" sub="Tổng vốn 16 Tỷ USD" />
        <DataCard delay={cueFrame(2, "thu") - 5} tag="NHÂN LỰC (ĐẾN 2030)" big="150.000" sub="lao động chất lượng cao" />
        <DataCard delay={cueFrame(2, "đào") - 5} tag="ĐÀO TẠO CHUYÊN SÂU" big="~50.000" sub="kỹ sư, chuyên gia công nghệ" />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Cảnh 4 ---------------- */
const MESSAGE =
  "Phát triển đồng bộ theo quy hoạch - Đón đầu làn sóng đô thị hóa & nhu cầu an cư tại Đồng Nai";

const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = spring({ frame, fps: 30, config: { damping: 18 }, durationInFrames: 60 });
  const scale = interpolate(zoom, [0, 1], [0.3, 1]);
  const total = SCENE_DATA[3].frames;
  const drift = interpolate(frame, [0, total], [1, 1.04], clamp);
  const chars = Math.floor(
    interpolate(frame, [LEAD + 40, total - 40], [0, MESSAGE.length], clamp),
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
        <div style={{ fontSize: 36, color: "#ffffffb0", marginTop: 30 }}>
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
        {MESSAGE.slice(0, chars)}
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
          color: "#ffffff80",
        }}
      >
        Thông tin mang tính tham khảo
      </div>
    </AbsoluteFill>
  );
};

export const BconsVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, color: C.white, background: C.bg }}>
      <Background />
      {[Scene1, Scene2, Scene3, Scene4].map((SceneComp, i) => {
        const d = SCENE_DATA[i];
        return (
          <Sequence
            key={d.id}
            from={SCENE_STARTS[i]}
            durationInFrames={d.frames}
            premountFor={30}
          >
            <Fade duration={d.frames}>
              <SceneComp />
              <Captions words={d.words} />
            </Fade>
            <Sequence from={LEAD} durationInFrames={d.audioFrames}>
              <Audio src={staticFile(`audio/${d.id}.mp3`)} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
