# Storyboard video `cho-thue-kcn-bien-hoa-2026` (05/11/2026)

Trạng thái: **chờ anh duyệt storyboard trước khi làm code và render.** Lời bình, giọng đọc và số liệu giữ nguyên (đã duyệt), nên không tốn thêm credit ElevenLabs. Mọi mốc giây dưới đây lấy từ `specs/cho-thue-kcn-bien-hoa-2026.timestamps.json` (giây tính từ đầu từng cảnh). Kiểu: màu `sang` (nền kem), chuyển động `truot`.

> **Cập nhật 05/11/2026 (sau khi anh duyệt storyboard):** đã code xong cảnh bản đồ. Khác với bản storyboard ban đầu: (1) ranh KCN là **đa giác thật của OpenStreetMap** (không còn vòng tròn minh họa); (2) nền ảnh vệ tinh Mapbox `satellite-streets-v12`; (3) thẻ số liệu nằm **phía trên** bản đồ (vùng y 1500-1650 dành cho phụ đề); (4) không vẽ ranh phân vùng 44/286 ha và lô 21,5/51,6 ha vì chưa có dữ liệu, chỉ hiện thẻ số; (5) **ảnh phối cảnh đang là ảnh giữ chỗ** và **Aeon đang là điểm tạm**: cổng kiểm tra chặn render đủ cho tới khi có file thật.

> **Cập nhật 05/11/2026 (lần 2):** (1) cảnh dự án zoom tới mức thấy **ranh khu đất OSM** (zoom tối đa 18); (2) video B vẽ **phân vùng minh họa** (44/286 ha, lô 51,6 ha, vùng 21,5 ha) là hình tròn cắt đúng tỉ lệ diện tích tin báo trong đa giác OSM, nét đứt, ghi "minh họa" (script `npm run geo:derive`); (3) có **đường chim bay kèm km** từ dự án tới các khu (tính bằng Turf); (4) Aeon dùng **điểm tạm do anh chọn** (10.927817, 106.835207), ghi "gần đúng".

## Dữ liệu cần trước khi làm
| # | Cần | Tình trạng |
| --- | --- | --- |
| 1 | Tọa độ tâm KCN Loteco, KCN Biên Hòa II, KCN Amata (anh sao chép từ Google Maps như lần trước) | **Chưa có.** Em thử Mapbox Geocoding và OpenStreetMap đều không tìm ra. |
| 2 | Ranh giới 3 KCN | Chưa có dữ liệu chính thức. Mặc định em vẽ **vòng tròn minh họa đúng diện tích** (Loteco 100 ha, Biên Hòa II 394,63 ha, Amata 513,01 ha) quanh tọa độ anh đưa, nét đứt, có chữ "ranh giới minh họa". Nếu anh có GeoJSON/KMZ ranh thật thì dùng thay. |
| 3 | Ảnh phối cảnh dự án cho cảnh 4 | **Chưa có file.** Drive có thư mục "4. PHỐI CẢNH" nhưng em không xem được ảnh qua connector. Anh chép 1-2 ảnh ngang (JPG/PNG) vào `remotion-video/public/images/` hoặc gửi trực tiếp vào phiên. |
| 4 | Vị trí dự án | Có sẵn (anh đã cho: 10.959874, 106.844087). |

## Cảnh 1: thanh so sánh lợi suất (12,70 giây): giữ nguyên
Không đổi so với bản đã render (thanh Biên Hòa, Thủ Đức, Quận 9, Quận 2).

## Cảnh 2: bản đồ lướt qua từng KCN (12,54 giây)
Mẫu mới: bản đồ Mapbox nền sáng (`light-v11`, hợp nền kem) toàn màn hình. Chữ tiêu đề "Tỷ lệ lấp đầy KCN" ở trên cùng, thẻ số liệu nổi trên bản đồ.

| Giây | Lời đọc | Camera | Hiệu ứng trên bản đồ |
| --- | --- | --- | --- |
| 0,0 - 3,8 | "Cầu thuê đến từ đâu? Theo Ban Quản lý các KCN Đồng Nai" | Toàn cảnh Biên Hòa (zoom ~11), trôi nhẹ | Ghim đỏ Bcons Central Park hiện ở 0,2; 3 điểm KCN chấm xám nhỏ, chưa có tên |
| 3,8 | "Loteco" | **Lướt tới Loteco** (1,2 giây, zoom ~13,5) | Vòng ranh nét đứt vẽ quanh KCN, tô màu nhấn, nhãn "LOTECO" |
| 4,8 | "99,26" | giữ | Thẻ nổi "99,26% lấp đầy · 100 ha", thanh phần trăm chạy tới 99,26% |
| 6,9 | "Biên Hòa 2" | **Lướt sang Biên Hòa II** (zoom ~12,5) | Loteco mờ đi, vòng ranh BH II vẽ, nhãn "BIÊN HÒA II" |
| 8,2 | "93,97" | giữ | Thẻ "93,97% · 394,63 ha" |
| 10,2 | "Amata" | **Lướt sang Amata** (zoom ~12) | Vòng ranh Amata vẽ, nhãn |
| 11,0 | "90,86" | giữ | Thẻ "90,86% · 513,01 ha" |
| 11,8 - 12,54 | (hết câu) | giữ | Giữ nguyên để sang cảnh 3 |

