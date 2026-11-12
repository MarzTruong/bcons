# Phiếu tính gửi khách (PNG + PDF): thiết kế

> **Trạng thái:** Đang làm: engine, bot, landing xong, template tạm; chờ bản AGY và anh duyệt (anh duyệt thiết kế 11/11/2026; kế hoạch: `docs/superpowers/plans/2026-11-11-phieu-tinh.md`). Ảnh mẫu A/B/C đã gửi anh; UI/UX giao cho Antigravity (AGY), Claude kiểm UX, làm engine.

## Mục tiêu
Khách để lại thông tin trên landing, hoặc nhắn tin xin bảng giá (TikTok, fanpage, Zalo), nhận **một phiếu tính 1 trang cho đúng căn và PTTT khách chọn**: ảnh PNG gửi thẳng vào khung chat Zalo; thêm PDF khi khách cần gửi cho người khác xem. Phiếu là công cụ chốt bước kế tiếp (hẹn xem nhà mẫu, nhắn số vốn), không phải bảng giá cả dự án.

## Đã chốt với anh (11/11/2026)
- Làm **phương án B**: landing ghi căn, PTTT, lãi, kỳ hạn khách chọn → máy dựng phiếu → gửi về Telegram của anh → anh xem rồi chuyển Zalo 1-1. Máy **không** tự gửi cho khách.
- Khách nhắn tin hỏi giá: anh gõ lệnh bot `/phieu <căn> <PTTT> <vốn>` để dựng cùng loại phiếu.
- Định dạng: **PNG** (rộng 1080 px), **PDF** thêm khi khách cần.
- UI/UX do **AGY** thiết kế; Claude kiểm UX theo tiêu chí bên dưới và tối ưu, rồi tích hợp. Phần engine, bot, test, Git do Claude.
- Ảnh mẫu ba hướng (A khối vàng, B dòng thời gian, C câu trước bảng sau) ở `docs/superpowers/specs/assets/phieu-mau/` làm tham chiếu, **không bắt buộc theo**; AGY được tự sáng tạo.

## Luồng và thành phần
1. **Dữ liệu phiếu** (`phieu.json`, schema bên dưới) lấy từ: payload landing, hoặc lệnh `/phieu`.
2. **Tính tiền**: lõi `engine/landing/calc.mjs` (đối chiếu `nguon/pttt-cdt.json`). Hiện `calc.mjs` ghi cứng 5 PTTT của Central Park; Newsky (PTTT 08, 09, 10) đã có `du-an/bcons-newsky/nguon/pttt-cdt.json` cùng cấu trúc `dot`, nên cần **tổng quát hóa để đọc tỷ lệ từ JSON của từng dự án** thay vì ghi cứng.
3. **Dựng phiếu**: template HTML/CSS (do AGY thiết kế) điền dữ liệu, chụp bằng Chromium (Playwright, đã có trên máy; font Be Vietnam Pro tải từ Google Fonts hoặc nhúng sẵn) ra PNG (viewport 540 px, `deviceScaleFactor` 2) và PDF.
4. **Gửi anh**: bot Telegram gửi ảnh vào chat của anh kèm tên khách, căn, PTTT; anh chuyển Zalo.
5. **Ghi vết**: phiếu đã gửi ghi lại (khách, căn, PTTT, thời điểm) vào Master_Data/CRM khi có (xem thiết kế pipeline Master_Data), không lưu ảnh có tên khách lên git.

## Schema `phieu.json` (hợp đồng giữa engine và template)
`duAn` (tên, mã), `khach` (xưng hô + tên, tùy chọn), `ngay`, `can` (mã, loại, tháp, tầng, DT tim tường, DT thông thủy), `pttt` (mã, tên, ghi chú ngắn, có trần lãi hay không), `gia` (chưa VAT, VAT, có VAT, phí bảo trì 2%), `dot[]` (nhãn, thời điểm, số tiền, loại: tự có / ngân hàng / bàn giao / sổ hồng), `tong` (vốn tự có trước bàn giao, khoản vay, bàn giao, sổ hồng), `vay` (số tiền, lãi giả định, kỳ hạn, trả góp ước tính/tháng), `lienHe` (tên, mã QR, đường dẫn landing). Mẫu thật: `docs/superpowers/specs/assets/phieu-mau/data.json`.

## Nội dung bắt buộc (template phải có)
- Dự án, căn, loại căn, DT; tên khách (nếu có).
- **Đúng một dòng giá**: chưa VAT, có VAT, phí bảo trì 2% đóng khi nhận nhà.
- Bảng đợt (thời điểm, số tiền) và con số chính: **vốn tự có trước bàn giao**, khoản vay, bàn giao, sổ hồng.
- Ước tính trả góp/tháng, ghi rõ lãi và kỳ hạn là giả định.
- Chân phiếu: tên anh, Bcons PS Land, mã QR về landing, câu mời nhắn Zalo.

