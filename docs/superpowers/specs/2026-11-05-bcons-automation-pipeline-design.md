> **Trạng thái:** Thiết kế tổng, lịch sử về đường dẫn. Đã làm: kế hoạch 01, 02, 02b, 03. Đang làm: 05. Chưa làm: 04 (báo cáo tuần qua Metricool), giai đoạn 2–3 của lộ trình (quảng cáo Meta, quét tin hằng sáng, phân loại khách trong CRM).

> **Bản lịch sử.** Đường dẫn trong file này (`remotion-video/`, `config/project.json`...) là trước kế hoạch 01. Cấu trúc hiện tại: `CLAUDE.md` và `du-an/<mã>/`.

# Thiết kế: Hệ thống tự động hóa kênh Facebook/TikTok và phễu khách (05/11/2026)

Trạng thái: **nháp, chờ anh duyệt**. Gộp từ file anh gửi (`Brainstorm_X_y_d_ng_FB_Tiktok.txt`, `master_plan_bcons_automation_pipeline.md`) với repo hiện có. Sau khi duyệt: lập kế hoạch dựng (`writing-plans`).

## 1. Mục đích và lý do
Anh là sale của sàn Bcons PS Land (phân phối chính thức của CĐT Bcons), đang bán Bcons Central Park. Anh vừa tạo fanpage "Căn hộ Phan Trung – Bcons Central Park Biên Hòa" và kênh TikTok (khoảng 6 video). Anh muốn:
1. Làm video và bài đăng đều đặn mà không tốn nhiều giờ mỗi ngày.
2. Biết bài nào hiệu quả để làm tiếp chủ đề đó, vẫn bám dự án đang bán.
3. Có phễu thu khách: khách dùng công cụ tính dòng tiền, để lại thông tin, anh nhận tin Telegram ngay và gọi/nhắn trước đối thủ.
4. Đổi sang dự án Bcons khác thì hệ thống chuyển theo mà không phải viết lại.

Mốc thời gian: đợt 2 giới thiệu 29/11/2026, đợt 3 ngày 27/12/2026.

## 2. Mục tiêu / không phải mục tiêu / điều phải tránh
**Mục tiêu**
- Một nơi quản lý chung: Google Sheet "Lịch nội dung", mỗi bài một dòng, đi từ nháp đến đã đăng và có số liệu.
- Bài đã duyệt (video đã render + caption đã duyệt) tự đăng theo lịch lên Facebook và TikTok qua Metricool.
- Báo cáo hiệu quả hằng tuần và đề xuất chủ đề tuần sau.
- Landing page có công cụ tính dòng tiền (giá căn mẫu), form có ô đồng ý nhận tin, khách mới báo Telegram và ghi vào Sheet CRM.
- Thông tin dự án tách ra file cấu hình.

**Không phải mục tiêu**
- Không tự làm app TikTok hay dùng TikTok Content Posting API (cần giấy phép kinh doanh; anh quyết định 05/11/2026).
- Không quét GitHub/plugin tự động để kéo công cụ về. Danh sách công cụ chọn một lần, ghi ở mục 7.
- Không dùng cấu trúc thư mục của master plan (`video-engine/`, `workspace/`); dùng cấu trúc theo dự án ở mục 5.4 (anh yêu cầu 06/11/2026).
- Không đưa toàn bộ bảng giá lên web; chỉ giá các căn mẫu.
- Không render 60fps; giữ 30fps.

**Điều phải tránh (coi là thất bại dù chạy được)**
- Bài hoặc video chưa được anh duyệt lọt vào lịch đăng.
- Dữ liệu khách (tên, SĐT) hoặc API key bị commit lên git.
- Thu thông tin khách mà không có ô đồng ý nhận tin.
- Hiện SĐT/tên cá nhân của anh trên video (quyết định 04/11/2026).

