# Nguồn dữ liệu địa lý cho video bản đồ

Tạo file bằng `engine/remotion/scripts/build-geo.mjs` (kết quả trong `du-an/bcons-central-park/assets/geo/`). Tọa độ theo [kinh độ, vĩ độ]. Ngày lấy: 04/11/2026.

Nền bản đồ: Mapbox (© Mapbox, © OpenStreetMap contributors). Chú thích này phải hiện trên màn hình mọi cảnh có bản đồ.

## Bảng nguồn

| id | Điểm | Ngày lấy | Nguồn | Link | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| geo-central-park | Bcons Central Park: 10.959874417285395, 106.84408654581377 (vĩ độ, kinh độ) | 04/11/2026 | Anh cung cấp (sao chép từ Google Maps) | https://www.google.com/maps?q=10.959874417285395,106.84408654581377 | Vị trí dự án theo anh. |
| geo-phuoc-an | Cảng Phước An: 10.616353354639697, 106.9942243322939 | 04/11/2026 | Anh cung cấp (Google Maps) | https://www.google.com/maps?q=10.616353354639697,106.9942243322939 | |
| geo-long-thanh | Sân bay Long Thành: 10.773541785186673, 107.04195752766535 | 04/11/2026 | Anh cung cấp (Google Maps) | https://www.google.com/maps?q=10.773541785186673,107.04195752766535 | |
| geo-ben-luc | Bến Lức: 10.652265, 106.4715 (vĩ độ, kinh độ) | 04/11/2026 | Mapbox Geocoding API (truy vấn "Bến Lức, Long An") | https://docs.mapbox.com/api/search/geocoding/ | Điểm gần đúng khu vực Bến Lức (An Thanh), không phải mốc chính thức của tuyến cao tốc. |
| geo-tan-hiep | Nút giao Tân Hiệp (cao tốc Biên Hòa – Vũng Tàu giao Bến Lức – Long Thành): 10.674713488386246, 107.0385183569583 | 09/11/2026 | Anh cung cấp (Google Maps) | https://www.google.com/maps?q=10.674713488386246,107.0385183569583 | OSM không có tên nút giao này. Cách dự án khoảng 38 km đường chim bay. |
| geo-tan-van | Nút giao Tân Vạn: 10.8982712, 106.8299365 | 09/11/2026 | OpenStreetMap (Nominatim), way 563802782 | https://www.openstreetmap.org/way/563802782 | File `osm-diem/diem-tan-van.geojson` |
| geo-du-an-tan-van | Tuyến lái xe dự án → nút giao Tân Vạn: 10,8 km, ~11 phút | 09/11/2026 | OpenStreetMap (OSRM) | https://router.project-osrm.org | File `osm-diem/tuyen-du-an-tan-van.geojson`. Phút là ước tính không kẹt xe. |
| geo-du-an-san-bay | Tuyến lái xe dự án → sân bay Long Thành: 33,2 km, ~41 phút | 09/11/2026 | OpenStreetMap (OSRM) | https://router.project-osrm.org | File `osm-diem/tuyen-du-an-san-bay.geojson`. Phút là ước tính không kẹt xe. |
| geo-du-an-tan-hiep | Tuyến lái xe dự án → nút giao Tân Hiệp: OSRM ra 70,4 km | 09/11/2026 | OpenStreetMap (OSRM) | https://router.project-osrm.org | **Không dùng số km/phút này**: nút giao chưa thông xe nên OSRM đi vòng. Chỉ dùng điểm, không vẽ tuyến. |

## Lớp minh họa (không có nguồn chính thức, luôn ghi "minh họa" trên màn hình)

