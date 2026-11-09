import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fontFamily, useTheme } from "./theme";
import { FPS, LEAD, type Word } from "./timing";
import { fontSizeFor, groupWords, mergePunct } from "./captionChunks";
import { capCho } from "./capKieu";

type Chunk = { words: Word[]; from: number; to: number; size: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Cụm phụ đề theo độ dài chữ (vừa 2 dòng), cỡ chữ tự co theo cụm. */
const buildChunks = (words: Word[]): Chunk[] => {
  const groups = groupWords(mergePunct(words));
  return groups.map((g, i) => {
    const from = LEAD + g[0].start * FPS - 4;
    const next = groups[i + 1];
    const to = next ? LEAD + next[0].start * FPS - 4 : LEAD + g[g.length - 1].end * FPS + 12;
    return { words: g, from, to, size: fontSizeFor(g.map((w) => w.text).join(" ")) };
  });
};

const isNumber = (s: string) => /\d/.test(s);

/**
 * Phụ đề từng từ. Từ đang đọc đổi màu; số và chữ trong `nhan` (spec) được nhấn: nền màu quét ngang,
 * bật to nhẹ, viền sáng; đọc xong vẫn giữ màu nhấn.
 */
export const Captions: React.FC<{ words: Word[]; nhan?: string[]; trenBanDo?: boolean }> = ({ words, nhan = [], trenBanDo = false }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const chunks = useMemo(() => buildChunks(words), [words]);
  const chunk = chunks.find((c) => frame >= c.from && frame < c.to);
  if (!chunk) return null;
  const pop = interpolate(frame, [chunk.from, chunk.from + 6], [0, 1], clamp);
  const t = (frame - LEAD) / FPS;
  // Bộ "moi": bong = chữ trắng đổ bóng mềm (trên ảnh), phang = không viền, nhan = nhãn dán nền vàng chữ đen.
  const kieu = capCho(C.look === "moi" ? (C.issue as { cap?: string } | undefined)?.cap : undefined, trenBanDo);
  const cap = kieu.cap;
  const chu = kieu.chuTrang ? "#ffffff" : C.text;
  const nhanBg = cap === "nhan" ? (C.issue as { block?: string; onBlock?: string }) : undefined;
  const strong = (w: Word) => isNumber(w.text) || nhan.some((n) => w.text.replace(/[,.!?;:]$/, "") === n.replace(/[,.!?;:]$/, ""));
  return (
    <AbsoluteFill
      style={{ top: 1400, height: 360, bottom: "auto", padding: "0 60px", justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: chunk.size,
          lineHeight: 1.25,
          textAlign: "center",
          color: nhanBg ? nhanBg.onBlock : chu,
          background: nhanBg ? nhanBg.block : undefined,
          padding: nhanBg ? "6px 26px 10px" : undefined,
          borderRadius: nhanBg ? 18 : undefined,
          opacity: pop,
          transform: `translateY(${(1 - pop) * 20}px)`,
          // Bìa tạp chí: nền phẳng, chữ đã đủ tương phản; viền tối trên chữ tối làm chữ lem (anh 07/11/2026).
          textShadow: C.look === "tapchi" || cap === "phang" || cap === "nhan" ? "none" : cap === "bong" ? "0 3px 14px #000c, 0 2px 0 #000" : `0 4px 0 ${C.stroke}, 0 0 12px ${C.stroke}, 3px 3px 0 ${C.stroke}, -3px 3px 0 ${C.stroke}, 3px -3px 0 ${C.stroke}, -3px -3px 0 ${C.stroke}`,
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.02;
          const said = t >= w.start;
          const s = strong(w);
          const accent = isNumber(w.text) ? C.teal : C.gold;
          // nhấn: nền quét 0→100% trong 6 khung khi bắt đầu đọc
          const sweep = s ? interpolate(frame, [LEAD + w.start * FPS, LEAD + w.start * FPS + 6], [0, 100], clamp) : 0;
          // Chỉ chữ nhấn phóng nhẹ (có lề riêng); chữ thường đang đọc chỉ đổi màu, phóng to sẽ lấn khoảng trống làm dính chữ.
          const bump = s && active ? interpolate(frame, [LEAD + w.start * FPS, LEAD + w.start * FPS + 5], [1, 1.06], clamp) : 1;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: s ? 22 : 16,
                marginLeft: s ? 6 : 0,
                padding: s ? "0 10px" : 0,
                borderRadius: 12,
                color: nhanBg ? (s && said ? "#c81e1e" : nhanBg.onBlock) : s && said ? accent : active ? C.gold : chu,
                transform: `scale(${bump})`,
                backgroundImage: s ? `linear-gradient(90deg, ${accent}40 ${sweep}%, transparent ${sweep}%)` : undefined,
                textShadow: s && active && C.look !== "tapchi" && C.look !== "moi" ? `0 0 18px ${accent}aa, 0 4px 0 ${C.stroke}` : undefined,
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
