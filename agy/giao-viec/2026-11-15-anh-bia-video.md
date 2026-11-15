# Giao việc AGY: ảnh bìa (thumbnail) cho video TikTok và Facebook Reel (15/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-15-anh-bia-video.md`, rồi làm theo."

## Vấn đề (anh gửi ảnh lưới video TikTok ngày 15/11/2026)
Lưới hồ sơ TikTok đang xấu và không đồng nhất: 2 trên 13 ô **trắng trơn** (khung đầu video chưa có hình), vài ô là cảnh bản đồ vệ tinh không đọc được tên, vài ô chữ bị cắt (ví dụ "LÃI SUẤT VAY MUA NHÀ NĂM 2026" bị cắt mất chữ ở trên), ô thì chữ nhỏ không đọc được khi thu nhỏ. Khách lướt lưới hồ sơ thấy kênh luộm thuộm, không biết video nói gì. Bìa là thứ quyết định người ta có bấm vào xem không.

## Việc cần làm
Thiết kế **mẫu ảnh bìa** cho video dọc 1080×1920, dùng cho TikTok và Facebook Reel của anh (Bcons Newsky trước, Central Park sau). Mẫu phải cho ra bìa **nhất quán cả kênh nhưng không rập khuôn** (mỗi video một điểm nhấn, thấy cả lưới vẫn nhận ra cùng một kênh).
- **Làm ít nhất 2 phương án khác hẳn nhau**, mỗi phương án dựng sẵn 3 bìa thật để anh so: Newsky 1 "Quốc lộ 13 lên 8 làn", video 8 "Cuối năm, 3 công trình về đích", video 7 "Lãi vay hạ nhiệt". Anh chọn 1.
- **Đọc được khi thu nhỏ bằng một ô lưới TikTok** (khoảng 180×240 px trên điện thoại): tối đa 6 từ chữ lớn, tương phản mạnh, không chữ nhỏ ngoài dòng tiêu đề. Thử bằng cách thu ảnh còn rộng 180 px và nhìn.
- **Vùng an toàn:** lưới hồ sơ TikTok cắt tỉ lệ 3:4 ở giữa (bỏ khoảng 240 px trên và 240 px dưới của khung 1080×1920); toàn bộ chữ và điểm nhấn nằm trong vùng giữa 1080×1440. Tránh đè lên chỗ giao diện TikTok/Facebook che (mép trên, mép dưới, cột nút bên phải).
- **Quy tắc nội dung (`CLAUDE.md`):** không hứa lợi nhuận/tăng giá, không "sắp hết", không SĐT chữ; phối cảnh dự án phải có nhãn "Phối cảnh minh họa" ngay trên tấm ảnh; số liệu trên bìa phải đúng số trong video (lấy từ `spec.json` của video, không tự viết số mới); logo dự án đúng như tài liệu CĐT, không tự vẽ lại logo.
- **No AI Slop** (checklist trong `CLAUDE.md`): không hộp bo góc viền phát sáng, không nền kẻ sọc/lưới trang trí, không nhãn CHỮ HOA giãn chữ, không chữ dính/đè/lem, không thẻ giống hệt nhau, không đánh số khi không phải trình tự.
- **Ảnh nền:** dùng ảnh thật trong `du-an/bcons-newsky/assets/images/` (phối cảnh CĐT) hoặc khung hình chụp từ chính video. Bản đồ vệ tinh thì không làm nền chính (đọc không ra): chọn một điểm nhấn thay thế.

## Hợp đồng dữ liệu (để Claude lắp)
Mỗi video có một file `du-an/<mã>/video/<tên>/bia.json` do Claude điền từ spec:
```json
{ "tieuDe": ["Quốc lộ 13", "lên 8 làn"], "diemNhan": "8", "ghiChuNhan": "làn xe", "anhNen": "assets/images/phoi-canh-quoc-lo-13.jpg", "nhanAnh": "Phối cảnh minh họa", "duAn": "bcons-newsky" }
```
Mẫu của AGY là một file HTML đọc `bia.json` (khóa trên), vẽ đúng 1080×1920, font hệ thống hoặc nhúng font, không gọi mạng. Claude lo phần chụp ra PNG (Playwright) bằng lệnh `npm run bia -- <tên>`, ghép khung bìa vào đầu video và đẩy ảnh lên Drive. AGY **không** sửa file trong repo.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-anh-bia-video/`: mỗi phương án một thư mục (`index.html` mở được ngay, kèm `bia-mau.json` và 3 bìa PNG), ảnh ghép "lưới 12 ô" mô phỏng hồ sơ TikTok để anh nhìn tổng thể, `ket-qua.md` ngắn (chọn gì, vì sao, chỗ nào chưa chắc, cần Claude cung cấp thêm dữ liệu gì).

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm số liệu, quy tắc và vùng an toàn; anh chọn phương án; Claude lắp: `npm run bia`, ghép khung bìa vào đầu video (khung đầu video chính là bìa, để lưới TikTok tự lấy đúng khung này), và dùng chính bìa đó cho Reel Facebook.
