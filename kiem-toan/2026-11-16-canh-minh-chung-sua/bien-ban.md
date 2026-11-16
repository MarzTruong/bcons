# Kiểm bản sửa cảnh "minh chứng" (AGY, 16/11/2026)

Bản gốc AGY: Drive `agy/den-claude/2026-11-16-canh-minh-chung-sua/` (`ket-qua.md`, `phuong-an-1/`, `phuong-an-2/`, `assets/`). Đối chiếu với lời giao `agy/giao-viec/2026-11-16-canh-minh-chung-sua.md` và biên bản `kiem-toan/2026-11-15-canh-minh-chung/bien-ban.md` (mục 1, 2, 3, 5; mục 4 anh giữ nguyên). Chỉ kiểm nội dung và mã; chưa lắp vào Remotion, spec 03, 04, 05 vẫn `draft`.

| Điểm | Kết quả | Căn cứ |
|---|---|---|
| 1. Video 5 tiêu đề "Căn hộ mới, Bình Dương cũ"; tiêu đề biểu đồ có "Bình Dương cũ" | Đạt | `canh-mau.json` và dữ liệu nhúng của cả 2 phương án: `title` = "Căn hộ mới, Bình Dương cũ", `bieuDo.tieu_de` = "Giá sơ cấp căn hộ Bình Dương cũ"; mã đọc `tieu_de` vào tiêu đề biểu đồ; ảnh chụp video 5 hiện đúng hai chữ này |
| 2. Nguồn biểu đồ "VnExpress 23/09/2026 (khoảng 60 triệu: One Mount Group)" | Đạt | `bieuDo.nguon` đúng nguyên văn ở cả 4 chỗ (2 file JSON, 2 bản nhúng); thanh nguồn cố định vẫn "VnExpress 23/09/2026" |
| 3. Bỏ chip "Đã đối chiếu" (phương án 1) | Đạt | Không còn `mini-proof-chip` hay chữ "đối chiếu" trong `index.html` phương án 1 |
| 5. Video 5 nền phối cảnh có nhãn minh họa | Đạt | `anhNen.file` = `phoi-canh-tong-the.jpg`, `nhan` = "Phối cảnh minh họa"; không còn `hien-trang-ql13-tuoitre-2.jpg` |
| 4. Video 3 giữ tiêu đề | Đạt (không đổi) | "Mức thuê 11 và 13 triệu/tháng" |

Mã: dữ liệu nhúng khớp `canh-mau.json` ở cả 2 phương án. Font Be Vietnam Pro nạp từ file `.woff2` cục bộ (`../assets/fonts/`, 6 file có trên Drive), không gọi mạng; font giấy phép SIL OFL, dùng được. `innerHTML` còn lại chỉ dựng cột biểu đồ từ số trong dữ liệu (không rủi ro). Số liệu không đổi (35–40 và 60 triệu/m², Quý II/2026), không thêm số mới, không hứa lợi nhuận/tăng giá, không SĐT.

Lưu ý nhỏ: chữ đọc tự động trên ảnh chụp phương án 2 ra "Quý I/2026" (nhiều khả năng do đọc sai chữ "II"); dữ liệu của cả 2 phương án đều ghi "Quý II/2026". Khi lắp vào Remotion em sẽ chụp lại và kiểm bằng mắt.

## Việc cần anh quyết
Chọn phương án (hoặc mỗi video một phương án) và nói OK để em lắp mẫu cảnh `bang-chung` vào Remotion, thay bản tạm trong spec 03, 04, 05 rồi chụp lại storyboard. Về nội dung cả 2 đều đạt; em vẫn nghiêng về phương án 2 cho video 5 (biểu đồ và ảnh không che nhau) và phương án 1 cho video 3, 4.
