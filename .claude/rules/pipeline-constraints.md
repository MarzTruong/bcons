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
- Mẫu cảnh: `stat-hero`, `route-map`, `data-cards`, `compare-bars`, `geo-map`, `project-close`, `lo-trinh` (bảng lộ trình tiền: `phan` "tong-quan" = thanh xếp chồng + hai số lớn, "trinh-tu" = trục thời gian dọc; mọi tổng tính từ `moc[]`, mốc hiện theo cue + `offset`; `check:spec` kiểm tổng = giá x (1 + VAT + bảo trì) khi khai `giaChuaVat`; `src/loTrinh.ts`, `src/templates/LoTrinh.tsx`; không phụ đề), `danh-sach` (danh sách có đếm "Đã xem n/N", mục hiện theo cue), `bang-chung` (minh chứng: nền ảnh mờ, popup ảnh chụp bài báo/thông báo, ảnh rõ nét hoặc biểu đồ giá; kiểu `toi`/`sang` do AGY thiết kế 16/11/2026, màu cố định), cộng khung mở đầu `hook` tùy chọn ở gốc spec (0–3 s phủ cảnh 1, tắt phụ đề cảnh 1 trong 3 giây đó; schema `engine/remotion/src/spec.ts`, mốc thời gian `src/moDau.ts`). Bản AGY kiểu 1 (anh chọn 15/11/2026), màu cố định, không đổi theo `style`. Ảnh bìa: `bia.json` cạnh `spec.json` (`BiaSchema` ở `src/bia.ts`: `tieuDe` mục tiêu ≤ 6 chữ (tối đa 7), `diemNhan`, `ghiChuNhan`, `chuDe` quyết định màu: ha-tang, tien-do, tai-chinh, du-an; `anhNen`, `viTriAnh`, `nhanAnh`, `duAn`); `npm run bia -- <tên>` chụp `out/bia/<tên>.png` 1080x1920 (composition `BiaVideo`, cloud: `REMOTION_BROWSER=/opt/pw-browsers/chromium`); `hook` của spec phải khớp `bia.json` (`check:spec` báo lệch) nên khung 0 của video chính là bìa; phông Be Vietnam Pro dùng chung. Khung nguồn cuối video: trường `nguonCuoi` ở gốc spec (1–3 dòng `ten`, `ngay` dd/mm/yyyy, `sourceId`), chèn 2,5 s không lời ngay trước cảnh cuối (`buildTiming(ts, NGUON_CUOI_FRAMES)`, video dài thêm 75 khung); `check:spec` đối chiếu tên và ngày với bảng nguồn; `src/NguonCuoi.tsx`.
- Sửa code dựng hình: chụp khung trước/sau (`npx remotion still` + `scripts/frame-hashes.mjs`) để chắc video cũ không đổi.
