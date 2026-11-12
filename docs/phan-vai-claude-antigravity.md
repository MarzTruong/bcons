# Phân vai Claude Code và Antigravity (AGY) trên cùng repo

> Anh chốt 09–11/2026 (theo báo cáo đề xuất vận hành của AGY). Mục đích: cả hai cùng phục vụ repo `MarzTruong/bcons` không giẫm chân nhau, và chia quota để Claude không chạm giới hạn tuần.

## Nguyên tắc
1. **AGY chỉ đọc repo** (bản sao `E:\Claude\bcons-agy`, `git pull` đầu việc), không commit, không push, không sửa file. Kết quả để ở Drive `Bcons/agy/den-claude/`.
2. **Chỉ Claude Code (và bot Telegram `/duyet`, `/gemini`) ghi vào `main`.**
3. **Claude là lõi hệ thống:** engine, Remotion, bot, Git, quy tắc cứng. Claude kiểm nội dung (số liệu, link, quy tắc cứng) và code của AGY, báo anh.
4. **Giao diện và ảnh là việc của AGY (anh chốt 12/11/2026):** bố cục, màu, chữ, ảnh/hình minh họa, hiệu ứng, trang web, template phiếu. Claude **không** thiết kế UI/UX và không tạo ảnh. Claude được review UX và đề xuất bằng chữ (dùng `impeccable`); phần cần dựng giao AGY, AGY đưa **bản demo cho anh duyệt** trước khi Claude tích hợp. Claude chỉ làm lõi (dữ liệu, tính toán, hợp đồng dữ liệu cho giao diện, test), lắp bản đã duyệt, không tự chỉnh bố cục/màu/chữ; lỗi hiển thị ghi lại gửi AGY, lỗi sai số liệu hoặc quy tắc cứng thì Claude sửa ngay.
5. Skill, workflow, nhiệm vụ của AGY do anh tạo và giao trực tiếp trong Antigravity; không nằm trong repo.

## Thế mạnh
| Việc | AGY | Claude |
|---|---|---|
| UI/UX, ảnh, landing, template phiếu, bản mẫu | thiết kế và làm demo cùng anh | review UX/đề xuất bằng chữ; kiểm số liệu, công thức, code; được anh duyệt mới tích hợp `engine/landing`, chạy test |
| Cào tin thị trường thời gian thực | bảng 6 cột có link gốc | cổng 1: mở lại link, loại số sai |
| Kiểm toán độc lập (bảo mật, rớt lead, pháp lý) | báo cáo có file:dòng | đối chiếu từng mã, sửa phần đúng |
| Video Remotion, giọng, bot, Git, caption | không | Claude + bot |

## Lệnh tắt
`/agy-doc [thư mục]` trong Claude Code: đọc kết quả AGY ở Drive, kiểm nội dung và code, lưu biên bản vào `kiem-toan/`.
