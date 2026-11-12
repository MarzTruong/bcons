# Giao việc AGY: giao diện công cụ bán hàng (Newsky) (12/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-12-cong-cu-ban-hang.md` và `docs/superpowers/specs/2026-11-12-cong-cu-ban-hang-design.md`, rồi làm theo."

## Việc cần làm
Thiết kế **giao diện web app** cho một người dùng duy nhất (anh, nhân viên bán hàng) dùng trên **iPad và điện thoại, ở ngoài, có mạng**, thay cho tờ gấp và mặt bằng tầng ghi chép bằng tay. Khi gặp khách, anh: xem mặt bằng tầng → bấm chọn căn → thấy giá, tình trạng, phương án thanh toán → so sánh vài căn → bấm **xuất ảnh/PDF** căn khách chọn để gửi khách. Làm **dự án Bcons Newsky (tháp B) trước**.
- Ít nhất **2 phương án khác hẳn nhau** kèm ảnh chụp iPad ngang, iPad dọc và điện thoại; chạy được **trên dữ liệu thật** (mẫu bên dưới), bấm được, không phải ảnh tĩnh. Anh chọn 1.
- Ưu tiên: **thao tác bằng một tay, nhanh trước mặt khách**; bấm trúng căn trên mặt bằng; số đọc rõ dưới nắng ngoài trời; không rối.

## Dữ liệu và hợp đồng
- Dữ liệu căn: `giohang.json` (cấu trúc ở mục "Dữ liệu" của spec). **AGY làm giao diện đọc file JSON này**; Claude làm phần lấy dữ liệu về (Apps Script, offline). Trong lúc làm, dùng file mẫu `du-an/bcons-newsky/ban-hang-mau/giohang-mau.json` (số liệu mô phỏng cấu trúc thật, **không** phải giá thật; anh có Master File thật để thử sau). Giao diện đọc dữ liệu qua một hàm duy nhất `window.layGioHang()` trả Promise của đối tượng giohang; Claude cắm nguồn thật vào hàm này.
- **Mọi số tiền dùng lõi tính, không tự viết công thức:** `calc.js` (`calcWith`, `pmt`) và lịch đợt từ `du-an/bcons-newsky/nguon/pttt-cdt.json` (dạng `planFromJson`, như `du-an/bcons-newsky/landing/client.js`). PTTT 08, 09, 10; lãi giả định 9,5%/năm và 20 năm chỉnh được.
- **Mặt bằng:** ảnh tầng thật Block B ở Drive `Bcons/data/bcons-newsky/tai-lieu-cdt/` (thư mục `01-mat-bang-thap-b` trong `Bcons/agy/den-claude/2026-11-11-bo-tai-lieu-gui-khach-newsky/`; 9 ảnh, tầng 2, 3, 4, 5–9, 12–29, 20, ...). AGY vẽ **vùng bấm SVG cho từng căn** trên các ảnh đó (khóa: mẫu tầng + số căn trên tầng); báo lại bảng "mã căn → mẫu tầng, vị trí" nếu cần Claude khớp với mã căn trong dữ liệu.
- **Tình trạng căn:** chỉ căn `Trống` chọn được; `Đã cọc` hiện mờ "đã bán", không chọn; `CĐT LOCK` không hiện.
- **Nút xuất ảnh/PDF:** thiết kế mẫu phiếu xuất (mặt bằng tầng khoanh căn khách chọn, giá, phương án thanh toán; một căn một trang hoặc bản so sánh). Giữ quy tắc phiếu tính (`agy/giao-viec/2026-11-12-phieu-tinh.md`): một dòng giá, tên + QR, không SĐT chữ, không câu hứa, không "sắp hết". Ảnh chụp bằng SVG `foreignObject` nên dùng font hệ thống hoặc nhúng font.
- **Offline/PWA:** Claude làm (service worker, lưu cục bộ). Giao diện chỉ cần hiện "Dữ liệu cập nhật lúc hh:mm", nút "Cập nhật", và trạng thái "đang offline".
- Không đưa dữ liệu khách, hoa hồng, khóa API vào bất kỳ file nào.

## Quy tắc nội dung (từ `CLAUDE.md`)
Chiết khấu và trần lãi 6,9% chỉ hiện đúng PTTT (Newsky: trần 6,9% chỉ PTTT 09); không hứa lợi nhuận/tăng giá; chưa VAT/có VAT và phí bảo trì 2% rõ; No AI Slop.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-cong-cu-ban-hang/`: mỗi phương án một thư mục (`index.html` mở được ngay, chạy với file mẫu), ảnh chụp iPad ngang/dọc và điện thoại, `ket-qua.md` ngắn (chọn gì, vì sao, chỗ nào chưa chắc, cần Claude cung cấp thêm dữ liệu gì). **Không sửa, commit, push file trong repo.**

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm số liệu, hợp đồng dữ liệu, chạy test với dữ liệu thật, báo chỗ lệch; anh chọn phương án; Claude lắp (offline, Apps Script, xuất ảnh/PDF) và đăng.
