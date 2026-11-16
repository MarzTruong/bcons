# Kiểm AGY: ảnh bìa phương án 1 (16/11/2026)

Nguồn: Drive `den-claude/2026-11-16-bia-phuong-an-1` (ket-qua.md, index.html, bia.json, bia-mau.json, luoi-12-mau.json, 6 PNG + lưới). Chỉ kiểm nội dung và code, không nhận xét UX.

## Đúng
- 6 bìa thật khớp spec/kịch bản: "8 làn" (video Newsky 1), "150 triệu" (Newsky 2), "3" cách (Newsky 6), "3 công trình" (CP 8), "9–10,7%/năm 1–2 năm đầu" (CP 7, Vietcap), "58" (CP 4).
- Đã sửa 4 lỗi của lần trước: màu theo `chuDe` (enum 4 giá trị, thiếu thì `du-an`), chỉ còn Be Vietnam Pro (nạp woff2 trong `assets/fonts/`), `index.html` không còn dữ liệu chép sẵn (đọc `bia.json`), bỏ cụm nút khỏi khung chụp.
- Ảnh nền dùng đúng ảnh có trong repo (phối cảnh, nhà mẫu B4, ảnh Tuổi Trẻ). Mọi ô phối cảnh đều ghi "Phối cảnh minh họa".

## Sai / cần sửa
1. **"58 km cao tốc thông xe" bỏ chữ "gần".** Nguồn VnExpress và spec video 4 ghi "gần 58 km". Phải là "gần 58" hoặc "58 km" kèm "gần" ở ghi chú. Em sửa ở `bia.json` khi tích hợp (không phải lỗi hiển thị).
2. **Lưới 12 ô có 3 ô số chưa đủ nguồn** (ô này chỉ là mẫu, nhưng sau này dễ chép sang bìa thật):
   - "2,4 tỷ USD (9 tháng)": nguồn trong repo ghi "gần 2,4 tỷ USD", có báo khác ghi ~2,5; bản "10 tháng" đã bị loại ở biên bản kiểm Gemini.
   - "21,5 ha đất đấu giá KCN Biên Hòa 1": không tìm thấy trong `du-an/`. Chưa có nguồn.
   - "Giá sơ cấp Bình Dương cũ 60 triệu/m²": nguồn nói "căn hộ mới, mặt bằng chung" (không phải giá sơ cấp, không phải giá Newsky). Đổi chữ khi dùng.
3. **ket-qua.md tự mâu thuẫn:** mục 3 nói nhãn nâng lên 32 px kèm `de-xuat-nhan-minh-hoa-pa-phu.png` mở bằng `?label=alt`, nhưng code là 35 px, không có CSS `.label-alt`, thư mục không có file PNG đó. Chỉ là chữ thừa trong báo cáo, code là bản đúng (anh đã chốt 35 px dưới tên dự án).
4. **Ảnh nền chỉ tải được khi mở qua máy chủ** (`fetch` JSON, `../assets/images`). Chụp bằng Playwright trong repo phải mở qua `http://` nội bộ, không `file://`; em tính trong lệnh `npm run bia`.

## Việc cần anh quyết
- Không cần quyết gì thêm cho mẫu bìa (đã chọn phương án 1). Em tích hợp `npm run bia` + khung bìa đầu video khi anh nói OK; trước đó em không đụng engine.
- Lưới 12 ô: chỉ dùng 6 ô thật cho đến khi 3 ô trên có nguồn.
