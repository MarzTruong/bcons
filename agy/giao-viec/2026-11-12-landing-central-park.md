# Giao việc AGY: landing Bcons Central Park mới (12/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-12-landing-central-park.md` và làm theo."

## Việc cần làm
Thiết kế lại trang landing của **Bcons Central Park** theo cách đã làm với landing Newsky (`du-an/bcons-newsky/landing/index.html`, anh đã chốt bản đó): một file `index.html` + `chinh-sach.html` + ảnh, có công cụ tính dòng tiền theo phương thức thanh toán, form đăng ký, nút Gọi/Zalo. Trang hiện tại do code dựng (`engine/landing/page.mjs`), anh muốn thay bằng thiết kế của AGY. Đây là phiên bản thay thế cho kế hoạch cũ "Mapbox vệ tinh, 5 tháp, OpenFreeMap" (hủy phiên cũ); bản đồ và 5 tháp AGY quyết định theo thiết kế, **không dùng Mapbox** (không cần token; dùng OpenStreetMap nhúng như Newsky). Anh sẽ bổ sung ý "bỏ file UQ" (anh giải thích rõ lúc giao việc).
- Ít nhất 2 phương án khác hẳn nhau, kèm ảnh chụp desktop và điện thoại. Anh chọn 1.
- Dữ liệu và hợp đồng (bắt buộc giữ, chi tiết ở dưới) lấy từ `du-an/bcons-central-park/` (`project.json`, `thong-tin.md`, `nguon/pttt-cdt.json`, `landing/landing.json`).

## Hợp đồng với code (bắt buộc; đây là chỗ landing Newsky từng lỗi)
- **Công cụ tính không tự viết công thức.** Dùng lõi `calc.js` (`calcWith`, `pmt`) và lịch đợt từ dữ liệu nhúng, đúng cách `du-an/bcons-newsky/landing/client.js`. Với Central Park là 5 PTTT (01–05) và 5 căn mẫu; code build thay `__DATA__` bằng dữ liệu.
- **Form** gửi POST `text/plain` (`mode: "no-cors"`) tới `formUrl` trong `landing.json`, chờ đủ **3,2 giây** từ lúc mở trang rồi mới gửi (máy chủ coi nhanh hơn là máy tự động), gồm các trường: `ten, sdt, nhuCau, hp_x7 (ô bẫy, ẩn, để trống), dongY (true), t (ms từ lúc mở trang), canStt (số thứ tự căn mẫu đang chọn, bắt đầu từ 0), canLoai, canMoTa ("tháp X, tầng N"), dt, pttt ("PTTT 03"), giaChuaVat, giaCoVat, phiBaoTri, tuCo, vay, traGop, lai, nam, duAn ("bcons-central-park"), nguon, trang`. **Trang không chứa mã căn** (chỉ gửi `canStt`); không đưa mã căn lên trang.
- Ô đồng ý nhận tin **không tick sẵn**, sát nút gửi; không báo "đã gửi" nếu chưa gửi thật.
- Quy tắc hiển thị: đúng một dòng giá "chưa VAT/có VAT, phí bảo trì 2%"; chiết khấu PTTT 01 (8,5%), 04/05 (2,45%) và trần lãi 6,9% chỉ hiện khi khách chọn đúng PTTT đó (trần 6,9% chỉ PTTT 03 và 04); "Hình ảnh minh họa" chỉ gắn trên chính ảnh phối cảnh; không "sắp hết", không hứa tăng giá; không câu "tự bảo vệ" kiểu "theo bảng giá CĐT ngày...". Xem `CLAUDE.md` mục "Quy tắc nào được hiện cho khách xem".
- Liên hệ: nút Gọi/Zalo theo `project.json` → `lienHe`; không ghi SĐT trong dữ liệu dùng cho phiếu.
- Ảnh trang cần "Hình ảnh minh họa" cho phối cảnh, tên căn cho ảnh nhà mẫu thật. Chỉ dùng ảnh trong `Bcons/data/bcons-central-park/tai-lieu-cdt/` và `du-an/bcons-central-park/assets/images/`.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-landing-central-park/`: `index.html`, `chinh-sach.html`, `assets/`, ảnh chụp desktop và điện thoại 390 px, `ket-qua.md` ngắn. **Không sửa, commit, push file trong repo.**

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm số liệu, công thức, payload form, chạy test chuỗi (`npm test` có `chuoi-lien-ket.test.mjs`), rồi lắp vào `du-an/bcons-central-park/landing/` như đã làm với Newsky; build kiểm trên mạng bằng `npm run kiem-mang`.
