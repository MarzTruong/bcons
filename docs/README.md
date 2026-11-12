# Mục lục tài liệu (docs/)

Quy ước: xong một kế hoạch thì sửa dòng **Trạng thái** ở đầu file kế hoạch và bảng dưới đây. `npm test` (file `engine/automation/docs.test.mjs`) tự kiểm: kế hoạch/thiết kế có trạng thái, mục lục đủ file, tài liệu đang dùng không trỏ tới file đã xóa/đổi tên. File "Lịch sử" giữ nguyên để tra lại, **không làm theo** đường dẫn trong đó.

## Hướng dẫn đang dùng
| File | Nội dung |
|---|---|
| `huong-dan-bot-telegram.md` | Bot Telegram: lệnh, cài, chạy trên PC/laptop |
| `huong-dan-dang-bai.md` | Duyệt caption/video, hẹn giờ Metricool |
| `huong-dan-landing.md` | Landing, Apps Script, Cloudflare Pages, gắn link |
| `huong-dan-master-data.md` | Cài và thử Master_Data từng cổng G1–G6, dùng hằng ngày, xử lý lỗi |
| `huong-dan-mcp.md` | MCP (không bắt buộc), hook chặn commit |
| `quy-trinh-video.md` | Các cổng làm video |
| `quy-tac-caption.md` | Cách viết caption tự nhiên |
| `quy-tac-so-phu-de.md` | Quy tắc viết số trên màn hình (ITN): 11%/năm, 9.363, quý II/2029 |
| `prompt-gemini-nghien-cuu.md` | Khung prompt nghiên cứu số liệu |
| `phan-vai-claude-antigravity.md` | Phân vai Claude Code (Lead) và Antigravity (rà soát, chỉ đọc) trên cùng repo |
| `nhat-ky.md` | Lịch sử: việc đã làm đến 09/11/2026 (dời từ `NOTES.md`) |

## Kế hoạch và thiết kế (`superpowers/`)
| File | Trạng thái |
|---|---|
| `superpowers/specs/2026-11-05-bcons-automation-pipeline-design.md` | Thiết kế tổng. Còn: kế hoạch 04, giai đoạn 2–3 |
| `superpowers/specs/2026-11-12-cong-cu-ban-hang-design.md` | Công cụ bán hàng khi gặp khách (web app, Newsky trước): thiết kế nháp chờ anh duyệt; giao diện giao AGY |
| `superpowers/specs/2026-11-11-phieu-tinh-design.md` | Phiếu tính gửi khách (PNG + PDF): thiết kế đã duyệt 11/11/2026; UI/UX giao AGY |
| `superpowers/plans/2026-11-11-phieu-tinh.md` | Kế hoạch thực hiện phiếu tính (8 task), Task 1–7 xong, Task 8 chờ template AGY |
| `superpowers/specs/2026-11-11-master-data-khach-hang-design.md` | Thiết kế kho khách tập trung Master_Data. Đã duyệt 11/11/2026. Code đã dựng và test trên máy, gồm đồng ý theo dự án và rút lại giữ hồ sơ (mục 16; chưa cài lên Sheet thật, chờ cổng G1–G6) |
| `superpowers/plans/2026-11-11-master-data-dong-y-theo-du-an.md` | Kế hoạch đổi sang đồng ý theo dự án, rút lại giữ hồ sơ (5 task). Task 1–5 xong trên máy (11/11/2026), chờ anh duyệt cổng G1–G6 |
| `superpowers/plans/2026-11-11-master-data-khach-hang.md` | Kế hoạch dựng Master_Data (10 task). Task 1–10 xong trên máy (11/11/2026), chờ anh duyệt cổng G1–G6 |
| `superpowers/plans/2026-11-06-05-video-am-thanh-phu-de.md` | Đã xong (chờ anh chạy thử trên máy) |
| Kế hoạch 04 (báo cáo tuần) | Chưa viết, làm sau bài đăng đầu 09/11/2026 |
