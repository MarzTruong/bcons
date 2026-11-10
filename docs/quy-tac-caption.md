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
Cùng tinh thần và quy tắc cứng như FB/TikTok; thêm:
- Caption có phần Zalo thì thêm `zalo` vào `kenh` và viết `## Zalo` trong `caption.md` (cùng bị kiểm SĐT, cụm cấm, VAT + phí bảo trì). Bài Zalo độc lập: `du-an/<mã>/content/zalo/<ngày>-<chủ đề>/caption.md` với `kenh: [zalo]`, kiểm bằng `npm run check:caption -- --bai ../../du-an/<mã>/content/zalo/<thư mục>`.
- Giọng gần gũi như nhắn tin: xưng "em", gọi "anh chị", đoạn ngắn, ít icon (không làm gạch đầu dòng), một lời mời cụ thể (nhắn Zalo, đặt lịch xem nhà mẫu). Bài nhật ký/nhóm khoảng 400–900 ký tự; tin chăm sóc ngắn hơn.
- **Không** dùng Zalo cá nhân nhắn hàng loạt. Tin chủ động chỉ gửi khách đã đồng ý nhận tin, qua Zalo OA/ZNS (`CLAUDE.md` mục "Tin nhắn hàng loạt").
- Bản nháp do Antigravity viết (skill `bcons-content-zalo`) vẫn qua kiểm quy tắc cứng và anh duyệt trước khi đăng.
