# Video Newsky 6 "3 cách thanh toán" (bản nháp cổng 1, 16/11/2026)

**Trạng thái: cổng 1, chờ anh chọn góc và hook.** Chưa có spec, chưa có giọng. Trụ cột A (dự án). Số liệu chỉ lấy từ thông báo PTTT của CĐT (`nguon/pttt-cdt.json`), không cần số thị trường nên không mở link ngoài. Đây là video **thử hai mẫu mới**: khung mở đầu `hook` (khung 0 đủ chữ, kiêm bìa) và cảnh `danh-sach` (3 mục có đếm). Làm theo `docs/quy-trinh-video.md` mục 3b (hook, nhịp, độ dài).

Video 2 ("Căn 3 tỷ…") chỉ nói PTTT 09 và đã ghi "PTTT 08 và 10 dành cho phiếu tính, không nhồi vào video 40 giây". Video này là video riêng cho cả ba, không trùng: video 2 nói **bao nhiêu tiền** của một căn, video 6 nói **ba cách chia tiền khác nhau thế nào**.

## Số liệu (đối chiếu `pttt-cdt.json`, thông báo 29, 30, 31/TB-SHQT ngày 05/10/2026)
| PTTT | Lịch đóng (% giá căn) | Điểm khác | Chiết khấu so với giá PTTT 09 | Vay |
|---|---|---|---|---|
| 09 (giá gốc) | 5% + 5% rồi ngân hàng giải ngân 50% sau HĐMB 7 ngày, 5% (2 tháng), 5% (4 tháng), 25% bàn giao, 5% sổ hồng | Vay 50%; lãi không vượt 6,9%/năm, tối đa 48 tháng, không quá 24 tháng kể từ thông báo bàn giao, CĐT bù chênh lệch | không | Có, trần lãi 6,9% |
| 08 | 5% + 10% rồi 8 đợt cách nhau 2 tháng (5, 5, 5, 10, 10, 5, 5, 10), 25% bàn giao, 5% sổ hồng; 12 đợt | Giãn theo tháng, không có đợt vay của CĐT | giảm 5,65% | Không |
| 10 | 5% + 5% rồi vay 3 lần (10% + 20% + 20%), 5% (5 tháng), 5% (10 tháng), 25% bàn giao, 5% sổ hồng | CĐT hỗ trợ lãi và ân hạn gốc tối đa 18 tháng; chỉ khách cá nhân | giảm 2,15% | Có, **không** có trần 6,9% |

Chung: giá chưa VAT 10%, phí bảo trì 2% giá chưa VAT đóng thêm; đến thông báo bàn giao đóng lũy tiến 95% giá + 100% VAT + 100% phí bảo trì; bàn giao dự kiến Quý II/2028. Chỉ khách cá nhân với PTTT 09 và 10; gói lãi cố định tại MB.

Quy tắc khi nói: nói "giá chưa VAT" và phí bảo trì 2%; trần 6,9% chỉ nói với PTTT 09 (không nói với 10); chiết khấu 5,65% và 2,15% nêu khi nói đúng PTTT đó (anh cho phép 15/11/2026); không nói lợi nhuận, không "nên chọn cách nào", không tính tiền trả góp hằng tháng.

## 3 góc đề xuất (em khuyên góc 1)
1. **Ba cách chia tiền (danh sách 3 mục, khung mở có số 3)**: "Newsky có 3 cách thanh toán" rồi mỗi cách một mục: ai hợp ra sao nói bằng sự thật của lịch đóng (09 vay 50% có trần lãi; 08 giãn 12 đợt, chiết khấu 5,65%; 10 vay 3 lần, chiết khấu 2,15%). Dùng đủ hai mẫu mới. Dài khoảng 35 giây.
2. **Cùng một căn, ba lịch đóng**: lấy căn ví dụ 3 tỷ, so số tiền đợt đầu tiên và tổng đóng trước ngày nhận nhà của từng cách (cần tính bằng lõi `engine/banhang/tai-chinh.mjs`, chưa VAT/có VAT nói rõ). Mạnh hơn về số nhưng phải kiểm lại giỏ hàng và giá, dài hơn 35 giây, dễ trùng video 2.
3. **Câu hỏi "vay hay không vay"**: mở bằng câu hỏi ("Không muốn vay ngân hàng thì sao?") dẫn vào PTTT 08. Hẹp hơn, chỉ nói rõ một cách.