- `tuyen-minh-hoa-ben-luc-long-thanh.geojson`: đường thẳng nối Bến Lức và sân bay Long Thành. **Không phải hình tuyến cao tốc thật.** Em chưa lấy được hình tuyến thật: máy chủ OpenStreetMap (Overpass, Nominatim) không trả dữ liệu ngày 04/11/2026, và Mapbox Directions chọn đường vòng 92 km không đi qua cao tốc này.
- `tam-giac-ket-noi.geojson`: tam giác nối ba điểm thật (Bcons Central Park, sân bay Long Thành, Cảng Phước An). Không phải ranh giới hành chính hay vùng quy hoạch.

Khi có dữ liệu chính thức (hình tuyến cao tốc, ranh giới Biên Hòa/khu thương mại tự do Long Thành), thay vào `du-an/bcons-central-park/assets/geo/` và thêm hàng vào bảng trên.

Đường chim bay (tính bằng Turf, 04/11/2026): Bcons Central Park đến sân bay Long Thành khoảng 29,9 km; đến Cảng Phước An khoảng 41,6 km; Bến Lức đến sân bay Long Thành khoảng 63,8 km. Đây là khoảng cách đường thẳng, không phải quãng đường đi.

## Ranh giới từ OpenStreetMap (05/11/2026)

Script `engine/remotion/scripts/geo-fetch.mjs` (`npm run geo:fetch`) lấy đa giác từ file Overpass Turbo trong `assets/geo/osm-xuat/` (hoặc gọi Overpass), lưu `du-an/bcons-central-park/assets/geo/osm/<khu>.geojson` kèm diện tích, tâm, khung bao. Tìm vật thể theo tên: `npm run geo:fetch -- --search "Aeon" --bbox 10.88,106.80,10.98,106.90`.

| Khu | Mã OSM | Diện tích đa giác | Số chính thức |
| --- | --- | --- | --- |
| Loteco | way/583464298 | 99,9 ha | 100 ha |
| Biên Hòa II | way/306132369 | 401,9 ha | 394,63 ha |
| Amata (chưa gộp phần mở rộng way/1016015905, 185,9 ha) | way/583464295 | 416,9 ha | 513,01 ha |
| Biên Hòa 1 | way/568387663 | 298,1 ha | 335 ha |

Ranh OSM do cộng đồng vẽ, không phải ranh pháp lý. Điểm Aeon Mall (`du-an/bcons-central-park/assets/geo/aeon.geojson`) đang đánh dấu `provisional`: cổng kiểm tra chặn render cho tới khi có tọa độ thật.

Lớp suy ra (minh họa) tạo bằng `npm run geo:derive` vào `du-an/bcons-central-park/assets/geo/minh-hoa/`: phân vùng KCN Biên Hòa 1 (hình tròn cắt theo tỉ lệ diện tích tin báo, vị trí tùy ý) và đường chim bay từ dự án tới tâm các khu kèm km (Turf). Aeon Mall dùng điểm tạm anh chọn 05/11/2026: 10.927817077580567, 106.83520655583497.

Chạy script từ thư mục `engine/remotion` (không chạy từ thư mục gốc `bcons`, vì `package.json` nằm trong `engine/remotion`).

## OpenStreetMap: Nominatim + OSRM (từ 09/11/2026)

Google Maps Platform cấm dùng tại Việt Nam, nên dùng OpenStreetMap. Lệnh (chạy trong `engine/remotion`; trên cloud thêm `NODE_USE_ENV_PROXY=1`):
- `npm run geo:osm -- diem <key> "<từ khóa>"`: tìm tọa độ (Nominatim).
- `npm run geo:osm -- tuyen <key> <điểm đầu> <điểm cuối>`: tuyến lái xe thật (OSRM), kèm km và phút (không tính kẹt xe).
Kết quả lưu ở `du-an/bcons-central-park/assets/geo/osm-diem/`. Dữ liệu OSM được lưu lại, chỉ cần ghi "© OpenStreetMap" (video bản đồ đã có). Máy chủ miễn phí: gọi thưa (≤ 1 lượt/giây), không chạy hàng loạt. Điểm OSM không có tên thì anh lấy tọa độ từ app Google Maps, thêm vào `engine/remotion/scripts/build-geo.mjs`.
