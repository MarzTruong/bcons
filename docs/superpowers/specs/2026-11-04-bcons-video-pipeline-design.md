# Thiết kế: Quy trình `/bcons-video` và thư viện mẫu cảnh có schema (04/11/2026)

Trạng thái: anh đã duyệt (04/11/2026), giao em chọn phương án tốt nhất; cơ chế chặn tự động ở mục 5.5 được giữ. Bước tiếp theo: lập kế hoạch dựng.

## 1. Mục đích và lý do
Anh làm video bất động sản cho Bcons Central Park theo nhiều chủ đề (lãi suất, hạ tầng, thị trường Biên Hòa). Hiện tại:
- Composition `BconsCentralPark` ([Root.tsx](../../../remotion-video/src/Root.tsx)) không nhận props. Chữ, số và hình của 4 cảnh vẽ cứng trong [BconsVideo.tsx](../../../remotion-video/src/BconsVideo.tsx) (ví dụ số `2.4` ở cảnh 1, sơ đồ Bến Lức - Long Thành ở cảnh 2, 3 thẻ số ở cảnh 3).
- Lời bình nằm riêng ở [scenes.mjs](../../../remotion-video/scripts/scenes.mjs). Hai nơi nối nhau bằng `cueFrame(cảnh, "chữ")`: dò chữ hiển thị, đổi lời bình mà không đổi cue thì render báo lỗi.
- Mỗi chủ đề mới đòi bố cục khác, nên không thể chỉ thay chữ trong 4 cảnh cũ.

Mục tiêu: một câu `/bcons-video [chủ đề]` dẫn từ tìm số liệu đến file `.mp4`, có cổng duyệt, và mỗi video mới chỉ cần viết một file spec chứ không phải sửa code cảnh.

## 2. Mục tiêu / không phải mục tiêu / điều phải tránh
Mục tiêu:
- Code định nghĩa schema, mọi tên biến trong spec khớp 100% với component (nguồn chuẩn là code, JSON do code kiểm tra).
- Bố cục thay đổi theo chủ đề bằng cách chọn mẫu cảnh.
- Giữ ElevenLabs (phụ đề từng từ), `npm run render:drive`, composition `BconsCentralPark`.

Không phải mục tiêu:
- Không "one-click" từ cào tin đến render.
- Không dùng `edge-tts`, `props/bcons-latest.json`, composition `RealEstateShortVideo` (anh quyết định bỏ edge-tts 04/11/2026).
- Không tự đăng video.

Điều phải tránh (coi là thất bại dù chạy được):
- Số liệu không có nguồn lọt vào video (xem checklist mục 3 của [quy-trinh-video.md](../../quy-trinh-video.md)).
- Tạo giọng ElevenLabs (tốn credit) khi anh chưa đồng ý.
- Hiện hoặc đọc số điện thoại, tên cá nhân ở cảnh cuối.
- Commit `.env`, `data/`, `*.xlsx`, `*.mp4`.

## 3. Ràng buộc đã xác nhận từ code
- Thời lượng cảnh lấy từ `src/audio-timestamps.json`, file này do `scripts/generate-voice.mjs` tạo cùng `public/audio/<id>.mp3`. Vì vậy **không render được trước khi có giọng**; cổng duyệt phải đặt trước bước tạo giọng, và bản duyệt trước đó là văn bản (kịch bản + bảng nguồn), không phải video.
- Phụ đề từng từ dựa trên timestamp ElevenLabs, ánh xạ từ cú pháp `hiển-thị{đọc}` (`parseMarkup`).
- `npm run lint` = `eslint src && tsc`, phải qua trước khi render.
- `render:drive` render rồi chép lên Google Drive for desktop.

## 4. Quyết định của anh
1. Code ra trước, JSON/spec sinh từ schema của code (anh hỏi và em đề xuất; anh đã đồng ý "ok").
2. Bố cục thay đổi theo chủ đề.
3. Phải có bước duyệt thông tin và kịch bản trước khi tạo giọng và render.
4. Bỏ edge-tts.
5. Dùng Gemini Deep Research cho Bản 1 (thu thập), Claude kiểm chứng.

