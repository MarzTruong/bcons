# Nguồn dữ liệu địa lý cho video bản đồ

Tạo file bằng `remotion-video/scripts/build-geo.mjs` (kết quả trong `remotion-video/public/geo/`). Tọa độ theo [kinh độ, vĩ độ]. Ngày lấy: 04/11/2026.

Nền bản đồ: Mapbox (© Mapbox, © OpenStreetMap contributors). Chú thích này phải hiện trên màn hình mọi cảnh có bản đồ.

## Bảng nguồn

| id | Điểm | Ngày lấy | Nguồn | Link | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| geo-central-park | Bcons Central Park: 10.959874417285395, 106.84408654581377 (vĩ độ, kinh độ) | 04/11/2026 | Anh cung cấp (sao chép từ Google Maps) | https://www.google.com/maps?q=10.959874417285395,106.84408654581377 | Vị trí dự án theo anh. |
| geo-phuoc-an | Cảng Phước An: 10.616353354639697, 106.9942243322939 | 04/11/2026 | Anh cung cấp (Google Maps) | https://www.google.com/maps?q=10.616353354639697,106.9942243322939 | |
| geo-long-thanh | Sân bay Long Thành: 10.773541785186673, 107.04195752766535 | 04/11/2026 | Anh cung cấp (Google Maps) | https://www.google.com/maps?q=10.773541785186673,107.04195752766535 | |
| geo-ben-luc | Bến Lức: 10.652265, 106.4715 (vĩ độ, kinh độ) | 04/11/2026 | Mapbox Geocoding API (truy vấn "Bến Lức, Long An") | https://docs.mapbox.com/api/search/geocoding/ | Điểm gần đúng khu vực Bến Lức (An Thanh), không phải mốc chính thức của tuyến cao tốc. |

## Lớp minh họa (không có nguồn chính thức, luôn ghi "minh họa" trên màn hình)

- `tuyen-minh-hoa-ben-luc-long-thanh.geojson`: đường thẳng nối Bến Lức và sân bay Long Thành. **Không phải hình tuyến cao tốc thật.** Em chưa lấy được hình tuyến thật: máy chủ OpenStreetMap (Overpass, Nominatim) không trả dữ liệu ngày 04/11/2026, và Mapbox Directions chọn đường vòng 92 km không đi qua cao tốc này.
- `tam-giac-ket-noi.geojson`: tam giác nối ba điểm thật (Bcons Central Park, sân bay Long Thành, Cảng Phước An). Không phải ranh giới hành chính hay vùng quy hoạch.

Khi có dữ liệu chính thức (hình tuyến cao tốc, ranh giới Biên Hòa/khu thương mại tự do Long Thành), thay vào `public/geo/` và thêm hàng vào bảng trên.

Đường chim bay (tính bằng Turf, 04/11/2026): Bcons Central Park đến sân bay Long Thành khoảng 29,9 km; đến Cảng Phước An khoảng 41,6 km; Bến Lức đến sân bay Long Thành khoảng 63,8 km. Đây là khoảng cách đường thẳng, không phải quãng đường đi.

## Ranh giới từ OpenStreetMap (05/11/2026)

Script `remotion-video/scripts/geo-fetch.mjs` (`npm run geo:fetch`) lấy đa giác từ file Overpass Turbo trong `map/` (hoặc gọi Overpass), lưu `public/geo/osm/<khu>.geojson` kèm diện tích, tâm, khung bao. Tìm vật thể theo tên: `npm run geo:fetch -- --search "Aeon" --bbox 10.88,106.80,10.98,106.90`.

| Khu | Mã OSM | Diện tích đa giác | Số chính thức |
| --- | --- | --- | --- |
| Loteco | way/583464298 | 99,9 ha | 100 ha |
| Biên Hòa II | way/306132369 | 401,9 ha | 394,63 ha |
| Amata (chưa gộp phần mở rộng way/1016015905, 185,9 ha) | way/583464295 | 416,9 ha | 513,01 ha |
| Biên Hòa 1 | way/568387663 | 298,1 ha | 335 ha |

Ranh OSM do cộng đồng vẽ, không phải ranh pháp lý. Điểm Aeon Mall (`public/geo/aeon.geojson`) đang đánh dấu `provisional`: cổng kiểm tra chặn render cho tới khi có tọa độ thật.

Lớp suy ra (minh họa) tạo bằng `npm run geo:derive` vào `public/geo/minh-hoa/`: phân vùng KCN Biên Hòa 1 (hình tròn cắt theo tỉ lệ diện tích tin báo, vị trí tùy ý) và đường chim bay từ dự án tới tâm các khu kèm km (Turf). Aeon Mall dùng điểm tạm anh chọn 05/11/2026: 10.927817077580567, 106.83520655583497.

Chạy script từ thư mục `remotion-video` (không chạy từ thư mục gốc `bcons`, vì `package.json` nằm trong `remotion-video`).
