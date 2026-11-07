// Phong cách "bìa tạp chí nhà đẹp" (style tapchi, anh chọn 07/11/2026).
// Mỗi video là một số báo với màu bìa riêng (src/issues.ts). Cảnh mở = bìa, cảnh số liệu = trang ruột, cảnh cuối = bìa sau có ảnh.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useTheme } from "../theme";
import { LEAD } from "../timing";
import { clamp, type TemplateProps } from "./common";
import { NameQr, useWatermark } from "../Watermark";
import type { TapChiIssue } from "../issues";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["vietnamese", "latin"],
});

const SIDE = 72;
const out = (t: number) => 1 - Math.pow(1 - t, 3);
const useIssue = () => useTheme().issue as unknown as TapChiIssue;

/** Nền bìa: màu số báo, hạt giấy rất nhẹ (in trên giấy, không phải màn hình phẳng). */
export const TapChiGround: React.FC = () => {
  const I = useIssue();
  return (
    <AbsoluteFill style={{ background: I.ground }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.18, mixBlendMode: "multiply" }}>
        <filter id="giay">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#giay)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Đầu báo: số báo bên trái, tên kênh bên phải, gạch đôi bên dưới. */
const Masthead: React.FC<{ color: string }> = ({ color }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 10], [0, 1], clamp);
  const so = C.so ? String(C.so).padStart(2, "0") : "";
  return (
    <div style={{ position: "absolute", top: 64, left: SIDE, right: SIDE, color, opacity: o }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 58, letterSpacing: -1 }}>{so ? `Số ${so}` : ""}</span>
      </div>
      <div style={{ marginTop: 14, borderTop: `5px solid ${color}`, borderBottom: `2px solid ${color}`, height: 6 }} />
    </div>
  );
};

/** stat-hero kiểu bìa: tiêu đề bìa xếp chồng, con số chính là dòng tít lớn, chú thích nguồn như chữ nhỏ ở chân bìa. */
export const TapChiStatHero: React.FC<TemplateProps<"stat-hero">> = ({ props, cue }) => {
  const I = useIssue();
  const frame = useCurrentFrame();
  const cv = cue("value");
  const value = interpolate(frame, [cv - 15, cv + 30], [0, props.value], { ...clamp, easing: out });
  const numIn = interpolate(frame, [cv - 22, cv - 6], [0, 1], { ...clamp, easing: out });
  // cỡ tiêu đề theo dòng dài nhất, để dòng nào cũng nằm gọn một hàng
  const longest = Math.max(...props.titleLines.map((t) => t.length));
  const titleSize = Math.min(168, Math.floor(940 / (longest * 0.6)));
  return (
    <AbsoluteFill style={{ color: I.ink }}>
      <Masthead color={I.ink} />
      <div style={{ position: "absolute", top: 210, left: SIDE - 6, right: SIDE, display: "flex", flexDirection: "column" }}>
        {props.titleLines.map((t, i) => {
          const p = interpolate(frame, [8 + 6 * i, 26 + 6 * i], [0, 1], { ...clamp, easing: out });
          return (
            <div key={t} style={{ overflow: "hidden", padding: "14px 0 4px" }}>
              <div style={{ fontFamily: display, fontWeight: 800, fontSize: titleSize, lineHeight: 0.9, letterSpacing: -4, whiteSpace: "nowrap", transform: `translateY(${(1 - p) * 110}%)` }}>
                {t}
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 56, opacity: numIn, transform: `translateY(${(1 - numIn) * 40}px)` }}>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{props.cardLabel}</div>
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "nowrap", marginTop: 4 }}>
            {props.prefix ? <span style={{ fontFamily: display, fontWeight: 700, fontSize: 80, marginRight: 18 }}>{props.prefix.toLowerCase()}</span> : null}
            <span style={{ fontFamily: display, fontWeight: 800, fontSize: 280, lineHeight: 0.9, letterSpacing: -8, color: I.hi, fontVariantNumeric: "tabular-nums" }}>
              {value.toFixed(props.decimals).replace(".", ",")}
            </span>
            <span style={{ fontFamily: display, fontWeight: 800, fontSize: 104, letterSpacing: -3, marginLeft: 6, whiteSpace: "nowrap" }}>{props.unit}</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1318, left: SIDE, right: SIDE, fontSize: 28, fontWeight: 600, opacity: 0.85 }}>{props.badge}</div>
    </AbsoluteFill>
  );
};

