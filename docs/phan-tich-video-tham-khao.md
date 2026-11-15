# Phân tích video tham khảo (15/11/2026)

**Trạng thái:** đã phân tích 1/5 video; 4 video còn lại chưa xem được (xem mục 1). Đề xuất mục 4 chờ anh duyệt trước khi sửa code.

Nguồn: Drive `Bcons/tham-khao/video`. Chỉ học **kỹ thuật** (nhịp, cấu trúc, cách dùng chữ); không dùng lại nội dung, tên, hình của họ. Khung hình chỉ xem ở thư mục tạm, không đưa vào repo.

## 1. Xem được gì, chưa xem được gì
| File | Dung lượng | Tình trạng |
|---|---|---|
| `cabf191e…mp4` | 4,6 MB | **Đã xem** (64 s, 576x1024, 30 fps) |
| `green skyline.mp4` | 21 MB | Chưa xem: connector Drive chỉ tải được file dưới 10 MB |
| `2c51aca2…mp4` | 16 MB | Chưa xem (như trên) |
| `9f134aa0…mp4` | 53 MB | Chưa xem (như trên) |
| `810f287c…mp4` | 58 MB | Chưa xem (như trên) |

Cách mở khóa (anh chọn một): (a) anh nén 4 file xuống dưới 10 MB (HandBrake/CapCut xuất 540p, vài phút mỗi file) rồi để vào `tham-khao/video/nho/`; (b) mở host `www.googleapis.com` trong Environment cloud và gắn khóa Drive để em tải file lớn; (c) anh chạy phiên trên máy anh, nơi em đọc thẳng `G:\My Drive\Bcons\tham-khao\video`. Em không có tai: chỉ đo được độ lớn tiếng và khoảng lặng, không nghe được giọng/nhạc.

## 2. Từng video
| Video | Chủ đề | Hook 3 giây đầu | Cấu trúc và nhịp | Chữ trên hình | Cách kết | Hay | Dở (so với quy tắc của mình) |
|---|---|---|---|---|---|---|---|
| `cabf191e…` (64 s, dọc) | Danh sách "20 repo để AI tự dựng video" | Khung đầu **đã có chữ**: "20 repo" hiện ở 0,0 s, "để Opus 5.5" hiện từng từ ở 0,3–0,6 s, dòng phụ "tự dựng video từ A đến Z" ở 0,7 s, gạch nhấn chạy dưới tiêu đề ở 1,0 s. Một con số + một lời hứa, 5 chữ. Góc phải có đếm "00/20" ngay từ giây 0 | 6 chương (nạp skill, thiết kế, hoạt ảnh, dựng 2D, dựng 3D, âm thanh), mỗi chương 8–12 s. Trong chương, **mỗi 2–3 s xuất hiện thêm một mục** (thẻ rơi vào, thanh tiến độ phía dưới nhích, đếm "n/20" tăng). Không cắt cảnh theo kiểu chuyển clip (dò cảnh 0 điểm cắt); nhịp đến từ vật mới xuất hiện đều đặn. Tiêu đề chương đổi mỗi ~10 s | Tiêu đề rất to (1 hàng, 2–3 chữ), một dòng phụ nhỏ, thẻ tên mục chữ trắng trên nền xanh đậm. Chữ chính nằm nửa trên, vùng giữa và dưới để cho mục xếp dần | Chương cuối "Đủ 20/20" gom cả 20 mục vào một khung, rồi "Lưu lại" kèm câu hỏi "Bạn muốn … dựng video gì?", rồi cảnh tên kênh trong ô tìm kiếm TikTok (mời tìm kênh) | Hứa con số cụ thể ngay từ chữ đầu; đếm "n/N" cho người xem biết còn bao lâu; vật mới mỗi 2–3 s chống bỏ đi; cảnh cuối gom lại + câu hỏi mời bình luận; lời hứa "A đến Z" rõ lợi ích | Độ lớn tiếng -15,8 LUFS, lên xuống ít (LRA 3,9 LU), gần như không có khoảng lặng: tiếng nền/giọng đều, chưa rõ nhịp nhạc. Hình: nền tối kẻ lưới, thẻ bo góc, nhãn chữ hoa kiểu mã, đánh số: **đúng những thứ checklist "No AI Slop" của mình cấm**, không sao chép. Video 64 s cho chủ đề liệt kê là dài |
| `green skyline.mp4` | chưa xem | | | | | | |
| `2c51aca2…mp4` | chưa xem | | | | | | |
| `9f134aa0…mp4` | chưa xem | | | | | | |
| `810f287c…mp4` | chưa xem | | | | | | |

## 3. Đối chiếu với kênh mình (số thật)
- Báo cáo 06–12/11: thời gian xem trung bình TikTok **1–4 s** (Facebook 3–9 s) trên video 49–58 s; 0 bình luận; 93–100% người xem TikTok đến từ "Dành cho bạn" (người lạ lướt qua, quyết định trong 1–2 s).
- Đo spec hiện có (9 video): cảnh 1 có **20–42 chữ lời** (trung bình ~30 chữ, khoảng 10 s đọc) trước khi tới con số đầu tiên; mỗi video 4–5 cảnh, mỗi cảnh 20–53 chữ (khoảng 7–17 s). Tức người xem phải nghe hết một câu dài mới biết video nói gì, trong khi họ bỏ đi sau 1–4 s.
- Video tham khảo làm ngược lại: lời hứa + con số hiện trong 1 s, rồi vật mới cứ 2–3 s.
- Giới hạn: tham khảo chỉ 1 video, kênh mình mẫu nhỏ (4 video trong tuần). Đây là giả thuyết để thử, chưa phải kết luận.

