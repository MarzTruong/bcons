# Đối chiếu landing Bcons Newsky của AGY (11/11/2026)

Nguồn: Drive `agy/den-claude/2026-11-11-thiet-ke-landing-bcons-newsky/` (`index.html` 77 KB, `chinh-sach.html`, 30 ảnh trong `assets/`, `ket-qua.md`). Em chỉ kiểm nội dung và code, không nhận xét UX/UI. Đã đọc hết `index.html` (HTML + toàn bộ script) và `chinh-sach.html`; đối chiếu `du-an/bcons-newsky/` và `CLAUDE.md`.

## Đúng
- Số dự án khớp `thong-tin.md`: 19.779,5 m², 2 tháp 29 tầng, 1.536 căn hộ + 29 căn thương mại, bàn giao Quý II/2028, tọa độ, chủ đầu tư và đơn vị phân phối, 9 ngân hàng liên kết, văn bản pháp lý (QĐ 2074, 7052, 3759, GPXD 3288).
- Khung giá tháp B khớp bảng em lập từ file CĐT (8/60/122/10 căn; 2,56–4,72 tỷ chưa VAT); một dòng "chưa VAT, phí bảo trì 2%".
- Công thức tính từng đợt giống `engine/landing/calc.mjs` (HĐMB kèm VAT lũy tiến, bàn giao gồm VAT đợt sổ hồng, vay tính trên giá có VAT); tỷ lệ đợt khớp `pttt-cdt.json` của cả 3 PTTT.
- Chiết khấu 5,65% (PTTT 08), 2,15% (PTTT 10) và trần 6,9% (chỉ PTTT 09) chỉ hiện khi khách bấm đúng PTTT đó.
- Không metro, không hoa hồng/thưởng nóng, không hứa tăng giá hay "sắp hết", không quảng cáo tháp A; ô đồng ý không tick sẵn, sát nút gửi; nhãn "Hình ảnh minh họa" trên ảnh; không dùng họa đồ cũ có metro.
- QL13 mở rộng 8 làn: có nguồn Tuổi Trẻ 12/10/2026 (đã kiểm ở `kiem-toan/2026-11-11-nghien-cuu-binh-duong/KIEM.md`).
- Quà tặng (191, 213) đúng nội dung thông báo. Chính sách dữ liệu viện dẫn Luật BVDLCN 2025 + NĐ 356/2025; thời gian lưu 24 tháng khớp trang Central Park.
- Không thấy lỗ hổng chèn mã: dữ liệu người dùng chỉ đi qua `textContent`; `innerHTML` chỉ dùng cho hằng số trong file. Đủ 30 ảnh được trang gọi.

## Phải sửa trước khi đăng
1. **Form báo thành công giả.** Bản này chỉ kiểm tra rồi hiện "Đã ghi nhận yêu cầu…" và xóa form, không gửi đi đâu. Đăng nguyên bản thì khách tưởng đã gửi và anh mất lead. Phải nối `formUrl` của Apps Script với đúng payload (`ten, sdt, nhuCau, hp_x7, dongY, t`, kèm căn/PTTT/giá/tự có/vay/lãi/kỳ hạn/nguồn) và chờ đủ 3,2 giây như `client.js` (Apps Script coi gửi nhanh hơn 3 giây là máy).
2. **PTTT 10 thiếu mốc thời gian đợt:** ghi "Theo thông báo PTTT 10", "Theo tiến độ CĐT". Thật: 7 ngày sau ký HĐMB; 5 tháng sau HĐMB; 7 ngày sau đợt 4; 10 tháng sau HĐMB; 7 ngày sau đợt 6.
3. **Số điện thoại chỉ kiểm 9–11 chữ số;** engine dùng `^(?:\+?84|0)\d{9,10}$`. Dùng đúng mẫu của engine.
4. **Công thức đang tự viết trong trang;** nên lấy từ lõi có test (cần tổng quát hóa `calc.mjs` để đọc `pttt-cdt.json`, cùng việc đã nằm trong kế hoạch phiếu tính).

## Anh quyết (nội dung/quy tắc)
- **Bảng giá hiện cột giá PTTT 08, 09, 10 cho mọi khách.** Hai cột 08/10 là giá đã chiết khấu, trái tinh thần quy tắc 08/11 (chiết khấu chỉ hiện khi chọn đúng PTTT). Em đề nghị bảng chỉ giữ khung giá PTTT 09 (giá gốc), còn 08/10 chỉ hiện trong công cụ tính.
- **Bản đồ nhúng Google Maps** (`maps.google.com/maps?...output=embed`). Anh đã bỏ Google Maps vì bị hạn chế ở VN; đề nghị thay bằng OpenStreetMap hoặc chỉ giữ nút "Mở bản đồ".
- **Câu "Tiện ích hiện hữu xung quanh" (trường học, bệnh viện quốc tế, trung tâm thương mại, KCN)** không có nguồn trong tài liệu dự án. Đề nghị bỏ hoặc kèm nguồn kiểm được.
- Nhãn "Giá căn hộ sau chiết khấu" hiển thị cả khi chọn PTTT 09 (không có chiết khấu): đổi thành "Giá căn hộ có VAT".

## Tích hợp (chờ anh OK)
Thứ tự: (1) tổng quát hóa `calc.mjs` đọc `pttt-cdt.json` (Task 1 của kế hoạch phiếu tính); (2) đưa trang vào `du-an/bcons-newsky/landing/` (index, chính sách, 30 ảnh), thay công thức tự viết bằng lõi có test, nối form vào Apps Script bằng payload đã test, sửa các mục trên; (3) dựng bằng `npm run landing -- --du-an bcons-newsky` và đăng. Anh cần: tạo Apps Script + sheet riêng cho Newsky (hoặc cho em dùng chung, mỗi dự án một tab), và dự án đăng trang (ví dụ Cloudflare Pages).
