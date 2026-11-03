# NOTES.md — Nhật ký và việc cần làm

Cập nhật lần cuối: 03/11/2026

## Đã làm
- [x] Đọc tài liệu Drive: training kick-off, Q&A, PTTT 01–05, danh sách thư mục.
- [x] Tổng hợp dữ liệu dự án vào `docs/bcons-central-park.md` (dự án, 5 PTTT, lịch mở bán, chi phí, tóm tắt bảng giá).
- [x] Tách bảng giá 996 căn từ Master File ra `data/bang-gia.csv` (cục bộ, không lên git).
- [x] Tạo `CLAUDE.md` và `NOTES.md`.
- [x] Video Remotion dọc 1080x1920 30fps trong `remotion-video/` (4 cảnh: Đồng Nai, hạ tầng, KTM tự do Long Thành, Bcons Central Park). Đã render `out/bcons-central-park.mp4` (20 giây, không tiếng) và `out/bcons-central-park-elevenlabs.mp4` (khoảng 44 giây, có giọng đọc + phụ đề từng từ). File mp4 không lên git.
- [x] Giọng đọc ElevenLabs (`eleven_v4`, voice `9CCqsrTCLkHgQlKSMchK`): script `scripts/generate-voice.mjs`, lời đọc/phụ đề tách riêng trong `scripts/scenes.mjs`, âm thanh trong `public/audio/`, timestamp trong `src/audio-timestamps.json`. Key trong `remotion-video/.env` (gitignored).
- [x] Thư mục Drive riêng tư "Bcons - Dong bo thiet bi" (id `1yzMS8oTXBiBv4RvgIUScsj_XxYkZiWux`) có `video/`, `data/` và file hướng dẫn cài máy thứ hai.
- [x] Thêm lệnh "Off" vào `CLAUDE.md`.
- [x] Cảnh 2 (kết nối hạ tầng) thay bản đồ vector bằng bản đồ vệ tinh Mapbox GL JS trong `remotion-video/src/MapScene.tsx`: camera bay 3D (toàn cảnh Đồng Nai, zoom Bcons Central Park, quét sang sân bay Long Thành rồi cảng Phước An) bằng `useCurrentFrame()` + `interpolate()`, đường cao tốc Bến Lức - Long Thành (GeoJSON LineString) sáng dần kèm nét đứt chạy, 3 ghim nảy bằng `spring`. Đã xem ảnh khung 470/555/610 (bản MapLibre/Esri trong phiên cloud). Chưa render cả video bản Mapbox.

## Đang làm
- [ ] Render cả video có cảnh bản đồ Mapbox trên máy anh (`E:\Claude\bcons-repo\remotion-video`, `npx remotion render BconsCentralPark out/bcons-central-park-map.mp4 --gl=angle --concurrency=1`). Lần chạy trước Mapbox trả 429 khi render; đã giảm request song song xuống 3 (commit `ff3a8af`), anh báo "ổn rồi" nhưng em chưa thấy ảnh kết quả. Duyệt video trước khi đăng.
- [ ] Giọng cảnh 2 bị lệch giọng (nghe như miền Bắc, giọng gốc là `vi-southern`, giọng nhân bản). Đã tạo 4 bản thử trong `remotion-video/audio-test/` (không lên git), chờ anh nghe và chọn; sau đó tạo lại 4 cảnh, render lại, commit. Bản đã commit vẫn là giọng cũ.
- [ ] Kiểm tra cách đọc FDI ("F D I") và Bcons Central Park ("Bee Cons Central Park") sau khi tạo lại giọng; em chưa nghe được.
- [ ] Kịch bản video đợt 2 (giới thiệu ngày 29/11/2026) trong `docs/video/dot-2.md`. Bản nháp, chờ anh duyệt.

## Chưa làm
- [ ] Tin nhắn tự động hàng loạt: chọn kênh, làm bộ mẫu tin, tool gửi từ file danh sách.
- [ ] Dựng video thật (cần ảnh/render/video gốc, công cụ AI hoặc CapCut).

- [ ] Đối chiếu toạ độ 3 ghim (anh gửi: Bcons 10.9599, 106.8441; sân bay Long Thành 10.7735, 107.0420; cảng Phước An 10.6164, 106.9942). Tuyến cao tốc là đường mô phỏng, không phải tim đường thật.
- [ ] Kiểm tra điều khoản dùng ảnh vệ tinh Mapbox/Maxar trong video quảng cáo; tạo token Mapbox mới (token cũ đã lộ trong ảnh chụp màn hình).

## Tư liệu hình/video trong Drive (đã liệt kê, em chưa xem được nội dung)
- Flycam (thư mục `1_FOLJkPOh657pT8_L71i456LzCfVv8on`): `1.mp4` (27MB), `2.mp4` (49MB), `3.mp4` (39MB); thư mục `Final` có `Tổng 1 + 2.mov` (70MB) và `Video 1.mp4` (30MB).
- TVC: `TVC Bcons Central Park.mp4` (570MB) trong 12. TVC/VIDEO > 1. TVC.
- Mẫu căn hộ A: `Hộp đơn A1.jpg`, `Hộp đơn A2.jpg` (~10MB mỗi ảnh). Thư mục mẫu C và D chưa liệt kê.
- 4. PHỐI CẢNH (ẢNH NÉN, ẢNH GỐC) và 9. NHÀ MẪU > Nhà mẫu căn A1: em liệt kê thấy trống hoặc chưa có quyền xem file bên trong; cần kiểm tra quyền chia sẻ.
- Em không xem video trực tiếp qua connector Drive. Video anh upload vào phiên thì em trích khung hình để xem được: đã xem 4 clip flycam (1, 5, 10, 9), mô tả trong `docs/video/flycam.md`.

