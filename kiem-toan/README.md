# kiem-toan/ — lưu trữ báo cáo rà soát đã đối chiếu

Antigravity (AGY) chỉ đọc repo, **không ghi vào repo**. AGY đặt báo cáo vào Drive `agy/den-claude/` (xem `agy/README.md`); khi anh gọi `/agy-doc`, Claude Code:
1. chép `ket-qua.md` của AGY thành `kiem-toan/<yyyy-mm-dd>-<chủ đề>/bao-cao.md`;
2. đối chiếu từng mã phát hiện với code, ghi `phan-hoi.md` (đúng / sai / một phần, commit đã sửa);
3. sửa các phát hiện đúng, theo cổng duyệt.

Lần rà soát sau, AGY đọc các `phan-hoi.md` ở đây để không báo lại phát hiện đã đóng. Mẫu báo cáo: `agy/mau/kiem-toan.md`.
