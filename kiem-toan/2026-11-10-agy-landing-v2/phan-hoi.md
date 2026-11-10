# Đối chiếu landing v2 của AGY (11/11/2026)

Nguồn: Drive `agy/den-claude/2026-11-10-thiet-ke-landing-v2/` (`ket-qua.md`, `phuong-an-a|b.html`, bản `-relative.html`, ảnh `phuong-an-a|b-dien-thoai.png`). AGY đã sửa các lỗi lần trước: ô đồng ý không tick sẵn, form đúng tên trường (`ten`, `sdt`, `nhuCau`, `hp_x7`), không còn câu "Tuyệt đối không Slop", giá mẫu đúng `landing.json`, có nhãn "Hình ảnh minh họa" trên ảnh phối cảnh, chỉ ghi tên căn B4 ở ảnh nhà mẫu.

## Còn vi phạm quy tắc (cả hai phương án)
1. **Bảng "So sánh 5 phương thức thanh toán" có cột Chiết khấu (8,5%, 2,45%) và dòng "trần 6,9% chỉ áp dụng cho PTTT 03 và 04"** hiện sẵn cho mọi khách. Quy tắc 08/11: các số này chỉ hiện trong công cụ tính khi khách chọn đúng PTTT. Đề nghị bỏ bảng, để công cụ tính thể hiện từng PTTT.
2. **Nhãn kỹ thuật nằm trong trang:** "Khung công cụ tính: Claude gắn calc.mjs và client.js", "Khung form: Claude dùng form của page.mjs…". Chỉ là khung giữ chỗ, không được lên trang thật.
3. **Số trong khung công cụ tính là số gõ tay** ("262 triệu (có VAT)", "12,3 triệu/tháng", lãi 9,5%, 20 năm), không phải kết quả của `calc.mjs`. Khi tích hợp phải thay bằng kết quả thật và ghi dòng "có VAT" theo công cụ.
4. Câu "Lãi vay và kỳ hạn là giả định; lãi thực tế theo ngân hàng lúc vay" và "đồng ý… nhắn NGỪNG cho fanpage": giữ được nếu anh muốn, nhưng ô đồng ý phải nối vào form thật của `page.mjs` (hiện `onsubmit="return false"`).

## Về thiết kế (chờ anh chọn)
- **Phương án A** (kem + xanh rừng + đất nung, Cinzel/Playfair): đẹp nhưng là bảng màu "kem – xanh – đất nung" rất hay gặp ở sản phẩm do AI làm; 4 thẻ số liệu giống hệt nhau xếp lưới 2×2; tiêu đề Cinzel toàn chữ hoa. Dễ bị đọc là rập khuôn.
- **Phương án B** (khối vàng `#ffe14d`, Montserrat 900 + Be Vietnam Pro): giữ ngôn ngữ landing hiện tại, ít thẻ hộp, số liệu dạng dòng kẻ. Gần với "Mẫu 3 khối vàng" anh đã chọn trước đó (chưa xác nhận lại).
- Em nghiêng về B, bỏ bảng 5 PTTT và các nhãn kỹ thuật.

## Câu hỏi anh còn nợ (từ lần trước)
Ảnh nhà mẫu B4 có phải nhà mẫu thật; số CĐT và "60 tiện ích"; "48 tháng" ở PTTT 03/04 (nguồn CĐT ghi "tối đa 48 tháng, không quá 24 tháng kể từ thông báo bàn giao").
