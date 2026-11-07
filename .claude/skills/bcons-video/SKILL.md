---
name: bcons-video
description: Làm video cho dự án đang bán (config.json) theo chủ đề, từ số liệu có nguồn đến file mp4, có 4 cổng chờ anh duyệt
argument-hint: [chủ đề cần làm] [--du-an <mã>]
---

Chủ đề anh giao: **$ARGUMENTS**

Em chạy quy trình video cho dự án `<mã>`: lấy từ `--du-an <mã>` trong chủ đề nếu có, không thì `duAnDangBan` trong `config.json` (hiện là `bcons-central-park`). Mọi file của video nằm trong `du-an/<mã>/video/<name>/`; lệnh `npm` chạy trong `engine/remotion/` và thêm `--du-an <mã>` nếu khác dự án đang bán. Đọc trước: `CLAUDE.md`, `docs/quy-trinh-video.md`, `du-an/<mã>/project.json`, `du-an/<mã>/thong-tin.md`, `docs/superpowers/specs/2026-11-04-bcons-video-pipeline-design.md`. Nói chuyện tiếng Việt, em xưng "em", gọi người dùng là "anh".

## Nguyên tắc không được phá
- **Cổng 3 và 4 chỉ chạy trên máy anh** (có `engine/remotion/.env`). Nếu đang ở cloud (`CLAUDE_CODE_REMOTE=true`): làm xong cổng 1–2 (và storyboard), commit/push, rồi dặn anh `git pull` trên máy để chạy `npm run voice` / `npm run render:drive`.
- **Dừng ở mỗi cổng và chờ anh trả lời.** Không tự đi tiếp sang bước sau, dù anh đã duyệt cổng trước (mỗi cổng là một lần duyệt riêng). Không "one-click".
- Không bao giờ tự đặt `status: "approved"` trong spec. Chỉ đặt khi anh nói rõ đã duyệt chữ và số liệu ở cổng 2.
- Không gọi ElevenLabs (`generate-voice.mjs`) khi anh chưa đồng ý tốn credit ở cổng 3.
- Không đăng video, không chép lên Drive khi anh chưa duyệt (cổng 4 là bước render + chép Drive, chỉ làm sau khi anh nói "render").
- Số liệu lấy từ nguồn chính thống (sbv.gov.vn, gso.gov.vn, chinhphu.vn, dongnai.gov.vn, vneconomy.vn, cafef.vn, vnexpress.net, baodongnai.com.vn, baodautu.vn, vars.vn...) hoặc từ `du-an/<mã>/thong-tin.md`. Mỗi số phải có **ngày công bố, tên nguồn, link gốc**. Thiếu thì ghi "chưa có" và hỏi lại, không đoán.
- Số trong ví dụ của hai file prompt cũ (85 triệu/m², 49,9 triệu/m², 6,2%, "tiết kiệm 60%") không có nguồn: không dùng.
- Quy tắc nội dung (CLAUDE.md): không cam kết lợi nhuận, không hứa tăng giá, không so sánh dự án khác bằng số không nguồn, không nói "sắp hết" khi chưa kiểm tra tình trạng căn, không quảng cáo căn "CĐT LOCK", căn đã cọc là đã bán, không bán cho người nước ngoài. Nhắc giá thì nói rõ chưa VAT/có VAT và phí bảo trì 2%. Số lượng: 2.820 căn ở + 113 căn thương mại.
- Cảnh cuối: thông tin dự án + khối tên và QR (tự thêm khi render từ `project.json` → `watermark`). Không đọc SĐT, không ghi SĐT dạng chữ trên video (caption thì được ghi số của anh).
- Cảnh có thông tin địa lý dùng mẫu `geo-map` (xem `du-an/bcons-central-park/assets/geo/NGUON.md`, ví dụ `du-an/bcons-central-park/video/dong-nai-ha-tang-map/spec.json`). Điểm phải có tọa độ có nguồn (anh cung cấp từ Google Maps hoặc nguồn chính thức), ghi vào bảng nguồn. **Không vẽ tuyến hay ranh giới giả cho giống thật**: lớp chưa có dữ liệu chính thức phải đặt `kind: "illustrative"` (nét đứt, nhãn minh họa) và `note` nói rõ là sơ đồ minh họa. Bản đồ cần token Mapbox: `MAPBOX_TOKEN_KEY` trong `engine/remotion/.env`; kiểm bằng `npm run check:mapbox`; xem thử một khung bằng `npm run still -- BconsCentralPark out/tam/x.png --frame=N --props=<file> --gl=angle`. Chú thích "© Mapbox © OpenStreetMap" luôn hiện (đã có sẵn trong mẫu).

