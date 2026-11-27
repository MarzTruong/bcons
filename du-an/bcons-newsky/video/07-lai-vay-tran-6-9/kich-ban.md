# Video Newsky 7 "Lãi vay mua nhà 11/2026 và trần 6,9% (PTTT 09)" (bản nháp cổng 1, 27/11/2026)

**Trạng thái: cổng 2 (spec `draft`, caption, zalo, storyboard; chờ anh duyệt chữ, số, caption, hình). Cổng 1 anh đã duyệt 27/11/2026. Cập nhật 27/11/2026 theo chỉnh của anh (qua phiên Main): nới để kéo khách, được nêu tên ngân hàng và số lãi từng nơi, không cần chữ nhỏ điều kiện dài.** Chưa có spec, giọng, hình. Trụ cột A (dự án) mở bằng số thị trường. Slug đề xuất `07-lai-vay-tran-6-9` (số kế tiếp của Newsky, anh đổi được). Nền: biên bản kiểm `kiem-toan/2026-11-27-tu-lieu-video-quy-hoach-100-nam-newsky/KIEM.md`; em mở lại link VnExpress 27/11/2026 và dò từng số.

Làm theo mục 3c `docs/quy-trinh-video.md`: **mồi kéo khách**, một ý chính, một lời kêu gọi, chi tiết tư vấn khi khách nhắn.
Ý chính: lãi vay mua nhà vẫn cao (khoảng 9,5–12%/năm) trong khi PTTT 09 của chủ đầu tư có **trần lãi 6,9%/năm**. Người xem tự hỏi "trần đó áp dụng thế nào, căn nào?" rồi nhắn.

## 3 phương án hook (anh chọn một)
1. **Con số:** "Lãi vay nhà vẫn 9,5–12%"
2. **Câu hỏi:** "Trần lãi 6,9% là của ai?"
3. **Kết quả:** "Lãi vay 12%, gói này trần 6,9%"
4. **Con số (nêu tên):** "Vietcombank 10%, Techcombank 10,8%" (nguồn ngân hàng: DXS-FERI, xem bảng nguồn)

## Dàn ý 3 cảnh (khoảng 28–32 giây, nháp)
| Cảnh | Mẫu | Hình hiển thị | Lời bình (nháp) |
|---|---|---|---|
| 1 | `stat-hero` | "9,5–12%" lớn, nhãn "Lãi vay mua nhà cố định 12 tháng, 11 ngân hàng, tính đến cuối tháng 10" | Lãi vay mua nhà cố định 12 tháng ở 11 ngân hàng vẫn khoảng 9,5 đến 12% một năm. |
| 2 | `data-cards` | 2 thẻ: "Hết ưu đãi: thả nổi tới 13–16%/năm"; "PTTT 09 Bcons Newsky: trần lãi 6,9%/năm" | Hết ưu đãi, lãi thả nổi có chương trình lên tới 13 đến 16%. Còn phương thức thanh toán 09 của Bcons Newsky có trần lãi 6,9% một năm. |
| 3 | `project-close` | Thẻ dự án, tên + QR; câu hỏi | Trần này áp dụng thế nào, anh chị nhắn để biết. Theo anh chị, lãi vay bao nhiêu thì còn vay nổi? |

Ghi chú nội dung (quy tắc cứng, đã đối chiếu `pttt-cdt.json` và KIEM.md):
- **PTTT 09 nói đúng chữ nguồn:** trần 6,9%/năm, tối đa 48 tháng, **không quá 24 tháng kể từ thông báo bàn giao**, chủ đầu tư bù chênh lệch, chỉ khách cá nhân, gói cố định tối đa 30 tháng tại MB. Theo chỉnh 27/11 **không cần chữ nhỏ điều kiện dài** trên hình; video nêu "trần 6,9%/năm" (và nếu có chỗ: "chủ đầu tư bù chênh lệch"), điều kiện còn lại đưa vào caption hoặc tư vấn. Khi có nói đến thời hạn thì dùng đúng chữ "không quá 24 tháng kể từ thông báo bàn giao", không viết "24 tháng sau nhận nhà".
- **Không** nói PTTT 08, 10 (PTTT 10 không có trần 6,9%). Không nói số chiết khấu trong video này.
- **Không** metro, **không** "tránh cú sốc trả nợ", "tiền thuê bù lãi", không hứa kết quả, không nói trả góp mỗi tháng bao nhiêu.
- Không so cam kết "rẻ hơn ngân hàng": video đặt hai số cạnh nhau (thị trường và gói của chủ đầu tư), mỗi số đúng nguồn của nó. Trần 6,9% là do chủ đầu tư bù chênh lệch trong một thời hạn, không phải lãi suất ngân hàng.
- Số lãi là **tính đến cuối tháng 10/2026**, bài đăng 25/11/2026: nói "cuối tháng 10", không nói "hôm nay".
- Không SĐT chữ (đã có QR). Không dòng "tham khảo" khi chưa hỏi anh.