/** data-cards kiểu trang ruột: nền trang tối của số báo, tiêu đề bài, từng mục hiện theo lời; mục trước mờ đi khi mục sau tới. */
export const TapChiDataCards: React.FC<TemplateProps<"data-cards">> = ({ props, cue }) => {
  const I = useIssue();
  const frame = useCurrentFrame();
  const starts = props.cards.map((c) => cue(c.cueKey) + c.offset);
  const head = interpolate(frame, [4, 22], [0, 1], { ...clamp, easing: out });
  return (
    <AbsoluteFill style={{ background: I.page, color: I.pageInk }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: I.ink }} />
      <div style={{ position: "absolute", top: 92, left: SIDE, right: SIDE, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 32, fontWeight: 600, opacity: 0.8 }}>{props.kicker}</div>
      <div style={{ overflow: "hidden", paddingTop: 16, marginLeft: -4 }}>
        <div style={{ fontFamily: display, fontWeight: 800, fontSize: 104, lineHeight: 1.12, letterSpacing: -3, transform: `translateY(${(1 - head) * 100}%)` }}>
          {props.title}
        </div>
      </div>
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column" }}>
        {props.cards.map((c, i) => {
          const p = interpolate(frame, [starts[i], starts[i] + 14], [0, 1], { ...clamp, easing: out });
          const next = starts[i + 1];
          const dim = next == null ? 1 : interpolate(frame, [next, next + 12], [1, 0.6], clamp);
          const hasNum = /\d/.test(c.big);
          return (
            <div key={c.cueKey} style={{ borderTop: `3px solid ${I.pageInk}`, padding: "26px 0 34px", opacity: p * dim, transform: `translateY(${(1 - p) * 30}px)` }}>
              <div style={{ fontSize: 34, fontWeight: 600 }}>{c.tag}</div>
              <div style={{ fontFamily: display, fontWeight: 800, fontSize: hasNum ? 120 : 92, lineHeight: 1.15, letterSpacing: -3, color: hasNum ? I.hi : I.pageInk, marginTop: 14 }}>
                {c.big}
              </div>
              <div style={{ fontSize: 38, fontWeight: 500, marginTop: 10, opacity: 0.9 }}>{c.sub}</div>
            </div>
          );
        })}
      </div>
      </div>
    </AbsoluteFill>
  );
};

/** project-close kiểu bìa sau: ảnh phủ nửa trên tràn mép, dải màu số báo, tên dự án, ghi chú gõ dần, tên + QR. */
export const TapChiProjectClose: React.FC<TemplateProps<"project-close">> = ({ props, frames }) => {
  const I = useIssue();
  const w = useWatermark();
  const frame = useCurrentFrame();
  const qr = w?.kieu === "qr" && !!w.ten && !!w.link;
  const message = props.message;
  const chars = Math.floor(interpolate(frame, [LEAD + 30, frames - 40], [0, message.length], clamp));
  const reveal = interpolate(frame, [0, 24], [0, 1], { ...clamp, easing: out });
  const kb = interpolate(frame, [0, frames], [1.12, 1.02], clamp);
  return (
    <AbsoluteFill style={{ color: I.ink }}>
      {props.image ? (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 900, overflow: "hidden", clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)` }}>
          <Img src={staticFile(props.image.file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
          <div style={{ position: "absolute", left: SIDE, bottom: 24, fontSize: 26, fontWeight: 600, color: "#fff", textShadow: "0 2px 10px #0009" }}>{props.image.label}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", top: props.image ? 940 : 260, left: SIDE - 4, right: SIDE }}>
        <div style={{ fontFamily: display, fontWeight: 800, fontSize: 124, lineHeight: 0.9, letterSpacing: -4 }}>Bcons Central Park</div>
        <div style={{ fontSize: 34, fontWeight: 600, marginTop: 14, opacity: 0.9 }}>236 Phan Trung, Tam Hiệp, Biên Hòa, Đồng Nai</div>
        <div style={{ marginTop: 26, minHeight: 160, fontSize: 42, fontWeight: 700, lineHeight: 1.3 }}>
          {message.slice(0, chars)}
          <span style={{ color: I.hi, opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
        </div>
      </div>
      {qr ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 140, display: "flex", justifyContent: "center", opacity: interpolate(frame, [LEAD + 20, LEAD + 35], [0, 1], clamp) }}>
          <NameQr ten={w!.ten!} link={w!.link!} />
        </div>
      ) : null}
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontSize: 28, opacity: 0.75 }}>Thông tin mang tính tham khảo</div>
    </AbsoluteFill>
  );
};
