---
name: bcons-project-init
description: Tạo thư mục cho dự án Bcons mới (chép du-an/_mau, kiểm mã, điền project.json và thong-tin.md từ tài liệu chủ đầu tư)
argument-hint: <mã-dự-án> ["Tên dự án"]
---

Anh muốn tạo dự án: **$ARGUMENTS**

1. Đề xuất mã dự án dạng `^[a-z0-9-]+$` (vd. `bcons-solary`) nếu anh chưa đưa. Không có dấu, không khoảng trắng.
2. Chạy ở gốc repo: `node engine/automation/tao-du-an.mjs <mã> "<Tên dự án>"`. Script từ chối mã sai dạng hoặc thư mục đã có (không ghi đè).
3. Xin anh tài liệu chủ đầu tư (Drive, PDF, bảng giá). Điền `du-an/<mã>/project.json` (địa chỉ, tọa độ có nguồn, chủ đầu tư, số căn, bàn giao, từ khóa nghiên cứu, tên kênh) và `du-an/<mã>/thong-tin.md` **chỉ bằng số trong tài liệu**, ghi nguồn; thiếu thì ghi "chưa có" và hỏi.
4. Bảng giá, Master File để ở `data/<mã>/`, ảnh gốc ở `anh/<mã>/` (trên máy anh, không lên git).
5. Kiểm: `cd engine/remotion && npm test` (test `readProjectConfig` cho mọi khóa bắt buộc).
6. **Hỏi anh** có chuyển dự án đang bán sang mã mới không. Chỉ khi anh đồng ý mới sửa `config.json` → `{ "duAnDangBan": "<mã>" }`. Muốn làm video cho dự án khác mà không đổi: dùng `--du-an <mã>`.
