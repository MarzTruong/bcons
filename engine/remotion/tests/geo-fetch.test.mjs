import test from "node:test";
import assert from "node:assert/strict";
import { overpassToFeatures, buildArea } from "../scripts/geo-fetch.mjs";

const square = [
  { lat: 10.0, lon: 106.0 },
  { lat: 10.0, lon: 106.01 },
  { lat: 10.01, lon: 106.01 },
  { lat: 10.01, lon: 106.0 },
  { lat: 10.0, lon: 106.0 },
];

test("way kín thành đa giác, way hở bị bỏ", () => {
  const m = overpassToFeatures({
    elements: [
      { type: "way", id: 1, tags: { name: "A" }, geometry: square },
      { type: "way", id: 2, geometry: square.slice(0, 4) },
    ],
  });
  assert.deepEqual([...m.keys()], ["way/1"]);
  assert.equal(m.get("way/1").geometry.type, "Polygon");
});

test("buildArea tính diện tích, tâm, khung bao", () => {
  const m = overpassToFeatures({ elements: [{ type: "way", id: 1, tags: { name: "A" }, geometry: square }] });
  const f = buildArea({ key: "a", name: "A", osmIds: ["way/1"], refHa: 100 }, [...m.values()]);
  assert.ok(f.properties.areaHa > 100 && f.properties.areaHa < 130);
  assert.deepEqual(f.properties.bbox, [106, 10, 106.01, 10.01]);
  assert.equal(f.properties.center.length, 2);
});

test("hai đa giác gộp thành MultiPolygon", () => {
  const m = overpassToFeatures({
    elements: [
      { type: "way", id: 1, geometry: square },
      { type: "way", id: 2, geometry: square.map((p) => ({ lat: p.lat + 1, lon: p.lon })) },
    ],
  });
  const f = buildArea({ key: "b", name: "B", osmIds: ["way/1", "way/2"] }, [...m.values()]);
  assert.equal(f.geometry.type, "MultiPolygon");
});
