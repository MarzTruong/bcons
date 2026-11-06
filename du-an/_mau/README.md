# Tạo dự án mới

1. Chép cả thư mục `du-an/_mau/` thành `du-an/<mã>/` (mã chỉ gồm a-z, 0-9, gạch ngang, ví dụ `bcons-solary`).
2. Điền `project.json` (đặt `"ma"` đúng tên thư mục) và `thong-tin.md` chỉ bằng số liệu từ tài liệu chủ đầu tư.
3. Đặt dự án đang bán trong `config.json` ở gốc repo: `{ "duAnDangBan": "<mã>" }`. Muốn chạy lệnh cho dự án khác mà không đổi: thêm `--du-an <mã>`.
4. Bảng giá, Master File để ở `data/<mã>/`, ảnh gốc ở `anh/<mã>/` (không lên git).
5. Chạy `cd engine/remotion && npm test && npm run lint`.

Thư mục: `video/<tên>/` (spec.json, kich-ban.md, storyboard.md, caption.md, audio/), `assets/` (images/, geo/), `nguon/`, `content/`, `landing/`, `bao-cao/`.
