# Design

Một phong cách video: **bản vẽ kiến trúc** (`"style": "banve", "motion": "ve"` trong spec), anh thử ở video 7 ngày 07/11/2026; **không phải mặc định** (anh: cả hệ thống một màu sẽ đơn điệu, mỗi video nên khác nhau). Code: `engine/remotion/src/templates/BanVe.tsx`, bảng màu `PALETTES.banve` trong `engine/remotion/src/theme.ts`. Các phong cách cũ (`classic`, `sang`, `navy`, `xanh`) giữ cho video đã làm.

## Thế giới
Cả khung hình 1080x1920 là một tờ bản vẽ: giấy cyanotype xanh Phổ, lưới phụ 30 px và lưới chính 150 px, khung viền đôi. Số liệu thị trường là "kích thước" ghi trên bản vẽ của ngôi nhà mình sẽ ở: tin cậy như bản tin tài chính, gợi cảm giác nhà.

## Màu
- Giấy: `#16408f` → `#123679` (chuyển nhẹ từ giữa ra mép).
- Mực trắng `#f5f8ff`; chữ phụ trắng 85%; đường kẻ phụ trắng 60%.
- Bút đỏ `#ff8a6b`: chỉ cho con số chính và chữ có số trong ghi chú, số trong phụ đề. Không dùng màu khác.

## Chữ
- Barlow Condensed 600–800, chữ hoa: tiêu đề bản vẽ (118–150 px), con số (104–290 px), nhãn ô (34–36 px, giãn chữ 2).
- Be Vietnam Pro 600–800: câu chữ thường, phụ đề.
- Chữ hoa có dấu (Ã, Ạ, Ễ): line-height ≥ 1.04 và vùng cắt chừa 40 px trên/dưới.

## Thành phần
- Dải tên bản vẽ (trên cùng): ô trái/phải, kẻ dưới; giữ nguồn, nhãn cảnh. Không dùng "eyebrow" trên tiêu đề.
- Đường kích thước: đường ngang + 2 đường gióng + 2 vạch chéo, tự vẽ khi số được đọc.
- Ghi chú: bong bóng số tròn tự vẽ, nhãn, chữ chính, chữ phụ, đường dẫn kẻ dưới. Không đóng hộp, không viền màu, không bóng phát sáng.
- Khung nhìn ảnh: viền trắng 3 px, dấu cắt 4 góc, nhãn "minh họa" ở dải tên.

## Chuyển động
Nét bút vẽ dần (dash offset, ease-out) và quét như lật tờ bản vẽ. Nền đứng yên. Một chuyển động chính mỗi cảnh.

## Bố cục
Lề 76 px. Vùng phụ đề y≈1400–1760 và khối tên + QR góc phải dưới luôn để trống.
