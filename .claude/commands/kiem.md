---
description: Chạy test + soát lỗi của engine, báo qua/hỏng 2 dòng
---
Chạy trong `engine/remotion`: `npm test` rồi `npm run lint`.
Báo anh đúng 2 dòng: số test qua/hỏng và lint qua/hỏng. Hỏng thì liệt kê tên test hoặc lỗi (tối đa 5 dòng) và đề xuất cách sửa, chưa tự sửa.
Nếu phiên này có sửa landing, phiếu, `Code.gs` hoặc `project.json`: sau khi push `main`, chạy thêm `NODE_USE_ENV_PROXY=1 npm run kiem-mang -- --cho` (chờ Cloudflare dựng xong rồi kiểm các trang đang chạy trên mạng) và báo thêm 1 dòng.
