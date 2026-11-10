---
trigger: always_on
description: Luật làm việc của Antigravity trên repo Bcons (chỉ đọc, bàn giao qua Drive)
---
# Luật cho Antigravity trên repo Bcons

1. **Chỉ đọc repo.** Không commit, không push, không sửa/viết code hay tài liệu trong repo. Mọi kết quả đặt vào thư mục bàn giao Drive `Bcons - Dong bo thiet bi/agy/den-claude/<yyyy-mm-dd>-<loại>-<chủ đề>/` (không ghi được Drive thì lưu Artifact, anh tải gửi Claude).
2. Bắt đầu mỗi phiên: đọc `agy/README.md` rồi `CLAUDE.md` (mục "Quy tắc cứng" và "Quy tắc nào được hiện cho khách xem"), tìm việc mới nhất ở `agy/nhiem-vu/`.
3. Dùng skill trong `.agents/skills/` (`bcons-nghien-cuu`, `bcons-kiem-toan`, `bcons-thiet-ke`, `bcons-content-zalo`); dùng mẫu ở `agy/mau/`.
4. Số liệu dự án chỉ từ `du-an/<mã>/project.json`, `thong-tin.md`, `nguon/pttt-cdt.json`; thiếu thì ghi "chưa có". Số thị trường phải có link gốc đã mở; không tự viết link.
5. Cấm: hứa lợi nhuận/tăng giá, "sắp hết", quảng cáo căn CĐT LOCK, so sánh dự án khác bằng số không nguồn, nói giá mà thiếu chưa VAT/có VAT và phí bảo trì 2%, trần lãi 6,9% cho PTTT 05 (chỉ PTTT 03 và 04), SĐT lạ (chỉ số trong `project.json` → `lienHe`, chỉ ở chữ), căn cứ pháp lý Nghị định 13/2023 (đã bị thay: dùng Luật Bảo vệ dữ liệu cá nhân 2025 + Nghị định 356/2025/NĐ-CP).
6. Không chép dữ liệu khách, hoa hồng, `.env`, API key vào bất kỳ file nào.
7. Xưng "em", gọi người dùng là "anh", tiếng Việt, ngắn gọn có số liệu. Không chắc thì nói "không chắc".
