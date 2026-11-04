import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clipEnd, clipStart, cue } from "./data";
import { usePop } from "./pop";
import { T, clamp, font } from "./style";

const W = 1080;
const H = 960;
const CX = 540;
const CY = 500;

type Dest = {
  id: string;
  x: number;
  y: number;
  title: string;
  sub: string;
  at: number;
  color: string;
};

/** Vị trí mang tính sơ đồ (không theo tỉ lệ thật); thời điểm khớp lời nói. */
const dests = (): Dest[] => [
  {
    id: "vincom",
    x: 200,
    y: 330,
    title: "Vincom Biên Hòa",
    sub: "2 phút",
    at: cue("hai phút"),
    color: T.teal,
  },
  {
    id: "gov",
    x: 880,
    y: 330,
    title: "Trung tâm Hành chính Tỉnh mới",
    sub: "5 phút · Biên Hòa 1",
    at: cue("năm phút"),
    color: T.teal,
  },
  {
    id: "airport",
    x: 840,
    y: 730,
    title: "Sân bay Quốc tế Long Thành",
    sub: "Ga Metro nối dài",
    at: cue("metro"),
    color: T.gold,
  },
  {
    id: "culao",
    x: 220,
    y: 730,
    title: "Cù Lao Hiệp Hòa · 3 tỷ USD",
    sub: "Sát vách · Aeon Mall",
    at: cue("sát vách"),
    color: T.gold,
  },
];

const Node: React.FC<{ d: Dest }> = ({ d }) => {
  const frame = useCurrentFrame();
  const p = usePop(d.at, true);
  const draw = interpolate(frame, [d.at - 6, d.at + 18], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const len = Math.hypot(d.x - CX, d.y - CY);
  return (
    <>
      <line
        x1={CX}
        y1={CY}
        x2={d.x}
        y2={d.y}
        stroke={d.color}
        strokeWidth={5}
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
        strokeLinecap="round"
        opacity={0.9}
      />
      <g
        transform={`translate(${d.x} ${d.y}) scale(${p})`}
        opacity={Math.min(1, p)}
      >
        <circle r={20} fill={d.color} stroke="#fff" strokeWidth={5} />
        <circle
          r={36 + ((frame - d.at) % 40) * 0.6}
          fill="none"
          stroke={d.color}
          strokeWidth={3}
          opacity={0.4}
        />
      </g>
      <g
        transform={`translate(${d.x} ${d.y + (d.y < CY ? -78 : 70)})`}
        opacity={Math.min(1, p)}
        style={{ fontFamily: font }}
      >
        <rect
          x={-190}
          y={-34}
          width={380}
          height={d.sub ? 84 : 56}
          rx={16}
          fill="rgba(15,23,42,0.9)"
          stroke={d.color}
          strokeWidth={3}
        />
        <text
          textAnchor="middle"
          y={4}
          fill="#fff"
          fontSize={28}
          fontWeight={800}
        >
          {d.title}
        </text>
        <text
          textAnchor="middle"
          y={38}
          fill={d.color}
          fontSize={28}
          fontWeight={700}
        >
          {d.sub}
        </text>
      </g>
    </>
  );
};

/** Clip 4: nửa trên màn hình là sơ đồ radar kết nối vùng toả ra từ Bcons Central Park. */
export const RadarMap: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clipStart(4);
  const to = clipEnd(4);
  const inP = interpolate(
    frame,
    [from - 8, from + 8, to - 8, to + 8],
    [0, 1, 1, 0],
    clamp,
  );
  const sweep = ((frame - from) * 4) % 360;
  const center = usePop(from + 6, true);
  if (frame < from - 8 || frame > to + 8) return null;
  return (
    <AbsoluteFill style={{ opacity: inP }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="mapbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1220" />
            <stop offset="1" stopColor="#111c33" />
          </linearGradient>
          <radialGradient id="sweep">
            <stop offset="0" stopColor={T.teal} stopOpacity="0.55" />
            <stop offset="1" stopColor={T.teal} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#mapbg)" />
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 100}
            y1={0}
            x2={i * 100}
            y2={H}
            stroke="#ffffff"
            opacity={0.05}
          />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 100}
            x2={W}
            y2={i * 100}
            stroke="#ffffff"
            opacity={0.05}
          />
        ))}
        {[120, 230, 340, 450].map((r) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={T.teal}
            strokeWidth={2}
            opacity={0.22}
          />
        ))}
        <g transform={`rotate(${sweep} ${CX} ${CY})`} opacity={0.7}>
          <path
            d={`M ${CX} ${CY} L ${CX + 450} ${CY} A 450 450 0 0 0 ${CX + 450 * Math.cos(-0.6)} ${CY + 450 * Math.sin(-0.6)} Z`}
            fill="url(#sweep)"
          />
        </g>
        {dests().map((d) => (
          <Node key={d.id} d={d} />
        ))}
        <g
          transform={`translate(${CX} ${CY}) scale(${center})`}
          style={{ fontFamily: font }}
        >
          <circle r={38} fill={T.red} stroke="#fff" strokeWidth={6} />
          <circle
            r={64 + (frame % 45) * 0.8}
            fill="none"
            stroke={T.red}
            strokeWidth={4}
            opacity={0.5}
          />
          <rect
            x={-230}
            y={52}
            width={460}
            height={58}
            rx={16}
            fill="rgba(15,23,42,0.92)"
            stroke={T.red}
            strokeWidth={3}
          />
          <text
            textAnchor="middle"
            y={93}
            fill="#fff"
            fontSize={32}
            fontWeight={800}
          >
            BCONS CENTRAL PARK
          </text>
        </g>
        <text
          x={CX}
          y={72}
          textAnchor="middle"
          fill={T.gold}
          fontSize={44}
          fontWeight={800}
          style={{ fontFamily: font }}
        >
          KẾT NỐI VÙNG TỪ PHAN TRUNG
        </text>
      </svg>
    </AbsoluteFill>
  );
};
