import { Composition } from "remotion";
import { HeroMark } from "./HeroMark";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HeroMark"
      component={HeroMark}
      durationInFrames={135}
      fps={30}
      width={1500}
      height={1100}
    />
  );
};
