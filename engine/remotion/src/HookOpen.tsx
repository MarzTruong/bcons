import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { fontFamily } from "./theme";
import { useDuAn } from "./duAn";
import { FPS_MO_DAU, HOOK_FRAMES, hookState } from "./moDau";
import { hookTuBia, kichCoBia, mauChuDe, type Bia, type ChuDe } from "./bia";

const TEAL = "#7ee0c3";
const INK = "#06121f";

/** Dữ liệu một khung mở đầu / bìa (xem `HookSchema` trong spec.ts và `BiaSchema` trong bia.ts). */
export type HookData = {
  lines: string[];
  soNhan?: string;
  donVi?: string;
  dongPhu?: string;
  chuDe?: ChuDe;
  viTriAnh?: string;
  image?: { file: string; label: string };
};

/**
 * Khung mở đầu 0–3 giây và ảnh bìa dùng chung một bố cục (bản AGY kiểu 1, anh chọn 15–16/11/2026):
 * khung 0 của video chính là bìa. `tinh` = ảnh bìa (t = 0, không gạch nhấn, dòng phụ, thanh nhịp).
 * Màu nhấn theo chủ đề; cỡ chữ theo `kichCoBia`. Không khai chủ đề thì màu xanh ngọc như bản đầu.
 */
export const HookKhung: React.FC<{ hook: HookData; tenDuAn: string; t: number; tinh?: boolean }> = ({ hook, tenDuAn, t, tinh = false }) => {
  const lastWords = hook.lines[hook.lines.length - 1].split(" ");
  const s = hookState(t, lastWords.length);
  const accent = hook.chuDe ? mauChuDe(hook.chuDe) : TEAL;
  const co = kichCoBia({ tieuDe: hook.lines, diemNhan: hook.soNhan, ghiChuNhan: hook.donVi });
  const block = { opacity: s.blockOpacity, transform: `translateY(${s.blockShift}px)` };
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
            objectPosition: hook.viTriAnh ?? "center 30%",
            transformOrigin: "45% 32%",
            transform: `scale(${s.bgScale})`,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(6,18,31,0.70) 0%, rgba(6,18,31,0.22) 22%, rgba(6,18,31,0.14) 40%, rgba(6,18,31,0.72) 55%, rgba(6,18,31,0.94) 70%, rgba(6,18,31,0.98) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: 272, left: 72, right: 72, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 700, color: "#fff", textShadow: "0 3px 12px rgba(0,0,0,0.65)" }}>
          <span style={{ width: 36, height: 8, background: accent }} />
          <span>{tenDuAn}</span>
        </div>
        {hook.image ? (
          <div
            style={{
              fontSize: 35,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#fff",
              background: "rgba(6,18,31,0.84)",
              borderLeft: `5px solid ${accent}`,
              padding: "8px 18px",
              borderRadius: "0 4px 4px 0",
              whiteSpace: "nowrap",
            }}
          >
            {hook.image.label}
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", bottom: 380, left: 72, right: 140, borderLeft: `14px solid ${accent}`, paddingLeft: 34, ...block }}>
        {hook.soNhan ? (
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "nowrap", gap: 18, marginBottom: 22 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: co.num,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                color: accent,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transformOrigin: "left bottom",
                transform: `scale(${s.numScale})`,
                display: "inline-block",
              }}
            >
              {hook.soNhan}
            </span>
            {hook.donVi ? <span style={{ fontWeight: 700, fontSize: co.unit, lineHeight: 1.12, color: "#e6eff7" }}>{hook.donVi}</span> : null}
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hook.lines.map((line, li) => (
            <div key={line} style={{ fontWeight: 800, fontSize: co.title, lineHeight: 1.08, letterSpacing: "-0.02em", color: "#fff" }}>
              {li === hook.lines.length - 1 && !tinh
                ? line.split(" ").map((w, wi) => (
                    <React.Fragment key={wi}>
                      {wi > 0 ? " " : null}
                      <span style={{ color: s.wordsOn[wi] ? accent : "#fff" }}>{w}</span>
                    </React.Fragment>
                  ))
                : line}
            </div>
          ))}
        </div>
      </div>
      {!tinh ? (
        <>
          {/* Gạch nhấn và dòng phụ nằm ngay dưới khối chữ (y = 1540) để khung 0 giống hệt bìa. */}
          <div style={{ position: "absolute", top: 1554, left: 120, width: `${s.underline}%`, maxWidth: 820, height: 10, background: accent, borderRadius: 2, ...block }} />
          {hook.dongPhu ? (
            <div
              style={{
                position: "absolute",
                top: 1586,
                left: 120,
                right: 140,
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.32,
                color: "#c8f3e6",
                display: "flex",
                gap: 12,
                opacity: s.subOpacity * s.blockOpacity,
                transform: `translateY(${s.subShift + s.blockShift}px)`,
              }}
            >
              <span style={{ color: accent, fontWeight: 800, flexShrink: 0 }}>→</span>
              <span>{hook.dongPhu}</span>
            </div>
          ) : null}
          <div style={{ position: "absolute", top: 1700, left: 72, right: 140, height: 6, background: s.beat > 0 ? "rgba(255,255,255,0.14)" : "transparent", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${s.beat}%`, background: accent }} />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Khung mở đầu phủ lên đầu cảnh 1 (0–3 s, mờ dần ở 2,45–3,0 s). */
export const HookOpen: React.FC<{ hook: HookData }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const duAn = useDuAn();
  if (frame >= HOOK_FRAMES) return null;
  return <HookKhung hook={hook} tenDuAn={duAn.ten} t={frame / FPS_MO_DAU} />;
};

/** Ảnh bìa: khung 0 của video, không có phần chuyển động. Dùng cho `npm run bia`. */
export const BiaCover: React.FC<{ bia: Bia; tenDuAn: string }> = ({ bia, tenDuAn }) => <HookKhung hook={hookTuBia(bia)} tenDuAn={tenDuAn} t={0} tinh />;
