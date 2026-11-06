# Kế hoạch 02: Caption, duyệt bài và lịch đăng

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi bài (video tự làm hoặc bài công ty) có một `caption.md` được kiểm tự động theo quy tắc cứng, anh duyệt một lần; chỉ bài đã duyệt mới được gửi về điện thoại qua Telegram và đưa vào Sheet "Lịch nội dung" để đăng FB (Meta Business Suite) và TikTok (Metricool hoặc đăng tay).

**Architecture:** Caption là file Markdown có phần đầu YAML (`status`, `duyetLuc`, `noiDungSha256`, `videoSha256`) nằm cạnh spec video. Module `caption.mjs` đọc/kiểm caption; lệnh `duyet:video` ghi dấu vân tay (sha256) của mp4 anh đã xem vào caption, nên render lại thì dấu không khớp và bài tự về "chờ duyệt". `send:telegram` chạy trên máy anh, chỉ gửi khi caption `approved` và dấu vân tay khớp. Sheet do Claude tạo và ghi qua connector Google Sheets (không cần khóa API Google trên máy anh).

**Tech Stack:** Node ≥ 22.18 (`node --test`, `fetch`, `FormData`, `Blob` có sẵn), Telegram Bot API, connector Google Sheets/Drive của Claude.

**Spec:** `docs/superpowers/specs/2026-11-05-bcons-automation-pipeline-design.md` (Luồng 1, Luồng 2, mục 5.1, mục 11 quyết định 1–2, 10)

## Global Constraints
- Chỉ bài đã duyệt mới vào lịch đăng hoặc được gửi Telegram (quy tắc cứng 6). "Đã duyệt" áp cho đúng mp4 + caption: đổi caption sau khi duyệt hoặc render lại thì phải duyệt lại.
- Caption không chứa SĐT, không tên cá nhân của anh (quy tắc cứng 7); không cam kết lợi nhuận/hứa tăng giá (quy tắc 3); nhắc giá thì phải có "VAT" và "bảo trì" (quy tắc 5); không nói "sắp hết"/"cuối cùng" khi nhắc căn (gợi ý sáng tạo: ghi là nhận định).
- Không làm app TikTok, không dùng TikTok Content Posting API (quyết định 06/11/2026). Không cần API Metricool (gói Advanced).
- Token Telegram (`TELEGRAM_BOT_TOKEN`) và mã cuộc trò chuyện (`TELEGRAM_CHAT_ID`) chỉ nằm trong `engine/remotion/.env`. Không in token ra màn hình.
- Telegram Bot API giới hạn 50 MB/file gửi lên; video hiện 12–19 MB.
- `send:telegram` và `duyet:video` chỉ chạy trên máy anh (cần mp4); trên cloud chỉ viết/kiểm caption và ghi Sheet.
- Đường dẫn qua `engine/remotion/scripts/project.mjs`; lệnh nhận `--du-an <mã>`.

## Định dạng `caption.md` (nguồn chuẩn cho Task 1)
```markdown
---
status: draft            # draft | approved
duyetLuc: ""             # ISO time anh duyệt caption, vd 2026-11-07T09:30:00+07:00
noiDungSha256: ""        # sha256 phần nội dung lúc anh duyệt (sửa sau duyệt → phải duyệt lại)
videoSha256: ""          # sha256 của mp4 anh đã xem; trống = chưa duyệt video
kenh: [facebook, tiktok]
---
## Facebook
<nội dung bài FB, có thể nhiều đoạn>

## TikTok
<caption ngắn ≤ 2.200 ký tự, kèm hashtag>
```
Vị trí: video tự làm `du-an/<mã>/video/<tên>/caption.md`; bài công ty `du-an/<mã>/content/bai-cong-ty/<yyyy-mm-dd>-<slug>/caption.md` (ảnh/video gốc để trên Drive, link ghi trong Sheet).

## Sheet "Lịch nội dung" (nguồn chuẩn cho Task 4)
Tab `LichDang`, hàng 1 là tiêu đề, cột A→Q: Mã bài | Luồng (video/công ty) | Dự án | Chủ đề | Kênh (FB/TikTok/Cả hai) | File (link Drive) | Caption FB | Caption TikTok | Trạng thái | Duyệt lúc | Ngày giờ đăng | Link bài | Lượt xem | Thời gian xem TB | Tương tác | Lượt bấm link | Ghi chú.
Trạng thái là danh sách chọn: Nháp / Chờ duyệt / Đã duyệt / Đã lên lịch / Đã đăng. Tab `HuongDan`: cách dùng 5 dòng. Mã bài = tên video hoặc `cty-<yyyy-mm-dd>-<slug>`.

