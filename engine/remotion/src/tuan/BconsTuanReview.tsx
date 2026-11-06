import React from "react";
import { AbsoluteFill } from "remotion";
import { Captions } from "./Captions";
import { Cta } from "./Cta";
import { Hook } from "./Hook";
import { Intro } from "./Intro";
import { Payment } from "./Payment";
import { RadarMap } from "./RadarMap";
import { Speaker } from "./Speaker";

/** Video dọc 9:16: jump-cut 9 phân đoạn + đồ họa chồng lớp + phụ đề. */
export const BconsTuanReview: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b1220" }}>
    <Speaker />
    <RadarMap />
    <Hook />
    <Intro />
    <Payment />
    <Cta />
    <Captions />
  </AbsoluteFill>
);
