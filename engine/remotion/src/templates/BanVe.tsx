// Phong cách "bản vẽ kiến trúc" (style banve, anh chọn 07/11/2026).
// Cả khung hình là một tờ bản vẽ: giấy xanh Phổ, mực trắng, một bút đỏ cho số chính.
// Số liệu hiện như kích thước ghi trên bản vẽ; ghi chú đánh số có đường dẫn; ảnh phối cảnh là một khung nhìn trên tờ bản vẽ.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { useTheme } from "../theme";
import { LEAD } from "../timing";
import { clamp, useSpring, type TemplateProps } from "./common";
import { penDraw } from "./banveGeo";
import { NameQr, useWatermark } from "../Watermark";

const { fontFamily: draft } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["vietnamese", "latin"],
});

const SIDE = 76;
const W = 1080 - SIDE * 2;

/** Nền tờ bản vẽ: lưới phụ 30 px, lưới chính 150 px, khung viền đôi. Đứng yên (bản vẽ không trôi). */
export const BlueprintSheet: React.FC = () => {
  const C = useTheme();
  const minor = "rgba(245,248,255,0.045)";
  const major = "rgba(245,248,255,0.10)";
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 35%, ${C.bg} 0%, ${C.bg2} 100%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: [
            `linear-gradient(${major} 2px, transparent 2px)`,
            `linear-gradient(90deg, ${major} 2px, transparent 2px)`,
            `linear-gradient(${minor} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${minor} 1px, transparent 1px)`,
          ].join(","),
          backgroundSize: "150px 150px, 150px 150px, 30px 30px, 30px 30px",
          backgroundPosition: "15px 15px",
        }}
      />
      <div style={{ position: "absolute", inset: 30, border: "2px solid rgba(245,248,255,0.55)" }} />
      <div style={{ position: "absolute", inset: 42, border: "1px solid rgba(245,248,255,0.28)" }} />
    </AbsoluteFill>
  );
};

/** Dải tiêu đề bản vẽ (ô ghi chú phía trên): nhãn trái, nhãn phải. Không phải "eyebrow": là ô của khung tên bản vẽ. */
const TitleStrip: React.FC<{ left: string; right?: string; delay?: number }> = ({ left, right, delay = 0 }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const o = interpolate(frame, [delay, delay + 12], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        left: SIDE,
        right: SIDE,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 30,
        paddingBottom: 16,
        borderBottom: `2px solid ${C.muted}`,
        fontFamily: draft,
        fontWeight: 600,
        fontSize: 34,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: C.muted,
        opacity: o,
      }}
    >
      <span>{left}</span>
      {right ? <span style={{ color: C.text }}>{right}</span> : null}
    </div>
  );
};

/** Đường kích thước kiểu kiến trúc: đường ngang, hai đường gióng, hai vạch chéo ở đầu; tự vẽ dần từ frame `start`. */
const DimLine: React.FC<{ width: number; start: number; color: string; dur?: number }> = ({ width, start, color, dur = 24 }) => {
  const frame = useCurrentFrame();
  const h = 70;
  const mid = 44;
  const len = width;
  const off = penDraw(frame, start, dur, len);
  const tick = penDraw(frame, start + dur * 0.6, 10, 60);
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <line x1={2} y1={0} x2={2} y2={h} stroke={color} strokeWidth={3} strokeDasharray={h} strokeDashoffset={penDraw(frame, start, 10, h)} />
      <line x1={width - 2} y1={0} x2={width - 2} y2={h} stroke={color} strokeWidth={3} strokeDasharray={h} strokeDashoffset={penDraw(frame, start + 6, 10, h)} />
      <line x1={0} y1={mid} x2={width} y2={mid} stroke={color} strokeWidth={4} strokeDasharray={len} strokeDashoffset={off} />
      {[2, width - 2].map((x) => (
        <line key={x} x1={x - 16} y1={mid + 16} x2={x + 16} y2={mid - 16} stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={60} strokeDashoffset={tick} />
      ))}
    </svg>
  );
};

const fmt = (v: number, d: number) => v.toFixed(d).replace(".", ",");

