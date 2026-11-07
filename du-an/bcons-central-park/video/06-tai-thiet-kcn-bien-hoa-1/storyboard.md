# Storyboard video `06-tai-thiet-kcn-bien-hoa-1` (05/11/2026)

Trạng thái: **chờ anh duyệt storyboard trước khi làm code và render.** Lời bình, giọng đọc và số liệu giữ nguyên (đã duyệt), nên không tốn thêm credit ElevenLabs. Mốc giây lấy từ `du-an/bcons-central-park/video/06-tai-thiet-kcn-bien-hoa-1/timestamps.json` (tính từ đầu từng cảnh). Kiểu: màu `navy`, chuyển động `nay`. Nền bản đồ đề xuất: ảnh vệ tinh có đường (`satellite-streets-v12`) để thấy khu đất thật; nếu anh muốn sáng hoặc tối hơn thì đổi.

> **Cập nhật 05/11/2026 (sau khi anh duyệt storyboard):** đã code xong cảnh bản đồ. Khác với bản storyboard ban đầu: (1) ranh KCN là **đa giác thật của OpenStreetMap** (không còn vòng tròn minh họa); (2) nền ảnh vệ tinh Mapbox `satellite-streets-v12`; (3) thẻ số liệu nằm **phía trên** bản đồ (vùng y 1500-1650 dành cho phụ đề); (4) không vẽ ranh phân vùng 44/286 ha và lô 21,5/51,6 ha vì chưa có dữ liệu, chỉ hiện thẻ số; (5) **ảnh phối cảnh đang là ảnh giữ chỗ** và **Aeon đang là điểm tạm**: cổng kiểm tra chặn render đủ cho tới khi có file thật.

> **Cập nhật 05/11/2026 (lần 2):** (1) cảnh dự án zoom tới mức thấy **ranh khu đất OSM** (zoom tối đa 18); (2) video B vẽ **phân vùng minh họa** (44/286 ha, lô 51,6 ha, vùng 21,5 ha) là hình tròn cắt đúng tỉ lệ diện tích tin báo trong đa giác OSM, nét đứt, ghi "minh họa" (script `npm run geo:derive`); (3) có **đường chim bay kèm km** từ dự án tới các khu (tính bằng Turf); (4) Aeon dùng **điểm tạm do anh chọn** (10.927817, 106.835207), ghi "gần đúng".

## Dữ liệu cần trước khi làm
| # | Cần | Tình trạng |
| --- | --- | --- |
| 1 | Tọa độ tâm KCN Biên Hòa 1 (phường Trấn Biên) | **Chưa có.** Mapbox Geocoding và OpenStreetMap không tìm ra. Anh sao chép từ Google Maps. |
| 2 | Tọa độ Aeon Mall Biên Hòa | **Chưa có.** Báo ghi vị trí trên đường Đặng Văn Trơn (phường Hiệp Hòa / Trấn Biên, các nguồn ghi không thống nhất); Mapbox chỉ tìm ra con đường (10,92652; 106,83556), không đủ để ghim đúng khu đất. Anh sao chép tọa độ khu đất từ Google Maps. |
| 3 | Ranh giới KCN Biên Hòa 1 và khu 51,6 ha / 21,5 ha | Chưa có dữ liệu chính thức. Mặc định em vẽ **vòng minh họa đúng diện tích** (335 ha; trong đó khoảng 44 ha, 286 ha, 21,5 ha là hình phân vùng minh họa), nét đứt, có chữ "ranh giới minh họa". Có GeoJSON/KMZ ranh thật thì dùng thay. |
| 4 | Ảnh phối cảnh dự án cho cảnh 4 | **Chưa có file.** Anh chép vào `du-an/bcons-central-park/assets/images/` hoặc gửi vào phiên. |

## Cảnh 1: khoanh và highlight KCN Biên Hòa 1 (14,32 giây)
Thay mẫu `stat-hero` bằng bản đồ toàn màn hình, vẫn giữ con số chạy "21,5 ha" làm điểm nhấn.

| Giây | Lời đọc | Camera | Hiệu ứng trên bản đồ |
| --- | --- | --- | --- |
| 0,0 - 0,6 | "Khu công nghiệp" | Toàn cảnh Biên Hòa (zoom ~11) | Tiêu đề "KCN BIÊN HÒA 1 THÀNH KHU ĐÔ THỊ" hiện trên cùng |
| 0,6 - 2,2 | "Biên Hòa 1 đang thành khu đô thị" | **Lướt và zoom vào KCN Biên Hòa 1** (1,6 giây, zoom ~14) | Đường khoanh **tự vẽ** quanh khu (nét vàng sáng), vùng ngoài khoanh **tối đi** (làm nổi bật), nhãn "KCN BIÊN HÒA 1" |
| 2,2 - 5,8 | "...đang thành khu đô thị. Một khu đất ở đây có phương án đấu giá" | giữ, xoay nhẹ góc nhìn | Màu vùng chuyển từ xám công nghiệp sang vàng (hiệu ứng quét), vòng sóng lan |
| 5,8 | "9.363" | giữ | Huy hiệu nổi "Giá khởi điểm 9.363 tỷ đồng · tin 11/2025" |
| 9,4 - 11,6 | "công bố tháng 11 năm 2025. Trong đó" | zoom nhẹ vào phần trung tâm khu | Một vùng nhỏ hơn bên trong sáng lên (phần được đem đấu) |
| 11,6 | "21,5" | giữ | Số "21,5 ha" chạy lên ở giữa màn hình, vùng 21,5 ha nhấp sáng |

