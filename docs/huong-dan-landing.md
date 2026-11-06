# Landing page + báo khách Telegram: cài một lần

Trang landing gồm: thông tin dự án, 5 căn mẫu (mỗi loại một căn), công cụ tự tính dòng tiền 5 PTTT, form để lại tên + SĐT/Zalo có ô **đồng ý nhận tin** (không tick sẵn). Khách gửi form thì:
1. Thông tin vào Sheet **"Bcons - Khach quan tam Messenger"**, tab **Landing**.
2. Telegram của anh nhận 2 tin: thông tin khách + căn khách xem, và **tin Zalo soạn sẵn** để anh chép gửi.

Code: `engine/landing/` (dùng chung) và `du-an/bcons-central-park/landing/landing.json` (dữ liệu dự án).

## Bước 1: Điền tên trong ô đồng ý (em làm khi anh gửi họ tên)
Ô đồng ý và trang chính sách ghi tên anh là người giữ dữ liệu khách (phương án A). Tên **chỉ** xuất hiện ở hai chỗ đó, không có trên video hay bài đăng. Nếu thiếu tên, trang không đăng được (máy tự chặn).

## Bước 2: Apps Script (nhận form, ghi Sheet, báo Telegram), khoảng 10 phút
1. Mở Sheet **Bcons - Khach quan tam Messenger** trên Google Sheets (máy tính).
2. Menu **Tiện ích mở rộng → Apps Script**. Một trang mới mở ra.
3. Xóa hết chữ trong ô soạn thảo, dán toàn bộ nội dung file `engine/landing/apps-script/Code.gs` (em gửi kèm qua chat hoặc anh mở trên GitHub). Bấm biểu tượng 💾 **Lưu**.
4. Bên trái bấm ⚙️ **Cài đặt dự án** (Project Settings) → kéo xuống **Thuộc tính tập lệnh** (Script Properties) → **Thêm thuộc tính** 2 lần:
   - `TELEGRAM_BOT_TOKEN` = token bot (giống trong `engine\remotion\.env`)
   - `TELEGRAM_CHAT_ID` = mã chat (giống trong `.env`)
   Bấm **Lưu thuộc tính tập lệnh**.
5. Quay lại **Trình chỉnh sửa** (biểu tượng `< >`), chọn hàm **thuTelegram** ở thanh trên, bấm **▶ Chạy**. Google hỏi cấp quyền → chọn tài khoản của anh → "Advanced/Nâng cao" → "Go to ... (unsafe)/Đi tới ..." → **Allow/Cho phép** (đây là script của chính anh). Telegram phải nhận tin "✅ Apps Script landing Bcons đã nối Telegram".
6. Bấm **Triển khai (Deploy) → Bản triển khai mới (New deployment)** → biểu tượng ⚙️ chọn **Ứng dụng web (Web app)**:
   - Execute as: **Me**
   - Who has access: **Anyone** (để khách không cần đăng nhập Google vẫn gửi được form)
   - Bấm **Deploy**, chép **Web app URL** (dạng `https://script.google.com/macros/s/.../exec`) gửi em.
7. **Khi em gửi bản `Code.gs` mới** (sửa lỗi, đổi mẫu tin): dán đè code, Lưu, rồi **Triển khai → Quản lý bản triển khai (Manage deployments) → biểu tượng ✏️ → Phiên bản: Phiên bản mới (New version) → Triển khai**. Không tạo "Bản triển khai mới" lần nữa (sẽ ra link khác, trang không gửi tới được).

## Bước 3: Cloudflare Pages (đăng trang miễn phí), khoảng 10 phút
1. Tạo tài khoản miễn phí tại https://dash.cloudflare.com/sign-up (dùng email của anh).
2. Vào **Workers & Pages → Create** → chọn thẻ **Pages** (không phải Workers) → **Import an existing Git repository** → chọn GitHub, cấp quyền cho repo **MarzTruong/bcons**.
3. Cấu hình:
   - Framework preset: **None**; Root directory: để trống
   - Production branch: `main`
   - Build command: `node engine/landing/build.mjs`
   - Build output directory: `engine/landing/dist/bcons-central-park`
   - Project name: ví dụ `bcons-central-park` → trang sẽ là `https://bcons-central-park.pages.dev`
   - Environment variables: thêm `NODE_VERSION` = `22`
4. Bấm **Save and Deploy**. Lần đầu sẽ **báo lỗi** vì chưa có tên và link form (máy cố ý chặn). Khi em điền xong và đẩy lên `main`, Cloudflare tự build lại và trang lên mạng. Từ đó mỗi lần em sửa trang, trang tự cập nhật.

## Bước 4: Gắn link
- **TikTok:** Hồ sơ → Sửa hồ sơ → Trang web: `https://<tên>.pages.dev/?utm_source=tiktok` (TikTok chỉ cho thêm link ở bio khi tài khoản đủ điều kiện; chưa đủ thì ghi trong caption "link ở trang Facebook").
- **Fanpage:** Thêm nút (Add button) → **Tìm hiểu thêm** / **Đăng ký** → link `...?utm_source=facebook`.
- Bình luận đầu bài Facebook: `...?utm_source=fb-post`.
Phần `utm_source` giúp biết khách đến từ đâu (cột **Nguồn** trong Sheet).

## Mỗi khi có khách
Telegram báo 2 tin. Gọi hoặc nhắn Zalo sớm (tin Zalo đã soạn sẵn, anh sửa lại cho tự nhiên). Cập nhật cột **Trạng thái chăm sóc** trong tab Landing. Khách xin ngừng: chọn "Xin ngừng liên hệ" và không nhắn nữa.

## Trước mỗi lần đổi trang
Trên máy có bảng giá (`data/bcons-central-park/bang-gia.csv`), lệnh xuất trang tự chặn nếu một căn mẫu đã cọc hoặc CĐT LOCK. Cloudflare không có bảng giá nên không kiểm được: em kiểm trên cloud trước khi đẩy lên `main`.

## Đổi căn mẫu / giá
Khi bảng giá CĐT đổi hoặc căn mẫu đã bán: gửi em Master File mới, em cập nhật `landing.json` (mỗi loại chọn căn còn bán, giá gần mức giữa), đẩy lên `main`, trang tự cập nhật.
