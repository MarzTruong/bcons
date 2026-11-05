# NOTES.md — Nhật ký và việc cần làm

Cập nhật lần cuối: 05/11/2026 (phiên Off cuối ngày)

## Đã làm
- [x] Đọc tài liệu Drive: training kick-off, Q&A, PTTT 01–05, danh sách thư mục.
- [x] Tổng hợp dữ liệu dự án vào `docs/bcons-central-park.md` (dự án, 5 PTTT, lịch mở bán, chi phí, tóm tắt bảng giá).
- [x] Tách bảng giá 996 căn từ Master File ra `data/bang-gia.csv` (cục bộ, không lên git).
- [x] Tạo `CLAUDE.md` và `NOTES.md`.
- [x] Video Remotion dọc 1080x1920 30fps trong `remotion-video/` (4 cảnh: Đồng Nai, hạ tầng, KTM tự do Long Thành, Bcons Central Park). Đã render `out/bcons-central-park.mp4` (20 giây, không tiếng) và `out/bcons-central-park-elevenlabs.mp4` (khoảng 44 giây, có giọng đọc + phụ đề từng từ). File mp4 không lên git.
- [x] Giọng đọc ElevenLabs (`eleven_v4`, voice `9CCqsrTCLkHgQlKSMchK`): script `scripts/generate-voice.mjs <tên>`, lời đọc/phụ đề nằm trong `markup` của spec `specs/<tên>.json`, âm thanh trong `public/audio/<tên>/`, timestamp trong `specs/<tên>.timestamps.json`. Key trong `remotion-video/.env` (gitignored).
- [x] Thư mục Drive riêng tư "Bcons - Dong bo thiet bi" (id `1yzMS8oTXBiBv4RvgIUScsj_XxYkZiWux`) có `video/`, `data/` và file hướng dẫn cài máy thứ hai.
- [x] Thêm lệnh "Off" vào `CLAUDE.md`.
- [x] Quy trình render mới: `npm run render:drive -- <tên>` (trong `remotion-video/`) render xong tự chép mp4 sang Drive for desktop, đã chạy thử thành công (12,5 MB, `bcons-central-park-elevenlabs.mp4`). Script `scripts/render-drive.mjs`.

- [x] 04/11/2026: refactor video thành spec + mẫu cảnh có schema (`remotion-video/src/spec.ts`, `src/templates/`), thêm mẫu `compare-bars`, cổng chặn nguồn/`approved` (`scripts/spec-tools.mjs`, `npm test`, `npm run lint`), lệnh `/bcons-video` (`.claude/commands/bcons-video.md`), prompt Gemini (`docs/prompt-gemini-nghien-cuu.md`). Video đầu tiên là spec `dong-nai-ha-tang` (render khung hình giống hệt bản cũ). Thiết kế: `docs/superpowers/specs/2026-11-04-bcons-video-pipeline-design.md`, kế hoạch: `docs/superpowers/plans/2026-11-04-bcons-video-pipeline.md`.
- [x] Bỏ edge-tts (anh quyết định).
- [x] 04/11/2026: mẫu cảnh bản đồ `geo-map` dùng Mapbox GL (token `MAPBOX_TOKEN_KEY` trong `remotion-video/.env`, kiểm bằng `npm run check:mapbox`). Spec `dong-nai-ha-tang-map` (cảnh 2 là bản đồ, lời bình/giọng y hệt bản cũ, dùng lại mp3). Tọa độ Bcons Central Park, sân bay Long Thành, Cảng Phước An do anh cung cấp; Bến Lức lấy từ Mapbox Geocoding (gần đúng). Dữ liệu: `docs/video/geo-nguon.md`, `remotion-video/public/geo/`, tạo bằng `scripts/build-geo.mjs`. Link nguồn Facebook của video cũ đã ghi vào `docs/video/dong-nai-ha-tang.md`.

