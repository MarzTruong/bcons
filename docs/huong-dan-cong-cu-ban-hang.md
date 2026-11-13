# Công cụ bán hàng (Bcons Newsky, tháp B)

Trang web chạy trên iPad/điện thoại của anh: chọn tầng, bấm căn, xem giá và phương án thanh toán, so sánh, xuất ảnh gửi khách. Chỉ anh dùng. Giá và tình trạng căn **không nằm trong trang**; chúng nằm trong Google Sheet của anh và chỉ ra ngoài khi có khóa bí mật.

## Cách chạy
- **Trang (code):** `engine/banhang/web/` (giao diện AGY + phần nối của em). Dựng bằng `node engine/banhang/build.mjs` ra `engine/banhang/dist/bcons-newsky/` (không lên git, Cloudflare tự dựng).
- **Số tiền:** mọi số đi qua `engine/banhang/tai-chinh.mjs` (dùng `calc.mjs` + `pttt-cdt.json`). Giao diện không có công thức riêng; test chặn.
- **Giỏ hàng:** Apps Script `engine/banhang/apps-script/Code.gs` đọc sheet `GiaTongHop`, chỉ trả mã, loại, tầng, hướng, diện tích, giá 3 PTTT, tình trạng. Không trả cột khách hay hoa hồng (test chặn).
- **Offline:** mở được khi mất mạng bằng bản giỏ hàng lưu lần cập nhật gần nhất; góc trên ghi "Dữ liệu cập nhật lúc ... · đang offline". Đổi khóa thì máy cũ **không** dùng dữ liệu cũ nữa (tránh bán theo giá cũ).

## Việc anh làm một lần (em chưa làm được vì cần tài khoản của anh)
1. **Tạo Sheet giỏ hàng riêng** từ Master File Newsky, giữ hai tab `GiaTongHop` và `GHC` (giỏ hàng chung của CĐT) cùng `ThamSo`, **không** để tab KhachHang/HoaHong. Cột "Tình trạng trên GIỎ HÀNG CHUNG" là công thức đọc tab `GHC`: thiếu `GHC` thì mọi căn ghi "Không có trong GHC" và công cụ coi là chưa rõ tình trạng (không chọn được).
2. Trong Sheet: Tiện ích mở rộng > Apps Script, dán nội dung `Code.gs`. Cài đặt dự án > Thuộc tính tập lệnh: thêm `KHOA` = một chuỗi dài ngẫu nhiên (không gửi cho em, không dán vào chat).
3. Triển khai > Ứng dụng web: chạy bằng "Tôi", truy cập "Bất kỳ ai". Chép link `/exec`.
4. Tạo project Cloudflare Pages `bcons-ban-hang` nối repo `MarzTruong/bcons`: build command `node engine/banhang/build.mjs`, output `engine/banhang/dist/bcons-newsky`.
5. Mở trang trên iPad, ô "Link Apps Script" dán link `/exec`, ô "Khóa" nhập khóa, bấm Lưu. Chọn "Thêm vào màn hình chính".
Xem thử không cần khóa: mở `<trang>/#demo` (giỏ hàng mẫu mô phỏng, không phải giá thật).

## Dùng hằng ngày
- CĐT gửi giỏ hàng mới: dán lại giá trị vào tab `GiaTongHop`; lần mở sau tự cập nhật, hoặc bấm "Làm mới".
- Đổi khóa: sửa `KHOA` trong Apps Script, nhập khóa mới trên từng thiết bị (màn hình báo "Sai khóa").

## Đã kiểm với dữ liệu thật (13/11/2026)
- Công thức bản AGY chép riêng: 600 phép tính (200 căn thật x 3 PTTT) **khớp lõi từng đồng**; lịch đợt khớp `pttt-cdt.json`.
- Mã, loại căn, diện tích của 24 vị trí B1/B2 khớp mặt bằng CĐT (test `web.test.mjs`).
- **Đã sửa:** (1) "Vay 70%/50%/Không vay" cộng nhầm đợt sổ hồng vào vốn tự có (lệch 128 đến 236 triệu mỗi căn PTTT 09); (2) "LS trần 6,9%" hiện cho cả PTTT 08/10 và vay tùy chọn; (3) "Đã trừ CK PTTT" hiện cho cả PTTT 09 (không có chiết khấu); (4) ảnh xuất cho khách ghi SĐT chữ, đổi thành tên + mã QR; (5) hướng view mất giữa chừng nên thẻ căn luôn hiện "Đang cập nhật"; (6) sửa tên/SĐT chuyên viên không lưu được (đọc và ghi khác khóa); (7) nút "Làm mới" chỉ đổi giờ, không tải gì; (8) giá căn đã cọc còn nằm trong dữ liệu ô; (9) bỏ hai câu không có trong tài liệu CĐT ("hướng đón gió", "phù hợp tầng trung view thoáng").

## Việc gửi lại AGY (lỗi hiển thị/chữ, em không tự chỉnh)
- Ô căn không có trong giỏ hàng (CĐT LOCK hoặc chưa mở) đang ghi "ĐÃ BÁN / KHÓA": nên đổi chữ trung tính, vì căn LOCK không phải căn đã bán.
- Form nhập link + khóa (`main.js`, id `formCaiDat`) mới làm tối giản, cần AGY thiết kế lại; icon `du-an/bcons-newsky/ban-hang/icon-192.png`/`icon-512.png` đang là logo thu nhỏ tạm.
- Phông Be Vietnam Pro đang tải từ Google Fonts; mất mạng lần đầu thì dùng phông hệ thống. Nên nhúng phông vào trang.
- Tên chuyên viên: anh đã chốt 13/11/2026 theo `project.json` là "Tuấn Trương" (đã sửa chỗ viết cứng "Trương Tuấn" trong bản AGY).
