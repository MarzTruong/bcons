import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clipEnd, clipStart, cue } from "./data";
import { usePop, useWindow } from "./pop";
import { PANEL_TOP, T, clamp, glass } from "./style";

/** Thanh lower-third giới thiệu, 2 giây đầu clip 2. */
const LowerThird: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clipStart(2);
  const to = from + 66;
  const p = usePop(from);
  const out = interpolate(frame, [to - 10, to], [1, 0], clamp);
  if (!useWindow(from, to)) return null;
  return (
    <div
      style={{
        ...glass,
        position: "absolute",
        left: 40,
        top: PANEL_TOP + 110,
        width: 900,
        padding: "18px 28px",
        borderLeft: `10px solid ${T.red}`,
        opacity: out * p,
        transform: `translateX(${(1 - p) * -500}px)`,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 52, letterSpacing: 1 }}>
        TUẤN <span style={{ color: T.red }}>BCONS</span>
      </div>
      <div
        style={{ fontWeight: 600, fontSize: 30, color: T.muted, marginTop: 4 }}
      >
        Chuyên viên tư vấn Bcons Group -{" "}
        <span style={{ color: T.gold }}>0938.32.31.39</span>
      </div>
    </div>
  );
};

/** Thanh địa chỉ với icon ghim đỏ. */
const Address: React.FC = () => {
  const from = cue("236") - 12;
  const to = cue("tổng quy mô") - 6;
  const p = usePop(from);
  if (!useWindow(from, to)) return null;
  return (
    <div
      style={{
        ...glass,
        position: "absolute",
        left: 40,
        right: 40,
        top: PANEL_TOP + 110,
        padding: "22px 30px",
        fontWeight: 700,
        fontSize: 35,
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity: p,
        transform: `translateY(${(1 - p) * 120}px)`,
      }}
    >
      <span style={{ fontSize: 54 }}>📍</span>
      <span>236 Phan Trung, P. Tam Hiệp, TP. Biên Hòa</span>
    </div>
  );
};

type Part = {
  value: number;
  decimals?: number;
  suffix: string;
  thousands?: boolean;
};
type TileProps = {
  at: number;
  label: string;
  parts: Part[];
  sub?: string;
  col: 0 | 1;
  row: 0 | 1;
  color: string;
};

const fmt = (v: number, d: number, thousands?: boolean) => {
  const s = v.toFixed(d);
  const [int, dec] = s.split(".");
  const i = thousands ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : int;
  return dec ? `${i},${dec}` : i;
};

const TILE_W = 490;

const Tile: React.FC<TileProps> = ({
  at,
  label,
  parts,
  sub,
  col,
  row,
  color,
}) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  const run = interpolate(frame, [at, at + 28], [0, 1], clamp);
  return (
    <div
      style={{
        ...glass,
        position: "absolute",
        left: 40 + col * (TILE_W + 20),
        top: PANEL_TOP + row * 128,
        width: TILE_W,
        height: 118,
        padding: "8px 20px",
        borderRadius: 20,
        opacity: p,
        transform: `scale(${0.8 + 0.2 * p})`,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 600, color: T.muted }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
          color,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        {parts.map((q, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: T.white }}> | </span>}
            {fmt(q.value * run, q.decimals ?? 0, q.thousands)}
            <span style={{ fontSize: 28 }}>{q.suffix}</span>
          </span>
        ))}
      </div>
      {sub && (
        <div style={{ fontSize: 22, fontWeight: 600, color: T.white }}>
          {sub}
        </div>
      )}
    </div>
  );
};

const Infographic: React.FC = () => {
  const frame = useCurrentFrame();
  const from = cue("tổng quy mô");
  const to = clipEnd(3);
  const sp = usePop(cue("nhường chỗ"));
  const out = interpolate(frame, [to - 10, to], [1, 0], clamp);
  if (!useWindow(from - 4, to)) return null;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Tile
        at={from}
        label="Quy mô"
        col={0}
        row={0}
        color={T.teal}
        parts={[
          { value: 2.74, decimals: 2, suffix: " ha" },
          { value: 5, suffix: " tòa" },
        ]}
        sub="Tháp 22 tầng"
      />
      <Tile
        at={cue("cung ứng")}
        label="Sản phẩm"
        col={1}
        row={0}
        color={T.gold}
        parts={[{ value: 2820, suffix: " căn hộ", thousands: true }]}
        sub="và 113 Shophouse"
      />
      <Tile
        at={cue("tầng hầm")}
        label="Tầng hầm"
        col={0}
        row={1}
        color={T.teal}
        parts={[{ value: 2, suffix: " hầm" }]}
        sub="rộng > 40.000 m²"
      />
      <Tile
        at={cue("mật độ")}
        label="Mật độ xây dựng"
        col={1}
        row={1}
        color={T.gold}
        parts={[{ value: 35.99, decimals: 2, suffix: "%" }]}
        sub="Khối tháp chỉ 35,99% · 60+ tiện ích"
      />
      <div
        style={{
          ...glass,
          position: "absolute",
          left: 40,
          right: 40,
          top: PANEL_TOP + 262,
          padding: "6px 18px",
          borderRadius: 16,
          fontSize: 22,
          fontWeight: 600,
          lineHeight: 1.2,
          textAlign: "center",
          opacity: sp,
          transform: `translateY(${(1 - sp) * 30}px)`,
        }}
      >
        Hồ bơi 315 m² · Quảng trường nhạc nước · Trường mầm non Bcons · 2 tầng
        Shopping Mall
      </div>
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => (
  <AbsoluteFill>
    <LowerThird />
    <Address />
    <Infographic />
  </AbsoluteFill>
);
