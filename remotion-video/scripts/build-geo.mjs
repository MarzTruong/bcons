// Tạo các file GeoJSON trong public/geo/ từ tọa độ có nguồn (chạy lại được, kết quả tất định).
// Tọa độ theo [kinh độ, vĩ độ]. Nguồn từng điểm ghi trong docs/video/geo-nguon.md.
// Tuyến và vùng ở đây là MINH HỌA (nối các điểm thật), không phải tuyến/ranh giới chính thức.
import fs from "node:fs";
import * as turf from "@turf/turf";

const FETCHED = "2026-11-04";
const POINTS = {
  "ben-luc": { name: "Bến Lức", lngLat: [106.4715, 10.652265], sourceId: "geo-ben-luc" },
  "phuoc-an": { name: "Cảng Phước An", lngLat: [106.9942243322939, 10.616353354639697], sourceId: "geo-phuoc-an" },
  "long-thanh": { name: "Sân bay QT Long Thành", lngLat: [107.04195752766535, 10.773541785186673], sourceId: "geo-long-thanh" },
  "central-park": { name: "Bcons Central Park", lngLat: [106.84408654581377, 10.959874417285395], sourceId: "geo-central-park" },
};

const points = turf.featureCollection(
  Object.entries(POINTS).map(([key, p]) =>
    turf.point(p.lngLat, { key, name: p.name, sourceId: p.sourceId, fetchedAt: FETCHED }),
  ),
);
const line = turf.lineString([POINTS["ben-luc"].lngLat, POINTS["long-thanh"].lngLat], {
  kind: "illustrative",
  name: "Tuyến minh họa Bến Lức - Long Thành (đường thẳng nối hai điểm, không phải hình tuyến thật)",
  sourceId: "geo-minh-hoa",
});
const ring = [POINTS["central-park"], POINTS["long-thanh"], POINTS["phuoc-an"]].map((p) => p.lngLat);
const triangle = turf.polygon([[...ring, ring[0]]], {
  kind: "illustrative",
  name: "Tam giác kết nối: Bcons Central Park - Sân bay Long Thành - Cảng Phước An (nối 3 điểm thật, không phải ranh giới)",
  sourceId: "geo-minh-hoa",
});

const out = {
  "diem-moc.geojson": points,
  "tuyen-minh-hoa-ben-luc-long-thanh.geojson": line,
  "tam-giac-ket-noi.geojson": triangle,
};
// Aeon Mall Biên Hòa: chưa có tọa độ khu đất thật. Điểm dưới đây do anh chọn làm điểm tạm (05/11/2026),
// ghi trong bảng nguồn là "gần đúng". Khi có tọa độ thật thì sửa ở đây và chạy lại (đổi sang `provisional` để chặn render nếu cần).
out["aeon.geojson"] = turf.featureCollection([
  turf.point([106.83520655583497, 10.927817077580567], {
    key: "aeon",
    name: "Aeon Mall Biên Hòa",
    sourceId: "geo-aeon",
    fetchedAt: FETCHED,
    approximate: "điểm tạm do anh chọn, chưa phải tọa độ khu đất Aeon",
  }),
]);
for (const [file, data] of Object.entries(out)) {
  fs.writeFileSync(`public/geo/${file}`, JSON.stringify(data, null, 2) + "\n");
}
const km = (a, b) => turf.distance(POINTS[a].lngLat, POINTS[b].lngLat).toFixed(1);
console.log("Đường chim bay (km):", {
  "central-park→long-thanh": km("central-park", "long-thanh"),
  "central-park→phuoc-an": km("central-park", "phuoc-an"),
  "ben-luc→long-thanh": km("ben-luc", "long-thanh"),
});