/** stat-hero kiểu bản vẽ: tiêu đề bản vẽ, con số ghi như kích thước trên một đường kích thước tự vẽ. */
export const BanVeStatHero: React.FC<TemplateProps<"stat-hero">> = ({ props, cue }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const cv = cue("value");
  const value = interpolate(frame, [cv - 15, cv + 30], [0, props.value], {
    ...clamp,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const numIn = interpolate(frame, [cv - 20, cv - 4], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <TitleStrip left={props.badge} />
      <div style={{ position: "absolute", top: 200, left: SIDE, right: SIDE }}>
        {props.titleLines.map((t, i) => {
          const p = interpolate(frame, [6 + 7 * i, 22 + 7 * i], [0, 1], clamp);
          return (
            <div
              key={t}
              style={{
                fontFamily: draft,
                fontWeight: 800,
                fontSize: 150,
                lineHeight: 1.04,
                letterSpacing: -1,
                textTransform: "uppercase",
                color: C.text,
                // chừa chỗ cho dấu tiếng Việt trên/dưới dòng (Ã, Ạ) khi cắt để "vẽ" chữ
                clipPath: `inset(-40px ${(1 - p) * 100}% -40px 0)`,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 820, left: SIDE, width: W }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 18, opacity: numIn }}>
          {props.prefix ? (
            <span style={{ fontFamily: draft, fontWeight: 600, fontSize: 70, color: C.muted }}>{props.prefix}</span>
          ) : null}
          <span style={{ fontFamily: draft, fontWeight: 800, fontSize: 290, lineHeight: 0.9, color: C.teal, fontVariantNumeric: "tabular-nums" }}>
            {fmt(value, props.decimals)}
          </span>
          <span style={{ fontFamily: draft, fontWeight: 700, fontSize: 112, lineHeight: 0.9, color: C.text }}>{props.unit}</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <DimLine width={W} start={cv - 20} color={C.text} />
        </div>
        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 44,
            fontWeight: 600,
            color: C.muted,
            opacity: interpolate(frame, [cv + 5, cv + 20], [0, 1], clamp),
          }}
        >
          {props.cardLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Một ghi chú bản vẽ: bong bóng số, chữ chính, chữ phụ, đường dẫn kẻ dưới. Không đóng hộp. */
const Note: React.FC<{ n: number; delay: number; big: string; sub: string; tag: string }> = ({ n, delay, big, sub, tag }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const p = useSpring(delay, 16);
  const hasNum = /\d/.test(big);
  const R = 46;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", gap: 34, alignItems: "flex-start", opacity: Math.min(1, p * 1.4) }}>
      <svg width={R * 2 + 6} height={R * 2 + 6} style={{ flex: "none", marginTop: 14 }}>
        <circle
          cx={R + 3}
          cy={R + 3}
          r={R}
          fill="none"
          stroke={C.text}
          strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={penDraw(frame, delay, 16, circ)}
          transform={`rotate(-90 ${R + 3} ${R + 3})`}
        />
        <text x={R + 3} y={R + 17} textAnchor="middle" fontFamily={draft} fontWeight={700} fontSize={46} fill={C.text}>
          {n}
        </text>
      </svg>
      <div style={{ flex: 1, transform: `translateX(${(1 - p) * 40}px)` }}>
        <div style={{ fontFamily: draft, fontWeight: 600, fontSize: 36, letterSpacing: 2, textTransform: "uppercase", color: C.muted }}>{tag}</div>
        <div style={{ fontFamily: draft, fontWeight: 800, fontSize: 104, lineHeight: 1, color: hasNum ? C.teal : C.text, marginTop: 4 }}>{big}</div>
        <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.3, color: C.text, marginTop: 10 }}>{sub}</div>
        <div
          style={{
            marginTop: 24,
            height: 2,
            background: C.faint,
            transformOrigin: "left",
            transform: `scaleX(${interpolate(frame, [delay + 4, delay + 22], [0, 1], clamp)})`,
          }}
        />
      </div>
    </div>
  );
};

/** data-cards kiểu bản vẽ: tiêu đề bản vẽ + các ghi chú đánh số hiện theo lời đọc. */
export const BanVeDataCards: React.FC<TemplateProps<"data-cards">> = ({ props, cue }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const t = interpolate(frame, [4, 20], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <TitleStrip left="Ghi chú" right={props.kicker} />
      <div
        style={{
          position: "absolute",
          top: 190,
          left: SIDE,
          right: SIDE,
          fontFamily: draft,
          fontWeight: 800,
          fontSize: 118,
          lineHeight: 1.08,
          textTransform: "uppercase",
          color: C.text,
          clipPath: `inset(-40px ${(1 - t) * 100}% -40px 0)`,
        }}
      >
        {props.title}
      </div>
      <div style={{ position: "absolute", top: props.title.length > 18 ? 460 : 360, left: SIDE, right: SIDE, display: "flex", flexDirection: "column", gap: 40 }}>
        {props.cards.map((c, i) => (
          <Note key={c.cueKey} n={i + 1} delay={cue(c.cueKey) + c.offset} big={c.big} sub={c.sub} tag={c.tag} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Dấu cắt ở 4 góc khung ảnh (như khung nhìn trên bản vẽ). */
const CropMarks: React.FC<{ color: string }> = ({ color }) => {
  const L = 34;
  const g = 14;
  const s = { position: "absolute" as const, background: color };
  return (
    <>
      {[
        { top: -g, left: -g - L, width: L, height: 2 },
        { top: -g - L, left: -g, width: 2, height: L },
        { top: -g, right: -g - L, width: L, height: 2 },
        { top: -g - L, right: -g, width: 2, height: L },
        { bottom: -g, left: -g - L, width: L, height: 2 },
        { bottom: -g - L, left: -g, width: 2, height: L },
        { bottom: -g, right: -g - L, width: L, height: 2 },
        { bottom: -g - L, right: -g, width: 2, height: L },
      ].map((st, i) => (
        <div key={i} style={{ ...s, ...st }} />
      ))}
    </>
  );
};

/** project-close kiểu bản vẽ: ảnh phối cảnh là khung nhìn trên tờ bản vẽ, tên dự án, ghi chú gõ dần, khối tên + QR. */
export const BanVeProjectClose: React.FC<TemplateProps<"project-close">> = ({ props, frames }) => {
  const C = useTheme();
  const w = useWatermark();
  const frame = useCurrentFrame();
  const qr = w?.kieu === "qr" && !!w.ten && !!w.link;
  const message = props.message;
  const chars = Math.floor(interpolate(frame, [LEAD + 30, frames - 40], [0, message.length], clamp));
  const reveal = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const kb = interpolate(frame, [0, frames], [1.02, 1.1], clamp);
  return (
    <AbsoluteFill>
      <TitleStrip left={props.image ? props.image.label : "Dự án"} />
      {props.image ? (
        <div style={{ position: "absolute", top: 200, left: SIDE + 20, right: SIDE + 20, height: 640 }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", border: `3px solid ${C.text}`, clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)` }}>
            <Img src={staticFile(props.image.file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
          </div>
          <CropMarks color={C.text} />
        </div>
      ) : null}
      <div style={{ position: "absolute", top: props.image ? 890 : 300, left: SIDE, right: SIDE }}>
        <div style={{ fontFamily: draft, fontWeight: 800, fontSize: 132, lineHeight: 0.95, textTransform: "uppercase", color: C.text }}>
          Bcons
          <br />
          <span style={{ color: C.teal }}>Central Park</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 36, fontWeight: 600, color: C.muted }}>236 Phan Trung, Tam Hiệp, Biên Hòa, Đồng Nai</div>
        <div style={{ marginTop: 26, height: 2, background: C.faint }} />
        <div style={{ marginTop: 26, minHeight: 170, fontSize: 44, fontWeight: 700, lineHeight: 1.3, color: C.text }}>
          {message.slice(0, chars)}
          <span style={{ color: C.teal, opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
        </div>
      </div>
      {qr ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 150,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [LEAD + 20, LEAD + 35], [0, 1], clamp),
          }}
        >
          <NameQr ten={w!.ten!} link={w!.link!} />
        </div>
      ) : null}
      <div style={{ position: "absolute", bottom: 66, left: 0, right: 0, textAlign: "center", fontSize: 28, color: C.faint }}>
        Thông tin mang tính tham khảo
      </div>
    </AbsoluteFill>
  );
};
