# Biên bản kiểm: ảnh bìa video do AGY giao (15/11/2026)

Nguồn: Drive `Bcons/agy/den-claude/2026-11-15-anh-bia-video/` (2 phương án HTML + 3 bìa mỗi phương án + lưới 12 ô mô phỏng + `ket-qua.md`). Bản giao việc: `agy/giao-viec/2026-11-15-anh-bia-video.md`. Phạm vi kiểm: nội dung và code (không nhận xét thiết kế, anh chọn phương án).

## Đúng
- **Hợp đồng dữ liệu** đúng khóa đã giao (`tieuDe`, `diemNhan`, `ghiChuNhan`, `anhNen`, `nhanAnh`, `duAn`); trang đọc được cả một đối tượng lẫn mảng.
- **Số trên bìa khớp video:** "8 làn xe" (Newsky 1), "3 công trình" (video 8), "9–10,7%/năm (1–2 năm đầu)" (video 7: "gói cố định 1 đến 2 năm đầu còn 9 đến 10,7%/năm").
- **Quy tắc cứng:** cả 3 bìa có nhãn "Phối cảnh minh họa"; không SĐT, không câu hứa/hype, không dữ liệu khách.
- **Vùng an toàn 3:4:** theo tọa độ trong code, mọi chữ nằm trong khoảng y 274–1540 px (< 1680), lề trái 72 px, chừa 130–140 px bên phải cho cột nút TikTok.
- **Code:** không gọi mạng ngoài `fetch("./bia-mau.json")` (có dữ liệu mẫu nhúng sẵn làm dự phòng); không lưu gì; ảnh nền có dự phòng đường dẫn `../`. Ảnh nền dùng đúng file có trong repo (`phoi-canh-quoc-lo-13.jpg`, `phoi-canh-tong-the.jpg`, `phoi-canh-green-park.jpg`).

## Cần xử lý khi tích hợp (Claude làm sau khi anh chọn phương án)
1. **Màu bìa theo thứ tự trong danh sách, không theo video** (cả hai phương án: `màu = danh sách[idx % 3]`). `ket-qua.md` ghi "màu theo chủ đề" nhưng code không làm vậy. Cần quy tắc ổn định để một video luôn ra cùng một màu: em đề xuất thêm trường `chuDe` (`ha-tang` / `tien-do` / `tai-chinh` / `du-an`) vào `bia.json`, hoặc tính theo `so` của video.
2. **Phông chữ:** CSS dùng chuỗi phông hệ thống (Be Vietnam Pro, Montserrat, Segoe UI...). Chụp bằng Playwright trên cloud hoặc máy khác có thể ra phông khác ảnh AGY đã chụp. Cần nhúng file phông vào repo khi làm `npm run bia`.
3. **Nhãn "Phối cảnh minh họa"** cỡ 25 px trên khung 1080 px: đủ quy tắc ở kích thước đầy đủ, nhưng thu vào ô lưới 180 px chỉ còn khoảng 4 px (không đọc được). Không vi phạm quy tắc (nhãn nằm trên ảnh), ghi nhận để anh cân nhắc khi chọn.
4. Mẫu lưới 12 ô lặp lại cùng 3 bìa nên chưa chứng minh được tính "không rập khuôn" khi có nhiều video khác chủ đề (phần thiết kế, anh quyết).

## Việc tiếp theo (chờ anh chọn phương án)
Em làm: `bia.json` cho từng video, lệnh `npm run bia -- <tên>` (Playwright chụp PNG 1080×1920 từ mẫu AGY), nhúng phông, ghép khung bìa vào đầu video, dùng cùng ảnh cho Reel Facebook. Đồng bộ với mẫu mở đầu 3 giây trong `agy/giao-viec/2026-11-15-hook-va-nhip-video.md`: khung đầu video phải khớp mẫu bìa đã chọn.
