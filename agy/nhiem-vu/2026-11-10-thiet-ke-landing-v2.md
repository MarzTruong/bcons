# Nhiệm vụ cho AGY: thiết kế lại landing Bcons Central Park, bản mẫu để anh chọn (10/11/2026)

- Loại: thiet-ke   - Giao bởi: Claude Code theo lời anh   - Đọc trước: `kiem-toan/2026-11-10-agy-landing/phan-hoi.md` (Claude đã kiểm file AGY gửi), `agy/README.md`, `CLAUDE.md`, `DESIGN.md`, `engine/landing/page.mjs`, `engine/landing/calc.mjs`, `du-an/bcons-central-park/landing/landing.json`, `project.json`, `nguon/pttt-cdt.json`

## Mục tiêu
Anh thích hướng của bản AGY (tông kem + xanh rừng + đất nung, bảng so sánh 5 PTTT, chọn căn rồi tính dòng tiền). Làm lại thành **bản mẫu** (không phải sản phẩm) để anh chọn với landing hiện tại.

## Phạm vi
- **Phương án A:** giữ tông kem/xanh rừng/đất nung của AGY, sửa hết lỗi trong `phan-hoi.md`.
- **Phương án B:** giữ ngôn ngữ khối vàng của landing hiện tại (`#ffe14d`, chữ `#18201b`, nền `#fffdf4`) nhưng mượn bố cục bảng so sánh 5 PTTT và cách chọn căn của AGY.
- Mỗi phương án: 1 file HTML + ảnh chụp 390 px. Ảnh dùng file trong `du-an/bcons-central-park/assets/images/` (ghi tên file, không nhúng Base64).
- **Không tự viết công thức**: chỗ công cụ tính để khung và ghi "Claude gắn `calc.mjs`". Form: để khung (Claude dùng form của `page.mjs`, đúng chuẩn `Code.gs`, ô đồng ý không tick sẵn).
- Chữ chỉ là chữ thật sẽ hiện cho khách; số CĐT chưa xác nhận (xem `phan-hoi.md`) thì **bỏ**, không bịa.
- Tiêu đề chữ thường kiểu câu (không Title Case, không nhãn CHỮ HOA giãn chữ), không emoji làm icon.

## Kết quả cần có
Thư mục bàn giao `2026-11-10-thiet-ke-landing-v2` theo `agy/mau/thiet-ke.md` (+ 2 HTML, 2 ảnh chụp).
