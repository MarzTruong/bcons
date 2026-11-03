import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import * as turf from "@turf/turf";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { C, fontFamily } from "./theme";

/**
 * Cảnh bản đồ vệ tinh (MapLibre GL JS + ảnh Esri World Imagery, không cần API key).
 * Toạ độ là [kinh độ, vĩ độ], ƯỚC LƯỢNG — cần đối chiếu trước khi đăng.
 */
type LngLat = [number, number];

export const BCONS: LngLat = [106.84408654581377, 10.959874417285395];
export const LONG_THANH_AIRPORT: LngLat = [107.04195752766535, 10.773541785186673];
export const PHUOC_AN_PORT: LngLat = [106.9942243322939, 10.616353354639697];
const DONG_NAI_OVERVIEW: LngLat = [106.93, 10.84];

/** Tuyến mô phỏng cao tốc Bến Lức - Long Thành (không phải toạ độ tim đường thật). */
const HIGHWAY_WAYPOINTS: LngLat[] = [
  [106.494, 10.64],
  [106.59, 10.615],
  [106.7, 10.64],
  [106.79, 10.69],
  [106.91, 10.715],
  [106.98, 10.745],
  LONG_THANH_AIRPORT,
];
const highway = turf.bezierSpline(turf.lineString(HIGHWAY_WAYPOINTS), {
  resolution: 20000,
  sharpness: 0.6,
});
const highwayLine = turf.lineString(highway.geometry.coordinates);
const highwayLength = turf.length(highwayLine);
const partialHighway = (p: number) =>
  turf.lineSliceAlong(
    highwayLine,
    0,
    Math.max(0.001, highwayLength * Math.min(1, Math.max(0, p))),
  );

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

/** Các mốc camera (frame tương đối trong cảnh). Mỗi đoạn dùng easing riêng. */
const CAM = {
  f: [0, 50, 125, 165, 250, 275, 325, 348],
  lng: [DONG_NAI_OVERVIEW[0], 106.92, BCONS[0], BCONS[0] + 0.002, 107.03, 107.03, 107.0, 106.995],
  lat: [DONG_NAI_OVERVIEW[1], 10.88, BCONS[1] - 0.004, BCONS[1] - 0.005, 10.775, 10.774, 10.64, 10.625],
  zoom: [9.1, 9.5, 14.4, 14.7, 12.4, 12.8, 12.3, 12.6],
  pitch: [0, 15, 62, 64, 58, 60, 58, 60],
  bearing: [0, -10, -28, -40, 25, 40, 8, 0],
};
const cam = (frame: number, v: number[]) =>
  interpolate(frame, CAM.f, v, { ...clamp, easing: ease });

/** Mốc xuất hiện của từng ghim (frame), khớp lời đọc. */
const MARKERS = [
  { id: "bcons", label: "BCONS CENTRAL PARK", pos: BCONS, color: C.red, at: 118, big: true },
  { id: "airport", label: "Sân bay QT Long Thành", pos: LONG_THANH_AIRPORT, color: C.gold, at: 246, big: false },
  { id: "port", label: "Cảng Phước An", pos: PHUOC_AN_PORT, color: C.gold, at: 300, big: false },
] as const;

/** Khoảng frame đường cao tốc "sáng lên" (khớp "cao tốc Bến Lức - Long Thành... khai thác"). */
const HWY_START = 85;
const HWY_END = 245;

const DASH_STEPS = 24;
const dashArray = (step: number): number[] => {
  const dash = 2;
  const gap = 2;
  const period = dash + gap;
  const t = (step / DASH_STEPS) * period;
  // Kỹ thuật dịch pha dash: ghép [0, a, dash, b] để "chạy" theo chiều đường.
  if (t <= gap) return [0, t, dash, gap - t];
  const u = t - gap;
  return [u, gap, dash - u, 0];
};

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
};

type Projected = Record<string, { x: number; y: number; visible: boolean }>;

const cameraAt = (frame: number) => ({
  center: [cam(frame, CAM.lng), cam(frame, CAM.lat)] as LngLat,
  zoom: cam(frame, CAM.zoom),
  pitch: cam(frame, CAM.pitch),
  bearing: cam(frame, CAM.bearing),
});

