# Hướng dẫn đăng bài (Facebook + TikTok)

> **Hẹn giờ đăng:** nhắn em (Claude) "hẹn đăng <tên video> lúc <giờ>". Em dùng kết nối Metricool (đã bật 06/11/2026, brand id 7877084): lấy video thẳng từ link Google Drive (bản `render:drive` chép lên), tạo 2 bài hẹn giờ (TikTok dùng caption TikTok, Facebook Reel dùng bài Facebook), cập nhật Sheet. Anh không phải mở Metricool. Mỗi bài tính vào giới hạn khoảng 20 bài/tháng của gói Free.
>
> **Cách dễ nhất:** dùng bot Telegram (`docs/huong-dan-bot-telegram.md`): `/render`, `/xem`, `/duyet` thay cho các lệnh `npm` bên dưới. Các lệnh dưới đây giữ lại để dùng khi bot chưa chạy.

Sheet quản lý: **Bcons - Lịch nội dung** (https://docs.google.com/spreadsheets/d/1XxfKqnrqsAYaI8kZLir4XiAk_-pjYbxgoVdGYxVFoP0). Mỗi bài một dòng. Chỉ dòng **Đã duyệt** mới được đưa lên lịch đăng.

## Làm một lần trên máy anh

### 1. Bot Telegram (để nhận video + caption về điện thoại)
1. Mở Telegram, tìm **@BotFather**, gõ `/newbot`, đặt tên (vd. `Bcons Dang Bai`) và username kết thúc bằng `bot` (vd. `bcons_dangbai_bot`).
2. BotFather trả về một mã dạng `123456789:AA...`. Đó là **token**, giữ bí mật như mật khẩu.
3. Mở file `engine\remotion\.env` bằng Notepad, thêm dòng:
   ```
   TELEGRAM_BOT_TOKEN=123456789:AA...
   ```
4. Mở bot vừa tạo trên Telegram, bấm **Start** rồi nhắn `hi`.
5. Trong `engine\remotion` chạy:
   ```powershell
   npm run telegram:chat-id
   ```
   Lệnh in ra dòng `TELEGRAM_CHAT_ID=...`. Chép dòng đó vào `.env`.

### 2. Metricool (hẹn giờ TikTok)
1. Đăng ký https://metricool.com gói **Free** (1 thương hiệu, khoảng 20 bài hẹn giờ/tháng).
2. Kết nối tài khoản TikTok (và Facebook nếu muốn xem số liệu chung).
3. **Thử hẹn giờ 1 video TikTok** để chắc gói Free tự đăng được. Nếu không tự đăng được, dùng cách đăng tay từ điện thoại (mục dưới) và báo em.
4. Khi TikTok vượt 20 bài/tháng hoặc muốn gộp số liệu FB + TikTok, cân nhắc gói Starter (khoảng 20–25 USD/tháng, kiểm giá trên trang Metricool).

### 3. Facebook
Fanpage "Căn hộ Phan Trung – Bcons Central Park Biên Hòa" đã nối Metricool: em hẹn Facebook Reel cùng lúc với TikTok. Meta Business Suite (https://business.facebook.com → Lập kế hoạch) chỉ dùng khi muốn tự đăng tay.

## Mỗi video
| Bước | Ai | Làm gì |
|---|---|---|
| 1 | Em | Viết `kich-ban.md`, `spec.json`, **`caption.md`** (bài FB + caption TikTok), máy tự kiểm. Thêm dòng vào Sheet: "Chờ duyệt". |
| 2 | Anh | Đọc kịch bản + caption. Duyệt thì nói em, hoặc tự chạy `npm run duyet:caption -- <tên>`. |
| 3 | Máy anh | `npm run voice -- <tên>` (tốn credit, anh đồng ý trước), `npm run render:drive -- <tên>`. |
| 4 | Anh | Xem video. Ưng thì `npm run duyet:video -- <tên>`. |
| 5 | Máy anh | `npm run send:telegram -- <tên>`: video + caption TikTok + bài FB về Telegram. |
| 6 | Em | Anh nhắn "hẹn đăng <tên> lúc <giờ>": em hẹn TikTok + Facebook Reel qua Metricool. Muốn tự chọn nhạc TikTok: tắt tự đăng bài đó, đến giờ đăng tay trên app; Facebook dùng file gốc từ Drive, **không** dùng clip tải từ TikTok (có logo TikTok, nhạc chỉ cấp phép trên TikTok). |
| 7 | Anh / em | Sheet: "Đã lên lịch" + giờ đăng; đăng xong "Đã đăng" + link bài. Anh nhắn em "đã lên lịch <tên> <giờ>" thì em cập nhật giúp. |

Sửa caption sau khi duyệt, hoặc render lại video → `send:telegram` từ chối, phải duyệt lại (bước 2 hoặc 4).

**Sau khi duyệt trên máy anh** (lệnh duyệt ghi vào file `caption.md`), lưu và đẩy lên GitHub để cloud và các máy khác thấy cùng trạng thái:
```powershell
git add du-an
git commit -m "Duyet <tên>"
git push
```
Hook chặn commit vẫn chạy, nên không lo lỡ đưa `.env` hay video lên.

## Mỗi bài từ công ty
1. Anh thả ảnh/video/bài công ty vào Drive, gửi em link (hoặc dán vào chat). Em gọi skill `bai-cong-ty`: giữ nguyên thông tin gốc, viết lại `caption.md` trong `du-an/<mã>/content/bai-cong-ty/<ngày>-<tên>/`, thêm dòng Sheet "Chờ duyệt".
2. Anh duyệt: `npm run duyet:caption -- --bai ../../du-an/bcons-central-park/content/bai-cong-ty/<ngày>-<tên>`.
3. `npm run send:telegram -- --bai <cùng đường dẫn>` gửi 2 tin chữ (TikTok, FB) về Telegram; ảnh/video lấy từ Drive.
4. Đăng như bước 6–7 ở trên.

## Giờ đăng (anh dặn 13/11/2026)
Anh nói "lên lịch đăng" mà không nêu giờ thì em **tự chọn giờ, không hỏi lại**: gọi Metricool `getBestTimeToPostByNetwork` cho từng kênh (Facebook, TikTok) trong 7 ngày tới, lấy giờ điểm cao nhất của ngày đăng (ngày gần nhất chưa có bài của kênh đó), rồi báo anh giờ đã chọn kèm điểm số. Anh nêu giờ cụ thể thì theo giờ anh. Số của Metricool là thói quen người dùng chung của nền tảng khi kênh còn ít người theo dõi; có đủ số liệu riêng của kênh thì báo cáo tuần chỉnh lại.

## Nhịp đăng giai đoạn 1 (đến 29/11)
3–4 video tự làm mỗi tuần, các ngày còn lại bài công ty. Giờ đăng cụ thể để trống tới khi có số liệu tuần đầu (báo cáo tuần, kế hoạch 04).

## Các lệnh (chạy trong `engine\remotion`)
- `npm run check:caption -- <tên>` hoặc `-- --all`: kiểm caption (SĐT, hứa lợi nhuận/tăng giá, giá thiếu VAT/phí bảo trì, độ dài TikTok).
- `npm run duyet:caption -- <tên>`, `npm run duyet:video -- <tên> [file.mp4]`
- `npm run send:telegram -- <tên> [file.mp4]`, `npm run telegram:chat-id`
- Thêm `--du-an <mã>` khi làm cho dự án khác dự án đang bán.
