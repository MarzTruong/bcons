---
description: Làm video Bcons Central Park theo chủ đề, từ số liệu có nguồn đến file mp4, có 4 cổng chờ anh duyệt
argument-hint: [chủ đề cần làm]
---

Chủ đề anh giao: **$ARGUMENTS**

Em chạy quy trình video của dự án Bcons Central Park. Đọc trước: `CLAUDE.md`, `docs/quy-trinh-video.md`, `docs/bcons-central-park.md`, `docs/superpowers/specs/2026-11-04-bcons-video-pipeline-design.md`. Nói chuyện tiếng Việt, em xưng "em", gọi người dùng là "anh".

## Nguyên tắc không được phá
- **Dừng ở mỗi cổng và chờ anh trả lời.** Không tự đi tiếp sang bước sau, dù anh đã duyệt cổng trước (mỗi cổng là một lần duyệt riêng). Không "one-click".
- Không bao giờ tự đặt `status: "approved"` trong spec. Chỉ đặt khi anh nói rõ đã duyệt chữ và số liệu ở cổng 2.
- Không gọi ElevenLabs (`generate-voice.mjs`) khi anh chưa đồng ý tốn credit ở cổng 3.
- Không đăng video, không chép lên Drive khi anh chưa duyệt (cổng 4 là bước render + chép Drive, chỉ làm sau khi anh nói "render").
- Số liệu lấy từ nguồn chính thống (sbv.gov.vn, gso.gov.vn, chinhphu.vn, dongnai.gov.vn, vneconomy.vn, cafef.vn, vnexpress.net, baodongnai.com.vn, baodautu.vn, vars.vn...) hoặc từ `docs/bcons-central-park.md`. Mỗi số phải có **ngày công bố, tên nguồn, link gốc**. Thiếu thì ghi "chưa có" và hỏi lại, không đoán.
- Số trong ví dụ của hai file prompt cũ (85 triệu/m², 49,9 triệu/m², 6,2%, "tiết kiệm 60%") không có nguồn: không dùng.
- Quy tắc nội dung (CLAUDE.md): không cam kết lợi nhuận, không hứa tăng giá, không so sánh dự án khác bằng số không nguồn, không nói "sắp hết" khi chưa kiểm tra tình trạng căn, không quảng cáo căn "CĐT LOCK", căn đã cọc là đã bán, không bán cho người nước ngoài. Nhắc giá thì nói rõ chưa VAT/có VAT và phí bảo trì 2%. Số lượng: 2.820 căn ở + 113 căn thương mại.
- Cảnh cuối: không đọc, không hiện số điện thoại hay tên cá nhân; chỉ thông tin dự án.
- Cảnh có thông tin địa lý dùng mẫu `geo-map` (xem `docs/video/geo-nguon.md`, ví dụ `remotion-video/specs/dong-nai-ha-tang-map.json`). Điểm phải có tọa độ có nguồn (anh cung cấp từ Google Maps hoặc nguồn chính thức), ghi vào bảng nguồn. **Không vẽ tuyến hay ranh giới giả cho giống thật**: lớp chưa có dữ liệu chính thức phải đặt `kind: "illustrative"` (nét đứt, nhãn minh họa) và `note` nói rõ là sơ đồ minh họa. Bản đồ cần token Mapbox: `MAPBOX_TOKEN_KEY` trong `remotion-video/.env`; kiểm bằng `npm run check:mapbox`; xem thử một khung bằng `npm run still -- BconsCentralPark out/x.png --frame=N --props=<file> --gl=angle`. Chú thích "© Mapbox © OpenStreetMap" luôn hiện (đã có sẵn trong mẫu).