- [x] 04/11/2026: video `lai-suat-vay-mua-nha-2026` (góc lãi suất, spec `approved`) đã tạo giọng và render xong. Anh chỉnh: tên riêng tiếng Anh đọc đúng tiếng Anh, `BIDV{bee eye dee vee}`. Em chưa nghe lại cách đọc BIDV sau khi sửa.
- [x] 04/11/2026: video `ha-tang-bien-hoa-2026` (kịch bản từ skill real-estate-content-creator, `docs/content/2026-11-04-ha-tang-bien-hoa-da-chay-vs-tren-giay.md`, spec `approved`): cảnh 1 bản đồ Mapbox, cảnh 2-3 thẻ số liệu, cảnh 4 thông tin dự án. Đã tạo giọng (anh nghe được), đã render `out/ha-tang-bien-hoa-2026.mp4` (19 MB, khoảng 55 giây) và chép lên Drive `video/`. Chờ anh xem và duyệt trước khi đăng; em chưa xem trọn video.
- [x] 04/11/2026: hệ phong cách và chuyển động cho spec: `style` (classic, sang, navy, xanh) trong `src/theme.ts`, `motion` (classic, truot, nay, mo) trong `src/motion.ts`, khai báo trong spec (hạ tầng Biên Hòa dùng `xanh` + `mo`). Test hồi quy: băm khung hình `dong-nai-ha-tang` vẫn giống hệt; 48 test qua.
- [x] 04/11/2026: kiểm tra báo cáo Gemini, sửa các khẳng định bị thổi phồng (13-15% là lãi suất thực sau ưu đãi, không nêu diện tích FTZ vì 8.100/8.200 ha mâu thuẫn, Biên Hòa - Vũng Tàu giai đoạn 1 chỉ "dự kiến", bỏ Vành đai 3 Tây Ninh 95%). PTTT 03 xác nhận bản mới nhất; PTTT 05 giống PTTT 02 (CĐT hỗ trợ ân hạn lãi gốc, không nêu thời hạn).

- [x] 05/11/2026: 2 video từ kịch bản Gemini số 2 và 4: `cho-thue-kcn-bien-hoa-2026` (A, màu sang/chuyển động truot) và `tai-thiet-kcn-bien-hoa-1` (B, navy/nay). Spec `approved`, đã tạo giọng (anh nghe được), đã render đủ bản bản đồ vệ tinh (A 58,9 giây, B 56,8 giây) và chép Drive `video/`. Chờ anh xem trọn video và duyệt trước khi đăng; em chưa xem trọn video, chỉ xem khung thử.
- [x] Quy ước anh đặt 05/11/2026 (đã lưu memory): giọng miền Nam voice `9CCqsrTCLkHgQlKSMchK`, đọc "ngàn" không "nghìn", tên riêng tiếng Anh đọc tiếng Anh (BIDV{bee eye dee vee}); lời đọc thiên tầm nhìn quảng bá (chú thích nhỏ để ở chữ trên màn hình và bảng nguồn, vẫn không hứa tăng giá/lợi nhuận); video có bản đồ/camera/ảnh phải có storyboard theo giây để anh duyệt trước khi code và render (`docs/video/<tên>-storyboard.md`, đã thêm vào `/bcons-video` cổng 4 và `docs/quy-trinh-video.md`); video thành phẩm ra `remotion-video/out/video/`, file tạm ra `out/tam/`.
- [x] 05/11/2026: mẫu `geo-map` nâng cấp: nền vệ tinh Mapbox (`satellite-streets-v12`), camera nhiều chặng theo lời đọc (center/zoom hoặc `fit` tự tính vừa vùng, toán trong `src/geoCamera.ts`), ranh tự vẽ, làm tối vùng ngoài, nhấp sáng, thẻ số nổi neo vào vùng, thẻ số liệu phía trên bản đồ (vùng y 1500-1650 dành cho phụ đề), nhãn km trên đường nối, ảnh chèn cross-fade, chữ gõ dần. `project-close` có thêm ảnh phối cảnh. Cổng kiểm tra chặn dữ liệu `provisional` và ảnh tên `placeholder`.
- [x] 05/11/2026: ranh KCN lấy từ OpenStreetMap: anh xuất GeoJSON từ Overpass Turbo vào `map/`; script `npm run geo:fetch` (trong `remotion-video/`) đọc `map/` hoặc gọi Overpass, lưu `public/geo/osm/` (cờ `--refresh`, `--remote`, `--search "tên" --bbox ...`); `npm run geo:derive` tạo lớp minh họa (phân vùng KCN Biên Hòa 1 hình tròn cắt theo tỉ lệ diện tích tin báo; đường chim bay kèm km từ dự án) vào `public/geo/minh-hoa/`. Anh chạy thử `--remote` trên máy anh: Overpass lấy được Loteco và Amata, 3 khu còn lại quá giờ (mirror công cộng không ổn định). Diện tích đa giác OSM: Loteco 99,9 ha, Biên Hòa II 401,9, Amata 416,9 (chưa gộp phần mở rộng 185,9), Biên Hòa 1 298,1, khu đất dự án 2,9 ha.
- [x] 05/11/2026: ảnh phối cảnh anh chép vào `anh/ẢNH GỐC` (22 ảnh, khoảng 2 GB, đã thêm `anh/` vào `.gitignore`); dùng 2 ảnh thu nhỏ 2400 px trong `remotion-video/public/images/`: `phoi-canh-green-park.jpg` (video A) và `phoi-canh-tong-the.jpg` (video B).