## Review Focus
1. Anh sửa caption sau khi đã duyệt (thêm một câu) → `send:telegram` phải từ chối và nói "caption đổi sau khi duyệt", không gửi bản cũ.
2. Render lại cùng tên video sau khi duyệt → dấu vân tay mp4 khác → từ chối, nhắc chạy `duyet:video`.
3. Caption có giá kiểu "2,06 tỷ" nhưng không ghi VAT → `check:caption` báo lỗi nêu đúng dòng.
4. SĐT viết có dấu chấm/cách (`0905.935.935`, `0905 935 935`, `+84 905…`) → vẫn bị bắt.
5. Thiếu `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` hoặc mp4 > 50 MB → báo rõ bằng tiếng Việt trước khi gọi mạng.

---

### Task 1: Đọc và kiểm caption

**Files:**
- Create: `engine/remotion/scripts/caption.mjs`
- Test: `engine/remotion/tests/caption.test.mjs`

**Interfaces:**
- Produces:
  - `parseCaption(text: string): { meta: { status, duyetLuc, noiDungSha256, videoSha256, kenh: string[] }, facebook: string, tiktok: string, body: string }`: `body` là phần sau frontmatter (dùng để tính dấu nội dung).
  - `bodyHash(text: string): string`: sha256 của `body` đã chuẩn hóa xuống dòng (`\r\n`→`\n`, bỏ khoảng trắng cuối).
  - `checkCaption(text: string): string[]`: danh sách lỗi tiếng Việt, rỗng = qua.
  - `writeMeta(text: string, patch: object): string`: trả caption mới với frontmatter đã cập nhật, giữ nguyên `body`.
- Quy tắc của `checkCaption`:
  - thiếu `## Facebook` khi `kenh` có facebook, thiếu `## TikTok` khi có tiktok;
  - TikTok > 2.200 ký tự;
  - SĐT Việt Nam: regex bắt `0` hoặc `+84` theo sau 9–10 chữ số có thể ngăn bởi dấu chấm, gạch, cách;
  - cụm cấm (không phân biệt hoa thường, bỏ dấu khi so): "cam kết lợi nhuận", "lợi nhuận chắc chắn", "chắc chắn tăng giá", "đảm bảo tăng giá", "x2 tài sản", "sắp hết hàng", "căn cuối cùng";
  - có giá (`\d[\d.,]*\s*(tỷ|triệu)` trong cùng đoạn với "giá") mà caption không có "VAT" và "bảo trì" → lỗi;
  - `status: approved` mà `duyetLuc` trống → lỗi.

- [ ] **Step 1: Viết test hỏng** `caption.test.mjs`: parse mẫu ở trên (status, kenh, facebook/tiktok tách đúng); `bodyHash` giống nhau khi chỉ khác `\r\n`; `checkCaption` bắt `0905.935.935`, `0905 935 935`, `+84 905 935 935`; bắt "Cam kết LỢI NHUẬN"; "Giá từ 2,06 tỷ" không VAT → có lỗi chứa "VAT"; có "2,06 tỷ chưa VAT, phí bảo trì 2%" → không lỗi; caption sạch → `[]`; `writeMeta(t, { status: "approved" })` giữ nguyên `body`.
- [ ] **Step 2:** `cd engine/remotion && node --test tests/caption.test.mjs` → FAIL (chưa có module).
- [ ] **Step 3:** Viết `caption.mjs` (frontmatter tự đọc bằng regex, không thêm thư viện YAML; chỉ hỗ trợ đúng 5 khóa trên).
- [ ] **Step 4:** Test PASS; `npm test` toàn bộ PASS.
- [ ] **Step 5:** Commit `feat: caption parser and rule checks`.

### Task 2: Lệnh kiểm caption, duyệt caption, duyệt video

**Files:**
- Create: `engine/remotion/scripts/caption-cli.mjs`
- Modify: `engine/remotion/package.json` (scripts), `engine/remotion/scripts/check-spec.mjs` (lint kiểm luôn caption nếu có)
- Test: `engine/remotion/tests/caption-cli.test.mjs`

