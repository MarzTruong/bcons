# Biên bản kiểm: AGY chỉnh bố cục công cụ bán hàng (13/11/2026)

Nguồn: Drive `Bcons/agy/den-claude/2026-11-13-cong-cu-ban-hang-bo-cuc/` (`index.template.html`, `app.js`, ảnh chụp, `ket-qua.md`). Chưa đưa vào repo (chờ anh duyệt UX và nói "OK").

## Đã kiểm (không nhận xét UX)
- **Phạm vi sửa:** so với bản đã đăng, AGY chỉ đổi bố cục (lưới, cột phải 318px/294px, SVG lớn hơn, drawer đáy cho điện thoại) và thêm nhóm "1PN+". Mọi chỗ em đã sửa (tính tiền qua `phuongAn`, trần 6,9% theo PTTT, ảnh xuất tên + QR, hướng view, lưu chuyên viên, nút Làm mới, nhãn "CHƯA RÕ") còn nguyên.
- **Test:** thay hai file của AGY vào bản sao sạch, `web.test.mjs` chạy 18/18 qua (số tiền khớp lõi mọi PTTT, đã cọc/LOCK, vay tùy chọn, ảnh xuất, Làm mới, offline).
- **Chạy thật ở 3 cỡ:** 1024×768, 768×1024, 390×844 với giỏ hàng mẫu: 0 lỗi script, không tràn ngang, bấm căn mở drawer ở màn nhỏ, số ở thẻ căn đúng.
- **Quy tắc cứng:** không câu cấm (test), không SĐT chữ trên ảnh xuất, giá căn đã cọc không hiện.

## Cần anh quyết (dữ liệu, không phải UX)
1. **Nhóm "1PN+" tự đặt:** AGY đổi nhãn loại của căn 47 m² (B2-11, B2-12, và mọi căn < 50 m²) từ "2PN-1WC" thành "1PN+ (1WC)", dựa vào diện tích. Dữ liệu CĐT (bảng giá và mặt bằng) ghi các căn này là **2 phòng ngủ, 1 WC**, và repo không có tài liệu CĐT nào dùng chữ "1PN+". Theo quy tắc số liệu lấy từ tài liệu CĐT: nếu "1PN+" là cách gọi của anh/sàn thì giữ nhãn đó nhưng thẻ căn nên vẫn ghi loại gốc "2PN-1WC"; nếu không thì bỏ nhóm này. Điều kiện `diện tích < 50` cũng sẽ gom nhầm căn khác nếu CĐT thêm căn nhỏ.
2. Nhãn "🏆 CĂN 1PN+ RẺ NHẤT TOÀN THÁP" (và mô tả) nói "toàn tháp" trong khi cờ rẻ nhất của lõi tính theo **block**; hiện chỉ B2 có căn 47 m² nên đúng, nhưng nếu B1 có thì sẽ sai. Nên ghi "toàn block".

## Việc còn lại
- Anh duyệt ảnh chụp (UX). Nếu OK và quyết xong mục 1: em lắp hai file vào `engine/banhang/web/`, sửa nhóm 1PN+ nếu cần, `npm test`, đẩy lên `main`.
