---
name: bcons-nghien-cuu
description: Nghiên cứu thị trường Bcons có nguồn (hạ tầng, lãi suất, giá khu vực Biên Hòa/Đồng Nai) và xuất bảng 6 cột để Claude kiểm ở cổng 1 làm video/caption.
---
# Nghiên cứu có nguồn cho Bcons

Dùng khi anh giao "tìm thông tin mới nhất về <chủ đề>".

1. Đọc nhiệm vụ ở `agy/nhiem-vu/` (nếu có), `docs/prompt-gemini-nghien-cuu.md` (khung gốc) và `CLAUDE.md` (quy tắc cứng).
2. Tìm trên báo chính thống: sbv.gov.vn, gso.gov.vn, chinhphu.vn, dongnai.gov.vn, vneconomy.vn, cafef.vn, vnexpress.net, baodongnai.com.vn, baodautu.vn, vars.vn, theleader.vn, laodong.vn, vietstock.vn. Khoảng thời gian: 30 ngày gần nhất (trừ khi nhiệm vụ nói khác).
3. **Mở từng link thật** và chép trích nguyên văn từ bài đã mở. Không tự viết link, không đoán ngày, không làm tròn số.
4. Xuất `ket-qua.md` theo mẫu `agy/mau/nghien-cuu.md`: bảng 6 cột, kèm 3 mục cuối (cảnh báo chưa xác thực, số mâu thuẫn, link không mở được).
5. Không thêm số về dự án (giá, căn, pháp lý): phần đó Claude lấy từ `du-an/<mã>/`.
6. Không đề xuất câu quảng cáo hứa lợi nhuận/tăng giá. Hạ tầng tương lai ghi "dự kiến" hoặc "phương án" kèm ngày.
7. Lưu vào `agy/den-claude/` trên Drive (xem `agy/README.md`), rồi báo anh. Claude sẽ mở lại từng link ở cổng 1 và loại số sai.