## Xác định đang ở giai đoạn nào
Dựa vào file trên đĩa, không hỏi lại những gì đã có. Slug `<name>` (a-z, 0-9, gạch ngang) do em đề xuất ở cổng 1 và anh duyệt.
- Chưa có `du-an/<mã>/video/<name>/kich-ban.md` → bắt đầu từ **Cổng 1**.
- Có `du-an/<mã>/video/<name>/kich-ban.md` nhưng chưa có `du-an/<mã>/video/<name>/spec.json` → **Cổng 2**.
- Có spec `draft`, anh chưa duyệt → chờ cổng 2.
- Spec `approved`, chưa có `du-an/<mã>/video/<name>/timestamps.json` → **Cổng 3**.
- Có timestamp, chưa có mp4 trong `engine/remotion/out/video/` → **Cổng 4**.
Nếu `$ARGUMENTS` trống hoặc trùng tên một video có sẵn, hỏi anh muốn làm tiếp video nào hay làm chủ đề mới.

## Cổng 1 — Số liệu và góc làm
1. Nguồn dữ liệu: nếu anh dán/đính kèm kết quả Gemini Deep Research (prompt ở `docs/prompt-gemini-nghien-cuu.md`) thì dùng nó; nếu không, tự tìm web theo chủ đề.
2. **Mở từng link gốc và đối chiếu từng con số** (WebFetch). Loại số không có nguồn/ngày/link, hoặc link không chứa số đó. Ghi rõ số nào đã kiểm, số nào loại và vì sao.
3. Xuất bảng: nhóm | số liệu | ngày công bố | nguồn | link. Đề xuất 2-3 góc làm video (45-60 giây) và một slug.
4. **DỪNG. Hỏi anh chọn góc và slug.**

