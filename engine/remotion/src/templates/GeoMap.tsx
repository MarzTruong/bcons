import React, { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
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
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import { useTheme } from "../theme";
import { useEnter } from "../motion";
import { useSpring, type TemplateProps } from "./common";
import { fitCam, projectLngLat, shiftCenter, type Cam } from "../geoCamera";
import { cometPhase, cometRanges } from "../vienChay";

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Props = TemplateProps<"geo-map">["props"];
type Move = { start: number; frames: number; to: Cam };
type Loaded = {
  points: Record<string, Feature<Point>>;
  lines: Record<string, Feature<LineString>>;
  areas: Record<string, Feature<Polygon | MultiPolygon>>;
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
    out.areas[ar.key] = f as Feature<Polygon | MultiPolygon>;
  }
  return out;
};

/** Vị trí camera ở frame f: các chặng nối tiếp nhau, mỗi chặng nội suy từ vị trí trước đó. */
export const cameraAt = (f: number, initial: Cam, moves: Move[]): Cam => {
  let cur = initial;
  for (const m of moves) {
    if (f <= m.start) break;
    const t = interpolate(f, [m.start, m.start + m.frames], [0, 1], { ...clamp01, easing: Easing.inOut(Easing.cubic) });
    if (t >= 1) {
      cur = m.to;
      continue;
    }
    return {
      center: [
        cur.center[0] + (m.to.center[0] - cur.center[0]) * t,
        cur.center[1] + (m.to.center[1] - cur.center[1]) * t,
      ],
      zoom: cur.zoom + (m.to.zoom - cur.zoom) * t,
    };
  }
  return cur;
};

const worldWithHole = (hole: Feature<Polygon | MultiPolygon>): Feature<Polygon> => {
  const holes: number[][][] = hole.geometry.type === "Polygon" ? [hole.geometry.coordinates[0]] : hole.geometry.coordinates.map((p) => p[0]);
  return turf.polygon([[[100, 5], [112, 5], [112, 16], [100, 16], [100, 5]], ...holes]);
};

const ringsOf = (g: Polygon | MultiPolygon): number[][][] => (g.type === "Polygon" ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]));

const Callout: React.FC<{ x: number; y: number; delay: number; hideAt?: number; tag: string; big: string; sub?: string }> = ({ x, y, delay, hideAt, tag, big, sub }) => {
  const C = useTheme();
  const frame = useCurrentFrame();
  const p = useSpring(delay, 14) * (hideAt === undefined ? 1 : interpolate(frame, [hideAt, hideAt + 10], [1, 0], clamp01));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${0.6 + 0.4 * p})`,
        transformOrigin: "50% 100%",
        opacity: p,
        padding: "16px 28px",
        borderRadius: 24,
        background: `${C.bg2}f2`,
        border: `3px solid ${C.gold}`,
        textAlign: "center",
        whiteSpace: "nowrap",
        boxShadow: `0 8px 40px #0008`,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color: C.gold }}>{tag}</div>
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>{big}</div>
      {sub ? <div style={{ fontSize: 26, color: C.teal, fontWeight: 600 }}>{sub}</div> : null}
    </div>
  );
};

const BottomCard: React.FC<{ delay: number; tag: string; big: string; sub: string }> = ({ delay, tag, big, sub }) => {
  const C = useTheme();
  const enter = useEnter();
  const p = useSpring(delay, 13);
  return (
    <div
      style={{
        padding: "10px 32px",
        borderRadius: 24,
        background: `${C.bg2}f2`,
        border: `3px solid ${C.gold}`,
        ...enter(p, "right", 300),
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 600, color: C.gold }}>{tag}</div>
      <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.06 }}>{big}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: C.teal }}>{sub}</div>
    </div>
  );
};

/**
 * Mẫu `geo-map`: nền Mapbox thật; điểm, tuyến, vùng (ranh OSM tự vẽ), camera nhiều chặng theo lời đọc,
 * làm tối vùng ngoài, thẻ số nổi neo vào vùng, thẻ số liệu dưới bản đồ, ảnh chèn cross-fade, dòng chữ gõ dần.
 * Mọi thứ là hàm thuần của frame (camera tính bằng toán Mercator, không đọc trạng thái bản đồ).
 */
