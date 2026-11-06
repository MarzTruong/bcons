// Tạo lớp MINH HỌA suy ra từ ranh OSM (chạy sau geo-fetch): phân vùng KCN Biên Hòa 1 và đường chim bay có ghi km.
// Chạy: npm run geo:derive. Kết quả trong du-an/<mã>/assets/geo/minh-hoa/. Mọi lớp ở đây có kind "illustrative".
// Phân vùng: cắt đa giác OSM của KCN Biên Hòa 1 bằng hình tròn theo đúng TỈ LỆ DIỆN TÍCH tin báo (44 / 286 ha, lô 51,6 và 21,5 ha),
// vị trí là tùy ý (chưa có ranh thật), nên luôn gắn nhãn "minh họa".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as turf from "@turf/turf";
import { projectDir, readActiveProject } from "./project.mjs";

const GEO = path.join(projectDir(readActiveProject()), "assets", "geo");
const OUT = path.join(GEO, "minh-hoa");
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(GEO, f), "utf8"));
const osm = (key) => read(`osm/${key}.geojson`).features[0];
const ha = (f) => turf.area(f) / 1e4;
const write = (name, feature) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(turf.featureCollection([feature])) + "\n");
const clean = (f, props) => turf.feature(f.geometry, props);

/** Phần của `poly` nằm trong hình tròn tâm `center` có bán kính sao cho diện tích đúng `targetHa` (tìm nhị phân). */
export function discPart(poly, center, targetHa) {
  const part = (km) => turf.intersect(turf.featureCollection([poly, turf.circle(center, km, { steps: 72, units: "kilometers" })]));
  let [lo, hi] = [0.01, 6];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const p = part(mid);
    if ((p ? ha(p) : 0) > targetHa) hi = mid;
    else lo = mid;
  }
  return part((lo + hi) / 2);
}

function zones() {
  const bh1 = osm("kcn-bien-hoa-1");
  const k = ha(bh1) / 335; // đa giác OSM nhỏ hơn số chính thức: quy các số tin báo theo cùng tỉ lệ
  const mid = turf.pointOnFeature(bh1).geometry.coordinates;
  const [, s, , n] = turf.bbox(bh1);
  // Trung tâm hành chính: vòng quanh một điểm nằm trong phần phía bắc khu (vị trí tùy ý).
  const north = turf.intersect(turf.featureCollection([bh1, turf.bboxPolygon([100, s + (n - s) * 0.7, 112, n + 1])]));
  const adminCenter = turf.pointOnFeature(north).geometry.coordinates;
  const lot516 = discPart(bh1, mid, 51.6 * k);
  const lot215 = discPart(lot516, mid, 21.5 * k);
  const admin = discPart(bh1, adminCenter, 44 * k);
  const urban = turf.difference(turf.featureCollection([bh1, admin]));
  const common = { kind: "illustrative", note: "Minh họa: hình tròn cắt theo tỉ lệ diện tích tin báo, vị trí tùy ý" };
  write("bh1-lo-21-5.geojson", clean(lot215, { ...common, name: "Phần đất đấu giá khoảng 21,5 ha (minh họa)" }));
  write("bh1-lo-51-6.geojson", clean(lot516, { ...common, name: "Lô 51,6 ha (minh họa)" }));
  write("bh1-hanh-chinh.geojson", clean(admin, { ...common, name: "Trung tâm hành chính khoảng 44 ha (minh họa)" }));
  write("bh1-do-thi.geojson", clean(urban, { ...common, name: "Khu đô thị dịch vụ hơn 286 ha (minh họa)" }));
  return { k: +k.toFixed(3), lot215: +ha(lot215).toFixed(1), lot516: +ha(lot516).toFixed(1), admin: +ha(admin).toFixed(1), urban: +ha(urban).toFixed(1) };
}

const vn = (km) => km.toFixed(1).replace(".", ",");

/** Đường chim bay từ dự án tới các khu/điểm, nhãn "khoảng X km" tính bằng Turf từ tọa độ có nguồn. */
function distanceLines() {
  const project = read("diem-moc.geojson").features.find((f) => f.properties.key === "central-park").geometry.coordinates;
  const aeon = read("aeon.geojson").features[0].geometry.coordinates;
  const targets = {
    loteco: turf.centerOfMass(osm("kcn-loteco")).geometry.coordinates,
    "bien-hoa-2": turf.centerOfMass(osm("kcn-bien-hoa-2")).geometry.coordinates,
    amata: turf.centerOfMass(osm("kcn-amata")).geometry.coordinates,
    "bien-hoa-1": turf.centerOfMass(osm("kcn-bien-hoa-1")).geometry.coordinates,
    aeon,
  };
  const out = {};
  for (const [key, to] of Object.entries(targets)) {
    const km = turf.distance(project, to);
    out[key] = +km.toFixed(2);
    const line = turf.lineString([project, to], {
      kind: "illustrative",
      label: `khoảng ${vn(km)} km`,
      note: "Đường chim bay từ Bcons Central Park đến tâm khu (tính bằng Turf), không phải quãng đường đi",
    });
    fs.writeFileSync(path.join(OUT, `km-${key}.geojson`), JSON.stringify(turf.featureCollection([line])) + "\n");
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log("Phân vùng (ha, theo đa giác OSM):", zones());
  console.log("Đường chim bay (km):", distanceLines());
}
