---
name: bcons-thiet-ke
description: Dựng bản mẫu giao diện (landing, thẻ, banner) cho Bcons ít nhất 2 phương án để anh chọn, không đụng engine; gồm HTML tĩnh và ảnh chụp điện thoại.
---
# Thiết kế bản mẫu giao diện Bcons

**Đây là bản mẫu để anh chọn, không phải sản phẩm.** Claude sẽ tích hợp bản được chọn vào `engine/landing` (dựng bằng `build.mjs`, `page.mjs`, có test).

1. Đọc `DESIGN.md`, `PRODUCT.md`, `CLAUDE.md` ("No AI Slop", "Quy tắc nào được hiện cho khách xem") và landing hiện tại (`engine/landing/page.mjs`, `du-an/bcons-central-park/landing/landing.json`).
2. Ít nhất **2 phương án** khác hướng. Mỗi phương án: 1 file HTML tĩnh + 1 ảnh chụp ở 390 px (điện thoại). Màu, font ghi rõ; nếu khác `DESIGN.md` thì nói là đề xuất mới.
3. Chữ trên bản mẫu chỉ là chữ thật sẽ hiện cho khách. Không chữ nội bộ ("không bán cho người nước ngoài", "không cam kết lợi nhuận", "theo bảng giá CĐT ngày...").
4. Số liệu chỉ lấy từ `project.json`/`thong-tin.md`/`pttt-cdt.json`. **Không tự viết công thức tính PTTT**: dùng nguyên `engine/landing/calc.mjs` hoặc để chỗ trống ghi "Claude gắn công thức". Nhớ: giá ghi một dòng chưa VAT/có VAT + phí bảo trì 2%; trần 6,9% chỉ PTTT 03 và 04; PTTT 05 không có trần.
5. Form: ô đồng ý nhận tin không tick sẵn, sát nút gửi. Nút Gọi/Zalo theo `project.json` → `lienHe`. Phối cảnh gắn nhãn "Hình ảnh minh họa" ngay trên ảnh.
6. Ảnh dùng file trong `du-an/<mã>/assets/images/` (ghi tên file), không nhúng Base64 vào bản giao.
7. Tránh: hộp viền phát sáng, nền tối kẻ sọc/lưới, thẻ giống hệt xếp hàng, nhãn CHỮ HOA giãn chữ trên mọi tiêu đề, số 01/02/03 khi không phải trình tự.
8. Xuất theo `agy/mau/thiet-ke.md` vào thư mục bàn giao, rồi báo anh.
