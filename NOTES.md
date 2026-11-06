# NOTES.md — Nhật ký và việc cần làm

Cập nhật lần cuối: 05/11/2026 (phiên Off cuối ngày; gồm phiên fanpage 04–05/11/2026 trên nhánh `claude/peaceful-carson-qnjpwr`)

## Đã làm
- [x] Đọc tài liệu Drive: training kick-off, Q&A, PTTT 01–05, danh sách thư mục.
- [x] Tổng hợp dữ liệu dự án vào `du-an/bcons-central-park/thong-tin.md` (dự án, 5 PTTT, lịch mở bán, chi phí, tóm tắt bảng giá).
- [x] Tách bảng giá 996 căn từ Master File ra `data/bang-gia.csv` (cục bộ, không lên git).
- [x] Tạo `CLAUDE.md` và `NOTES.md`.
- [x] Video Remotion dọc 1080x1920 30fps trong `engine/remotion/` (4 cảnh: Đồng Nai, hạ tầng, KTM tự do Long Thành, Bcons Central Park). Đã render `out/bcons-central-park.mp4` (20 giây, không tiếng) và `out/bcons-central-park-elevenlabs.mp4` (khoảng 44 giây, có giọng đọc + phụ đề từng từ). File mp4 không lên git.
- [x] Giọng đọc ElevenLabs (`eleven_v4`, voice `9CCqsrTCLkHgQlKSMchK`): script `scripts/generate-voice.mjs <tên>`, lời đọc/phụ đề nằm trong `markup` của spec `du-an/<mã>/video/<tên>/spec.json`, âm thanh trong `du-an/<mã>/video/<tên>/audio/`, timestamp trong `du-an/<mã>/video/<tên>/timestamps.json`. Key trong `engine/remotion/.env` (gitignored).
- [x] Thư mục Drive riêng tư "Bcons - Dong bo thiet bi" (id `1yzMS8oTXBiBv4RvgIUScsj_XxYkZiWux`) có `video/`, `data/` và file hướng dẫn cài máy thứ hai.
- [x] Thêm lệnh "Off" vào `CLAUDE.md`.
- [x] Quy trình render mới: `npm run render:drive -- <tên>` (trong `engine/remotion/`) render xong tự chép mp4 sang Drive for desktop, đã chạy thử thành công (12,5 MB, `bcons-central-park-elevenlabs.mp4`). Script `scripts/render-drive.mjs`.

- [x] 04/11/2026: refactor video thành spec + mẫu cảnh có schema (`engine/remotion/src/spec.ts`, `src/templates/`), thêm mẫu `compare-bars`, cổng chặn nguồn/`approved` (`scripts/spec-tools.mjs`, `npm test`, `npm run lint`), lệnh `/bcons-video` (`.claude/commands/bcons-video.md`), prompt Gemini (`docs/prompt-gemini-nghien-cuu.md`). Video đầu tiên là spec `dong-nai-ha-tang` (render khung hình giống hệt bản cũ). Thiết kế: `docs/superpowers/specs/2026-11-04-bcons-video-pipeline-design.md`, kế hoạch: `docs/superpowers/plans/2026-11-04-bcons-video-pipeline.md`.
- [x] Bỏ edge-tts (anh quyết định).
- [x] 04/11/2026: mẫu cảnh bản đồ `geo-map` dùng Mapbox GL (token `MAPBOX_TOKEN_KEY` trong `engine/remotion/.env`, kiểm bằng `npm run check:mapbox`). Spec `dong-nai-ha-tang-map` (cảnh 2 là bản đồ, lời bình/giọng y hệt bản cũ, dùng lại mp3). Tọa độ Bcons Central Park, sân bay Long Thành, Cảng Phước An do anh cung cấp; Bến Lức lấy từ Mapbox Geocoding (gần đúng). Dữ liệu: `du-an/bcons-central-park/assets/geo/NGUON.md`, `du-an/bcons-central-park/assets/geo/`, tạo bằng `scripts/build-geo.mjs`. Link nguồn Facebook của video cũ đã ghi vào `du-an/bcons-central-park/video/dong-nai-ha-tang/kich-ban.md`.

