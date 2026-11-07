---
paths:
  - "engine/**"
  - "du-an/**/video/**"
  - "config.json"
---
# Ràng buộc kỹ thuật của pipeline video

- Node ≥ 22.18 (test dùng `node --test` và chạy thẳng file `.ts` nhờ type stripping). `package.json` còn ghi `^20.19` là chưa cập nhật.
- Remotion **4.0.540** (ghim cứng phiên bản). Composition `BconsCentralPark`, **30fps, 1080x1920**. Không đổi sang 60fps.
- Mã dự án và tên video chỉ nhận `^[a-z0-9-]+$`.
- Nơi duy nhất biết đường dẫn: `engine/remotion/scripts/project.mjs` (`readActiveProject`, `projectDir`, `videoPaths`, `listVideos`, `takeProjectFlag`, `readProjectConfig`). Không viết cứng đường dẫn dự án ở chỗ khác.
- Ngoại lệ đã biết: `engine/remotion/src/Root.tsx` lấy props mặc định của Studio từ `du-an/bcons-central-park/video/01-dong-nai-ha-tang/`. Đổi `config.json` sang dự án khác thì Studio cần chọn props của dự án đó (render không ảnh hưởng vì `render:drive` truyền props riêng).
- Thư mục file tĩnh (`staticFile`) của Remotion = `du-an/<mã>/`: ảnh `assets/images/...`, bản đồ `assets/geo/...`, giọng `video/<tên>/audio/<cảnh>.mp3`.
- Lệnh (chạy trong `engine/remotion/`), giữ tương thích ngược, thêm `--du-an <mã>` tùy chọn, mặc định đọc `config.json`:
  - `npm test`, `npm run lint` (gồm `check-spec --all`), `npm run check:spec -- <tên>`
  - `npm run voice -- <tên>`: tạo giọng ElevenLabs, **tốn credit**, chỉ chạy trên máy anh khi anh đồng ý.
  - `npm run render:drive -- <tên> [file.mp4]`: render ra `engine/remotion/out/video/`, chép lên Drive. File tạm (khung thử, log, props) để trong `out/tam/`.
  - `npm run geo:fetch`, `npm run geo:derive`: dữ liệu bản đồ vào `du-an/<mã>/assets/geo/`.
- Không dùng `edge-tts`, `props/bcons-latest.json`, composition `RealEstateShortVideo` (của 2 file prompt cũ). Giọng: ElevenLabs, voice `9CCqsrTCLkHgQlKSMchK`. Cài đặt giọng cố định: stability 0.85, similarity_boost 0.9, style 0.2 (anh muốn giữ cảm xúc), language_code vi (anh báo 2 lần giọng trôi sang giọng Bắc với 0.55/0.8; `tests/giong-doc.test.mjs` chặn đổi lại). Cảnh nào còn trôi giọng: `npm run voice -- <tên> --canh=scene1` (bot `/giong <tên> canh1`) tạo lại riêng cảnh đó với lượt đọc mới + lời cảnh trước/sau làm ngữ cảnh. Không hạ stability để "cho qua" khi model từ chối.
- Mẫu cảnh: `stat-hero`, `route-map`, `data-cards`, `compare-bars`, `geo-map`, `project-close` (schema `engine/remotion/src/spec.ts`).
- Sửa code dựng hình: chụp khung trước/sau (`npx remotion still` + `scripts/frame-hashes.mjs`) để chắc video cũ không đổi.
