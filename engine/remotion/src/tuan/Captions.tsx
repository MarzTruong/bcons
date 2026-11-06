import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FPS, WORDS } from "./data";
import { T, clamp, font } from "./style";

type Tok = { text: string; gold: boolean; s: number; e: number };
type Chunk = { toks: Tok[]; from: number; to: number };

/** Chữ thường, bỏ dấu câu ở cuối (giữ dấu phẩy/chấm bên trong số). */
const normToken = (s: string) => s.toLowerCase().replace(/[.,?!]+$/, "");

/** Cụm nói bằng chữ / token sai -> hiển thị đúng. Cụm dài nhất được khớp trước. */
type Rule = { match: string; show: string; gold: boolean };
const RULES: Rule[] = [
  { match: "một trăm năm chục triệu", show: "150 triệu", gold: true },
  { match: "sáu phẩy chín phần trăm", show: "6,9%", gold: true },
  { match: "sáu chấm chín phần trăm", show: "6,9%", gold: true },
  { match: "năm phần trăm", show: "5%", gold: true },
  // Scribe nghe "25,99%"; số đúng (tài liệu CĐT, người nói xác nhận) là 35,99%.
  { match: "25,99%", show: "35,99%", gold: true },
  // Scribe nghe nhầm tên dự án.
  { match: "bcons sky center", show: "Bcons Central Park", gold: false },
  { match: "mbbank", show: "MB Bank", gold: false },
];

/** Token số đã là chữ số: tô vàng khi thuộc danh sách con số quan trọng. */
const GOLD_NUMBER = /^(2,74|35,99%|6,9%|20%|2,45%|0938)/;

const tokenize = (): Tok[] => {
  const out: Tok[] = [];
  const rules = RULES.map((r) => ({ ...r, keys: r.match.split(" ") })).sort(
    (x, y) => y.keys.length - x.keys.length,
  );
  for (let i = 0; i < WORDS.length; ) {
    const hit = rules.find((r) =>
      r.keys.every((k, j) => WORDS[i + j] && normToken(WORDS[i + j].t) === k),
    );
    if (hit) {
      const last = WORDS[i + hit.keys.length - 1];
      const trail = /[.,?!]$/.test(last.t) ? last.t.slice(-1) : "";
      out.push({ text: hit.show + trail, gold: hit.gold, s: WORDS[i].s, e: last.e });
      i += hit.keys.length;
      continue;
    }
    const w = WORDS[i];
    const plain = normToken(w.t);
    out.push({
      text: w.t.replace(/^0938\.32\.31\.39\.$/, "0938.32.31.39"),
      gold: GOLD_NUMBER.test(plain),
      s: w.s,
      e: w.e,
    });
    i++;
  }
  return out;
};

const MAX_WORDS = 4;

const buildChunks = (): Chunk[] => {
  const toks = tokenize();
  const groups: Tok[][] = [];
  let cur: Tok[] = [];
  toks.forEach((t, i) => {
    cur.push(t);
    const gap = toks[i + 1] ? toks[i + 1].s - t.e : 1;
    if (cur.length >= MAX_WORDS || /[.,?!]$/.test(t.text) || gap > 0.5) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
  return groups.map((g, i) => {
    const from = Math.round(g[0].s * FPS) - 2;
    const next = groups[i + 1];
    const end = Math.round(g[g.length - 1].e * FPS) + 6;
    const to = next ? Math.min(end, Math.round(next[0].s * FPS) - 2) : end;
    return { toks: g, from, to };
  });
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const chunks = useMemo(buildChunks, []);
  const chunk = chunks.find((c) => frame >= c.from && frame < c.to);
  if (!chunk) return null;
  const pop = interpolate(frame, [chunk.from, chunk.from + 5], [0.9, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        top: 1490,
        height: 190,
        bottom: "auto",
        padding: "0 56px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 1.15,
          textAlign: "center",
          textTransform: "none",
          transform: `scale(${pop})`,
          WebkitTextStroke: "12px #000",
          paintOrder: "stroke fill",
          textShadow: "0 6px 18px rgba(0,0,0,0.6)",
        }}
      >
        {chunk.toks.map((t, i) => (
          <span key={i} style={{ color: t.gold ? T.gold : T.white }}>
            {t.text}{" "}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
