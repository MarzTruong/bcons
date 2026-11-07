# Bot Telegram Bcons: giao việc bằng tin nhắn

Bot chạy trên **một máy** tại một thời điểm: laptop (`D:\Claude\bcons`) hoặc PC (`E:\Claude\bcons`). Mở bot ở máy nào thì lệnh render/tạo giọng chạy trên máy đó. Mở bot ở cả hai máy thì máy sau **chờ**, chuyển qua lại bằng `/chuyenmay` (mục "Chuyển máy" bên dưới). Dưới đây ghi đường dẫn laptop, trên PC thay `D:` bằng `E:`. Anh nhắn bot trên Telegram (điện thoại hay máy tính đều được), bot chạy lệnh thay anh. Máy chạy bot tắt hoặc ngủ thì bot ngừng. Tin anh nhắn lúc máy tắt **không tự chạy** khi mở máy lại (để tránh render/duyệt ngoài ý muốn); bot báo đã bỏ qua, anh nhắn lại nếu vẫn cần.

Chỉ tài khoản Telegram của anh, trong cuộc trò chuyện riêng với bot (`TELEGRAM_CHAT_ID` trong `.env`), điều khiển được bot. Người khác nhắn vào, hoặc thêm bot vào nhóm, bot im lặng. Bot không nhận tin chuyển tiếp (forward).

## Cài một lần (lần cuối anh phải dùng PowerShell)

1. Lấy bản mới nhất. Mở PowerShell:
   ```powershell
   cd D:\Claude\bcons
   git pull
   ```
2. Kiểm tra file `engine\remotion\.env` có đủ 2 dòng (mở bằng Notepad):
   ```
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_CHAT_ID=...
   ```
   Chưa có `TELEGRAM_CHAT_ID`: nhắn "hi" cho bot rồi chạy `cd engine\remotion` và `npm run telegram:chat-id`.
3. Kiểm tra **Claude Code** trên laptop (để bot giao việc tự do cho Claude):
   ```powershell
   claude --version
   ```
   Nếu báo lỗi không có lệnh `claude`: cài theo hướng dẫn chính thức tại https://docs.claude.com/en/docs/claude-code (mục cài đặt cho Windows). **Bắt buộc** chạy `claude` một lần trong PowerShell để đăng nhập tài khoản Claude của anh, rồi gõ `/exit`. Chưa đăng nhập thì bot chỉ báo lỗi khi anh giao việc tự do (các lệnh `/` vẫn chạy được).
4. **Chạy bot:** vào `D:\Claude\bcons`, bấm đúp **`Bcons-Bot.cmd`**. Một cửa sổ đen hiện ra, Telegram nhận tin "🤖 Bot Bcons đã chạy". Để cửa sổ đó mở (thu nhỏ được). Đóng cửa sổ là tắt bot.
5. **Cho bot tự chạy khi mở máy** (nên làm):
   - Bấm `Windows + R`, gõ `shell:startup`, Enter, một thư mục mở ra.
   - Chuột phải vào `Bcons-Bot.cmd` → **Show more options** → **Create shortcut**, kéo shortcut vừa tạo vào thư mục đó.
6. (Tùy chọn) Để laptop không ngủ khi cắm sạc: Settings → System → Power → Screen and sleep → "When plugged in, put my device to sleep after" = **Never**.

## Lệnh

| Anh nhắn | Bot làm |
|---|---|
| `/huongdan` | Danh sách lệnh |
| `/danhsach` | Trạng thái từng video: caption nháp/đã duyệt, có video chưa, video đã duyệt chưa |
| `/xem <tên>` | Gửi caption Facebook + TikTok và bản xem thử video |
| `/duyet <tên>` | Duyệt caption + video, gửi bản đăng về Telegram, tự lưu lên GitHub |
| `/render <tên>` | Render video (vài phút), xong gửi bản xem thử |
| `/giong <tên>` | Tạo giọng ElevenLabs. **Tốn credit** nên bot hỏi lại, anh bấm **Đồng ý** mới chạy |
| `/storyboard <tên>` | Chụp 3 khung mỗi cảnh, gửi album từng cảnh để duyệt hình **trước** khi tạo giọng. Không tốn credit |
| `/kiemgia` | Kiểm giá từng căn trong Master File (Drive `data/<mã>/gia/`) theo 5 thông báo PTTT của CĐT. Chỉ đọc, không gửi đi đâu |
| `/gemini <chủ đề>` | Nhờ Gemini (có tìm Google) gom số liệu kèm link, lưu `du-an/<mã>/nguon/gemini/`, gửi tóm tắt. Cần `GEMINI_API_KEY` trong `.env`. Số liệu chưa kiểm: nhắn Claude `/bcons-video <chủ đề>` để kiểm |
| `/sfx` | Tạo 3 hiệu ứng âm thanh (vút, tách, dồn) bằng ElevenLabs, **làm 1 lần**, tốn ít credit, bấm Đồng ý mới chạy |
| `/render <tên> khongnhac` | Bản không nhạc nền (giữ giọng + hiệu ứng), để tự chọn nhạc xu hướng trên TikTok. `/render <tên>` thường thì có nhạc |
| `/capnhat` | Lấy bản mới nhất từ GitHub (những gì em làm trên cloud), tự cài thư viện nếu cần |
| `/moi` | Bắt đầu cuộc trò chuyện Claude mới |
| `/huy` | Dừng việc đang chạy (render, tạo giọng, Claude) |
| Câu bình thường | Giao việc cho Claude Code trên laptop (vd. "rút gọn caption video cho thuê", "viết thêm hashtag cho video lãi suất") |