- Phối cảnh 3D, render nhà mẫu và ảnh nhà mẫu thật đã có trên Drive (ẢNH GỐC có file `202605_BPTH_ST38/ST39...jpg` 40–50MB; nhà mẫu A1: PHONGKHACH01/02, PNMT01/03, PHONGNGU2-03; nội thất C1). Connector Drive không cho em xem nội dung ảnh, cần anh đính kèm trực tiếp vào phiên.
- Clip flycam 1 đã vẽ ranh giới (file video nằm trong phiên, không đưa lên git).

## Câu hỏi còn mở (cần anh trả lời)
1. **Quy định nội dung quảng cáo** của công ty: điều không được nói, cách xưng hô, cụm từ bắt buộc, disclaimer pháp lý.
2. **Kênh nhắn hàng loạt**: Zalo OA/ZNS, SMS brandname hay email? Ngân sách?
3. **Danh sách khách** sẽ nhắn: nhóm nào, ai đã đồng ý nhận tin? (Sheet KhachHang có khoảng 300 dòng, đa số "không quan tâm" hoặc đã có sale khác chăm.)
4. **PTTT 03**: thông báo không ghi rõ mức chiết khấu. Cần xác nhận.
5. **PTTT 01 và 03**: em đọc bản trên Drive, chưa đối chiếu với bản anh gửi lại từng chữ.
6. Đợt 2 mở những căn nào (236 căn đang CĐT lock có phải là căn mở ở đợt 2 không)? Ảnh hưởng đến việc nhắn "còn bao nhiêu căn".
7. Phối cảnh, ảnh nhà mẫu và TVC (`TVC Bcons Central Park.mp4`, 570MB) có được dùng để cắt video ngắn không?

## Ghi chú kỹ thuật
- Master File có sheet nội bộ (KhachHang, HoaHong). Chỉ đọc cục bộ, không đưa lên git.
- Giá PTTT 04/05 trong Master File là tự tính (giá PTTT 02 × 0,9755), chủ đầu tư chưa ra bảng giá riêng.
- Ngày bàn giao trong file là giả định 30/06/2029 (chủ đầu tư chỉ ghi "dự kiến Quý II/2029").
- Số liệu tình trạng căn là ảnh chụp tại thời điểm nhận file (ngày 30/10/2026); cần cập nhật trước khi quảng cáo.

## Đồng bộ nhiều thiết bị
- Code, docs, kịch bản, mp3: GitHub (nhánh `claude/trusting-feynman-1b00ns`).
- Dữ liệu nội bộ (`data/`, xlsx) và video render (`.mp4`): thư mục Drive riêng tư "Bcons - Dong bo thiet bi" (id `1yzMS8oTXBiBv4RvgIUScsj_XxYkZiWux`), kèm file `HUONG-DAN-CAI-MAY-THU-HAI.md`.
- API key ElevenLabs: chỉ trong `remotion-video/.env` trên từng máy, không đưa lên git/Drive.
- Chưa làm: tải `.mp4` và `data/` lên thư mục Drive (anh kéo thả hoặc dùng Drive for desktop). Thư mục `data/` không có trên máy dùng phiên này.
- Video Remotion: số liệu (2,4 tỷ USD FDI, 8.200 ha, 16 tỷ USD, 150.000, 50.000, cao tốc khai thác 01/10/2026) lấy từ yêu cầu của anh, chưa đối chiếu tài liệu chủ đầu tư. Duyệt trước khi đăng.
- Bản đồ cảnh 2: vệ tinh Mapbox (`satellite-v9`), token ở biến `REMOTION_MAPBOX_TOKEN` trong `remotion-video/.env` (gitignored; nằm trong env cloud thì chỉ phiên mới nhận). Tuyến cao tốc mô phỏng, giữ dòng "mô phỏng, không đúng tỷ lệ".
- Render cảnh bản đồ trong phiên cloud: Chromium không dùng proxy mặc định, phải bọc Chromium ép `--proxy-server`, bỏ `--no-proxy-server`, dùng `--gl=swangle` (không có GPU). Mapbox trả 429 khi trình duyệt headless xin tile dồn dập; đã đặt `mapboxgl.config.MAX_PARALLEL_IMAGE_REQUESTS = 3`. Thử Esri qua mapbox-gl bị màn hình đen; bản MapLibre + Esri chạy được nằm ở commit `e63ebbd`.
- Key ElevenLabs hiện không có quyền `Models`; đã bật `Models` Access nên liệt kê model được. Model trong tài khoản hỗ trợ tiếng Việt: `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_turbo_v2_5`, `eleven_flash_v2_5`.
- Nhận lệnh "Off" để tự cập nhật notes, commit, push (xem `CLAUDE.md`).