## Xác định đang ở giai đoạn nào
Dựa vào file trên đĩa, không hỏi lại những gì đã có. Slug `<name>` (a-z, 0-9, gạch ngang) do em đề xuất ở cổng 1 và anh duyệt.
- Chưa có `docs/video/<name>.md` → bắt đầu từ **Cổng 1**.
- Có `docs/video/<name>.md` nhưng chưa có `remotion-video/specs/<name>.json` → **Cổng 2**.
- Có spec `draft`, anh chưa duyệt → chờ cổng 2.
- Spec `approved`, chưa có `remotion-video/specs/<name>.timestamps.json` → **Cổng 3**.
- Có timestamp, chưa có mp4 trong `remotion-video/out/` → **Cổng 4**.
Nếu `$ARGUMENTS` trống hoặc trùng tên một video có sẵn, hỏi anh muốn làm tiếp video nào hay làm chủ đề mới.

## Cổng 1 — Số liệu và góc làm
1. Nguồn dữ liệu: nếu anh dán/đính kèm kết quả Gemini Deep Research (prompt ở `docs/prompt-gemini-nghien-cuu.md`) thì dùng nó; nếu không, tự tìm web theo chủ đề.
2. **Mở từng link gốc và đối chiếu từng con số** (WebFetch). Loại số không có nguồn/ngày/link, hoặc link không chứa số đó. Ghi rõ số nào đã kiểm, số nào loại và vì sao.
3. Xuất bảng: nhóm | số liệu | ngày công bố | nguồn | link. Đề xuất 2-3 góc làm video (45-60 giây) và một slug.
4. **DỪNG. Hỏi anh chọn góc và slug.**

## Cổng 2 — Kịch bản và spec
1. Viết `docs/video/<name>.md` gồm: kịch bản 45-60 giây theo cảnh, mục `## Bảng nguồn` (cột đầu là id; bảng gồm id | số liệu | ngày công bố | nguồn | link) và danh sách kiểm tra mục 3 của `docs/quy-trinh-video.md` đã tick từng dòng.
2. Viết `remotion-video/specs/<name>.json` với `"status": "draft"`. Mẫu cảnh: `stat-hero`, `route-map`, `data-cards`, `compare-bars`, `geo-map` (bản đồ Mapbox thật cho thông tin địa lý), `project-close` (schema ở `remotion-video/src/spec.ts`, ví dụ ở `remotion-video/specs/dong-nai-ha-tang.json`). Mỗi giá trị số có `sourceId` trỏ tới bảng nguồn. Lời bình dùng cú pháp `hiển-thị{đọc}`; `cues` trỏ tới chữ hiển thị sẽ được đọc.
3. Chạy `cd remotion-video && npm run check:spec -- <name>` và `npm run lint`; sửa tới khi qua.
4. **DỪNG. Đưa anh đọc kịch bản + bảng nguồn và hỏi: "Anh duyệt chữ và số liệu chưa?"** Chỉ khi anh nói đã duyệt mới đổi `status` thành `"approved"`. Nếu anh sửa, sửa spec và kịch bản rồi hỏi lại.

## Cổng 3 — Giọng đọc (tốn credit ElevenLabs)
1. Đọc lại `markup` từ spec đã `approved` (chữ đã duyệt không được đổi sau cổng 2; nếu muốn đổi, quay lại cổng 2).
2. **Hỏi anh: "Anh đồng ý tốn credit ElevenLabs để tạo giọng cho <name> không?"** DỪNG và chờ.
3. Khi anh đồng ý: `cd remotion-video && node --env-file=.env scripts/generate-voice.mjs <name>`. Báo thời lượng từng cảnh. Nhờ anh nghe thử (`remotion-video/public/audio/<name>/`).
4. **DỪNG.** Chờ anh nói nghe được rồi.

## Cổng 4 — Render và duyệt trước khi đăng
1. `cd remotion-video && npm run lint`, rồi `npm run render:drive -- <name>` (render ra `out/<name>.mp4` và chép lên Drive).
2. Báo đường dẫn file và thời lượng. **Nhắc: anh xem và duyệt trước khi đăng; em không đăng.**
3. Cuối phiên nhắc anh gõ "Off" để cập nhật NOTES.md và commit.
