import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../theme";
import { useEnter } from "../motion";
import { clamp, useSpring, type TemplateProps } from "./common";

const TitleLine: React.FC<{ text: string; delay: number; color: string }> = ({
  text,
  delay,
  color,
}) => {
  const p = useSpring(delay);
  const enter = useEnter();
  return (
    <div
      style={{
        fontSize: 76,
        fontWeight: 800,
        lineHeight: 1.15,
        color,
        ...enter(p, "up", 60),
      }}
    >
      {text}
    </div>
  );
};

/** Mẫu `stat-hero`. Cần cues.value = chữ hiển thị mà số bắt đầu chạy khi nó được đọc. */
export const StatHero: React.FC<TemplateProps<"stat-hero">> = ({ props, cue }) => {
  const C = useTheme();
  const enter = useEnter();
  const frame = useCurrentFrame();
  const badge = useSpring(0);
  const cv = cue("value");
  const card = useSpring(cv - 50);
  const value = interpolate(frame, [cv - 15, cv + 35], [0, props.value], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
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
          ...enter(badge, "scale", 0),
        }}
      >
        {props.badge}
      </div>
      <div style={{ marginTop: 130 }}>
        {props.titleLines.map((t, i) => (
          <TitleLine key={t} text={t} delay={10 + 8 * i} color={i === 0 ? C.teal : C.text} />
        ))}
      </div>
      <div
        style={{
          marginTop: 90,
          padding: "50px 50px",
          borderRadius: 36,
          background: C.bg2,
          border: `3px solid ${C.gold}`,
          ...enter(card, "up", 80),
          boxShadow: `0 0 80px ${C.gold}22`,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 600, color: C.text }}>{props.cardLabel}</div>
        {props.prefix ? (
          <div style={{ marginTop: 20, fontSize: 64, fontWeight: 600, color: C.gold }}>
            {props.prefix}
          </div>
        ) : null}
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
            {value.toFixed(props.decimals).replace(".", ",")}
          </span>
          <span style={{ fontSize: 80, fontWeight: 700, color: C.text }}>{props.unit}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
