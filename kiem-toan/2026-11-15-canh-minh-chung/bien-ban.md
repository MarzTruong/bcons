# Kiểm cảnh "minh chứng" popup bài báo/thông báo (AGY, 15/11/2026)

Bản gốc AGY: Drive `agy/den-claude/2026-11-15-canh-minh-chung/` (`ket-qua.md`, `phuong-an-1/`, `phuong-an-2/`, mỗi phương án có `index.html`, `canh-mau.json`, 9 ảnh chụp; 6 ảnh ghép so sánh; bộ ảnh gốc). Việc giao: `agy/giao-viec/2026-11-15-canh-minh-chung-popup.md`. Em kiểm nội dung và mã HTML/JS, không nhận xét thiết kế. Chưa tích hợp vào Remotion; spec video 3, 4, 5 vẫn `draft`.

## Đúng
- **Nguồn và ngày trên hình:** popup video 4 "Tuổi Trẻ 05/10/2026", video 5 "VnExpress 23/09/2026", video 3 "Thông báo 34/TB-SHQT, Chủ đầu tư, 12/11/2026": khớp bài gốc và thông báo. Ảnh nền có nhãn "Ảnh: Tuổi Trẻ, 10/2026" (video 4, 5) và "Phối cảnh minh họa" (video 3).
- **Thông báo 34 chỉ hiện đến mức 2PN (11 và 13 triệu):** đúng quyết định cắt; không lộ mức 3PN, shophouse, không lộ tên người ký hay danh sách căn. Không có SĐT, hoa hồng, dữ liệu khách.
- **Biểu đồ giá:** trục từ 0, dải 35–40 và cột 60 đúng số bài VnExpress, đơn vị triệu/m², không tính phần trăm tăng, không thêm số khác. Vạch 20/40/60 tính đúng theo thang 70.
- **Mã:** không gọi mạng (`fetch("./canh-mau.json")` cùng thư mục, thất bại thì dùng dữ liệu nhúng sẵn); không có `eval`, không tải font hay script ngoài. Ảnh dẫn bằng đường dẫn tương đối (`assets/images/...`, dự phòng `../`) khớp thư mục `assets/` AGY đặt cạnh. Thời lượng 8,5 giây; vùng an toàn: chữ bắt đầu từ y=252–256, chú thích kết thúc trước y≈1620, biểu đồ chừa 130 px bên phải cho mã QR.

## Sai hoặc cần sửa (gửi lại AGY)
1. **Video 5, tiêu đề cảnh "Căn hộ dọc Quốc lộ 13" sai phạm vi.** Số 35–40 và 60 triệu/m² là căn hộ mới ở **Bình Dương cũ** (Dĩ An, Thuận An…), không phải "dọc Quốc lộ 13". Sửa thành "Căn hộ mới, Bình Dương cũ" (khớp kịch bản và thẻ ở bản tạm). Biểu đồ cũng thiếu phạm vi: thêm "Bình Dương cũ" vào tiêu đề "Mặt bằng giá sơ cấp căn hộ".
2. **Nguồn biểu đồ gộp sai.** "One Mount Group, VnExpress 23/09/2026" gắn cho cả hai cột, nhưng 60 triệu là số One Mount quý II/2026 còn 35–40 là VnExpress ghi nhận vùng giá phổ biến của năm trước. Sửa: "Nguồn: VnExpress 23/09/2026 (khoảng 60 triệu: One Mount Group)".
3. **Chip "Đã đối chiếu <tên báo>" (phương án 1, nhịp 3)**: câu tự bảo vệ, ngụ ý có đơn vị thứ ba xác minh. Bỏ, giữ "Nguồn: …" như thanh nguồn cố định.
4. ~~Video 3, tiêu đề "Mức thuê 11 và 13 triệu/tháng"~~: anh quyết giữ nguyên (16/11/2026). Không sửa.
5. **Video 5, nền ảnh cổng chào** với chú thích "trục Quốc lộ 13" không liên quan đến số giá; ở nhịp 3 chú thích này bị biểu đồ thay nên không hiện, nhưng ảnh nền vẫn gợi nhầm nội dung. Em đề xuất dùng ảnh khu vực/dự án thay (anh cung cấp) hoặc phối cảnh có nhãn "minh họa".
6. **Hai bản dữ liệu nhúng và `canh-mau.json` tách rời** trong mỗi `index.html`: sửa một nơi quên nơi kia thì chạy `file://` ra bản cũ. Chấp nhận được cho mẫu; khi lắp vào Remotion em chỉ dùng một nguồn.
7. Mã nhỏ: `miniChip.innerHTML` ghép chuỗi từ dữ liệu (chỉ dữ liệu của mình, không rủi ro thực tế) nên đổi `textContent` khi lắp.

## Quy tắc cứng
Không hứa lợi nhuận/tăng giá, không "sắp hết", không metro, không SĐT chữ. Ảnh bài báo chỉ cắt tiêu đề và đoạn dẫn (không có đoạn nhắc dự án khác). Ảnh Tuổi Trẻ dùng có ghi nguồn theo anh đồng ý 15/11/2026.

## Việc cần anh quyết
Chọn phương án (em chỉ nhận xét nội dung, không thiết kế). Về nội dung: cả hai đều đủ nguồn và nhãn; phương án 2 (nền sáng) hợp video 5 vì biểu đồ và ảnh không che nhau, còn phương án 1 (nền tối) hợp video 3 và 4. Hai video có thể dùng hai phương án khác nhau nếu anh muốn. Chọn xong và nói OK thì em lắp vào Remotion (mẫu cảnh `bang-chung`), sửa spec 03, 04, 05 và chụp lại storyboard.

## Anh chốt 16/11/2026
Gửi AGY sửa mục 1, 2, 3, 5; mục 4 giữ nguyên. Lời giao: `agy/giao-viec/2026-11-16-canh-minh-chung-sua.md`.