## Cấm / quy tắc (theo CLAUDE.md)
- Không hoa hồng, không dữ liệu nội bộ, không dữ liệu khách khác.
- Không hứa lợi nhuận hay tăng giá, không "sắp hết".
- Chiết khấu PTTT 01 (8,5%), 04/05 (2,45%) và trần lãi 6,9% chỉ hiện khi khách chọn đúng PTTT đó (trần 6,9% chỉ PTTT 03 và 04, không có ở PTTT 05; Newsky: trần 6,9% chỉ PTTT 09).
- Không ghi SĐT dạng chữ trên hình (đã có QR + tên); không câu "tự bảo vệ" kiểu "theo bảng giá CĐT ngày...".
- Căn đã cọc/LOCK không lập phiếu.
- No AI Slop: không hộp bo góc viền phát sáng, không đánh số khi không phải trình tự, không nhãn chữ hoa giãn chữ.

## Tiêu chí UX để Claude kiểm (và tối ưu)
1. Đọc được trong khung chat Zalo trên điện thoại: chữ thân ≥ 13 px ở bề rộng 540 px, tương phản đủ, không phải phóng to.
2. Một con số chính rõ trong 1 giây ("khách cần chuẩn bị bao nhiêu"), con số phụ không tranh.
3. Số liệu khớp `calc.mjs` đến từng đồng (dựng thử bằng căn thật của cả hai dự án).
4. Cao tối đa khoảng 1.800 px (ở 2x) để Zalo không cắt; PTTT nhiều đợt (08: 12 đợt) vẫn gọn.
5. Chịu được dữ liệu dài: tên khách dài, mã căn dài, 12 đợt, thiếu tên khách, thiếu trần lãi (PTTT không có trần).
6. In PDF khổ A4 không vỡ bố cục.

## Giao việc cho AGY (anh dán)
"Em `git pull` trong `E:\Claude\bcons-agy`, đọc `docs/superpowers/specs/2026-11-11-phieu-tinh-design.md` và ba ảnh mẫu trong `docs/superpowers/specs/assets/phieu-mau/`. Thiết kế template phiếu tính (HTML/CSS thuần, nhận dữ liệu theo `data.json`) ở bề rộng 540 px, ít nhất 2 phương án khác hẳn nhau, kèm ảnh chụp từ dữ liệu của cả Bcons Central Park và Bcons Newsky (12 đợt). Không sửa file trong repo. Kết quả để ở Drive `Bcons/agy/den-claude/<ngày>-phieu-tinh/`."

## Các giai đoạn thực hiện (sau khi anh duyệt spec)
1. AGY trả template; Claude kiểm UX theo tiêu chí, nêu chỗ cần sửa; anh chọn.
2. Claude tổng quát hóa `calc.mjs` đọc `pttt-cdt.json` (TDD, test bằng số CĐT của hai dự án).
3. Bộ dựng PNG/PDF (lệnh `npm run phieu`), test với dữ liệu thật.
4. Landing ghi thêm căn/PTTT/lãi/kỳ hạn vào payload (test payload thật, không làm mất lead).
5. Bot: nhận phiếu từ landing, lệnh `/phieu`, gửi Telegram; qua cổng duyệt của anh.

## Chưa quyết (hỏi anh khi tới bước đó)
- Phiếu có in tên khách hay chỉ "anh/chị".
- Lưu lịch sử phiếu đã gửi ở đâu (phụ thuộc Master_Data).
- Zalo OA/ZNS tự gửi (phương án C) để sau.

## Bổ sung 12/11/2026: hướng A (link xem phiếu, chạy khi máy anh tắt)
- Tin Telegram báo khách mới có thêm dòng "Xem phiếu tính (bấm, lưu ảnh gửi khách): `<site>/phieu.html?k=..&g=..`". Trang tự dựng phiếu **trong trình duyệt** bằng cùng lõi tính (`engine/landing/phieu/phieu-core.mjs`, `phieu-web.mjs`), có nút "Lưu ảnh phiếu" (PNG 1080 px). Máy chủ không nhận ảnh từ ai. Liên kết không chứa tên hay SĐT; chỉ trỏ về trang của đúng dự án (`SITE` trong `Code.gs`).
- Tham số: `k` PTTT, `g` giá chưa VAT của PTTT đó, `l` lãi, `n` năm vay, `m` mã căn, `c` loại căn, `th` tháp, `tg` tầng, `d`/`dt` diện tích, `t` tên khách (anh gõ thêm nếu muốn). Sai tham số thì trang báo "Liên kết không đúng", không dựng phiếu.
- `/phieu` trên bot giữ cho khách nhắn hỏi mã căn lẻ (tra giá trong Master File).
- **Hợp đồng với template (AGY giữ khi làm giao diện):** (1) hai chỗ dùng chung một template: máy anh (đọc `#phieu-data`) và trang web (gọi `window.veTheoDuLieu(phieu)`); (2) vẽ vào `#app`, rồi đặt `document.documentElement.dataset.ready = "1"`; (3) `can.ma` có thể `null` (căn theo khung giá: chỉ có loại căn); (4) `lienHe.qrSvg` có thể vắng; (5) trên điện thoại nội dung phải co theo bề ngang (trang web đang ghi đè `body{width:auto;max-width:540px}`); (6) nút "Lưu ảnh" chụp bằng SVG `foreignObject` nên font ngoài (Google Fonts) không vào ảnh, nên dùng font hệ thống hoặc nhúng font. Template hiện tại là **bản tạm của Claude**, AGY thay.
