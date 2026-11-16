# Biên bản /agy-doc: sửa mở đầu/danh sách kiểu 1 và khung nguồn cuối video (16/11/2026)

Nguồn: Drive `Bcons/agy/den-claude/2026-11-16-sua-mo-dau-danh-sach-va-khung-nguon/` (`ket-qua.md`, `mo-dau-kieu-1/`, `danh-sach-kieu-1/`, `khung-nguon/`). Đối chiếu bản giao việc `agy/giao-viec/2026-11-16-sua-mo-dau-danh-sach-va-khung-nguon.md` và biên bản cũ `kiem-toan/2026-11-15-hook-va-nhip-video/bien-ban.md`. Chỉ kiểm nội dung và code. Chưa lắp gì vào engine.

## Lỗi cũ F-01 đến F-08: đã sửa hết
| Mã | Kết quả |
|---|---|
| F-01 | Sân bay "Dự kiến 0 giờ ngày 24/12/2026"; băng "Dự kiến về đích cuối 2026". Đúng |
| F-02 | `kicker`, `title`, `tongKet.text` đọc từ JSON; thiếu thì ẩn. Đúng |
| F-03 | Chữ giờ chỉ còn trên thanh điều khiển ngoài khung, ẩn khi chụp (`?shot=1`). Đúng |
| F-04 | Bỏ số 01/02/03; giữ "Đã xem n/N" và vạch. Đúng |
| F-05 | `assets/images/phoi-canh-tong-the.jpg`. Đúng |
| F-06 | `donVi` rỗng thì ẩn; `soNhan`, `dongPhu`, nhãn ảnh rỗng cũng ẩn. Đúng |
| F-08 | Dựng bằng `createElement` + `textContent`, không còn `innerHTML` ghép dữ liệu. Đúng |
| Mờ dần 2,45–3,0 s | Cả lớp mở đầu mờ dần, công thức giống `moDau.ts`. Khớp engine |

Hợp đồng dữ liệu đúng như đã chốt (hook `lines/soNhan/donVi/dongPhu/image`; danh sách `kicker/title/muc[ten,so]/tongKet/image`).

## Khung nguồn cuối video (Việc 2)
- Đúng bản giao: 2,5 s trước cảnh cuối, tối đa 3 dòng (`slice(0, 3)`), chỉ tên nguồn + ngày, không link, không câu "tham khảo" hay câu tự bảo vệ; tiêu đề cố định "Nguồn số liệu"; nằm trong vùng 3:4 (đệm trên 278, dưới 420, phải 140).
- Số liệu ví dụ khớp: Newsky 1 "Tuổi Trẻ 12/10/2026" (huy hiệu spec video 1); video 8 "Pháp Luật Plus 01/11/2026", "CafeF 30/10/2026", "CafeF 04/11/2026" (huy hiệu spec video 8).
- AGY đề xuất thêm `sourceId` cho mỗi dòng để kiểm tự động: em đồng ý (xem kế hoạch trong báo cáo gửi anh).

## Điểm mới, cần lưu ý
| Mã | Mức | Vấn đề | Đề xuất |
|---|---|---|---|
| F-09 | Vừa | Chữ "cách ~33 km": dấu "~" ở cỡ chữ nhỏ của Be Vietnam Pro trông như dấu trừ (ảnh chụp engine 15/11 đọc thành "-33 km") | Viết "khoảng 33 km" (giống lời bình video 8); không dùng "~" trong chữ trên hình |
| F-10 | Thấp | `ket-qua.md` vừa ghi "đã chốt theo lựa chọn của anh" (danh sách cân giữa khung 3:4, nhãn ảnh dưới tên dự án) vừa liệt kê đúng việc đó ở mục "cần anh quyết" | Anh xác nhận một lần (em không tự đổi engine theo bố cục chưa chắc đã duyệt) |
| F-11 | Thấp | Bản demo khác engine hiện tại ở 2 chỗ (thiết kế, việc của AGY): (a) mở đầu: nhãn "Phối cảnh minh họa" chuyển xuống dưới tên dự án, chữ 35 px có nền tối và viền nhấn trái; (b) danh sách: cụm tiêu đề + thẻ cân giữa khung, chữ mục 40/30 px, khoảng cách lớn hơn | Anh duyệt thì em lắp vào `HookOpen.tsx` và `DanhSach.tsx` |

## Việc cần anh quyết
1. Xác nhận bố cục mới (F-10, F-11): danh sách cân giữa + nhãn ảnh dưới tên dự án. Em khuyên **duyệt**: chữ mục to hơn (40/30 px thay 38/28) và hết khoảng trống nửa dưới, đúng 2 điểm em ghi chưa chắc trong storyboard video 6.
2. Cách lắp khung nguồn (đổi hành vi code, chờ "OK"): xem kế hoạch trong báo cáo gửi anh.
