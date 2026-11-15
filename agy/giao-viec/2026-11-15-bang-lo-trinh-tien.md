# Giao việc AGY: bảng "lộ trình tiền" trực quan cho video (15/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-15-bang-lo-trinh-tien.md`, rồi làm theo."

## Vấn đề
Video Newsky 2 ("Mua căn 3 tỷ cần bao nhiêu tiền") nói quá nhiều số. Anh yêu cầu: **lời đọc ít số, mọi số nằm trên hình dưới dạng dashboard/bảng tính trực quan**. Hiện em tạm dùng hai mẫu có sẵn (`compare-bars` cho "tiền đến từ đâu", `data-cards` cho lộ trình đợt); chạy được nhưng nghèo: thanh ngang đơn giản, thẻ chữ, không có trục thời gian, không thấy "tiền đi theo thời gian".

## Việc cần làm
Thiết kế **một cảnh dashboard "lộ trình tiền"** (1080×1920, 8–12 giây, số hiện dần theo lời đọc) cho các video giải thích cách thanh toán:
- **Trục thời gian ngang hoặc dọc**: ký thỏa thuận → ký hợp đồng → +7 ngày (ngân hàng giải ngân) → +2 tháng → +4 tháng → nhận nhà (dự kiến Quý II/2028). Mỗi mốc một khối tiền, độ cao/độ dài theo số tiền, màu phân biệt **tiền mình đóng** và **tiền ngân hàng giải ngân**.
- **Thanh xếp chồng "căn này được trả bằng gì"**: một thanh dài chia đoạn (tự có trước nhận nhà / ngân hàng / đợt nhận nhà / sổ hồng), có tổng số bên cạnh.
- **Con số lớn nhất nổi bật**, phần còn lại nhỏ hơn; đọc được trong 1 giây trên điện thoại.
- Làm **2 phương án khác hẳn nhau**, dựng với dữ liệu thật của video (bên dưới); anh chọn 1.

## Dữ liệu (căn ví dụ 3 tỷ chưa VAT, PTTT 09; nguồn `du-an/bcons-newsky/video/02-von-mua-can-nao/kich-ban.md`)
Triệu đồng, đã gồm VAT theo từng đợt: ký thỏa thuận 150 (5%, chưa VAT); ký hợp đồng 180; ngân hàng giải ngân 1.650 (50%, 7 ngày sau HĐMB); đợt 4 (2 tháng sau HĐMB) 165; đợt 5 (4 tháng sau HĐMB) 165; **tự có trước khi nhận nhà = 660**; nhận nhà 900 (25% giá căn đã gồm phí bảo trì 2%); sổ hồng 150. Mọi số phải lấy từ một đối tượng dữ liệu `loTrinh` (hợp đồng bên dưới), không tự gõ số vào mẫu.

## Hợp đồng dữ liệu (để Claude lắp vào Remotion)
```json
{ "canViDu": "3 tỷ, chưa VAT", "donVi": "triệu đồng",
  "moc": [ { "nhan": "Ký thỏa thuận", "khi": "Khi ký", "soTien": 150, "ai": "minh", "cue": "c1" } ],
  "tongTuCo": 660, "nganHang": 1650, "nhanNha": 900 }
```
`ai`: `minh` hoặc `nganHang`. `cue` là khóa để số hiện đúng lúc đọc. Mẫu của AGY là HTML/CSS/JS thuần đọc object này, không gọi mạng; Claude chuyển thành cảnh Remotion và test.

## Quy tắc (`CLAUDE.md`)
Không hứa lợi nhuận/tăng giá, không "sắp hết"; giá ghi rõ chưa VAT/có VAT; phí bảo trì 2% có nhãn; "căn ví dụ" ghi trên hình, không ghi mã căn; không SĐT chữ; No AI Slop (không hộp viền phát sáng, không nền kẻ sọc/lưới, không nhãn CHỮ HOA giãn chữ, không thẻ giống hệt nhau xếp hàng); nếu có phối cảnh thì nhãn "Phối cảnh minh họa" trên chính tấm ảnh.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-bang-lo-trinh-tien/`: mỗi phương án một thư mục (`index.html` mở được ngay với dữ liệu thật ở trên, ảnh chụp 3 thời điểm của cảnh), `ket-qua.md` ngắn. **Không sửa, commit, push file trong repo.**

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm số liệu và quy tắc, anh chọn; Claude lắp thành mẫu cảnh mới (test, spec, storyboard).
