import React from "react";
import { AbsoluteFill } from "remotion";
import { useTheme } from "../theme";
import { useEnter } from "../motion";
import { useSpring, type TemplateProps } from "./common";

const DataCard: React.FC<{ delay: number; tag: string; big: string; sub: string }> = ({
  delay,
  tag,
  big,
  sub,
}) => {
  const C = useTheme();
  const enter = useEnter();
  const p = useSpring(delay, 13);
  return (
    <div
      style={{
        padding: "32px 50px",
        borderRadius: 32,
        background: C.bg2,
        border: `4px solid ${C.gold}`,
        boxShadow: `0 0 60px ${C.gold}22`,
        ...enter(p, "right", 300),
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 600, color: C.gold }}>{tag}</div>
      <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>{big}</div>
      <div style={{ fontSize: 46, fontWeight: 600, color: C.teal, marginTop: 6 }}>{sub}</div>
    </div>
  );
};

/** Mẫu `data-cards`: mỗi thẻ hiện khi từ cues[cueKey] được đọc, lệch `offset` frame. */
export const DataCards: React.FC<TemplateProps<"data-cards">> = ({ props, cue }) => {
  const C = useTheme();
  const enter = useEnter();
  const t = useSpring(0);
  return (
    <AbsoluteFill style={{ padding: "110px 70px" }}>
      <div style={{ ...enter(t, "up", 40) }}>
        <div style={{ fontSize: 40, fontWeight: 600, color: C.teal }}>{props.kicker}</div>
        <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.1 }}>{props.title}</div>
      </div>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 34 }}>
        {props.cards.map((c) => (
          <DataCard
            key={c.cueKey}
            delay={cue(c.cueKey) + c.offset}
            tag={c.tag}
            big={c.big}
            sub={c.sub}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
