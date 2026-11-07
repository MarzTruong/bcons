# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Người mua nhà ở Biên Hòa / Đồng Nai và giáp ranh TP.HCM, lướt TikTok và Facebook trên điện thoại (video dọc 1080x1920, thường xem không tiếng). Họ đang cân nhắc mua căn hộ để ở (một phần để cho thuê), lo nhất là lãi vay, dòng tiền trả góp, hạ tầng đi lại.

## Product Purpose
Kênh nội dung cá nhân của một nhân viên kinh doanh (Tuấn Trương, sàn Bcons PS Land) bán dự án Bcons Central Park: video ngắn 45–60 giây dựng bằng Remotion từ số liệu thị trường có nguồn, kèm caption, đưa khách về landing (QR) để được tính thử dòng tiền. Thành công = người xem tin số liệu, dừng lướt, quét QR hoặc nhắn tin.

## Positioning
Mỗi con số trên màn hình đều có nguồn, ngày công bố và đã được mở bài gốc đối chiếu; video đặt số thị trường cạnh chính sách thật của chủ đầu tư (vd. trần lãi 6,9%/năm ở PTTT 03 và 04), không hứa lợi nhuận.

## Operating Context
Quy trình 4 cổng (số liệu → chữ + storyboard có hình → giọng ElevenLabs → render), anh duyệt từng cổng. Code: `engine/remotion/` (mẫu cảnh stat-hero, data-cards, compare-bars, route-map, geo-map, project-close; phụ đề theo từ; tên + QR góc màn hình). Spec từng video ở `du-an/<mã>/video/<tên>/spec.json`.

## Capabilities and Constraints
- 30fps, 1080x1920, Remotion 4.0.540; số trên màn hình theo `docs/quy-tac-so-phu-de.md`.
- Không hiện SĐT dạng chữ; ảnh phối cảnh ghi "minh họa"; giá phải nói rõ VAT/phí bảo trì; không hứa tăng giá.
- Phụ đề nằm vùng dưới (top ~1400 px), góc phải dưới có khối tên + QR: bố cục phải chừa hai vùng này.

## Brand Commitments
Không bắt buộc nhận diện của chủ đầu tư (anh xác nhận 07/11/2026); chỉ cần tên dự án đúng. Khối tên "Tuấn Trương" + QR là dấu nhận diện của kênh.

## Evidence on Hand
Ảnh phối cảnh của CĐT: `du-an/bcons-central-park/assets/images/` (phoi-canh-green-park.jpg, phoi-canh-tong-the.jpg, phoi-canh-tong-the-web.jpg). Bảng nguồn từng video trong `kich-ban.md`. Không có ảnh thật người ở, không có lời chứng thực khách: không được bịa.

## Product Principles
1. Số liệu là nhân vật chính: to, rõ, đọc được trong 1 giây, luôn kèm nguồn.
2. Tin cậy như bản tin tài chính, nhưng gợi được cảm giác muốn về ở.
3. Không "AI slop": không khuôn slide hộp viền, không nền tối sọc trang trí.
4. Nói thật: dự báo ghi là dự báo, hình minh họa ghi là minh họa.
