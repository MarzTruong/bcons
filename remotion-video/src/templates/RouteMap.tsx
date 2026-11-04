import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { fontFamily, useTheme } from "../theme";
import type { SceneOf } from "../spec";
import { clamp, useSpring, type TemplateProps } from "./common";

type NodeSpec = SceneOf<"route-map">["props"]["nodes"][number];

const Node: React.FC<{ n: NodeSpec; delay: number }> = ({ n, delay }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const s = useSpring(delay, 10);
  const pulse = (frame % 45) / 45;
  const r = n.big ? 30 : 22;
  const color = { white: C.neutral, gold: C.gold, red: C.red }[n.color];
  return (
    <g opacity={s}>
      <circle
        cx={n.x}
        cy={n.y}
        r={r + pulse * 40}
        fill="none"
        stroke={color}
        strokeWidth={3}
        opacity={1 - pulse}
      />
      <circle cx={n.x} cy={n.y} r={r * s} fill={color} />
      <text
        x={n.x + (n.labelDx ?? 0)}
        y={n.y + (n.labelDy ?? -60)}
        fill={C.text}
        fontSize={n.big ? 56 : 48}
        fontWeight={700}
        textAnchor={n.anchor ?? "middle"}
        fontFamily={fontFamily}
      >
        {n.label}
      </text>
    </g>
  );
};

/** Mẫu `route-map`. Cần cues cho highwayCueKey, triangleCueKey, infoCueKey. */
export const RouteMap: React.FC<TemplateProps<"route-map">> = ({ props, cue }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const title = useSpring(0);
  const cueHwy = cue(props.highwayCueKey);
  const cueDate = cue(props.infoCueKey);
  const cueTri = cue(props.triangleCueKey);
  const hwy = interpolate(frame, [cueHwy, cueHwy + 100], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const tri = interpolate(frame, [cueTri, cueTri + 60], [0, 1], clamp);
  const label = useSpring(cueDate - 10, 12);
  const at = (key: string) => {
    const n = props.nodes.find((x) => x.key === key);
    if (!n) throw new Error(`route-map: không có nút "${key}"`);
    return n;
  };
  const { fromKey, viaKey, toKey, c1, c2, s2 } = props.highway;
  const from = at(fromKey);
  const via = at(viaKey);
  const to = at(toKey);
  const hwyPath = `M ${from.x} ${from.y} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${via.x} ${via.y} S ${s2[0]} ${s2[1]}, ${to.x} ${to.y}`;
  const [t1, t2, t3] = props.triangle.map(at);
  const triPath = `M ${t1.x} ${t1.y} L ${t2.x} ${t2.y} L ${t3.x} ${t3.y} Z`;
  return (
    <AbsoluteFill>
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
        <div style={{ fontSize: 40, fontWeight: 600, color: C.teal }}>{props.kicker}</div>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1 }}>{props.title}</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(100,-33) scale(0.81)">
          <path
            d={triPath}
            pathLength={1}
            fill={`${C.gold}0f`}
            stroke={C.gold}
            strokeWidth={4}
            strokeDasharray="0.02 0.012"
            opacity={tri}
          />
          <path
            d={hwyPath}
            fill="none"
            stroke={C.teal}
            strokeWidth={22}
            opacity={0.15}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - hwy}
          />
          <path
            d={hwyPath}
            fill="none"
            stroke={C.teal}
            strokeWidth={9}
            strokeLinecap="round"
            filter="url(#glow)"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - hwy}
          />
          {props.nodes.map((n) => (
            <Node key={n.key} n={n} delay={cueHwy + n.delay} />
          ))}
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1150,
          padding: "30px 40px",
          borderRadius: 28,
          background: C.bg2,
          border: `3px solid ${C.teal}`,
          opacity: label,
          transform: `translateY(${(1 - label) * 50}px)`,
        }}
      >
        <div style={{ fontSize: 38, color: C.teal, fontWeight: 600 }}>{props.infoTitle}</div>
        <div style={{ fontSize: 52, fontWeight: 800, marginTop: 6 }}>{props.infoText}</div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          width: "100%",
          textAlign: "center",
          fontSize: 28,
          color: C.faint,
          opacity: label,
        }}
      >
        {props.note}
      </div>
    </AbsoluteFill>
  );
};
