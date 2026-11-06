---
name: bai-cong-ty
description: Biên tập bài/ảnh/video do công ty Bcons PS Land cung cấp thành caption Facebook + TikTok cho kênh, giữ nguyên thông tin gốc, chờ anh duyệt rồi đưa vào Lịch nội dung
argument-hint: [link Drive hoặc nội dung bài công ty]
---

Bài công ty anh gửi: **$ARGUMENTS**

1. Đọc bài gốc (connector Google Drive nếu là link). Ghi lại: nội dung chính, mọi con số, ngày, tên sự kiện. **Không thêm số hay thông tin không có trong bài gốc**; số về dự án phải khớp `du-an/<mã>/thong-tin.md`, lệch thì hỏi anh.
2. Tạo thư mục `du-an/<mã>/content/bai-cong-ty/<yyyy-mm-dd>-<slug>/` (slug a-z, 0-9, gạch ngang). Viết `caption.md` (`status: draft`, `## Facebook`, `## TikTok`) theo giọng kênh theo `docs/quy-tac-caption.md` (ưu tiên hơn khuôn của skill `real-estate-content-creator`). Cuối bài FB ghi link Drive của ảnh/video gốc để anh tải khi đăng. SĐT chỉ dùng số của anh (`project.json` → `lienHe`); ảnh phối cảnh ghi "hình ảnh minh họa"; nhắc giá thì ghi rõ VAT và phí bảo trì 2%.
3. `cd engine/remotion && npm run check:caption -- --bai ../../du-an/<mã>/content/bai-cong-ty/<thư mục>`; sửa tới khi OK.
4. Thêm dòng vào Sheet Lịch nội dung (`project.json` → `lichNoiDungSheetId`, tab `LichDang`): Mã bài `cty-<yyyy-mm-dd>-<slug>`, Luồng `công ty`, File = link Drive, Caption FB/TikTok, Trạng thái `Chờ duyệt`.
5. **DỪNG. Đưa anh đọc caption.** Anh duyệt thì chạy `npm run duyet:caption -- --bai <đường dẫn>`, cập nhật Sheet "Đã duyệt" + Duyệt lúc. Anh muốn gửi về điện thoại: `npm run send:telegram -- --bai <đường dẫn>` (chạy trên máy anh).
