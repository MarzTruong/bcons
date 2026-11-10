---
description: Soạn nhiệm vụ cho Antigravity (AGY) vào agy/nhiem-vu/ và đưa anh đoạn nhắn để dán cho AGY
argument-hint: <loại: nghien-cuu|kiem-toan|thiet-ke|zalo> <chủ đề>
---
1. Từ $ARGUMENTS, viết `agy/nhiem-vu/<yyyy-mm-dd>-<loại>-<chủ đề>.md` theo `agy/nhiem-vu/_mau.md` (mục tiêu, phạm vi, kết quả cần có, commit hiện tại `git log -1`, file cần đọc). Ngắn, đủ để AGY làm không phải hỏi lại.
2. Chạy `npm test` trong `engine/remotion` (docs test kiểm đường dẫn), commit + push theo quy trình `/luu`.
3. Trả anh đúng một đoạn để dán vào AGY: "Em vào `E:\Claude\bcons-agy`, chạy `git pull`, rồi làm theo `agy/nhiem-vu/<file>` và `agy/README.md`. Chỉ đọc repo, không mở `E:\Claude\bcons`; mọi thành phẩm lưu vào Drive `agy/den-claude/`. Xong thì báo anh." (anh dán trong khung chat của AGY, hoặc dùng lệnh `/<loại>` của AGY).