- [x] 04/11/2026: video `lai-suat-vay-mua-nha-2026` (góc lãi suất, spec `approved`) đã tạo giọng và render xong. Anh chỉnh: tên riêng tiếng Anh đọc đúng tiếng Anh, `BIDV{bee eye dee vee}`. Em chưa nghe lại cách đọc BIDV sau khi sửa.
- [x] 04/11/2026: video `ha-tang-bien-hoa-2026` (kịch bản từ skill real-estate-content-creator, `du-an/bcons-central-park/content/2026-11-04-ha-tang-bien-hoa-da-chay-vs-tren-giay.md`, spec `approved`): cảnh 1 bản đồ Mapbox, cảnh 2-3 thẻ số liệu, cảnh 4 thông tin dự án. Đã tạo giọng (anh nghe được), đã render `out/ha-tang-bien-hoa-2026.mp4` (19 MB, khoảng 55 giây) và chép lên Drive `video/`. Chờ anh xem và duyệt trước khi đăng; em chưa xem trọn video.
- [x] 04/11/2026: hệ phong cách và chuyển động cho spec: `style` (classic, sang, navy, xanh) trong `src/theme.ts`, `motion` (classic, truot, nay, mo) trong `src/motion.ts`, khai báo trong spec (hạ tầng Biên Hòa dùng `xanh` + `mo`). Test hồi quy: băm khung hình `dong-nai-ha-tang` vẫn giống hệt; 48 test qua.
- [x] 04/11/2026: kiểm tra báo cáo Gemini, sửa các khẳng định bị thổi phồng (13-15% là lãi suất thực sau ưu đãi, không nêu diện tích FTZ vì 8.100/8.200 ha mâu thuẫn, Biên Hòa - Vũng Tàu giai đoạn 1 chỉ "dự kiến", bỏ Vành đai 3 Tây Ninh 95%). PTTT 03 xác nhận bản mới nhất; PTTT 05 giống PTTT 02 (CĐT hỗ trợ ân hạn lãi gốc, không nêu thời hạn).

