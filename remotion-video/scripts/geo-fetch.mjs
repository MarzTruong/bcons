// Lấy ranh giới (đa giác) từ OpenStreetMap cho các khu trong video, lưu vào public/geo/osm/.
// Thứ tự: (1) file đã có trong public/geo/osm/ -> bỏ qua; (2) file GeoJSON anh xuất từ Overpass Turbo
// để trong ../map/ (khớp theo mã way/relation); (3) gọi Overpass API trực tiếp.
// Chạy: npm run geo:fetch            (lấy mọi khu trong AREAS)
//       npm run geo:fetch -- --refresh (bỏ cache, lấy lại)
//       npm run geo:fetch -- --refresh --remote (bỏ cả file map/, buộc gọi Overpass)
//       npm run geo:fetch -- --search "Aeon" --bbox 10.88,106.80,10.98,106.90   (tìm theo tên trong khung)
// Dữ liệu © OpenStreetMap contributors (ODbL). Ranh trong OSM do cộng đồng vẽ, KHÔNG phải ranh pháp lý.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as turf from "@turf/turf";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "geo", "osm");
const LOCAL_DIRS = [path.resolve(ROOT, "..", "map")];
const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const UA = "bcons-video-pipeline/1.0 (+geo-fetch; contact via repo owner)";

/** Khu cần lấy. osmIds: mã "way/123" hoặc "relation/123"; nhiều mã thì gộp thành MultiPolygon. */
export const AREAS = [
  { key: "kcn-loteco", name: "KCN Loteco", osmIds: ["way/583464298"], refHa: 100 },
  { key: "kcn-bien-hoa-2", name: "KCN Biên Hòa II", osmIds: ["way/306132369"], refHa: 394.63 },
  { key: "kcn-amata", name: "KCN Amata", osmIds: ["way/583464295"], refHa: 513.01 },
  { key: "kcn-bien-hoa-1", name: "KCN Biên Hòa 1", osmIds: ["way/568387663"], refHa: 335 },
  { key: "du-an-central-park", name: "Khu đất Bcons Central Park (theo OSM)", osmIds: ["way/1015150479"] },
];

/** Overpass JSON (out geom) -> Map<"way/id", Feature>. Hỗ trợ way kín và relation multipolygon (vòng outer). */
export function overpassToFeatures(json) {
  const out = new Map();
  for (const el of json.elements ?? []) {
    const id = `${el.type}/${el.id}`;
    const props = { "@id": id, ...(el.tags ?? {}) };
    if (el.type === "way" && el.geometry?.length >= 4) {
      const ring = el.geometry.map((p) => [p.lon, p.lat]);
      if (!sameLngLat(ring[0], ring[ring.length - 1])) continue;
      out.set(id, turf.polygon([ring], props));
    } else if (el.type === "relation") {
      const rings = (el.members ?? [])
        .filter((m) => m.role === "outer" && m.geometry?.length >= 4)
        .map((m) => m.geometry.map((p) => [p.lon, p.lat]))
        .filter((r) => sameLngLat(r[0], r[r.length - 1]));
      if (rings.length) out.set(id, turf.multiPolygon(rings.map((r) => [r]), props));
    }
  }
  return out;
}

function sameLngLat(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/** Gộp các feature thành một Feature kèm thông tin kiểm tra (diện tích, tâm, khung bao). */
export function buildArea(area, features) {
  const polys = features.flatMap((f) =>
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates,
  );
  const geometry = polys.length === 1 ? { type: "Polygon", coordinates: polys[0] } : { type: "MultiPolygon", coordinates: polys };
  const feature = turf.feature(geometry);
  const areaHa = turf.area(feature) / 1e4;
  const [w, s, e, n] = turf.bbox(feature);
  feature.properties = {
    key: area.key,
    name: area.name,
    osmIds: area.osmIds,
    osmNames: features.map((f) => f.properties.name).filter(Boolean),
    areaHa: Number(areaHa.toFixed(1)),
    refHa: area.refHa ?? null,
    center: turf.centerOfMass(feature).geometry.coordinates.map((x) => Number(x.toFixed(6))),
    bbox: [w, s, e, n].map((x) => Number(x.toFixed(6))),
    source: "OpenStreetMap contributors (ODbL)",
  };
  return feature;
}

function loadLocal() {
  const found = new Map();
  for (const dir of LOCAL_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".geojson"))) {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const ft of j.features ?? []) {
        const id = ft.properties?.["@id"] ?? ft.id;
        if (id && /Polygon/.test(ft.geometry?.type ?? "")) found.set(id, ft);
      }
    }
  }
  return found;
}