## 3. Hiện trạng repo (giữ làm lõi)
| Phần | Đã có |
|---|---|
| Nghiên cứu | `docs/prompt-gemini-nghien-cuu.md` (Gemini Deep Research), Claude kiểm lại link |
| Kịch bản | skill `real-estate-content-creator`, `docs/video/<tên>.md` có bảng nguồn |
| Dựng video | `remotion-video/`: spec `specs/<tên>.json`, 6 mẫu cảnh, `npm run lint` chặn số thiếu nguồn, 30fps 1080x1920 |
| Giọng | ElevenLabs `scripts/generate-voice.mjs`, voice `9CCqsrTCLkHgQlKSMchK` |
| Render | `npm run render:drive -- <tên>` → `out/video/` + Drive |
| Quy trình | `/bcons-video` với 4 cổng duyệt |
| Fanpage | tài liệu `docs/content/fanpage-*.md`, kịch bản Messenger |
| Khách | Sheet "Bcons - Khach quan tam Messenger" (id `1c6K4ZC23cXreDt4sex2eSO-ObLO4YBF0KoBLlBp2-mU`), chưa có dữ liệu |
| Công cụ tính | artifact riêng tư https://claude.ai/artifact/PUaqHdDkV1Wu89crJH74si (638 căn, 5 PTTT); bảng giá & mặt bằng https://claude.ai/artifact/FkQB9zb7n87fyU8M2oMpBV |

## 4. Kiến trúc: 4 luồng
### Luồng 1. Video tự làm
Nghiên cứu (Gemini) → Claude kiểm nguồn → kịch bản **và caption FB/TikTok viết cùng lúc** (skill `real-estate-content-creator`) → anh duyệt chữ, số liệu, caption một lần → giọng → render → anh xem video → dòng trong Lịch nội dung chuyển "Đã duyệt" → lên lịch Metricool.
- Giữ nguyên `/bcons-video`; thêm bước cuối: ghi caption vào spec hoặc file `docs/video/<tên>-caption.md`, và thêm dòng vào Lịch nội dung.
- TikTok: hai cách, anh chọn theo từng video:
  - (a) Metricool tự đăng theo lịch.
  - (b) Bot Telegram gửi mp4 + caption về điện thoại để anh đăng tay kèm nhạc xu hướng (nhạc xu hướng không gắn được qua công cụ hẹn giờ).

### Luồng 2. Bài từ nguồn công ty
Công ty gửi ảnh/video/bài → anh thả vào thư mục Drive "Nguồn công ty" → Claude biên tập lại chữ (giữ nguyên thông tin gốc), gợi ý giờ đăng → anh duyệt → Lịch nội dung → Metricool.
- Đóng dấu: chỉ tên fanpage/logo kênh, không SĐT cá nhân.
- Dùng để lấp các ngày không có video tự làm.

### Luồng 3. Đo hiệu quả hằng tuần
Mỗi tuần (gợi ý: thứ Hai): xuất số liệu từ Metricool (hoặc Meta Business Suite + TikTok Studio nếu gói Metricool không có) → Claude đọc, ghi số liệu vào cột tương ứng trong Lịch nội dung → báo cáo ngắn `docs/bao-cao/<yyyy-mm-dd>.md`: top 3 bài, chủ đề/hook nào giữ người xem, 3 chủ đề đề xuất tuần sau → cập nhật `config/content-strategy.md` làm đầu vào cho Gemini.
- Chỉ bắt đầu kết luận khi mỗi kênh có khoảng 15–20 bài; trước đó báo cáo chỉ ghi số, không đổi hướng.

### Luồng 4. Phễu khách
Landing page (Cloudflare Pages) gồm: giới thiệu dự án, giá căn mẫu, công cụ tính dòng tiền (bản rút gọn từ artifact, chỉ căn mẫu), form Họ tên + SĐT Zalo + ô **đồng ý nhận tin** (bắt buộc tick) → Google Apps Script nhận form → ghi Sheet CRM → gửi Telegram cho anh.
- Tin Telegram gồm: tên, SĐT, căn mẫu đã xem, vốn có sẵn/số tiền vay đã nhập, nguồn (tham số `utm_source` trong link bio/bài đăng), giờ gửi; kèm một tin Zalo soạn sẵn theo căn khách xem để anh chép gửi.
- Link landing gắn ở bio TikTok, nút trên fanpage, bình luận đầu bài Facebook.
- Khách từ Messenger vẫn đi theo `docs/content/messenger-kich-ban.md` và ghi tay/ bán tự động vào cùng Sheet CRM.

