# Đối chiếu kết quả AGY: demo Cách A + bộ tài liệu gửi khách (11/11/2026)

Nguồn Drive `agy/den-claude/`: `2026-11-12-demo-cach-a-newsky/`, `2026-11-11-bo-tai-lieu-gui-khach-newsky/`, `2026-11-11-thiet-ke-landing-bcons-newsky-v2/`. Chỉ kiểm nội dung và code, không nhận xét UX/UI.

## 1. Demo Cách A (ảnh PNG vẽ bằng Canvas ở trình duyệt, Apps Script đẩy ảnh lên Telegram)
- **Đúng:** form được thay bằng bản sao, hàm gửi mới có `preventDefault` và không `fetch`, nên bản demo không gửi lead thật dù có `formUrl` thật. Câu "không gửi ra CRM" của AGY đúng.
- **Rủi ro (nên chọn hướng B, không chọn Cách A như AGY viết):**
  1. Ảnh do trình duyệt tự vẽ rồi gửi lên `/exec`; mã `.gs` mẫu chỉ kiểm đuôi PNG và dung lượng ≤ 350 KB. Ai biết link `/exec` cũng gửi được ảnh bất kỳ vào Telegram của anh (chỉ bị chặn bởi giới hạn 20 lead/10 phút).
  2. Số trong ảnh không được máy chủ kiểm lại, có thể lệch số trong tin Telegram; anh lại chuyển ảnh này cho khách. Phiếu dựng bằng máy của anh (hướng B) thì số luôn từ lõi tính có test.
  3. Ảnh vẽ cứng dòng SĐT chữ "0938.32.31.39". Phiếu hướng B dùng tên và mã QR, không in SĐT chữ.
  4. Cách A chỉ chạy khi khách tự tính trên web; khách nhắn xin bảng giá qua TikTok/Zalo vẫn cần `/phieu`.
- Dùng được nếu muốn: để **khách tự tải ảnh về** ngay trên trang (không gửi lên Telegram). Việc này cần anh quyết.

## 2. Bản landing trong demo (đã chốt + 4 chỉnh sửa)
- **Bản đồ OSM nhúng:** ổn, không phụ thuộc khóa Google.
- **Quà tặng giao dịch:** đối chiếu PDF `191/TB-BPS` và `213`: 01 chỉ vàng SBJ/giao dịch, voucher 30 triệu (50 giao dịch đầu) + 20 triệu (50 giao dịch tiếp), Camry bốc thăm khi dự án đạt ≥95% trên 594 sản phẩm (565) đến hết 30/06/2027: **khớp**. AGY bỏ chữ "(hoặc thương hiệu tương đương)" của vàng SBJ; nên thêm lại.
- **Số văn bản:** PDF `213` đọc ra "Số: 243/TB-BPS" (có thể do chữ quét), AGY ghi 213. Anh mở PDF xem số thật trước khi in lên trang.
- **4 PDF pháp lý gắn vào thẻ:** em chưa đọc nội dung 4 file này (chỉ biết tên, ngày). Chưa kiểm.

## 3. Bộ tài liệu gửi khách
- **Không có file nội bộ:** thư mục `03-pttt-chinh-sach-phap-ly` có 10 file: PTTT 08/09/10, `191`, `213`, GPKD, QĐ 7052, QĐ 3759, GPXD 3288, thông báo triển khai; không có `193TB`/`206TB` (hoa hồng). Hai thư mục ảnh `01` và `02` em chưa liệt kê, chưa kiểm.
- **`mau-tin-nhan-zalo.md`:** số thông báo (29/30/31-TB-SHQT) và lịch đợt PTTT 08/09/10 khớp `nguon/pttt-cdt.json`. Hai chỗ lệch: (a) PTTT 10 ghi "Đợt 1, 2, 4, 6 mỗi đợt 5%" nhưng Đợt 2 còn gồm VAT Đợt 1 và 2 nên không đúng 5%; (b) mẫu để trống `[... đồng]` anh phải điền tay, dễ nhầm số. Phiếu tính (`/phieu`) thay phần này chính xác hơn.
- **`mau-bang-tinh-zalo.png/html`:** mẫu minh họa tay (3,10 tỷ chưa VAT, 3,41 tỷ có VAT); không dùng làm template thật.

## 4. Sắp xếp các kết quả AGY trong `den-claude/`
| Thư mục | Trạng thái | Đề nghị |
|---|---|---|
| `2026-11-12-demo-cach-a-newsky` | Mới, chờ anh quyết | Giữ; anh chọn hướng (mục 1) |
| `2026-11-11-bo-tai-lieu-gui-khach-newsky` | Mới, chưa duyệt | Giữ; dùng PDF, bỏ mẫu Zalo/PNG |
| `2026-11-11-thiet-ke-landing-bcons-newsky` | Anh đã chốt, đã tích hợp (`du-an/bcons-newsky/landing/`), đã kiểm | Lưu trữ |
| `2026-11-11-thiet-ke-landing-bcons-newsky-v2` | Phương án khác, anh không chọn (demo Cách A dựng trên bản đã chốt) | Lưu trữ (chưa có biên bản kiểm) |
| `2026-11-11-nghien-cuu-quy-hoach-binh-duong-ql13-metro` | Đã kiểm (`kiem-toan/2026-11-11-nghien-cuu-binh-duong/KIEM.md`), đã dùng | Lưu trữ |
| `2026-11-10-thiet-ke-landing-v2` | Landing Central Park v2, đã kiểm (`kiem-toan/2026-11-10-agy-landing-v2`) | Lưu trữ nếu anh đã chọn xong |
| `2026-11-10-zalo-tu-kich-ban-video` | Thử nghiệm đã so sánh (biên bản đã xóa 12/11/2026, xem lịch sử git) | Lưu trữ |

Không di chuyển file trên Drive khi anh chưa đồng ý (thư mục đích đề nghị: `Bcons/_luu-tru/agy/`).
