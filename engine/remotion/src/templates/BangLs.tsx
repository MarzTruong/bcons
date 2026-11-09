// Phong cách "bảng lãi suất" (style bangls, anh chọn 07/11/2026).
// Như bảng niêm yết ở quầy ngân hàng: khung bảng, các dòng kẻ, chữ số đèn trong ô lật (split-flap). Màu bảng đổi theo số video.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Oswald";
import { useTheme } from "../theme";
import { LEAD } from "../timing";
import { clamp, type TemplateProps } from "./common";
import { NameQr, useWatermark } from "../Watermark";
import { useDuAn } from "../duAn";
import { flapChar, type BangIssue } from "../issues";

const { fontFamily: led } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["vietnamese", "latin"],
});

const SIDE = 64;
const useBang = () => useTheme().issue as unknown as BangIssue;

/** Nền: khung bảng màu số báo bao quanh mặt bảng tối, dòng kẻ ngang mờ như các hàng của bảng niêm yết. */
export const BoardGround: React.FC = () => {
  const B = useBang();
  return (
    <AbsoluteFill style={{ background: B.frame }}>
      <div
        style={{
          position: "absolute",
          inset: 26,
          borderRadius: 18,
          background: B.board,
          boxShadow: "inset 0 6px 24px #0008",
          backgroundImage: `repeating-linear-gradient(180deg, transparent 0 118px, ${B.label}12 118px 120px)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Chuỗi ô lật: mỗi ký tự một ô, chữ số lật vài vòng rồi dừng; ký tự khác (dấu phẩy, %, /) in thẳng. */
const Flap: React.FC<{ text: string; start: number; size: number }> = ({ text, start, size }) => {
  const B = useBang();
  const frame = useCurrentFrame();
  const tileW = size * 0.62;
  return (
    <div style={{ display: "flex", gap: size * 0.06, alignItems: "stretch" }}>
      {[...text].map((ch, i) => {
        const shown = flapChar(ch, frame, start, i);
        const isTile = /\d/.test(ch);
        const t0 = start + 2 * i;
        const flip = isTile ? interpolate(frame, [t0, t0 + 8], [0, 1], clamp) : 1;
        if (!isTile) {
          return (
            <span key={i} style={{ fontFamily: led, fontWeight: 600, fontSize: size * 0.7, color: B.digit, alignSelf: "flex-end", opacity: frame >= t0 ? 1 : 0, lineHeight: 1.1 }}>
              {ch}
            </span>
          );
        }
        return (
          <div
            key={i}
            style={{
              position: "relative",
              width: tileW,
              height: size * 1.12,
              borderRadius: size * 0.08,
              background: B.tile,
              boxShadow: "0 4px 10px #0009, inset 0 1px 0 #ffffff14",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: led,
              fontWeight: 600,
              fontSize: size,
              lineHeight: 1,
              color: B.digit,
              textShadow: `0 0 ${size * 0.12}px ${B.digit}66`,
              transform: `perspective(600px) rotateX(${flip < 1 ? (1 - flip) * 30 : 0}deg)`,
            }}
          >
            {shown}
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 3, background: "#000c" }} />
          </div>
        );
      })}
    </div>
  );
};

/** Dòng tiêu đề bảng: chữ to màu nhãn, gạch dưới. */
const BoardHeader: React.FC<{ title: string; note?: string }> = ({ title, note }) => {
  const B = useBang();
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 76, left: SIDE, right: SIDE, color: B.label, opacity: interpolate(frame, [0, 10], [0, 1], clamp) }}>
      <div style={{ fontFamily: led, fontWeight: 700, fontSize: 80, lineHeight: 1.05, letterSpacing: 1 }}>{title}</div>
      {note ? <div style={{ fontSize: 30, fontWeight: 600, marginTop: 10, opacity: 0.75 }}>{note}</div> : null}
      <div style={{ marginTop: 20, height: 4, background: B.digit, opacity: 0.8 }} />
    </div>
  );
};

/** Lấy phần số của chuỗi đơn vị kiểu "–10,7%/năm" để lật ô; phần chữ để in. */
const splitUnit = (unit: string) => {
  const m = unit.match(/^([–-]?\s*[\d.,]+)(.*)$/);
  return m ? { num: m[1].replace(/\s/g, ""), rest: m[2] } : { num: "", rest: unit };
};

/** stat-hero kiểu bảng: tiêu đề bảng, con số chính lật trong ô, nhãn dòng ở dưới. */
export const BangStatHero: React.FC<TemplateProps<"stat-hero">> = ({ props, cue }) => {
  const B = useBang();
  const frame = useCurrentFrame();
  const cv = cue("value");
  const main = props.value.toFixed(props.decimals).replace(".", ",");
  const u = splitUnit(props.unit);
  return (
    <AbsoluteFill style={{ color: B.label }}>
      <BoardHeader title={props.titleLines.join(" ")} note={props.badge} />
      <div style={{ position: "absolute", top: 640, left: SIDE, right: SIDE }}>
        <div style={{ fontSize: 46, fontWeight: 700, opacity: interpolate(frame, [cv - 25, cv - 12], [0, 1], clamp) }}>{props.cardLabel}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 30, flexWrap: "nowrap" }}>
          {props.prefix ? <span style={{ fontFamily: led, fontWeight: 500, fontSize: 60, alignSelf: "center", opacity: frame >= cv - 20 ? 1 : 0 }}>{props.prefix}</span> : null}
          <Flap text={main} start={cv - 18} size={150} />
          {u.num ? <Flap text={u.num} start={cv - 18 + 2 * main.length} size={150} /> : null}
          <span style={{ fontFamily: led, fontWeight: 600, fontSize: 72, color: B.digit, whiteSpace: "nowrap", opacity: interpolate(frame, [cv + 6, cv + 16], [0, 1], clamp) }}>{u.rest}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** data-cards kiểu bảng: mỗi thẻ là một dòng bảng; dòng có số thì lật ô, dòng chữ thì in chữ đèn. */
export const BangDataCards: React.FC<TemplateProps<"data-cards">> = ({ props, cue }) => {
  const B = useBang();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ color: B.label }}>
      <BoardHeader title={props.title} note={props.kicker} />
      <div style={{ position: "absolute", top: 380, left: SIDE, right: SIDE, display: "flex", flexDirection: "column", gap: 36 }}>
        {props.cards.map((c) => {
          const s = cue(c.cueKey) + c.offset;
          const o = interpolate(frame, [s - 4, s + 6], [0, 1], clamp);
          const short = c.big.length <= 12 && /\d/.test(c.big);
          return (
            <div key={c.cueKey} style={{ opacity: o, paddingBottom: 24, borderBottom: `2px solid ${B.label}33` }}>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{c.tag}</div>
              <div style={{ marginTop: 12 }}>
                {short ? (
                  <Flap text={c.big} start={s} size={96} />
                ) : (
                  <div style={{ fontFamily: led, fontWeight: 600, fontSize: 92, lineHeight: 1.05, color: B.digit, textShadow: `0 0 12px ${B.digit}55` }}>{c.big}</div>
                )}
              </div>
              <div style={{ fontSize: 36, fontWeight: 500, marginTop: 12, opacity: 0.85 }}>{c.sub}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** project-close kiểu bảng: ảnh phối cảnh trong khung bảng, dòng số nổi bật lấy từ thông điệp (vd. 6,9%/năm) lật ô, thông điệp gõ dần, tên + QR. */
export const BangProjectClose: React.FC<TemplateProps<"project-close">> = ({ props, frames }) => {
  const duAn = useDuAn();
  const B = useBang();
  const w = useWatermark();
  const frame = useCurrentFrame();
  const qr = w?.kieu === "qr" && !!w.ten && !!w.link;
  const message = props.message;
  const chars = Math.floor(interpolate(frame, [LEAD + 30, frames - 40], [0, message.length], clamp));
  const so = message.match(/\d+(?:,\d+)?%/)?.[0];
  return (
    <AbsoluteFill style={{ color: B.label }}>
      {props.image ? (
        <div style={{ position: "absolute", top: 70, left: SIDE, right: SIDE, height: 560, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 30px #000a", opacity: interpolate(frame, [0, 14], [0, 1], clamp) }}>
          <Img src={staticFile(props.image.file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${interpolate(frame, [0, frames], [1.02, 1.1], clamp)})` }} />
          <div style={{ position: "absolute", left: 22, bottom: 16, fontSize: 24, fontWeight: 600, color: "#fff", textShadow: "0 2px 8px #000" }}>{props.image.label}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", top: props.image ? 670 : 200, left: SIDE, right: SIDE }}>
        <div style={{ fontFamily: led, fontWeight: 700, fontSize: 88, lineHeight: 1.05 }}>{duAn.ten}</div>
        <div style={{ fontSize: 32, fontWeight: 600, marginTop: 8, opacity: 0.8 }}>{duAn.diaChi}</div>
        {so ? (
          <div style={{ marginTop: 30 }}>
            <Flap text={so} start={LEAD + 10} size={140} />
          </div>
        ) : null}
        <div style={{ marginTop: 26, minHeight: 150, fontSize: 40, fontWeight: 700, lineHeight: 1.3 }}>
          {message.slice(0, chars)}
          <span style={{ color: B.digit, opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
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