## 5. Dữ liệu
### 5.1 Lịch nội dung (Google Sheet mới)
Cột tối thiểu: Mã bài, Luồng (video/công ty), Dự án, Chủ đề, Kênh (FB/TikTok/cả hai), File (link Drive), Caption FB, Caption TikTok, Trạng thái (Nháp / Chờ duyệt / Đã duyệt / Đã lên lịch / Đã đăng), Ngày giờ đăng, Link bài, Lượt xem, Thời gian xem TB, Tương tác, Lượt bấm link, Ghi chú.
Chỉ dòng "Đã duyệt" được đưa sang Metricool.

### 5.2 CRM
Dùng lại Sheet "Bcons - Khach quan tam Messenger", thêm tab hoặc cột cho khách từ landing: Ngày, Họ tên, SĐT, Dự án, Căn mẫu xem, Vốn có sẵn, Số tiền vay, Nguồn, Đồng ý nhận tin (có/thời điểm), Trạng thái chăm sóc. Dữ liệu này không bao giờ vào git.

### 5.3 Cấu hình dự án
`config/project.json`: tên dự án, địa chỉ, tọa độ, chủ đầu tư, số căn, các PTTT, đường dẫn tài liệu nguồn (`docs/bcons-central-park.md`), từ khóa nghiên cứu (khu vực, hạ tầng liên quan), tên kênh. Prompt Gemini, mẫu cảnh `project-close` và landing đọc từ đây. Đổi dự án = thêm file `docs/<du-an>.md` và sửa `config/project.json`.

### 5.4 Cấu trúc thư mục: mỗi dự án một thư mục riêng
Nguyên tắc: **máy dùng chung, nội dung theo dự án**. Code (Remotion, landing, tự động hóa) viết một lần, không chứa tên dự án; mọi thứ của một dự án (thông tin, nguồn, video, bài đăng, ảnh, bản đồ, báo cáo) nằm trong `du-an/<mã-dự-án>/`. Thêm dự án = chép `du-an/_mau/` và điền.

```text
bcons/
├── CLAUDE.md                     # quy tắc chung (pháp lý, cách làm việc)
├── NOTES.md                      # nhật ký chung
├── config.json                   # { "duAnDangBan": "bcons-central-park" }
├── .claude/                      # skill + lệnh dùng chung (/bcons-video nhận thêm mã dự án)
├── docs/                         # tài liệu chung: quy trình, prompt Gemini mẫu, thiết kế/kế hoạch
├── engine/                       # code dùng chung, không có số liệu dự án
│   ├── remotion/                 # = remotion-video/ hiện tại (src, scripts, tests, package.json)
│   ├── landing/                  # khung landing page, đọc dữ liệu từ du-an/<mã>/landing/
│   └── automation/               # Apps Script (form → Sheet → Telegram), gửi Telegram, công cụ (draw_boundary.py)
└── du-an/
    ├── _mau/                     # khung trống cho dự án mới
    └── bcons-central-park/
        ├── project.json          # cấu hình (mục 5.3)
        ├── thong-tin.md          # = docs/bcons-central-park.md
        ├── NOTES.md              # việc riêng của dự án (tách từ NOTES.md gốc)
        ├── nguon/                # đối chiếu nguồn, báo cáo Gemini ("Gemini Deep Research/")
        ├── video/<tên>/          # MỖI VIDEO MỘT THƯ MỤC:
        │   ├── spec.json         #   spec (hiện ở remotion-video/specs/)
        │   ├── timestamps.json
        │   ├── kich-ban.md       #   kịch bản + bảng nguồn (hiện ở docs/video/)
        │   ├── storyboard.md
        │   ├── caption.md        #   caption FB/TikTok (mới)
        │   └── audio/            #   mp3 ElevenLabs (hiện ở public/audio/<tên>/)
        ├── assets/
        │   ├── images/           # ảnh phối cảnh thu nhỏ dùng trong video
        │   └── geo/              # GeoJSON (public/geo/ + map/)
        ├── content/              # fanpage, Messenger, bài công ty đã biên tập
        ├── landing/              # dữ liệu căn mẫu, chữ của trang
        └── bao-cao/              # báo cáo hiệu quả tuần
```

Không lên git, cũng chia theo dự án: `data/<mã>/` (bảng giá, Master File), `anh/<mã>/` (ảnh gốc), `engine/remotion/out/<mã>/` (mp4). Tên thư mục trên Drive theo cùng mã dự án.

