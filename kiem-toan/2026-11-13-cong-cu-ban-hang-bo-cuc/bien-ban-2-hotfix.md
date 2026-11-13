# Biên bản kiểm lần 2: AGY "9 hạng mục hotfix" công cụ bán hàng (13/11/2026)

Nguồn: anh đính kèm vào chat (`app.js`, `index.template.html`, `ket-qua.md`). Chưa đưa vào repo.

## Đã kiểm (không nhận xét UX)
- Lõi còn nguyên: tiền qua `phuongAn`, trần 6,9% theo PTTT, QR trên ảnh xuất, nút Làm mới, nhãn "CHƯA RÕ", giá căn đã cọc không nằm trong ô.
- Thay hai file vào bản sao sạch, chạy `web.test.mjs`: **14 qua, 4 hỏng** (xem dưới).

## Sai / lệch
1. **Nhóm "1PN+" quay lại** (AGY làm trên bản cũ, chưa `git pull` bản 07af282 anh đã chốt bỏ): bộ lọc "1PN+ (47m²)", nhãn "1PN+ (1WC)", và nhãn mới "CĂN HỘ RẺ NHẤT TOÀN THÁP B (DÒNG 47M² TỐI ƯU)". CĐT ghi căn này là 2PN-1WC; "tối ưu" là chữ tự đặt; "toàn tháp" trong khi cờ tính theo block. Test chặn.
2. **SĐT chữ trên ảnh xuất gửi khách** (hạng mục 8: dòng "Hotline / Zalo: <SĐT>" trên phiếu và bảng so sánh). Trái quy tắc 7 (ảnh/phiếu: tên + QR, không SĐT chữ). Test chặn. Cần anh quyết.
3. **Công thức VAT viết cứng trong giao diện** (`Math.round(giacv * 1.1)`, 2 chỗ ở tooltip mặt bằng). Số ra đúng nhưng trái hợp đồng "giao diện không tự tính"; khi lắp em thay bằng `giaCoVat` của lõi.
4. `fmtTrieu` từ 1 tỷ trở lên hiện "1,22 tỷ" thay vì "1223 triệu": chỉ đổi cách hiện (mất 1 chữ số lẻ), không sai số; 2 test hỏng vì so chuỗi cũ, em sửa test khi lắp.

## Việc cần anh quyết
- Mục 2: giữ quy tắc (bỏ dòng SĐT, chỉ tên + QR) hay cho phép SĐT trên ảnh của công cụ này (đổi quy tắc 7).
- OK lắp phần còn lại (em bỏ 1PN+, thay VAT bằng lõi, sửa test định dạng).