## Cổng 2 — Kịch bản và spec
1. Viết `du-an/<mã>/video/<name>/kich-ban.md` gồm: kịch bản 45-60 giây theo cảnh, mục `## Bảng nguồn` (cột đầu là id; bảng gồm id | số liệu | ngày công bố | nguồn | link) và danh sách kiểm tra mục 3 của `docs/quy-trinh-video.md` đã tick từng dòng.
2. Viết `du-an/<mã>/video/<name>/spec.json` với `"status": "draft"`. Mẫu cảnh: `stat-hero`, `route-map`, `data-cards`, `compare-bars`, `geo-map` (bản đồ Mapbox thật cho thông tin địa lý), `project-close` (schema ở `engine/remotion/src/spec.ts`, ví dụ ở `du-an/bcons-central-park/video/dong-nai-ha-tang/spec.json`). Mỗi giá trị số có `sourceId` trỏ tới bảng nguồn. Lời bình dùng cú pháp `hiển-thị{đọc}`; `cues` trỏ tới chữ hiển thị sẽ được đọc. Chữ hiện dùng ký hiệu, chữ đọc trong ngoặc: `90%{chín mươi phần trăm}`, `USD{đô la Mỹ}`, `ha{héc-ta}`, `km{ki-lô-mét}` (lint chặn chữ hiện "phần trăm"). Chữ cần nhấn trong phụ đề ghi ở `nhan` của cảnh (số tự nhấn).
3. Viết `du-an/<mã>/video/<name>/caption.md` (`status: draft`, phần `## Facebook` và `## TikTok`) theo `docs/quy-tac-caption.md` (ưu tiên hơn khuôn của skill `real-estate-content-creator`), chỉ dùng số đã có trong bảng nguồn. Định dạng: `docs/huong-dan-dang-bai.md` và kế hoạch `docs/superpowers/plans/2026-11-06-02-lich-dang-bai.md`.
4. Chạy `cd engine/remotion && npm run check:spec -- <name>`, `npm run check:caption -- <name>` và `npm run lint`; sửa tới khi qua. Thêm dòng vào Sheet Lịch nội dung (id trong `project.json` → `lichNoiDungSheetId`, tab `LichDang`): Mã bài = `<name>`, Luồng `video`, Trạng thái `Chờ duyệt`, Caption FB/TikTok.
5. **Storyboard có hình (anh đổi thứ tự 06/11/2026: duyệt hình TRƯỚC khi tốn credit giọng).** Viết `du-an/<mã>/video/<name>/storyboard.md` (từng cảnh: lời đọc, chuyển động, chữ nhỏ cố định, dữ liệu cần có). Chụp hình: cảnh không bản đồ em chạy `REMOTION_BROWSER=/opt/pw-browsers/chromium npm run storyboard -- <name>` trên cloud và gửi ảnh cho anh; video có bản đồ thì dặn anh nhắn bot `/storyboard <name>` (máy anh có Mapbox). Thời lượng là ước tính khi chưa có giọng.
6. **DỪNG. Đưa anh đọc kịch bản + bảng nguồn + caption + xem storyboard và hỏi: "Anh duyệt chữ, số liệu, caption và hình chưa?"** Chỉ khi anh nói đã duyệt mới đổi spec `status` thành `"approved"` và chạy `npm run duyet:caption -- <name>`. Nếu anh sửa, sửa rồi hỏi lại.

## Cổng 3 — Giọng đọc (tốn credit ElevenLabs)
1. Đọc lại `markup` từ spec đã `approved` (chữ đã duyệt không được đổi sau cổng 2; nếu muốn đổi, quay lại cổng 2).
2. **Hỏi anh: "Anh đồng ý tốn credit ElevenLabs để tạo giọng cho <name> không?"** DỪNG và chờ.
3. Khi anh đồng ý: `cd engine/remotion && node --env-file=.env scripts/generate-voice.mjs <name>`. Báo thời lượng từng cảnh. Nhờ anh nghe thử (`du-an/<mã>/video/<name>/audio/`).
4. **DỪNG.** Chờ anh nói nghe được rồi.

## Cổng 4 — Render và duyệt trước khi đăng
(Storyboard đã duyệt ở cổng 2. Có giọng thật rồi mà cần chỉnh hình: chạy lại `/storyboard <name>`, không tốn credit.)
1. `cd engine/remotion && npm run lint`, rồi `npm run render:drive -- <name>` (có nhạc nền + hiệu ứng + tên/QR; bản không nhạc: `/render <name> khongnhac`; render ra `out/video/<name>.mp4` và chép lên Drive; file tạm (khung thử, log, props) để trong `out/tam/`, không để lẫn vào `out/`).
2. Báo đường dẫn file và thời lượng. **Nhắc: anh xem và duyệt trước khi đăng; em không đăng.**
3. Anh xem xong và ưng: anh chạy `npm run duyet:video -- <name>` rồi `npm run send:telegram -- <name>` (video + caption về điện thoại). Em cập nhật dòng Sheet: Trạng thái `Đã duyệt`, Duyệt lúc (lấy `duyetLuc` trong caption). Đăng theo `docs/huong-dan-dang-bai.md`.
4. Cuối phiên nhắc anh gõ "Off" để cập nhật NOTES.md và commit.
