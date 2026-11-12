---
name: bao-cao-hieu-suat
description: Báo cáo hiệu suất kênh Facebook và TikTok của Bcons (kéo số từ Metricool, phân loại theo mô hình nội dung dự án / thị trường, đối chiếu mục tiêu, đề xuất kế hoạch sản xuất video tuần sau). Dùng khi anh hỏi hiệu suất kênh, hoặc khi chạy tác vụ hằng tuần.
---

# Báo cáo hiệu suất kênh (Facebook + TikTok)

Mục đích: số liệu kênh quyết định **làm video gì tiếp theo**. Báo cáo ngắn, có số, phân biệt "tín hiệu" với "nhiễu" (mẫu nhỏ), kết bằng kế hoạch sản xuất tuần sau.

Khung báo cáo lấy từ skill `marketing:performance-report` (tóm tắt, bảng số, điều hiệu quả/chưa, đề xuất ưu tiên, trọng tâm kỳ sau), rút gọn cho kênh nhỏ.

## Việc cần làm (theo thứ tự)
1. **Đọc mô hình kênh và bảng phân loại:** `du-an/bcons-central-park/content/kenh-mo-hinh.md` (mục tiêu 70–80% nội dung dự án, 20–30% thị trường/educate; mỗi video đã gắn trụ cột A hoặc B). Video mới chưa có trong bảng thì thêm dòng (hỏi anh nếu không chắc trụ cột).
2. **Lấy thương hiệu Metricool:** `getBrandSettings` (id hiện là `7877084`, múi giờ `Asia/Saigon`).
3. **Kéo số liệu kỳ báo cáo** (mặc định 7 ngày gần nhất; so với 7 ngày trước nếu có) bằng `getAnalyticsDataByMetrics`. Mỗi lần gọi một nhóm mã:
   - TikTok video (`TKPO`): `TKPO02` ngày giờ, `TKPO05` mô tả, `TKPO03` link, `TKPO06` độ dài, `TKPO07` lượt xem, `TKPO08` tim, `TKPO09` bình luận, `TKPO10` chia sẻ, `TKPO11` tiếp cận, `TKPO13` tỷ lệ xem hết, `TKPO15` thời gian xem TB, `TKPO16` từ "Dành cho bạn", `TKPO20` từ hồ sơ, `TKPO21` từ tìm kiếm.
   - Facebook Reel (`FBRE`): `FBRE02` ngày giờ, `FBRE05` nội dung, `FBRE06` link, `FBRE08` tim, `FBRE10` lượt xem, `FBRE11` tiếp cận, `FBRE13` thời gian xem TB.
   - Facebook trang (`FBEV`): `FBEV17` người theo dõi, `FBEV47` mới, `FBEV48` mất, `FBEV03` lượt xem trang, `FBEV33` số nội dung, `FBEV22` lượt xem Reel, `FBEV34` tương tác, `FBEV49` lượt xem nội dung trang.
   - Thứ tự cột trả về theo thứ tự mã đã gửi; cột `null` hoặc `0` ở tiếp cận có thể là Metricool chưa kịp cập nhật, ghi rõ chứ không suy diễn.
4. **Đếm khách từ kênh (chỉ số lượng, không đọc dữ liệu cá nhân):** nếu có quyền đọc Sheet landing (tab `Landing` trong "Bcons - Khach quan tam Messenger"), đếm số dòng trong kỳ theo cột **Nguồn** (`tiktok`, `facebook`, `fb-post`, `qr`, `truc-tiep`) và cột **Dự án**. Tuyệt đối không chép tên/SĐT vào báo cáo. Không đọc được thì ghi "chưa đo được".
5. **Viết báo cáo** vào `du-an/bcons-central-park/bao-cao/<yyyy-mm-dd>-hieu-suat-tuan.md` (báo cáo chung hai dự án vẫn để ở thư mục này) theo khung dưới.
6. **Cập nhật kế hoạch sản xuất:** sửa bảng "Kế hoạch tuần" trong `kenh-mo-hinh.md` theo đề xuất; việc cần anh quyết thì ghi ở đầu báo cáo.
7. Chạy `git pull --rebase origin main`, commit (tiếng Anh ngắn, kèm dòng Co-Authored-By), `git push origin HEAD:main`. Không tạo PR. Báo anh 5–8 dòng: số chính, điều đáng chú ý, việc cần anh quyết.

## Khung báo cáo
1. **Tóm tắt** (3–4 câu): tổng lượt xem, tương tác, khách từ kênh; một điều tốt, một điều đáng lo.
2. **Bảng chính** (tuần này, tuần trước, đổi): lượt xem TikTok, lượt xem Reel Facebook, tim, bình luận, chia sẻ, thời gian xem TB, người theo dõi mới, khách từ kênh (form/QR).
3. **Từng video** (bảng): ngày, trụ cột (A/B), dự án, tên ngắn, lượt xem, thời gian xem TB, tỷ lệ xem hết, tim, bình luận.
4. **So trụ cột A và B:** lượt xem TB, thời gian xem TB, bình luận, và **tỷ lệ mô hình thực tế so với mục tiêu 70–80/20–30** (đếm theo số video đăng trong kỳ).
5. **Điều hiệu quả / chưa hiệu quả** (có số, kèm giả thuyết ngắn).
6. **Độ tin cậy:** mỗi nhóm có bao nhiêu video; dưới 6 video/nhóm thì ghi "mẫu nhỏ, chưa kết luận". Không đưa chuẩn "ngành" nếu không có nguồn.
7. **Đề xuất** (làm ngay / tuần sau / thử nghiệm): mỗi đề xuất gắn với một số liệu cụ thể.
8. **Kế hoạch sản xuất tuần sau:** danh sách video (dự án, trụ cột, góc, nguồn: tự làm bằng pipeline hay cắt từ video công ty), kèm việc anh cần duyệt.

## Quy tắc
- Chỉ số thật từ Metricool; thiếu thì ghi "chưa có", không bịa, không làm tròn lên.
- Không kết luận chắc từ ít hơn 6 video mỗi nhóm hoặc dưới 4 tuần dữ liệu; nói rõ là "tín hiệu".
- Báo cáo không chứa dữ liệu khách; chỉ số lượng.
- Bài đã đăng và đã được anh duyệt thì giữ (anh dặn 12/11/2026 về bài 04/11); chỉ ghi rủi ro nội dung một lần, không nhắc lại.
- Nội dung đề xuất tuân quy tắc cứng trong `CLAUDE.md` (không hứa tăng giá, chưa VAT/có VAT, phí bảo trì 2%, căn đã cọc/LOCK không quảng cáo) và `docs/quy-tac-caption.md`.
- Làm video mới theo skill `bcons-video` (4 cổng chờ anh duyệt); báo cáo chỉ đề xuất, không tự tạo giọng hay đăng bài.
