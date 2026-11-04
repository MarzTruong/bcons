import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clipEnd, clipStart, cue } from "./data";
import { usePop, useWindow } from "./pop";
import { PANEL_TOP, T, clamp, font, glass } from "./style";

const PANEL_X = 40;
const PANEL_W = 1000;

type Milestone = {
  at: number;
  pos: number;
  title: string;
  sub: string;
  color: string;
};

/** Clip 5-6: timeline dòng tiền PTTT số 4 với thanh tiến trình chạy ngang. */
const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clipStart(5);
  const to = clipEnd(6);
  const ms: Milestone[] = [
    {
      at: cue("đợt một"),
      pos: 0.1,
      title: "Đợt 1",
      sub: "Chỉ 5% · Ký TTĐK",
      color: T.teal,
    },
    {
      at: cue("quý"),
      pos: 0.5,
      title: "Quý 2/2027",
      sub: "Thêm 5% · Ký HĐMB",
      color: T.teal,
    },
    {
      at: cue("đúng"),
      pos: 0.9,
      title: "Nhận nhà 2029",
      sub: "Tổng vốn đúng 20%!",
      color: T.gold,
    },
  ];
  const p0 = usePop(from);
  const fill = interpolate(
    frame,
    [ms[0].at, ms[0].at + 24, ms[1].at, ms[1].at + 24, ms[2].at, ms[2].at + 30],
    [0, ms[0].pos, ms[0].pos, ms[1].pos, ms[1].pos, ms[2].pos],
    clamp,
  );
  const out = interpolate(frame, [to - 10, to], [1, 0], clamp);
  if (!useWindow(from, to)) return null;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{
          ...glass,
          position: "absolute",
          left: PANEL_X,
          top: PANEL_TOP,
          width: PANEL_W,
          height: 290,
          boxSizing: "border-box",
          padding: "16px 24px",
          opacity: p0,
          transform: `translateY(${(1 - p0) * 80}px)`,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, color: T.gold }}>
          PTTT SỐ 4 · DÒNG TIỀN
        </div>
        <div
          style={{
            position: "relative",
            marginTop: 26,
            height: 16,
            borderRadius: 8,
            background: "rgba(255,255,255,0.15)",
          }}
        >
          <div
            style={{
              width: `${fill * 100}%`,
              height: "100%",
              borderRadius: 8,
              background: `linear-gradient(90deg, ${T.teal}, ${T.gold})`,
              boxShadow: `0 0 18px ${T.teal}`,
            }}
          />
          {ms.map((m) => (
            <Dot key={m.title} m={m} />
          ))}
        </div>
        <div style={{ position: "relative", height: 150, marginTop: 20 }}>
          {ms.map((m) => (
            <Label key={m.title} m={m} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Dot: React.FC<{ m: Milestone }> = ({ m }) => {
  const p = usePop(m.at, true);
  return (
    <div
      style={{
        position: "absolute",
        left: `${m.pos * 100}%`,
        top: -12,
        width: 40,
        height: 40,
        marginLeft: -20,
        borderRadius: "50%",
        background: m.color,
        border: "5px solid #fff",
        transform: `scale(${p})`,
      }}
    />
  );
};

const Label: React.FC<{ m: Milestone }> = ({ m }) => {
  const p = usePop(m.at);
  return (
    <div
      style={{
        position: "absolute",
        left: `${m.pos * 100}%`,
        width: 320,
        marginLeft: -160,
        textAlign: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, color: m.color }}>
        {m.title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{m.sub}</div>
    </div>
  );
};

/** Clip 7: thẻ viền vàng kim về đòn bẩy ngân hàng + badge chiết khấu nảy. */
const Leverage: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clipStart(7);
  const to = clipEnd(7);
  const p0 = usePop(from);
  const l1 = usePop(cue("mbbank"));
  const l2 = usePop(cue("vượt trần"));
  const bd = usePop(cue("chiết khấu"), true);
  const out = interpolate(frame, [to - 10, to], [1, 0], clamp);
  if (!useWindow(from, to)) return null;
  const line = (p: number): React.CSSProperties => ({
    opacity: p,
    transform: `translateX(${(1 - p) * 120}px)`,
  });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{
          ...glass,
          position: "absolute",
          left: PANEL_X,
          top: PANEL_TOP,
          width: PANEL_W,
          height: 290,
          boxSizing: "border-box",
          padding: "14px 24px",
          border: `4px solid ${T.gold}`,
          boxShadow: `0 0 40px rgba(240,192,64,0.45)`,
          opacity: p0,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: T.gold }}>
          ĐÒN BẨY NGÂN HÀNG
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1.2,
            marginTop: 4,
            ...line(l1),
          }}
        >
          MB Bank giải ngân <span style={{ color: T.gold }}>50%</span> | Lãi
          suất trần <span style={{ color: T.gold }}>6,9%/năm</span> suốt 48
          tháng
        </div>
        <div
          style={{ fontSize: 36, fontWeight: 800, marginTop: 6, ...line(l2) }}
        >
          CĐT chi trả <span style={{ color: T.teal }}>100%</span> lãi vượt trần
        </div>
        <div
          style={{
            marginTop: 12,
            display: "inline-block",
            padding: "10px 26px",
            borderRadius: 40,
            background: `linear-gradient(135deg, ${T.gold}, #f59e0b)`,
            color: "#111827",
            fontFamily: font,
            fontWeight: 800,
            fontSize: 36,
            transform: `scale(${bd})`,
            transformOrigin: "left center",
            opacity: Math.min(1, bd),
          }}
        >
          🎁 CHIẾT KHẤU THÊM 2,45% TRỪ THẲNG GIÁ BÁN
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Payment: React.FC = () => (
  <AbsoluteFill>
    <Timeline />
    <Leverage />
  </AbsoluteFill>
);
