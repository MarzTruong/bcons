import { Composition } from "remotion";
import { BconsVideo, type BconsVideoProps } from "./BconsVideo";
import { parseSpec } from "./spec";
import { FPS, buildTiming, type Timestamps } from "./timing";
import { NGUON_CUOI_FRAMES } from "./moDau";
import { BiaCover } from "./HookOpen";
import type { Bia } from "./bia";
import defaultSpec from "../../../du-an/bcons-central-park/video/01-dong-nai-ha-tang/spec.json";
import defaultTimestamps from "../../../du-an/bcons-central-park/video/01-dong-nai-ha-tang/timestamps.json";

import project from "../../../du-an/bcons-central-park/project.json";

const defaultProps: BconsVideoProps = {
  spec: { ...parseSpec(defaultSpec), duAn: { ten: project.ten, diaChi: project.diaChiVideo ?? project.diaChi } },
  timestamps: defaultTimestamps as Timestamps,
};

const defaultBia: Bia = {
  tieuDe: ["Mặt tiền", "Quốc lộ 13"],
  diemNhan: "8",
  ghiChuNhan: "làn xe",
  chuDe: "ha-tang",
  anhNen: "assets/images/phoi-canh-green-park.jpg",
  nhanAnh: "Phối cảnh minh họa",
  duAn: "bcons-central-park",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BconsCentralPark"
        component={BconsVideo}
        defaultProps={defaultProps}
        durationInFrames={buildTiming(defaultProps.timestamps).TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        calculateMetadata={({ props }) => ({
          durationInFrames: buildTiming(props.timestamps, props.spec.nguonCuoi ? NGUON_CUOI_FRAMES : 0).TOTAL_FRAMES,
        })}
      />
      <Composition
        id="BiaVideo"
        component={BiaCover}
        defaultProps={{ bia: defaultBia, tenDuAn: project.ten }}
        durationInFrames={1}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
