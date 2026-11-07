# Design

Hệ thống video **nhiều phong cách**: mỗi video một kiểu/màu, video liền nhau không trùng (anh dặn 07/11/2026: cả kênh một màu sẽ đơn điệu). Spec chọn bằng `"style"` (và `"motion"`). Phong cách cũ (`classic`, `sang`, `navy`, `xanh`) giữ cho video đã làm.

## Chọn phong cách
| Nội dung video | Phong cách | Ghi chú |
|---|---|---|
| Lãi suất, tài chính, dòng tiền | `bangls` (bảng lãi suất) | 3 màu bảng xoay theo số video |
| Hạ tầng, cuộc sống, dự án | `tapchi` (bìa tạp chí) | 5 màu bìa xoay theo số video |
| Mặt bằng, căn hộ, kỹ thuật | `banve` (bản vẽ kiến trúc) + motion `ve` | 1 màu, dùng khi hợp chủ đề |

Màu theo số video: `engine/remotion/src/issues.ts` (`issueOf`). Mẫu cảnh riêng cho `stat-hero`, `data-cards`, `project-close`: `templates/TapChi.tsx`, `templates/BangLs.tsx`, `templates/BanVe.tsx`; mẫu khác dùng bản thường trên nền của phong cách.

## Bìa tạp chí (`tapchi`)
- Màu bìa: đỏ son `#b5291f`, xanh coban `#1c3faa`, vàng nghệ `#e3a21a`, tím mận `#5b2346`, xanh ngọc `#0c6a6c`; mỗi màu có màu nhấn số, nền trang ruột, chữ.
- Chữ: Bricolage Grotesque 800 cho tiêu đề và số (chữ sát, -3 đến -8), Be Vietnam Pro cho câu chữ. Nhãn viết thường, không chữ hoa giãn.
- stat-hero = bìa (đầu báo "Số 07", tiêu đề xếp chồng tự co theo dòng dài nhất, con số là dòng tít); data-cards = trang ruột nền tối của số báo, mục trước mờ 55% khi mục sau tới; project-close = bìa sau, ảnh tràn nửa trên.
- Nền giấy có hạt rất nhẹ.

## Bảng lãi suất (`bangls`)
- Khung bảng: navy `#0f2d63`, đỏ đô `#7e1722`, xám chì `#3a4049`; chữ số đèn hổ phách/vàng/xanh lơ trong ô lật có đường xẻ giữa.
- Chữ: Oswald cho số và tiêu đề bảng, Be Vietnam Pro cho nhãn.
- Chữ số lật từng ô (`flapChar`), ô sau trễ 2 frame; dòng chữ (không số) in bằng chữ đèn.
- project-close lấy số có % đầu tiên trong thông điệp (vd. 6,9%) lật thành ô.

## Bản vẽ (`banve`)
Giấy cyanotype xanh Phổ, mực trắng, bút đỏ cho số chính; đường kích thước tự vẽ; ghi chú đánh số; khung nhìn ảnh có dấu cắt. Chữ hoa có dấu cần line-height ≥ 1.04 và vùng cắt chừa 40 px.

## Chung
Lề 72 px. Vùng phụ đề y≈1400–1760 và ô QR góc phải dưới (chỉ QR, tên + QR ở cảnh cuối) luôn để trống. Một chuyển động chính mỗi cảnh. Ảnh phối cảnh luôn ghi "minh họa".
