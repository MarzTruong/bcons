# Việc giao AGY: sửa nhỏ ảnh bìa và bảng lộ trình tiền (16/11/2026)

Kết quả vòng trước đã được kiểm (`kiem-toan/2026-11-16-bia-phuong-an-1/KIEM.md`, `kiem-toan/2026-11-16-bang-lo-trinh-tien/KIEM.md`). Số liệu đúng; chỉ sửa chữ và dữ liệu như dưới. Không đổi bố cục, màu, kích thước.

## Bảng lộ trình tiền (phương án 1)
1. Chú thích cuối cảnh viết lại: "Đơn vị: triệu đồng. Giá căn ví dụ chưa VAT; VAT thu đủ tới lúc nhận nhà. Đợt nhận nhà gồm 25%, VAT còn lại và phí bảo trì 2%."
2. Nhãn mốc "Nhận nhà" ghiChu: "25% + VAT còn lại + phí bảo trì 2%".
3. "Tổng (VAT & PBT 2%)" đổi thành "Tổng (có VAT, phí bảo trì)". Không dùng chữ viết tắt PBT.
4. Bỏ khối dữ liệu chép sẵn `inline-data` trong `index.html`; chỉ đọc `lo-trinh-mau.json`.
5. Tổng các phần (tự có, ngân hàng, nhận nhà, sổ hồng) tính bằng JS từ `moc[]` (theo `ai` và `nhan`), không đọc các trường tổng viết sẵn; giữ các trường đó trong JSON để em đối chiếu test.
6. Mốc cue c1..c7 đọc từ trường `cueGiay` trong JSON (số giây), không viết cứng trong JS; mẫu JSON ghi các giá trị hiện tại (0,5 / 1,6 / 3,0 / 4,4 / 5,4 / 6,8 / 8,1).

## Ảnh bìa
1. `bia-mau.json`: ô "58 km cao tốc thông xe" đổi `diemNhan` "gần 58", `ghiChuNhan` "km cao tốc thông xe".
2. `luoi-12-mau.json`: bỏ 3 ô thiếu nguồn (FDI 2,4 tỷ USD; 21,5 ha đấu giá; "Giá sơ cấp Bình Dương cũ"); thay bằng 3 bìa thật khác (video Newsky 3, 4, 5: thuê lại 24 tháng; Quốc lộ 13 về Bình Triệu 60 mét; giá 60 triệu/m² ghi "mặt bằng chung căn hộ mới"). Lưới còn 12 ô khác nhau; ô nào chưa có video thật thì ghi "mẫu" ở tên file, không chép số mẫu sang bìa thật.
3. `ket-qua.md`: xóa đoạn nói nhãn 32 px và phương án phụ `?label=alt` (không có trong code).

Kết quả trả ở `den-claude/2026-11-16-sua-bia-va-lo-trinh/`.
