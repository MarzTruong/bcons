# Dời thư mục trên máy anh (laptop, sau đó máy bàn)

Repo trên GitHub đã chuyển sang cấu trúc mới (`engine/` + `du-an/<mã>/`). Khi anh `git pull`, git tự dời các file có trong git. Những file **chỉ có trên máy anh** (không lên git) thì git không đụng tới, nên phải chạy script dời một lần:

| Cũ (trên máy anh) | Mới |
|---|---|
| `remotion-video\.env` | `engine\remotion\.env` |
| `remotion-video\out\` | `engine\remotion\out\` |
| `remotion-video\node_modules\` | `engine\remotion\node_modules\` |
| `remotion-video\audio-test\` | `engine\remotion\audio-test\` |
| `remotion-video\public\raw-tuan.mp4` | `du-an\bcons-central-park\assets\raw-tuan.mp4` |
| `data\*` (bảng giá...) | `data\bcons-central-park\` |
| `anh\*` (ảnh gốc) | `anh\bcons-central-park\` |

Script không bao giờ ghi đè: nếu đích đã có file thì bỏ qua và báo. Chạy lại nhiều lần không hỏng.

## Các bước (PowerShell, trong thư mục repo)

1. Đóng Remotion Studio và mọi cửa sổ đang mở file trong `remotion-video\` (nếu không, Windows khóa file và git không dời được).
2. Kiểm tra không có thay đổi chưa commit:
   ```powershell
   git status
   ```
   Có file sửa dở thì commit hoặc báo em trước. Hai file prompt cũ ở gốc (`huong_dan_su_dung_prompt_remotion_bcons.md`, `prompt_cao_du_lieu_bds_bcons_central_park.md`) là untracked, để nguyên.
3. Lấy code mới:
   ```powershell
   git pull
   ```
4. Chạy thử script dời (chỉ in bảng, chưa dời gì):
   ```powershell
   node engine/automation/doi-thu-muc.mjs
   ```
   Xem các dòng `DỜI`/`GỘP`. Dòng `BỎ QUA (đích đã có)` là bình thường nếu file đó đã có ở chỗ mới.
5. Dời thật:
   ```powershell
   node engine/automation/doi-thu-muc.mjs --chay
   ```
   Cuối cùng script báo "Không còn thư mục cũ" hoặc liệt kê thư mục còn sót (thường là `remotion-video\` chỉ còn file trùng). Kiểm tra rồi tự xóa thư mục đó.
6. Kiểm tra:
   ```powershell
   cd engine/remotion
   npm ci
   npm test
   npm run lint
   ```
   `npm ci` chỉ cần nếu `node_modules` không dời được (báo lỗi khi chạy test). Cả `npm test` và `npm run lint` phải báo hết lỗi (`fail 0`, các dòng `OK`).
7. Thử render một video có sẵn (không tốn credit ElevenLabs):
   ```powershell
   npm run render:drive -- dong-nai-ha-tang
   ```
   Video ra `engine\remotion\out\video\` và được chép lên Drive như trước.

## Lệnh sau khi dời
- Mọi lệnh `npm` chạy trong `engine\remotion\` thay vì `remotion-video\`. Tên lệnh giữ nguyên: `npm run voice -- <tên>`, `npm run render:drive -- <tên>`, `npm run lint`, `npm test`, `npm run dev`.
- Muốn chạy cho dự án khác dự án đang bán: thêm `--du-an <mã>`, ví dụ `npm run render:drive -- <tên> --du-an bcons-solary`.
- Đổi dự án đang bán: sửa `config.json` ở gốc repo.

## Máy bàn
Làm y hệt các bước trên khi về máy bàn. Nếu máy bàn chưa từng clone repo thì chỉ cần `git clone`, chép `.env` vào `engine\remotion\`, chép bảng giá vào `data\bcons-central-park\`, rồi `npm ci`.
