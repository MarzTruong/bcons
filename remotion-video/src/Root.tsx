import { Composition } from "remotion";
import { BconsVideo } from "./BconsVideo";
import { TOTAL_FRAMES } from "./timing";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BconsCentralPark"
      component={BconsVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
