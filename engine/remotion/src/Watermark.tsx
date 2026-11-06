import React, { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useTheme } from "./theme";

/**
 * Watermark chống lấy clip. Chỉ tên kênh (fanpage), không tên cá nhân/SĐT (quy tắc 7).
 * - "troi": nhãn mờ đổi vị trí mỗi ~4 giây (trượt êm), khó cắt khung hay che một chỗ.
 * - "luoi": chữ chéo lặp mờ phủ cả khung (khó xóa nhất, hơi rối mắt).
 */
export type WatermarkConfig = {
  text: string;
  kieu: "troi" | "luoi";
  /** Link landing hiện ở cảnh cuối (không có https://). */
  link?: string;
  /** Gắn tên kênh vào thẻ số / chú thích bản đồ. */
  trongThe?: boolean;
};

export const WatermarkContext = createContext<WatermarkConfig | undefined>(undefined);
export const useWatermark = () => useContext(WatermarkContext);

/** Dải trên cùng (trên tiêu đề mọi mẫu cảnh), đổi trái/phải. Dải giữa bị thẻ số/bản đồ chiếm. */
const SPOTS = [
  { x: 60, y: 36 },
  { x: 560, y: 36 },
];
const HOLD = 120; // 4 giây mỗi chỗ
const FADE = 10; // mờ đi rồi hiện ở chỗ mới, không trượt ngang qua nội dung

/** Vị trí và độ hiện (0..1) của nhãn ở khung `frame`. */
export const spotAt = (frame: number) => {
  const i = Math.floor(frame / HOLD);
  const local = frame - i * HOLD;
  const { x, y } = SPOTS[i % SPOTS.length];
  const fadeIn = i === 0 ? 1 : Math.min(1, local / FADE);
  const fadeOut = Math.min(1, (HOLD - local) / FADE);
  return { x, y, show: Math.max(0, Math.min(fadeIn, fadeOut)) };
};

const Badge: React.FC<{ text: string }> = ({ text }) => {
  const C = useTheme();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 22px",
        borderRadius: 40,
        border: `2px solid ${C.text}`,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 1,
        color: C.text,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 26 }}>⌂</span>
      {text}
    </div>
  );
};

export const Watermark: React.FC = () => {
  const w = useWatermark();
  const frame = useCurrentFrame();
  const C = useTheme();
  if (!w) return null;
  if (w.kieu === "luoi") {
    const rows = Array.from({ length: 9 });
    return (
      <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", opacity: 0.08 }}>
        <div style={{ position: "absolute", left: -400, top: -300, width: 1900, transform: "rotate(-28deg)" }}>
          {rows.map((_, r) => (
            <div
              key={r}
              style={{
                whiteSpace: "nowrap",
                fontSize: 52,
                fontWeight: 800,
                color: C.text,
                lineHeight: "300px",
                marginLeft: (r % 2) * 260 - ((frame * 0.6) % 520),
              }}
            >
              {Array.from({ length: 6 }).map(() => `${w.text}     `).join("")}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    );
  }
  const { x, y, show } = spotAt(frame);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: x, top: y, opacity: 0.32 * show }}>
        <Badge text={w.text} />
      </div>
    </AbsoluteFill>
  );
};

/** Nhãn nhỏ đặt trong thẻ số / chú thích: cắt bỏ là mất luôn thông tin. */
export const CardTag: React.FC = () => {
  const w = useWatermark();
  const C = useTheme();
  if (!w?.trongThe) return null;
  return (
    <div style={{ fontSize: 22, fontWeight: 600, color: C.muted, opacity: 0.8, marginTop: 10, letterSpacing: 1 }}>
      ⌂ {w.text}
    </div>
  );
};
