# Giao việc AGY: sửa mở đầu/danh sách kiểu 1 và làm khung nguồn cuối video (16/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-16-sua-mo-dau-danh-sach-va-khung-nguon.md`, rồi làm theo."

## Bối cảnh
Anh đã chọn **mở đầu kiểu 1**, **danh sách kiểu 1** và hook "Quốc lộ 13 lên 8 làn" (15/11/2026). Em (Claude) đã lắp hai mẫu này vào engine Remotion: `engine/remotion/src/HookOpen.tsx`, `engine/remotion/src/templates/DanhSach.tsx`, mốc thời gian `engine/remotion/src/moDau.ts`, schema `hook` và `danh-sach` trong `engine/remotion/src/spec.ts`. Biên bản kiểm bản demo lần trước: `kiem-toan/2026-11-15-hook-va-nhip-video/bien-ban.md`. **Bỏ hai kiểu 2**, không làm tiếp.

## Việc 1: sửa demo kiểu 1 cho khớp bản đã lắp (F-01 đến F-06)
Sửa `mo-dau-kieu-1` và `danh-sach-kieu-1` (HTML và JSON mẫu) để demo và engine là một:
- F-01: mục sân bay ghi "Dự kiến 0 giờ ngày 24/12/2026"; băng tổng kết ghi "Dự kiến về đích cuối 2026".
- F-02: tiêu đề, dòng nhỏ phía trên ("Cuối năm 2026") và câu tổng kết **đọc từ JSON** (`title`, `kicker`, `tongKet.text`), không viết cứng trong HTML.
- F-03: bỏ chữ giờ "0.0s / 3.0s" khỏi khung (phần xem thử đặt ngoài khung 1080×1920).
- F-04: bỏ số 01/02/03 trên thẻ; giữ đếm "Đã xem n/N" và vạch tiến độ.
- F-05: ảnh nền Central Park là `assets/images/phoi-canh-tong-the.jpg` (không có `phoi-canh-cp-tong-the.jpg`).
- F-06: không đặt mặc định cứng "làn xe"; không có đơn vị thì không hiện.
- Khung mờ dần ở 2,45–3,0 s: bản engine làm cả khung mờ dần để lộ cảnh 1 (không dùng rèm tối). Cập nhật demo cho giống.
- Hợp đồng dữ liệu đã chốt: hook `{ lines, soNhan, donVi, dongPhu, image{file,label} }`; danh sách `{ kicker, title, muc[{ten, so}], tongKet{text}, image }` (sourceId và cueKey do engine/spec lo).
- Tùy chọn, AGY đề xuất bằng hình: ảnh chụp engine cho thấy danh sách dồn lên nửa trên, nửa dưới (khoảng Y 700–1500) còn trống. Nếu thấy nên cân lại bố cục trong vùng an toàn 3:4, làm một phương án để anh duyệt (anh quyết).

## Việc 2: khung "nguồn" cuối video (anh đồng ý dùng 15/11/2026)
Khung ngắn 2–3 giây đặt **trước cảnh cuối** (cảnh cuối đã có tên + QR). Nội dung: ghi nguồn số liệu chính của video để người xem tin cậy.
- Dữ liệu: `{ "nguon": [{ "ten": "Tuổi Trẻ", "ngay": "12/10/2026" }, ...] }`, tối đa 3 dòng, chỉ tên nguồn và ngày (không link dài, không câu "theo bảng giá chủ đầu tư ngày…", không câu phủ nhận). Claude chọn nguồn nào hiện từ bảng nguồn của kịch bản.
- Chữ nhỏ nhưng đọc được trên điện thoại ở nửa giây đầu; nằm trong vùng an toàn 3:4 (Y 240–1680); cùng phong cách kiểu 1 (nền tối `#06121f`, nhấn `#7ee0c3`).
- Không dùng nhãn "Thông tin mang tính tham khảo" (anh quyết riêng từng video).
- Làm 2 ví dụ: 1 nguồn (Newsky video 1: "Tuổi Trẻ 12/10/2026") và 3 nguồn (video 8: Pháp Luật Plus 01/11, CafeF 30/10 và 04/11/2026).

## Ràng buộc
Quy tắc cứng và No AI Slop trong `CLAUDE.md` (không hộp viền phát sáng, không nền kẻ lưới, không nhãn chữ hoa giãn chữ, không thẻ giống hệt nhau xếp hàng, không SĐT chữ, phối cảnh có nhãn "Phối cảnh minh họa", số chỉ lấy từ spec). **Không sửa file trong repo**, và **không dựng lại bản "blueprint" Remotion**: Claude là người lắp.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-sua-mo-dau-danh-sach-va-khung-nguon/`: `mo-dau-kieu-1/`, `danh-sach-kieu-1/`, `khung-nguon/` (mỗi thư mục có `index.html` mở được ngay, JSON mẫu, ảnh chụp ở các mốc 0,0/0,5/1,0/2,0 s hoặc đầu/giữa/cuối), `ket-qua.md` ngắn (làm gì, chỗ nào chưa chắc, trường dữ liệu cần thêm).

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm, rồi lắp khung nguồn vào engine (cảnh/ghi chú cuối) theo TDD.
