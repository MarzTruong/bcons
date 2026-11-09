import { Composition } from "remotion";
import { BconsVideo, type BconsVideoProps } from "./BconsVideo";
import { parseSpec } from "./spec";
import { FPS, buildTiming, type Timestamps } from "./timing";
import defaultSpec from "../../../du-an/bcons-central-park/video/01-dong-nai-ha-tang/spec.json";
import defaultTimestamps from "../../../du-an/bcons-central-park/video/01-dong-nai-ha-tang/timestamps.json";

import project from "../../../du-an/bcons-central-park/project.json";

const defaultProps: BconsVideoProps = {
  spec: { ...parseSpec(defaultSpec), duAn: { ten: project.ten, diaChi: project.diaChiVideo ?? project.diaChi } },
  timestamps: defaultTimestamps as Timestamps,
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
          durationInFrames: buildTiming(props.timestamps).TOTAL_FRAMES,
        })}
      />
    </>
  );
};