export const GeoMap: React.FC<TemplateProps<"geo-map">> = ({ props, cue, frames }) => {
  const C = useTheme();
  const enter = useEnter();
  const HEX = { white: C.neutral, gold: C.gold, red: C.red, teal: C.teal } as const;
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { delayRender, continueRender } = useDelayRender();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [initial, setInitial] = useState<Cam>({ center: [106.87, 10.94], zoom: 12 });
  const [loadingHandle] = useState(() => delayRender("Loading Mapbox map"));
  const title = useSpring(0);
  const infoP = useSpring(props.info ? cue(props.info.cueKey) - 10 : 0, 12);

  const at = (t: { cueKey?: string; offset?: number }) => (t.cueKey ? cue(t.cueKey) : 0) + (t.offset ?? 0);
  const cam = cameraAt(frame, initial, moves);

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
    const lineLabels: Feature[] = [];
    const lines = props.lines.map((ln) => {
      const full = d.lines[ln.key];
      const len = turf.length(full);
      const t0 = cue(ln.cueKey) + (ln.offset ?? 0);
      const prog = interpolate(f, [t0, t0 + ln.drawFrames], [0, 1], {
        ...clamp01,
        easing: Easing.inOut(Easing.cubic),
      });
      const part = turf.lineSliceAlong(full, 0, Math.max(0.001, len * prog));
      part.properties = { color: HEX[ln.color], width: ln.width ?? 8, kind: ln.kind, p: prog > 0 ? 1 : 0 };
      if (full.properties?.label) {
        lineLabels.push(turf.point(turf.along(full, len / 2).geometry.coordinates, { label: full.properties.label, color: HEX[ln.color], p: prog >= 1 ? 1 : 0 }));
      }
      return part;
    });
    const areaFeats: Feature[] = [];
    const areaLines: Feature[] = [];
    const areaLabels: Feature[] = [];
    const comets: Feature[] = [];
    for (const ar of props.areas) {
      const geom = d.areas[ar.key];
      const start = cue(ar.cueKey) + (ar.offset ?? 0);
      const p = appear(ar.cueKey, ar.offset);
      const dimTo = ar.dimAt
        ? interpolate(f, [at(ar.dimAt), at(ar.dimAt) + 20], [1, ar.dimAt.to], clamp01)
        : 1;
      const flash = Math.max(
        0,
        ...(ar.pulses ?? []).map((pl) => interpolate(f, [at(pl), at(pl) + 30], [1, 0], { ...clamp01, easing: Easing.out(Easing.cubic) })),
      );
      const draw = ar.drawFrames ? interpolate(f, [start, start + ar.drawFrames], [0, 1], { ...clamp01, easing: Easing.inOut(Easing.cubic) }) : p;
      const color = HEX[ar.color ?? "gold"];
      const base = { kind: ar.kind, color, p: p * dimTo, flash, fillOpacity: ar.fillOpacity ?? 0.2 };
      areaFeats.push(turf.feature(geom.geometry, { ...base, p: (ar.drawFrames ? Math.max(0, (draw - 0.7) / 0.3) : p) * dimTo }));
      for (const ring of ringsOf(geom.geometry)) {
        const line = turf.lineString(ring);
        const len = turf.length(line);
        const part = turf.lineSliceAlong(line, 0, Math.max(0.0005, len * draw));
        part.properties = { ...base, p: draw > 0 ? dimTo : 0 };
        areaLines.push(part);
        // Vệt sáng chạy vòng quanh ranh sau khi vẽ xong (chỉ vùng official có vienChay)
        const phase = ar.vienChay && ar.kind === "official" ? cometPhase(f, start, ar.drawFrames ?? 0) : null;
        if (phase !== null) {
          for (const [a, b] of cometRanges(phase, len)) {
            const seg = turf.lineSliceAlong(line, a, Math.max(a + 0.0005, b));
            seg.properties = { color, p: dimTo };
            comets.push(seg);
          }
        }
      }
      const c = turf.centerOfMass(geom).geometry.coordinates;
      areaLabels.push(
        turf.point(c, { label: ar.label, color, p: appear(ar.cueKey, ar.offset) * dimTo }),
      );
    }
    const dimP = props.dim ? interpolate(f, [at(props.dim), at(props.dim) + 20], [0, props.dim.opacity ?? 0.55], clamp01) : 0;
    const dimFeat = props.dim ? [turf.feature(worldWithHole(d.areas[props.dim.areaKey]).geometry, { o: dimP })] : [];
    return {
      points: turf.featureCollection(pts),
      lines: turf.featureCollection(lines),
      lineLabels: turf.featureCollection(lineLabels),
      areas: turf.featureCollection(areaFeats),
      areaLines: turf.featureCollection(areaLines),
      areaLabels: turf.featureCollection(areaLabels),
      comets: turf.featureCollection(comets),
      dim: turf.featureCollection(dimFeat),
    };
  };

  useEffect(() => {
    const token = process.env.REMOTION_MAPBOX_TOKEN;
    if (!token) {
      cancelRender(new Error("Thiếu REMOTION_MAPBOX_TOKEN. Đặt MAPBOX_TOKEN_KEY trong engine/remotion/.env và chạy qua npm run dev / still / render:drive."));
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
          center: [106.87, 10.94],
          zoom: 12,
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
          // Giải camera/chặng "fit" thành center/zoom (cần bản đồ để biết kích thước khung nhìn).
          const resolveTarget = (t: (typeof props)["camera"]): Cam => {
            if ("fit" in t) {
              const coords: number[][] = [];
              for (const key of t.fit) {
                const a = loaded.areas[key];
                const pt = loaded.points[key];
                if (a) for (const ring of ringsOf(a.geometry)) coords.push(...ring);
                else if (pt) coords.push(pt.geometry.coordinates);
                else throw new Error(`geo-map: fit "${key}" không phải key của vùng hay điểm`);
              }
              return fitCam(coords, t.padding ?? 120, t.maxZoom ?? 16, width, height);
            }
            return { center: shiftCenter(t.center as [number, number], t.zoom, t.shiftY ?? 0), zoom: t.zoom };
          };
          const init = resolveTarget(props.camera);
          const resolved: Move[] = (props.moves ?? []).map((mv) => ({ start: at(mv), frames: mv.frames, to: resolveTarget(mv.to) }));
          const s0 = frameState(0, loaded);
          m.addSource("dim", { type: "geojson", data: s0.dim });
          m.addSource("areas", { type: "geojson", data: s0.areas });
          m.addSource("area-lines", { type: "geojson", data: s0.areaLines });
          m.addSource("area-comets", { type: "geojson", data: s0.comets });
          m.addSource("lines", { type: "geojson", data: s0.lines });
          m.addSource("line-labels", { type: "geojson", data: s0.lineLabels });
          m.addSource("points", { type: "geojson", data: s0.points });
          m.addSource("area-labels", { type: "geojson", data: s0.areaLabels });
          m.addLayer({ id: "dim", type: "fill", source: "dim", paint: { "fill-color": "#000000", "fill-opacity": ["get", "o"] } });
          m.addLayer({
            id: "area-fill",
            type: "fill",
            source: "areas",
            paint: { "fill-color": ["get", "color"], "fill-opacity": ["+", ["*", ["get", "p"], ["get", "fillOpacity"]], ["*", ["get", "flash"], 0.25]] },
          });
          m.addLayer({
            id: "area-outline-glow",
            type: "line",
            source: "area-lines",
            layout: { "line-join": "round" },
            paint: { "line-color": ["get", "color"], "line-width": ["+", 14, ["*", ["get", "flash"], 14]], "line-opacity": ["*", ["get", "p"], 0.25], "line-blur": 8 },
          });
          m.addLayer({
            id: "area-outline-solid",
            type: "line",
            source: "area-lines",
            filter: ["==", ["get", "kind"], "official"],
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": ["get", "color"], "line-width": ["+", 5, ["*", ["get", "flash"], 5]], "line-opacity": ["get", "p"] },
          });
          m.addLayer({
            id: "area-comet-glow",
            type: "line",
            source: "area-comets",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ffffff", "line-width": 18, "line-opacity": ["*", ["get", "p"], 0.35], "line-blur": 10 },
          });
          m.addLayer({
            id: "area-comet",
            type: "line",
            source: "area-comets",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": ["get", "p"] },
          });
          m.addLayer({
            id: "area-outline-dashed",
            type: "line",
            source: "area-lines",
            filter: ["==", ["get", "kind"], "illustrative"],
            paint: { "line-color": ["get", "color"], "line-width": 5, "line-opacity": ["get", "p"], "line-dasharray": [2, 2] },
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
            id: "line-labels",
            type: "symbol",
            source: "line-labels",
            layout: { "text-field": ["get", "label"], "text-size": 32, "text-allow-overlap": true, "text-anchor": "center" },
            paint: { "text-color": ["get", "color"], "text-halo-color": C.stroke, "text-halo-width": 4, "text-opacity": ["get", "p"] },
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
            paint: { "text-color": C.text, "text-halo-color": C.stroke, "text-halo-width": 3, "text-opacity": ["get", "p"] },
          });
          m.addLayer({
            id: "area-labels",
            type: "symbol",
            source: "area-labels",
            layout: {
              "text-field": ["get", "label"],
              "text-size": 34,
              "text-allow-overlap": true,
              "text-max-width": 10,
              "text-anchor": "center",
            },
            paint: { "text-color": ["get", "color"], "text-halo-color": C.stroke, "text-halo-width": 3.5, "text-opacity": ["get", "p"] },
          });
          m.jumpTo(init);
          m.once("idle", () => {
            setInitial(init);
            setData(loaded);
            setMoves(resolved);
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
    const set = (id: string, d: FeatureCollection) => (map.getSource(id) as mapboxgl.GeoJSONSource).setData(d);
    set("dim", s.dim);
    set("areas", s.areas);
    set("area-lines", s.areaLines);
    set("area-comets", s.comets);
    set("lines", s.lines);
    set("line-labels", s.lineLabels);
    set("points", s.points);
    set("area-labels", s.areaLabels);
    map.jumpTo({ center: cam.center, zoom: cam.zoom });
    // Đôi khi Mapbox không phát "idle" nếu khung không đổi: kích vẽ lại mỗi giây cho tới khi idle.
    const retry = setInterval(() => map.triggerRepaint(), 1000);
    map.once("idle", () => {
      clearInterval(retry);
      continueRender(handle);
    });
    map.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, map, data]);

  const anchorXY = (a: { area?: string; point?: string }): [number, number] | null => {
    if (!data) return null;
    const c = a.area
      ? turf.centerOfMass(data.areas[a.area]).geometry.coordinates
      : a.point
        ? data.points[a.point].geometry.coordinates
        : null;
    return c ? projectLngLat(c[0], c[1], cam, width, height) : null;
  };

  const img = props.image;
  const imgP = img ? interpolate(frame, [at(img), at(img) + 24], [0, 1], clamp01) : 0;
  const imgZoom = img ? interpolate(frame, [at(img), frames], [1, 1.09], clamp01) : 1;
  const msg = props.message;
  const msgChars = msg
    ? Math.floor(interpolate(frame, [at(msg), Math.min(frames - 20, at(msg) + 70)], [0, msg.text.length], clamp01))
    : 0;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div ref={containerRef} style={{ position: "absolute", width, height }} />
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, ${C.scrim}cc 0%, ${C.scrim}00 22%, ${C.scrim}00 62%, ${C.scrim}b3 100%)` }}
      />
      {(props.callouts ?? []).map((co) => {
        const xy = anchorXY(co.anchor);
        if (!xy) return null;
        return (
          <Callout
            key={co.cueKey + co.tag}
            x={xy[0] + (co.dx ?? 0)}
            y={xy[1] + (co.dy ?? 0)}
            delay={cue(co.cueKey) + co.offset}
            hideAt={co.hideAt ? at(co.hideAt) : undefined}
            tag={co.tag}
            big={co.big}
            sub={co.sub}
          />
        );
      })}
      <div style={{ position: "absolute", top: 110, left: 70, right: 70, ...enter(title, "up", 40) }}>
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
      {props.cards?.length ? (
        <div style={{ position: "absolute", left: 50, right: 50, top: 340, display: "flex", flexDirection: "column", gap: 14 }}>
          {props.cards.map((c) => (
            <BottomCard key={c.cueKey} delay={cue(c.cueKey) + c.offset} tag={c.tag} big={c.big} sub={c.sub} />
          ))}
        </div>
      ) : null}
      {img ? (
        <AbsoluteFill style={{ opacity: imgP, overflow: "hidden", background: C.bg }}>
          <Img
            src={staticFile(img.file)}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${imgZoom})` }}
          />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.scrim}66 0%, ${C.scrim}00 25%, ${C.scrim}00 55%, ${C.scrim}e6 100%)` }} />
          <div style={{ position: "absolute", top: 120, left: 70, fontSize: 52, fontWeight: 800, textShadow: "0 3px 16px #000a" }}>{img.label}</div>
        </AbsoluteFill>
      ) : null}
      {msg ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            bottom: 470,
            minHeight: 150,
            fontSize: 50,
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: "center",
            textShadow: "0 3px 16px #000c",
          }}
        >
          {msg.text.slice(0, msgChars)}
          <span style={{ color: C.gold, opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
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
