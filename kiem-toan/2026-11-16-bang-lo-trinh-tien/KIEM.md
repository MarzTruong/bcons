# Kiểm AGY: bảng "lộ trình tiền" (16/11/2026)

Nguồn: Drive `den-claude/2026-11-16-bang-lo-trinh-tien` (phương án 1 anh chọn, `lo-trinh-mau.json`, `index.html`, PNG 3 mốc). Chỉ kiểm số liệu và code, không nhận xét UX.

## Số liệu: đúng
Căn ví dụ 3 tỷ chưa VAT, PTTT 09 (`nguon/pttt-cdt.json`, VAT 10%, bảo trì 2%):
- 150 (5% chưa VAT) + 180 (5% + VAT hai đợt đầu) = 330 = 10% giá có VAT 3,3 tỷ. Đúng.
- Ngân hàng 1.650 = 50% x 3,3 tỷ, +7 ngày sau HĐMB. Đúng.
- Đợt 4 và 5: 165 mỗi đợt (+2, +4 tháng). Đúng.
- Nhận nhà 900: 750 (25%) + 60 (bảo trì 2%) + 90 VAT còn lại (CĐT thu đủ 100% VAT tới thông báo bàn giao: 300 - 30 - 150 - 15 - 15 = 90). Đúng.
- Sổ hồng 150 (5%). Tự có trước nhận nhà 660 = 150 + 180 + 165 + 165. Tổng 3.360 = 3,3 tỷ có VAT + 60 phí bảo trì. Đúng.
- "Dự kiến Quý II/2028", "nếu vay": khớp nguồn. Không có mã căn, SĐT, lời hứa lợi nhuận.

## Sai / cần sửa
1. **Chú thích cuối cảnh gây hiểu sai.** "Đợt nhận nhà 25% đã gồm phí bảo trì 2%" làm khách tưởng 900 = 25% + 2%, tính ra 810. Thực tế 900 còn gồm 90 triệu VAT còn lại. Câu đúng: "Đợt nhận nhà gồm 25%, VAT còn lại và phí bảo trì 2%". Dòng "Đợt 1 chưa VAT; từ khi ký hợp đồng đã gồm VAT từng đợt" cũng thiếu ý "VAT thu đủ tới lúc nhận nhà". Số giữ nguyên, chỉ sửa chữ (AGY sửa; hợp quy tắc "một dòng chưa VAT/có VAT + bảo trì 2%").
2. **Nhãn "Nhận nhà · 25% + phí bảo trì 2%"** cùng lỗi trên. Đề xuất "25% + VAT còn lại + phí bảo trì 2%".
3. **"Tổng (VAT & PBT 2%): 3.360 tr"**: "PBT" khách không hiểu. Viết đủ "phí bảo trì".
4. **Mốc thời gian cue cứng** (`CUE_TIMES` c1..c7 = 0,5 / 1,6 / 3,0 / 4,4 / 5,4 / 6,8 / 8,1 s) và 10 s cố định. Khi tích hợp phải lấy từ `timestamps.json` của lời đọc, không dùng số cứng. Em xử lý trong engine.
5. **Dữ liệu còn bản dự phòng trong `index.html`** (`inline-data`), trùng `lo-trinh-mau.json`: hai chỗ sửa số. Bỏ bản trong HTML (như bên bìa).
6. **Tổng các phần tính lại bằng JS** từ `tongTuCo + nganHang + nhanNha + soHong` thay vì từ `moc[]`: nếu sửa một mốc mà quên sửa tổng thì lệch ngầm. Em tính 660/1650/900/150 từ `moc[]` trong hợp đồng dữ liệu (`loTrinh`) và có test cộng tổng = giá có VAT + bảo trì.

## Việc cần anh quyết
- Cảnh này dùng cho video 2 (đã lên lịch 17/11 bằng cảnh cũ). Dùng cho video 2 bản mới, hay chỉ cho video sau (ví dụ video số "lộ trình tiền" riêng)? Em chưa tích hợp gì cho tới khi anh nói.
- Nhờ AGY sửa 3 câu chữ (mục 1-3) và bỏ dữ liệu trùng (mục 5).
