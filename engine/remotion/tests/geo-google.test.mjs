import test from "node:test";
import assert from "node:assert/strict";
import { decodePolyline, placeToFeature, routeToFeature, placesRequest, routesRequest } from "../scripts/geo-google.mjs";

test("decodePolyline: đúng ví dụ chuẩn trong tài liệu Google (Encoded Polyline Algorithm)", () => {
  // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
  const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
  assert.deepEqual(pts, [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]], "[kinh độ, vĩ độ]");
});

test("placeToFeature: điểm Places (New) → GeoJSON có key, tên, nguồn, ngày lấy; ngoài Việt Nam thì báo lỗi", () => {
  const place = { displayName: { text: "Nút giao Tân Vạn" }, formattedAddress: "Biên Hòa, Đồng Nai", location: { latitude: 10.8982712, longitude: 106.8299365 }, id: "ChIJxyz" };
  const f = placeToFeature("tan-van", place, "2026-11-09");
  assert.deepEqual(f.geometry.coordinates, [106.8299365, 10.8982712]);
  assert.equal(f.properties.key, "tan-van");
  assert.equal(f.properties.sourceId, "geo-tan-van");
  assert.equal(f.properties.nguon, "Google Places API");
  assert.equal(f.properties.fetchedAt, "2026-11-09");
  assert.throws(() => placeToFeature("x", { ...place, location: { latitude: 48.8, longitude: 2.3 } }, "2026-11-09"), /Việt Nam/);
});

test("routeToFeature: tuyến Routes API → LineString thật (kind official), kèm km và phút", () => {
  const route = { distanceMeters: 31245, duration: "2280s", polyline: { encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" } };
  const f = routeToFeature("du-an-san-bay", route, "2026-11-09");
  assert.equal(f.geometry.type, "LineString");
  assert.equal(f.geometry.coordinates.length, 3);
  assert.equal(f.properties.kind, "official");
  assert.equal(f.properties.km, 31.2);
  assert.equal(f.properties.phut, 38);
  assert.equal(f.properties.nguon, "Google Routes API (đường lái xe)");
});

test("placesRequest/routesRequest: gọi đúng endpoint, key đi bằng header do proxy/biến môi trường gắn, không nằm trong URL", () => {
  const p = placesRequest("Nút giao Tân Hiệp, Đồng Nai", "k");
  assert.equal(p.url, "https://places.googleapis.com/v1/places:searchText");
  assert.equal(p.headers["X-Goog-Api-Key"], "k");
  assert.match(p.headers["X-Goog-FieldMask"], /places\.location/);
  assert.equal(JSON.parse(p.body).languageCode, "vi");
  const r = routesRequest([106.844, 10.96], [107.042, 10.774], "k");
  assert.equal(r.url, "https://routes.googleapis.com/directions/v2:computeRoutes");
  assert.equal(JSON.parse(r.body).origin.location.latLng.latitude, 10.96);
  assert.doesNotMatch(r.url, /key=/);
});
