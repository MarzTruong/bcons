# Nhiệm vụ cho AGY: viết bài Zalo từ kịch bản video, lượt thử so sánh với Claude (10/11/2026)

- Loại: zalo (vai content creator)   - Giao bởi: Claude Code theo lời anh   - Đọc trước: `agy/README.md`, `docs/quy-tac-caption.md` (giọng và mục "Zalo"), `CLAUDE.md` (quy tắc cứng), `du-an/bcons-central-park/project.json` (`lienHe`)

## Mục tiêu
Hiện caption cho Facebook và TikTok được viết từ kịch bản của từng video. Thêm nền tảng thứ ba: **Zalo**. Với mỗi video, viết **một bài Zalo** dựa trên kịch bản video đó, cùng số liệu và cùng nguồn, nhưng giọng và nhịp của Zalo (tin nhắn/nhật ký thân mật), không chép lại caption Facebook/TikTok.

## Lượt thử: 3 video
Anh muốn so sánh bài viết của AGY và của Claude, nên **lượt này chỉ làm 3 video**: `05-cho-thue-kcn-bien-hoa`, `07-lai-vay-ha-nhiet`, `08-cuoi-nam-ve-dich`. Claude viết bài Zalo cho đúng 3 video này độc lập, cùng đề bài, và **AGY không cần (và không nên) đọc `video/<tên>/zalo.md`**, để hai bên không ảnh hưởng nhau. Anh chọn bản nào hợp hơn thì mới làm tiếp các video còn lại.

## Với mỗi video, đọc trong `du-an/bcons-central-park/video/<tên>/`
- `kich-ban.md`: kịch bản và **bảng nguồn** (số nào có nguồn, ngày, link). Chỉ dùng số trong bảng nguồn này.
- `spec.json`: chữ hiện trong video (để bài Zalo khớp video).
- `caption.md`: caption Facebook/TikTok đã viết, để **tránh trùng ý nguyên văn** và giữ cùng mốc số, cùng cách nói "dự kiến/phương án".
Video 08 chưa đăng: vẫn viết (video sắp có).

## Yêu cầu bài Zalo
- Khoảng 400–900 ký tự, đoạn ngắn, giọng nhắn tin: xưng "em", gọi "anh chị", ít icon, mở bài bằng ý gây tò mò thật (không nhãn dán), kết bằng **một lời mời cụ thể** (nhắn Zalo để nhận thông tin / đặt lịch xem nhà mẫu / hỏi bảng tính).
- Nguồn gom 1–2 câu cuối (tên báo, ngày). Không thêm số ngoài bảng nguồn.
- Quy tắc cứng: không hứa lợi nhuận/tăng giá, không "sắp hết", không căn CĐT LOCK, không nói giá mà thiếu chưa VAT/có VAT + phí bảo trì 2%, trần lãi 6,9% chỉ PTTT 03 và 04. Hạ tầng tương lai luôn "dự kiến" hoặc "phương án" kèm ngày.
- SĐT chỉ ghi số trong `lienHe`, một lần ở câu mời liên hệ.
- Không đăng, không nhắn khách: chỉ viết bản nháp.

## Kết quả cần có
Thư mục bàn giao `2026-11-10-zalo-tu-kich-ban-video` trên Drive (đã có sẵn): **một file cho mỗi video, đặt tên `<tên video>.md`** (ví dụ `03-lai-suat-vay-mua-nha.md`), mỗi file theo `agy/mau/zalo.md` (frontmatter `kenh: [zalo]`, phần `## Zalo`) và dòng ghi chú cuối file: nguồn của từng số (id trong bảng nguồn). Claude sẽ chạy kiểm quy tắc cứng cho bản AGY, rồi đặt hai bản cạnh nhau cho anh so sánh (lưu ở `kiem-toan/2026-11-10-zalo-so-sanh/`); bản anh chọn mới thành `video/<tên>/zalo.md` chính thức.