Ràng buộc kỹ thuật cho người dựng:
- Remotion đọc file tĩnh từ một thư mục `public`: lệnh render/tạo giọng truyền `--public-dir du-an/<mã>/` (hoặc tương đương), đường dẫn trong spec tính từ thư mục dự án (ví dụ `video/<tên>/audio/...`, `assets/geo/...`).
- Lệnh nhận mã dự án, mặc định lấy `config.json`: `npm run render:drive -- <tên>` vẫn chạy được, thêm `--du-an <mã>` khi cần.
- Chuyển thư mục là **bước đầu tiên của kế hoạch**, làm bằng `git mv` (giữ lịch sử), một commit riêng. Kiểm tra: `npm test` và `npm run lint` qua, băm khung hình `dong-nai-ha-tang` giống hệt trước khi dời.
- File không lên git trên máy anh (`.env`, `data/`, `anh/`, `out/`, `audio-test/`) không tự dời theo `git pull`: cần script `engine/automation/doi-thu-muc` chạy một lần trên PC, có chế độ chạy thử in ra danh sách trước khi dời. Cập nhật `.gitignore` theo đường dẫn mới.
- Cập nhật mọi đường dẫn trong `CLAUDE.md`, `NOTES.md`, `docs/quy-trinh-video.md`, `.claude/commands/bcons-video.md`, skill `real-estate-content-creator` (references).
- Lịch nội dung và CRM vẫn là **một Sheet chung** có cột "Dự án" (khách có thể chuyển sang dự án khác).

## 6. Skill
| Việc | Skill | Trạng thái |
|---|---|---|
| Kịch bản, caption, bài FB | `real-estate-content-creator` | có |
| Dựng video | `/bcons-video` + skill Remotion | có |
| Nghiên cứu | prompt Gemini + bước kiểm nguồn trong `/bcons-video` | có, chỉ thêm đọc `content-strategy.md` |
| Phân tích hiệu quả | `social-analytics` (mới, trong `.claude/skills/`) | cần làm |
| Tin Zalo cho khách mới | `sales-consultant` (mới) hoặc phần trong Apps Script dùng mẫu cố định | cần làm |
| Biên tập bài công ty | dùng `real-estate-content-creator` | có |

## 7. Công cụ đã chọn
Giữ: Google Drive, Google Sheets (connector đã có), Playwright (đã cài), ElevenLabs, Mapbox, Remotion, Gemini, Metricool, bot Telegram (gọi HTTP từ Apps Script), Cloudflare Pages.
Bỏ so với master plan: `filesystem-mcp`, `tavily`/`brave`, `meta-graph-mcp`, `apify-mcp`, `telegram-mcp`, Supabase.

## 8. Chi phí ước tính mỗi tháng (giá cần kiểm tra lại khi đăng ký)
| Hạng mục | Công cụ | Phí |
|---|---|---|
| Điều phối, kịch bản | Claude (đang dùng) | đã có |
| Nghiên cứu | Gemini (gói đang dùng) | đã có / khoảng 490 nghìn |
| Giọng | ElevenLabs: Starter khoảng 5 USD (30.000 ký tự ≈ tối đa 27 video không tạo lại); Creator khoảng 22 USD nếu 1 video/ngày | 130–580 nghìn |
| Đăng + số liệu | Metricool: gói miễn phí nếu đủ số bài, gói trả phí khoảng 20 USD | 0–520 nghìn |
| Landing | Cloudflare Pages + tên miền (khoảng 300 nghìn/năm) | khoảng 25 nghìn |
| CRM + Telegram | Sheets + Apps Script + bot | 0 |
| **Tổng** | | **khoảng 150 nghìn – 1,6 triệu**, tùy gói ElevenLabs/Metricool/Gemini |

## 9. Lộ trình
| Giai đoạn | Thời gian | Việc |
|---|---|---|
| 1. Xây kênh | 06/11 – 29/11 | Lịch nội dung + Metricool; 3–4 video tự làm/tuần, ngày còn lại bài công ty; landing + form + Telegram + CRM trước 29/11; `config/project.json` |
| 2. Phát triển | 30/11 – 27/12 | Báo cáo tuần (bắt đầu kết luận khi đủ 15–20 bài/kênh); đẩy chủ đề tài chính (dòng tiền, lãi vay) dẫn về landing; có thể chạy quảng cáo Meta nhỏ, anh duyệt ngân sách |
| 3. Duy trì | từ 01/2027 | Mỗi sáng tác vụ hẹn giờ quét tin và đề xuất chủ đề; phân loại khách trong CRM theo khả năng tài chính; sẵn sàng đổi dự án |