## 4. Kỹ thuật → áp dụng cho Bcons
Ký hiệu: **Em** = lõi (quy trình, skill, spec, kiểm); **AGY** = hình; **Anh** = quyết định/nghe thử. Ưu tiên P1 làm ngay, P2 tuần sau, P3 thử.

| # | Kỹ thuật (học từ video `cabf191e…`) | Số kênh chứng minh | Áp dụng thế nào | Ai | Ưu tiên | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | **Khung đầu có chữ ngay từ 0,0 s**, tiêu đề tối đa 6 chữ gồm 1 con số + 1 lời hứa | TikTok xem TB 1–4 s; lưới hồ sơ có 2/13 ô trắng | Thêm vào cổng kiểm cổng 2: "khung 0 có chữ và hình, hook ≤ 6 chữ, có số". Khung đầu cũng là bìa (khớp brief bìa của AGY) | Em (checklist), AGY (hình) | P1 | Đã ghi vào skill và quy trình |
| 2 | **Lời bình cảnh 1 ngắn**: tới con số đầu trong ≤ 12 chữ (~4 s) | Cảnh 1 hiện 20–42 chữ, TB ~30 | Quy tắc viết kịch bản + cổng kiểm `check-spec` cảnh báo khi cảnh 1 dài hơn 14 chữ (đề xuất mục 5) | Em | P1 | Quy tắc đã ghi; cổng kiểm chờ anh OK |
| 3 | **Rút video xuống 25–35 s** (khoảng 70–95 chữ lời) | Video 49–58 s, người xem bỏ đi sau 1–9 s; báo cáo đã đề xuất | Độ dài mục tiêu mới; cảnh mỗi cảnh ≤ 8 s | Em | P1 | Đã ghi vào skill và quy trình |
| 4 | **Vật mới mỗi 2–3 s** thay vì một cảnh đứng 10–17 s | Cảnh hiện 7–17 s mỗi cảnh | Trong storyboard mỗi cảnh ghi "điểm đổi" (số hiện, thẻ vào, vùng sáng) cứ 2–3 s; soát ở cổng 2 | Em (storyboard), AGY (mẫu cảnh nếu cần hiệu ứng mới) | P1 | Đã ghi vào skill; hiệu ứng mới giao AGY |
| 5 | **3 phương án hook** cho mỗi kịch bản (anh chọn) | Chưa biết hook nào giữ chân: cần thử | Cổng 1/2: em đưa 3 hook (con số / câu hỏi / kết quả), anh chọn; ghi lại hook đã dùng + số xem TB vào báo cáo tuần để học | Em, Anh | P1 | Đã ghi vào skill |
| 6 | **Câu hỏi một con số ở cuối** thay "comment …", gom lại ý chính ở khung cuối | 0 bình luận / 4 video | Cảnh cuối có 1 câu hỏi đơn giản trả lời bằng một số hoặc một chữ (vd. "Vốn của anh chị đang là bao nhiêu?"), kèm QR đã có | Em (lời), Anh (duyệt) | P2 | Đã ghi vào skill |
| 7 | **Bộ đếm tiến độ "n/N" và thanh chạy** cho video dạng danh sách (vd. "5 phương thức thanh toán", "3 công trình về đích") | Chưa đo; giả thuyết: biết còn bao lâu thì xem hết | Chỉ dùng khi nội dung thật sự là trình tự/danh sách (giữ quy tắc "không đánh số khi không phải trình tự") | AGY dựng mẫu; Em thêm trường dữ liệu | P2 | Giao AGY: `agy/giao-viec/2026-11-15-hook-va-nhip-video.md` |
| 8 | **Chữ hiện từng từ + gạch nhấn chạy** ở 1 s đầu | Chưa đo | Hoạt họa chữ mở đầu của hook | AGY | P2 | Giao AGY |
| 9 | **Cảnh cuối mời theo dõi bằng hình tìm kênh** | 0 người theo dõi mới trong tuần | Thử ở 1–2 video; hiện đã có QR góc + tên và QR cảnh cuối nên chỉ thêm khi anh muốn | Anh quyết, AGY dựng | P3 | Chờ anh |
| 10 | Đo độ lớn tiếng (~-16 LUFS, ít dao động) làm chuẩn so | Chưa có số loudness của video mình | Em đo bản render hiện có rồi so; không đổi cài đặt giọng | Em | P3 | Chưa làm |

## 5. Đề xuất sửa code (chờ anh "OK", chưa làm)
Thêm vào `engine/remotion/scripts/check-spec.mjs` (theo TDD, test dùng spec thật của 9 video):
1. **Cảnh báo** (không chặn) khi cảnh 1 có hơn 14 chữ lời trước con số đầu tiên, hoặc tổng lời hơn 100 chữ, hoặc một cảnh hơn 8 s ước tính.
2. Trường mới tùy chọn `hook` trong spec (dòng tiêu đề ≤ 6 chữ + `soHook` đã chọn trong 3 phương án): cổng kiểm đòi có khi `status: approved` cho video mới (video cũ miễn).
3. Cần chụp khung trước/sau (`frame-hashes.mjs`) để chắc 9 video cũ không đổi; không đụng cài đặt giọng, 30 fps, 1080x1920.
Cảnh báo vì 9 video cũ đều vượt ngưỡng; chặn cứng sẽ làm `npm run lint` hỏng ngay.
