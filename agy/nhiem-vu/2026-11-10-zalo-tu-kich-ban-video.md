# Nhiệm vụ cho AGY: viết bài Zalo từ kịch bản các video 01–08 (10/11/2026)

- Loại: zalo (vai content creator)   - Giao bởi: Claude Code theo lời anh   - Đọc trước: `agy/README.md`, `docs/quy-tac-caption.md` (giọng và mục "Zalo"), `CLAUDE.md` (quy tắc cứng), `du-an/bcons-central-park/project.json` (`lienHe`)

## Mục tiêu
Hiện caption cho Facebook và TikTok được viết từ kịch bản của từng video. Thêm nền tảng thứ ba: **Zalo**. Với mỗi video, viết **một bài Zalo** dựa trên kịch bản video đó, cùng số liệu và cùng nguồn, nhưng giọng và nhịp của Zalo (tin nhắn/nhật ký thân mật), không chép lại caption Facebook/TikTok.

## Với mỗi video (01 → 08), đọc trong `du-an/bcons-central-park/video/<tên>/`
- `kich-ban.md`: kịch bản và **bảng nguồn** (số nào có nguồn, ngày, link). Chỉ dùng số trong bảng nguồn này.
- `spec.json`: chữ hiện trong video (để bài Zalo khớp video).
- `caption.md`: caption Facebook/TikTok đã viết, để **tránh trùng ý nguyên văn** và giữ cùng mốc số, cùng cách nói "dự kiến/phương án".
Video 08 (`08-cuoi-nam-ve-dich`) chưa đăng: vẫn viết (video sắp có). Bỏ qua `dot-2` và `mau-lai-suat`.

## Yêu cầu bài Zalo
- Khoảng 400–800 ký tự, đoạn ngắn, giọng nhắn tin: xưng "em", gọi "anh chị", ít icon, mở bài bằng ý gây tò mò thật (không nhãn dán), kết bằng **một lời mời cụ thể** (nhắn Zalo để nhận thông tin / đặt lịch xem nhà mẫu / hỏi bảng tính).
- Nguồn gom 1–2 câu cuối (tên báo, ngày). Không thêm số ngoài bảng nguồn.
- Quy tắc cứng: không hứa lợi nhuận/tăng giá, không "sắp hết", không căn CĐT LOCK, không nói giá mà thiếu chưa VAT/có VAT + phí bảo trì 2%, trần lãi 6,9% chỉ PTTT 03 và 04. Hạ tầng tương lai luôn "dự kiến" hoặc "phương án" kèm ngày.
- SĐT chỉ ghi số trong `lienHe`, một lần ở câu mời liên hệ.
- Không đăng, không nhắn khách: chỉ viết bản nháp.

## Kết quả cần có
Thư mục bàn giao `2026-11-10-zalo-tu-kich-ban-video` trên Drive: **một file cho mỗi video, đặt tên `<tên video>.md`** (ví dụ `03-lai-suat-vay-mua-nha.md`), mỗi file theo `agy/mau/zalo.md` (frontmatter `kenh: [zalo]`, phần `## Zalo`) và dòng ghi chú cuối file: nguồn của từng số (id trong bảng nguồn). Claude sẽ lưu thành `video/<tên>/zalo.md`, chạy kiểm quy tắc và đưa anh duyệt.
