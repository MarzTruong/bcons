---
name: bcons-content-zalo
description: Vai content creator: viết bài đăng Zalo cho Bcons từ kịch bản các video (như caption Facebook/TikTok đang làm), đúng quy tắc cứng; Claude kiểm và lưu vào repo.
---
# Viết bài Zalo từ kịch bản video (content creator)

Hiện caption Facebook/TikTok được viết từ kịch bản của từng video. Skill này thêm nền tảng **Zalo**: mỗi video một bài Zalo, cùng số liệu và nguồn, giọng Zalo.

1. Đọc `docs/quy-tac-caption.md` (giọng người thật, "AI slop", mục Zalo), `CLAUDE.md` (quy tắc cứng), `du-an/<mã>/project.json` (`lienHe`).
2. Với video `<tên>` trong `du-an/<mã>/video/<tên>/`: đọc `kich-ban.md` (kịch bản + **bảng nguồn**: chỉ dùng số trong đó), `spec.json` (chữ hiện trong video), `caption.md` (FB/TikTok đã viết: giữ cùng mốc số và cách nói "dự kiến/phương án", **không chép nguyên văn**).
3. Viết một bài Zalo cho video: 400–800 ký tự, đoạn ngắn, xưng "em", gọi "anh chị", ít icon (không làm gạch đầu dòng), không danh sách ✅, không mở bài kiểu nhãn dán; kết bằng một lời mời cụ thể (nhắn Zalo để nhận thông tin, đặt lịch xem nhà mẫu, hỏi bảng tính). Nguồn gom 1–2 câu cuối.
4. Quy tắc cứng: không hứa lợi nhuận/tăng giá, không "sắp hết", không căn CĐT LOCK; nhắc giá thì ghi chưa VAT/có VAT + phí bảo trì 2%; trần 6,9% chỉ PTTT 03 và 04; hạ tầng luôn "dự kiến"/"phương án" kèm ngày. SĐT chỉ số trong `lienHe`, một lần.
5. Xuất mỗi video một file `<tên video>.md` theo `agy/mau/zalo.md` (frontmatter `kenh: [zalo]`, phần `## Zalo`) vào thư mục bàn giao; cuối file ghi nguồn từng số (id bảng nguồn). Không đăng, không nhắn khách: chỉ bản nháp.
6. Claude lưu thành `video/<tên>/zalo.md`, chạy `npm run check:caption -- <tên>` (kiểm cả `zalo.md`) và đưa anh duyệt.