async function overpass(query) {
  let last;
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(40_000),
      });
      if (res.ok) return await res.json();
      last = `${url}: HTTP ${res.status}`;
    } catch (e) {
      last = `${url}: ${e.cause?.code ?? e.message}`;
    }
  }
  throw new Error(`Overpass không trả dữ liệu (${last}). Xuất GeoJSON từ Overpass Turbo vào thư mục map/ rồi chạy lại.`);
}

async function fetchByIds(ids) {
  const parts = ids.map((i) => `${i.split("/")[0]}(${i.split("/")[1]});`).join("");
  return overpassToFeatures(await overpass(`[out:json][timeout:30];(${parts});out geom;`));
}

async function search(name, bbox) {
  const q = `[out:json][timeout:30];nwr["name"~"${name.replace(/"/g, "")}",i](${bbox});out geom;`;
  const feats = overpassToFeatures(await overpass(q));
  for (const [id, f] of feats) {
    console.log(id, f.properties.name ?? "(không tên)", (turf.area(f) / 1e4).toFixed(1) + " ha", turf.centerOfMass(f).geometry.coordinates.map((x) => +x.toFixed(6)).join(","));
  }
  if (!feats.size) console.log("Không thấy trong OpenStreetMap (hoặc chưa vẽ thành đa giác).");
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  if (arg("--search")) return search(arg("--search"), arg("--bbox") ?? "10.88,106.80,10.98,106.90");
  const refresh = args.includes("--refresh");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // --remote: bỏ qua file trong map/, buộc gọi Overpass (để kiểm tra kết nối tự động).
  const local = args.includes("--remote") ? new Map() : loadLocal();
  const index = {};
  let failed = 0;
  for (const area of AREAS) {
    const file = path.join(OUT_DIR, `${area.key}.geojson`);
    let feature;
    let via;
    if (!refresh && fs.existsSync(file)) {
      feature = JSON.parse(fs.readFileSync(file, "utf8"));
      via = "cache";
    } else {
      let feats = area.osmIds.map((i) => local.get(i));
      via = "map/";
      if (feats.some((f) => !f)) {
        try {
          const remote = await fetchByIds(area.osmIds);
          feats = area.osmIds.map((i) => remote.get(i));
          via = "Overpass";
        } catch (e) {
          console.error(`✗ ${area.key}: ${e.message}`);
          failed++;
          continue;
        }
      }
      if (feats.some((f) => !f)) {
        console.error(`✗ ${area.key}: thiếu đa giác cho ${area.osmIds.join(", ")}`);
        failed++;
        continue;
      }
      feature = buildArea(area, feats);
      fs.writeFileSync(file, JSON.stringify(turf.featureCollection([feature])) + "\n");
    }
    const p = feature.type === "FeatureCollection" ? feature.features[0].properties : feature.properties;
    index[area.key] = { areaHa: p.areaHa, refHa: p.refHa, center: p.center, bbox: p.bbox };
    const diff = p.refHa ? ` (số chính thức ${p.refHa} ha, lệch ${(((p.areaHa - p.refHa) / p.refHa) * 100).toFixed(0)}%)` : "";
    console.log(`✓ ${area.key} [${via}] ${p.areaHa} ha${diff} tâm ${p.center.join(", ")}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
