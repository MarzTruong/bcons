# Việc giao AGY: sửa chú giải "Nhận nhà" trong bảng lộ trình tiền (16/11/2026)

Kết quả vòng trước đã kiểm (`kiem-toan/2026-11-16-sua-bia-va-lo-trinh/KIEM.md`): 6/6 việc đúng. Còn một chỗ chữ nhỏ, không đổi bố cục/màu/kích thước.

## Việc duy nhất
Trong `bang-lo-trinh-tien/index.html`, phần chú giải của thanh xếp chồng (mảng `parts`, khóa `nhanNha`):
- Đang là: `"Nhận nhà (có phí bảo trì 2%)"`
- Sửa thành: `"Nhận nhà (VAT còn lại, phí bảo trì 2%)"`

Lý do: đợt nhận nhà 900 triệu gồm 25% (750) + VAT còn lại (90) + phí bảo trì 2% (60). Chú giải hiện thiếu "VAT còn lại", lệch với nhãn mốc và chú thích cuối đã đúng. Nếu chữ dài làm vỡ dòng chú giải thì thu gọn cỡ chữ, không đổi chữ.

## Giữ nguyên
- Bìa video Newsky 3 ("Chủ đầu tư thuê lại 2 năm / 24 tháng cam kết"): anh đã chốt giữ nguyên, không sửa.
- Mọi thứ khác của bìa và bảng lộ trình.

Kết quả trả ở `den-claude/2026-11-16-sua-chu-giai-nhan-nha/` (chỉ cần `index.html` đã sửa + một ảnh chụp mốc 9,2 s).
