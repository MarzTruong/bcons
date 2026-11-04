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