## 10. Ràng buộc
- Không commit `.env`, `data/`, `*.xlsx`, `*.mp4`, dữ liệu khách. Token Telegram, Metricool, Apps Script để trong `.env` hoặc Script Properties.
- Render chạy trên PC của anh; Metricool giữ lịch đăng nên PC không cần bật lúc đăng.
- Quy tắc nội dung theo 2 lớp trong `CLAUDE.md`: lớp cứng (pháp lý) và lớp gợi ý (sáng tạo).
- Form landing tuân thủ Nghị định 13/2023: ô đồng ý không tick sẵn, ghi rõ mục đích liên hệ tư vấn, có cách từ chối.

## 11. Quyết định của anh
1. Đăng tự động chỉ áp dụng cho sản phẩm cuối đã duyệt.
2. Không làm app TikTok; xem Metricool.
3. Landing chỉ đưa giá căn mẫu, không cần xin công ty.
4. Có ô tick đồng ý nhận tin.
5. Quy tắc nội dung mềm hơn để sáng tạo.
6. Không cài ECC vì không phù hợp dự án.
7. Gộp master plan vào repo theo hướng em đề xuất (05/11/2026, "Ok").

8. Cấu trúc mỗi dự án một thư mục (06/11/2026).
9. Landing lấy mỗi loại căn một căn mẫu: Studio, 1PN-1WC, 2PN-1WC, 2PN-2WC, 3PN-2WC (06/11/2026). Chọn căn: còn bán, không CĐT LOCK, giá gần trung vị của loại đó; danh sách mã căn anh duyệt trước khi lên web.
10. Đăng bài (đề xuất 06/11/2026, chờ anh chốt): FB qua Meta Business Suite (miễn phí, không giới hạn), TikTok qua Metricool gói Free (khoảng 20 bài hẹn giờ/tháng, đủ 3–4 video/tuần). Lên Metricool Starter (khoảng 20–25 USD/tháng, không giới hạn bài, giữ lịch sử số liệu) khi vượt 20 bài/tháng hoặc muốn gộp FB vào cùng báo cáo. Không cần API (chỉ có ở gói Advanced, khoảng 53–67 USD/tháng).

## 12. Em tự quyết (anh xem lại)
- Lịch nội dung là Sheet mới, CRM dùng lại Sheet Messenger.
- Báo cáo hiệu quả mỗi tuần, không 3 ngày/lần.
- Giữ 30fps.
- Apps Script thay cho server webhook.
- Nhịp giai đoạn 1: 3–4 video tự làm/tuần.
- Chỉ anh được đặt "Đã duyệt": cột Trạng thái khóa (protected range) cho tài khoản anh, thêm cột "Duyệt lúc". "Đã duyệt" áp cho đúng file mp4 + caption của dòng đó; render lại hoặc sửa caption thì dòng tự về "Chờ duyệt".
- Caption và bài công ty theo lớp quy tắc cứng trong `CLAUDE.md`, không qua `npm run lint` (lint chỉ cho spec video).
- Gửi video về Telegram (TikTok cách b): lệnh chạy trên PC sau khi render, ví dụ `npm run send:telegram -- <tên>`, gọi thẳng Telegram Bot API (giới hạn 50 MB/file, video hiện 12–19 MB). Không cần Apps Script đọc Drive.
- Báo cáo tuần giai đoạn đầu: anh tải file xuất (Metricool hoặc Business Suite + TikTok Studio) lên phiên, em đọc. Tự động hóa sau nếu có API.
- Giá căn mẫu sẽ công khai trên web nên được commit trong mã landing (vài căn, không phải bảng giá). Deploy Cloudflare từ PC bằng `wrangler`.
- Câu hỏi về VAT 10% trên toàn giá căn (NOTES) vẫn mở: landing ghi "giá tham khảo, chưa gồm/đã gồm VAT theo bảng giá CĐT" và cần anh xác nhận trước khi lên web.

## 13. Để người dựng tự quyết
Thiết kế giao diện landing; cách chuyển công cụ tính từ artifact sang mã tĩnh; định dạng chính xác file `config/project.json`; cách ghép caption vào spec; mẫu tin Telegram.
