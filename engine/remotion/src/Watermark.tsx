import React, { createContext, useContext, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import QRCode from "qrcode";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { useTheme } from "./theme";

/** Font riêng cho tên (khác font nội dung), có dấu tiếng Việt. */
export const { fontFamily: nameFont } = loadFont("italic", { weights: ["700"], subsets: ["vietnamese", "latin"] });

/**
 * Watermark chống lấy clip.
 * - "qr" (đang dùng, anh duyệt 06/11/2026): tên + mã QR nhỏ góc dưới phải; QR mở landing (utm_source=qr).
 *   Cảnh cuối thay bằng khối tên + QR ở giữa (ProjectClose), góc dưới ẩn đi.
 * - "troi": nhãn mờ đổi trái/phải mỗi ~4 giây ở dải trên cùng.
 * - "luoi": chữ chéo lặp mờ phủ cả khung.
 */
export type WatermarkConfig = {
  kieu: "troi" | "luoi" | "qr";
  text?: string;
  ten?: string;
  /** Kiểu qr: link QR mở. Kiểu khác: link hiện ở cảnh cuối. */
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

/** Ma trận QR (true = ô đen). Mức sửa lỗi L: ít ô nhất (25x25 với link viết hoa) để QR nhỏ ở góc vẫn quét được. */
export const qrMatrix = (text: string): boolean[][] => {
  const q = QRCode.create(text, { errorCorrectionLevel: "L" });
  const n = q.modules.size;
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => !!q.modules.get(r, c)));
};

/** QR vẽ bằng SVG, nền trắng, viền trắng 2 ô (cần cho máy quét). */
export const QrCode: React.FC<{ text: string; size: number }> = ({ text, size }) => {
  const m = useMemo(() => qrMatrix(text), [text]);
  const n = m.length + 4;
  let d = "";
  m.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${c + 2} ${r + 2}h1v1h-1z`; }));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" style={{ display: "block", borderRadius: size * 0.06 }}>
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#111" />
    </svg>
  );
};

/** Khối tên + QR. small = góc màn hình suốt video; còn lại = cảnh cuối. */
export const NameQr: React.FC<{ ten: string; link: string; small?: boolean }> = ({ ten, link, small }) => {
  const C = useTheme();
  const qr = small ? 124 : 200;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: small ? 14 : 24,
        padding: small ? "8px 8px 8px 18px" : "14px 14px 14px 30px",
        borderRadius: small ? 18 : 28,
        background: `${C.bg}cc`,
        border: `2px solid ${C.teal}88`,
      }}
    >
      <div style={{ fontFamily: nameFont, fontStyle: "italic", fontWeight: 700, fontSize: small ? 30 : 52, color: C.text, whiteSpace: "nowrap" }}>
        {ten}
      </div>
      <QrCode text={link} size={qr} />
    </div>
  );
};

export const Watermark: React.FC<{ hideFrom?: number }> = ({ hideFrom }) => {
  const w = useWatermark();
  const frame = useCurrentFrame();
  const C = useTheme();
  if (!w) return null;
  if (w.kieu === "qr") {
    if (!w.ten || !w.link || (hideFrom !== undefined && frame >= hideFrom)) return null;
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", right: 28, bottom: 34, opacity: 0.92 }}>
          <NameQr ten={w.ten} link={w.link} small />
        </div>
      </AbsoluteFill>
    );
  }
  if (!w.text) return null;
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
  if (!w?.trongThe || !w.text) return null;
  return (
    <div style={{ fontSize: 22, fontWeight: 600, color: C.muted, opacity: 0.8, marginTop: 10, letterSpacing: 1 }}>
      ⌂ {w.text}
    </div>
  );
};