## Đang làm
- [x] (đã xong 05/11: đã tạo lại giọng 2 video mới, anh nghe được) Giọng cảnh 2 bị lệch giọng cũ (nghe như miền Bắc, giọng gốc là `vi-southern`, giọng nhân bản). Đã tạo 4 bản thử trong `remotion-video/audio-test/` (không lên git), chờ anh nghe và chọn; sau đó tạo lại 4 cảnh, render lại, commit. Bản đã commit vẫn là giọng cũ.
- [ ] Kiểm tra cách đọc FDI ("F D I") và Bcons Central Park ("Bee Cons Central Park") sau khi tạo lại giọng; em chưa nghe được.
- [ ] Kịch bản video đợt 2 (giới thiệu ngày 29/11/2026) trong `docs/video/dot-2.md`. Bản nháp, chờ anh duyệt.

- [x] Superpowers: đã chép 5 skill vào `.claude/skills/` (commit gốc `bb92a77`), chưa commit; mở phiên mới để dùng. ECC: anh quyết định không cài (04/11/2026). `/plugin` không chạy trong PowerShell/app.
- [x] Quyết định 04/11/2026: bỏ CTA đọc/hiện số điện thoại; cuối video chỉ chạy thông tin dự án. Nếu sau này muốn dùng số, cần xác nhận quy định TikTok/Meta và công ty (hotline công ty an toàn hơn).
- [ ] Anh duyệt `docs/quy-trinh-video.md`. Hai file prompt cũ vẫn untracked (có chứa SĐT cá nhân), chưa commit.

- [ ] Anh xem trọn 2 video mới (`cho-thue-kcn-bien-hoa-2026`, `tai-thiet-kcn-bien-hoa-1`) trước khi đăng. Lưu ý cho video B: Aeon Mall đang là **điểm tạm anh chọn** (10.927817, 106.835207), ghi "gần đúng"; vùng 21,5 / 44 / 286 / 51,6 ha là hình tròn minh họa (nét đứt), không phải ranh thật. Ranh OSM lệch số chính thức (Amata -19%, Biên Hòa 1 -11%) và chưa đối chiếu hồ sơ chủ đầu tư.
- [ ] Cần tọa độ/ranh thật của Aeon Mall và, nếu có, ranh quy hoạch thật của các vùng 44/286/21,5/51,6 ha (GeoJSON/KMZ). Có thì sửa `scripts/build-geo.mjs` và bỏ `geo:derive` cho các vùng đó.
- [ ] Thử thêm cơ chế tự thử lại 2-3 lần cho mỗi khu trong `geo-fetch.mjs` (Overpass hay quá giờ). Gắn nhãn km đã có; chưa kiểm cách đọc BIDV, FDI sau khi tạo lại giọng (anh đã nghe được giọng).

