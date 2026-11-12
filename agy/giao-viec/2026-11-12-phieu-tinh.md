# Giao việc AGY: giao diện phiếu tính gửi khách (12/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-12-phieu-tinh.md` và làm theo."

## Việc cần làm
Thiết kế **một template phiếu tính** (HTML/CSS thuần, một file) cho Bcons PS Land. Phiếu là ảnh/trang anh gửi khách qua Zalo: **cho đúng một căn (hoặc một loại căn) và một phương thức thanh toán (PTTT) khách chọn**, trả lời một câu: "em cần chuẩn bị bao nhiêu tiền, vào lúc nào".
- Ít nhất **2 phương án khác hẳn nhau** (bố cục, cách nhấn con số chính), kèm ảnh chụp. Anh chọn 1, AGY tinh chỉnh.
- Đọc thêm: `docs/superpowers/specs/2026-11-11-phieu-tinh-design.md` (thiết kế, nội dung bắt buộc, quy tắc cấm, 6 tiêu chí UX), 3 ảnh mẫu cũ ở `docs/superpowers/specs/assets/phieu-mau/` (tham chiếu, **không bắt buộc theo**), và template tạm hiện có `engine/landing/phieu/mau/phieu.html` (chỉ để biết hợp đồng, bản này xấu, thay hết).

## Hai nơi dùng chung một template
1. **Máy anh:** Chrome không giao diện chụp ra PNG rộng 1080 px (từ trang rộng 540 px, tỷ lệ 2x) và PDF khổ A4. Lệnh `/phieu` trên bot.
2. **Trang web `phieu.html`** trên điện thoại khách/anh (link trong tin Telegram): hiển thị phiếu + nút **"Lưu ảnh phiếu"** (tải PNG). Trên điện thoại nội dung phải co theo bề ngang màn hình (tối đa 540 px).

## Hợp đồng với code (bắt buộc giữ)
- Dữ liệu nằm trong `<script type="application/json" id="phieu-data">__PHIEU_DATA__</script>` (đúng một chuỗi `__PHIEU_DATA__`, code sẽ thay bằng JSON). Trang web thì gọi `window.veTheoDuLieu(phieu)`.
- Template tự vẽ nội dung vào phần tử `#app`, xong thì đặt `document.documentElement.dataset.ready = "1"`. Hàm `window.veTheoDuLieu(P)` phải có.
- **Không tự tính tiền trong template.** Mọi số lấy từ dữ liệu: `gia`, `dot[]`, `tong`, `vay`. Chỉ định dạng (ví dụ "2,19 tỷ", "874 triệu", dấu chấm nghìn).
- Cấu trúc dữ liệu `P`: xem mục "Schema" của spec và mẫu thật `docs/superpowers/specs/assets/phieu-mau/data.json`. Điểm cần xử lý: `can.ma` có thể **null** (căn theo khung giá: chỉ có loại căn); `can.dtTimTuong` có thể 0; `lienHe.qrSvg` có thể **vắng** (không có QR thì ẩn khối QR, không ghi "quét mã"); `vay` có thể **null** (PTTT không vay); `pttt.coTranLai` false thì không nhắc trần lãi.
- Nút **"Lưu ảnh phiếu"** và thanh dưới đang là của code (`id="luu-anh"`, `engine/landing/phieu/trang.mjs`); AGY được thiết kế lại nút này (chữ, màu, vị trí) nhưng giữ `id="luu-anh"` và `id="luu-anh-loi"`. Ảnh được chụp bằng SVG `foreignObject` nên **font ngoài (Google Fonts) không vào ảnh**: dùng font hệ thống hoặc nhúng font (base64) trong file.
- Ba kích thước: ảnh PNG rộng 1080 px (cao tối đa khoảng 1.800 px), PDF A4 **một trang**, điện thoại 360–430 px.

## Quy tắc nội dung (từ `CLAUDE.md`, không nới)
- **Đúng một dòng giá**: chưa VAT, có VAT, phí bảo trì 2% đóng thêm khi nhận nhà.
- Con số chính: **vốn tự có trước khi nhận nhà**; phụ: khoản vay, bàn giao, sổ hồng, trả góp ước tính/tháng (ghi lãi và kỳ hạn là giả định).
- Không SĐT dạng chữ trên hình (đã có tên + QR). Không hoa hồng, không dữ liệu khách. Không hứa lợi nhuận/tăng giá, không "sắp hết", không câu tự bảo vệ kiểu "theo bảng giá CĐT ngày...".
- Chiết khấu PTTT và trần lãi 6,9% chỉ hiện khi dữ liệu có (code đã lọc).
- No AI Slop: không hộp viền phát sáng, không đánh số 01/02/03 khi không phải trình tự, không nhãn chữ hoa giãn chữ, không thẻ giống hệt nhau xếp hàng. Chữ thân ≥ 13 px ở bề rộng 540 px.
- Nhãn "Hình ảnh minh họa" chỉ gắn trên ảnh phối cảnh (phiếu hiện không có ảnh).

## Dữ liệu để thử (cả hai dự án)
Chạy được trong cloud/máy anh: `npm run phieu:mau` (6 phiếu: Central Park PTTT 03 và 01, Newsky 08 (12 đợt) và 10, tên khách rất dài, không tên). Hoặc dùng `data.json`; tự ghép thêm trường hợp `can.ma = null`, `vay = null`, không có QR.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-phieu-tinh/`: `phieu.html` (hoặc `phuong-an-a.html`, `phuong-an-b.html`), ảnh chụp 6 trường hợp trên (PNG 1080 px) cho mỗi phương án, ảnh chụp trên điện thoại 390 px, `ket-qua.md` ngắn (chọn gì và vì sao, chỗ nào chưa chắc). **Không sửa, commit, push file trong repo.**

## Sau đó
Anh gọi `/agy-doc`: Claude kiểm số liệu, hợp đồng dữ liệu, chạy thử bằng code thật, báo chỗ lệch; anh chọn phương án; Claude lắp vào `engine/landing/phieu/mau/phieu.html` và chạy test.
