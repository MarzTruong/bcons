# engine/remotion: dựng video, bot Telegram, phiếu tính

Code dùng chung cho mọi dự án (không chứa số liệu dự án). Quy tắc và cách làm việc: `CLAUDE.md` ở gốc repo; ràng buộc kỹ thuật: `.claude/rules/pipeline-constraints.md`.

Chạy trong thư mục này (`npm run <lệnh> -- <tham số>`; thêm `--du-an <mã>` để chạy cho dự án khác `config.json`):

| Lệnh | Việc |
|---|---|
| `test`, `lint` | Kiểm toàn bộ (gồm `engine/automation`, `engine/landing`, `engine/master-data`) và soát spec |
| `storyboard`, `voice`, `render:drive`, `phu-de` | Làm video: hình duyệt trước, giọng (tốn credit), render (xem `docs/quy-trinh-video.md`) |
| `check:caption`, `duyet:caption`, `duyet:video`, `send:telegram` | Caption: soát quy tắc, duyệt, gửi |
| `bot` | Bot Telegram trên máy anh (`docs/huong-dan-bot-telegram.md`) |
| `phieu`, `phieu:mau` | Phiếu tính gửi khách (PNG/PDF) và bộ phiếu mẫu kiểm UX |
| `landing` | Dựng landing tĩnh vào `engine/landing/dist/<mã>` |
| `kiem-gia` | Kiểm Master File theo thông báo PTTT của CĐT |
| `gemini`, `sfx`, `geo:*`, `check:mapbox` | Nghiên cứu số liệu, hiệu ứng âm thanh, dữ liệu bản đồ |
| `dev`, `still`, `build` | Remotion Studio, chụp một khung, đóng gói |