const Pin: React.FC<{
  m: (typeof MARKERS)[number];
  at: { x: number; y: number; visible: boolean } | undefined;
}> = ({ m, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // spring ít giảm chấn => nảy quá đà rồi ổn định.
  const pop = spring({ frame: frame - m.at, fps, config: { damping: 7, stiffness: 140, mass: 0.9 } });
  const started = frame >= m.at;
  if (!at || !at.visible || !started) return null;
  const size = m.big ? 78 : 60;
  const pulse = ((frame - m.at) % 45) / 45;
  const drop = (1 - pop) * -260; // rơi từ trên xuống rồi nảy
  return (
    <div
      style={{
        position: "absolute",
        left: at.x,
        top: at.y,
        width: 0,
        height: 0,
      }}
    >
      {/* vòng sóng dưới chân ghim */}
      <div
        style={{
          position: "absolute",
          left: -size,
          top: -size / 2,
          width: size * 2,
          height: size,
          borderRadius: "50%",
          border: `4px solid ${m.color}`,
          opacity: (1 - pulse) * Math.min(1, pop),
          transform: `scale(${0.4 + pulse * 1.1})`,
        }}
      />
      {/* thân ghim */}
      <div
        style={{
          position: "absolute",
          left: -size / 2,
          top: -size * 1.35,
          width: size,
          height: size,
          borderRadius: "50% 50% 50% 0",
          transform: `translateY(${drop}px) rotate(-45deg) scale(${Math.max(0, pop)})`,
          transformOrigin: "50% 100%",
          background: m.color,
          border: "5px solid #fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "28%",
            borderRadius: "50%",
            background: "#fff",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -size * 1.35 - 70,
          transform: `translate(-50%, ${drop * 0.5}px) scale(${Math.min(1, Math.max(0, pop))})`,
          whiteSpace: "nowrap",
          padding: "8px 22px",
          borderRadius: 14,
          background: "rgba(13,13,13,0.82)",
          border: `3px solid ${m.color}`,
          color: "#fff",
          fontFamily,
          fontWeight: 800,
          fontSize: m.big ? 44 : 38,
          opacity: Math.min(1, pop),
        }}
      >
        {m.label}
      </div>
    </div>
  );
};

export const SatelliteMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const { width, height } = useVideoConfig();
  const [map, setMap] = useState<MlMap | null>(null);
  const [projected, setProjected] = useState<Projected>({});
  const [loadingHandle] = useState(() =>
    delayRender("Loading satellite map", { timeoutInMilliseconds: 120000 }),
  );

  const project = (m: MlMap): Projected => {
    const out: Projected = {};
    for (const mk of MARKERS) {
      const p = m.project(mk.pos);
      out[mk.id] = {
        x: p.x,
        y: p.y,
        visible: p.x > -200 && p.x < width + 200 && p.y > -100 && p.y < height + 200,
      };
    }
    return out;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    maplibregl.setWorkerUrl(
      URL.createObjectURL(
        new Blob(
          [
            `import "https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl-worker.mjs";`,
          ],
          { type: "text/javascript" },
        ),
      ),
    );

    const c0 = cameraAt(0);
    const m = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      ...c0,
      maxPitch: 70,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    m.on("load", () => {
      m.addSource("hwy-base", { type: "geojson", data: highwayLine });
      m.addSource("hwy-lit", { type: "geojson", data: partialHighway(0) });
      const lineLayout = { "line-cap": "round", "line-join": "round" } as const;
      // đường nền mờ (toàn tuyến)
      m.addLayer({
        id: "hwy-base",
        type: "line",
        source: "hwy-base",
        layout: lineLayout,
        paint: { "line-color": "#ffffff", "line-opacity": 0.28, "line-width": 5 },
      });
      // quầng sáng
      m.addLayer({
        id: "hwy-glow",
        type: "line",
        source: "hwy-lit",
        layout: lineLayout,
        paint: {
          "line-color": C.teal,
          "line-width": 22,
          "line-blur": 14,
          "line-opacity": 0.75,
        },
      });
      // lõi sáng
      m.addLayer({
        id: "hwy-core",
        type: "line",
        source: "hwy-lit",
        layout: lineLayout,
        paint: { "line-color": C.teal, "line-width": 8 },
      });
      // dash array chạy dọc tuyến
      m.addLayer({
        id: "hwy-dash",
        type: "line",
        source: "hwy-lit",
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 4,
          "line-dasharray": dashArray(0),
        },
      });

      m.jumpTo(cameraAt(0));
      m.once("idle", () => {
        flushSync(() => {
          setProjected(project(m));
          setMap(m);
        });
        continueRender(loadingHandle);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueRender, loadingHandle]);

  useEffect(() => {
    if (!map) return;
    const handle = delayRender("Rendering map frame", { timeoutInMilliseconds: 120000 });

    const p = interpolate(frame, [HWY_START, HWY_END], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    (map.getSource("hwy-lit") as GeoJSONSource | undefined)?.setData(partialHighway(p));
    map.setPaintProperty("hwy-dash", "line-dasharray", dashArray(frame % DASH_STEPS));
    map.setPaintProperty("hwy-dash", "line-opacity", frame >= HWY_START ? 0.9 : 0);
    map.setPaintProperty("hwy-core", "line-opacity", frame >= HWY_START ? 1 : 0);
    map.setPaintProperty("hwy-glow", "line-opacity", frame >= HWY_START ? 0.75 : 0);
    map.jumpTo(cameraAt(frame));

    map.once("idle", () => {
      flushSync(() => setProjected(project(map)));
      continueRender(handle);
    });
    map.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, map, continueRender, delayRender]);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div ref={containerRef} style={{ position: "absolute", width, height }} />
      {/* tối nhẹ trên/dưới để chữ dễ đọc */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0) 22%, rgba(13,13,13,0) 70%, rgba(13,13,13,0.85) 100%)",
        }}
      />
      {MARKERS.map((m) => (
        <Pin key={m.id} m={m} at={projected[m.id]} />
      ))}
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 10,
          fontSize: 20,
          color: "#ffffffa0",
          fontFamily,
        }}
      >
        Ảnh: Esri, Maxar, Earthstar Geographics · MapLibre
      </div>
    </AbsoluteFill>
  );
};
