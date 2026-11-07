> **Trạng thái:** Đã xong 06/11/2026. Bổ sung 07/11: `/sfx`, `/render <tên> khongnhac`, bot chạy lâu được giữ khi mở trùng, báo tên máy.

# Kế hoạch 02b: Bot Telegram điều khiển pipeline (chạy trên laptop)

> Anh duyệt 06/11/2026 ("OK, chạy trên laptop trước và làm cả 2 cách"). Thực hiện trực tiếp trong phiên (native), soát cuối bằng agent.

**Mục tiêu:** anh không phải gõ lệnh PowerShell. Trên Telegram anh nhắn (1) **lệnh cố định** để duyệt, gửi, render, tạo giọng, lấy bản mới; (2) **câu nói tự do** để giao việc, bot chuyển cho Claude Code chạy trên laptop (`claude -p`, dùng gói Claude anh đang có).

**Kiến trúc:** chương trình `npm run bot` (thư mục `engine/remotion/scripts/bot/`) đọc tin bằng long polling Telegram Bot API, **chỉ nhận tin từ `TELEGRAM_CHAT_ID`**, chạy **một việc một lúc** (việc sau xếp hàng). Logic xử lý (`handlers.mjs`) nhận các phụ thuộc qua tham số (Telegram, chạy lệnh, git, Claude) nên test được bằng bản giả. Gọi thẳng các hàm đã có (`duyetCaption`, `duyetVideo`, `sendApproved`, `videoPaths`) thay vì gọi lại npm.

## Lệnh
| Lệnh | Làm gì | Hỏi xác nhận |
|---|---|---|
| `/danhsach` | Mỗi video: caption (nháp/đã duyệt/đổi sau duyệt), mp4 có chưa, video đã duyệt chưa | không |
| `/xem <tên>` | Gửi caption FB + TikTok và bản xem thử mp4 (nếu có) | không |
| `/duyet <tên>` | Duyệt caption (nếu chưa hoặc đã đổi) + duyệt video + gửi bản đăng + commit `caption.md` + push | không (anh gõ lệnh = anh duyệt) |
| `/render <tên>` | `npm run render:drive -- <tên>`, xong gửi bản xem thử | không |
| `/giong <tên>` | `npm run voice -- <tên>` (tốn credit ElevenLabs) | **có**: nút Đồng ý / Hủy |
| `/capnhat` | `git pull --ff-only`; nếu `package-lock.json` đổi thì `npm ci` | không |
| `/moi` | Bắt đầu cuộc trò chuyện Claude mới (quên bối cảnh cũ) | không |
| `/huongdan` | Danh sách lệnh | không |
| Tin không bắt đầu bằng `/` | Chuyển cho `claude -p` (cách B) | Sau khi Claude sửa file: nút **Lưu lên GitHub** / **Bỏ thay đổi** |

## Ràng buộc
- Chỉ xử lý tin/nút bấm từ đúng `TELEGRAM_CHAT_ID`; tin khác bỏ qua, không trả lời.
- Không in token. Tên video kiểm `^[a-z0-9-]+$` trước khi chạy gì.
- Claude (cách B): prompt đưa qua stdin (không ghép vào dòng lệnh), chỉ cho phép đọc/sửa file, chạy test/lint/check, git status/diff/log, tìm web; **cấm** `npm run voice`, `npm run render:drive`, `git commit`, `git push`. Giữ phiên Claude 3 giờ (`--resume <session_id>`), `/moi` để làm mới. "Bỏ thay đổi" dùng `git stash push -u` (lấy lại được), không xóa hẳn.
- Lưu lên GitHub: `git add` đúng file liên quan (duyệt) hoặc thay đổi Claude vừa làm, `git commit`, `git pull --rebase`, `git push`. Hook chặn commit vẫn chạy.
- Lệnh lỗi: trả lời tiếng Việt kèm 15 dòng cuối của log.
- Khởi động: `Bcons-Bot.cmd` ở gốc repo (bấm đúp), có hướng dẫn cho chạy cùng Windows.

## Việc
1. `core.mjs` + test: `parseCommand`, `isAuthorized`, `videoStatus`, `formatList`, `HELP`.
2. `tg.mjs`: gọi Bot API (sendMessage chia đoạn, sendVideo, answerCallbackQuery, getUpdates), không test mạng.
3. `claude-bridge.mjs` + test: `buildClaudeArgs({ sessionId })` (không nhận chuỗi người dùng), `parseClaudeOutput(json)`.
4. `handlers.mjs` + test: luồng `/duyet` (caption nháp → duyệt → gửi → commit/push), chặn người lạ, `/giong` phải bấm Đồng ý, xếp hàng khi bận, cách B có thay đổi thì hiện nút Lưu/Bỏ.
5. `bot.mjs` (vòng lặp), script `npm run bot`, `Bcons-Bot.cmd`, `docs/huong-dan-bot-telegram.md`; cập nhật `docs/huong-dan-dang-bai.md`, `CLAUDE.md`.
6. `npm test`, `npm run lint`, agent soát, push `main`.

## Ngoài phạm vi
- Cập nhật Sheet từ bot (laptop không có quyền Google Sheets): em cập nhật từ cloud khi anh báo, hoặc qua Metricool MCP sau này.
- Hẹn giờ Metricool từ bot: làm qua kết nối Metricool MCP trong Claude (kế hoạch riêng sau khi anh kết nối).
