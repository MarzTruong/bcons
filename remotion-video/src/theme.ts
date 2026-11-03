import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["vietnamese", "latin"],
});

export const C = {
  bg: "#0d0d0d",
  bg2: "#141414",
  teal: "#2dd4a0",
  gold: "#f0c040",
  red: "#ef4444",
  white: "#ffffff",
};
