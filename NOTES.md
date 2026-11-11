# NOTES.md — Nhật ký và việc cần làm

Cập nhật lần cuối: 11/11/2026 (Master_Data: đồng ý theo dự án, báo cáo, hướng dẫn)

## Đã làm
Việc đã xong chuyển sang `docs/nhat-ky.md` (lịch sử). Chỉ ghi ở đây việc xong trong phiên gần nhất; lệnh "Off" dời xuống nhật ký khi quá 15 dòng.

## Đang làm
- [x] 11/11/2026 Phiếu tính gửi khách: `/phieu <mã căn> <PTTT> [pdf]` trên bot (PNG 1080 px + PDF), lệnh bấm được `/phieu_...` trong tin báo khách từ landing (Apps Script có dòng "Dựng phiếu tính"), `npm run phieu`, `npm run phieu:mau` (6 phiếu kiểm UX). Lõi tính đọc lịch đợt từ `nguon/pttt-cdt.json` (Central Park và Newsky). Template hiện là bản tạm của em; chờ bản của AGY rồi anh duyệt (spec `docs/superpowers/specs/2026-11-11-phieu-tinh-design.md`).
- [x] 11/11/2026 Landing Bcons Newsky (thiết kế AGY) đã tích hợp vào `du-an/bcons-newsky/landing/`: máy tính dùng lõi `calc.js` có test, form gửi thật về Apps Script, bỏ bản đồ Google nhúng và câu tiện ích chưa có nguồn. Dựng: `npm run landing -- --du-an bcons-newsky` (`--nhap` để xem thử khi chưa có `formUrl`).
- [ ] 11/11/2026 Master_Data (kho khách tập trung): code Apps Script (`engine/master-data/`) dựng xong và test xanh trên máy, **chưa cài lên Sheet thật nào**.
  - Đã có: đồng ý theo từng dự án, rút lại giữ hồ sơ (`TuChoi` loại Rút lại/Xóa), điền lại form mở nhắn lại, khách chưa có mã ở lại `KhachHang`, giá trị lạ ở `DongYNhanTin` bị chặn nhắn và ghi `Loi`.
  - Anh làm: đi `docs/huong-dan-master-data.md` từ G1, duyệt G1–G6 bằng "OK" (G4 trên Sheet landing THẬT, có Bước 0 sao lưu).
  - Anh quyết còn lại: chữ trang chính sách landing (rút lại vs xóa), có gán dự án cho khách landing cũ hay không, "NGỪNG"/"dừng nhắn" là Rút lại và "xóa dữ liệu" là Xóa (chốt với pháp chế).
  - Thiết kế: mục 16 của `docs/superpowers/specs/2026-11-11-master-data-khach-hang-design.md`.
- [ ] Cần anh: (1) dán lại `engine/landing/apps-script/Code.gs` vào Apps Script landing Central Park rồi đăng lại; (2) landing Newsky đã đăng tại https://bcons-newsky-53r.pages.dev/ (Cloudflare Pages; build `node engine/landing/build.mjs --du-an bcons-newsky`, output `engine/landing/dist/bcons-newsky`); Newsky dùng chung Apps Script và Sheet với Central Park (đã điền `formUrl`, script phân biệt theo cột Dự án); (3) trên bot `/capnhat`, thử `/phieu A21-26 03 pdf`; (4) giao AGY lời giao việc phiếu trong spec; (5) mở Master File Newsky sửa ô D4 thành "Vị trí" nếu muốn.
- [ ] Landing Newsky chưa có mã căn trong form (máy tính theo khung giá), nên tin báo khách Newsky chưa có dòng lệnh `/phieu_...`; muốn có thì cần ô chọn căn thật. Khung giá 2PN/3PN trong `landing.json` là số AGY đưa, em chưa đối chiếu lại Master File.
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