`<tên>` = **số video** trong `/danhsach` (vd. `/render 3`), hoặc tên đầy đủ, hoặc vài chữ đầu (`/render lai`). **Không nhớ thì gõ lệnh trơn** (`/render`), bot hiện danh sách video để bấm chọn.

Quy ước đặt tên (07/11/2026): mỗi video có **số cố định** và tiêu đề tiếng Việt (`so`, `tieuDe` trong `spec.json`). Video mới đặt thư mục `<số 2 chữ số>-<vài chữ không dấu>`, vd. `07-gioi-thieu-dot-2`. Video cũ giữ tên thư mục (đã gắn với Sheet, Metricool, Drive), chỉ thêm số 1–6.

## Một video từ đầu tới cuối
1. Em (Claude trên cloud, anh nhắn qua app Claude) viết kịch bản + caption, đẩy lên GitHub.
2. Anh nhắn bot `/capnhat`.
3. Đã có giọng chưa? Chưa thì `/giong <tên>` → bấm Đồng ý.
4. `/render <tên>` → xem bản thử trên điện thoại.
5. Ưng: `/duyet <tên>` → bot gửi bản đăng (video + caption TikTok + bài Facebook) và lưu lên GitHub.
6. Hẹn giờ: TikTok trên Metricool, Facebook trên Meta Business Suite (hoặc nhờ em hẹn qua kết nối Metricool khi đã bật).

## Giao việc tự do (cách B)
- Câu nào không bắt đầu bằng `/` được chuyển cho Claude Code trên laptop. Claude **chỉ được** đọc/sửa file, chạy kiểm tra, tìm web. Claude **không được** tạo giọng, render, lưu hay đẩy lên GitHub.
- Các giới hạn trên là rào chống nhầm lẫn, không phải khóa tuyệt đối; vì vậy bot luôn hỏi anh trước khi lưu lên GitHub.
- Claude sửa file xong, bot hỏi: **💾 Lưu lên GitHub** hoặc **↩️ Bỏ thay đổi** (bỏ = cất vào `git stash`, lấy lại được). Chỉ những file Claude sửa trong lần đó được lưu/bỏ; file khác (giọng đọc, việc anh đang sửa dở) không bị đụng.
- Claude nhớ cuộc trò chuyện trong 3 giờ; muốn bắt đầu chủ đề mới thì nhắn `/moi`.
- Việc lớn (làm video mới từ đầu, nghiên cứu số liệu nhiều nguồn) nên giao em qua app Claude như bây giờ: em có đủ công cụ và nhớ bối cảnh tốt hơn.

## Gặp lỗi
- Bot báo lỗi kèm vài dòng cuối của log. Chụp màn hình gửi em.
- Bot không trả lời: kiểm tra cửa sổ "Bot Bcons" còn mở không, laptop có mạng không. Bấm đúp `Bcons-Bot.cmd` để chạy lại.
- Bot tự chạy lại sau 10 giây nếu bị dừng giữa chừng.
- Cửa sổ báo "Bot da chay o cua so khac": anh đã mở 2 lần, cứ đóng cửa sổ đó.
- Cửa sổ báo "Thieu TELEGRAM_BOT_TOKEN...": kiểm tra lại file `.env` (bước 2).
- Sau `/capnhat` có bản bot mới, bot tự khởi động lại trong vài giây.

## Chuyển máy (PC ⇄ laptop), từ 07/11/2026
- Mở `Bcons-Bot.cmd` trên cả hai máy cũng được. Máy mở sau **không tắt**, mà chuyển sang **chờ** và nhắn Telegram kèm nút **"Chuyển sang <máy đó>"**.
- Muốn đổi máy lúc nào: nhắn **`/chuyenmay`** → bấm máy muốn dùng. Khoảng 10–40 giây sau (chờ Drive đồng bộ), Telegram báo "✅ Bot đã chuyển sang …". Máy cũ chuyển sang chờ, không cần đóng cửa sổ.
- Máy đang chạy bị tắt/ngủ/mất mạng hơn 3 phút: máy đang chờ **tự nhận việc** và báo Telegram.
- Đang render/tạo giọng thì không chuyển (bot báo đợi xong hoặc `/huy`).
- Đặt tên máy cho dễ đọc: thêm dòng `TEN_MAY=PC` (hoặc `TEN_MAY=Laptop`) vào `engine\remotion\.env` trên từng máy. Không đặt thì dùng tên Windows.
- Cần Drive for desktop trên cả hai máy (thư mục `Bcons - Dong bo thiet bi\bot\` do bot tự tạo). Máy không có Drive thì bot chạy như cũ, không chuyển được.
