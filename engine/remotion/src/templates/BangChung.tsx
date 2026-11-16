import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { fontFamily } from "../theme";
import type { TemplateProps } from "./common";
import type { SceneOf } from "../spec";

// Cảnh "minh chứng" (thiết kế AGY, anh chọn 16/11/2026): nền ảnh hiện trạng mờ, popup ảnh chụp bài báo/thông báo bật lên,
// thu ra, ảnh rõ nét (hoặc biểu đồ giá). Hai kiểu: "toi" (phương án 1) và "sang" (phương án 2); màu cố định, không đổi theo `style`.
// Vị trí đã dời lên so với bản HTML của AGY để không đè vùng phụ đề (từ y = 1400).

type Props = SceneOf<"bang-chung">["props"];
type Cot = NonNullable<Props["bieuDo"]>["cot"][number];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, from: number, frames: number) =>
  interpolate(frame, [from, from + frames], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

/** Trục biểu đồ: từ 0 đến mốc tròn phía trên giá trị lớn nhất cộng một bậc. */
export const chartAxis = (cot: Cot[]) => {
  const vals = cot.flatMap((c) => [c.den, c.giaTri, c.tu].filter((v): v is number => typeof v === "number"));
  const max = Math.max(...vals, 1);
  const step = max >= 40 ? 20 : 10;
  const top = Math.ceil(max / 10) * 10 + 10;
  const lines: number[] = [];
  for (let v = 0; v <= top; v += step) lines.push(v);
  return { top, lines };
};

const Chart: React.FC<{ p: Props; sang: boolean; progress: number; gridH: number; style: React.CSSProperties }> = ({ p, sang, progress, gridH, style }) => {
  const bd = p.bieuDo!;
  const { top, lines } = chartAxis(bd.cot);
  const ink = sang ? "#0b1f3a" : "#ffffff";
  const muted = sang ? "#4b5e75" : "#a4b8cc";
  const bandColor = sang ? "#0c6a6c" : "#7ee0c3";
  const barColor = sang ? "#e8562a" : "#ffe14d";
  return (
    <div
      style={{
        position: "absolute",
        left: 68,
        right: 130,
        background: sang ? "#ffffff" : "rgba(6,18,31,0.94)",
        border: sang ? "1px solid #d5deea" : undefined,
        borderTop: `8px solid ${sang ? "#e8562a" : "#ffe14d"}`,
        borderRadius: 6,
        padding: "24px 30px 20px",
        boxShadow: sang ? "0 18px 42px rgba(11,31,58,0.14)" : "0 22px 50px rgba(0,0,0,0.5)",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 24}px)`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: ink }}>{bd.tieuDe}</div>
        <div style={{ fontSize: 23, fontWeight: 800, color: sang ? "#0c6a6c" : "#7ee0c3" }}>{bd.donVi}</div>
      </div>
      <div style={{ position: "relative", height: gridH, borderBottom: `3px solid ${sang ? "#0b1f3a" : "rgba(255,255,255,0.28)"}`, display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "0 36px", marginBottom: 12 }}>
        {lines.map((v) => (
          <div key={v} style={{ position: "absolute", left: 0, right: 0, bottom: `${(v / top) * 100}%`, borderTop: `1px dashed ${sang ? "#d3dce7" : "rgba(255,255,255,0.14)"}` }}>
            <span style={{ position: "absolute", left: 0, top: v === 0 ? -24 : -13, fontSize: 19, fontWeight: 700, color: sang ? "#6b7d93" : "rgba(255,255,255,0.45)" }}>{v}</span>
          </div>
        ))}
        {bd.cot.map((c) => {
          const isBand = typeof c.tu === "number" && typeof c.den === "number";
          const hi = (isBand ? c.den! : c.giaTri ?? 0) / top;
          const lo = isBand ? c.tu! / top : 0;
          return (
            <div key={c.nhan} style={{ position: "relative", width: 220, height: "100%", zIndex: 2 }}>
              {isBand ? (
                <div style={{ position: "absolute", bottom: 0, left: 62, width: 96, height: gridH * hi * progress, background: sang ? "rgba(12,106,108,0.12)" : "rgba(126,224,195,0.16)", borderLeft: `2px dashed ${sang ? "rgba(12,106,108,0.45)" : "rgba(126,224,195,0.45)"}`, borderRight: `2px dashed ${sang ? "rgba(12,106,108,0.45)" : "rgba(126,224,195,0.45)"}` }} />
              ) : null}
              <div style={{ position: "absolute", left: 54, width: 112, bottom: gridH * lo * progress, height: Math.max(isBand ? 16 : 0, gridH * (hi - lo) * progress), background: isBand ? bandColor : barColor, borderRadius: isBand ? 4 : "4px 4px 0 0" }} />
              <div style={{ position: "absolute", left: 0, width: 220, textAlign: "center", bottom: gridH * hi * progress + 12, fontSize: 31, fontWeight: 900, color: isBand ? bandColor : barColor, fontVariantNumeric: "tabular-nums" }}>
                {isBand ? `${c.tu}–${c.den}` : c.giaTri}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", padding: "0 36px", marginBottom: 14 }}>
        {bd.cot.map((c) => (
          <div key={c.nhan} style={{ width: 220, textAlign: "center", fontSize: 26, fontWeight: 800, color: sang ? "#0b1f3a" : "#e6eff7" }}>
            {c.nhan}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: muted, borderTop: `1px solid ${sang ? "#e3e8f0" : "rgba(255,255,255,0.14)"}`, paddingTop: 10 }}>Nguồn: {bd.nguon}</div>
    </div>
  );
};

export const BangChung: React.FC<TemplateProps<"bang-chung">> = ({ props, cue, frames }) => {
  const frame = useCurrentFrame();
  const sang = props.kieu === "sang";
  const popAt = cue(props.popupCue) + (props.popupOffset ?? 0);
  let rangAt = cue(props.rangCue) + (props.rangOffset ?? 0);
  if (rangAt < popAt + 45) rangAt = Math.min(frames - 20, popAt + 90);
  const popIn = ease(frame, popAt, 14);
  const popOut = ease(frame, rangAt - 6, 14);
  const clearP = ease(frame, rangAt, 17);
  const hasChart = !!props.bieuDo;
  const popAlpha = Math.max(0, popIn - popOut);
  const baseFont = fontFamily;

  const sourceText = `Nguồn: ${props.popup.nguon} · ${props.popup.ngay}`;
  const imgSrc = staticFile(props.anhNen.file);
  const popSrc = staticFile(props.popup.file);

  if (!sang) {
    const blur = 15 * (1 - clearP);
    const scrimA = 0.68 - clearP * (hasChart ? 0.16 : 0.42);
    const topA = Math.max(0.76, scrimA + 0.18);
    return (
      <AbsoluteFill style={{ background: "#06121f", fontFamily: baseFont, overflow: "hidden" }}>
        <Img src={imgSrc} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%", filter: `blur(${blur}px)`, transform: `scale(${1.07 - 0.05 * clearP})` }} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(6,18,31,${topA.toFixed(2)}) 0%, rgba(6,18,31,${Math.max(0.45, scrimA + 0.08).toFixed(2)}) 26%, rgba(6,18,31,${(scrimA * 0.62).toFixed(2)}) 52%, rgba(6,18,31,${(scrimA + 0.26).toFixed(2)}) 100%)` }} />
        <div style={{ position: "absolute", top: 256, left: 68, right: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 20 }}>
          <div style={{ background: "rgba(6,18,31,0.9)", color: "#ffe14d", borderLeft: "6px solid #ffe14d", padding: "10px 16px", fontSize: 22, fontWeight: 800, borderRadius: "0 4px 4px 0", whiteSpace: "nowrap" }}>{sourceText}</div>
          <div style={{ background: "rgba(6,18,31,0.86)", color: "#f3f5f8", padding: "10px 16px", fontSize: 22, fontWeight: 700, borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>{props.anhNen.nhan}</div>
        </div>
        <div style={{ position: "absolute", top: 332, left: 68, right: 120, borderLeft: "10px solid #7ee0c3", paddingLeft: 24, zIndex: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#7ee0c3", marginBottom: 6, textShadow: "0 2px 10px rgba(0,0,0,0.75)" }}>{props.kicker}</div>
          <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.1, color: "#ffffff", textShadow: "0 3px 16px rgba(0,0,0,0.85)" }}>{props.title}</div>
        </div>
        <div style={{ position: "absolute", left: 68, right: 68, top: 520, background: "#ffffff", borderRadius: 8, boxShadow: "0 28px 64px rgba(0,0,0,0.56)", overflow: "hidden", zIndex: 30, opacity: popAlpha, transform: `translateY(${34 * (1 - popIn) - 70 * popOut}px) scale(${0.9 + 0.1 * popIn - 0.16 * popOut})` }}>
          <div style={{ background: "#0b2239", color: "#fff", padding: "18px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "5px solid #ffe14d" }}>
            <div style={{ fontSize: 30, fontWeight: 900 }}>{props.popup.nguon}</div>
            <div style={{ background: "#ffe14d", color: "#06121f", padding: "6px 14px", fontSize: 24, fontWeight: 900, borderRadius: 4 }}>{props.popup.ngay}</div>
          </div>
          <div style={{ padding: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Img src={popSrc} style={{ maxWidth: "100%", maxHeight: 760, width: "auto", height: "auto", display: "block" }} />
          </div>
        </div>
        {!hasChart && props.anhNen.chuThichRo ? (
          <div style={{ position: "absolute", bottom: 600, left: 68, right: 160, background: "rgba(6,18,31,0.88)", borderLeft: "10px solid #ffe14d", padding: "22px 28px", borderRadius: "0 6px 6px 0", zIndex: 28, opacity: clearP, transform: `translateY(${(1 - clearP) * 18}px)` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#ffe14d", marginBottom: 6 }}>{props.anhNen.nhan}</div>
            <div style={{ fontSize: 33, fontWeight: 800, lineHeight: 1.28, color: "#fff" }}>{props.anhNen.chuThichRo}</div>
          </div>
        ) : null}
        {hasChart ? <Chart p={props} sang={false} progress={clearP} gridH={320} style={{ bottom: 560 }} /> : null}
      </AbsoluteFill>
    );
  }

  // Kiểu "sang": nền sáng, băng tiêu đề biên tập, khung ảnh lớn, thẻ bằng chứng trượt từ cạnh phải.
  const stageH = hasChart ? 760 - clearP * 380 : 760;
  const tx = 1100 * (1 - popIn) + 1100 * popOut;
  return (
    <AbsoluteFill style={{ background: "#f3f5f8", fontFamily: baseFont, color: "#0b1f3a", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 16, background: "#0b1f3a", zIndex: 30 }} />
      <div style={{ position: "absolute", top: 252, left: 68, right: 68, background: "#fff", borderTop: "6px solid #0b1f3a", padding: "20px 26px 22px", boxShadow: "0 10px 26px rgba(11,31,58,0.08)", zIndex: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid #dde4ee", marginBottom: 14 }}>
          <div style={{ fontSize: 23, fontWeight: 800, color: "#e8562a" }}>{sourceText}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#364c66" }}>{props.anhNen.nhan}</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0c6a6c", marginBottom: 4 }}>{props.kicker}</div>
        <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1 }}>{props.title}</div>
      </div>
      <div style={{ position: "absolute", top: 492, left: 68, right: 68, height: stageH, borderRadius: 6, overflow: "hidden", background: "#0b1f3a", boxShadow: "0 16px 38px rgba(11,31,58,0.14)", zIndex: 10 }}>
        <Img src={imgSrc} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 48%", filter: `blur(${12 * (1 - clearP)}px)` }} />
        <div style={{ position: "absolute", top: 18, right: 18, background: "rgba(11,31,58,0.88)", color: "#fff", fontSize: 22, fontWeight: 700, padding: "8px 14px", borderRadius: 4 }}>{props.anhNen.nhan}</div>
      </div>
      <div style={{ position: "absolute", top: 520, left: 68, right: 68, background: "#fff", borderLeft: "12px solid #e8562a", borderRadius: "0 8px 8px 0", boxShadow: "0 26px 56px rgba(11,31,58,0.28)", overflow: "hidden", zIndex: 28, opacity: popAlpha, transform: `translateX(${tx}px)` }}>
        <div style={{ background: "#f3f5f8", padding: "18px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #dde4ee" }}>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{props.popup.nguon}</div>
          <div style={{ background: "#e8562a", color: "#fff", padding: "6px 14px", fontSize: 23, fontWeight: 800, borderRadius: 4 }}>{props.popup.ngay}</div>
        </div>
        <div style={{ padding: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={popSrc} style={{ maxWidth: "100%", maxHeight: 700, width: "auto", height: "auto", display: "block" }} />
        </div>
      </div>
      {!hasChart && props.anhNen.chuThichRo ? (
        <div style={{ position: "absolute", top: 1272, left: 68, right: 160, background: "#fff", borderLeft: "10px solid #e8562a", padding: "20px 26px", borderRadius: "0 6px 6px 0", boxShadow: "0 10px 26px rgba(11,31,58,0.1)", zIndex: 26, opacity: clearP, transform: `translateY(${(1 - clearP) * 16}px)` }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#e8562a", marginBottom: 4 }}>{`${props.popup.nguon} (${props.popup.ngay}) · ${props.anhNen.nhan}`}</div>
          <div style={{ fontSize: 31, fontWeight: 800, lineHeight: 1.28 }}>{props.anhNen.chuThichRo}</div>
        </div>
      ) : null}
      {hasChart ? <Chart p={props} sang progress={clearP} gridH={240} style={{ top: 892 }} /> : null}
    </AbsoluteFill>
  );
};
