# Giao việc AGY: hoàn thiện ảnh bìa phương án 1 (16/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-16-bia-phuong-an-1-hoan-thien.md`, rồi làm theo."

Anh đã chọn **phương án 1** (ảnh tràn khung, thanh nhấn dọc) cho ảnh bìa (16/11/2026). Biên bản kiểm của Claude: `kiem-toan/2026-11-15-anh-bia-video/KIEM.md`. Chỉ làm tiếp phương án 1, bỏ phương án 2. Mẫu mở đầu kiểu 1 đã khớp phương án này (không cần làm lại).

## Sửa và làm thêm (chỉ trong thư mục `phuong-an-1`)
1. **Màu theo chủ đề, không theo thứ tự danh sách.** Thêm trường `chuDe` vào `bia-mau.json` với bốn giá trị cố định và màu nhấn cho từng giá trị: `ha-tang` (hạ tầng, giao thông), `tien-do` (mốc tiến độ, công trình), `tai-chinh` (lãi vay, thanh toán), `du-an` (thông tin dự án). Giữ ba màu hiện có (`#7ee0c3`, `#ffe14d`, `#ff9e44`), chọn thêm một màu thứ tư cho `du-an` hợp bộ màu. Một video luôn ra đúng một màu theo `chuDe`; trường vắng thì dùng màu `du-an`.
2. **Chỉ dùng phông Be Vietnam Pro** (phông của video, đã có trong engine Remotion), ghi rõ các độ đậm đã dùng; bỏ Montserrat, Segoe UI, Bahnschrift khỏi chuỗi phông để chữ chụp ra giống nhau trên mọi máy.
3. **Nhãn "Phối cảnh minh họa":** hiện cỡ 25 px, thu vào ô lưới còn khoảng 4 px (không đọc được). Nhãn vẫn phải nằm trên chính tấm ảnh; AGY đề xuất cỡ/vị trí đọc được hơn mà không phá bố cục (nếu muốn thử, làm một phương án phụ để anh chọn).
4. **Một bìa một dữ liệu:** trang đọc một đối tượng `bia.json` (như hợp đồng đã giao) và có thêm `?case=` chỉ để xem thử; bỏ nút chuyển mẫu khỏi khung 1080×1920 (chụp ảnh không có nút). Chỉ giữ MỘT nguồn dữ liệu (đọc file JSON; nếu cần dự phòng offline thì đọc từ cùng file, không chép hai bản).
5. **Bìa thật cho 6 video** để thử độ đa dạng (chủ đề khác nhau): Newsky 1 "Quốc lộ 13 / lên 8 làn" (`ha-tang`), Newsky 2 "Mua căn 3 tỷ / cần bao nhiêu?" (số nhấn 150 triệu, `tai-chinh`), Newsky 6 "Ba cách / thanh toán" (`tai-chinh`), video 8 "Cuối năm, 3 công trình về đích" (`tien-do`), video 7 "Lãi vay hạ nhiệt" (`tai-chinh`), video 4 "Hạ tầng Biên Hòa" (`ha-tang`). Ảnh nền lấy từ `du-an/<mã>/assets/images/` (đường dẫn tương đối `assets/images/...`; ảnh phối cảnh có nhãn minh họa). Số nhấn phải đúng số trong video (lấy từ spec hoặc kịch bản của video đó).
6. **Lưới 12 ô** (mô phỏng trang cá nhân TikTok) dùng 12 bìa khác nhau (6 video trên cộng 6 biến thể chủ đề/ảnh khác), để thấy cả lưới có nhất quán nhưng không rập khuôn.

## Quy tắc (`CLAUDE.md`)
Không hứa lợi nhuận/tăng giá, không "sắp hết", không SĐT chữ, số khớp video, nhãn "Phối cảnh minh họa" trên ảnh phối cảnh, No AI Slop (không hộp viền phát sáng, không nền kẻ sọc/lưới, không nhãn CHỮ HOA giãn chữ, không thẻ giống hệt nhau xếp hàng). Vùng an toàn 3:4 (Y 240–1680), chừa cột nút bên phải.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-bia-phuong-an-1/`: `index.html` (đọc `bia.json`), 6 bìa PNG, lưới 12 ô, `bia-mau.json` (6 mẫu, mỗi mẫu một đối tượng), `ket-qua.md` ngắn. **Không sửa, commit, push file trong repo.**

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm, rồi làm: `bia.json` cho từng video, lệnh `npm run bia -- <tên>` (Playwright chụp PNG 1080×1920, nhúng phông), ghép bìa làm khung đầu video (khớp mẫu mở đầu kiểu 1) và dùng cùng ảnh cho Reel Facebook.
