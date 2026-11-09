// Lấy tọa độ điểm (Places API New) và tuyến đường lái xe thật (Routes API) từ Google Maps Platform,
// lưu GeoJSON vào du-an/<mã>/assets/geo/google/ để Mapbox trong Remotion vẽ. Tốn phí theo lượt gọi (Google Cloud).
// Key: biến môi trường GOOGLE_MAPS_API_KEY (máy anh: engine/remotion/.env). Trên cloud, proxy tự gắn key
// vào header X-Goog-Api-Key, chạy với GOOGLE_MAPS_API_KEY=dummy NODE_USE_ENV_PROXY=1.
//
//   npm run geo:google -- diem <key> "<từ khóa tìm>"          vd. diem tan-hiep "Nút giao Tân Hiệp, Đồng Nai"
//   npm run geo:google -- tuyen <key> <điểm đầu> <điểm cuối>   vd. tuyen du-an-san-bay central-park long-thanh
// Điểm đầu/cuối là key trong diem-moc.geojson hoặc google/diem-*.geojson. Ghi thêm dòng nguồn vào assets/geo/NGUON.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { takeProjectFlag } from "./project.mjs";

const inVietnam = ([lng, lat]) => lng >= 102 && lng <= 110 && lat >= 8 && lat <= 24;

/** Giải mã chuỗi polyline của Google → mảng [kinh độ, vĩ độ]. */
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

export function placeToFeature(key, place, fetchedAt) {
  const coords = [place.location.longitude, place.location.latitude];
  if (!inVietnam(coords)) throw new Error(`Điểm "${key}" (${coords}) nằm ngoài Việt Nam: kiểm lại từ khóa tìm.`);
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: coords },
    properties: {
      key,
      name: place.displayName?.text ?? key,
      diaChi: place.formattedAddress ?? "",
      placeId: place.id ?? "",
      sourceId: `geo-${key}`,
      nguon: "Google Places API",
      fetchedAt,
    },
  };
}

export function routeToFeature(key, route, fetchedAt) {
  const coords = decodePolyline(route.polyline.encodedPolyline);
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: {
      key,
      kind: "official",
      km: Math.round(route.distanceMeters / 100) / 10,
      phut: Math.round(parseInt(route.duration, 10) / 60),
      sourceId: `geo-${key}`,
      nguon: "Google Routes API (đường lái xe)",
      fetchedAt,
    },
  };
}

export function placesRequest(query, key) {
  return {
    url: "https://places.googleapis.com/v1/places:searchText",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location" },
    body: JSON.stringify({ textQuery: query, languageCode: "vi", regionCode: "VN", maxResultCount: 3 }),
  };
}

export function routesRequest(from, to, key) {
  const loc = ([lng, lat]) => ({ location: { latLng: { latitude: lat, longitude: lng } } });
  return {
    url: "https://routes.googleapis.com/directions/v2:computeRoutes",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline" },
    body: JSON.stringify({ origin: loc(from), destination: loc(to), travelMode: "DRIVE", languageCode: "vi", units: "METRIC" }),
  };
}

async function post(req) {
  const res = await fetch(req.url, { method: "POST", headers: req.headers, body: req.body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google trả lỗi ${res.status}: ${JSON.stringify(json.error?.message ?? json).slice(0, 300)}`);
  return json;
}

function findPoint(geoDir, key) {
  const files = [path.join(geoDir, "diem-moc.geojson"), ...(fs.existsSync(path.join(geoDir, "google")) ? fs.readdirSync(path.join(geoDir, "google")).filter((f) => f.startsWith("diem-")).map((f) => path.join(geoDir, "google", f)) : [])];
  for (const f of files) {
    const g = JSON.parse(fs.readFileSync(f, "utf8"));
    const feats = g.type === "FeatureCollection" ? g.features : [g];
    const hit = feats.find((x) => x.properties?.key === key);
    if (hit) return hit.geometry.coordinates;
  }
  throw new Error(`Không thấy điểm "${key}" trong ${path.relative(process.cwd(), geoDir)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
  const [cmd, key, a, b] = rest;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Thiếu GOOGLE_MAPS_API_KEY (máy anh: thêm vào engine/remotion/.env).");
    process.exit(1);
  }
  if (!/^[a-z0-9-]+$/.test(key ?? "")) {
    console.error('Cách dùng: diem <key> "<từ khóa>" | tuyen <key> <điểm đầu> <điểm cuối> (key: a-z, 0-9, -)');
    process.exit(1);
  }
  const geoDir = path.join(projDir, "assets", "geo");
  const outDir = path.join(geoDir, "google");
  fs.mkdirSync(outDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  let feature;
  if (cmd === "diem") {
    const r = await post(placesRequest(a, apiKey));
    if (!r.places?.length) throw new Error(`Google không tìm thấy "${a}"`);
    r.places.forEach((p, i) => console.log(`${i ? "  " : "→ "}${p.displayName?.text} | ${p.formattedAddress} | ${p.location.latitude}, ${p.location.longitude}`));
    feature = placeToFeature(key, r.places[0], today);
  } else if (cmd === "tuyen") {
    const r = await post(routesRequest(findPoint(geoDir, a), findPoint(geoDir, b), apiKey));
    if (!r.routes?.length) throw new Error("Google không trả tuyến nào");
    feature = routeToFeature(key, r.routes[0], today);
    console.log(`→ ${feature.properties.km} km, khoảng ${feature.properties.phut} phút lái xe`);
  } else {
    console.error("Lệnh phải là diem hoặc tuyen");
    process.exit(1);
  }
  const file = path.join(outDir, `${cmd}-${key}.geojson`);
  fs.writeFileSync(file, JSON.stringify({ type: "FeatureCollection", features: [feature] }, null, 2) + "\n"); // dùng trong spec: file + featureKey
  console.log(`Đã lưu ${path.relative(path.join(projDir, ".."), file)}. Nhớ thêm dòng "${feature.properties.sourceId}" vào assets/geo/NGUON.md và bảng nguồn kịch bản.`);
}
