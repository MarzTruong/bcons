import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseSpec } from "../src/spec.ts";
import { checkCues, checkGeoFiles } from "../scripts/spec-tools.mjs";

const geoProps = (over = {}) => ({
  kicker: "K",
  title: "T",
  mapStyle: "mapbox://styles/mapbox/dark-v11",
  camera: { center: [106.9, 10.8], zoom: 8.5 },
  points: [
    { key: "a", label: "A", file: "geo/p.geojson", featureKey: "a", color: "red", cueKey: "c1", offset: 0, sourceId: "s1" },
  ],
  lines: [{ key: "l", file: "geo/l.geojson", kind: "illustrative", color: "teal", cueKey: "c1", drawFrames: 60 }],
  areas: [{ key: "t", file: "geo/t.geojson", kind: "illustrative", label: "Vùng minh họa", cueKey: "c1" }],
  note: "Sơ đồ minh họa",
  ...over,
});
const spec = (props, cues = { c1: "xin" }) => ({
  name: "demo",
  status: "draft",
  scenes: [{ id: "scene1", template: "geo-map", markup: "xin chào", cues, props }],
});

test("geo-map hợp lệ parse được (lớp minh họa không cần sourceId)", () => {
  assert.equal(parseSpec(spec(geoProps())).scenes[0].template, "geo-map");
});
test("điểm thiếu sourceId báo đúng đường dẫn", () => {
  const p = geoProps();
  delete p.points[0].sourceId;
  assert.throws(() => parseSpec(spec(p)), /scenes\.0\.props\.points\.0\.sourceId/);
});
test("vùng official bắt buộc có sourceId", () => {
  const p = geoProps({ areas: [{ key: "t", file: "x", kind: "official", label: "L", cueKey: "c1" }] });
  assert.throws(() => parseSpec(spec(p)), /sourceId/);
});
test("kind lạ bị từ chối; mapStyle phải là mapbox://styles/", () => {
  assert.throws(() => parseSpec(spec(geoProps({ areas: [{ key: "t", file: "x", kind: "x", label: "L", cueKey: "c1" }] }))));
  assert.throws(() => parseSpec(spec(geoProps({ mapStyle: "https://evil.example/style.json" }))));
});
test("checkCues bắt cueKey thiếu của geo-map", () => {
  assert.match(checkCues(parseSpec(spec(geoProps(), {}))).join("\n"), /"c1"/);
  assert.deepEqual(checkCues(parseSpec(spec(geoProps()))), []);
});

function geoDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bcons-geo-"));
  fs.mkdirSync(path.join(dir, "geo"));
  for (const [f, data] of Object.entries(files)) fs.writeFileSync(path.join(dir, "geo", f), JSON.stringify(data));
  return dir;
}
const pt = (lngLat, key = "a") => ({ type: "Feature", properties: { key }, geometry: { type: "Point", coordinates: lngLat } });
const fc = (...f) => ({ type: "FeatureCollection", features: f });
const line = (c) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: c } });
const poly = (c) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [c] } });
const good = () => ({
  "p.geojson": fc(pt([106.8, 10.9])),
  "l.geojson": line([[106.4, 10.6], [107.0, 10.7]]),
  "t.geojson": poly([[106.8, 10.9], [107.0, 10.7], [106.9, 10.6], [106.8, 10.9]]),
});

test("checkGeoFiles pass khi file đủ và tọa độ [lng, lat] trong Việt Nam", () => {
  assert.deepEqual(checkGeoFiles(parseSpec(spec(geoProps())), geoDir(good())), []);
});
test("checkGeoFiles bắt file thiếu", () => {
  const f = good();
  delete f["l.geojson"];
  assert.match(checkGeoFiles(parseSpec(spec(geoProps())), geoDir(f)).join("\n"), /l\.geojson/);
});
test("checkGeoFiles bắt tọa độ đảo [lat, lng]", () => {
  const f = good();
  f["p.geojson"] = fc(pt([10.9, 106.8]));
  assert.match(checkGeoFiles(parseSpec(spec(geoProps())), geoDir(f)).join("\n"), /\[kinh độ, vĩ độ\]/);
});
test("checkGeoFiles bắt featureKey không có trong file", () => {
  const f = good();
  f["p.geojson"] = fc(pt([106.8, 10.9], "khac"));
  assert.match(checkGeoFiles(parseSpec(spec(geoProps())), geoDir(f)).join("\n"), /properties.key = "a".*featureKey/s);
});
