# Phiếu tính gửi khách (PNG + PDF): kế hoạch thực hiện

> **Trạng thái:** Chưa làm (kế hoạch chờ anh duyệt, 11/11/2026). Thiết kế: `docs/superpowers/specs/2026-11-11-phieu-tinh-design.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Từ một căn + PTTT (khách chọn trên landing, hoặc anh gõ lệnh bot) dựng ra phiếu tính 1 trang PNG (và PDF khi cần), gửi về Telegram của anh để anh chuyển Zalo 1-1.

**Architecture:** Lõi tính tiền `calc.mjs` được tổng quát hóa để đọc lịch đợt từ `nguon/pttt-cdt.json` của từng dự án (Central Park và Newsky dùng chung). Dữ liệu phiếu (`phieu.json`) đưa vào một template HTML (UI/UX do Antigravity thiết kế, template tạm dựng từ ảnh mẫu), Chrome headless chụp ra PNG/PDF. Landing chỉ thêm `canMa` vào payload và Apps Script chèn một dòng lệnh bấm được vào tin Telegram; bot trên máy anh nhận lệnh `/phieu` và dựng phiếu (Apps Script không chạy được Chrome nên không dựng phiếu tại đó).

**Tech Stack:** Node ≥ 22.18 (`node --test`), `exceljs` 4.4.0 (đọc Master File), `qrcode` 1.5.4, Chrome do Remotion cài (trên cloud: `REMOTION_BROWSER=/opt/pw-browsers/chromium`), Google Apps Script.

**Spec:** `docs/superpowers/specs/2026-11-11-phieu-tinh-design.md`

## Global Constraints
- Phiếu rộng 540 px CSS, `deviceScaleFactor` 2 (PNG rộng 1080 px); cao mục tiêu ≤ 1.800 px; PDF khổ A4.
- Đúng một dòng giá: chưa VAT, có VAT, phí bảo trì 2% đóng khi nhận nhà. VAT 10%.
- Không hoa hồng, không dữ liệu nội bộ, không dữ liệu khách khác; không SĐT dạng chữ trên hình (có tên + QR).
- Chiết khấu PTTT 01 (8,5%), 04/05 (2,45%) và trần lãi 6,9% chỉ hiện khi khách chọn đúng PTTT đó; trần 6,9% chỉ PTTT 03 và 04 (Central Park), PTTT 09 (Newsky); không có ở PTTT 05 và PTTT 10.
- Căn ĐÃ CỌC, LOCK, hoặc không có trong GHC: không lập phiếu.
- Máy không tự gửi cho khách; mọi phiếu qua anh duyệt.
- Test dùng dữ liệu thật (tiêu đề cột Master File thật, số CĐT thật, payload landing cũ); không có dữ liệu khách thật trong repo; file phiếu ra `out/` (không lên git).
- Làm trên `main`; không PR; commit kèm dòng Co-Authored-By theo quy ước hiện hành.

## Review Focus
1. Căn đã cọc / LOCK / không có trong GHC: không được ra phiếu (Task 2, Task 6).
2. Newsky PTTT 08 có 12 đợt: phiếu có thể vượt 1.800 px; phải cảnh báo, không cắt (Task 4).
3. Khách không có tên hoặc tên rất dài: phiếu vẫn đẹp, xưng "anh/chị" khi thiếu tên (Task 2, Task 8).
4. PTTT không vay (Central Park 01, Newsky 08): không có dòng vay, trả góp, trần lãi (Task 2).
5. Payload landing cũ không có `canMa`, hoặc `canMa` lạ: lead vẫn được lưu và báo như cũ (Task 7); lệnh phiếu bấm lại nhiều lần hoặc sau khi bot khởi động lại không lỗi (Task 6).

## Cổng 0 (không phải code, chạy song song với Task 1–7)
Anh dán lời giao việc trong spec cho AGY → AGY trả template ở Drive `Bcons/agy/den-claude/<ngày>-phieu-tinh/` → anh gọi `/agy-doc` → Claude kiểm UX theo 6 tiêu chí của spec → anh chọn → Task 8 thay template. Task 1–7 dùng template tạm nên không phải chờ.

## File Structure
```
engine/landing/calc.mjs                    (sửa: thêm calcWith, giữ calc)
engine/landing/plans-json.mjs              (mới: đọc lịch đợt từ pttt-cdt.json)
engine/landing/phieu/du-lieu.mjs           (mới: dựng phieu.json từ căn + PTTT)
engine/landing/phieu/can.mjs               (mới: tìm căn từ landing.json hoặc Master File)
engine/landing/phieu/render.mjs            (mới: HTML -> PNG/PDF bằng Chrome)
engine/landing/phieu/mau/phieu.html        (mới: template tạm, sau thay bằng bản AGY)
engine/remotion/scripts/phieu.mjs          (mới: lệnh `npm run phieu`, parser lệnh)
engine/remotion/scripts/bot/handlers.mjs   (sửa: /phieu)
engine/remotion/scripts/bot/core.mjs       (sửa: HELP)
engine/remotion/scripts/bot/tg.mjs         (sửa: sendDocument)
engine/landing/client.js                   (sửa: payload.canMa)
engine/landing/apps-script/Code.gs         (sửa: canMa + dòng lệnh Telegram)
du-an/bcons-central-park/nguon/pttt-cdt.json, du-an/bcons-newsky/nguon/pttt-cdt.json (sửa: dotChiTiet)
```

### Task 1: Tổng quát hóa lõi tính tiền, đọc lịch đợt từ pttt-cdt.json

**Files:** sửa `engine/landing/calc.mjs`, `du-an/bcons-central-park/nguon/pttt-cdt.json`, `du-an/bcons-newsky/nguon/pttt-cdt.json`; mới `engine/landing/plans-json.mjs`, `engine/landing/plans-json.test.mjs`.

**Interfaces:**
- Produces trong `calc.mjs`: `calcWith(plan: {rows: {l: string, p: number, k: "tt"|"hdmb"|"mid"|"loan"|"handover"|"so", w: string}[]}, P: number, opts?: {vat?: number, fee?: number}) => {P, V, G, fee, rows: (row & {amt: number, bank: boolean})[], ownBefore, loan, handover, so}`. `calc(key, P)` giữ nguyên chữ ký và kết quả (gọi `calcWith`).
- Produces trong `plans-json.mjs`: `loadCdt(projDir: string) => object` (đọc `nguon/pttt-cdt.json`), `planFromJson(cdt: object, key: string) => {name: string, tag: string, cap: boolean, chietKhau: number, rows: {l,p,k,w}[], vat: number, fee: number}` (`p` lấy từ `dot`, `l/w/k` từ `dotChiTiet`, `cap = tranLai != null`, `vat/fee` từ `chung`).
- JSON thêm cho mỗi PTTT: `"dotChiTiet": [{"l": "...", "w": "...", "k": "tt"}, ...]`, đủ bằng độ dài `dot`. Nhãn đợt chép từ `PLANS` trong `calc.mjs` (Central Park) và từ `ThamSo` mục 5 của Master File Newsky (Newsky: PTTT 08 12 đợt, 09 7 đợt, 10 9 đợt).

- [ ] **Step 1: Viết test (đỏ)** trong `plans-json.test.mjs`: (a) Central Park, với 5 PTTT và giá căn A18-09 lấy từ `landing.json` (`canMau`), `calcWith(planFromJson(cdt, k), P)` deepEqual `calc(k, P)` (bỏ `l/w` nếu nhãn khác); (b) mỗi PTTT của cả hai dự án: `dotChiTiet.length === dot.length` và tổng `dot` = 100; (c) Newsky căn B1.3-01: PTTT 09 (P=4.060.690.141) `handover === 1136993239`, `loan === 2233379578`; PTTT 10 (P=3.973.385.292) `handover === 1112547882`, `loan === 2185361911`; PTTT 08 (P=3.831.261.156) `|handover − 1072753122| ≤ 3`; với cả ba, `|tổng các đợt (kể cả sổ hồng) − G| ≤ 10`.
- [ ] **Step 2:** Chạy `cd engine/remotion && node --test ../landing/plans-json.test.mjs`. Mong đợi: FAIL (thiếu module).
- [ ] **Step 3:** Tách phần thân `calc` thành `calcWith` (dùng `opts.vat ?? VAT`, `opts.fee ?? FEE`), `calc` gọi lại; viết `plans-json.mjs`; thêm `dotChiTiet` vào hai file JSON (`npm test` hiện có kiểm `dot` nên giữ nguyên `dot`).
- [ ] **Step 4:** Chạy `npm test` trong `engine/remotion`. Mong đợi: toàn bộ qua, gồm `calc.test.mjs` và `pttt-cdt.test.mjs` cũ.
- [ ] **Step 5: Commit** "Generalize calc to read payment schedule from pttt-cdt.json".

### Task 2: Dựng dữ liệu phiếu (`phieu.json`)

**Files:** mới `engine/landing/phieu/du-lieu.mjs`, `engine/landing/phieu/du-lieu.test.mjs`.

**Interfaces:**
- Consumes: `planFromJson`, `loadCdt` (Task 1), `calcWith`, `pmt`.
- Produces: `taoPhieu(o: {projDir: string, can: CanInfo, pttt: string, lai?: number, nam?: number, khach?: {ten?: string}, ngay?: Date}) => Phieu`. `CanInfo = {ma: string, loai: string, thap?: string, tang?: number, dtTimTuong: number, dtThongThuy?: number, giaChuaVat: Record<string, number>, tinhTrang?: string}` (khóa của `giaChuaVat` là mã PTTT "01".."05", "08".."10"). `Phieu = {duAn: {ma, ten}, khach: {xungHo: string}, ngay: string, can, pttt: {ma, ten, ghiChu, coTranLai: boolean, chietKhau: number}, gia: {chuaVat, vat, coVat, phiBaoTri}, dot: {nhan, thoiDiem, soTien, loai: "tuco"|"nganhang"|"bangiao"|"sohong"}[], tong: {tuCoTruocBanGiao, khoanVay, banGiao, soHong}, vay: null | {soTien, lai, namVay, traGopThang}, lienHe: {ten, qrLink, landing}}`. Lỗi bắt đầu bằng "Không lập phiếu:" khi `tinhTrang` là "ĐÃ CỌC", "LOCK" hoặc "Không có trong GHC", PTTT không có trong dự án, hoặc thiếu giá PTTT đó. `khach.xungHo` = `anh/chị <tên>` hoặc "anh/chị" khi không có tên. Mặc định `lai` 9,5, `nam` 20 (từ `landing.json` nếu có `laiGiaDinh`, `namGiaDinh`).
- Mẫu `lienHe.ten`, `qrLink` lấy từ `project.json` → `lienHe`, `watermark.link`; **không** chép `sdt`.

- [ ] **Step 1: Viết test (đỏ):** (a) Central Park A18-09 PTTT 03: `tong.tuCoTruocBanGiao + tong.khoanVay + tong.banGiao + tong.soHong` bằng `gia.coVat` ± 10; `pttt.coTranLai === true`; `vay.traGopThang > 0`; (b) `coTranLai === false` cho Central Park 05 và Newsky 10, `true` cho Newsky 09; (c) `vay === null` và không có đợt `nganhang` cho Central Park 01 và Newsky 08; (d) `JSON.stringify(phieu)` không chứa "hoaHong", "sdt" hay "0938"; (e) ném lỗi "Không lập phiếu:" cho `tinhTrang` "ĐÃ CỌC" và "LOCK"; (f) không tên: `khach.xungHo === "anh/chị"`; tên 60 ký tự vẫn trả nguyên; (g) Newsky PTTT 08 có đúng 12 phần tử trong `dot`.
- [ ] **Step 2:** Chạy `node --test ../landing/phieu/du-lieu.test.mjs`. Mong đợi: FAIL.
- [ ] **Step 3:** Cài `taoPhieu`: dựng kế hoạch bằng `planFromJson`, tính bằng `calcWith`, phân `loai` theo `k` (`loan` → nganhang, `handover` → bangiao, `so` → sohong, còn lại tuco), `thoiDiem` = `w`.
- [ ] **Step 4:** Chạy lại test. Mong đợi: PASS.
- [ ] **Step 5: Commit** "Add phieu.json builder with rule guards".

### Task 3: Tìm căn (landing.json hoặc Master File)

**Files:** mới `engine/landing/phieu/can.mjs`, `engine/landing/phieu/can.test.mjs`.

**Interfaces:**
- Produces: `timCanMau(projDir: string, ma: string) => CanInfo | null` (từ `landing.json` → `canMau`); `timCotMaster(header: string[]) => {ma: number, gia: Record<string, number>, tinhTrang?: number, tim?: number, thongThuy?: number, pn?: number} | null`; `docCanTuMaster(file: string, ma: string) => Promise<CanInfo | null>` (sheet `GiaTongHop`, tiêu đề ở hàng 4 hoặc tự dò trong 15 hàng đầu, đọc giá trị đã tính của ô công thức); `timMasterFile(projDir: string) => string | null` (`sharedDir("data")/<mã>/gia/MasterFile_*.xlsx`, bỏ file `~$`); `timCan(projDir: string, ma: string) => Promise<CanInfo | null>` (Master File trước, `canMau` sau).
- Mã căn chuẩn hóa: cắt khoảng trắng, chữ hoa.

- [ ] **Step 1: Viết test (đỏ)** với tiêu đề cột **thật**: Central Park `"Giá chưa VAT\nPTTT 01 (sau CK 8,5%)"`, `"Giá chưa VAT\nPTTT 02 / 03"`, `"Giá chưa VAT\nPTTT 04 / 05 (CK 2,45%)"`, `"Tình trạng trên\nGIỎ HÀNG CHUNG"`; Newsky `"Giá chưa VAT\nPTTT 08 (giá CĐT)"`, `"Giá chưa VAT\nPTTT 09 (giá gốc)"`, `"Giá chưa VAT\nPTTT 10 (giá CĐT)"` cùng cột `"Tính lại PTTT 08\n(giá 09 − CK 5,65%)"` (phải bị bỏ qua). Kiểm: `timCotMaster` ánh xạ đúng PTTT (cột gộp "02 / 03" cho cả 02 và 03); cột đơn giá/có VAT/phí không bị nhận nhầm; `docCanTuMaster` trên workbook dựng bằng `exceljs` trong test đọc đúng căn B1.3-01 (giá 3.831.261.156, 4.060.690.141, 3.973.385.292, tình trạng "Trống") và trả `null` cho mã không có; `timCan` rơi về `canMau` khi không có Master File.
- [ ] **Step 2:** Chạy `node --test ../landing/phieu/can.test.mjs`. Mong đợi: FAIL.
- [ ] **Step 3:** Cài các hàm; `timCotMaster` dùng cùng cách bỏ dấu và bắt "pttt\s*(n(?:\s*/\s*n)*)" như `findPriceColumns` trong `engine/remotion/scripts/kiem-masterfile.mjs`, nhưng không đòi đủ PTTT 01–05 và chỉ nhận cột có "giá chưa vat".
- [ ] **Step 4:** Chạy lại test. Mong đợi: PASS.
- [ ] **Step 5: Commit** "Add unit lookup from landing.json and Master File".

### Task 4: Bộ dựng PNG/PDF và template tạm

**Files:** mới `engine/landing/phieu/render.mjs`, `engine/landing/phieu/render.test.mjs`, `engine/landing/phieu/mau/phieu.html`.

**Interfaces:**
- Hợp đồng template: một file HTML chứa đúng một chuỗi `__PHIEU_DATA__` nằm trong `<script type="application/json" id="phieu-data">`; script của chính template đọc JSON `Phieu` (Task 2), tự điền DOM, rồi đặt `document.documentElement.dataset.ready = "1"`; bề rộng nội dung 540 px; QR tạo trong template từ `lienHe.qrLink` hoặc template nhận sẵn SVG (engine chèn `phieu.lienHe.qrSvg`).
- Produces: `dungHtml(template: string, phieu: Phieu) => string` (thay marker bằng JSON, thoát `</script>`); `renderPhieu(o: {html: string, outDir: string, tenFile: string, pdf?: boolean, browser?: string}) => Promise<{png: string, pdf?: string, cao: number, canhBao?: string}>`. Trình duyệt: `o.browser` → `process.env.REMOTION_BROWSER` → Chrome do Remotion cài (`ensureBrowser`); không có thì ném "Chưa tìm thấy Chrome". PNG rộng 1080 px, cao theo nội dung; `canhBao` khi cao > 1800 px.
- Template tạm: dựng từ ảnh mẫu C (`docs/superpowers/specs/assets/phieu-mau/C-cau-truoc-bang-sau.html`), chuyển phần điền chữ sang đọc JSON.

- [ ] **Step 1: Viết test (đỏ)** (bỏ qua nếu không có Chrome, ghi rõ lý do): template chứa marker đúng một lần; `dungHtml` không để lại marker và không phá khi dữ liệu chứa `</script>`; `renderPhieu` với `Phieu` Central Park A18-09 PTTT 03 ra PNG có chiều rộng 1080 (đọc IHDR), `cao > 0`, `canhBao` undefined; với Newsky B1.3-01 PTTT 08 (12 đợt) ra PNG và nếu cao > 1800 thì `canhBao` có chữ "cao"; `pdf: true` ra file bắt đầu `%PDF`.
- [ ] **Step 2:** Chạy `REMOTION_BROWSER=/opt/pw-browsers/chromium node --test ../landing/phieu/render.test.mjs`. Mong đợi: FAIL.
- [ ] **Step 3:** Cài `dungHtml`, `renderPhieu` bằng Chrome headless chạy dòng lệnh (không thêm thư viện): lần 1 đo chiều cao nội dung, lần 2 chụp ở cửa sổ đúng chiều cao với `--force-device-scale-factor=2`, PDF bằng `--print-to-pdf`; viết template tạm.
- [ ] **Step 4:** Chạy lại test. Mong đợi: PASS; mở hai PNG tạo ra bằng mắt, kiểm số liệu và chữ không đè.
- [ ] **Step 5: Commit** "Add phieu renderer (PNG/PDF) and temporary template".

### Task 5: Lệnh `npm run phieu` và bộ đọc lệnh

**Files:** mới `engine/remotion/scripts/phieu.mjs`, `engine/remotion/tests/phieu-cli.test.mjs`; sửa `engine/remotion/package.json` (script `"phieu": "node scripts/phieu.mjs"`).

**Interfaces:**
- Produces: `parseLenhPhieu(text: string) => {ma: string, pttt: string, lai?: number, nam?: number, ten?: string, pdf: boolean}`; `chayPhieu(args: ReturnType<parseLenhPhieu> & {projDir: string}, deps?: {timCan, render}) => Promise<{png: string, pdf?: string, phieu: Phieu, canhBao?: string}>`.
- Hai dạng lệnh: `A18-09 03 lai=9.5 nam=20 ten=Minh pdf` (khoảng trắng) và dạng bấm được của Telegram `/phieu_A18_09_03_9p5_20` (chỉ chữ, số, gạch dưới): ba token cuối = PTTT, lãi (`p` là dấu thập phân), năm; phần còn lại nối bằng `-`, `p` → `.` (ví dụ `/phieu_B1p3_01_09_9p5_20` → mã `B1.3-01`, PTTT `09`). PTTT hai chữ số, bỏ "PTTT" nếu có.

- [ ] **Step 1: Viết test (đỏ):** `parseLenhPhieu("A18-09 03 lai=9.5 nam=20 ten=Minh pdf")` và `parseLenhPhieu("/phieu_A18_09_03_9p5_20")` cùng cho `{ma: "A18-09", pttt: "03", lai: 9.5, nam: 20}`; `"/phieu_B1p3_01_09_9p5_20"` cho mã `B1.3-01`, PTTT `09`; `"PTTT 03"` chuẩn hóa thành `"03"`; `chayPhieu` với `deps` giả: căn "ĐÃ CỌC" → ném "Không lập phiếu:"; mã lạ → ném "Không thấy căn"; thành công trả đường dẫn trong `out/phieu/` (không lên git).
- [ ] **Step 2:** Chạy `node --test tests/phieu-cli.test.mjs`. Mong đợi: FAIL.
- [ ] **Step 3:** Cài; `--du-an <mã>` dùng `takeProjectFlag` như các lệnh khác; in đường dẫn file và cảnh báo.
- [ ] **Step 4:** Chạy `npm test`. Mong đợi: qua hết. Chạy thật: `REMOTION_BROWSER=/opt/pw-browsers/chromium npm run phieu -- A18-09 03` (Central Park) và `npm run phieu -- --du-an bcons-newsky B1.3-01 09 pdf` nếu có Master File trong `data/` (cloud không có: dùng `deps` giả trong test, nói rõ ở báo cáo).
- [ ] **Step 5: Commit** "Add phieu CLI and Telegram command parser".

### Task 6: Lệnh bot `/phieu`

**Files:** sửa `engine/remotion/scripts/bot/handlers.mjs`, `engine/remotion/scripts/bot/core.mjs`, `engine/remotion/scripts/bot/tg.mjs`, `engine/remotion/tests/bot-handlers.test.mjs`, `docs/huong-dan-bot-telegram.md`.

**Interfaces:**
- Consumes: `parseLenhPhieu`, `chayPhieu` (Task 5). Thêm `tg.sendDocument(chatId: number, file: string, caption?: string) => Promise<void>`.
- Produces: lệnh `/phieu <đối số>` và dạng `/phieu_...`; trả ảnh PNG kèm chú thích (khách nếu có, căn, PTTT), thêm PDF nếu có `pdf`, rồi một câu gợi ý tin Zalo ngắn. Lỗi trả tin bắt đầu "Không lập phiếu:" hoặc "Không thấy căn". Lệnh không giữ trạng thái.

- [ ] **Step 1: Viết test (đỏ)** với `tg` giả theo mẫu `bot-handlers.test.mjs`: lệnh hợp lệ gửi đúng một ảnh và không gửi gì khác ngoài chú thích; thêm `pdf` thì gọi `sendDocument`; căn đã cọc → chỉ nhắn "Không lập phiếu:"; gọi cùng lệnh hai lần liên tiếp cho cùng kết quả (không lỗi); lệnh `/phieu_A18_09_03_9p5_20` nhận được như lệnh thường; `HELP` có dòng `/phieu`.
- [ ] **Step 2:** Chạy `node --test tests/bot-handlers.test.mjs`. Mong đợi: FAIL ở các ca mới.
- [ ] **Step 3:** Cài handler, thêm `HELP`, `sendDocument`, cập nhật hướng dẫn bot (lệnh, ví dụ, "chỉ chạy trên máy có bot").
- [ ] **Step 4:** Chạy `npm test` và `npm run lint`. Mong đợi: qua hết.
- [ ] **Step 5: Commit** "Add /phieu bot command".

### Task 7: Landing và Apps Script gửi kèm mã căn, chèn dòng lệnh

**Files:** sửa `engine/landing/client.js`, `engine/landing/apps-script/Code.gs`, `engine/landing/apps-script.test.mjs`, `engine/landing/page.test.mjs` nếu kiểm payload.

**Interfaces:**
- Produces: `payload.canMa` (từ `canMau[i].ma`) trong `client.js`; trong `Code.gs`: `canMa` được lọc theo `/^[A-Z0-9.\-]{3,14}$/` (sai thì thành chuỗi rỗng, **không** bỏ lead); `lenhPhieu_(l) => string` trả `/phieu_<mã căn: "-"→"_", "."→"p">_<PTTT hai chữ số>_<lãi: "."→"p">_<năm>` hoặc chuỗi rỗng khi thiếu `canMa`; `formatTelegram_` thêm dòng "Dựng phiếu tính: <lệnh>" chỉ khi có lệnh.
- Lead cũ (thiếu `canMa`) và lead có `canMa` lạ vẫn được lưu vào Sheet và báo Telegram như hiện nay.

- [ ] **Step 1: Viết test (đỏ)** theo cách `apps-script.test.mjs` đang nạp `Code.gs`, dùng payload **thật** của landing hiện tại: (a) payload cũ không `canMa` → lead lưu, tin Telegram không có dòng "Dựng phiếu"; (b) payload có `canMa: "A18-09"`, `pttt: "PTTT 03"`, `lai: 9.5`, `nam: 20` → tin có đúng `/phieu_A18_09_03_9p5_20`; (c) `canMa: "A18-09; DROP"` → lead lưu, không có dòng lệnh; (d) `canMa: "B1.3-01"` → `/phieu_B1p3_01_...`.
- [ ] **Step 2:** Chạy `node --test ../landing/apps-script.test.mjs`. Mong đợi: FAIL ở (b), (d).
- [ ] **Step 3:** Sửa `client.js`, `Code.gs`; chạy `npm run landing` để dựng lại landing (kiểm `calc.js` vẫn được chép đúng).
- [ ] **Step 4:** Chạy `npm test`. Mong đợi: qua hết. **Việc của anh sau khi em xong:** dán lại `Code.gs` vào Apps Script và triển khai bản mới, đăng landing như hướng dẫn hiện có; thử một lead thật, bấm lệnh trong tin Telegram, xem phiếu về (cổng duyệt).
- [ ] **Step 5: Commit** "Landing sends unit code; Telegram report includes /phieu command".

### Task 8: Thay template AGY, kiểm UX, nghiệm thu, tài liệu

**Files:** sửa `engine/landing/phieu/mau/phieu.html`; mới `engine/remotion/scripts/phieu-mau.mjs` (lệnh `npm run phieu:mau`); sửa `docs/superpowers/specs/2026-11-11-phieu-tinh-design.md`, `docs/README.md`, `NOTES.md`.

**Interfaces:**
- Produces: `npm run phieu:mau` dựng bộ phiếu kiểm UX vào `out/phieu-mau/` và in chiều cao từng ảnh: (1) Central Park A18-09 PTTT 03; (2) Newsky B1.3-01 PTTT 08 (12 đợt); (3) Newsky PTTT 10; (4) Central Park PTTT 01 (không vay); (5) tên khách rất dài; (6) không tên.

- [ ] **Step 1:** Khi AGY trả template: chép vào `mau/phieu.html` đúng hợp đồng ở Task 4 (marker, `data-ready`, 540 px).
- [ ] **Step 2:** Chạy `npm run phieu:mau` và `npm test`; xem từng ảnh theo 6 tiêu chí UX của spec (chữ ≥ 13 px, một con số chính, khớp `calc.mjs`, cao ≤ 1.800 px, dữ liệu dài/thiếu, PDF A4 một trang); ghi chỗ cần sửa gửi lại AGY hoặc tự tối ưu nhỏ.
- [ ] **Step 3:** Gửi anh bộ ảnh `phieu-mau` để chọn/duyệt (cổng duyệt thiết kế); chỉnh theo ý anh.
- [ ] **Step 4:** Cập nhật spec (**Trạng thái:** Đã xong), `NOTES.md` (việc dở: Zalo OA/ZNS tự gửi, ghi vết phiếu vào Master_Data khi có), `docs/README.md` nếu đổi tên file.
- [ ] **Step 5: Commit** "Phieu: AGY template, UX review set, docs". Báo anh cách dùng: `/capnhat` trên bot, rồi gõ `/phieu A18-09 03` hoặc bấm lệnh trong tin Telegram của lead.

## Không làm trong kế hoạch này
Gửi Zalo tự động (Zalo OA/ZNS), ghi lịch sử phiếu vào `Master_Data` (chờ thiết kế pipeline Master_Data), landing riêng cho Newsky.
