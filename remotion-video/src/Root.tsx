import { Composition } from "remotion";
import { BconsVideo, type BconsVideoProps } from "./BconsVideo";
import { parseSpec } from "./spec";
import { FPS, buildTiming, type Timestamps } from "./timing";
import defaultSpec from "../specs/dong-nai-ha-tang.json";
import defaultTimestamps from "../specs/dong-nai-ha-tang.timestamps.json";

const defaultProps: BconsVideoProps = {
  spec: parseSpec(defaultSpec),
  timestamps: defaultTimestamps as Timestamps,
};

export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
