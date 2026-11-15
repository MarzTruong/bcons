# Video Newsky 2 "Vốn tự có mua được căn nào" (bản nháp cổng 1, 15/11/2026)

**Trạng thái: cổng 1 (số liệu và góc), chờ anh duyệt.** Chưa có `spec.json`, giọng, hình. Làm theo `docs/quy-trinh-video.md`. Trụ cột A (dự án).

Góc: khách hay hỏi "em có khoảng X trăm triệu thì mua được căn nào". Video trả lời bằng số thật của phương thức thanh toán 09 (giá gốc của CĐT): vốn tự có **trước đợt nhận nhà** của từng loại căn, phần còn lại do vay ngân hàng và đợt nhận nhà. Không nói lợi nhuận, không nói tăng giá, không nói "sắp hết". Kết bằng "xem phiếu tính từng căn" (landing + QR).

## Dàn ý 4 cảnh (khoảng 40–45 giây)
| Cảnh | Mẫu | Hình hiển thị | Lời bình (nháp) |
|---|---|---|---|
| 1 | `stat-hero` | "Vốn tự có trước đợt nhận nhà" · số 563 triệu · "căn 2PN-1WC, giá từ 2,56 tỷ chưa VAT"; ảnh phối cảnh (minh họa) | Có khoảng năm trăm sáu mươi triệu vốn tự có, mua được căn nào ở Bcons Newsky? Với căn hai phòng ngủ một WC, giá từ hai phẩy năm sáu tỷ chưa VAT, phương thức thanh toán chín, phần tự có trước đợt nhận nhà khoảng năm trăm sáu mươi ba triệu, đã gồm VAT. |
| 2 | `data-cards` | 3 thẻ: "2PN-1WC từ 2,56 tỷ · tự có ~563 triệu", "2PN-2WC từ 2,75 tỷ · ~605 triệu", "3PN-2WC từ 3,87 tỷ · ~851 triệu" | Căn hai phòng ngủ hai WC giá từ hai phẩy bảy lăm tỷ cần khoảng sáu trăm lẻ năm triệu. Căn ba phòng ngủ hai WC giá từ ba phẩy tám bảy tỷ cần khoảng tám trăm năm mươi mốt triệu. |
| 3 | `data-cards` | 2 thẻ: "Ngân hàng giải ngân 50%" (vay) · "Nhận nhà: 25% + phí bảo trì 2%" (căn 2PN-1WC ~768 triệu) | Phần còn lại: ngân hàng giải ngân năm mươi phần trăm giá căn, lãi không vượt sáu phẩy chín phần trăm một năm trong thời hạn ưu đãi, CĐT bù chênh lệch. Đến lúc nhận nhà đóng thêm hai mươi lăm phần trăm cộng phí bảo trì hai phần trăm, căn hai phòng ngủ một WC khoảng bảy trăm sáu mươi tám triệu. |
| 4 | `project-close` | Phối cảnh tổng thể (minh họa), thẻ dự án; tên + QR | Muốn xem phiếu tính đúng căn mình chọn, quét mã QR. Bcons Newsky, mặt tiền Quốc lộ 13, phường Lái Thiêu, dự kiến bàn giao quý hai năm hai ngàn không trăm hai mươi tám. |

Cách tính (chạy ngày 15/11/2026): lõi `engine/banhang/tai-chinh.mjs` (`phuongAn`) + `engine/landing/calc.mjs` + `du-an/bcons-newsky/nguon/pttt-cdt.json`, theo giá thấp nhất mỗi loại trong khoảng giá `thong-tin.md` (chưa VAT), PTTT 09, lãi giả định 9,5%/năm, 20 năm. Kết quả (triệu đồng, đã gồm VAT 10%):

| Loại căn | Giá chưa VAT (tỷ) | Giá có VAT | Tự có trước đợt nhận nhà | Vay (theo lịch CĐT) | Đợt nhận nhà (25% + phí bảo trì 2%) |
|---|---|---|---|---|---|
| 2PN-1WC | 2,56 | 2.816 | 563 | 1.408 | 768 |
| 2PN-2WC | 2,75 | 3.025 | 605 | 1.513 | 825 |
| 3PN-2WC | 3,87 | 4.257 | 851 | 2.129 | 1.161 |
| 3PN-3WC | 4,28 | 4.708 | 942 | 2.354 | 1.284 |

