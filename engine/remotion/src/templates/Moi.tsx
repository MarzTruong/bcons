// Bộ phong cách "moi" (anh ưng cả 3 mẫu 07/11/2026, mỗi video một kiểu, src/issues.ts → moiOf):
//   A "anh": ảnh dự án làm nền, chữ trắng, số xanh ngọc.
//   B "bantin": bản tin tài chính nền sáng, thẻ trắng, nhấn cam.
//   C "khoimau": đen + vàng chanh, khối màu lớn, phụ đề nhãn dán.
// Chung một khung bố cục; kiểu nào khác ở nền, cách đóng khung và phụ đề.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { useTheme } from "../theme";
import { LEAD } from "../timing";
import { clamp, type TemplateProps } from "./common";
import { NameQr, useWatermark } from "../Watermark";
import { tachTen, useDuAn } from "../duAn";
import type { MoiLook } from "../issues";

const { fontFamily: display } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["vietnamese", "latin"],
});

const SIDE = 70;
const out = (t: number) => 1 - Math.pow(1 - t, 3);
const useMoi = () => useTheme().issue as unknown as MoiLook;

/** Nền phẳng theo kiểu; kiểu B có vạch cam trên cùng. */
export const MoiGround: React.FC = () => {
  const M = useMoi();
  return (
    <AbsoluteFill style={{ background: M.bg }}>
      {M.kind === "bantin" ? <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 16, background: M.accent }} /> : null}
    </AbsoluteFill>
  );
};

