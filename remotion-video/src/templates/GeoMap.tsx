import React, { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  cancelRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import { useTheme } from "../theme";
import { useEnter } from "../motion";
import { useSpring, type TemplateProps } from "./common";

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Props = TemplateProps<"geo-map">["props"];
type Loaded = {
  points: Record<string, Feature<Point>>;
  lines: Record<string, Feature<LineString>>;
  areas: Record<string, Feature<Polygon>>;
};

const readFeatures = async (file: string): Promise<Feature[]> => {
  const res = await fetch(staticFile(file));
  if (!res.ok) throw new Error(`Không tải được ${file} (HTTP ${res.status})`);
  const json = (await res.json()) as Feature | FeatureCollection;
  return json.type === "FeatureCollection" ? json.features : [json];
};

const loadAll = async (p: Props): Promise<Loaded> => {
  const out: Loaded = { points: {}, lines: {}, areas: {} };
  for (const pt of p.points) {
    const f = (await readFeatures(pt.file)).find((x) => x.properties?.key === pt.featureKey);
    if (!f) throw new Error(`geo-map: không có điểm "${pt.featureKey}" trong ${pt.file}`);
    out.points[pt.key] = f as Feature<Point>;
  }
  for (const ln of p.lines) {
    const [f] = await readFeatures(ln.file);
    out.lines[ln.key] = f as Feature<LineString>;
  }
  for (const ar of p.areas) {
    const [f] = await readFeatures(ar.file);
    out.areas[ar.key] = f as Feature<Polygon>;
  }
  return out;
};

/** Mẫu `geo-map`: nền Mapbox thật, thả điểm, vẽ tuyến chạy dần, vẽ vùng; camera đứng yên. */
export const GeoMap: React.FC<TemplateProps<"geo-map">> = ({ props, cue }) => {
  const C = useTheme();
  const enter = useEnter();
  const HEX = { white: C.neutral, gold: C.gold, red: C.red, teal: C.teal } as const;
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { delayRender, continueRender } = useDelayRender();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [loadingHandle] = useState(() => delayRender("Loading Mapbox map"));
  const title = useSpring(0);
  const infoP = useSpring(props.info ? cue(props.info.cueKey) - 10 : 0, 12);

  // Trạng thái hoạt họa của khung hiện tại (tính thuần từ frame).
  const frameState = (f: number, d: Loaded) => {
    const appear = (cueKey: string, offset = 0) =>
      interpolate(f, [cue(cueKey) + offset, cue(cueKey) + offset + 14], [0, 1], {
        ...clamp01,
        easing: Easing.out(Easing.cubic),
      });
    const pts = props.points.map((pt) =>
      turf.point(d.points[pt.key].geometry.coordinates, {
        label: pt.label,
        color: HEX[pt.color],
        big: pt.big ? 1 : 0,
        p: appear(pt.cueKey, pt.offset),
      }),
    );
    const lines = props.lines.map((ln) => {
      const full = d.lines[ln.key];
      const len = turf.length(full);
      const prog = interpolate(f, [cue(ln.cueKey), cue(ln.cueKey) + ln.drawFrames], [0, 1], {
        ...clamp01,
        easing: Easing.inOut(Easing.cubic),
      });
      const part = turf.lineSliceAlong(full, 0, Math.max(0.001, len * prog));
      part.properties = { color: HEX[ln.color], width: ln.width ?? 8, kind: ln.kind, p: prog > 0 ? 1 : 0 };
      return part;
    });
    const areas = props.areas.map((ar) =>
      turf.feature(d.areas[ar.key].geometry, { kind: ar.kind, p: appear(ar.cueKey) }),
    );
    const areaLabels = props.areas.map((ar) =>
      turf.point(turf.centerOfMass(d.areas[ar.key]).geometry.coordinates, {
        label: ar.kind === "illustrative" ? `${ar.label}` : ar.label,
        p: appear(ar.cueKey),
      }),
    );
    return {
      points: turf.featureCollection(pts),
      lines: turf.featureCollection(lines),
      areas: turf.featureCollection(areas),
      areaLabels: turf.featureCollection(areaLabels),
    };
  };

  useEffect(() => {
    const token = process.env.REMOTION_MAPBOX_TOKEN;
    if (!token) {
      cancelRender(new Error("Thiếu REMOTION_MAPBOX_TOKEN. Đặt MAPBOX_TOKEN_KEY trong remotion-video/.env và chạy qua npm run dev / still / render:drive."));
      return;
    }
    if (!containerRef.current) return;
    let cancelled = false;
    loadAll(props)
      .then((loaded) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = token;
        const m = new mapboxgl.Map({
          container: containerRef.current,
          style: props.mapStyle,
          center: props.camera.center,
          zoom: props.camera.zoom,
          interactive: false,
          attributionControl: false,
          fadeDuration: 0,
          preserveDrawingBuffer: true,
        });
        m.on("error", (e) => {
          const status = (e.error as { status?: number } | undefined)?.status;
          if (status === 401 || status === 403) {
            cancelRender(new Error(`Mapbox từ chối token (HTTP ${status}). Kiểm tra bằng npm run check:mapbox.`));
          }
        });
        m.on("load", () => {
          const s0 = frameState(0, loaded);
          m.addSource("areas", { type: "geojson", data: s0.areas });
          m.addSource("lines", { type: "geojson", data: s0.lines });
          m.addSource("points", { type: "geojson", data: s0.points });
          m.addSource("area-labels", { type: "geojson", data: s0.areaLabels });
          m.addLayer({
            id: "area-fill",
            type: "fill",
            source: "areas",
            paint: { "fill-color": C.gold, "fill-opacity": ["*", ["get", "p"], 0.2] },
          });
          m.addLayer({
            id: "area-outline-solid",
            type: "line",
            source: "areas",
            filter: ["==", ["get", "kind"], "official"],
            paint: { "line-color": C.gold, "line-width": 5, "line-opacity": ["get", "p"] },
          });
          m.addLayer({
            id: "area-outline-dashed",
            type: "line",
            source: "areas",
            filter: ["==", ["get", "kind"], "illustrative"],
            paint: {
              "line-color": C.gold,
              "line-width": 5,
              "line-opacity": ["get", "p"],
              "line-dasharray": [2, 2],
            },
          });
          m.addLayer({
            id: "line-glow",
            type: "line",
            source: "lines",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": ["get", "color"], "line-width": ["*", ["get", "width"], 2.4], "line-opacity": 0.22, "line-blur": 6 },
          });
          m.addLayer({
            id: "line-main",
            type: "line",
            source: "lines",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": ["get", "color"], "line-width": ["get", "width"] },
          });
          m.addLayer({
            id: "point-dots",
            type: "circle",
            source: "points",
            paint: {
              "circle-color": ["get", "color"],
              "circle-radius": ["*", ["get", "p"], ["case", ["==", ["get", "big"], 1], 22, 15]],
              "circle-stroke-color": C.text,
              "circle-stroke-width": ["*", ["get", "p"], 4],
            },
          });
          m.addLayer({
            id: "point-labels",
            type: "symbol",
            source: "points",
            layout: {
              "text-field": ["get", "label"],
              "text-size": ["case", ["==", ["get", "big"], 1], 40, 34],
              "text-anchor": "top",
              "text-offset": [0, 0.9],
              "text-allow-overlap": true,
              "text-max-width": 9,
            },
            paint: {
              "text-color": C.text,
              "text-halo-color": C.stroke,
              "text-halo-width": 3,
              "text-opacity": ["get", "p"],
            },
          });
          m.addLayer({
            id: "area-labels",
            type: "symbol",
            source: "area-labels",
            layout: { "text-field": ["get", "label"], "text-size": 30, "text-allow-overlap": true, "text-max-width": 12, "text-anchor": "right", "text-offset": [-1.2, 0] },
            paint: {
              "text-color": C.gold,
              "text-halo-color": C.stroke,
              "text-halo-width": 3,
              "text-opacity": ["get", "p"],
            },
          });
          m.jumpTo({ center: props.camera.center, zoom: props.camera.zoom });
          m.once("idle", () => {
            setData(loaded);
            setMap(m);
            continueRender(loadingHandle);
          });
        });
      })
      .catch((e) => cancelRender(e));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map || !data) return;
    const handle = delayRender(`Rendering Mapbox frame ${frame}`);
    const s = frameState(frame, data);
    (map.getSource("areas") as mapboxgl.GeoJSONSource).setData(s.areas);
    (map.getSource("lines") as mapboxgl.GeoJSONSource).setData(s.lines);
    (map.getSource("points") as mapboxgl.GeoJSONSource).setData(s.points);
    (map.getSource("area-labels") as mapboxgl.GeoJSONSource).setData(s.areaLabels);
    // Đôi khi Mapbox không phát "idle" nếu khung không đổi: kích vẽ lại mỗi giây cho tới khi idle.
    const retry = setInterval(() => map.triggerRepaint(), 1000);
    map.once("idle", () => {
      clearInterval(retry);
      continueRender(handle);
    });
    map.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, map, data]);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div ref={containerRef} style={{ position: "absolute", width, height }} />
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, ${C.scrim}cc 0%, ${C.scrim}00 22%, ${C.scrim}00 78%, ${C.scrim}b3 100%)` }}
      />
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 70,
          right: 70,
          ...enter(title, "up", 40),
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 600, color: C.teal }}>{props.kicker}</div>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1 }}>{props.title}</div>
      </div>
      {props.info ? (
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 300,
            padding: "30px 40px",
            borderRadius: 28,
            background: `${C.bg2}ee`,
            border: `3px solid ${C.teal}`,
            ...enter(infoP, "up", 50),
          }}
        >
          <div style={{ fontSize: 38, color: C.teal, fontWeight: 600 }}>{props.info.title}</div>
          <div style={{ fontSize: 52, fontWeight: 800, marginTop: 6 }}>{props.info.text}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", bottom: 62, left: 40, right: 40, textAlign: "center", fontSize: 24, color: C.muted }}>
        {props.note}
      </div>
      <div style={{ position: "absolute", bottom: 20, width: "100%", textAlign: "center", fontSize: 22, color: C.dim }}>
        © Mapbox © OpenStreetMap
      </div>
    </AbsoluteFill>
  );
};
