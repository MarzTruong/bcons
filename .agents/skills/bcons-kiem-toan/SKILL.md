---
name: bcons-kiem-toan
description: Rà soát độc lập kiểu CISA repo Bcons (bảo mật, rớt lead, số liệu, pháp lý, kiến trúc) chỉ đọc và xuất báo cáo có file:dòng để Claude đối chiếu rồi sửa.
---
# Kiểm toán độc lập repo Bcons (chỉ đọc)

1. `git pull`, ghi lại `git log -1`. Đọc `kiem-toan/*/phan-hoi.md` các lần trước: **không báo lại phát hiện đã đóng**; chỗ Claude ghi "sai" thì đọc lý do trước khi báo tiếp.
2. Phạm vi mặc định: `engine/` (remotion, landing, automation), `du-an/*/video/*/spec.json` + `caption.md`, `du-an/*/nguon/`, `.github/`, `.githooks/`, tài liệu `docs/` và `CLAUDE.md`.
3. Chạy được: `cd engine/remotion && npm ci && npm test && npm run lint` (không sửa gì). Ghi kết quả.
4. Kiểm: lộ bí mật trong git (`git log --all --stat`), rớt lead ở form landing, số liệu PTTT lệch `du-an/<mã>/nguon/pttt-cdt.json`, câu cấm trong spec/caption, hardcode dự án trong `engine/`, tài liệu trỏ file đã mất, căn cứ pháp lý lỗi thời.
5. Mỗi phát hiện: mã (F-xx, CQ-xx), mức, `file:dòng` đã mở xem, bằng chứng, đề xuất sửa. Chỗ không chắc ghi "không chắc". **Không sửa gì trong repo.**
6. Xuất `ket-qua.md` theo `agy/mau/kiem-toan.md` vào thư mục bàn giao. Claude sẽ lưu vào `kiem-toan/<ngày>-<chủ đề>/bao-cao.md`, ghi `phan-hoi.md` rồi sửa phần đúng.
