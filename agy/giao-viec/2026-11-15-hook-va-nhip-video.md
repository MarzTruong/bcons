# Giao việc AGY: mở đầu 3 giây và cảnh danh sách có đếm (15/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-15-hook-va-nhip-video.md`, rồi làm theo."

Làm sau (hoặc cùng lúc, cùng tư duy) với `agy/giao-viec/2026-11-15-anh-bia-video.md`: **khung đầu video chính là ảnh bìa**, nên mẫu mở đầu dưới đây phải khớp mẫu bìa anh chọn; đừng làm lại phần bìa.

## Vì sao
Báo cáo tuần 06–12/11: người xem TikTok bỏ đi sau 1–4 giây trên video 49–58 giây, 0 bình luận. Video hiện nay mở bằng một câu lời dài (cảnh 1 dài 20–42 chữ, chưa tới con số đã hết 10 giây). Video tham khảo (xem `docs/phan-tich-video-tham-khao.md`) làm ngược lại: lời hứa kèm con số hiện ngay từ giây 0, rồi cứ 2–3 giây có một thứ mới hiện ra.

## Việc 1: mẫu mở đầu (0–3 giây)
Mẫu cảnh mở đầu cho video dọc 1080×1920, dùng chung cho mọi video:
- **Khung 0 đã có đủ chữ chính** (không trắng, không đen, không cảnh bản đồ chưa tải). Tiêu đề hook tối đa 6 chữ, có một con số hoặc kết quả (ví dụ "Quốc lộ 13 lên 8 làn"). Chữ đọc được trong 1 giây trên điện thoại.
- **Chuyển động 0–1,5 giây:** chữ hiện từng từ hoặc từng dòng (tham khảo: "20 repo" hiện ở 0,0 s, dòng 2 hiện từng từ ở 0,3–0,6 s, dòng phụ ở 0,7 s, gạch nhấn chạy dưới tiêu đề ở 1,0 s). Đề xuất 2 kiểu chuyển động khác nhau để anh chọn; con số có thể đếm lên.
- Sau 3 giây chuyển mượt vào cảnh dữ liệu đầu tiên (stat-hero hiện có), không cắt cứng, không làm cảnh đứng yên.

## Việc 2: mẫu cảnh "danh sách có đếm" (dùng khi nội dung thật sự là danh sách hoặc trình tự)
Ví dụ dùng thật: "5 phương thức thanh toán", "3 công trình về đích" (video 8). Cảnh gồm: tiêu đề cảnh cố định, các mục **xuất hiện lần lượt cứ 2–3 giây** (mỗi mục vào bằng chuyển động ngắn, không giống hệt nhau về hiệu ứng nhàm), bộ đếm "đã xem n trên N" nhỏ nhưng đọc được, và cảnh cuối của danh sách gom tất cả mục vào một khung.
- Chỉ dùng đếm khi có trình tự thật; không đánh số cho nội dung không phải trình tự (quy tắc No AI Slop).
- Mỗi mục: tên ngắn + một số liệu (lấy từ spec, không tự viết số).

## Ràng buộc
- **Quy tắc nội dung (`CLAUDE.md`):** không hứa lợi nhuận/tăng giá, không "sắp hết", không SĐT chữ trên hình (đã có QR góc), phối cảnh có nhãn "Hình ảnh minh họa" ngay trên ảnh, nhắc giá thì chưa VAT/có VAT, số liệu chỉ lấy từ spec.
- **No AI Slop:** video tham khảo dùng nền tối kẻ lưới, thẻ bo góc viền sáng, nhãn chữ hoa kiểu mã, đánh số mọi thứ. **Không bắt chước những thứ đó**; chỉ học nhịp (mục mới đều đặn) và cấu trúc (hứa ngay đầu, đếm tiến độ, gom lại cuối). Một điểm nhấn rõ mỗi cảnh, chữ không dính/đè/lem.
- Kỹ thuật dựng: vẫn là mẫu cảnh Remotion (React) 30 fps, 1080×1920, chạy được với `engine/remotion`. AGY làm bản demo (HTML/CSS động hoặc clip ngắn) để anh duyệt; **Claude là người lắp vào mẫu cảnh thật** sau khi anh chọn, không tự sửa `engine/` trong repo.

## Hợp đồng dữ liệu (để Claude lắp)
Cảnh mở đầu đọc: `{ "hook": ["Quốc lộ 13", "lên 8 làn"], "soNhan": "8", "dongPhu": "từ cầu Vĩnh Bình đến ngã tư Lê Hồng Phong" }`. Cảnh danh sách đọc: `{ "tieuDe": "3 công trình về đích", "muc": [{ "ten": "...", "so": "...", "sourceId": "..." }] }` (`muc` 2–7 phần tử). Nếu AGY cần thêm trường, ghi vào `ket-qua.md` để Claude thêm vào `spec.ts` kèm test.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-hook-va-nhip-video/`: demo mở đầu (2 kiểu) và demo danh sách (1–2 kiểu) mở được ngay, ảnh chụp các khung ở 0,0 / 0,5 / 1,0 / 2,0 giây, `ket-qua.md` (chọn gì, vì sao, chỗ nào chưa chắc, trường dữ liệu cần thêm).

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm số liệu, quy tắc, độ đọc được trên điện thoại; anh chọn kiểu; Claude lắp vào mẫu cảnh và thêm test + chụp khung trước/sau để 9 video cũ không đổi.