**Interfaces:**
- Consumes: Task 1; `takeProjectFlag`, `videoPaths`, `listVideos` (project.mjs).
- Produces (lệnh, chạy trong `engine/remotion/`):
  - `npm run check:caption -- <tên>|--all [--du-an <mã>]`: in lỗi, exit 1 nếu có lỗi.
  - `npm run duyet:caption -- <tên>`: chỉ chạy khi `checkCaption` rỗng; ghi `status: approved`, `duyetLuc` = giờ hiện tại (+07:00), và `bodyHash` vào `noiDungSha256`.
  - `npm run duyet:video -- <tên> [file.mp4]`: tính sha256 của `out/video/<tên>.mp4` (hoặc file chỉ định), ghi vào `videoSha256`. Từ chối nếu caption chưa `approved`.
  - `approvalState(captionText: string, mp4Path: string | null): { ok: boolean, reason: string }`: export để Task 3 dùng. Lý do: "caption chưa duyệt" | "caption đổi sau khi duyệt" (bodyHash ≠ noiDungSha256) | "video chưa duyệt" | "video đã render lại sau khi duyệt" (sha khác) | "".
- Lệnh duyệt là việc của **anh** (hoặc em chạy khi anh nói rõ "duyệt"); skill `/bcons-video` không tự chạy.

- [ ] **Step 1: Viết test hỏng**: thư mục dự án giả; `duyet:caption` từ chối caption có SĐT; duyệt xong rồi sửa body → `approvalState` = "caption đổi sau khi duyệt"; `duyet:video` với mp4 giả → ok; ghi đè mp4 khác nội dung → "video đã render lại sau khi duyệt".
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Viết `caption-cli.mjs` (lệnh con: `check`, `duyet-caption`, `duyet-video`), thêm 3 script vào `package.json`; `check-spec.mjs --all` gọi `checkCaption` cho video có `caption.md` (caption `draft` có lỗi chỉ in CẢNH BÁO, `approved` có lỗi là LỖI).
- [ ] **Step 4:** PASS; `npm run lint` vẫn PASS với 7 video hiện có (chưa có caption → bỏ qua).
- [ ] **Step 5:** Commit `feat: caption check and approval commands`.

### Task 3: Gửi video + caption về Telegram

**Files:**
- Create: `engine/remotion/scripts/send-telegram.mjs`, `engine/remotion/scripts/telegram-chat-id.mjs`
- Modify: `engine/remotion/package.json`
- Test: `engine/remotion/tests/send-telegram.test.mjs`

**Interfaces:**
- Consumes: Task 2 `approvalState`; `parseCaption`.
- Produces:
  - `buildTelegramRequests({ token, chatId, mp4Path, caption }): Array<{ url: string, body: FormData }>`: (1) `sendVideo` với `video` = file, `caption` = 1.024 ký tự đầu phần TikTok, `supports_streaming=true`; (2) `sendMessage` phần Facebook đầy đủ (nếu > 4.096 ký tự thì chia nhiều tin). URL dạng `https://api.telegram.org/bot<token>/<method>`.
  - `npm run send:telegram -- <tên> [file.mp4] [--du-an <mã>]`: thứ tự kiểm, **trước khi gọi mạng**: có token/chat id → `approvalState` ok → file ≤ 50 MB. Lỗi in tiếng Việt, exit 1. Thành công in "Đã gửi <tên> về Telegram".
  - `npm run telegram:chat-id`: gọi `getUpdates`, in các `chat.id` + tên người gửi gần nhất, để anh chép vào `.env` (anh nhắn "hi" cho bot trước).
- Bài công ty không có mp4: `send:telegram -- --bai <đường dẫn thư mục bài>` gửi 2 tin chữ (FB, TikTok) kèm link Drive ghi trong caption; vẫn yêu cầu caption `approved` (bỏ kiểm video).

- [ ] **Step 1: Viết test hỏng**: `buildTelegramRequests` tạo đúng 2 request, URL có `/sendVideo` và `/sendMessage`, caption video ≤ 1.024 ký tự, FB 5.000 ký tự → 2 tin; script với `fetch` giả (thay `globalThis.fetch`) không được gọi khi thiếu token, khi caption chưa duyệt, khi file 51 MB (file thưa tạo bằng `fs.truncateSync`).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Viết 2 script; đọc `.env` bằng `process.loadEnvFile(".env")` như `render-drive.mjs`; không log token.
- [ ] **Step 4:** PASS. Commit `feat: send approved video and caption to Telegram`.

### Task 4: Tạo Sheet "Lịch nội dung" và cách ghi dòng

**Files:**
- Create: `docs/huong-dan-dang-bai.md`
- Modify: `du-an/bcons-central-park/project.json` (thêm `"lichNoiDungSheetId"`), `engine/remotion/scripts/project.mjs` (không bắt buộc khóa mới), `CLAUDE.md` (1 dòng trỏ Sheet + hướng dẫn)

