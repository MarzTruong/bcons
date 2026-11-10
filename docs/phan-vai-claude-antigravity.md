# Phân vai Claude Code và Antigravity (AGY) trên cùng repo

> Anh chốt 09–10/11/2026. Mục tiêu: hai công cụ cùng phục vụ repo `MarzTruong/bcons` mà không giẫm chân nhau. Hướng dẫn chi tiết cho AGY nằm ở `agy/README.md`.

## Nguyên tắc
1. **AGY chỉ đọc repo:** không commit, không push, không sửa hay viết code/tài liệu trong repo.
2. **Chỉ Claude Code (và bot Telegram `/duyet`, `/gemini` trên máy anh) ghi vào `main`.**
3. **AGY bàn giao qua Drive:** `Bcons - Dong bo thiet bi/agy/den-claude/<ngày>-<loại>-<chủ đề>/ket-qua.md` (mẫu ở `agy/mau/`). Không ghi được Drive thì anh tải Artifact gửi vào chat Claude.
4. **Claude đối chiếu rồi mới đưa vào repo:** audit 09/11 có 2 phát hiện sai, báo cáo vận hành có nhiều chỗ lệch; số liệu AGY thu thập luôn qua cổng 1 (mở lại từng link).

## Thế mạnh và việc giao
| Việc | AGY làm | Claude làm |
|---|---|---|
| Nghiên cứu thị trường có nguồn | Tìm báo chính thống, bảng 6 cột (`/nghien-cuu`) | Cổng 1: kiểm từng link, loại số sai, viết kịch bản/spec/caption |
| Kiểm toán độc lập (bảo mật, rớt lead, số liệu, pháp lý) | Báo cáo có file:dòng (`/kiem-toan`) | Đối chiếu, `phan-hoi.md`, sửa phần đúng (lưu ở `kiem-toan/`) |
| Thiết kế giao diện | Bản mẫu HTML + ảnh chụp, ≥ 2 phương án (`/thiet-ke`) | Chụp ảnh cho anh chọn; được chọn thì tích hợp `engine/landing`, chạy test, gắn công thức `calc.mjs` |
| Nội dung đăng Zalo độc lập | Bản nháp theo giọng Zalo (`/zalo`) | Kiểm quy tắc cứng, lưu `du-an/<mã>/content/zalo/`, anh duyệt |
| Caption FB/TikTok/Zalo đi kèm video | không | Claude viết ở `caption.md` (`## Facebook`, `## TikTok`, tùy chọn `## Zalo`) |
| Video Remotion, giọng ElevenLabs, render | không | Claude + bot |
| Sửa `engine/`, bot, test, commit, `NOTES.md` | không | Claude |
| Đăng bài, nhắn khách | không | Anh duyệt rồi đăng (Metricool/Zalo OA) |

## Lệnh tắt
- Trong Claude Code: `/agy-giao <loại> <chủ đề>` (soạn nhiệm vụ cho AGY), `/agy-doc [thư mục]` (đọc kết quả AGY và xử lý).
- Trong Antigravity: `/nghien-cuu`, `/kiem-toan`, `/thiet-ke`, `/zalo` (workflow ở `.agents/workflows/`; skill ở `.agents/skills/`; luật ở `.agents/rules/bcons.md`).

## Việc anh làm
Giao việc cho AGY bằng lệnh tắt hoặc dán đoạn Claude đưa; khi AGY báo xong thì gõ `/agy-doc` cho Claude. Muốn AGY rà soát định kỳ: gõ `/kiem-toan` cho AGY, rồi `/agy-doc` cho Claude.
