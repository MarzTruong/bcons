# Kiểm AGY: sửa bìa và bảng lộ trình (vòng 2, 16/11/2026)

Nguồn: Drive `den-claude/2026-11-16-sua-bia-va-lo-trinh` (ket-qua.md, bang-lo-trinh-tien/, bia-phuong-an-1/). Chỉ kiểm nội dung và code. Anh chốt 16/11: chỉ làm lại video Newsky, Central Park không dựng lại.

## Bảng lộ trình tiền: 6/6 việc đã làm đúng
- Chú thích cuối: đúng nguyên văn em giao. Nhãn "Nhận nhà", chữ "PBT" bỏ, dữ liệu inline bỏ, tổng cộng từ `moc[]` (tự có 660, ngân hàng 1.650, nhận nhà 900, sổ hồng 150, tổng 3.360), mốc đọc từ `cueGiay`. Số khớp `pttt-cdt.json`.
- Còn sót (nhỏ): chú giải thanh xếp chồng ghi "Nhận nhà (có phí bảo trì 2%)", chưa nhắc "VAT còn lại" như nhãn mốc và chú thích cuối. Nên đổi thành "Nhận nhà (VAT còn lại, phí bảo trì 2%)". Chữ của AGY; engine `lo-trinh` (phiên edit video) đã dùng chữ đúng, nên chỉ cần sửa cho khớp.
- Code: tổng phân loại theo chuỗi trong tên mốc ("nhận nhà", "sổ hồng"). Đổi tên mốc là tổng lệch ngầm. Engine tính theo `ai` và vai trò mốc, không bị. Không ảnh hưởng.

## Bìa phương án 1
- Đã sửa: "gần 58" (CP4), bỏ 3 ô thiếu nguồn, `ket-qua.md` không còn nói nhãn 32 px.
- Lưới 12 ô: 11 ô gắn video thật + 1 ô mẫu ghi rõ (`mau: true`, tên file "mau"). Số khớp spec: 24 tháng, 60 m, 60 triệu/m² (mặt bằng chung căn hộ mới), 4,4%, 8,5–11% (10 ngân hàng, VARS-IRE), gần 15 km Vành đai 3 (CP8; nguồn ghi ~14,7 km).
- Cần sửa 1 chỗ: ô video Newsky 3 ghi "Chủ đầu tư thuê lại 2 năm / 24 tháng cam kết". Chỉ áp dụng cho danh sách 594 căn (kịch bản video 3: anh dặn caption có ý "một số căn"). Bìa nên viết "Một số căn được thuê lại / 24 tháng" để khách không hiểu mọi căn.
- Ô mẫu "Vành đai 3 gần 15 km mục tiêu T11/2026": nguồn là mục tiêu thông xe "gần 15 km tới nút giao Tân Vạn" của CP8, không phải cả đoạn trên cao. Chỉ là mẫu, không dùng cho bìa thật.

## Phạm vi dựng lại (anh chốt)
Chỉ video Newsky: N01–N06. Bìa Central Park (CP4, 5, 7, 8…) chỉ nằm trong lưới mẫu, không dựng lại video.

## Việc cần anh quyết
- Gửi AGY 2 chỗ chữ ở trên (chú giải "Nhận nhà", bìa Newsky 3 "Một số căn")? Hoặc anh cho em sửa thẳng khi tích hợp (chữ nhỏ, không đụng bố cục).
