# AGENTS.md — dành cho công cụ AI khác (Antigravity, Codex...)

Quy tắc dự án ở `CLAUDE.md` (bắt buộc đọc). Phân vai giữa Claude Code và Antigravity: `docs/phan-vai-claude-antigravity.md`.

Tóm tắt cho công cụ không phải Claude Code:
- **Chỉ đọc code, tuyệt đối không sửa code.** Việc duy nhất được ghi: báo cáo trong `kiem-toan/<yyyy-mm-dd>-<chủ đề>/` theo `kiem-toan/README.md`, commit tiêu đề `audit: ...`, `git pull --rebase` trước khi push.
- Không chép dữ liệu khách/hoa hồng/.env/API key vào báo cáo.
- Tiếng Việt, xưng "em", gọi người dùng là "anh".
