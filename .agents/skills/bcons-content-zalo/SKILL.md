---
name: bcons-content-zalo
description: Viết bản nháp nội dung đăng Zalo cho Bcons Central Park (Zalo OA, nhật ký, nhóm) theo giọng người thật, đúng quy tắc cứng; Claude kiểm và lưu vào repo.
---
# Viết nội dung Zalo cho Bcons

Dùng khi anh giao "viết bài Zalo về <chủ đề>". Bài gắn với một video thì Claude viết ở `caption.md`; skill này cho bài Zalo độc lập (tin thị trường tuần, lịch đợt 2/đợt 3, chăm khách đã đăng ký).

1. Đọc `docs/quy-tac-caption.md` (giọng người thật, không "AI slop"), `CLAUDE.md` (quy tắc cứng), `du-an/<mã>/thong-tin.md` và `project.json` (lịch mở bán, `lienHe`).
2. Chọn loại bài, ghi trong ghi chú:
   - **Zalo OA / nhật ký / nhóm cộng đồng**: bài dài vừa (khoảng 400–900 ký tự), đoạn ngắn, 1 lời mời cụ thể (nhắn Zalo để nhận thông tin/đặt lịch xem nhà mẫu).
   - **Tin nhắn chăm sóc**: chỉ cho khách **đã đồng ý nhận tin**, gửi qua Zalo OA/ZNS. **Không** dùng Zalo cá nhân nhắn hàng loạt (dễ bị khóa, xem `CLAUDE.md` mục "Tin nhắn hàng loạt").
3. Giọng Zalo: gần gũi, xưng "em", gọi "anh chị", câu ngắn xen dài, ít icon (tối đa 2–3, không dùng làm gạch đầu dòng), không danh sách ✅, không mở bài kiểu nhãn dán. Số thị trường chỉ dùng số đã có nguồn; nguồn gom 1–2 câu cuối.
4. Quy tắc cứng: không hứa lợi nhuận/tăng giá; không "sắp hết"; không căn CĐT LOCK; nhắc giá thì ghi chưa VAT/có VAT và phí bảo trì 2%; trần 6,9% chỉ PTTT 03 và 04. SĐT chỉ số trong `lienHe` (đã được phép ghi ở caption chữ).
5. Xuất file theo `agy/mau/zalo.md` (frontmatter `kenh: [zalo]`, phần `## Zalo`), đặt tên `<yyyy-mm-dd>-<chủ đề>.md` trong thư mục bàn giao, kèm ghi chú (loại bài, nguồn từng số, ngày đăng đề xuất). Có thể đưa 2 biến thể giọng để anh chọn.
6. Claude chạy `npm run check:caption -- --bai ...`, lưu vào `du-an/<mã>/content/zalo/<ngày>-<chủ đề>/caption.md` và đưa anh duyệt. Không đăng thay anh.