/** Ảnh tràn khung, tối dần xuống dưới để đặt chữ (kiểu A). */
const PhotoBg: React.FC<{ file: string; label: string; frames?: number; height?: number | string; fadeFrom?: string }> = ({ file, label, frames = 300, height = "100%", fadeFrom = "30%" }) => {
  const M = useMoi();
  const frame = useCurrentFrame();
  const kb = interpolate(frame, [0, frames], [1.08, 1], clamp);
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height, overflow: "hidden" }}>
      <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${M.bg}00 0%, ${M.bg}00 ${fadeFrom}, ${M.bg}cc 62%, ${M.bg} 82%)` }} />
      <div style={{ position: "absolute", top: 100, right: SIDE, fontSize: 24, fontWeight: 600, color: "#fff", textShadow: "0 2px 8px #000a" }}>{label}</div>
    </div>
  );
};

const Num: React.FC<{ value: string; unit: string; size: number; color: string; unitColor: string }> = ({ value, unit, size, color, unitColor }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap" }}>
    <span style={{ fontFamily: display, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: -4, color, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    <span style={{ fontFamily: display, fontWeight: 800, fontSize: size * 0.42, color: unitColor }}>{unit}</span>
  </div>
);

/** stat-hero: A = ảnh nền + chữ đè; B = tiêu đề + thẻ trắng chứa số; C = khối đen tiêu đề vàng, số trên nền vàng. */
export const MoiStatHero: React.FC<TemplateProps<"stat-hero">> = ({ props, cue, frames }) => {
  const M = useMoi();
  const frame = useCurrentFrame();
  const cv = cue("value");
  const v = interpolate(frame, [cv - 15, cv + 30], [0, props.value], { ...clamp, easing: out });
  const numIn = interpolate(frame, [cv - 22, cv - 6], [0, 1], { ...clamp, easing: out });
  const head = interpolate(frame, [4, 22], [0, 1], { ...clamp, easing: out });
  const title = props.titleLines.join(" ");
  const value = v.toFixed(props.decimals).replace(".", ",");
  const unitParts = props.unit.match(/^([–-][\d.,]+)(.*)$/);
  const shownValue = unitParts ? `${value}${unitParts[1]}` : value;
  const shownUnit = unitParts ? unitParts[2] : props.unit;
  const source = <div style={{ position: "absolute", top: 1330, left: SIDE, right: SIDE, fontSize: 26, fontWeight: 600, color: M.kind === "khoimau" ? M.onBlock : M.muted }}>{props.badge}</div>;

  if (M.kind === "anh") {
    return (
      <AbsoluteFill style={{ color: M.text }}>
        {props.image ? <PhotoBg file={props.image.file} label={props.image.label} frames={frames} /> : null}
        <div style={{ position: "absolute", top: 760, left: SIDE, right: SIDE }}>
          <div style={{ fontFamily: display, fontWeight: 900, fontSize: 96, lineHeight: 1.05, opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>{title}</div>
          <div style={{ marginTop: 28, opacity: numIn }}>
            <Num value={shownValue} unit={shownUnit} size={170} color={M.accent} unitColor={M.text} />
            <div style={{ fontSize: 40, fontWeight: 600, color: M.muted, marginTop: 12 }}>{props.cardLabel}</div>
          </div>
        </div>
        {source}
      </AbsoluteFill>
    );
  }
  if (M.kind === "bantin") {
    return (
      <AbsoluteFill style={{ color: M.text }}>
        <div style={{ position: "absolute", top: 150, left: SIDE, right: SIDE, fontFamily: display, fontWeight: 900, fontSize: 96, lineHeight: 1.08, opacity: head }}>{title}</div>
        <div style={{ position: "absolute", top: 600, left: SIDE, right: SIDE, background: M.card, borderRadius: 28, padding: "46px 50px", boxShadow: "0 18px 40px #0b1f3a1f", opacity: numIn, transform: `translateY(${(1 - numIn) * 40}px)` }}>
          <div style={{ fontSize: 38, fontWeight: 600, color: M.muted }}>{props.cardLabel}</div>
          <div style={{ marginTop: 10 }}>
            <Num value={shownValue} unit={shownUnit} size={170} color={M.text} unitColor={M.accent} />
          </div>
        </div>
        {source}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ color: M.text }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 760, background: M.bg }} />
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, bottom: 0, background: M.block }} />
      <div style={{ position: "absolute", top: 170, left: SIDE, right: SIDE, fontFamily: display, fontWeight: 900, fontSize: 112, lineHeight: 1.02, color: M.accent, textTransform: "uppercase", clipPath: `inset(-40px ${(1 - head) * 100}% -40px 0)` }}>{title}</div>
      <div style={{ position: "absolute", top: 850, left: SIDE, right: SIDE, color: M.onBlock, opacity: numIn }}>
        <Num value={shownValue} unit={shownUnit} size={190} color={M.onBlock} unitColor={M.onBlock} />
        <div style={{ fontSize: 40, fontWeight: 700, marginTop: 14 }}>{props.cardLabel}</div>
      </div>
      {source}
    </AbsoluteFill>
  );
};

/** data-cards: tiêu đề + các mục hiện theo lời; mục trước mờ đi khi mục sau tới. A = dòng kẻ, B = thẻ trắng, C = khối tối, mục đang đọc tô vàng. */
export const MoiDataCards: React.FC<TemplateProps<"data-cards">> = ({ props, cue }) => {
  const M = useMoi();
  const frame = useCurrentFrame();
  const starts = props.cards.map((c) => cue(c.cueKey) + c.offset);
  const head = interpolate(frame, [4, 22], [0, 1], { ...clamp, easing: out });
  return (
    <AbsoluteFill style={{ color: M.text }}>
      <div style={{ position: "absolute", top: 100, left: SIDE, right: SIDE, opacity: head }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: M.kind === "bantin" ? M.accent : M.muted }}>{props.kicker}</div>
        <div style={{ fontFamily: display, fontWeight: 900, fontSize: 92, lineHeight: 1.08, marginTop: 8, color: M.kind === "khoimau" ? M.accent : M.text, textTransform: M.kind === "khoimau" ? "uppercase" : "none" }}>{props.title}</div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: M.kind === "anh" ? 0 : 26 }}>
          {props.cards.map((c, i) => {
            const p = interpolate(frame, [starts[i], starts[i] + 12], [0, 1], { ...clamp, easing: out });
            const next = starts[i + 1];
            const dim = next == null ? 1 : interpolate(frame, [next, next + 10], [1, 0.5], clamp);
            const active = dim > 0.99 && p > 0.5;
            const box: React.CSSProperties =
              M.kind === "bantin"
                ? { background: M.card, borderRadius: 24, padding: "30px 40px", boxShadow: "0 12px 30px #0b1f3a14" }
                : M.kind === "khoimau"
                  ? { background: active ? M.block : M.card, color: active ? M.onBlock : M.text, borderRadius: 26, padding: "28px 40px" }
                  : { borderTop: `2px solid ${M.muted}55`, padding: "26px 0 30px" };
            const bigColor = M.kind === "khoimau" ? (active ? M.onBlock : M.accent) : /\d/.test(c.big) ? M.accent : M.text;
            return (
              <div key={c.cueKey} style={{ ...box, opacity: p * dim, transform: `translateY(${(1 - p) * 30}px)` }}>
                <div style={{ fontSize: 32, fontWeight: 700, opacity: 0.85 }}>{c.tag}</div>
                <div style={{ fontFamily: display, fontWeight: 900, fontSize: 84, lineHeight: 1.15, color: bigColor, marginTop: 6 }}>{c.big}</div>
                <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.3, marginTop: 6, opacity: 0.9 }}>{c.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** project-close: ảnh dự án phía trên, tên dự án, thông điệp gõ dần, tên + QR. */
export const MoiProjectClose: React.FC<TemplateProps<"project-close">> = ({ props, frames }) => {
  const duAn = useDuAn();
  const [ten1, ten2] = tachTen(duAn.ten);
  const M = useMoi();
  const w = useWatermark();
  const frame = useCurrentFrame();
  const qr = w?.kieu === "qr" && !!w.ten && !!w.link;
  const message = props.message;
  const chars = Math.floor(interpolate(frame, [LEAD + 30, frames - 40], [0, message.length], clamp));
  const inner = M.kind === "khoimau" ? M.onBlock : M.text;
  return (
    <AbsoluteFill style={{ color: inner }}>
      {M.kind === "khoimau" ? <div style={{ position: "absolute", top: 760, left: 0, right: 0, bottom: 0, background: M.block }} /> : null}
      {props.image ? (
        M.kind === "bantin" ? (
          <div style={{ position: "absolute", top: 90, left: SIDE, right: SIDE, height: 640, borderRadius: 28, overflow: "hidden", boxShadow: "0 18px 40px #0b1f3a26" }}>
            <Img src={staticFile(props.image.file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", left: 24, bottom: 16, fontSize: 24, fontWeight: 600, color: "#fff", textShadow: "0 2px 8px #000" }}>{props.image.label}</div>
          </div>
        ) : (
          <PhotoBg file={props.image.file} label={props.image.label} frames={frames} height={M.kind === "khoimau" ? 760 : 1000} fadeFrom={M.kind === "khoimau" ? "70%" : "40%"} />
        )
      ) : null}
      <div style={{ position: "absolute", top: M.kind === "bantin" ? 790 : 800, left: SIDE, right: SIDE }}>
        <div style={{ fontFamily: display, fontWeight: 900, fontSize: 100, lineHeight: 1, color: M.kind === "anh" ? M.text : inner }}>
          {ten1} <span style={{ color: M.kind === "khoimau" ? inner : M.accent }}>{ten2}</span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, marginTop: 12, opacity: 0.85 }}>{duAn.diaChi}</div>
        <div style={{ marginTop: 26, minHeight: 150, fontSize: 42, fontWeight: 700, lineHeight: 1.3 }}>
          {message.slice(0, chars)}
          <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
        </div>
      </div>
      {qr ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 130, display: "flex", justifyContent: "center", opacity: interpolate(frame, [LEAD + 20, LEAD + 35], [0, 1], clamp) }}>
          <NameQr ten={w!.ten!} link={w!.link!} />
        </div>
      ) : null}
      {props.ghiChu ? <div style={{ position: "absolute", bottom: 58, left: 0, right: 0, textAlign: "center", fontSize: 26, opacity: 0.7 }}>{props.ghiChu}</div> : null}
    </AbsoluteFill>
  );
};
