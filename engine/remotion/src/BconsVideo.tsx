import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { PALETTES, ThemeContext, fontFamily, useTheme } from "./theme";
import {
  MOTIONS,
  MotionContext,
  transitionStyle,
  useMotion,
  type TransitionKind,
} from "./motion";
import { Captions } from "./Captions";
import { Watermark, WatermarkContext } from "./Watermark";
import { SFX_VOLUME, musicVolume, sfxEvents } from "./amThanh";
import { LEAD, buildTiming, cueFrame, type Timestamps } from "./timing";
import type { Scene, VideoSpec } from "./spec";
import { type TemplateProps } from "./templates/common";
import { StatHero } from "./templates/StatHero";
import { RouteMap } from "./templates/RouteMap";
import { DataCards } from "./templates/DataCards";
import { CompareBars } from "./templates/CompareBars";
import { GeoMap } from "./templates/GeoMap";
import { ProjectClose } from "./templates/ProjectClose";

/** Hiệu ứng chuyển cảnh cho cả cảnh (duration tính bằng khung). "fade" = bản gốc. */
const SceneTransition: React.FC<{
  duration: number;
  kind: TransitionKind;
  children: React.ReactNode;
}> = ({ duration, kind, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={transitionStyle(kind, frame, duration)}>
      {children}
    </AbsoluteFill>
  );
};

const Background: React.FC = () => {
  const C = useTheme();
  const { background } = useMotion();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 100%)`,
      }}
    >
      {background === "grid" ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${C.grid} 2px, transparent 2px), linear-gradient(90deg, ${C.grid} 2px, transparent 2px)`,
            backgroundSize: "90px 90px",
            backgroundPosition: `0 ${(frame * 0.4) % 90}px`,
          }}
        />
      ) : null}
      {background === "lines" ? (
        <AbsoluteFill
          style={{
            backgroundImage: `repeating-linear-gradient(120deg, ${C.teal}26 0px, ${C.teal}26 3px, transparent 3px, transparent 90px)`,
            backgroundPosition: `${frame * 0.9}px 0`,
          }}
        />
      ) : null}
      {background === "dots" ? (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${C.teal}40 3px, transparent 4px)`,
            backgroundSize: "84px 84px",
            backgroundPosition: `${frame * 0.5}px ${frame * 0.8}px`,
          }}
        />
      ) : null}
      {background === "aurora" ? (
        <AbsoluteFill style={{ filter: "blur(90px)", opacity: 0.9 }}>
          <div
            style={{
              position: "absolute",
              width: 900,
              height: 900,
              borderRadius: "50%",
              left: 80 + Math.sin(frame / 70) * 160,
              top: 100 + Math.cos(frame / 90) * 220,
              background: `${C.teal}40`,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 800,
              height: 800,
              borderRadius: "50%",
              left: 360 + Math.cos(frame / 80) * 180,
              top: 900 + Math.sin(frame / 65) * 260,
              background: `${C.gold}33`,
            }}
          />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, ${C.teal}22 0%, transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** amThanh: do render-drive chuẩn bị (nhạc + hiệu ứng chép vào <du-an>/.am-thanh/). Không có = chỉ giọng đọc như cũ. */
export type BconsVideoProps = {
  spec: VideoSpec;
  timestamps: Timestamps;
  amThanh?: { nhac: string | null; sfx: string[] };
  /** Storyboard trước khi có giọng: không phát mp3 giọng (chưa có file). */
  khongGiong?: boolean;
};

const renderScene = (scene: Scene, t: TemplateProps<Scene["template"]>) => {
  switch (scene.template) {
    case "stat-hero":
      return (
        <StatHero {...(t as TemplateProps<"stat-hero">)} props={scene.props} />
      );
    case "route-map":
      return (
        <RouteMap {...(t as TemplateProps<"route-map">)} props={scene.props} />
      );
    case "data-cards":
      return (
        <DataCards
          {...(t as TemplateProps<"data-cards">)}
          props={scene.props}
        />
      );
    case "compare-bars":
      return (
        <CompareBars
          {...(t as TemplateProps<"compare-bars">)}
          props={scene.props}
        />
      );
    case "geo-map":
      return (
        <GeoMap {...(t as TemplateProps<"geo-map">)} props={scene.props} />
      );
    case "project-close":
      return (
        <ProjectClose
          {...(t as TemplateProps<"project-close">)}
          props={scene.props}
        />
      );
  }
};

export const BconsVideo: React.FC<BconsVideoProps> = ({ spec, timestamps, amThanh, khongGiong }) => {
  const timing = buildTiming(timestamps);
  const { SCENE_DATA, SCENE_STARTS } = timing;
  const sfx = amThanh?.sfx ?? [];
  const C = PALETTES[spec.style ?? "classic"];
  const motion = MOTIONS[spec.motion ?? "classic"];
  return (
    <ThemeContext.Provider value={C}>
      <MotionContext.Provider value={motion}>
      <WatermarkContext.Provider value={spec.watermark}>
        <AbsoluteFill style={{ fontFamily, color: C.text, background: C.bg }}>
          <Background />
          {spec.scenes.map((scene, i) => {
            const d = SCENE_DATA[i];
            const cue = (key: string) => {
              const text = scene.cues[key];
              if (!text)
                throw new Error(
                  `Cảnh ${i + 1} (${scene.id}) thiếu cues["${key}"]`,
                );
              return cueFrame(d, i, text);
            };
            return (
              <Sequence
                key={d.id}
                from={SCENE_STARTS[i]}
                durationInFrames={d.frames}
                premountFor={30}
              >
                <SceneTransition
                  duration={d.frames}
                  kind={motion.transitions[i % motion.transitions.length]}
                >
                  {renderScene(scene, {
                    props: scene.props,
                    cue,
                    frames: d.frames,
                  })}
                  {scene.template === "project-close" && spec.watermark?.kieu === "qr" ? null : (
                    <Captions words={d.words} nhan={scene.nhan} />
                  )}
                </SceneTransition>
                {khongGiong ? null : (
                  <Sequence from={LEAD} durationInFrames={d.audioFrames}>
                    <Audio src={staticFile(`video/${spec.name}/audio/${d.id}.mp3`)} />
                  </Sequence>
                )}
              </Sequence>
            );
          })}
          {amThanh?.nhac ? (
            <Audio src={staticFile(amThanh.nhac)} loop volume={(f: number) => musicVolume(f, timing)} />
          ) : null}
          {sfxEvents(spec, timing)
            .filter((e) => sfx.includes(e.name))
            .map((e) => (
              <Sequence key={`${e.name}-${e.frame}`} from={e.frame} durationInFrames={60}>
                <Audio src={staticFile(`.am-thanh/sfx/${e.name}.mp3`)} volume={SFX_VOLUME[e.name]} />
              </Sequence>
            ))}
          <Watermark
            hideFrom={
              spec.scenes[spec.scenes.length - 1]?.template === "project-close" ? SCENE_STARTS[SCENE_STARTS.length - 1] : undefined
            }
          />
        </AbsoluteFill>
      </WatermarkContext.Provider>
      </MotionContext.Provider>
    </ThemeContext.Provider>
  );
};