- [ ] Video 8 `08-cuoi-nam-ve-dich` (anh chọn góc 09/11/2026): cổng 1 xong, đang ở cổng 2. **Chờ anh gửi tọa độ Google Maps của nút giao Tân Hiệp và nút giao Tân Vạn** (Overpass không trả, Mapbox chỉ ra tên khu vực). Chưa đo khoảng cách nút giao Tân Hiệp tới dự án, không nói "sát dự án".
- [ ] Phiên "Landing Bcons" (landing nhiều dự án): chờ anh OK kế hoạch (Mapbox vệ tinh, bỏ file UQ, 5 tháp, OpenFreeMap) và tạo token Mapbox `pk.` mới cho web (giới hạn URL `https://bcons-central-park-dsj.pages.dev`) rồi gửi. Chưa có thay đổi nào chưa lưu trên GitHub.
- [ ] Hạn mức Claude: lúc kiểm (09/11) phiên landing và phiên ảnh báo hạn mức 7 ngày đã vượt, đang dùng phần vượt mức. Hạn chế mở thêm phiên song song.
- [ ] Dự án Bcons Newsky (11/11/2026): đã dựng `du-an/bcons-newsky/` (project.json, thong-tin.md, nguon/pttt-cdt.json: PTTT 08/09/10 của CĐT) từ tài liệu CĐT. Còn thiếu, hỏi anh: tọa độ và số nhà, số căn ở/thương mại, tình trạng khởi công, lịch mở bán, bảng giá tóm tắt, tên kênh, SĐT; chưa đổi `config.json`. Master File Newsky v2 (dựng từ khung Master File Central Park: 12 sheet gồm GHC, VayNH, HoaHong; tháp B 200 căn, 3 PTTT; hỗ trợ bổ sung theo TB 206) ở Drive `Bcons/data/bcons-newsky/gia/MasterFile_BconsNewsky.xlsx`; GHC Newsky = tab DS_CĂN; đã đọc slide kick-off và training: metro/QL13 và bảng tăng trưởng giá lỗi thời, không dùng. Hoa hồng cơ bản Newsky chưa có. Đơn vị cọc của anh trên GHC: BCONS PS. File giá CĐT là nguồn giá chính xác nhất (hơn slide/training).
- [ ] Antigravity (AGY) (11/11/2026, anh chốt lại): chạy ở `E:\Claude\bcons-agy`, chỉ `git pull` và đọc repo, không commit/push, trả kết quả ở Drive `Bcons/agy/den-claude/`; anh tự tạo skill, giao việc và làm UX/UI với AGY; Claude chỉ kiểm nội dung và code (`/agy-doc`). Đã kiểm xong: Zalo 05/07/08, landing v2 (anh không chọn A hay B), nghiên cứu Bình Dương (`kiem-toan/`); `vov.vn`, `laodong.vn` chưa kiểm được.
- [ ] Master_Data, việc kỹ thuật còn lại: (1) chưa kiểm thật trên Google: mã lỗi LOI_* theo chữ lỗi Google, nhãn giao diện Apps Script tiếng Việt; (2) trang landing thử `--nhap` (bước G2.5), chờ anh gửi link /exec; (3) gõ `Không` lên hồ sơ đang bị `Xóa` cùng lượt thì hồ sơ điền lại sau đó chỉ biết ngày dòng `Xóa`; (4) mọi loại lỗi báo Telegram (`LOI_TUCHOI`, `LOI_DONG_Y`...) dùng chung một khóa chống lặp 6 giờ.
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
- Dữ liệu nội bộ (`data/`, xlsx) và video render (`.mp4`): thư mục Drive riêng tư "Bcons" (id `1yzMS8oTXBiBv4RvgIUScsj_XxYkZiWux`), kèm file `HUONG-DAN-CAI-MAY-THU-HAI.md`.
- API key ElevenLabs: chỉ trong `engine/remotion/.env` trên từng máy, không đưa lên git/Drive.
- Máy laptop này có Google Drive for desktop ở ổ `G:` (`G:\My Drive\Bcons\`). Máy khác cần cài Drive for desktop; nếu Drive ở đường dẫn khác, đặt `DRIVE_VIDEO_DIR` trong `engine/remotion/.env`.
- Thư mục Drive `video/` đã có `bcons-central-park-map.mp4` và `bcons-tuan-final.mp4` do anh tự thêm (không phải do em render, em không đụng tới).
- Còn chưa rõ: `data/bang-gia.csv` đã có trong thư mục Drive `data/` chưa, và thư mục `data/` cục bộ không có trên máy dùng phiên này.
- Quy trình render hằng ngày: `cd engine/remotion && npm run render:drive -- <tên-video>` (thêm tên file mp4 làm tham số thứ hai nếu muốn lưu tên khác). Lệnh này ghi đè file cùng tên trong Drive.
- Video Remotion: số liệu (2,4 tỷ USD FDI, 8.200 ha, 16 tỷ USD, 150.000, 50.000, cao tốc khai thác 01/10/2026) lấy từ yêu cầu của anh, chưa đối chiếu tài liệu chủ đầu tư. Duyệt trước khi đăng.
- Bản đồ cảnh 2 là sơ đồ minh họa, vị trí ước lượng.
- Key ElevenLabs hiện không có quyền `Models`; đã bật `Models` Access nên liệt kê model được. Model trong tài khoản hỗ trợ tiếng Việt: `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_turbo_v2_5`, `eleven_flash_v2_5`.
- Phiên 04–05/11/2026 làm trên nhánh `claude/peaceful-carson-qnjpwr` (theo yêu cầu của môi trường đám mây), không phải nhánh trong `CLAUDE.md`; đã push, không tạo PR. Container đám mây không có `data/`, `.env`, node_modules.
- Công cụ cho Facebook/TikTok: không có connector đăng bài hay điều khiển Messenger. Có `tiktok`, `TikTok for Business`, Meta Ads (đứt kết nối từng lúc), Canva (chưa bật trong phiên), Google Drive/Sheets/Docs. Connector Drive chỉ nhận nội dung nhỏ khi ghi file (base64 nằm trong lệnh).
- Nhận lệnh "Off" để tự cập nhật notes, commit, push (xem `CLAUDE.md`).
