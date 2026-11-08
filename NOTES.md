# NOTES.md — Nhật ký và việc cần làm

Cập nhật lần cuối: 08/11/2026 rạng sáng (phiên Off lần 2; kho SFX đủ 11 file, sửa `/kiemgia` đọc cột gộp PTTT)

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

- [x] 04/11/2026: refactor video thành spec + mẫu cảnh có schema (`engine/remotion/src/spec.ts`, `src/templates/`), thêm mẫu `compare-bars`, cổng chặn nguồn/`approved` (`scripts/spec-tools.mjs`, `npm test`, `npm run lint`), lệnh `/bcons-video` (`.claude/skills/bcons-video/SKILL.md`), prompt Gemini (`docs/prompt-gemini-nghien-cuu.md`). Video đầu tiên là spec `01-dong-nai-ha-tang` (render khung hình giống hệt bản cũ). Thiết kế: `docs/superpowers/specs/2026-11-04-bcons-video-pipeline-design.md`, kế hoạch: `docs/superpowers/plans/2026-11-04-bcons-video-pipeline.md`.
- [x] Bỏ edge-tts (anh quyết định).
- [x] 04/11/2026: mẫu cảnh bản đồ `geo-map` dùng Mapbox GL (token `MAPBOX_TOKEN_KEY` trong `engine/remotion/.env`, kiểm bằng `npm run check:mapbox`). Spec `02-dong-nai-ha-tang-map` (cảnh 2 là bản đồ, lời bình/giọng y hệt bản cũ, dùng lại mp3). Tọa độ Bcons Central Park, sân bay Long Thành, Cảng Phước An do anh cung cấp; Bến Lức lấy từ Mapbox Geocoding (gần đúng). Dữ liệu: `du-an/bcons-central-park/assets/geo/NGUON.md`, `du-an/bcons-central-park/assets/geo/`, tạo bằng `scripts/build-geo.mjs`. Link nguồn Facebook của video cũ đã ghi vào `du-an/bcons-central-park/video/01-dong-nai-ha-tang/kich-ban.md`.

- [x] 04/11/2026: video `03-lai-suat-vay-mua-nha` (góc lãi suất, spec `approved`) đã tạo giọng và render xong. Anh chỉnh: tên riêng tiếng Anh đọc đúng tiếng Anh, `BIDV{bee eye dee vee}`. Em chưa nghe lại cách đọc BIDV sau khi sửa.
- [x] 04/11/2026: video `04-ha-tang-bien-hoa` (kịch bản từ skill real-estate-content-creator, `du-an/bcons-central-park/content/2026-11-04-ha-tang-bien-hoa-da-chay-vs-tren-giay.md`, spec `approved`): cảnh 1 bản đồ Mapbox, cảnh 2-3 thẻ số liệu, cảnh 4 thông tin dự án. Đã tạo giọng (anh nghe được), đã render `out/04-ha-tang-bien-hoa.mp4` (19 MB, khoảng 55 giây) và chép lên Drive `video/`. Chờ anh xem và duyệt trước khi đăng; em chưa xem trọn video.
- [x] 04/11/2026: hệ phong cách và chuyển động cho spec: `style` (classic, sang, navy, xanh) trong `src/theme.ts`, `motion` (classic, truot, nay, mo) trong `src/motion.ts`, khai báo trong spec (hạ tầng Biên Hòa dùng `xanh` + `mo`). Test hồi quy: băm khung hình `01-dong-nai-ha-tang` vẫn giống hệt; 48 test qua.
- [x] 04/11/2026: kiểm tra báo cáo Gemini, sửa các khẳng định bị thổi phồng (13-15% là lãi suất thực sau ưu đãi, không nêu diện tích FTZ vì 8.100/8.200 ha mâu thuẫn, Biên Hòa - Vũng Tàu giai đoạn 1 chỉ "dự kiến", bỏ Vành đai 3 Tây Ninh 95%). PTTT 03 xác nhận bản mới nhất; PTTT 05 giống PTTT 02 (CĐT hỗ trợ ân hạn lãi gốc, không nêu thời hạn).

