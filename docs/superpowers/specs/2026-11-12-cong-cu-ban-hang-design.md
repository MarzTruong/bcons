# Công cụ hỗ trợ bán hàng khi gặp khách (Newsky trước): thiết kế

> **Trạng thái:** Nháp chờ anh duyệt (12/11/2026). Anh chốt hướng: web app, Newsky làm trước, chỉ anh dùng, iPad/điện thoại ở ngoài có mạng, cập nhật tự động khi mở và có nút bấm cập nhật. Giao diện giao AGY (`agy/giao-viec/2026-11-12-cong-cu-ban-hang.md`).

## Mục tiêu
Thay cách bán cũ (cầm tờ gấp, mặt bằng tầng, ghi chép lên giấy) bằng một công cụ số: **xem mặt bằng tầng, bấm chọn căn, thấy giá và tình trạng, tính phương án thanh toán, so sánh vài căn, rồi xuất ảnh/PDF "căn khách chọn" để gửi khách.** Dùng để check giá, tư vấn và giúp khách chọn căn ngay tại chỗ.

## Nền tảng (đã chốt)
- **Web app** chạy trong Safari/Chrome trên iPad và điện thoại, thêm vào màn hình chính được (PWA). Không phải app cài từ cửa hàng. Cùng một bản cho mọi thiết bị, sửa xong là dùng ngay.
- **Trang (code, giao diện)** là file tĩnh đăng trên Cloudflare Pages (một project riêng, ví dụ `bcons-ban-hang`), **không chứa giá hay tình trạng căn**.
- **Dữ liệu giỏ hàng** (giá, tình trạng từng căn) nằm trong Google Sheet của anh (bản Google Sheet của Master File Newsky) và chỉ ra ngoài qua **Apps Script riêng** trả JSON khi có khóa bí mật. Khóa nằm trong liên kết cài đặt anh mở một lần trên mỗi thiết bị (lưu trong máy, không đưa lên git, không đưa lên trang công khai).
- **Mất mạng vẫn xem được:** dữ liệu và trang lưu trong máy (service worker + lưu cục bộ); báo rõ "dữ liệu cập nhật lúc hh:mm".
- **Cập nhật:** tự tải lại khi mở ứng dụng nếu có mạng, và nút "Cập nhật" bấm tay. Khi anh sửa Sheet (dán giỏ hàng mới của CĐT) thì lần mở sau là thấy.

## Dữ liệu `giohang.json` (hợp đồng giữa Apps Script, lõi và giao diện)
Mỗi căn: `ma` (vd. `B1.3-01`), `thap`, `tang`, `viTri` (số căn trên tầng), `loai` (2PN-2WC...), `dtTimTuong`, `dtThongThuy`, `giaChuaVat` theo PTTT `{ "08", "09", "10" }`, `tinhTrang`. Kèm `capNhat` (ISO) và `phienBan`.
- Chỉ căn **"Trống"** chọn/tư vấn được. **Đã cọc** hiện mờ là "đã bán" trên mặt bằng, không chọn, không tư vấn. **CĐT LOCK** không hiện (chưa mở bán). Dữ liệu từ Master File sheet `GiaTongHop` (đã có hàm đọc cột: `engine/landing/phieu/can.mjs`).
- Mặt bằng: ảnh tầng thật của CĐT (Drive `Bcons/data/bcons-newsky/tai-lieu-cdt/`, 9 ảnh Block B). Vùng bấm (SVG phủ lên ảnh) cho từng căn do AGY vẽ; khóa là `(mẫu tầng, viTri)`. Em cung cấp bảng ánh xạ mã căn → (mẫu tầng, viTri).

## Chức năng
1. Chọn tháp/tầng, xem mặt bằng, căn trống sáng, đã bán mờ.
2. Bấm căn → thẻ: mã, loại, diện tích tim tường/thông thủy, giá 3 PTTT (chưa VAT và có VAT), tự có đến nhận nhà, khoản vay, trả góp ước tính (lãi và kỳ hạn chỉnh được), bảng đợt thanh toán. Mọi số **dùng lõi `calc.js`**, không tự tính.
3. Lọc theo loại căn, diện tích, ngân sách (giá có VAT hoặc vốn tự có), PTTT.
4. Danh sách rút gọn (2–4 căn) để so sánh cạnh nhau.
5. Ghi chú tư vấn theo khách (lưu trong máy anh, không lên mạng).
6. **Xuất ảnh/PDF** cho căn đã chọn (và bản so sánh): mặt bằng tầng khoanh căn đó + giá + phương án thanh toán, đúng quy tắc phiếu tính (một dòng giá, không hứa gì, không SĐT chữ; có tên + QR).

## Phân việc
- **AGY:** toàn bộ giao diện: bố cục, mặt bằng tương tác, vùng bấm từng căn, thẻ căn, so sánh, mẫu ảnh/PDF xuất, trải nghiệm trên iPad ngang/dọc và điện thoại.
- **Claude:** Apps Script giỏ hàng, hợp đồng dữ liệu, bảng ánh xạ căn, lõi tính (dùng lại `calc.js`, `phieu-core.mjs`), lưu cục bộ/offline, bảo mật khóa, xuất ảnh/PDF, test cả chuỗi, build và kiểm trên mạng.

## Bảo mật
- Giá và tình trạng từng căn là dữ liệu nội bộ: không để trong repo hay trong trang công khai; chỉ ở Sheet và trả qua khóa.
- Khóa nằm trong liên kết cài đặt gửi riêng cho anh, đổi được (đổi khóa là các thiết bị cũ ngưng tải dữ liệu mới). Trang có `noindex`.
- Không ghi dữ liệu khách vào công cụ này (chỉ anh dùng; ghi chú chỉ ở máy).

## Giai đoạn
1. **Lõi dữ liệu (Claude):** chuyển Master File Newsky thành Google Sheet, viết Apps Script trả `giohang.json` theo khóa, bảng ánh xạ căn, test với dữ liệu thật (200 căn tháp B), tải thử.
2. **Giao diện (AGY):** 2 phương án demo trên dữ liệu thật; anh chọn.
3. **Tích hợp (Claude):** lắp bản chọn, offline, xuất ảnh/PDF, test chuỗi, đăng, kiểm trên iPad của anh.
4. **Vùng bấm và mặt bằng thật (AGY + Claude).**
5. Dùng thử ngoài thực tế 1–2 tuần, sửa theo góp ý, rồi làm Central Park.

## Chưa quyết (hỏi anh khi tới bước đó)
- Có cần thêm mã PIN khi mở app (ngoài khóa trong liên kết)?
- Căn nào hiện trên mặt bằng khi CĐT đổi trạng thái giữa chừng (anh cập nhật Sheet bằng tay hay dán lại giỏ hàng)?
- Mẫu ảnh xuất: một căn một trang hay gộp nhiều căn.