## Bảng nguồn
| id | Số liệu | Ngày công bố | Nguồn | Link | Ghi chú kiểm |
|---|---|---|---|---|---|
| lai-vay-11nh | Lãi vay mua nhà cố định 12 tháng tại 11 ngân hàng thương mại phổ biến khoảng 9,5–12%/năm tùy kỳ hạn và gói vay, không giảm so với quý III (DKRA Consulting, tính đến cuối tháng 10) | 25/11/2026 | VnExpress (dẫn DKRA Consulting) | https://vnexpress.net/lai-suat-huy-dong-giam-lai-vay-bat-dong-san-van-neo-cao-5147943.html | Em mở link, khớp nguyên văn 27/11/2026 |
| lai-tha-noi | Chương trình ưu đãi năm đầu (dưới 10%) thường theo mức thả nổi cao, lên đến 13–16%; phí trả nợ trước hạn 4–5% | 25/11/2026 | VnExpress (cùng bài) | https://vnexpress.net/lai-suat-huy-dong-giam-lai-vay-bat-dong-san-van-neo-cao-5147943.html | Khớp. Nói "có chương trình lên tới", không nói "trung bình thị trường" |
| lai-ngan-hang | Lãi vay ưu đãi bất động sản kỳ hạn 6–12 tháng (DXS-FERI, đến cuối tháng 10): Standard Chartered và Hong Leong Bank 9,8%; Vietcombank và BIDV khoảng 10%; VietinBank 10,2%; Techcombank 10,8%; VPBank 11,5% | 25/11/2026 | VnExpress (dẫn DXS-FERI) | https://vnexpress.net/lai-suat-huy-dong-giam-lai-vay-bat-dong-san-van-neo-cao-5147943.html | Khớp. Chú ý: danh sách này là của DXS-FERI, khoảng 9,5–12% là của DKRA |
| pttt-09-tran | PTTT 09: lãi không vượt 6,9%/năm, tối đa 48 tháng, không quá 24 tháng kể từ thông báo bàn giao; chủ đầu tư bù chênh lệch; chỉ khách cá nhân; gói cố định tối đa 30 tháng tại MB | 05/10/2026 | Thông báo 30/TB-SHQT, Công ty TNHH Song Hỷ Quốc Tế | https://drive.google.com/file/d/14AmBhxMamf8ZNAgNT0hlh0USWOMRELxu/view | Khớp `nguon/pttt-cdt.json` |
| newsky-vi-tri | Mặt tiền Quốc lộ 13, phường Lái Thiêu | 09/10/2024 | GPXD 3288, `thong-tin.md` | https://drive.google.com/drive/folders/1YUrtxPpYrDYCLGKKKXEFfmkreyROMniZ | Anh xác nhận 11/11/2026 |
| phoi-canh-tong-the | Phối cảnh tổng thể dự án (file overview-aerial, ghi "minh họa") | 11/11/2026 | Tài liệu chủ đầu tư | https://drive.google.com/drive/folders/1YUrtxPpYrDYCLGKKKXEFfmkreyROMniZ | Phối cảnh, ghi minh họa |

**Không dùng (đã loại ở KIEM.md):** "24 tháng sau nhận nhà" (sai chữ nguồn), "giúp tránh cú sốc trả nợ", "tiền thuê bù phần lớn lãi vay", mức 264–360 triệu, số liệu bank-by-bank (VCB, BIDV, VietinBank…) là của DXS-FERI chứ không phải DKRA: nếu cần thì ghi đúng nguồn, nhưng "một ý chính" nên chỉ dùng khoảng 9,5–12%.

## Việc cần anh quyết
1. Chọn hook (1, 2, 3 hoặc 4).
2. Cảnh 2 có nêu tên ngân hàng (Vietcombank, BIDV ~10%, VietinBank 10,2%, Techcombank 10,8%, VPBank 11,5%, số của DXS-FERI) hay chỉ khoảng 9,5–12% của DKRA. Em đề xuất chỉ nêu 2 ngân hàng lớn kèm khoảng 9,5–12% cho gọn.
3. Slug `07-lai-vay-tran-6-9` đồng ý không.

## Cổng 2: hook và kiểm tra (27/11/2026)
Hook đã chọn (anh 27/11/2026): **hook 1** "Lãi vay nhà vẫn 9,5–12%" (khung 0: "Lãi vay nhà / vẫn cao" + số 9,5–12% mỗi năm + dòng "Gói PTTT 09 có trần lãi 6,9%"). Anh chọn nêu tên ngân hàng vì số đã kiểm (nguồn DXS-FERI).
Kiểm tra mục 3b `docs/quy-trinh-video.md`: khung 0 có chữ và hình (`hook` và `bia.json` cùng chữ); số đầu trong lời cảnh 1 ở những chữ đầu; câu hỏi dễ trả lời ở cảnh cuối; không nền lưới/viền sáng/nhãn chữ hoa; mục 3c: một ý chính, một lời kêu gọi, chi tiết để tư vấn khi khách nhắn.
