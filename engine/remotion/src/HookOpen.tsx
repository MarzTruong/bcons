import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { fontFamily } from "./theme";
import { useDuAn } from "./duAn";
import { FPS_MO_DAU, HOOK_FRAMES, hookState } from "./moDau";
import type { VideoSpec } from "./spec";

const TEAL = "#7ee0c3";
const INK = "#06121f";

/**
 * Khung mở đầu 0–3 giây phủ lên đầu cảnh 1 (bản AGY kiểu 1, khớp ảnh bìa; anh chọn 15/11/2026).
 * Khung 0 đã đủ chữ: số nhấn + hook. Mờ dần ở 2,45–3,0 s để lộ cảnh 1. Bố cục, màu, cỡ chữ giữ nguyên bản AGY;
 * bỏ chữ giờ "0.0s / 3.0s" của bản demo (F-03 biên bản kiểm 15/11/2026).
 */
export const HookOpen: React.FC<{ hook: NonNullable<VideoSpec["hook"]> }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const duAn = useDuAn();
  if (frame >= HOOK_FRAMES) return null;
  const lastWords = hook.lines[hook.lines.length - 1].split(" ");
  const s = hookState(frame / FPS_MO_DAU, lastWords.length);
  const len = (hook.soNhan ?? "").length;
  const numSize = len >= 5 ? 142 : len >= 3 ? 172 : 220;
  const unitSize = len >= 5 ? 46 : 58;
  return (
    <AbsoluteFill style={{ fontFamily, background: INK, opacity: s.overlayOpacity }}>
      {hook.image ? (
        <Img
          src={staticFile(hook.image.file)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "34% 26%",
            transformOrigin: "45% 32%",
            transform: `scale(${s.bgScale})`,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(6,18,31,0.68) 0%, rgba(6,18,31,0.22) 22%, rgba(6,18,31,0.14) 40%, rgba(6,18,31,0.74) 55%, rgba(6,18,31,0.94) 70%, rgba(6,18,31,0.98) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 278,
          left: 72,
          right: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 700, color: "#fff", textShadow: "0 3px 12px rgba(0,0,0,0.65)" }}>
          <span style={{ width: 36, height: 8, background: TEAL }} />
          <span>{duAn.ten}</span>
        </div>
        {hook.image ? (
          <div style={{ fontSize: 25, fontWeight: 600, color: "rgba(255,255,255,0.92)", textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>
            {hook.image.label}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 380,
          left: 72,
          right: 140,
          borderLeft: `14px solid ${TEAL}`,
          paddingLeft: 34,
          opacity: s.blockOpacity,
          transform: `translateY(${s.blockShift}px)`,
        }}
      >
        {hook.soNhan ? (
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 18, marginBottom: 22 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: numSize,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                color: TEAL,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                transformOrigin: "left bottom",
                transform: `scale(${s.numScale})`,
                display: "inline-block",
              }}
            >
              {hook.soNhan}
            </span>
            {hook.donVi ? <span style={{ fontWeight: 800, fontSize: unitSize, lineHeight: 1.1, color: "#e6eff7" }}>{hook.donVi}</span> : null}
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hook.lines.map((line, li) => (
            <div key={line} style={{ fontWeight: 800, fontSize: 92, lineHeight: 1.08, letterSpacing: "-0.02em", color: "#fff" }}>
              {li === hook.lines.length - 1
                ? line.split(" ").map((w, wi) => (
                    <React.Fragment key={wi}>
                      {wi > 0 ? " " : null}
                      <span style={{ color: s.wordsOn[wi] ? TEAL : "#fff" }}>{w}</span>
                    </React.Fragment>
                  ))
                : line}
            </div>
          ))}
        </div>
        <div style={{ height: 10, background: TEAL, marginTop: 14, width: `${s.underline}%`, borderRadius: 2 }} />
        {hook.dongPhu ? (
          <div
            style={{
              marginTop: 22,
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.32,
              color: "#c8f3e6",
              display: "flex",
              gap: 12,
              opacity: s.subOpacity,
              transform: `translateY(${s.subShift}px)`,
            }}
          >
            <span style={{ color: TEAL, fontWeight: 800, flexShrink: 0 }}>→</span>
            <span>{hook.dongPhu}</span>
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", top: 1620, left: 72, right: 140, height: 6, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${s.beat}%`, background: TEAL }} />
      </div>
    </AbsoluteFill>
  );
};
