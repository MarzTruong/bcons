---
paths:
  - "du-an/**"
  - "engine/remotion/**"
---
# Cổng chặn và nguồn số liệu

## Cổng chặn (đã có trong code: `prepareRun` ở `engine/remotion/scripts/spec-tools.mjs`)
`npm run voice` và `npm run render:drive` chạy cổng chặn **trước** khi đọc API key hay gọi mạng. Từ chối nếu:
- spec còn `status: "draft"` (chỉ đổi `approved` khi anh nói rõ đã duyệt chữ và số liệu);
- có `sourceId` không nằm trong `## Bảng nguồn` của `video/<tên>/kich-ban.md`, hoặc nguồn thiếu link http(s);
- cue trỏ tới chữ không có trong lời bình;
- thiếu file bản đồ/ảnh trong `assets/`, tọa độ ngoài Việt Nam, hoặc ảnh tên `placeholder`.
Không sửa cổng chặn để "cho qua"; sửa spec/bảng nguồn.

## Nguồn số liệu
- Số về dự án (giá, diện tích, pháp lý, PTTT, số căn, bàn giao): chỉ lấy từ `du-an/<mã>/project.json`, `thong-tin.md`, `nguon/`, và `data/<mã>/` (bảng giá, chỉ có trên máy anh). Thiếu thì ghi "chưa có" và hỏi.
- Số lượng căn Bcons Central Park: 2.820 căn ở + 113 căn thương mại (không ghi "~2.800").
- Số thị trường: mỗi số có ngày công bố, tên nguồn, link gốc; mở link đối chiếu trước khi dùng. Nguồn ưu tiên: sbv.gov.vn, gso.gov.vn, chinhphu.vn, dongnai.gov.vn, vneconomy.vn, cafef.vn, vnexpress.net, baodongnai.com.vn, baodautu.vn, vars.vn.
- Số trong ví dụ của 2 file prompt cũ (85 triệu/m², 49,9 triệu/m², 6,2%, "tiết kiệm 60%") không có nguồn: không dùng.
- Lớp bản đồ chưa có dữ liệu chính thức: `kind: "illustrative"` (nét đứt, ghi "minh họa"). Nguồn địa lý: `du-an/<mã>/assets/geo/NGUON.md`.

## Caption và duyệt bài (`engine/remotion/scripts/caption.mjs`, `caption-cli.mjs`)
- `checkCaption` chặn: SĐT (mọi kiểu viết), cụm hứa lợi nhuận/tăng giá/"sắp hết"/"căn cuối cùng", nhắc giá mà bài không ghi VAT và phí bảo trì, thiếu phần FB/TikTok, TikTok > 2.200 ký tự.
- Duyệt gắn dấu vân tay: `duyet:caption` lưu sha256 nội dung; `duyet:video` lưu sha256 của mp4. Sửa caption hoặc render lại → `send:telegram` từ chối. Không tự chạy lệnh duyệt khi anh chưa nói rõ "duyệt".
- Bài công ty: giữ nguyên thông tin gốc, không thêm số không có trong bài gốc (skill `bai-cong-ty`).
