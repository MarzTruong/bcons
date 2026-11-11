# Phân vai Claude Code và Antigravity (AGY) trên cùng repo

> Anh chốt 09–11/2026 (theo báo cáo đề xuất vận hành của AGY). Mục đích: cả hai cùng phục vụ repo `MarzTruong/bcons` không giẫm chân nhau, và chia quota để Claude không chạm giới hạn tuần.

## Nguyên tắc
1. **AGY chỉ đọc repo** (bản sao `E:\Claude\bcons-agy`, `git pull` đầu việc), không commit, không push, không sửa file. Kết quả để ở Drive `Bcons/agy/den-claude/`.
2. **Chỉ Claude Code (và bot Telegram `/duyet`, `/gemini`) ghi vào `main`.**
3. **Claude là lõi hệ thống:** engine, Remotion, bot, Git, quy tắc cứng. Claude kiểm nội dung (số liệu, link, quy tắc cứng) và code của AGY, báo anh; không nhận xét UX/UI.
4. Skill, workflow, nhiệm vụ của AGY do anh tạo và giao trực tiếp trong Antigravity; không nằm trong repo.

## Thế mạnh
| Việc | AGY | Claude |
|---|---|---|
| UI/UX, landing, bản mẫu | thiết kế cùng anh | kiểm số liệu, công thức, code; được anh chọn mới tích hợp `engine/landing`, chạy test |
| Cào tin thị trường thời gian thực | bảng 6 cột có link gốc | cổng 1: mở lại link, loại số sai |
| Kiểm toán độc lập (bảo mật, rớt lead, pháp lý) | báo cáo có file:dòng | đối chiếu từng mã, sửa phần đúng |
| Video Remotion, giọng, bot, Git, caption | không | Claude + bot |

## Lệnh tắt
`/agy-doc [thư mục]` trong Claude Code: đọc kết quả AGY ở Drive, kiểm nội dung và code, lưu biên bản vào `kiem-toan/`.
