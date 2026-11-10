# Nguyên tắc viết caption quảng cáo (FB/TikTok đi kèm video)

Anh yêu cầu 06/11/2026. Khi khác với skill `real-estate-content-creator` (khuôn bài có danh sách, bắt buộc nêu điểm đánh đổi, dòng liên hệ có SĐT), làm theo file này. Khuôn và điểm đánh đổi của skill chỉ dùng cho bài phân tích tài chính dài.

Caption là quảng cáo, người đọc lướt điện thoại chứ không đọc báo cáo. Viết như một người bán nhà giỏi đang kể chuyện cho khách nghe. Đọc to lên mà thấy giống văn bản hành chính hoặc giống máy viết thì viết lại.

## Nên
- Câu đầu là một ý gây tò mò, có số thật, đủ hay để bấm "Xem thêm". Mỗi bài một kiểu mở.
- Dẫn chuyện thành đoạn văn ngắn, chọn 3-5 số đắt nhất, không cần đưa hết số trong video. Làm tròn cho dễ đọc khi không sai nghĩa ("hơn 99%" thay vì "99,26%").
- Lời đời thường, câu dài ngắn xen nhau, có thể hỏi, có "nha", "nè" vừa phải.
- Nguồn và lưu ý gom vào 1-2 câu cuối bài như chữ nhỏ, không chen vào giữa câu chuyện.
- Kết bằng một lời mời cụ thể: từ khóa comment trùng với lời đọc trong video, hoặc nhắn trang để em tính thử.

## Tránh (dấu hiệu "AI slop")
- Mở bài kiểu nhãn dán: "Vay mua nhà năm 2026: ...", "Vài con số để hình dung", "Số liệu nói gì", "ba con số đáng ghi lại".
- Câu sáo làm màu: "chỉ là nửa câu chuyện", "nói cho đủ", "không chỉ A mà còn B", "không phải A mà là B", "đáng để mình cân nhắc", "một lựa chọn để cân nhắc".
- Danh sách ✅ liệt kê số liệu, mỗi dòng một số kèm ngoặc nguồn.
- Đoạn "Lưu ý: ..." dài, rào đón làm yếu thông điệp.
- Bài nào cũng một khuôn: hook, danh sách, lưu ý, 📍 địa chỉ, comment.
- Kể chuyện cá nhân không có thật ("hồi em mua...", "khách em kể..."), hoặc nói "đang lên", "khách đông" khi chưa có nguồn.

## Không nới
Quy tắc cứng trong `CLAUDE.md` giữ nguyên: số có nguồn, không hứa lợi nhuận hay tăng giá, giá ghi VAT và phí bảo trì 2%, trần 6,9% chỉ ở PTTT 03/04, hạ tầng tương lai ghi "dự kiến" hoặc "phương án", caption được ghi SĐT của anh (số trong `project.json` → `lienHe`), không ghi số khác. Viết tự nhiên là đổi cách nói, không đổi sự thật.

## Zalo (anh bổ sung 10/11/2026)
Zalo là nền tảng thứ ba viết từ kịch bản video, bên cạnh Facebook và TikTok. Cùng tinh thần và quy tắc cứng; thêm:
- **Mỗi video một bài Zalo** ở `du-an/<mã>/video/<tên>/zalo.md` (frontmatter `status`, `kenh: [zalo]`, phần `## Zalo`). Để file riêng, không nhét vào `caption.md`, vì sửa `caption.md` làm mất dấu duyệt của Facebook/TikTok (video 1–7 đã duyệt và lên lịch). `npm run check:caption -- <tên>` kiểm cả `zalo.md` (SĐT, cụm cấm, VAT + phí bảo trì); bot `/xem <tên>` hiện bài Zalo.
- Cùng số liệu và cùng nguồn với video và caption FB/TikTok, nhưng không chép nguyên văn. Giọng gần gũi như nhắn tin: xưng "em", gọi "anh chị", đoạn ngắn, khoảng 400–900 ký tự, ít icon (không làm gạch đầu dòng), một lời mời cụ thể (nhắn Zalo, đặt lịch xem nhà mẫu).
- **Không** dùng Zalo cá nhân nhắn hàng loạt. Tin chủ động chỉ gửi khách đã đồng ý nhận tin, qua Zalo OA/ZNS (`CLAUDE.md` mục "Tin nhắn hàng loạt").
- Bản nháp do Antigravity viết (skill `bcons-content-zalo`) vẫn qua kiểm quy tắc cứng và anh duyệt trước khi đăng.

## Bản có icon (anh hỏi 10/11/2026)
Icon không tự nó là "AI slop": FB/TikTok/Zalo đều quen có icon. Slop là icon rập khuôn: làm gạch đầu dòng, ✅🔥💥🚀 chồng lên nhau, bài nào cũng 📍 địa chỉ. Vì vậy **mỗi bài có hai bản để anh chọn**:
- **Bản chữ thuần**: `caption.md` (FB/TikTok), `zalo.md` (Zalo).
- **Bản có icon**: `video/<tên>/caption-icon.md` (cùng nội dung chữ, thêm icon; có `## Facebook`, `## TikTok`, `## Zalo`). Bot: `/xem <tên> icon`.

Quy tắc icon (code kiểm trong `checkIcons`, `npm run check:caption -- <tên>`):
- Tối đa **4 icon mỗi phần**; thực tế dùng 2–3, mỗi icon có chỗ riêng (một cái ở câu mở hoặc ý chính, một cái ở lời mời nhắn tin).
- Không dùng icon làm gạch đầu dòng (không quá 1 dòng bắt đầu bằng icon); một icon không lặp quá 2 lần.
- Cấm bộ rập khuôn: ✅ ✔ ❌ 🔥 💥 🚀 💯 ‼. Không icon trong dòng nguồn, số liệu.
- Chọn icon hợp nghĩa (🏗️ công trình, ✈️ sân bay, 🏦 ngân hàng, 🏭 khu công nghiệp, 💬 nhắn tin), đổi theo từng bài, không một bộ icon cho mọi bài.
Anh chọn bản nào cho từng video thì nhắn Claude, em cập nhật bài đăng/Sheet theo bản đó (bài đã lên lịch Metricool sửa riêng).