## Chưa làm
- [ ] Anh xem và duyệt 2 video `lai-suat-vay-mua-nha-2026` và `ha-tang-bien-hoa-2026` trước khi đăng (em không đăng). Nguồn: báo cáo Gemini `Gemini Deep Research/ket_qua_nghien_cuu_bds_dong_nai_bien_hoa.md`.
- [ ] Xác nhận cao tốc Biên Hòa - Vũng Tàu giai đoạn 1 đã thông xe 18/05/2026 chưa; khoảng cách từ 236 Phan Trung tới các tuyến chưa đo; Dat Xanh/PropertyGuru chỉ dựa một bài VnExpress.
- [ ] Việc nhỏ hoãn lại: tên file xuất của render-drive chưa kiểm tra (shell:true), CompareBars lỗi NaN khi mọi giá trị bằng 0, key React có thể trùng, chưa có watermark DRAFT, chưa có kiểm tra số điện thoại bằng regex, `.env` nạp trước cổng trong render-drive. `package.json` engines `^20.19` nhưng cần Node >= 22.18 (type stripping khi test).
- [ ] Hình tuyến cao tốc Bến Lức - Long Thành thật và ranh giới Biên Hòa / khu thương mại tự do Long Thành: máy chủ OpenStreetMap không trả dữ liệu ngày 04/11, Mapbox Directions không đi qua cao tốc này. Hiện bản đồ dùng tuyến thẳng và tam giác **minh họa**. Cần dữ liệu chính thức (GeoJSON) hoặc thử lại OSM sau.
- [ ] Anh xem video `dong-nai-ha-tang-map` (spec đang `draft`) rồi duyệt; render đủ và đổi `status` sang `approved` sau khi duyệt.
- [ ] Bổ sung link/ngày nguồn gốc cho 5 số trong `docs/video/dong-nai-ha-tang.md` (video cũ làm trước khi có bảng nguồn; hiện ghi "chưa có link").
- [ ] Chạy thử `/bcons-video` trọn vòng với chủ đề thật (chưa chạy; chưa tạo giọng cho spec mới).
- [ ] `specs/mau-lai-suat.json` là spec thử bằng số mẫu (draft), chỉ để xem bố cục `compare-bars`, không đăng.
- [ ] Tin nhắn tự động hàng loạt: chọn kênh, làm bộ mẫu tin, tool gửi từ file danh sách.
- [ ] Dựng video thật (cần ảnh/render/video gốc, công cụ AI hoặc CapCut).

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
5. **PTTT 01**: em đọc bản trên Drive, chưa đối chiếu với bản anh gửi lại từng chữ. (PTTT 03: anh xác nhận 04/11/2026 là bản mới nhất.)
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
- Máy laptop này có Google Drive for desktop ở ổ `G:` (`G:\My Drive\Bcons - Dong bo thiet bi\`). Máy khác cần cài Drive for desktop; nếu Drive ở đường dẫn khác, đặt `DRIVE_VIDEO_DIR` trong `remotion-video/.env`.
- Thư mục Drive `video/` đã có `bcons-central-park-map.mp4` và `bcons-tuan-final.mp4` do anh tự thêm (không phải do em render, em không đụng tới).
- Còn chưa rõ: `data/bang-gia.csv` đã có trong thư mục Drive `data/` chưa, và thư mục `data/` cục bộ không có trên máy dùng phiên này.
- Quy trình render hằng ngày: `cd remotion-video && npm run render:drive -- <tên-video>` (thêm tên file mp4 làm tham số thứ hai nếu muốn lưu tên khác). Lệnh này ghi đè file cùng tên trong Drive.
- Video Remotion: số liệu (2,4 tỷ USD FDI, 8.200 ha, 16 tỷ USD, 150.000, 50.000, cao tốc khai thác 01/10/2026) lấy từ yêu cầu của anh, chưa đối chiếu tài liệu chủ đầu tư. Duyệt trước khi đăng.
- Bản đồ cảnh 2 là sơ đồ minh họa, vị trí ước lượng.
- Key ElevenLabs hiện không có quyền `Models`; đã bật `Models` Access nên liệt kê model được. Model trong tài khoản hỗ trợ tiếng Việt: `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_turbo_v2_5`, `eleven_flash_v2_5`.
- Nhận lệnh "Off" để tự cập nhật notes, commit, push (xem `CLAUDE.md`).