## Cảnh 2: phân vùng 335 ha (12,70 giây)
Bản đồ giữ nguyên ở KCN Biên Hòa 1, 3 thẻ số liệu nằm ở dưới.

| Giây | Lời đọc | Camera | Hiệu ứng |
| --- | --- | --- | --- |
| 0,0 - 4,1 | "Khu công nghiệp đầu tiên của Việt Nam, lập năm 1963" | Giữ vị trí cảnh 1, kéo ra nhẹ (zoom ~13,5) | Chữ "1963" nổi trên nhãn |
| 4,4 | "335" | giữ | Cả đường ranh 335 ha **nhấp sáng một vòng**, thẻ "335 ha" |
| 7,6 | "44" | giữ | Một phần (minh họa, ~44 ha) tô màu xanh dương, nhãn "Trung tâm hành chính", thẻ 2 |
| 10,0 | "286" | giữ | Phần còn lại tô màu vàng, nhãn "Khu đô thị dịch vụ", thẻ 3 |

## Cảnh 3: Aeon Mall, zoom vào rồi zoom ra (12,96 giây)

| Giây | Lời đọc | Camera | Hiệu ứng |
| --- | --- | --- | --- |
| 0,0 - 1,6 | "Khu đất đấu giá nằm trong lô" | Giữ ở KCN Biên Hòa 1 | Vùng 51,6 ha viền lên, thẻ 1 hiện lúc 1,6 ("51,6 ha") |
| 5,2 | "23.000" | giữ | Thẻ 2: "Khoảng 23.000 tỷ" |
| 6,6 - 7,2 | "Ngoài ra," | **Kéo ra** từ KCN rồi **bay tới Aeon Mall Biên Hòa** (1,5 giây, zoom ~15) | Ghim Aeon rơi xuống, vòng sóng |
| 7,2 - 9,6 | "Aeon Mall Biên Hòa có tổng mức đầu tư" | giữ ở Aeon | Nhãn "AEON MALL BIÊN HÒA", thẻ 3 hiện lúc 9,6 ("Hơn 6.000 tỷ") |
| 10,7 - 12,96 | "Biên Hòa đang thay đổi diện mạo" | **Zoom ra toàn cảnh** (zoom ~12) thấy cả KCN Biên Hòa 1 và Aeon | Hai vị trí nhấp sáng, nét đứt nối nhau (minh họa) |

## Cảnh 4: vị trí dự án + 2 điểm đã nhắc + ảnh phối cảnh (11,91 giây)

| Giây | Lời đọc | Camera | Hiệu ứng |
| --- | --- | --- | --- |
| 0,0 - 1,6 | "Bcons Central Park" | Toàn cảnh (zoom ~11,5) có KCN Biên Hòa 1 và Aeon (còn sáng từ cảnh 3) | Ghim đỏ Bcons Central Park rơi xuống, vòng sóng lớn |
| 1,8 - 5,6 | "ở 236 Phan Trung, Tam Hiệp, dự kiến bàn giao quý 2 năm 2029" | **Zoom vào dự án** rồi kéo ra | Nhãn "BCONS CENTRAL PARK · 236 Phan Trung"; nét đứt nối dự án với KCN Biên Hòa 1 và Aeon, **tùy chọn:** ghi km đường chim bay (từ tọa độ thật) |
| 7,0 - 8,8 | "giữa lúc Biên Hòa đang thay đổi diện mạo" | Toàn cảnh thấy **cả 3 vị trí** | Cả 3 điểm nhấp sáng cùng lúc |
| 9,0 - 11,91 | "Muốn bảng nguồn... comment tái thiết" | Bản đồ mờ dần | **Ảnh phối cảnh dự án chèn vào** (cross-fade, phóng nhẹ) với thẻ tên; dòng chữ gõ dần ở dưới: "Comment “tái thiết” để nhận bảng nguồn từng dòng" |

Chữ nhỏ cố định: "© Mapbox © OpenStreetMap", "Ranh giới và đường nối: minh họa", "Hình ảnh phối cảnh mang tính minh họa", "Thông tin mang tính tham khảo". Không số điện thoại, không tên cá nhân.

## Việc code cần làm sau khi anh duyệt
1. Mẫu `geo-map`: camera nhiều chặng (lướt/zoom theo cue), vẽ đường khoanh tự vẽ, làm tối vùng ngoài, tô vùng theo cue, chia vùng minh họa, thẻ số nổi, lớp thẻ số liệu dưới bản đồ, cross-fade sang ảnh.
2. Bảng nguồn thêm: tọa độ KCN Biên Hòa 1, Aeon (anh cung cấp), ảnh phối cảnh.
3. Render thử khung các mốc 1,0 / 5,8 / 11,6 giây cảnh 1, 7,2 giây cảnh 3, 4,0 giây cảnh 4 để anh xem trước khi render đủ.
