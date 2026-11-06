import React from "react";
import { AbsoluteFill } from "remotion";
import { useTheme } from "../theme";
import { useEnter } from "../motion";
import { useSpring, type TemplateProps } from "./common";

const fmt = (v: number) => String(v).replace(".", ",");

const BarRow: React.FC<{
  label: string;
  value: number;
  max: number;
  unit: string;
  delay: number;
  color: string;
}> = ({ label, value, max, unit, delay, color }) => {
  const C = useTheme();
  const p = useSpring(delay, 16);
  const pct = (value / max) * 100;
  const inside = pct >= 30;
  return (
    <div style={{ opacity: Math.min(1, p * 2) }}>
      <div style={{ fontSize: 44, fontWeight: 600, color: C.text }}>{label}</div>
      <div
        style={{
          marginTop: 14,
          height: 130,
          borderRadius: 24,
          background: C.bg2,
          border: `3px solid ${color}55`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct * p}%`,
            height: "100%",
            background: color,
            borderRadius: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            // Số nằm trong thanh (chữ tối) nếu thanh đủ dài, ngược lại nằm ngay sau đầu thanh (chữ trắng).
            ...(inside ? { left: 30 } : { left: `calc(${pct * p}% + 24px)` }),
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 64,
            fontWeight: 800,
            color: inside ? C.onAccent : C.text,
            opacity: p,
          }}
        >
          {fmt(value)}
          <span style={{ fontSize: 40, fontWeight: 600 }}>{unit}</span>
        </div>
      </div>
    </div>
  );
};

/** Mẫu `compare-bars`: các thanh ngang so sánh, mỗi thanh chạy khi từ cues[cueKey] được đọc. */
export const CompareBars: React.FC<TemplateProps<"compare-bars">> = ({ props, cue }) => {
  const C = useTheme();
  const enter = useEnter();
  const t = useSpring(0);
  const max = Math.max(...props.bars.map((b) => b.value));
  const palette = C.bars;
  return (
    <AbsoluteFill style={{ padding: "110px 70px" }}>
      <div style={{ ...enter(t, "up", 40) }}>
        <div style={{ fontSize: 40, fontWeight: 600, color: C.teal }}>{props.kicker}</div>
        <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.1 }}>{props.title}</div>
      </div>
      <div style={{ marginTop: 90, display: "flex", flexDirection: "column", gap: 56 }}>
        {props.bars.map((b, i) => (
          <BarRow
            key={b.cueKey}
            label={b.label}
            value={b.value}
            max={max}
            unit={props.unit}
            delay={cue(b.cueKey) - 5}
            color={palette[i % palette.length]}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
