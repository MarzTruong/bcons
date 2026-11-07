> **Trạng thái:** Đang làm. Xong: D (nhạc nền, hiệu ứng), E (tên + QR, landing Gọi/Zalo). G (`/gemini`, 07/11), B (phụ đề: ký hiệu %, cỡ chữ vừa 2 dòng, nhấn số/chữ `nhan`, `npm run phu-de`, 07/11). A (storyboard có hình: `npm run storyboard`, bot `/storyboard`, thời lượng ước tính, cổng 2 gồm hình, 07/11). Chưa: C (viền bản đồ), F (test Master File theo PDF PTTT của CĐT).

# Kế hoạch 05: Video có nhạc nền, hiệu ứng, phụ đề chuẩn, storyboard có hình, watermark

> Anh yêu cầu 06/11/2026 tối ("OK, làm cả hai luôn đi" + các ý bổ sung). Chờ anh duyệt kế hoạch này rồi làm. Viết test trước (skill `test-driven-development`), mỗi phần một commit.

## A. Quy trình mới: duyệt hình trước khi tốn credit giọng
| Cổng | Việc | Anh duyệt |
|---|---|---|
| 1 | Số liệu có nguồn, góc làm | góc + số |
| 2 | Kịch bản, caption, **storyboard có hình** (2–3 khung thật mỗi cảnh) | chữ, số, hình |
| 3 | Giọng ElevenLabs (tốn credit) | nghe giọng |
| 4 | Render đủ (nhạc + hiệu ứng), chép Drive | xem video, `/duyet` |

- `timing`: khi chưa có `timestamps.json`, ước tính thời lượng từ lời đọc (số âm tiết × khoảng 0,22 giây + nghỉ ở dấu câu). Có giọng thật thì tự khớp lại, hình không đổi.
- `scripts/storyboard.mjs <tên>`: chụp khung đầu / giữa / cuối mỗi cảnh, ghép thành ảnh dọc theo cảnh, viết `storyboard.md` (lời đọc, chuyển động, ảnh). Cảnh không bản đồ: em chụp trên cloud. Cảnh bản đồ cần Mapbox: lệnh bot **`/storyboard <tên>`** chụp trên PC và gửi ảnh về Telegram (không tốn credit).
- Sửa skill `bcons-video`, `docs/quy-trinh-video.md`, `docs/huong-dan-bot-telegram.md`.

## B. Phụ đề
1. **Ký hiệu hiển thị đúng**: viết `90%{chín mươi phần trăm}` thay vì `90{chín mươi} phần trăm`. Cổng kiểm (`check:spec`) chặn chữ hiển thị có "phần trăm", "đô la", "mét vuông", "héc-ta"... (phải là `%`, `USD`, `m²`, `ha`). Lệnh `npm run phu-de -- <tên>` cập nhật chữ hiển thị trong `timestamps.json` khi lời đọc không đổi, **không tạo lại giọng, không tốn credit**. Sửa spec các video đã có.
2. **Cỡ chữ vừa khung**: chia cụm theo độ dài ký tự (tối đa 2 dòng), không theo số từ; cụm dài tự giảm cỡ chữ (từ 76 xuống tối thiểu khoảng 56); không cắt ngang số và đơn vị ("21,5 ha" luôn đi liền).
3. **Nhấn chữ quan trọng**: spec thêm `emphasis` (danh sách chữ cần nhấn); số và chữ nhấn có lớp nền màu quét ngang, bật to nhẹ, viền sáng. Áp dụng cả tiêu đề cảnh (chữ hiện từng lớp).

## C. Ranh giới bản đồ
Vùng `official` mặc định: viền **vẽ dần theo chu vi** (không hiện sẵn), sau đó một **vệt sáng chạy vòng quanh ranh** lặp lại trong lúc nói về vùng đó. Áp dụng cho **các video bản đồ làm từ nay** (giây 0–2 video `tai-thiet-kcn-bien-hoa-1` chỉ là ví dụ anh đưa, không sửa video đó). Vùng minh họa giữ nét đứt.

