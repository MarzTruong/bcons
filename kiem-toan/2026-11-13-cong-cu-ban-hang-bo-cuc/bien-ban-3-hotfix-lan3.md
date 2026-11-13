# Biên bản kiểm lần 3: AGY "5 lỗi giao diện web" công cụ bán hàng (13/11/2026)

Nguồn: Drive `Bcons/agy/den-claude/2026-11-13-cong-cu-ban-hang-hotfix-lan3/` (`app.js`, `index.template.html`, `ket-qua.md`). AGY làm trên bản `7dd41a3` (đúng bản mới nhất). Chưa đưa vào repo.

## Đã kiểm (không nhận xét UX)
- Không còn 1PN+, VAT vẫn qua lõi, SĐT + QR trên ảnh xuất đúng như anh chốt. `web.test.mjs` với hai file AGY: 18/18 qua (test chưa có ca "bảng đợt khi vay tùy chọn", nên không bắt được lỗi dưới).
- Mục 1, 2, 4 (chữ đè trong ô, nút vay một hàng, bảng so sánh): chỉ hiển thị, không đụng số.
- Mục 5 (chênh giá căn cùng vị trí): đúng chiều (giá căn đó trừ giá căn đang chọn), thêm "(Bằng giá)".

## Sai: mục 3, hàm `buildEffectiveSchedule` (AGY tự viết công thức chia lại đợt trong giao diện)
Chạy với giá B1.3-01 (PTTT 09 = 4.060.690.141 đ chưa VAT):
1. **PTTT 09, Vay 70%:** bảng đợt ghi "Ký thỏa thuận đăng ký 0% = 0 đ" và "Ký HĐMB 0% = 0 đ", "Đợt 4, 5 = 0 đ". Lịch CĐT bắt buộc 5% + 5% + 5% + 5% ở các đợt này. Bảng này còn được in lên **ảnh phiếu gửi khách**.
2. **PTTT 10, Không vay:** bảng vẫn còn 1,79 tỷ "ngân hàng giải ngân" (chỉ đổi đợt vay đầu trong 3 đợt), trong khi ô tóm tắt ghi "Không vay". **PTTT 10, Vay 50%:** bảng ghi ngân hàng 2,75 tỷ, ô tóm tắt 2,23 tỷ.
3. **PTTT 08, Vay 50%/70%:** ô tóm tắt có khoản vay nhưng bảng không có dòng vay nào (lệch có từ trước, lần này chưa xử lý).
4. Tổng % các đợt ra 100,5% ở vài trường hợp (làm tròn).
Gốc vấn đề: lịch đợt và tỷ lệ từng đợt là của CĐT (`pttt-cdt.json`), không đổi theo việc khách vay bao nhiêu; "vay tùy chọn" chỉ đổi **nguồn tiền**, không đổi **lịch nộp**. Giao diện không được tự chia lại đợt (quy tắc 2 + hợp đồng "mọi số qua lõi").

## Việc cần anh quyết
Cách hiện bảng đợt khi chọn Vay 70% / 50% / Không vay (em làm trong lõi `tai-chinh.mjs`, có test):
- A (em đề xuất): bảng đợt luôn giữ đúng lịch và số tiền CĐT; khi vay tùy chọn thì dòng "Ngân hàng giải ngân" đổi nhãn thành đợt nộp theo lịch (không ghi ngân hàng), và thêm một dòng tóm tắt nguồn tiền: tự có bao nhiêu, vay bao nhiêu.
- B: bỏ ba nút vay tùy chọn, chỉ tính theo PTTT của CĐT.
