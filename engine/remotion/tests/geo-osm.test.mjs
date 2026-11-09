import test from "node:test";
import assert from "node:assert/strict";
import { decodePolyline, nominatimToFeature, osrmToFeature, nominatimUrl, osrmUrl } from "../scripts/geo-osm.mjs";

test("decodePolyline: đúng ví dụ chuẩn của thuật toán polyline (OSRM dùng cùng kiểu mã hóa với Google)", () => {
  // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
  assert.deepEqual(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@"), [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]);
});

test("nominatimToFeature: kết quả Nominatim thật (nút giao Tân Vạn, OSM way 563802782) → điểm có nguồn OSM; ngoài Việt Nam thì báo lỗi", () => {
  const hit = { osm_type: "way", osm_id: 563802782, lat: "10.8982712", lon: "106.8299365", display_name: "Cầu vượt Nút giao Tân Vạn, Xa lộ Hà Nội, Ngãi Thắng, Phường Đông Hòa, Thành phố Hồ Chí Minh, 75308, Việt Nam" };
  const f = nominatimToFeature("tan-van", hit, "2026-11-09");
  assert.deepEqual(f.geometry.coordinates, [106.8299365, 10.8982712]);
  assert.equal(f.properties.sourceId, "geo-tan-van");
  assert.equal(f.properties.nguon, "OpenStreetMap (Nominatim)");
  assert.equal(f.properties.link, "https://www.openstreetmap.org/way/563802782");
  assert.throws(() => nominatimToFeature("x", { ...hit, lat: "48.8", lon: "2.3" }, "2026-11-09"), /Việt Nam/);
});

test("osrmToFeature: tuyến OSRM → LineString đường xe chạy thật (official), km + phút", () => {
  const route = { distance: 31245.6, duration: 2280.4, geometry: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" };
  const f = osrmToFeature("du-an-san-bay", route, "2026-11-09");
  assert.equal(f.geometry.type, "LineString");
  assert.equal(f.properties.kind, "official");
  assert.equal(f.properties.km, 31.2);
  assert.equal(f.properties.phut, 38);
  assert.equal(f.properties.nguon, "OpenStreetMap (OSRM, đường lái xe)");
});

test("nominatimUrl/osrmUrl: đúng máy chủ OSM, giới hạn Việt Nam, tọa độ theo thứ tự kinh độ,vĩ độ", () => {
  const n = new URL(nominatimUrl("Nút giao Tân Vạn"));
  assert.equal(n.host, "nominatim.openstreetmap.org");
  assert.equal(n.searchParams.get("countrycodes"), "vn");
  assert.equal(n.searchParams.get("q"), "Nút giao Tân Vạn");
  assert.equal(osrmUrl([106.84408654581377, 10.959874417285395], [107.0385183569583, 10.674713488386246]),
    "https://router.project-osrm.org/route/v1/driving/106.84408654581377,10.959874417285395;107.0385183569583,10.674713488386246?overview=full&geometries=polyline");
});
