# Phản hồi của Claude: landing Antigravity thiết kế (bcons_central_park_web.html, 10/11/2026)

File gốc 1,72 MB (ảnh Base64 chiếm 96%) nằm ngoài repo; kiểm bằng bản rút gọn bỏ ảnh. Đối chiếu với `engine/landing/calc.mjs`, `page.mjs`, `client.js`, `apps-script/Code.gs`, `nguon/pttt-cdt.json`, `CLAUDE.md`. Kết luận: **chưa dùng nguyên file**; lấy ý hay làm phương án thiết kế để anh chọn.

## Lỗi nặng (không dùng được nếu để nguyên)
| Mục | Vấn đề |
|---|---|
| Form | Gửi `{name, phone, unit, source, timestamp}` với `no-cors`; `Code.gs` cần `ten, sdt, dongY: true, t, hp_x7` nên **mọi lead bị loại** mà trang vẫn báo "đã tiếp nhận". Không gửi PTTT, giá, căn đã tính. |
| Ô đồng ý | `checked` (tick sẵn): trái quy tắc 6. Chữ đồng ý thiếu bên giữ dữ liệu, cách rút lại. |
| Công cụ tính | Tự viết lại: số từng đợt sai (đợt 1 và sổ hồng bị nhân VAT, phí bảo trì lẫn vào đợt bàn giao; căn A21-26 PTTT 01 đợt sổ hồng lệch +10,96 triệu), trả góp không phải niên kim (lệch +29,6%: 15,9 triệu so với 12,3 triệu/tháng), không có ân hạn 24 tháng của PTTT 02/05, slider lãi không có trần 6,9% cho PTTT 03/04. Phải dùng nguyên `calc()` và `pmt()` của `calc.mjs`. |

## Vi phạm "Quy tắc nào được hiện cho khách xem" và quy tắc cứng
- Chân trang ghi "Thiết kế theo chuẩn Figma Design System • Tuyệt đối không Slop" (lộ prompt).
- Câu cam kết, so sánh tuyệt đối không nguồn: "dư địa tăng trưởng bền vững" (ngụ ý giá tăng), "Cam kết giữ chữ tín số 1 về tiến độ", "rổ giá tốt nhất", "Công Cụ Độc Quyền"; 3 dòng tick "Cam kết... Bảo mật tuyệt đối".
- "8,5% chiết khấu cao nhất" ngay hero (chiết khấu chỉ hiện trong công cụ tính khi khách chọn đúng PTTT).
- Ảnh phối cảnh không có nhãn "Hình ảnh minh họa", còn ghi "Phối cảnh thực tế". Giá "từ 2,19 tỷ" ở form không nói chưa VAT.
- Nhiều số CĐT chưa đối chiếu được (23 dự án/13 bàn giao/10 trao sổ, hơn 30.000 gia đình, MB bảo lãnh, 1/500, bảo hành 60 tháng, 25 phút tới Long Thành, hồ bơi 315 m², "xong móng", "cất nóc"...), và "PTTT 04 tối đa 48 tháng" (file chủ đầu tư chỉ ghi cố định tối đa 30 tháng).
- Lời hứa dịch vụ chưa duyệt: gửi file Excel, giỏ hàng giá tốt nhất, hỗ trợ hồ sơ bảo lãnh miễn phí.
- Không có nút Zalo thật (chỉ `tel:`); menu điện thoại không có nút mở.

## Trái "No AI Slop"
Nhãn CHỮ HOA giãn chữ ở mọi mục (`section-eyebrow`), tiêu đề Title Case, emoji làm icon, 6 thẻ tiện ích cùng khuôn, chữ 10–12 px.

## Ý hay, giữ làm phương án để anh chọn
- Tông kem `#faf9f5` + xanh rừng `#1b382b` + đất nung `#b85d38` (ấm, khác mẫu tối neon); chữ nghiêng một cụm nhấn trong tiêu đề hero.
- Bảng so sánh 5 PTTT một màn hình; cột "Nguồn tiền"; chọn loại căn rồi bấm "Tính dòng tiền căn này" đổ sẵn vào công cụ.
- Honeypot + trễ gửi (cần đúng tên trường `hp_x7` và gửi `t`).

## Cách làm tiếp
AGY làm lại ≥ 2 phương án theo `agy/nhiem-vu/2026-11-10-thiet-ke-landing-v2.md` (không nhúng Base64, không tự viết công thức). Anh chọn xong mới tích hợp vào `engine/landing` (dựng bằng `page.mjs`, form đúng chuẩn `Code.gs`).
