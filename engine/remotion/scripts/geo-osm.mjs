// Lấy tọa độ điểm (Nominatim) và tuyến đường lái xe thật (OSRM) từ OpenStreetMap, lưu GeoJSON vào
// du-an/<mã>/assets/geo/osm-diem/ để Mapbox trong Remotion vẽ. Miễn phí; dữ liệu OSM (ODbL) được lưu lại,
// chỉ cần ghi "© OpenStreetMap" (video bản đồ đã có). Máy chủ miễn phí: gọi thưa, không chạy hàng loạt.
// (Google Maps Platform cấm dùng tại Việt Nam, nên không dùng.)
//
//   npm run geo:osm -- diem <key> "<từ khóa>"              vd. diem tan-van "Nút giao Tân Vạn"
//   npm run geo:osm -- tuyen <key> <điểm đầu> <điểm cuối>   vd. tuyen du-an-tan-hiep central-park tan-hiep
// Điểm đầu/cuối là key trong diem-moc.geojson hoặc osm-diem/diem-*.geojson. Điểm OSM không có tên (vd. nút giao
// Tân Hiệp) thì anh lấy tọa độ từ app Google Maps, thêm vào build-geo.mjs. Ghi nguồn vào assets/geo/NGUON.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { takeProjectFlag } from "./project.mjs";

const UA = "bcons-video/1.0 (https://github.com/MarzTruong/bcons)";
const inVietnam = ([lng, lat]) => lng >= 102 && lng <= 110 && lat >= 8 && lat <= 24;

/** Giải mã chuỗi polyline (độ chính xác 5 chữ số) → mảng [kinh độ, vĩ độ]. */
export function decodePolyline(str) {
  const out = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b;
      do {
        b = str.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d;
      else lng += d;
    }
    out.push([lng / 1e5, lat / 1e5]);
  }
  return out;
}

export function nominatimToFeature(key, hit, fetchedAt) {
  const coords = [Number(hit.lon), Number(hit.lat)];
  if (!inVietnam(coords)) throw new Error(`Điểm "${key}" (${coords}) nằm ngoài Việt Nam: kiểm lại từ khóa tìm.`);
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: coords },
    properties: {
      key,
      name: String(hit.display_name ?? key).split(",")[0],
      diaChi: hit.display_name ?? "",
      sourceId: `geo-${key}`,
      nguon: "OpenStreetMap (Nominatim)",
      link: `https://www.openstreetmap.org/${hit.osm_type}/${hit.osm_id}`,
      fetchedAt,
    },
  };
}

export function osrmToFeature(key, route, fetchedAt) {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: decodePolyline(route.geometry) },
    properties: {
      key,
      kind: "official",
      km: Math.round(route.distance / 100) / 10,
      phut: Math.round(route.duration / 60),
      sourceId: `geo-${key}`,
      nguon: "OpenStreetMap (OSRM, đường lái xe)",
      fetchedAt,
    },
  };
}

export const nominatimUrl = (q) =>
  `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: "json", limit: "3", countrycodes: "vn", "accept-language": "vi" })}`;

export const osrmUrl = (from, to) =>
  `https://router.project-osrm.org/route/v1/driving/${from.join(",")};${to.join(",")}?overview=full&geometries=polyline`;

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Máy chủ OSM trả lỗi ${res.status} (${new URL(url).host})`);
  return res.json();
}

function findPoint(geoDir, key) {
  const extra = path.join(geoDir, "osm-diem");
  const files = [path.join(geoDir, "diem-moc.geojson"), ...(fs.existsSync(extra) ? fs.readdirSync(extra).filter((f) => f.startsWith("diem-")).map((f) => path.join(extra, f)) : [])];
  for (const f of files) {
    const hit = JSON.parse(fs.readFileSync(f, "utf8")).features.find((x) => x.properties?.key === key);
    if (hit) return hit.geometry.coordinates;
  }
  throw new Error(`Không thấy điểm "${key}" trong ${geoDir}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
  const [cmd, key, a, b] = rest;
  if (!/^[a-z0-9-]+$/.test(key ?? "") || !["diem", "tuyen"].includes(cmd)) {
    console.error('Cách dùng: diem <key> "<từ khóa>" | tuyen <key> <điểm đầu> <điểm cuối> (key: a-z, 0-9, -)');
    process.exit(1);
  }
  const geoDir = path.join(projDir, "assets", "geo");
  const outDir = path.join(geoDir, "osm-diem");
  fs.mkdirSync(outDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  let feature;
  if (cmd === "diem") {
    const hits = await getJson(nominatimUrl(a));
    if (!hits.length) throw new Error(`OSM không có "${a}". Lấy tọa độ từ app Google Maps rồi thêm vào build-geo.mjs.`);
    hits.forEach((h, i) => console.log(`${i ? "  " : "→ "}${h.display_name} | ${h.lat}, ${h.lon}`));
    feature = nominatimToFeature(key, hits[0], today);
  } else {
    const r = await getJson(osrmUrl(findPoint(geoDir, a), findPoint(geoDir, b)));
    if (r.code !== "Ok" || !r.routes?.length) throw new Error(`OSRM không trả tuyến (${r.code})`);
    feature = osrmToFeature(key, r.routes[0], today);
    console.log(`→ ${feature.properties.km} km, khoảng ${feature.properties.phut} phút lái xe`);
  }
  const file = path.join(outDir, `${cmd}-${key}.geojson`);
  fs.writeFileSync(file, JSON.stringify({ type: "FeatureCollection", features: [feature] }, null, 2) + "\n"); // dùng trong spec: file + featureKey
  console.log(`Đã lưu ${path.relative(path.dirname(projDir), file)}. Thêm dòng "${feature.properties.sourceId}" vào assets/geo/NGUON.md và bảng nguồn kịch bản.`);
}