- [x] 05/11/2026: 2 video từ kịch bản Gemini số 2 và 4: `cho-thue-kcn-bien-hoa-2026` (A, màu sang/chuyển động truot) và `tai-thiet-kcn-bien-hoa-1` (B, navy/nay). Spec `approved`, đã tạo giọng (anh nghe được), đã render đủ bản bản đồ vệ tinh (A 58,9 giây, B 56,8 giây) và chép Drive `video/`. Chờ anh xem trọn video và duyệt trước khi đăng; em chưa xem trọn video, chỉ xem khung thử.
- [x] Quy ước anh đặt 05/11/2026 (đã lưu memory): giọng miền Nam voice `9CCqsrTCLkHgQlKSMchK`, đọc "ngàn" không "nghìn", tên riêng tiếng Anh đọc tiếng Anh (BIDV{bee eye dee vee}); lời đọc thiên tầm nhìn quảng bá (chú thích nhỏ để ở chữ trên màn hình và bảng nguồn, vẫn không hứa tăng giá/lợi nhuận); video có bản đồ/camera/ảnh phải có storyboard theo giây để anh duyệt trước khi code và render (`du-an/<mã>/video/<tên>/storyboard.md`, đã thêm vào `/bcons-video` cổng 4 và `docs/quy-trinh-video.md`); video thành phẩm ra `engine/remotion/out/video/`, file tạm ra `out/tam/`.
- [x] 05/11/2026: mẫu `geo-map` nâng cấp: nền vệ tinh Mapbox (`satellite-streets-v12`), camera nhiều chặng theo lời đọc (center/zoom hoặc `fit` tự tính vừa vùng, toán trong `src/geoCamera.ts`), ranh tự vẽ, làm tối vùng ngoài, nhấp sáng, thẻ số nổi neo vào vùng, thẻ số liệu phía trên bản đồ (vùng y 1500-1650 dành cho phụ đề), nhãn km trên đường nối, ảnh chèn cross-fade, chữ gõ dần. `project-close` có thêm ảnh phối cảnh. Cổng kiểm tra chặn dữ liệu `provisional` và ảnh tên `placeholder`.
- [x] 05/11/2026: ranh KCN lấy từ OpenStreetMap: anh xuất GeoJSON từ Overpass Turbo vào `map/` (nay là `du-an/bcons-central-park/assets/geo/osm-xuat/`); script `npm run geo:fetch` (trong `engine/remotion/`) đọc `osm-xuat/` hoặc gọi Overpass, lưu `du-an/bcons-central-park/assets/geo/osm/` (cờ `--refresh`, `--remote`, `--search "tên" --bbox ...`); `npm run geo:derive` tạo lớp minh họa (phân vùng KCN Biên Hòa 1 hình tròn cắt theo tỉ lệ diện tích tin báo; đường chim bay kèm km từ dự án) vào `du-an/bcons-central-park/assets/geo/minh-hoa/`. Anh chạy thử `--remote` trên máy anh: Overpass lấy được Loteco và Amata, 3 khu còn lại quá giờ (mirror công cộng không ổn định). Diện tích đa giác OSM: Loteco 99,9 ha, Biên Hòa II 401,9, Amata 416,9 (chưa gộp phần mở rộng 185,9), Biên Hòa 1 298,1, khu đất dự án 2,9 ha.
- [x] 05/11/2026: ảnh phối cảnh anh chép vào `anh/ẢNH GỐC` (22 ảnh, khoảng 2 GB, đã thêm `anh/` vào `.gitignore`); dùng 2 ảnh thu nhỏ 2400 px trong `du-an/bcons-central-park/assets/images/`: `phoi-canh-green-park.jpg` (video A) và `phoi-canh-tong-the.jpg` (video B).
- [x] 04–05/11/2026 Fanpage Facebook: anh chốt tên **"Căn hộ Phan Trung – Bcons Central Park Biên Hòa"**, kênh thông tin không gắn cá nhân, anh làm cho Bcons PS Land (sàn phân phối chính thức); công ty không quan tâm chuyện sale tự lập trang. Anh đã tạo trang trên Facebook (loại Doanh nghiệp, hạng mục Người môi giới bất động sản, dòng giới thiệu đã dán); đang ở bước thông tin liên hệ (để trống web, SĐT, email, địa chỉ; giờ mở cửa chọn "Không có giờ mở cửa"). Chưa rõ anh đã tải ảnh và đăng bài chưa.
- [x] Tài liệu fanpage (đều nháp chờ anh duyệt): `du-an/bcons-central-park/content/fanpage-de-xuat.md` (đề xuất tổng), `du-an/bcons-central-park/content/fanpage-thiet-lap.md` (các bước tạo trang, dòng giới thiệu, bảng kiểm, 5 bài đầu), `du-an/bcons-central-park/content/messenger-kich-ban.md` (Messenger tự trả lời, đã điền tên công ty Bcons PS Land), `du-an/bcons-central-park/nguon/doi-chieu-gia-tri-du-an.md` (bảng "ý nào có nguồn": b.school chưa có nguồn, Aeon Mall chỉ nói được là dự án và không dùng "lớn nhất Miền Nam", TP. Đồng Nai trực thuộc TW, metro không nêu km...).
- [x] Hình cho fanpage: `du-an/bcons-central-park/content/messenger-qua/so-sanh-5-pttt.{html,png}` (bảng so sánh 5 PTTT, PTTT 03 không chiết khấu), `du-an/bcons-central-park/content/fanpage/cover.jpg`, `avatar.jpg` (cắt từ phối cảnh tổng thể), `anh/` 11 ảnh phối cảnh và nhà mẫu A1/B4/C1 đã thu nhỏ. Ảnh gốc phối cảnh (34–80MB) và HEIC chưa dùng nằm trên Drive. Đã gửi anh 4 file qua khung chat; chưa lên Drive vì connector Drive không nhận file nhị phân lớn.
- [x] Google Sheets "Bcons - Khach quan tam Messenger" (id `1c6K4ZC23cXreDt4sex2eSO-ObLO4YBF0KoBLlBp2-mU`): tab KhachQuanTam (14 cột, có dropdown), TuChoi, HuongDan. Mới có tiêu đề, chưa có dữ liệu khách.
- [x] Công cụ tính nhanh (artifact riêng tư): https://claude.ai/artifact/PUaqHdDkV1Wu89crJH74si. Lọc 638 căn còn bán (A 347, B 150, E 141) theo vốn có sẵn và mức trả góp hàng tháng sau bàn giao, 5 PTTT, tin nhắn gửi khách. Cách tính đối chiếu với sheet TraGia (căn A4-01), lệch tối đa 1 đồng. Dữ liệu giá nằm trong trang, **không đưa lên git**; file nguồn nằm ở thư mục tạm của phiên (mất khi container bị thu hồi), muốn sửa thì đọc lại artifact rồi cập nhật bằng URL.
- [x] Đã đọc artifact "Giá & Mặt bằng Bcons" (https://claude.ai/artifact/FkQB9zb7n87fyU8M2oMpBV, anh có sẵn): chỉ có tháp A, B, E; Lotus (C) và Palm (D) chưa có giá.
- [x] 04/11/2026: anh xác nhận **PTTT 03 không có chiết khấu**; đã sửa `du-an/bcons-central-park/thong-tin.md`.
- [x] Quyết định chung của phiên: không có connector Meta nào điều khiển Messenger; dùng Meta Business Suite miễn phí. MyChatBot tốn phí, để sau. Meta Ads connector chỉ làm quảng cáo, để sau tuần 3–4 của trang.

- [x] 06/11/2026: dời repo sang cấu trúc `engine/` (code chung) + `du-an/bcons-central-park/` (mỗi video một thư mục `video/<tên>/`), `config.json` chọn dự án đang bán, lệnh nhận `--du-an <mã>`, thư mục mẫu `du-an/_mau/`. Khung hình trước/sau giống hệt, 70 test qua. Kế hoạch: `docs/superpowers/plans/2026-11-06-01-cau-truc-du-an.md`. Máy anh cần chạy `docs/huong-dan-doi-thu-muc-may-anh.md`.

## Đang làm
- [x] (đã xong 05/11: đã tạo lại giọng 2 video mới, anh nghe được) Giọng cảnh 2 bị lệch giọng cũ (nghe như miền Bắc, giọng gốc là `vi-southern`, giọng nhân bản). Đã tạo 4 bản thử trong `engine/remotion/audio-test/` (không lên git), chờ anh nghe và chọn; sau đó tạo lại 4 cảnh, render lại, commit. Bản đã commit vẫn là giọng cũ.
- [ ] Kiểm tra cách đọc FDI ("F D I") và Bcons Central Park ("Bee Cons Central Park") sau khi tạo lại giọng; em chưa nghe được.
- [ ] Kịch bản video đợt 2 (giới thiệu ngày 29/11/2026) trong `du-an/bcons-central-park/video/dot-2/kich-ban.md`. Bản nháp, chờ anh duyệt.
- [ ] Anh hoàn tất tạo fanpage: tải `cover.jpg` và `avatar.jpg`, nút "Nhắn tin", thêm quản trị viên dự phòng, bật xác thực 2 lớp, cài Meta Business Suite > Hộp thư > Tự động hóa theo `messenger-kich-ban.md`, thử bằng tài khoản khác, duyệt và đăng 5 bài đầu.

- [x] Superpowers: đã chép 5 skill vào `.claude/skills/` (commit gốc `bb92a77`), chưa commit; mở phiên mới để dùng. ECC: anh quyết định không cài (04/11/2026). `/plugin` không chạy trong PowerShell/app.
- [x] Quyết định 04/11/2026: bỏ CTA đọc/hiện số điện thoại; cuối video chỉ chạy thông tin dự án. Nếu sau này muốn dùng số, cần xác nhận quy định TikTok/Meta và công ty (hotline công ty an toàn hơn).
- [ ] Anh duyệt `docs/quy-trinh-video.md`. Hai file prompt cũ vẫn untracked (có chứa SĐT cá nhân), chưa commit.

- [ ] Anh xem trọn 2 video mới (`cho-thue-kcn-bien-hoa-2026`, `tai-thiet-kcn-bien-hoa-1`) trước khi đăng. Lưu ý cho video B: Aeon Mall đang là **điểm tạm anh chọn** (10.927817, 106.835207), ghi "gần đúng"; vùng 21,5 / 44 / 286 / 51,6 ha là hình tròn minh họa (nét đứt), không phải ranh thật. Ranh OSM lệch số chính thức (Amata -19%, Biên Hòa 1 -11%) và chưa đối chiếu hồ sơ chủ đầu tư.
- [ ] Cần tọa độ/ranh thật của Aeon Mall và, nếu có, ranh quy hoạch thật của các vùng 44/286/21,5/51,6 ha (GeoJSON/KMZ). Có thì sửa `scripts/build-geo.mjs` và bỏ `geo:derive` cho các vùng đó.
- [ ] Thử thêm cơ chế tự thử lại 2-3 lần cho mỗi khu trong `geo-fetch.mjs` (Overpass hay quá giờ). Gắn nhãn km đã có; chưa kiểm cách đọc BIDV, FDI sau khi tạo lại giọng (anh đã nghe được giọng).

## Chưa làm
- [ ] Anh xem và duyệt 2 video `lai-suat-vay-mua-nha-2026` và `ha-tang-bien-hoa-2026` trước khi đăng (em không đăng). Nguồn: báo cáo Gemini `du-an/bcons-central-park/nguon/gemini/ket_qua_nghien_cuu_bds_dong_nai_bien_hoa.md`.
- [ ] Xác nhận cao tốc Biên Hòa - Vũng Tàu giai đoạn 1 đã thông xe 18/05/2026 chưa; khoảng cách từ 236 Phan Trung tới các tuyến chưa đo; Dat Xanh/PropertyGuru chỉ dựa một bài VnExpress.
- [ ] Việc nhỏ hoãn lại: tên file xuất của render-drive chưa kiểm tra (shell:true), CompareBars lỗi NaN khi mọi giá trị bằng 0, key React có thể trùng, chưa có watermark DRAFT, chưa có kiểm tra số điện thoại bằng regex, `.env` nạp trước cổng trong render-drive. `package.json` engines `^20.19` nhưng cần Node >= 22.18 (type stripping khi test).
- [ ] Hình tuyến cao tốc Bến Lức - Long Thành thật và ranh giới Biên Hòa / khu thương mại tự do Long Thành: máy chủ OpenStreetMap không trả dữ liệu ngày 04/11, Mapbox Directions không đi qua cao tốc này. Hiện bản đồ dùng tuyến thẳng và tam giác **minh họa**. Cần dữ liệu chính thức (GeoJSON) hoặc thử lại OSM sau.
- [ ] Anh xem video `dong-nai-ha-tang-map` (spec đang `draft`) rồi duyệt; render đủ và đổi `status` sang `approved` sau khi duyệt.
- [ ] Bổ sung link/ngày nguồn gốc cho 5 số trong `du-an/bcons-central-park/video/dong-nai-ha-tang/kich-ban.md` (video cũ làm trước khi có bảng nguồn; hiện ghi "chưa có link").
- [ ] Chạy thử `/bcons-video` trọn vòng với chủ đề thật (chưa chạy; chưa tạo giọng cho spec mới).
- [ ] `du-an/bcons-central-park/video/mau-lai-suat/spec.json` là spec thử bằng số mẫu (draft), chỉ để xem bố cục `compare-bars`, không đăng.
- [ ] Tin nhắn tự động hàng loạt: chọn kênh, làm bộ mẫu tin, tool gửi từ file danh sách.
- [ ] Dựng video thật (cần ảnh/render/video gốc, công cụ AI hoặc CapCut).
- [ ] **VAT 10%**: công cụ tính nhanh và Master File dùng VAT 10% trên cả giá căn (theo file giá CĐT). Skill nội dung ghi VAT căn hộ có thể không tính trên phần giá trị quyền sử dụng đất, file giá không tách riêng. Anh xác nhận với bộ phận tài chính trước khi gửi khách "giá có VAT".
- [ ] Đối chiếu còn thiếu: trường b.school (Q&A chỉ có nhà trẻ tầng 2), khoảng cách 236 Phan Trung tới trung tâm hành chính / Aeon Mall Biên Hòa / ga metro dự kiến, ngày chính xác TP. Đồng Nai trực thuộc TW (24/4 và 30/4/2026 mới từ tóm tắt tìm kiếm), mốc khởi công và hoàn thành cầu Cát Lái, Long Hưng, tiến độ Aeon Mall năm 2026; lợi suất cho thuê 4,4%/năm của Gemini chưa mở bài gốc.
- [ ] Công cụ tính nhanh: cập nhật khi bảng giá hoặc giỏ hàng chung đổi (cần Master File mới); chưa có tháp C, D; lãi vay 9,5%/năm và kỳ hạn 20 năm là giả định lấy từ sheet VayNH.
- [ ] Giờ làm việc của tư vấn viên (điền vào tin ngoài giờ); có dùng hotline công ty không.
- [ ] Đưa ảnh/bộ bài lên Drive của anh (hiện anh tự tải từ khung chat hoặc từ repo); có thể tạo Google Doc chứa chữ bộ bài và bảng kiểm nếu anh cần.
- [ ] Làm bio TikTok cùng thông điệp với fanpage, thêm liên kết khi trang có địa chỉ; có thể làm video TikTok từ ảnh nhà mẫu/phối cảnh.
- [ ] Ảnh HEIC nhà mẫu (A1, B4, C1) chưa chuyển đổi và chưa dùng.
- [ ] Quảng cáo Meta (Messenger) để sau tuần 3–4; anh duyệt ngân sách và nội dung trước khi bật.

## Tư liệu hình/video trong Drive (đã liệt kê, em chưa xem được nội dung)
- Flycam (thư mục `1_FOLJkPOh657pT8_L71i456LzCfVv8on`): `1.mp4` (27MB), `2.mp4` (49MB), `3.mp4` (39MB); thư mục `Final` có `Tổng 1 + 2.mov` (70MB) và `Video 1.mp4` (30MB).
- TVC: `TVC Bcons Central Park.mp4` (570MB) trong 12. TVC/VIDEO > 1. TVC.
- Mẫu căn hộ A: `Hộp đơn A1.jpg`, `Hộp đơn A2.jpg` (~10MB mỗi ảnh). Thư mục mẫu C và D chưa liệt kê.
- 04/11/2026: anh gửi 4 link thư mục chia sẻ (phối cảnh `1ybrbk0J6E2nHxfnN6gK95iyb3tNWVXfO`, nhà mẫu C1 `1KeDfaagRLI12gUXA2rEOQHpuhWlTtFgK`, B4 `1e8uGw01-RMuoLa5w1_HuGU2NTfXQdHyl`, A1 `1AMxeu5TjQWqCDH1v0ecJQoghxWmlRLVw`). Liệt kê được bằng connector; tải bằng `curl https://drive.google.com/uc?export=download&id=<id>` với file chia sẻ bằng link (connector chỉ trả base64, quá nặng). Đã xem 4 phối cảnh ban đêm và các ảnh JPG nhà mẫu A1/B4/C1; phối cảnh có thêm file ở trang kế tiếp chưa mở.
- Em không xem video trực tiếp qua connector Drive. Video anh upload vào phiên thì em trích khung hình để xem được: đã xem 4 clip flycam (1, 5, 10, 9), mô tả trong `du-an/bcons-central-park/assets/flycam.md`.

- Ảnh nhà mẫu A1 (88 m2, 3PN), B4 (73 m2, 2PN-2WC), C1 (52 m2, 2PN-1WC) là ảnh chụp nhà mẫu; nội thất minh họa, căn hộ bàn giao hoàn thiện cơ bản theo danh mục CĐT. Mọi ảnh phối cảnh phải ghi "hình ảnh minh họa".
- Clip flycam 1 đã vẽ ranh giới (file video nằm trong phiên, không đưa lên git).

## Câu hỏi còn mở (cần anh trả lời)
1. **Quy định nội dung quảng cáo** của công ty: điều không được nói, cách xưng hô, cụm từ bắt buộc, disclaimer pháp lý.
2. **Kênh nhắn hàng loạt**: Zalo OA/ZNS, SMS brandname hay email? Ngân sách?
3. **Danh sách khách** sẽ nhắn: nhóm nào, ai đã đồng ý nhận tin? (Sheet KhachHang có khoảng 300 dòng, đa số "không quan tâm" hoặc đã có sale khác chăm.)
4. ~~PTTT 03 chiết khấu~~: anh xác nhận 04/11/2026 là không có chiết khấu (đã sửa docs).
5. **PTTT 01**: em đọc bản trên Drive, chưa đối chiếu với bản anh gửi lại từng chữ. (PTTT 03: anh xác nhận 04/11/2026 là bản mới nhất.)
6. Đợt 2 mở những căn nào (236 căn đang CĐT lock có phải là căn mở ở đợt 2 không)? Ảnh hưởng đến việc nhắn "còn bao nhiêu căn".
7. Phối cảnh, ảnh nhà mẫu: anh nói cứ dùng cho fanpage; TVC (`TVC Bcons Central Park.mp4`, 570MB) có được dùng để cắt video ngắn không thì chưa hỏi.
8. Tên và số liên hệ trên trang: có dùng hotline công ty không? Giờ làm việc tư vấn viên?
9. VAT 10% trên giá căn hộ có đúng với cách CĐT thu không (xem mục Chưa làm)?

## Ghi chú kỹ thuật
- Master File có sheet nội bộ (KhachHang, HoaHong). Chỉ đọc cục bộ, không đưa lên git.
- Giá PTTT 04/05 trong Master File là tự tính (giá PTTT 02 × 0,9755), chủ đầu tư chưa ra bảng giá riêng.
- Ngày bàn giao trong file là giả định 30/06/2029 (chủ đầu tư chỉ ghi "dự kiến Quý II/2029").
- Số liệu tình trạng căn là ảnh chụp tại thời điểm nhận file (ngày 30/10/2026); cần cập nhật trước khi quảng cáo.

## Đồng bộ nhiều thiết bị
- Code, docs, kịch bản, mp3: GitHub (nhánh `main`).
- Dữ liệu nội bộ (`data/`, xlsx) và video render (`.mp4`): thư mục Drive riêng tư "Bcons - Dong bo thiet bi" (id `1yzMS8oTXBiBv4RvgIUScsj_XxYkZiWux`), kèm file `HUONG-DAN-CAI-MAY-THU-HAI.md`.
- API key ElevenLabs: chỉ trong `engine/remotion/.env` trên từng máy, không đưa lên git/Drive.
- Máy laptop này có Google Drive for desktop ở ổ `G:` (`G:\My Drive\Bcons - Dong bo thiet bi\`). Máy khác cần cài Drive for desktop; nếu Drive ở đường dẫn khác, đặt `DRIVE_VIDEO_DIR` trong `engine/remotion/.env`.
- Thư mục Drive `video/` đã có `bcons-central-park-map.mp4` và `bcons-tuan-final.mp4` do anh tự thêm (không phải do em render, em không đụng tới).
- Còn chưa rõ: `data/bang-gia.csv` đã có trong thư mục Drive `data/` chưa, và thư mục `data/` cục bộ không có trên máy dùng phiên này.
- Quy trình render hằng ngày: `cd engine/remotion && npm run render:drive -- <tên-video>` (thêm tên file mp4 làm tham số thứ hai nếu muốn lưu tên khác). Lệnh này ghi đè file cùng tên trong Drive.
- Video Remotion: số liệu (2,4 tỷ USD FDI, 8.200 ha, 16 tỷ USD, 150.000, 50.000, cao tốc khai thác 01/10/2026) lấy từ yêu cầu của anh, chưa đối chiếu tài liệu chủ đầu tư. Duyệt trước khi đăng.
- Bản đồ cảnh 2 là sơ đồ minh họa, vị trí ước lượng.
- Key ElevenLabs hiện không có quyền `Models`; đã bật `Models` Access nên liệt kê model được. Model trong tài khoản hỗ trợ tiếng Việt: `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_turbo_v2_5`, `eleven_flash_v2_5`.
- Phiên 04–05/11/2026 làm trên nhánh `claude/peaceful-carson-qnjpwr` (theo yêu cầu của môi trường đám mây), không phải nhánh trong `CLAUDE.md`; đã push, không tạo PR. Container đám mây không có `data/`, `.env`, node_modules.
- Công cụ cho Facebook/TikTok: không có connector đăng bài hay điều khiển Messenger. Có `tiktok`, `TikTok for Business`, Meta Ads (đứt kết nối từng lúc), Canva (chưa bật trong phiên), Google Drive/Sheets/Docs. Connector Drive chỉ nhận nội dung nhỏ khi ghi file (base64 nằm trong lệnh).
- Nhận lệnh "Off" để tự cập nhật notes, commit, push (xem `CLAUDE.md`).
