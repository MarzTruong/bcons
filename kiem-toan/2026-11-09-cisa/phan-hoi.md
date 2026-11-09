# Phản hồi của Claude — rà soát CISA 09/11/2026

Đối chiếu với code ngày 09/11/2026 (báo cáo rà commit `e346c17`). Đã sửa ở commit `fe3a688` (đợt 1–2), `8081c44`, `2ea2f5f`/`aee63f0` (đợt 3).

| Mã | Kết luận | Xử lý |
|---|---|---|
| F-01, F-02 | Đúng | Gỡ `src/tuan/*` khỏi repo (`fe3a688`) |
| F-03 | Đúng | Bỏ hotline trên hình trong `du-an/bcons-central-park/video/dot-2/kich-ban.md`, thay QR (`fe3a688`) |
| F-04 | Đúng (rủi ro thấp, chỉ chạy trên máy anh) | Kiểm tên file render (`8081c44`) |
| F-05 | Đúng | Bỏ dòng "Ban hien tai" khi dò lỗi (`fe3a688`) |
| F-06 | Một phần: chỉ mất lead khi gửi trong 3 giây đầu sau khi mở trang | Trang tự chờ đủ 3,2 giây rồi mới gửi (`fe3a688`), không phải sửa Apps Script |
| F-07 | Chưa xử lý | Hook chưa chặn `.csv` ngoài `data/`; để lần sau |
| F-08 | Chưa xử lý | Tài liệu landing |
| CQ-01 | Một phần: bộ đếm đã dọn khi bản đồ vẽ xong; thiếu gỡ bản đồ khi rời cảnh | Thêm `map.remove()` và dọn bộ đếm (`fe3a688`) |
| CQ-02 | Đúng | Màu riêng cho bản đồ bộ moi, nhãn trắng viền đen (`fe3a688`) |
| CQ-03 | Đúng | Tên/địa chỉ dự án lấy từ `project.json` (`fe3a688`); dòng "tham khảo" thành tùy chọn `ghiChu`, hỏi anh trước khi thêm |
| CQ-04 | **Sai**: phụ đề đã so khớp nguyên từ | Không sửa |
| CQ-05 | Một phần: video 06 vẫn có QR góc; thiếu khối tên + QR cuối và chữ đè phụ đề | Dời chữ lên trên vùng phụ đề (`fe3a688`) |
| CQ-06, CQ-07, CQ-08, CQ-15 | Đúng, ưu tiên thấp | Chưa xử lý |
| CQ-11 | Đúng | Bỏ qua `dist/` trong test tài liệu (`fe3a688`) |
| CQ-12 | Đúng (chỉ là cảnh báo) | Chưa xử lý: thêm `"type": "module"` cần kiểm lại cấu hình Remotion |
| Mục 3 (Google Maps) | Không dùng được: Google Maps Platform cấm Việt Nam | Thay bằng OpenStreetMap (`aee63f0`) |
