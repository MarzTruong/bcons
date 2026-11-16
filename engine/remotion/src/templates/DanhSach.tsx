import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { fontFamily } from "../theme";
import { useDuAn } from "../duAn";
import { danhSachState, FPS_MO_DAU, type RowPhase } from "../moDau";
import type { TemplateProps } from "./common";

const TEAL = "#7ee0c3";
const GOLD = "#ffe14d";
const INK = "#06121f";

const rowStyle = (phase: RowPhase): React.CSSProperties => {
  switch (phase) {
    case "active":
      return { background: "#143250", borderLeft: `10px solid ${GOLD}` };
    case "done":
      return { background: "rgba(14,38,60,0.92)", borderLeft: `10px solid ${TEAL}`, opacity: 0.84 };
    case "summary":
      return { background: "#13314c", borderLeft: `10px solid ${TEAL}`, padding: "26px 28px" };
    default:
      return { background: "rgba(13,33,54,0.88)", borderLeft: "10px solid #26425c" };
  }
};

const chipStyle = (phase: RowPhase): React.CSSProperties =>
  phase === "active"
    ? { background: GOLD, color: INK }
    : phase === "done" || phase === "summary"
      ? { background: "rgba(126,224,195,0.18)", color: TEAL }
      : { background: "#17344f", color: "#7c97b2" };

/** Mỗi mục vào bằng một kiểu khác nhau (trượt trái, nâng lên, trượt phải), như bản AGY. */
const enterTransform = (i: number, enter: number): string => {
  const d = 1 - enter;
  const k = i % 3;
  if (k === 0) return `translateX(${(-d * 32).toFixed(1)}px)`;
  if (k === 1) return `translateY(${(d * 26).toFixed(1)}px) scale(${(0.96 + 0.04 * enter).toFixed(3)})`;
  return `translateX(${(d * 32).toFixed(1)}px)`;
};

/**
 * Mẫu `danh-sach` (AGY kiểu 1, anh chọn 15/11/2026): mục hiện lần lượt khi từ cues[cueKey] được đọc, đếm "Đã xem n/N",
 * cuối cảnh gom cả danh sách kèm băng tổng kết. Không đánh số 01/02/03 (các mục không theo trình tự; F-04).
 * Màu và bố cục giữ nguyên bản AGY (bản sửa 16/11/2026: khối tiêu đề + danh sách cân giữa khung 3:4, chữ mục 40/30 px), không đổi theo phong cách (style) của video.
 */
export const DanhSach: React.FC<TemplateProps<"danh-sach">> = ({ props, cue, frames }) => {
  const frame = useCurrentFrame();
  const duAn = useDuAn();
  const n = props.muc.length;
  const reveals = props.muc.map((m) => cue(m.cueKey));
  const summaryAt = props.tongKet?.cueKey ? cue(props.tongKet.cueKey) : frames - Math.round(1.5 * FPS_MO_DAU);
  const st = danhSachState(frame, reveals, summaryAt, n);
  const [first, ...rest] = props.title.split(" ");
  return (
    <AbsoluteFill style={{ fontFamily, background: INK }}>
      {props.image ? (
        <Img
          src={staticFile(props.image.file)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", opacity: 0.24 }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(6,18,31,0.92) 0%, rgba(6,18,31,0.86) 50%, rgba(6,18,31,0.96) 100%)",
        }}
      />
      <AbsoluteFill style={{ padding: "268px 136px 320px 72px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 27, fontWeight: 700, color: "#b7c8da" }}>
            <span style={{ width: 12, height: 12, background: GOLD }} />
            <span>{duAn.ten}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ background: "#10263c", color: GOLD, padding: "8px 18px", fontSize: 26, fontWeight: 800, borderRadius: 4, fontVariantNumeric: "tabular-nums" }}>
              Đã xem {st.seen}/{n}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {st.rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 10,
                    borderRadius: 2,
                    background: r.phase === "summary" || r.phase === "done" ? TEAL : r.phase === "active" ? GOLD : "#1a3550",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {props.kicker ? <div style={{ fontSize: 26, fontWeight: 700, color: TEAL, marginBottom: 8 }}>{props.kicker}</div> : null}
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.08, color: "#fff", letterSpacing: "-0.02em", marginBottom: 42 }}>
          <span style={{ color: GOLD }}>{first}</span> {rest.join(" ")}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: st.summary ? 18 : 28,
            ...(st.summary
              ? { background: "rgba(16,40,66,0.72)", border: `2px solid ${TEAL}`, borderRadius: 8, padding: 24 }
              : {}),
          }}
        >
          {props.muc.map((m, i) => {
            const r = st.rows[i];
            const chip = r.phase === "summary" ? "Đã điểm ✓" : r.phase === "hidden" ? "Sắp tới" : r.phase === "done" ? "Đã xem ✓" : `Mục ${i + 1}/${n}`;
            const opacity = r.phase === "summary" ? 1 : r.phase === "hidden" ? 0 : r.phase === "done" ? 0.84 : r.enter;
            const transform = r.phase === "active" ? enterTransform(i, r.enter) : r.phase === "hidden" ? enterTransform(i, 0) : "none";
            return (
              <div
                key={m.ten}
                style={{
                  padding: "36px 34px",
                  borderRadius: "0 6px 6px 0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 24,
                  ...rowStyle(r.phase),
                  opacity,
                  transform,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.18, color: "#fff", marginBottom: 8 }}>{m.ten}</div>
                  <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.3, color: "#c5d7e8" }}>{m.so}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, padding: "6px 12px", borderRadius: 4, whiteSpace: "nowrap", marginTop: 4, ...chipStyle(r.phase) }}>
                  {chip}
                </div>
              </div>
            );
          })}
        </div>
        {props.tongKet ? (
          <div
            style={{
              marginTop: 34,
              background: TEAL,
              color: INK,
              padding: "26px 30px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: st.bannerP,
              transform: `translateY(${((1 - st.bannerP) * 14).toFixed(1)}px)`,
            }}
          >
            <div style={{ fontSize: 31, fontWeight: 800, lineHeight: 1.25 }}>{props.tongKet.text}</div>
            <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums", paddingLeft: 16 }}>
              {n}/{n}
            </div>
          </div>
        ) : null}
        </div>
      </AbsoluteFill>
      {props.image ? (
        <div style={{ position: "absolute", bottom: 264, left: 72, fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>
          {props.image.label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
