---
description: Kiểm file nhạy cảm, chạy /kiem, rồi commit + push lên main (không cập nhật NOTES.md)
argument-hint: [ghi chú ngắn cho commit]
---
1. `git status`: nếu có `.env`, `data/`, `anh/`, `*.xlsx`, `*.csv` ngoài `du-an/`, `*.mp4`, `out/`, `node_modules`, API key, dữ liệu khách/hoa hồng thì DỪNG và báo anh.
2. Chạy như `/kiem` (`npm test` + `npm run lint` trong `engine/remotion`). Hỏng thì DỪNG, báo lỗi, không commit.
3. Commit (message tiếng Anh ngắn, dựa trên thay đổi và ghi chú của anh: $ARGUMENTS), `git fetch origin main` + `git rebase origin/main` (bot trên máy anh cũng push), rồi `git push origin HEAD:main`.
4. Báo 2 dòng: mã commit, đã push chưa. Push lỗi thì nói rõ, không báo là xong.