## D. Nhạc nền + hiệu ứng âm thanh — đã làm 06/11/2026 (`src/amThanh.ts`, `scripts/am-thanh.mjs`, `scripts/tao-sfx.mjs`, bot `/sfx`, `/render <tên> khongnhac`). Nhạc ở `<repo>/am-thanh/nhac/` (không lên git), tự chọn theo tên video hoặc `spec.nhac`.
- Spec thêm `audio.music` (tên file) và `audio.musicVolume`. Nhạc nhỏ dưới giọng (khoảng 12%), tự hạ khi có lời, lên nhẹ ở khoảng lặng, mở/kết nhỏ dần.
- Nhạc: anh tải 3–5 bản từ Pixabay Music (giấy phép cho dùng thương mại) vào `am-thanh/nhac/` trên máy (không lên git, đồng bộ qua Drive như `anh/`).
- Hiệu ứng: "vút" khi chuyển cảnh, "tách" khi số hiện, tiếng dồn trước cảnh kết; tạo một lần (ElevenLabs Sound Effects, tốn ít credit, hỏi trước) và lưu trong repo để dùng lại.
- Render ra 2 bản: có nhạc (đăng tự động) và không nhạc (`-khong-nhac.mp4`, khi anh muốn chọn nhạc xu hướng trên TikTok).

## E. Chống lấy cắp clip (watermark) — anh chốt 06/11/2026 tối, đã làm
Tên **Tuấn Trương** (font Playfair Display nghiêng, khác font nội dung) + **mã QR** nhỏ góc dưới phải suốt video; cảnh cuối thu nhỏ thẻ dự án, thêm khối tên + QR ở giữa (góc ẩn đi). QR mở `HTTPS://BCONS-CENTRAL-PARK-DSJ.PAGES.DEV/QR` (viết hoa cho mã thưa, quét được khi nhỏ; kiểm giải mã ở 1080p và 720p) → `/?utm_source=qr`. Landing có thanh Gọi/Zalo. Cấu hình `project.json` → `watermark`, `lienHe`; `render:drive` tự gắn khi spec không khai báo. Quy tắc 7 trong CLAUDE.md đã sửa theo.

## F. Kiểm Master File bằng tài liệu CĐT (TDD)
Test hiện tại so công cụ tính với Master File (cả hai cùng do AI làm). Thêm test lấy **tài liệu CĐT làm chuẩn**: lịch thanh toán từng PTTT cộng đủ 100%, chiết khấu 8,5% (PTTT 01), 2,45% (PTTT 04/05), VAT 10%, bảo trì 2%, trần 6,9% chỉ PTTT 03/04; đối chiếu khoảng 20 căn mẫu giữa bảng giá CĐT 17/10/2026 và sheet GiaTongHop. Anh đã để file trong Drive `Bcons - Dong bo thiet bi\data` (06/11/2026); dữ liệu chỉ để trên máy, test đọc từ `data/` (không lên git).

## G. Lệnh `/gemini <chủ đề>` (nghiên cứu tự động, anh chọn gói trả phí 07/11/2026)
Bot trên máy anh gửi `docs/prompt-gemini-nghien-cuu.md` + chủ đề cho Gemini (có tìm Google), lưu `du-an/<mã>/nguon/gemini/<ngày>-<chủ-đề>.md` kèm link nguồn, gửi tóm tắt về Telegram, lưu lên GitHub. Key `GEMINI_API_KEY` trong `.env` (không lên git). Em vẫn mở từng link kiểm số ở cổng 1.

## Thứ tự và kiểm tra
B1 → A → B2/B3 → C → D → E → F. Mỗi bước: test trước, `npm test`, `npm run lint`, chụp khung trước/sau. Video cũ sẽ đổi hình có chủ đích (phụ đề, viền, watermark), nên băm khung hình cập nhật theo.

## Cần anh trả lời trước khi làm
2. Hiệu ứng âm thanh: tạo bằng ElevenLabs (tốn ít credit) hay tải miễn phí trên Pixabay?
3. Nhạc: anh tải 3–5 bản Pixabay (gợi ý tìm: "corporate inspiring", "ambient piano", "real estate").
