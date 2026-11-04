import React from "react";
import type { CSSProperties } from "react";
import type { MotionName } from "./spec";

export type EnterKind = "classic" | "slide" | "pop" | "blur";
export type TransitionKind = "fade" | "slide" | "zoom" | "wipe";
export type BackgroundKind = "grid" | "lines" | "dots" | "aurora";
export type Dir = "up" | "right" | "scale";

export type MotionDef = {
  enter: EnterKind;
  /** Kiểu chuyển cảnh, xoay vòng theo thứ tự cảnh để mỗi cảnh một kiểu. */
  transitions: TransitionKind[];
  background: BackgroundKind;
};

export const MOTIONS: Record<MotionName, MotionDef> = {
  // Bản gốc: hiện mờ dần, lưới nền chạy chậm.
  classic: { enter: "classic", transitions: ["fade"], background: "grid" },
  // Trượt: chữ và thẻ trượt ngang, chuyển cảnh trượt/quét, nền đường chéo.
  truot: {
    enter: "slide",
    transitions: ["slide", "wipe"],
    background: "lines",
  },
  // Nảy: phóng to có xoay nhẹ, chuyển cảnh zoom/trượt, nền chấm trôi.
  nay: {
    enter: "pop",
    transitions: ["zoom", "slide", "zoom", "wipe"],
    background: "dots",
  },
  // Mờ điện ảnh: từ nhòe sang rõ, chuyển cảnh mờ/zoom, nền cực quang.
  mo: { enter: "blur", transitions: ["fade", "zoom"], background: "aurora" },
};

/** Hiệu ứng xuất hiện của một phần tử theo tiến độ p (0 đến 1, spring có thể vượt 1). dist = quãng di chuyển (px). */
export function enterStyle(
  kind: EnterKind,
  p: number,
  dir: Dir,
  dist: number,
): CSSProperties {
  if (kind === "classic") {
    if (dir === "up")
      return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
    if (dir === "right")
      return { opacity: p, transform: `translateX(${(1 - p) * dist}px)` };
    return { opacity: p, transform: `scale(${0.8 + 0.2 * p})` };
  }
  if (kind === "slide") {
    if (dir === "right")
      return { opacity: p, transform: `translateX(${(1 - p) * dist}px)` };
    const d = dir === "scale" ? 120 : dist * 1.5;
    return { opacity: p, transform: `translateX(${-(1 - p) * d}px)` };
  }
  if (kind === "pop") {
    return {
      opacity: Math.min(1, p * 1.5),
      transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -3}deg)`,
    };
  }
  // blur
  return {
    opacity: p,
    filter: `blur(${(1 - p) * 14}px)`,
    transform: `translateY(${(1 - p) * dist * 0.4}px)`,
  };
}

const T = 14; // số khung của một lượt vào/ra
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeIn = (x: number) => x * x * x;

/** Hiệu ứng chuyển cảnh trên cả cảnh (frame tương đối trong cảnh, duration = số khung của cảnh). */
export function transitionStyle(
  kind: TransitionKind,
  frame: number,
  duration: number,
): CSSProperties {
  if (kind === "fade") {
    // Y hệt công thức gốc: nội suy [0, 10, d-10, d] -> [0, 1, 1, 0].
    const o =
      frame <= 10
        ? frame / 10
        : frame >= duration - 10
          ? (duration - frame) / 10
          : 1;
    return { opacity: Math.min(1, Math.max(0, o)) };
  }
  const inP = easeOut(c01(frame / T));
  const outP = easeIn(c01((frame - (duration - T)) / T));
  if (kind === "slide") {
    return { transform: `translateX(${(1 - inP) * 100 - outP * 100}%)` };
  }
  if (kind === "zoom") {
    return {
      opacity: inP * (1 - outP),
      transform: `scale(${1 + (1 - inP) * 0.15 - outP * 0.08})`,
    };
  }
  // wipe
  return { clipPath: `inset(0 ${(1 - inP) * 100}% 0 ${outP * 100}%)` };
}

export const MotionContext = React.createContext<MotionDef>(MOTIONS.classic);
export const useMotion = (): MotionDef => React.useContext(MotionContext);

/** Trả về hàm tạo style xuất hiện theo phong cách chuyển động của video. */
export const useEnter = () => {
  const { enter } = useMotion();
  return (p: number, dir: Dir, dist: number) => enterStyle(enter, p, dir, dist);
};
