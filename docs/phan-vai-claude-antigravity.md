# Phân vai Claude Code và Antigravity trên cùng repo

> Anh chốt 09/11/2026. Mục tiêu: hai công cụ cùng làm repo `MarzTruong/bcons` mà không giẫm chân nhau.

## Thế mạnh cốt lõi
| | Claude Code (Lead) | Antigravity (Gemini, Google) |
|---|---|---|
| Làm tốt nhất | Sửa code nhiều file theo quy tắc của repo (`CLAUDE.md`, 4 cổng video, test thật trước khi sửa); viết kịch bản/caption tiếng Việt theo `docs/quy-tac-caption.md`; giữ cổng duyệt, commit/push; chạy trên cloud khi anh dùng điện thoại; điều phối phiên con | Đọc toàn bộ repo một lượt để rà soát độc lập (như 2 file audit 09/11); tìm thông tin Google (cùng họ với `/gemini`); thử nhanh ý tưởng giao diện trong trình duyệt của nó |
| Không nên giao | Rà soát chính code mình viết (dễ bỏ sót cùng một kiểu lỗi) | Commit lên `main`, sửa `engine/` khi chưa qua test của repo, tự đổi quy tắc trong `CLAUDE.md` |

## Luật để không xung đột
1. **Một người ghi `main`:** chỉ Claude Code (và bot `/duyet`, `/gemini` trên máy anh) commit lên `main`.
2. **Antigravity chỉ đọc code, tuyệt đối không sửa code** (anh chốt 09/11/2026). Việc của nó là xuất báo cáo.
3. **Báo cáo đi qua git:** Antigravity ghi vào `kiem-toan/<ngày>-<chủ đề>/bao-cao.md` theo `kiem-toan/_mau-bao-cao.md`, commit tiêu đề `audit: ...` rồi push. Chỉ được đụng `kiem-toan/` (GitHub Actions chặn bằng `engine/automation/kiem-audit.mjs`). Claude đọc từ git, đối chiếu với code trước khi sửa (audit 09/11 có 2 phát hiện sai), ghi kết luận vào `phan-hoi.md` cùng thư mục. Quy ước chi tiết: `kiem-toan/README.md`.
4. **Trước khi bắt đầu:** máy chạy Antigravity `git pull` để đọc bản mới nhất; không làm khi bot hoặc phiên Claude local đang sửa cùng thư mục.
5. **Quy tắc chung đọc ở `CLAUDE.md`** (Antigravity đọc qua `AGENTS.md`): quy tắc cứng về dữ liệu, giá, SĐT, "No AI Slop" áp dụng cho cả hai.

## Chia việc thường gặp
| Việc | Ai làm |
|---|---|
| Tìm số liệu thị trường | `/gemini` trên bot (Gemini) → Claude kiểm từng link (cổng 1) |
| Kịch bản, spec, caption, storyboard | Claude |
| Sửa `engine/`, test, commit | Claude (sub-agent Sonnet viết code, Haiku dò file, Opus lập kế hoạch/review) |
| Rà soát định kỳ (bảo mật, số liệu, đồng bộ tài liệu) | Antigravity, chỉ đọc, xuất báo cáo vào `kiem-toan/` |
| Thiết kế mới | Claude đưa ảnh mẫu (`impeccable`, `frontend-design`); Antigravity có thể góp ý bản mẫu |