## 5. Thiết kế

### 5.1 Spec video và thư viện mẫu cảnh
- Một file spec cho mỗi video (vị trí đề xuất: `remotion-video/specs/<tên>.json`), mô tả mảng `scenes`. Mỗi cảnh: `template`, `props`, `markup` (cú pháp `hiển-thị{đọc}` giữ nguyên) và các `cues` đặt tên (khóa → chữ hiển thị) để gắn hiệu ứng vào từ được đọc.
- Schema bằng zod, đặt trong code; Remotion nhận qua `schema` + `--props`/`calculateMetadata`. Spec sai schema thì lint/render báo lỗi rõ.
- Mẫu cảnh ban đầu (tách từ code hiện có):
  - `stat-hero`: tiêu đề + một số nổi bật chạy lên (từ cảnh 1).
  - `route-map`: sơ đồ các nút nối nhau bằng đường (từ cảnh 2; điểm và nhãn lấy từ props thay vì hằng số).
  - `data-cards`: 2-3 thẻ số liệu (từ cảnh 3).
  - `project-close`: thẻ dự án + dòng thông điệp gõ chữ (từ cảnh 4; cảnh cuối không có số điện thoại).
  - `compare-bars`: biểu đồ cột so sánh, **mẫu mới** cho lãi suất và giá. Mọi giá trị phải có nguồn trong bảng nguồn.
- Video `BconsCentralPark` hiện tại phải render lại **giống hệt** sau refactor (xem mục 7), vì nó là mẫu kiểm thử.
- Tên trong prompt cũ (`onScreenHeadline`, `statHighlight`, `chartData`, `bulletPoints`...) bị bỏ; spec dùng tên của schema.

### 5.2 Lệnh `/bcons-video [chủ đề]`
File `.claude/commands/bcons-video.md`, dùng `$ARGUMENTS` làm chủ đề. Lệnh dừng chờ anh ở mỗi cổng, không tự đi tiếp:
1. **Số liệu**: nhận dữ liệu anh đưa (kết quả Gemini) hoặc tự tìm web theo chủ đề. Mở từng link nguồn đối chiếu con số, loại số không có nguồn/ngày/link. Xuất bảng nguồn. **Cổng 1: anh chọn góc.**
2. **Kịch bản + spec**: viết `docs/video/<tên>.md` (kịch bản 45-60 giây, bảng nguồn từng số, checklist) và file spec. Chạy lint/kiểm schema. **Cổng 2: anh duyệt chữ và số liệu.**
3. **Giọng đọc**: ghi `scenes`/lời bình. **Cổng 3: anh đồng ý tốn credit**, rồi `node --env-file=.env scripts/generate-voice.mjs`. Anh nghe thử.
4. **Render**: `npm run lint`, rồi `npm run render:drive`. **Cổng 4: anh xem và duyệt trước khi đăng.**
Lệnh nhắc rõ các quy tắc CLAUDE.md (không cam kết lợi nhuận, VAT/phí bảo trì, căn đã cọc/CĐT LOCK, 2.820 căn ở + 113 căn thương mại).

### 5.3 Bản 1 cho Gemini
Viết lại Bản 1 để anh dán vào Gemini Deep Research, lưu thành `docs/prompt-gemini-nghien-cuu.md`:
- Bỏ "~2.800 căn", "tiết kiệm 60%", CTA số điện thoại, Trụ cột 4 (kịch bản).
- Chỉ yêu cầu trả bảng số liệu: nhóm, số liệu, ngày công bố, nguồn, link gốc (đúng định dạng đầu vào của cổng 1).
- Không đưa số liệu dự án vào prompt; số dự án chỉ lấy từ `docs/bcons-central-park.md`.

