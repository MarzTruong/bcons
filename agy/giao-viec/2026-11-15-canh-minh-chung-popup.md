# Giao việc AGY: cảnh "minh chứng" popup bài báo và thông báo cho video Newsky 3, 4, 5 (15/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-15-canh-minh-chung-popup.md`, rồi làm theo."

## Vấn đề
Video Newsky 3 (cam kết thuê lại), 4 (Quốc lộ 13), 5 (giá Bình Dương cũ) cần cho khách thấy **bằng chứng**: bài báo hoặc thông báo của chủ đầu tư. Bản tạm của Claude chỉ đặt ảnh chụp bài báo giữa một khung nền màu (xem `du-an/bcons-newsky/assets/images/bang-chung-*.png`, khung cuối trong `engine/remotion/out/tam/storyboard/04-.../canh-2-3.png`). Xấu, tĩnh, không có điểm nhấn. Việc nhìn thấy được là của AGY (anh chốt 12/11/2026).

## Yêu cầu của anh (15/11/2026)
Một cảnh dọc 1080×1920, chuyển động theo thứ tự:
1. **Nền là ảnh hiện trạng, làm mờ** (video 4: hiện trạng thi công Quốc lộ 13 mới nhất; video 3: phối cảnh/hiện trạng dự án; video 5: ảnh khu vực Lái Thiêu hoặc cổng chào Bình Dương cũ đang tháo dỡ).
2. **Popup ảnh chụp bài báo (hoặc thông báo) bật lên** giữa khung, có tên báo và ngày đăng đọc được.
3. **Popup thu ra**, hiện **ảnh hiện trạng rõ nét** với một dòng chú thích ngắn (video 4: "Quốc lộ 13 đoạn qua Bình Dương cũ, tháng 10/2026").
4. **Video 5 thêm biểu đồ giá**: ngay sau popup VnExpress, vẽ biểu đồ đơn giản "35–40 triệu/m²" (một dải, vì bài ghi khoảng) và "khoảng 60 triệu/m²" (một cột), đơn vị triệu/m², chú thích nguồn "One Mount Group, VnExpress 23/09/2026". Không tính phần trăm tăng, không thêm số khác.

Nhịp: cứ 2–3 giây có một thứ mới; cả cảnh 7–9 giây. Làm **2 phương án** khác nhau cho anh chọn (ví dụ kiểu popup nổi có bóng đổ nhẹ và kiểu thẻ trượt từ cạnh).

## Quy tắc (`CLAUDE.md`, nhắc lại những cái dễ vi phạm)
- **No AI Slop:** không hộp bo góc viền phát sáng, không nền kẻ sọc/lưới, không nhãn CHỮ HOA giãn chữ, không chữ dính/đè/lem; chữ đọc được trong 1 giây trên điện thoại.
- Không hứa lợi nhuận/tăng giá, không "sắp hết", không SĐT chữ. Ảnh phối cảnh có nhãn "Phối cảnh minh họa" ngay trên ảnh.
- Hai chữ hiện cố định ở mọi cảnh: nguồn (tên báo + ngày) và, nếu có, nhãn "minh họa". Không bịa số liệu, chỉ dùng số trong bảng dưới.
- Vùng an toàn: chữ và điểm nhấn nằm trong khoảng giữa 1080×1440 (bỏ ~240 px trên/dưới); chừa góc phải dưới cho mã QR (khối ~130×130 px).

## Dữ liệu và ảnh có sẵn (trong repo, sau `git pull`)
| Dùng cho | File | Ghi chú |
|---|---|---|
| Popup video 4 | `bang-chung-bao-tuoitre-ql13-goc.png` (không nền) và `bang-chung-bao-tuoitre-ql13.png` (bản tạm ghép nền) | Tiêu đề + đoạn dẫn bài Tuổi Trẻ 05/10/2026 |
| Popup video 5 | `bang-chung-bao-vnexpress-gia-goc.png` (không nền) và `bang-chung-bao-vnexpress-gia.png` (bản tạm ghép nền) | Tiêu đề + đoạn dẫn bài VnExpress 23/09/2026; **không** lấy phần dưới bài (có nhắc dự án khác) |
| Popup video 3 | `bang-chung-thong-bao-34-goc.png` (cắt không nền) và `bang-chung-thong-bao-34.png` (bản tạm ghép nền) | Thông báo 34/TB-SHQT, đã cắt đến hết mức 2PN (11 và 13 triệu); phần mức 3PN và shophouse bị cắt bỏ theo anh chốt 15/11/2026 |
| Nền | `phoi-canh-quoc-lo-13.jpg`, `phoi-canh-tong-the.jpg` | Phối cảnh (ghi minh họa). **Ảnh hiện trạng:** `hien-trang-ql13-tuoitre-1.jpg` (công nhân đặt cọc tiêu trên Quốc lộ 13) và `hien-trang-ql13-tuoitre-2.jpg` (cổng chào Bình Dương cũ đang tháo dỡ), cả hai từ bài Tuổi Trẻ 05/10/2026, anh cho dùng với ghi nguồn: hiện chữ "Ảnh: Tuổi Trẻ" trên hình. Video 5 dùng chung hai ảnh này làm nền (chưa lấy được ảnh VnExpress: máy chủ ảnh `vcdn1-vnexpress.vnecdn.net` bị chặn) |

## Hợp đồng dữ liệu (để Claude lắp vào Remotion)
Mỗi cảnh sẽ có dạng (Claude điền từ `spec.json`):
```json
{ "template": "bang-chung",
  "kicker": "Quốc lộ 13", "title": "Từ Lái Thiêu về Bình Triệu",
  "anhNen": { "file": "assets/images/hien-trang-ql13-tuoitre-1.jpg", "nhan": "Ảnh: Tuổi Trẻ, 10/2026" },
  "popup": { "file": "assets/images/bang-chung-bao-tuoitre-ql13-goc.png", "nguon": "Tuổi Trẻ", "ngay": "05/10/2026" },
  "bieuDo": { "don_vi": "triệu/m²", "cot": [ { "nhan": "Trước đây", "tu": 35, "den": 40 }, { "nhan": "Quý II/2026", "gia_tri": 60 } ], "nguon": "One Mount Group, VnExpress 23/09/2026" } }
```
`bieuDo` chỉ có ở video 5. Mẫu của AGY là một file HTML (CSS/JS thuần, không gọi mạng) đọc JSON này và chạy đúng chuỗi chuyển động trên; Claude chuyển nó thành mẫu cảnh Remotion, nối giọng đọc và kiểm nguồn.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-canh-minh-chung/`: mỗi phương án một thư mục (`index.html` mở được ngay, kèm `canh-mau.json`), 3 ảnh chụp từng nhịp (nền mờ, popup, hiện trạng rõ) cho từng video 3/4/5, và `ket-qua.md` ngắn (chọn gì, chỗ nào cần anh cung cấp ảnh).

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm số liệu, nguồn, quy tắc và vùng an toàn; anh chọn phương án; Claude lắp vào `engine/remotion` và thay bản tạm trong spec 03, 04, 05.
