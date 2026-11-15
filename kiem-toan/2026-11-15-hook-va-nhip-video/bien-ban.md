# Biên bản /agy-doc: mẫu mở đầu 3 giây và cảnh danh sách có đếm (15/11/2026)

Nguồn: Drive `Bcons/agy/den-claude/2026-11-15-hook-va-nhip-video/` (`ket-qua.md`; `mo-dau-kieu-1|2`, `danh-sach-kieu-1|2`: mỗi thư mục có `index.html`, JSON mẫu, ảnh chụp). Chỉ kiểm nội dung và code, không nhận xét UX/UI. Chưa tích hợp gì vào `engine/remotion`.

## AGY làm gì
2 kiểu mở đầu 0–3 s (khớp 2 phương án ảnh bìa) và 2 kiểu cảnh danh sách "3 công trình về đích" (video 8), bằng HTML/CSS/JS thuần đọc JSON. Hợp đồng dữ liệu đúng bản giao: `{hook, soNhan, dongPhu}` + `{tieuDe, muc[{ten, so, sourceId}]}`, thêm tùy chọn `ghiChuNhan`, `anhNen`, `nhanAnh`, `duAn`.

## Đúng
- `dongPhu` ("từ cầu Vĩnh Bình đến ngã tư Lê Hồng Phong") và số `8` khớp spec Newsky video 1.
- Số của danh sách khớp bảng nguồn video 8: gần 15 km, mục tiêu thông xe T11/2026 (14,7 km, nguồn `vanh-dai-3`); Tân Hiệp dự kiến khai thác T11/2026 (`tan-hiep`); sân bay 0 giờ 24/12/2026, ~33 km (`san-bay`, `geo-du-an-san-bay`). Mỗi mục có `sourceId` thật.
- Không SĐT chữ, có nhãn "Phối cảnh minh họa" trên ảnh (giống nhãn các video đang có). Vùng chữ nằm trong khung 3:4 (Y 240–1680): `hero-block` neo đáy 380 px, thanh nhịp ở Y 1620.
- Không phát hiện lỗi mã làm hỏng demo.

## Sai / cần sửa trước khi lắp
| Mã | Mức | Chỗ | Vấn đề | Đề xuất |
|---|---|---|---|---|
| F-01 | Cao | `danh-sach-mau.json`, mục 3 | "0h ngày 24/12/2026" thiếu chữ **dự kiến** (nguồn và spec video 8 ghi "dự kiến"). Băng tổng kết "3/3 công trình hạ tầng về đích cuối 2026" nói như đã chắc | thêm "dự kiến" ở mục sân bay; băng đổi thành "dự kiến về đích cuối 2026" (khớp spec) |
| F-02 | Cao | cả 2 `danh-sach-*/index.html` | tiêu đề, `kicker` "Cuối năm 2026", câu tổng kết "hạ tầng về đích cuối 2026" **viết cứng** trong HTML, không đọc từ JSON: dùng cho video khác sẽ sai | đưa `kicker` và câu tổng kết vào JSON (`kicker`, `tongKet`) |
| F-03 | Cao | `mo-dau-kieu-1/index.html`, `.time-badge` | chữ "0.0s / 3.0s" là phần debug nằm trong khung 1080×1920; nếu dựng nguyên sẽ in vào video | bỏ khi lắp (thanh nhịp `.beat-track` anh quyết) |
| F-04 | Vừa | `danh-sach-*`, `.item-num` | đánh số 01/02/03 cho 3 công trình **không theo trình tự**, trái "không đánh số khi không phải trình tự" (đếm "Đã xem n/3" thì đúng theo bản giao) | bỏ số 01–03 trên thẻ, giữ đếm n/N và vạch tiến độ |
| F-05 | Vừa | `danh-sach-mau.json` | `anhNen` `assets/images/phoi-canh-cp-tong-the.jpg` **không có** (ảnh thật: `phoi-canh-tong-the.jpg`); demo chỉ chạy nhờ đường dự phòng | đổi đường dẫn đúng |
| F-06 | Vừa | `mo-dau-kieu-1/index.html` | `ghiChuNhan` mặc định cứng "làn xe" khi JSON thiếu: video khác không có trường này sẽ ra "làn xe" | bỏ mặc định, trường rỗng thì không hiện |
| F-07 | Vừa | hook "Quốc lộ 13 / lên 8 làn" | nguồn nói "đang được làm rộng từ 6 lên 8 làn" (mốc hoàn thành chưa có); "lên 8 làn" dễ hiểu là đã xong. Hook này lấy từ brief mình viết | đổi thành "đang lên 8 làn" hoặc giữ "mở rộng 8 làn" như cảnh 1 spec; anh chọn |
| F-08 | Thấp | `danh-sach-*`, `innerHTML` | chèn `m.ten`, `m.so`, `tieuDe` thẳng bằng `innerHTML` (không thoát ký tự). Chỉ là demo, nhưng khi lắp vào React thì dùng văn bản thường | khi lắp không dùng `innerHTML` |

## Thiếu
- **Việc 3 (khung nguồn cuối video) chưa có.** Bản giao việc đó thêm lúc 18:3x, sau khi AGY bắt đầu (18:22). Cần giao lại.
- Chưa kiểm: các ảnh chụp và ảnh bìa PA1/PA2 (phiên khác kiểm bìa), mốc chuyển cảnh 2,45–3,0 s trong engine thật.

## Việc cần anh quyết
1. **Chọn kiểu** (em không nhận xét UX): mở đầu kiểu 1 hay 2 (phải trùng phương án bìa anh chọn); danh sách kiểu 1 (tối) hay 2 (sáng, ảnh nhỏ góc phải). Về nội dung hai kiểu như nhau; cần xem hợp video nào theo phong cách `style: "moi"` (A/B/C) của kênh.
2. F-07: hook "lên 8 làn" hay "đang lên 8 làn".
3. Giao lại cho AGY: sửa F-01…F-06 và làm Việc 3 (khung nguồn). Em gợi ý chỉ giao sau khi anh chọn kiểu để AGY khỏi làm lại cả hai.
4. Sau khi anh chọn và nói OK, em lắp vào `spec.ts`/mẫu cảnh theo TDD, thêm trường `hook` (và `muc`) kèm test và chụp khung trước/sau để 9 video cũ không đổi.