- [x] 05/11/2026: 2 video từ kịch bản Gemini số 2 và 4: `05-cho-thue-kcn-bien-hoa` (A, màu sang/chuyển động truot) và `06-tai-thiet-kcn-bien-hoa-1` (B, navy/nay). Spec `approved`, đã tạo giọng (anh nghe được), đã render đủ bản bản đồ vệ tinh (A 58,9 giây, B 56,8 giây) và chép Drive `video/`. Chờ anh xem trọn video và duyệt trước khi đăng; em chưa xem trọn video, chỉ xem khung thử.
- [x] Quy ước anh đặt 05/11/2026 (đã lưu memory): giọng miền Nam voice `9CCqsrTCLkHgQlKSMchK`, đọc "ngàn" không "nghìn", tên riêng tiếng Anh đọc tiếng Anh (BIDV{bee eye dee vee}); lời đọc thiên tầm nhìn quảng bá (chú thích nhỏ để ở chữ trên màn hình và bảng nguồn, vẫn không hứa tăng giá/lợi nhuận); video có bản đồ/camera/ảnh phải có storyboard theo giây để anh duyệt trước khi code và render (`du-an/<mã>/video/<tên>/storyboard.md`, đã thêm vào `/bcons-video` cổng 4 và `docs/quy-trinh-video.md`); video thành phẩm ra `engine/remotion/out/video/`, file tạm ra `out/tam/`.
- [x] 05/11/2026: mẫu `geo-map` nâng cấp: nền vệ tinh Mapbox (`satellite-streets-v12`), camera nhiều chặng theo lời đọc (center/zoom hoặc `fit` tự tính vừa vùng, toán trong `src/geoCamera.ts`), ranh tự vẽ, làm tối vùng ngoài, nhấp sáng, thẻ số nổi neo vào vùng, thẻ số liệu phía trên bản đồ (vùng y 1500-1650 dành cho phụ đề), nhãn km trên đường nối, ảnh chèn cross-fade, chữ gõ dần. `project-close` có thêm ảnh phối cảnh. Cổng kiểm tra chặn dữ liệu `provisional` và ảnh tên `placeholder`.
- [x] 05/11/2026: ranh KCN lấy từ OpenStreetMap: anh xuất GeoJSON từ Overpass Turbo vào `map/` (nay là `du-an/bcons-central-park/assets/geo/osm-xuat/`); script `npm run geo:fetch` (trong `engine/remotion/`) đọc `osm-xuat/` hoặc gọi Overpass, lưu `du-an/bcons-central-park/assets/geo/osm/` (cờ `--refresh`, `--remote`, `--search "tên" --bbox ...`); `npm run geo:derive` tạo lớp minh họa (phân vùng KCN Biên Hòa 1 hình tròn cắt theo tỉ lệ diện tích tin báo; đường chim bay kèm km từ dự án) vào `du-an/bcons-central-park/assets/geo/minh-hoa/`. Anh chạy thử `--remote` trên máy anh: Overpass lấy được Loteco và Amata, 3 khu còn lại quá giờ (mirror công cộng không ổn định). Diện tích đa giác OSM: Loteco 99,9 ha, Biên Hòa II 401,9, Amata 416,9 (chưa gộp phần mở rộng 185,9), Biên Hòa 1 298,1, khu đất dự án 2,9 ha.
- [x] 05/11/2026: ảnh phối cảnh anh chép vào `anh/ẢNH GỐC` (22 ảnh, khoảng 2 GB, đã thêm `anh/` vào `.gitignore`); dùng 2 ảnh thu nhỏ 2400 px trong `du-an/bcons-central-park/assets/images/`: `phoi-canh-green-park.jpg` (video A) và `phoi-canh-tong-the.jpg` (video B).
- [x] 04–05/11/2026 Fanpage Facebook: anh chốt tên **"Căn hộ Phan Trung – Bcons Central Park Biên Hòa"**, kênh thông tin không gắn cá nhân, anh làm cho Bcons PS Land (sàn phân phối chính thức); công ty không quan tâm chuyện sale tự lập trang. Anh đã tạo trang trên Facebook (loại Doanh nghiệp, hạng mục Người môi giới bất động sản, dòng giới thiệu đã dán); đang ở bước thông tin liên hệ (để trống web, SĐT, email, địa chỉ; giờ mở cửa chọn "Không có giờ mở cửa"). Chưa rõ anh đã tải ảnh và đăng bài chưa.
- [x] Tài liệu fanpage (đều nháp chờ anh duyệt): `du-an/bcons-central-park/content/fanpage-de-xuat.md` (đề xuất tổng), `du-an/bcons-central-park/content/fanpage-thiet-lap.md` (các bước tạo trang, dòng giới thiệu, bảng kiểm, 5 bài đầu), `du-an/bcons-central-park/content/messenger-kich-ban.md` (Messenger tự trả lời, đã điền tên công ty Bcons PS Land), `du-an/bcons-central-park/nguon/doi-chieu-gia-tri-du-an.md` (bảng "ý nào có nguồn": b.school chưa có nguồn, Aeon Mall chỉ nói được là dự án và không dùng "lớn nhất Miền Nam", TP. Đồng Nai trực thuộc TW, metro không nêu km...).
- [x] Hình cho fanpage: `du-an/bcons-central-park/content/messenger-qua/so-sanh-5-pttt.{html,png}` (bảng so sánh 5 PTTT, PTTT 03 không chiết khấu), `du-an/bcons-central-park/content/fanpage/cover.png`, `avatar.png` (làm lại 08/11/2026 với logo Central Park từ Drive của anh, nguồn HTML ở `fanpage/nguon/`), `anh/` 11 ảnh phối cảnh và nhà mẫu A1/B4/C1 đã thu nhỏ. Ảnh gốc phối cảnh (34–80MB) và HEIC chưa dùng nằm trên Drive. Đã gửi anh 4 file qua khung chat; chưa lên Drive vì connector Drive không nhận file nhị phân lớn.
- [x] Google Sheets "Bcons - Khach quan tam Messenger" (id `1c6K4ZC23cXreDt4sex2eSO-ObLO4YBF0KoBLlBp2-mU`): tab KhachQuanTam (14 cột, có dropdown), TuChoi, HuongDan. Mới có tiêu đề, chưa có dữ liệu khách.
- [x] Công cụ tính nhanh (artifact riêng tư): https://claude.ai/artifact/PUaqHdDkV1Wu89crJH74si. Lọc 638 căn còn bán (A 347, B 150, E 141) theo vốn có sẵn và mức trả góp hàng tháng sau bàn giao, 5 PTTT, tin nhắn gửi khách. Cách tính đối chiếu với sheet TraGia (căn A4-01), lệch tối đa 1 đồng. Dữ liệu giá nằm trong trang, **không đưa lên git**; file nguồn nằm ở thư mục tạm của phiên (mất khi container bị thu hồi), muốn sửa thì đọc lại artifact rồi cập nhật bằng URL.
- [x] Đã đọc artifact "Giá & Mặt bằng Bcons" (https://claude.ai/artifact/FkQB9zb7n87fyU8M2oMpBV, anh có sẵn): chỉ có tháp A, B, E; Lotus (C) và Palm (D) chưa có giá.
- [x] 04/11/2026: anh xác nhận **PTTT 03 không có chiết khấu**; đã sửa `du-an/bcons-central-park/thong-tin.md`.
- [x] Quyết định chung của phiên: không có connector Meta nào điều khiển Messenger; dùng Meta Business Suite miễn phí. MyChatBot tốn phí, để sau. Meta Ads connector chỉ làm quảng cáo, để sau tuần 3–4 của trang.

- [x] 06/11/2026: dời repo sang cấu trúc `engine/` (code chung) + `du-an/bcons-central-park/` (mỗi video một thư mục `video/<tên>/`), `config.json` chọn dự án đang bán, lệnh nhận `--du-an <mã>`, thư mục mẫu `du-an/_mau/`. Khung hình trước/sau giống hệt, 70 test qua. Kế hoạch: `docs/superpowers/plans/2026-11-06-01-cau-truc-du-an.md`. Máy anh cần chạy `docs/huong-dan-doi-thu-muc-may-anh.md`.

- [x] 06/11/2026 (MASTER SETUP PROMPT, hạng mục 1–4): `CLAUDE.md` gọn 62 dòng + `.claude/rules/` (pipeline-constraints, preflight-and-sources, chỉ nạp khi đụng file liên quan); nhận diện cloud/máy anh; `.claude/settings.json` (cho phép lệnh an toàn, chặn đọc/sửa `.env`, chặn `git add` file nhạy cảm, hook chặn commit); `.githooks/pre-commit` + `engine/automation/kiem-commit.mjs` (cho phép mp3 giọng đọc); `/bcons-video` chuyển thành skill; skill `bcons-project-init` + `engine/automation/tao-du-an.mjs`; hướng dẫn MCP `docs/huong-dan-mcp.md` (context7, playwright cài theo máy, không commit `.mcp.json`, bỏ sequential-thinking). Hoãn: skill `social-analytics` (kế hoạch 04), `tdd-financial-calc` (kế hoạch 03).

- [x] 06/11/2026 tối: máy bàn (PC) cài xong ở `E:\Claude\bcons` (ổ E, không phải D): Git, Node 26, Claude Code (gói Pro), repo, hook chặn commit, npm install, test qua, `.env` chép bằng USB, Drive for desktop. PC có plugin claude-mem cũ báo lỗi hook lúc mở Claude (không ảnh hưởng).
- [x] 06/11/2026: laptop (D:\Claude\bcons) đã chuyển sang nhánh `main` và dời xong thư mục: `.env`, `out`, `node_modules`, `audio-test` vào `engine/remotion/`, ảnh gốc vào `anh/bcons-central-park/`. 78 test qua, lint OK, đã bật hook chặn commit, render thử `01-dong-nai-ha-tang` có hình có tiếng. Laptop không có `data/` (bảng giá). Máy bàn: xem dòng trên.

- [x] 06/11/2026: anh gửi lại 2 artifact (Tính nhanh, Giá & Mặt bằng); em đọc lại được mã nguồn đầy đủ bằng công cụ Artifact (lệnh `read`), nên mã nguồn công cụ tính **không còn bị mất**. Link ghi trong `du-an/bcons-central-park/project.json` → `artifacts`. Lõi tính tiền (5 PTTT, VAT 10%, bảo trì 2%, vay 50% giá có VAT, trả đều) là hàm thuần, dùng lại cho landing (kế hoạch 03) mà không cần giá cả 996 căn. Giá trong artifact theo file CĐT 17/10/2026, tình trạng giỏ hàng 29/10/2026.

- [x] 06/11/2026 kế hoạch 02 (`docs/superpowers/plans/2026-11-06-02-lich-dang-bai.md`): caption.md cho mỗi bài + bộ kiểm quy tắc (`check:caption`), duyệt gắn dấu vân tay (`duyet:caption`, `duyet:video`), gửi Telegram (`send:telegram`, `telegram:chat-id`), Sheet "Bcons - Lịch nội dung" (id trong `project.json`), hướng dẫn `docs/huong-dan-dang-bai.md`, skill `bai-cong-ty`, caption nháp cho 5 video (Sheet "Chờ duyệt"). Agent soát xong, đã sửa: kiểm VAT riêng từng phần FB/TikTok, SĐT có ngoặc/84, giá viết tỉ/tr, BOM, TikTok dài không bị cắt khi gửi, send kiểm lại quy tắc; 3 caption chỉnh câu chữ. 100 test qua.

- [x] 06/11/2026: bot Telegram chạy trên laptop (`Bcons-Bot.cmd`, `docs/huong-dan-bot-telegram.md`); Claude Code 2.1.319 cài trên laptop, đã đăng nhập. Metricool MCP đã bật (brand 7877084, Asia/Saigon): hẹn `04-ha-tang-bien-hoa` Thứ Hai 09/11/2026 18:00 cho TikTok (bài 418673360, nhãn AI bật vì giọng AI, "nội dung thương hiệu" bật) và Facebook Reel (bài 418673533). Link Drive dùng trực tiếp được, không cần nối Drive trong Metricool. Sheet dòng 4 = "Đã lên lịch".

- [x] 06/11/2026 kế hoạch 03 (`docs/superpowers/plans/2026-11-06-03-landing-crm.md`): landing lên mạng tại https://bcons-central-park-dsj.pages.dev (Cloudflare **Pages**, tự build khi push `main`; `siteUrl`, `fanpageUrl` đã điền). Apps Script gắn Sheet CRM (tab Landing) nhận form + báo Telegram 2 tin; anh đã gửi thử, chạy ổn. Fanpage: https://www.facebook.com/profile.php?id=61596313797415. 134 test qua.
- [x] 06/11/2026: bot laptop lưu 3 caption viết lại (bỏ khuôn ✅) + `docs/quy-tac-caption.md` + dòng CLAUDE.md (commit 0e34f86); em soát, `check:caption` OK, đã chép 3 caption mới vào Sheet Lịch nội dung (vẫn "Chờ duyệt").
- [x] 06/11/2026: nghiên cứu nhạc nền/hiệu ứng: đề xuất ghép nhạc (Pixabay, giấy phép thương mại; nhỏ dưới giọng, tự giảm khi có lời) + hiệu ứng (tạo bằng ElevenLabs Sound Effects) ngay trong Remotion, xuất thêm bản không nhạc. Không khuyên tải clip TikTok có nhạc đăng Facebook (logo TikTok bị giảm hiển thị, nhạc TikTok chỉ cấp phép trên TikTok). Metricool chỉ thêm nhạc Top 100 TikTok khi tài khoản Business + tự đăng.

- [x] 06–07/11/2026 kế hoạch 05 (`docs/superpowers/plans/2026-11-06-05-video-am-thanh-phu-de.md`): A storyboard có hình trước khi tạo giọng (`npm run storyboard`, bot `/storyboard`, cổng 2 gồm hình); B phụ đề (ký hiệu %, vừa 2 dòng, nhấn số, `npm run phu-de`); C vệt sáng quanh ranh bản đồ (`vienChay`); D nhạc nền (Drive `am-thanh/nhac`) + hiệu ứng ElevenLabs (`/sfx`, Drive `am-thanh/sfx`), `/render <số> khongnhac`; E tên Tuấn Trương + QR (mở landing `/QR`), cảnh cuối tự cân; F đáp án PTTT từ 5 PDF CĐT (`nguon/pttt-cdt.json`, test landing khớp 100%, `/kiemgia`); G `/gemini` (Gemini 3.1 Pro + tìm Google). Anh đổi quy tắc 7: video có tên + QR, landing nút Gọi/Zalo, caption được ghi SĐT của anh.
- [x] 07/11/2026: chuẩn hóa số trên màn hình (ITN, `docs/quy-tac-so-phu-de.md`, `scripts/itn.mjs`, lint chặn), đã sửa 6 video cũ không tạo lại giọng. Video có số cố định 1–6 + tiêu đề; bot chọn video bằng số hoặc nút (`/render` trơn hiện danh sách). Tên video mới: `<số>-<vài chữ>`.
- [x] 07/11/2026: PC cài xong ở `E:\Claude\bcons`. Drive sắp xếp lại (`data/<mã>/gia`, `data/<mã>/tai-lieu-cdt`, `am-thanh/`, `video/`, `bot/`, `_luu-tru/`, `DOC-TRUOC.md`); code đọc dữ liệu dùng chung từ Drive (`findDriveRoot`, `sharedDir`). Bot: máy mở sau chờ, `/chuyenmay`, máy chờ tự nhận việc; `/capnhat` tắt bot rồi `Bcons-Bot.cmd` cập nhật (tránh khóa file Windows). Laptop đã lên bản `97ad9e7`.
- [x] 07/11/2026: docs có dòng Trạng thái + mục lục `docs/README.md` + test docs tự động; cài skill find-skills, frontend-design, impeccable, test-driven-development. 198 test qua.

- [x] 07/11/2026 tối: bot **tự cập nhật** khi mở và khi nhận việc lúc chuyển máy; `/capnhat` tắt bot để `Bcons-Bot.cmd` + `scripts/bot/capnhat.cmd` cập nhật (tự cất file sửa dở vào git stash, tự ghép bản lưu chưa lên GitHub), báo "đã cập nhật"/"đã là bản mới nhất". Laptop đã lên bản mới (`3cbb800`), đã đẩy báo cáo `/gemini` lãi suất tháng 11 (`nguon/gemini/2026-11-07-...`, chưa kiểm link; Gemini không trả danh sách trang Google, đã thêm cảnh báo). 202 test qua.

- [x] 07–08/11/2026 (phiên dài trên cloud):
  - Bot: menu lệnh Telegram; menu tick chọn 1/nhiều/tất cả video; `/giong <số> canh<n>` tạo lại riêng một cảnh; `/gemini` có nút 🎬 "Làm video từ kết quả này" (Claude làm cổng 1 rồi dừng); `/duyet` chỉ gửi chữ caption (không gửi lại video, hết lỗi >50 MB). PC đã khai báo git (user Marz), tự cập nhật OK.
  - Gemini: chạy được trên cloud (key trong Network secrets, `NODE_USE_ENV_PROXY=1`, gọi stream + tóm tắt suy nghĩ để proxy không cắt sau 30 giây), tự hỏi lại khi không tìm Google, đổi link chuyển hướng Google về link gốc, thay link Gemini tự bịa trong bảng bằng link thật. Prompt mới: bắt tìm Google, trích nguyên văn, ghi kỳ số liệu. Báo cáo lãi suất tháng 11 đã kiểm (`nguon/gemini/2026-11-07-...-KIEM.md`): bản đầu bịa 9/10 link.
  - Video 7 `07-lai-vay-ha-nhiet` (lãi vay tháng 10: Vietcap 9–10,7%, thả nổi 12–15%, NHNN giảm lãi; trần 6,9% PTTT 03/04): đủ 4 cổng, đã render, duyệt.
  - Giọng: cài đặt cố định stability 0.85 / similarity 0.9 / style 0.2 (hết trôi giọng Bắc), test `giong-doc.test.mjs` chặn đổi lại.
  - Phụ đề: số 1–9 cũng hiện chữ số khi đếm; hết dính chữ ở từ đang đọc.
  - Thiết kế: bộ phong cách mặc định `moi` (A ảnh dự án / B bản tin sáng / C khối màu, xoay theo số video), video 1–7 đã chuyển sang; các kiểu thử `banve`, `tapchi`, `bangls` giữ làm lựa chọn. Góc video chỉ còn QR, tên + QR ở cảnh cuối. Nhạc to hơn lúc đọc (0,16). Kho hiệu ứng 11 file (đã tạo bằng `/sfx` 07/11, có trên Drive). `DESIGN.md`, `PRODUCT.md`.
  - Thư mục video đổi tên `<số>-<tên>` (01–07), Sheet cập nhật theo. Drive: Newsky dời vào `data/bcons-newsky/`, video test vào `_luu-tru/video-test/`, `DOC-TRUOC.md` viết lại; 30 bài nhạc nền.
  - Storyboard bản đồ chụp được trên cloud (`REMOTION_GL=swangle`).
  - Quy tắc mới trong `CLAUDE.md`: bị chặn mạng thì dừng báo host; nguyên tắc "No AI Slop"; thiết kế mới phải đưa ảnh mẫu trước.
  - Metricool: 10 bài đã lên lịch (FB Reel + TikTok): CN 8/11 video 7 (10:00), T2 9/11 video 4 (FB 12:00, TikTok 18:00; caption FB viết lại kiểu kể chuyện, anh duyệt), T3 10/11 video 5, T4 11/11 video 3, T5 12/11 video 6. Giờ theo số liệu giờ cao điểm Metricool. 2 bản nháp video 4 cũ còn trong Metricool (không đăng). 228 test qua.
  - Kho hiệu ứng: anh chạy `/sfx`, Drive `am-thanh/sfx` đủ 11 file.
  - `/kiemgia` báo "không thấy sheet": Master File gộp cột giá "PTTT 02 / 03" và "04 / 05"; sửa `kiem-masterfile.mjs` đọc cột gộp, chỉ lấy giá chưa VAT (bỏ đơn giá, có VAT, phí bảo trì, chênh lệch), thêm test theo tiêu đề thật. 229 test qua.

## Đang làm
- [x] (đã xong 05/11: đã tạo lại giọng 2 video mới, anh nghe được) Giọng cảnh 2 bị lệch giọng cũ (nghe như miền Bắc, giọng gốc là `vi-southern`, giọng nhân bản). Đã tạo 4 bản thử trong `engine/remotion/audio-test/` (không lên git), chờ anh nghe và chọn; sau đó tạo lại 4 cảnh, render lại, commit. Bản đã commit vẫn là giọng cũ.
- [ ] Kiểm tra cách đọc FDI ("F D I") và Bcons Central Park ("Bee Cons Central Park") sau khi tạo lại giọng; em chưa nghe được.
- [ ] Kịch bản video đợt 2 (giới thiệu ngày 29/11/2026) trong `du-an/bcons-central-park/video/dot-2/kich-ban.md`. Bản nháp, chờ anh duyệt.
- [ ] Anh hoàn tất tạo fanpage: tải `cover.jpg` và `avatar.jpg`, nút "Nhắn tin", thêm quản trị viên dự phòng, bật xác thực 2 lớp, cài Meta Business Suite > Hộp thư > Tự động hóa theo `messenger-kich-ban.md`, thử bằng tài khoản khác, duyệt và đăng 5 bài đầu.

- [x] Superpowers: đã chép 5 skill vào `.claude/skills/` (commit gốc `bb92a77`), chưa commit; mở phiên mới để dùng. ECC: anh quyết định không cài (04/11/2026). `/plugin` không chạy trong PowerShell/app.
- [x] Quyết định 04/11/2026: bỏ CTA đọc/hiện số điện thoại; cuối video chỉ chạy thông tin dự án. Nếu sau này muốn dùng số, cần xác nhận quy định TikTok/Meta và công ty (hotline công ty an toàn hơn).
- [ ] Anh duyệt `docs/quy-trinh-video.md`. Hai file prompt cũ vẫn untracked (có chứa SĐT cá nhân), chưa commit.

- [ ] Anh xem trọn 2 video mới (`05-cho-thue-kcn-bien-hoa`, `06-tai-thiet-kcn-bien-hoa-1`) trước khi đăng. Lưu ý cho video B: Aeon Mall đang là **điểm tạm anh chọn** (10.927817, 106.835207), ghi "gần đúng"; vùng 21,5 / 44 / 286 / 51,6 ha là hình tròn minh họa (nét đứt), không phải ranh thật. Ranh OSM lệch số chính thức (Amata -19%, Biên Hòa 1 -11%) và chưa đối chiếu hồ sơ chủ đầu tư.
- [ ] Cần tọa độ/ranh thật của Aeon Mall và, nếu có, ranh quy hoạch thật của các vùng 44/286/21,5/51,6 ha (GeoJSON/KMZ). Có thì sửa `scripts/build-geo.mjs` và bỏ `geo:derive` cho các vùng đó.
- [ ] Thử thêm cơ chế tự thử lại 2-3 lần cho mỗi khu trong `geo-fetch.mjs` (Overpass hay quá giờ). Gắn nhãn km đã có; chưa kiểm cách đọc BIDV, FDI sau khi tạo lại giọng (anh đã nghe được giọng).

## Chưa làm
- [ ] `/capnhat` rồi `/kiemgia` lại (đã sửa lỗi đọc cột), gửi kết quả cho em. Thử `/chuyenmay`. Laptop: thêm `TEN_MAY=Laptop` vào `.env` (đang hiện tên Windows "Marz").
- [ ] CN 8/11 và các ngày tới: kiểm Metricool đã tự đăng (TikTok + FB Reel) từng bài 8–12/11; cập nhật Sheet "Đã đăng" + link. Sau đó viết kế hoạch 04 (báo cáo tuần: lượt xem, bình luận, lượt quét QR `utm_source=qr`).
- [ ] Từ 13/11 chưa có bài: làm video 8 (`/gemini <chủ đề>` → 🎬, hoặc nhắn chủ đề). Video đợt 2 (29/11) từ `video/dot-2/kich-ban.md`.
- [ ] Các cảnh bản đồ / route-map / compare-bars vẫn mẫu cũ, chỉ đổi màu theo bộ `moi`; anh thấy lệch phong cách thì làm lại riêng cảnh đó (đưa ảnh mẫu trước).
- [ ] Xóa 2 bản nháp video 4 cũ trong Metricool Planner (tùy anh). Video 1, 2 chưa render/duyệt bản mới, chưa lên lịch.
- [ ] Cloud: biến môi trường giữ `REMOTION_MAPBOX_TOKEN`, nên xóa `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `TELEGRAM_*` (khóa tiêu tiền không cần trên cloud). Phiên mới mới có Mapbox để em chụp storyboard bản đồ.
- [ ] Anh gắn link landing: bio TikTok `?utm_source=tiktok`, nút fanpage `?utm_source=facebook`, bình luận đầu bài `?utm_source=fb-post`.
- [ ] Anh duyệt caption bài 5 (cho thuê) và 6 (tái thiết). Bài cho thuê: lợi suất 4,4% chưa rõ kỳ dữ liệu.
- [ ] Video đợt 2 (29/11/2026): kịch bản nháp `video/dot-2/kich-ban.md`, làm theo quy trình mới, sẽ là video số 7.

- [ ] Xác nhận cao tốc Biên Hòa - Vũng Tàu giai đoạn 1 đã thông xe 18/05/2026 chưa; khoảng cách từ 236 Phan Trung tới các tuyến chưa đo; Dat Xanh/PropertyGuru chỉ dựa một bài VnExpress.
- [ ] Việc nhỏ hoãn lại: tên file xuất của render-drive chưa kiểm tra (shell:true), CompareBars lỗi NaN khi mọi giá trị bằng 0, key React có thể trùng, chưa có watermark DRAFT, chưa có kiểm tra số điện thoại bằng regex, `.env` nạp trước cổng trong render-drive. `package.json` engines `^20.19` nhưng cần Node >= 22.18 (type stripping khi test).
- [ ] Hình tuyến cao tốc Bến Lức - Long Thành thật và ranh giới Biên Hòa / khu thương mại tự do Long Thành: máy chủ OpenStreetMap không trả dữ liệu ngày 04/11, Mapbox Directions không đi qua cao tốc này. Hiện bản đồ dùng tuyến thẳng và tam giác **minh họa**. Cần dữ liệu chính thức (GeoJSON) hoặc thử lại OSM sau.
- [ ] Bổ sung link/ngày nguồn gốc cho 5 số trong `du-an/bcons-central-park/video/01-dong-nai-ha-tang/kich-ban.md` (video cũ làm trước khi có bảng nguồn; hiện ghi "chưa có link").
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
5. ~~PTTT 01~~: đã đối chiếu đủ 5 PDF PTTT của CĐT 07/11/2026 (khớp công cụ tính). PTTT 05 ghi "Quý I/2029" là CĐT ghi nhầm, anh xác nhận Quý II/2029. (PTTT 03: anh xác nhận 04/11/2026 là bản mới nhất.)
6. Đợt 2 mở những căn nào (236 căn đang CĐT lock có phải là căn mở ở đợt 2 không)? Ảnh hưởng đến việc nhắn "còn bao nhiêu căn".
7. Phối cảnh, ảnh nhà mẫu: anh nói cứ dùng cho fanpage; TVC (`TVC Bcons Central Park.mp4`, 570MB) có được dùng để cắt video ngắn không thì chưa hỏi.
8. Tên và số liên hệ trên trang: có dùng hotline công ty không? Giờ làm việc tư vấn viên?
9. VAT 10% trên giá căn hộ có đúng với cách CĐT thu không (xem mục Chưa làm)?

## Ghi chú kỹ thuật
- Windows: bot đang chạy giữ file code của nó nên `git pull` lỗi "unable to unlink". Từ `97ad9e7`, `/capnhat` thoát mã 4 để `Bcons-Bot.cmd` cập nhật lúc bot tắt (`scripts/bot/capnhat.cmd`, log `out/tam/capnhat.log`).
- Khóa ElevenLabs cần quyền Sound Effects cho `/sfx` (anh đã bật 07/11). Cloud không vào được ai.google.dev dù đã mở mạng (có thể cần phiên mới).
- Bot laptop: nút "Lưu lên GitHub" chạy `git pull --rebase`; nếu GitHub có bản mới của chính file bot thì Windows có thể không cho thay file (06/11 lỗi "unable to unlink ... Invalid argument", để lại file chép dở làm lần sau báo "untracked files would be overwritten"). Cách xử lý: đóng cửa sổ bot, xóa các file chép dở trong danh sách báo lỗi, `git pull --rebase --autostash`, `git push`, mở lại bot. Laptop có thể còn thay đổi cục bộ từ autostash, kiểm `git status` khi tiện.
- MCP `context7`/`playwright` (`docs/huong-dan-mcp.md`): không bắt buộc, chưa cài trên laptop; skill `tdd-financial-calc` bỏ (calc.mjs đã có test đối chiếu TraGia).
- Cloud không gọi được script.google.com và help.metricool.com (proxy chặn).
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
