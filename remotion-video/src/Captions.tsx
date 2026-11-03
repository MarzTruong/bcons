import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, fontFamily } from "./theme";
import { FPS, LEAD, type Word } from "./timing";

type Chunk = { words: Word[]; from: number; to: number };

const MAX_WORDS = 5;

/** Chia lời thoại thành cụm ngắn, ngắt ở dấu phẩy/chấm. */
const buildChunks = (words: Word[]): Chunk[] => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    const spoken = cur.filter((x) => x.text !== "-");
    if (spoken.length >= MAX_WORDS || /[,.]$/.test(w.text)) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) {
    // tránh cụm cuối chỉ có 1-2 từ
    if (cur.length < 3 && groups.length) groups[groups.length - 1].push(...cur);
    else groups.push(cur);
  }
  return groups.map((g, i) => {
    const from = LEAD + g[0].start * FPS - 4;
    const next = groups[i + 1];
    const to = next
      ? LEAD + next[0].start * FPS - 4
      : LEAD + g[g.length - 1].end * FPS + 12;
    return { words: g, from, to };
  });
};

export const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const chunks = useMemo(() => buildChunks(words), [words]);
  const chunk = chunks.find((c) => frame >= c.from && frame < c.to);
  if (!chunk) return null;
  const pop = interpolate(frame, [chunk.from, chunk.from + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const t = (frame - LEAD) / FPS;
  return (
    <AbsoluteFill
      style={{
        top: 1400,
        height: 360,
        bottom: "auto",
        padding: "0 60px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1.25,
          textAlign: "center",
          color: C.white,
          opacity: pop,
          transform: `translateY(${(1 - pop) * 20}px)`,
          textShadow:
            "0 4px 0 #000, 0 0 12px #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000",
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.02;
          const isNumber = /\d/.test(w.text);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: 18,
                color: active ? (isNumber ? C.teal : C.gold) : C.white,
                transform: active ? "scale(1.1)" : "scale(1)",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