- [ ] **Step 1:** Tạo Google Sheet "Bcons - Lịch nội dung" qua connector Drive/Sheets (trong Drive của anh), tab `LichDang` với 17 cột ở trên, danh sách chọn cột Trạng thái, cố định hàng 1; tab `HuongDan`. Ghi id vào `project.json` → `lichNoiDungSheetId`.
- [ ] **Step 2:** Đọc lại Sheet bằng connector (`get_values` hàng 1) → đúng 17 tiêu đề theo thứ tự.
- [ ] **Step 3:** Viết `docs/huong-dan-dang-bai.md`:
  - Một lần: tạo bot Telegram qua @BotFather, chép token vào `engine/remotion/.env` (`TELEGRAM_BOT_TOKEN=`), nhắn "hi" cho bot, `npm run telegram:chat-id`, chép vào `TELEGRAM_CHAT_ID=`; đăng ký Metricool gói Free, nối TikTok (và Facebook nếu muốn), thử hẹn giờ 1 video để xác nhận gói Free tự đăng được TikTok; Meta Business Suite > Lập kế hoạch.
  - Mỗi bài: anh duyệt caption (`npm run duyet:caption`) → render → xem → `npm run duyet:video` → `npm run send:telegram` → FB: tải lên Business Suite, dán caption FB, hẹn giờ → TikTok: Metricool (hẹn giờ) hoặc đăng tay từ điện thoại kèm nhạc xu hướng → báo em "đã lên lịch <tên> <giờ>" để em cập nhật Sheet (hoặc anh tự sửa cột Trạng thái).
  - Gợi ý giờ đăng giai đoạn 1: 3–4 video/tuần, ngày còn lại bài công ty; giờ cụ thể để trống tới khi có số liệu tuần (kế hoạch 04).
- [ ] **Step 4:** Commit `docs: content calendar sheet and posting guide`.

### Task 5: Nối vào quy trình `/bcons-video` và bài công ty

**Files:**
- Modify: `.claude/skills/bcons-video/SKILL.md`, `docs/quy-trinh-video.md`, `.claude/rules/preflight-and-sources.md`
- Create: `du-an/_mau/content/bai-cong-ty/.gitkeep`, `.claude/skills/bai-cong-ty/SKILL.md`

- [ ] **Step 1:** `/bcons-video` cổng 2: viết thêm `caption.md` (`status: draft`, dùng skill `real-estate-content-creator`), chạy `npm run check:caption -- <tên>`; khi anh duyệt chữ + số thì chạy `npm run duyet:caption -- <tên>` cùng lúc đổi spec sang `approved`. Cổng 4 (trên máy anh): sau render, anh xem rồi `npm run duyet:video`, `npm run send:telegram`; em thêm/cập nhật dòng trong Sheet (Trạng thái "Đã duyệt", Duyệt lúc, Caption FB/TikTok).
- [ ] **Step 2:** Skill `bai-cong-ty`: anh đưa link Drive/ảnh/bài của công ty → em giữ nguyên thông tin gốc, viết lại `caption.md` theo giọng kênh, không thêm số không có trong bài gốc, không SĐT cá nhân → `check:caption` → chờ anh duyệt → ghi Sheet (Luồng "công ty", File = link Drive).
- [ ] **Step 3:** Thêm vào `preflight-and-sources.md` mục "Caption" (5 quy tắc kiểm tự động + duyệt gắn dấu vân tay).
- [ ] **Step 4:** `npm test && npm run lint` PASS. Commit `feat: caption step in /bcons-video and company-post skill`.

### Task 6: Caption nháp cho 5 video đã duyệt

**Files:**
- Create: `du-an/bcons-central-park/video/{dong-nai-ha-tang,lai-suat-vay-mua-nha-2026,ha-tang-bien-hoa-2026,cho-thue-kcn-bien-hoa-2026,tai-thiet-kcn-bien-hoa-1}/caption.md`

- [ ] **Step 1:** Với từng video: đọc `kich-ban.md` (lời bình + bảng nguồn), viết caption FB + TikTok bằng skill `real-estate-content-creator`, chỉ dùng số đã có trong bảng nguồn, `status: draft`.
- [ ] **Step 2:** `npm run check:caption -- --all` → không lỗi.
- [ ] **Step 3:** Thêm 5 dòng vào Sheet, Trạng thái "Chờ duyệt". Commit `content: draft captions for 5 approved videos`, push.
- [ ] **Step 4:** Gửi anh danh sách 5 caption để duyệt (không tự chạy `duyet:caption`).