Chữ nhỏ cố định: "Ban Quản lý KCN Đồng Nai (trang chưa ghi ngày cập nhật)", "Ranh giới KCN: minh họa theo diện tích", "© Mapbox © OpenStreetMap".

## Cảnh 3: zoom vào dự án, zoom ra thấy 3 KCN (15,18 giây)
Bản đồ vẫn là nền, 3 thẻ số liệu nằm ở 1/3 dưới màn hình.

| Giây | Lời đọc | Camera | Hiệu ứng |
| --- | --- | --- | --- |
| 0,0 - 2,5 | "Vốn đầu tư cũng đổ vào. Tám tháng đầu năm 2026" | Toàn cảnh (3 KCN đã tô sẵn từ cảnh 2 + dự án) | Cả 4 điểm sáng nhẹ lần lượt |
| 2,5 - 4,4 | (nối câu) | **Zoom vào Bcons Central Park** (zoom ~14,5) | Ghim đỏ nảy, vòng sóng lan ra |
| 5,6 | "1,88" | giữ ở dự án | Thẻ 1: "Gần 1,88 tỷ USD · vốn FDI" |
| 9,2 | "860" | giữ | Thẻ 2: "Hơn 860 ngàn tỷ · vốn trong nước" |
| 11,1 - 13,0 | "Theo CafeLand nhiều chuyên gia..." | **Zoom ra toàn cảnh** (zoom ~11) thấy cả 3 KCN và dự án | Thẻ 3 "Nhận định: ở gần nơi làm việc" hiện lúc 11,8 |
| 13,0 - 15,18 | "...ở ngay khu vực làm việc" | giữ toàn cảnh | 3 KCN nhấp sáng lần lượt, nối nét đứt về dự án. **Tùy chọn:** ghi khoảng cách đường chim bay (km) lên từng nét, tính từ tọa độ thật, chữ "đường chim bay, không phải quãng đường đi". |

## Cảnh 4: ảnh phối cảnh dự án (13,66 giây)
Mẫu `project-close` thêm ảnh phối cảnh.

| Giây | Lời đọc | Hình |
| --- | --- | --- |
| 0,0 - 1,6 | "Bcons Central Park" | Ảnh phối cảnh phủ nửa trên màn hình, **phóng nhẹ từ từ** (Ken Burns), thẻ tên "BCONS CENTRAL PARK" hiện đè ảnh |
| 1,8 - 5,6 | "ở 236 Phan Trung, Tam Hiệp, dự kiến bàn giao quý 2 năm 2029" | Địa chỉ hiện dưới thẻ; chữ "Dự kiến bàn giao Quý II/2029" |
| 7,1 - 10,6 | "là một lựa chọn... cho thuê trong khu vực" | Ảnh đổi sang ảnh thứ hai nếu anh có (cross-fade); nếu chỉ 1 ảnh thì tiếp tục phóng |
| 11,0 - 13,66 | "Muốn bảng nguồn... comment bài toán thuê" | Dòng chữ gõ dần ở dưới: "Comment “bài toán thuê” để nhận bảng nguồn từng dòng" |

Chữ nhỏ cố định: "Hình ảnh phối cảnh mang tính minh họa", "Thông tin mang tính tham khảo". Không số điện thoại, không tên cá nhân.

## Việc code cần làm sau khi anh duyệt
1. Mẫu `geo-map` thêm: camera nhiều chặng (lướt/zoom theo cue), vòng ranh minh họa theo diện tích, thẻ số nổi trên bản đồ, lớp thẻ số liệu phủ dưới bản đồ.
2. Mẫu `project-close` thêm ảnh phối cảnh (phóng chậm, cross-fade).
3. Bảng nguồn thêm 3 hàng tọa độ KCN (anh cung cấp) và hàng ảnh phối cảnh (nguồn: tài liệu chủ đầu tư, thư mục Drive "4. PHỐI CẢNH").
4. Render thử khung hình các mốc 3,8 / 6,9 / 10,2 giây cảnh 2 và 4,4 / 11,1 giây cảnh 3 để anh xem trước khi render đủ. Render bản đồ dùng `--gl=angle --concurrency=1`, mất vài phút.