Ghi chú nội dung:
- Chỉ nói PTTT 09 trong video (giá gốc). PTTT 08 (giãn đợt, không vay, 5,65% so với giá 09) và PTTT 10 (2,15% so với giá 09, không có trần 6,9%) để dành cho phiếu tính/landing, không nhồi vào video 40 giây.
- Trần 6,9% chỉ nói khi đang nói PTTT 09, kèm "trong thời hạn ưu đãi" (tối đa 48 tháng, không quá 24 tháng kể từ thông báo bàn giao theo CĐT). Không nói số tiền trả góp hằng tháng trong video (lãi và kỳ hạn là giả định, để công cụ tính).
- **"Giá từ" là giá thấp nhất trong 200 căn tháp B của file CĐT 06/10/2026. Trước khi đăng, kiểm giỏ hàng: căn nào đã cọc/LOCK thì phải đổi sang căn rẻ nhất còn trống** (quy tắc: căn đã cọc = đã bán, không tư vấn). Giá thật từng căn nằm ở Master File trên Drive, không đưa vào repo.
- Cảnh 4: không SĐT chữ (đã có QR). Không thêm dòng "tham khảo" khi chưa hỏi anh.
- Không nhắc quà tặng/bốc thăm (thông báo 213/TB-BPS) khi chưa hỏi anh.

## Bảng nguồn
| id | Số liệu | Ngày công bố | Nguồn | Link | Ghi chú kiểm |
|---|---|---|---|---|---|
| gia-tu-loai-can | Giá thấp nhất mỗi loại căn tháp B: 2PN-1WC 2,56 tỷ; 2PN-2WC 2,75; 3PN-2WC 3,87; 3PN-3WC 4,28 (PTTT 09, chưa VAT) | 06/10/2026 | CĐT: file check giá tháp B (Master File trên Drive) | `du-an/bcons-newsky/thong-tin.md` (bảng Giá) | Chưa có link công khai; kiểm lại căn còn trống ngày đăng |
| pttt-09 | Lịch PTTT 09: 5% + 5% + 50% ngân hàng giải ngân + 5% + 5% + 25% bàn giao + 5% GCN; lãi không vượt 6,9%/năm, tối đa 48 tháng, không quá 24 tháng kể từ thông báo bàn giao; MB gói cố định tối đa 30 tháng | 05/10/2026 | Thông báo PTTT 09 của CĐT | `du-an/bcons-newsky/nguon/pttt-cdt.json` | Khớp file nguồn |
| vat-bao-tri | VAT 10%; phí bảo trì 2% giá chưa VAT đóng khi nhận nhà | 05/10/2026 | Thông báo PTTT của CĐT; anh xác nhận VAT 10% ngày 12/11/2026 | `du-an/bcons-newsky/nguon/pttt-cdt.json` | |
| tinh-toan-von | Vốn tự có và đợt nhận nhà theo bảng trên | 15/11/2026 | Tính bằng lõi `engine/banhang/tai-chinh.mjs` | `engine/banhang/tai-chinh.mjs` | Làm lại khi giá hoặc PTTT đổi |
| newsky-ban-giao | Bàn giao dự kiến Quý II/2028 | 11/11/2026 | Thông báo PTTT của CĐT; anh xác nhận 12/11/2026 | `du-an/bcons-newsky/nguon/pttt-cdt.json` | Nói "dự kiến" |
| phoi-canh-tong-the | Phối cảnh tổng thể dự án (ghi minh họa) | 11/11/2026 | Tài liệu chủ đầu tư | https://drive.google.com/drive/folders/1YUrtxPpYrDYCLGKKKXEFfmkreyROMniZ | |

## Việc cần anh quyết ở cổng 1
1. Duyệt góc "Vốn tự có mua được căn nào" và bốn con số tự có (563, 605, 851 triệu; đợt nhận nhà 768 triệu).
2. Nói "tự có trước đợt nhận nhà" như trên có làm khách hiểu nhầm là tổng vốn cần bỏ ra không? (Tổng tiền tự bỏ đến lúc nhận nhà là phần tự có cộng đợt nhận nhà: ví dụ 2PN-1WC khoảng 563 + 768 = 1.331 triệu, vì khoản vay 50% do ngân hàng giải ngân.) Em đề xuất nói cả hai con số trong cảnh 3 như dàn ý.
3. Căn giá thấp nhất còn trống ngày đăng là căn nào (em không đọc được tình trạng từng căn trong repo): anh báo, hoặc em đọc từ Sheet giỏ hàng khi anh cho phép.

Sau khi anh duyệt: em viết `spec.json`, `caption.md`, `caption-icon.md`, `zalo.md`, `storyboard.md` (cổng 2), rồi giọng (cổng 3, tốn credit) và render (cổng 4) qua bot.
