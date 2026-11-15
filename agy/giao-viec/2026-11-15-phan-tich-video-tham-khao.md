# Giao việc AGY: tách khung hình và phân tích video tham khảo (15/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-15-phan-tich-video-tham-khao.md`, rồi làm theo."

## Vì sao
Claude chạy trên cloud, không đọc được `E:\Claude\video-tham-khao` và connector Drive chỉ tải được file dưới 10 MB. Claude mới phân tích được 1 video (kết quả ở `docs/phan-tich-video-tham-khao.md`, đọc trước để biết khung phân tích và cách ghi). Còn lại là việc của AGY: xem trực tiếp từng video, tách khung hình, ghi kỹ thuật học được cho video Bcons.

## Việc cần làm
Với **mỗi video** trong `E:\Claude\video-tham-khao` (khoảng 5 file mp4, kể cả `green skyline.mp4`; nếu anh bỏ thêm file mới thì làm luôn):
1. Ghi thông số: thời lượng, tỉ lệ khung, fps.
2. **Tách khung hình** (ffmpeg hoặc công cụ AGY có): dày ở 3 giây đầu (4 khung mỗi giây), sau đó 1 khung mỗi giây. Ghép thành lưới theo từng đoạn để xem.
3. Ghi theo từng video (dùng đúng các cột của bảng mục 2 `docs/phan-tich-video-tham-khao.md`): chủ đề; **hook 3 giây đầu** (hình, chữ, âm thanh, khung 0 có gì); cấu trúc và nhịp (mấy cảnh, mỗi cảnh bao lâu, cắt hay chuyển cảnh thế nào, **mỗi bao nhiêu giây có thứ mới trên hình**); cách dùng chữ (cỡ, vị trí, phụ đề, nhấn chữ); loại hình (bản đồ, phối cảnh, flycam, đồ họa, người); âm thanh nếu nghe được (giọng, nhạc, hiệu ứng, chỗ nhạc đổi nhịp); cách kết (CTA, câu hỏi, QR); điểm hay; điểm dở.
4. Cuối cùng: **5–8 kỹ thuật dùng lại được cho video Bcons** (mỗi kỹ thuật: học từ video nào, giây nào, vì sao hợp với Bcons). Chuyện nào là hình đẹp thì ghi là đề xuất thiết kế, chuyện nào là cấu trúc/lời thì ghi để Claude đưa vào quy trình.

## Ràng buộc
- **Chỉ học kỹ thuật** (nhịp, cấu trúc, cách dùng chữ/hình). Không sao chép nội dung, tên thương hiệu, số liệu, hình của họ vào sản phẩm của mình.
- **Không đưa khung hình hoặc video của người khác vào repo.** Khung hình để ở Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-phan-tich-video-tham-khao/khung/`; trong báo cáo chỉ mô tả bằng chữ và nêu số giây.
- Khi đề xuất, giữ quy tắc cứng và "No AI Slop" của `CLAUDE.md`: không nền kẻ lưới, thẻ bo góc viền sáng, nhãn chữ hoa giãn chữ, đánh số khi không phải trình tự; không hứa lợi nhuận, không "sắp hết", không SĐT chữ.
- Không sửa file trong repo (chỉ đọc). Không đăng, không chép đè Drive của người khác.

## Mục tiêu của kênh (để chọn kỹ thuật đáng học)
Báo cáo tuần 06–12/11/2026: người xem TikTok bỏ đi sau 1–4 giây trên video 49–58 giây, 0 bình luận, 0 người theo dõi mới. Video của mình hiện mở bằng lời bình dài 20–42 chữ trước khi tới con số đầu tiên. Ưu tiên kỹ thuật nào **giữ chân 3 giây đầu** và **kéo bình luận**.

## Trả kết quả
Drive `Bcons/agy/den-claude/<yyyy-mm-dd>-phan-tich-video-tham-khao/`: `phan-tich.md` (bảng từng video + 5–8 kỹ thuật), thư mục `khung/` (lưới khung từng video), `ket-qua.md` ngắn (video nào xem được, nghe được âm thanh hay không, chỗ nào chưa chắc).

## Sau đó
Anh gọi `/agy-doc`; Claude kiểm, ghép vào `docs/phan-tich-video-tham-khao.md`, cập nhật checklist hook trong quy trình/skill và, nếu anh duyệt, thêm cổng kiểm vào `check-spec`.
