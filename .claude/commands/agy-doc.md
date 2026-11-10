---
description: Đọc kết quả Antigravity (AGY) để ở Drive, đối chiếu với repo, báo anh và lưu bản đã kiểm vào repo
argument-hint: [tên thư mục bàn giao, bỏ trống = mới nhất]
---
AGY chỉ đọc repo và để kết quả ở Drive `Bcons/agy/den-claude/` (id thư mục `197wlXCCHm3YesY8IPTjHwQrefX-ECYBB`). Nếu anh đính kèm file vào chat thì dùng file đó.

1. Tìm thư mục $ARGUMENTS (hoặc mới nhất theo `modifiedTime`) trong `den-claude/` bằng connector Google Drive, đọc `ket-qua.md` và file phụ. File quá lớn (HTML nhúng ảnh) thì xin anh đính kèm vào chat, đừng bỏ qua.
2. Việc theo loại (tên thư mục: `<ngày>-<loại>-<chủ đề>`):
   - **nghien-cuu**: coi là dữ liệu CHƯA KIỂM. Làm cổng 1 (`bcons-video`): mở từng link gốc bằng curl, đối chiếu từng số, loại số sai/bịa, ghi `du-an/<mã>/nguon/gemini/<ngày>-<chủ đề>-KIEM.md` (lưu cả bản gốc của AGY cạnh đó).
   - **kiem-toan**: lưu `kiem-toan/<ngày>-<chủ đề>/bao-cao.md`; đối chiếu TỪNG mã với code hiện tại (có phát hiện sai, vd. audit 09/11 có 2 mã sai); ghi `phan-hoi.md` (đúng / sai / một phần, commit đã sửa); trình anh kế hoạch sửa, chờ "OK".
   - **thiet-ke**: chụp ảnh các phương án bằng Playwright (390 px), gửi anh chọn (`SendUserFile`). Kiểm số liệu/công thức/chữ nội bộ so với quy tắc. Anh chọn xong mới tích hợp vào `engine/landing` (TDD, cổng duyệt).
   - **zalo** (mỗi video một file `<tên video>.md`): lưu từng file thành `du-an/<mã>/video/<tên>/zalo.md` (bỏ ghi chú cho Claude), đối chiếu số với bảng nguồn `kich-ban.md` của video đó, chạy `npm run check:caption -- --all` (kiểm cả `zalo.md`), sửa lỗi quy tắc cứng, đưa anh đọc và duyệt (`status: draft` cho tới khi anh nói duyệt; không sửa `caption.md` vì sẽ mất dấu duyệt).
3. Báo anh ngắn: AGY làm gì, em đối chiếu ra sao, điểm AGY sai/thiếu, việc cần anh quyết.
4. Không commit/push khi anh chưa nói "OK"; không chép dữ liệu khách/hoa hồng/.env vào repo.
