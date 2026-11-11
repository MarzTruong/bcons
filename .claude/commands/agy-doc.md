---
description: Đọc kết quả Antigravity (AGY) để ở Drive, kiểm nội dung và code, báo anh
argument-hint: [tên thư mục bàn giao, bỏ trống = mới nhất]
---
AGY để kết quả ở Drive `Bcons/agy/den-claude/` (id thư mục `197wlXCCHm3YesY8IPTjHwQrefX-ECYBB`). Nếu anh đính kèm file vào chat thì dùng file đó.

1. Tìm thư mục $ARGUMENTS (hoặc mới nhất theo `modifiedTime`) bằng connector Google Drive, đọc file kết quả. File quá lớn thì xin anh đính kèm vào chat.
2. Chỉ kiểm **nội dung và code**, không nhận xét UX/UI (phần đó anh làm cùng AGY):
   - Số liệu thị trường: mở lại từng link gốc bằng curl, loại số sai (trang chặn bot thì ghi "chưa kiểm được", không tìm đường vòng).
   - Số liệu dự án, công thức tính, quy tắc cứng trong `CLAUDE.md`: đối chiếu `du-an/<mã>/`.
   - Code/HTML: soát lỗi, rớt lead, bảo mật; chạy test nếu tích hợp.
   - Báo cáo kiểm toán: đối chiếu từng mã với code hiện tại (AGY từng sai).
3. Lưu biên bản ngắn vào `kiem-toan/<ngày>-<chủ đề>/` rồi báo anh: AGY làm gì, điểm đúng/sai, việc cần anh quyết. Ngắn gọn để tiết kiệm quota.
4. Không commit/push code vào repo khi anh chưa nói "OK"; không chép dữ liệu khách/hoa hồng/.env vào repo.