## 3 phương án hook cho góc 1 (khung 0 là bìa, tiêu đề tối đa 6 chữ, anh chọn)
1. **Con số**: "3 cách thanh toán" + dòng phụ "Newsky, chiết khấu từ 0 đến 5,65%". Tiêu đề: "3 cách" / "thanh toán Newsky" (4 chữ).
2. **Câu hỏi**: "Vay hay không vay?" + "Newsky có 3 lịch thanh toán khác nhau". Tiêu đề: "Vay hay" / "không vay?" (4 chữ).
3. **Kết quả**: "Giảm 5,65%" + "nếu không vay, giãn 12 đợt (PTTT 08)". Số nhấn mạnh nhất nhưng chỉ đúng với PTTT 08, dễ bị hiểu là chiết khấu chung: em ít khuyên.

Em khuyên **hook 1** (rõ nhất, không hiểu nhầm). Lời bình mở trong 12 chữ, vào thẳng "ba cách".

## Dàn ý 4 cảnh (~35 giây, ~95 chữ lời) nếu anh chọn góc 1
1. `stat-hero` hoặc khung hook: "Newsky có 3{ba} cách thanh toán…" (≤ 12 chữ đến số).
2. `danh-sach`: 3 mục PTTT 09, 08, 10, mỗi mục một câu theo đúng số trên; dòng tổng kết "Lịch đóng khác nhau, giá gốc cùng một căn" (cần nói rõ chiết khấu tính theo giá PTTT 09).
3. Dòng nhỏ: giá chưa VAT, VAT 10% và phí bảo trì 2% tính thêm (một dòng, đúng chỗ).
4. `project-close`: câu hỏi một chữ ("Anh chị hợp cách nào?" trả lời 09, 08 hay 10) + khối tên và QR.

## Bảng nguồn
| id | Số liệu | Ngày công bố | Nguồn | Link | Ghi chú kiểm |
|---|---|---|---|---|---|
| pttt-09 | Lịch PTTT 09 (5, 5, 50 vay, 5, 5, 25, 5), vay 50%, lãi không vượt 6,9%/năm, tối đa 48 tháng, không quá 24 tháng kể từ thông báo bàn giao | 05/10/2026 | Thông báo PTTT 09 của CĐT (30/TB-SHQT) | https://drive.google.com/drive/folders/1YUrtxPpYrDYCLGKKKXEFfmkreyROMniZ (bản chép: `du-an/bcons-newsky/nguon/pttt-cdt.json`) | Khớp file nguồn, đối chiếu 16/11/2026 |
| pttt-08 | Lịch PTTT 08 (12 đợt: 5, 10, 5, 5, 5, 10, 10, 5, 5, 10, 25, 5), chiết khấu 5,65% theo giá PTTT 09 | 05/10/2026 | Thông báo PTTT 08 của CĐT (29/TB-SHQT) | như trên | Khớp file nguồn |
| pttt-10 | Lịch PTTT 10 (5, 5, 10 vay, 5, 20 vay, 5, 20 vay, 25, 5), CĐT hỗ trợ lãi và ân hạn gốc tối đa 18 tháng, chiết khấu 2,15% theo giá PTTT 09, không có trần 6,9% | 05/10/2026 | Thông báo PTTT 10 của CĐT (31/TB-SHQT) | như trên | Khớp file nguồn |
| vat-bao-tri | VAT 10%; phí bảo trì 2% giá chưa VAT; đến thông báo bàn giao đóng lũy tiến 95% giá + 100% VAT + 100% phí bảo trì | 05/10/2026 | Thông báo PTTT của CĐT; anh xác nhận VAT 10% ngày 12/11/2026 | như trên | |
| newsky-ban-giao | Bàn giao dự kiến Quý II/2028 | 11/11/2026 | Thông báo PTTT của CĐT; anh xác nhận 12/11/2026 | như trên | Nói "dự kiến" |

## Cần anh quyết (cổng 1)
1. Chọn góc: 1, 2 hay 3 (em khuyên 1).
2. Chọn hook: 1, 2 hay 3 (em khuyên 1).
3. Slug và số: em đề xuất `06-ba-cach-thanh-toan`, số 6. Có phiên khác đang làm video 2–5 nên em dùng 6, anh báo nếu số 6 đã giao việc khác.