### 5.4 Nhiều video cùng tồn tại (âm thanh, timestamp, render)
- Mỗi video có tên (slug) `<name>`. Spec: `remotion-video/specs/<name>.json`. Âm thanh: `public/audio/<name>/<sceneId>.mp3`. Timestamp: `remotion-video/specs/<name>.timestamps.json`.
- `generate-voice.mjs` nhận tên spec làm tham số, đọc `markup` từ spec (spec thay `scenes.mjs`, không giữ hai nguồn), ghi mp3 và timestamp của riêng video đó. Giọng, model, seed giữ nguyên.
- Một composition `BconsCentralPark` duy nhất; `calculateMetadata` nạp spec và timestamp qua `--props`. `render:drive` nhận tên spec, mặc định tên file mp4 theo `<name>`.
- Video hiện tại thành spec đầu tiên, `dong-nai-ha-tang`: chép nguyên văn `markup` 4 cảnh từ `scenes.mjs`, chuyển mp3 và timestamp hiện có vào vị trí mới, nên không cần gọi lại ElevenLabs. Sau đó `scenes.mjs` bị xóa.
- Kiểm tra "giống hệt": render bản trước refactor ra file riêng làm mốc (không dùng `out/bcons-central-park-elevenlabs.mp4` vì có thể cũ), rồi so khung hình với bản sau refactor.

### 5.5 Nguồn số liệu và trạng thái duyệt
- Mỗi giá trị số trong `props` mang trường `sourceId` trỏ tới một dòng trong bảng nguồn của `docs/video/<name>.md`.
- Spec có trường `status`: `draft` hoặc `approved`. Chỉ anh duyệt xong mới đổi sang `approved`. `generate-voice.mjs` và `render:drive` từ chối chạy khi spec còn `draft`. Spec thử bằng số mẫu luôn là `draft`.
- Script kiểm tra (chạy cùng `npm run lint`) báo lỗi nếu có `sourceId` không có trong bảng nguồn.

### 5.6 Giữ nguyên
`Captions.tsx`, `theme.ts`, `timing.ts` (chỉ đổi nguồn dữ liệu cảnh), lựa chọn giọng/model/seed của ElevenLabs.

## 6. Quyết định của em (anh kiểm tra khi đọc)
- Đường dẫn spec `remotion-video/specs/<tên>.json` và tên mẫu cảnh ở trên là em chọn.
- Dùng zod cho schema (Remotion hỗ trợ sẵn).
- Cue dùng khóa đặt tên thay cho dò chữ.
- Lệnh viết bằng tiếng Việt, một file, không tách thành nhiều lệnh con.
- Trạng thái giữa các cổng: lệnh suy ra giai đoạn từ file trên đĩa (có `docs/video/<name>.md`, có spec, spec `approved`, có mp3). Slug `<name>` do em đề xuất ở cổng 1, anh duyệt. Cổng 3 đọc lại `markup` từ spec đã `approved`, nên chữ đã duyệt không đổi được về sau.
- Hạt độ cấu hình của mẫu cảnh: `route-map` nhận danh sách nút kèm tọa độ; `data-cards` 2-3 thẻ; `stat-hero` nhận giá trị số (để chạy đếm), số chữ số thập phân và đơn vị, hiển thị theo dấu phẩy Việt Nam; lời đọc vẫn nằm trong `markup`.
- Thêm zod đúng phiên bản mà tài liệu Remotion 4.0.540 yêu cầu (người dựng tra); nếu không tương thích thì dùng cách kiểm tra bằng tay.
- Bản 1 cho Gemini lấy từ Bản 1 trong file prompt gốc; bảng trả về giữ 5 cột gốc: Phân nhóm, Sự kiện/Số liệu, Ngày công bố, Tác động đến tâm lý người mua, Nguồn & Link.

## 7. Cách kiểm tra khi xong
- `npm run lint` qua.
- Render lại spec tương đương video hiện tại, so sánh khung hình với bản cũ (trước refactor) phải giống.
- Dựng một spec thử chủ đề lãi suất bằng `compare-bars` với số **mẫu có đánh dấu** (không đăng), chỉ để xem bố cục, chưa gọi ElevenLabs.
- Chạy thử `/bcons-video` đến cổng 2 để thấy lệnh thực sự dừng.

## 8. Để người dựng quyết
Chi tiết hình (màu, cỡ chữ, hiệu ứng) của `compare-bars`; cách tách file component; tên file trong `docs/video/`.
