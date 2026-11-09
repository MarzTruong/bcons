# kiem-toan/ — báo cáo rà soát của Antigravity

Antigravity **chỉ đọc code, tuyệt đối không sửa code**; việc của nó là xuất báo cáo. Claude Code đọc báo cáo từ git, đối chiếu với code rồi sửa (anh duyệt theo cổng như thường). Phân vai: `docs/phan-vai-claude-antigravity.md`.

## Quy ước cho Antigravity
1. Mỗi lần rà soát một thư mục `kiem-toan/<yyyy-mm-dd>-<chủ đề>/` (chữ thường, không dấu, gạch ngang).
2. File: `bao-cao.md` (theo `_mau-bao-cao.md`), tùy chọn `xac-nhan.md` (biên bản tự kiểm). **Không** ghi file nào ngoài thư mục này.
3. Không chép dữ liệu khách, hoa hồng, `.env`, API key vào báo cáo.
4. `git pull --rebase` → commit với tiêu đề bắt đầu `audit:` (vd. `audit: CISA 2026-11-16`) → `git push`. GitHub tự chặn (dấu ❌ đỏ) commit `audit:` có file ngoài `kiem-toan/`.
5. Mỗi phát hiện có mã riêng (F-01, CQ-01...), ghi file:dòng và commit đang rà (`git log -1`) để đối chiếu được.

## Claude làm gì
Khi anh nhắn "đọc audit mới": `git pull`, đọc thư mục mới nhất, đối chiếu từng mã với code, viết `phan-hoi.md` trong cùng thư mục (đúng / sai / một phần, commit đã sửa hoặc lý do không sửa). Lần rà soát sau Antigravity đọc `phan-hoi.md` cũ để không báo lại phát hiện đã đóng.
