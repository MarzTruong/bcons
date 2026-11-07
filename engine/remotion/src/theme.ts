import React from "react";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import type { StyleName } from "./spec";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["vietnamese", "latin"],
});

/** Bảng màu của một phong cách. teal/gold = hai màu nhấn chính, text = màu chữ, neutral = điểm "trắng" trên bản đồ. */
export type Palette = {
  bg: string;
  bg2: string;
  teal: string;
  gold: string;
  red: string;
  text: string;
  neutral: string;
  muted: string;
  faint: string;
  dim: string;
  onAccent: string;
  grid: string;
  stroke: string;
  scrim: string;
  bars: [string, string, string, string];
  /** Phong cách bản vẽ kiến trúc: mẫu cảnh vẽ theo ngôn ngữ bản vẽ (templates/BanVe.tsx). */
  banve?: true;
};

export const PALETTES: Record<StyleName, Palette> = {
  // Bản gốc: giữ y hệt các video đã làm.
  classic: {
    bg: "#0d0d0d",
    bg2: "#141414",
    teal: "#2dd4a0",
    gold: "#f0c040",
    red: "#ef4444",
    text: "#ffffff",
    neutral: "#ffffff",
    muted: "#ffffffb0",
    faint: "#ffffff80",
    dim: "#ffffff99",
    onAccent: "#0d0d0d",
    grid: "rgba(255,255,255,0.035)",
    stroke: "#000000",
    scrim: "#000000",
    bars: ["#2dd4a0", "#f0c040", "#f97316", "#60a5fa"],
  },
  // Sáng, kiểu báo chí: nền kem, chữ xanh than, nhấn xanh lục đậm và cam đất.
  sang: {
    bg: "#f5f1e8",
    bg2: "#ffffff",
    teal: "#0f766e",
    gold: "#b45309",
    red: "#dc2626",
    text: "#14213d",
    neutral: "#14213d",
    muted: "#14213dcc",
    faint: "#14213d99",
    dim: "#14213d99",
    onAccent: "#ffffff",
    grid: "rgba(20,33,61,0.05)",
    stroke: "#ffffff",
    scrim: "#f5f1e8",
    bars: ["#0f766e", "#b45309", "#c2410c", "#1d4ed8"],
  },
  // Navy và vàng: sang trọng, hợp bất động sản cao cấp.
  navy: {
    bg: "#0a1628",
    bg2: "#12233d",
    teal: "#d4af37",
    gold: "#7dd3fc",
    red: "#f87171",
    text: "#ffffff",
    neutral: "#ffffff",
    muted: "#ffffffb0",
    faint: "#ffffff80",
    dim: "#ffffff99",
    onAccent: "#0a1628",
    grid: "rgba(212,175,55,0.05)",
    stroke: "#04101f",
    scrim: "#0a1628",
    bars: ["#d4af37", "#7dd3fc", "#f87171", "#a78bfa"],
  },
  // Xanh lá đậm và kem: hợp "Central Park", chuẩn sống xanh.
  xanh: {
    bg: "#0f2a20",
    bg2: "#16382b",
    teal: "#7bd389",
    gold: "#f2d28b",
    red: "#f08a5d",
    text: "#fdf8ec",
    neutral: "#fdf8ec",
    muted: "#fdf8ecb0",
    faint: "#fdf8ec80",
    dim: "#fdf8ec99",
    onAccent: "#0f2a20",
    grid: "rgba(253,248,236,0.04)",
    stroke: "#07160f",
    scrim: "#0f2a20",
    bars: ["#7bd389", "#f2d28b", "#f08a5d", "#9cc9e8"],
  },
  // Bản vẽ kiến trúc (anh chọn 07/11/2026): giấy cyanotype xanh Phổ, mực trắng, một bút đỏ cho số chính.
  banve: {
    bg: "#16408f",
    bg2: "#123679",
    teal: "#ff8a6b",
    gold: "#ffd9cc",
    red: "#ff8a6b",
    text: "#f5f8ff",
    neutral: "#f5f8ff",
    muted: "#dce6fbd9",
    faint: "#dce6fb99",
    dim: "#dce6fbb3",
    onAccent: "#16408f",
    grid: "rgba(245,248,255,0.07)",
    stroke: "#0b2457",
    scrim: "#123679",
    bars: ["#ff8a6b", "#f5f8ff", "#9fc0ff", "#ffd9cc"],
    banve: true,
  },
};

export const ThemeContext = React.createContext<Palette>(PALETTES.classic);
export const useTheme = (): Palette => React.useContext(ThemeContext);
