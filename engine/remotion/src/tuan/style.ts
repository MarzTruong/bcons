import type { CSSProperties } from "react";
import { fontFamily } from "../theme";

export const T = {
  teal: "#2dd4a0",
  gold: "#f0c040",
  red: "#e11d48",
  white: "#ffffff",
  navy: "rgba(15, 23, 42, 0.85)",
  muted: "#cbd5e1",
};

export const font = fontFamily;

/** Thẻ kính mờ dùng cho mọi panel. */
export const glass: CSSProperties = {
  background: T.navy,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: 24,
  border: "2px solid rgba(255,255,255,0.14)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  fontFamily: font,
  color: T.white,
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Vùng đặt panel: dưới cằm người nói, trên dải phụ đề. */
export const PANEL_TOP = 1150;
export const PANEL_H = 300;
