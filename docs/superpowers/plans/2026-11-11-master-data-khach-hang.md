# Master_Data khách hàng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Trạng thái:** Nháp, chờ anh duyệt (11/11/2026).

**Goal:** Gom khách từ landing (tự động) và CRM (anh nhập tay) về một Google Sheet `Master_Data`, chống trùng theo SĐT, rồi đẩy một chiều về `Master_<mã>` của từng dự án.

**Architecture:** Một dự án Apps Script gắn với Sheet Master_Data, viết thành hai file: `Logic.gs` (hàm thuần, test bằng `node:vm` như `engine/landing/apps-script.test.mjs`) và `Sheets.gs` (đọc/ghi Sheet, trigger, Telegram; test bằng Sheet giả trong bộ nhớ). Mọi lần chạy có chế độ `dryRun` (chỉ báo cáo, không ghi). Landing `Code.gs` chỉ thêm cột "Dự án", không đổi luồng báo Telegram.

**Tech Stack:** Google Apps Script (V8), Node `node --test`, Google Sheets.

**Spec:** `docs/superpowers/specs/2026-11-11-master-data-khach-hang-design.md`

## Global Constraints
- Dữ liệu khách (tên, SĐT, nhu cầu) **không vào repo, log chung, `NhatKy`, tin Telegram**; chỉ `MaKhach` và số đếm. Fixture test là dữ liệu **ẩn danh hóa nhưng đúng dạng thật**.
- Khóa API/ID Sheet ở Script Properties, không ghi vào file. Không dán khóa vào chat.
- Một chiều Master_Data → `Master_<mã>`; không bao giờ ghi đè cột anh nhập tay.
- `DongYNhanTin` không tự đổi thành `Có` khi thiếu bằng chứng; `Không` hoặc SĐT trong `TuChoi` luôn thắng.
- SĐT không chuẩn hóa được → tab `Loi`, không im lặng bỏ qua.
- Khách có dự án trống → tab `ChuaPhanDuAn`. Khách nhiều dự án → có mặt ở tất cả `Master_<mã>` tương ứng.
- Múi giờ `Asia/Ho_Chi_Minh`. Hàm Apps Script kết thúc bằng `_` là hàm nội bộ (cùng quy ước `Code.gs`).
- Ghi lên Sheet thật chỉ sau cổng G1–G6 trong spec mục 12; mỗi cổng anh duyệt bằng "OK".
- Test chạy trong `npm test` của `engine/remotion`; GitHub tự chạy mỗi lần push.

## Review Focus
1. Ô SĐT bị Google Sheets đổi thành số, mất số 0 đầu (`901234567`): coi là `0901234567` (chỉ ở `Logic.gs` của Master_Data), không rơi vào `Loi`.
2. Dòng landing có cột "Đồng ý nhận tin" rỗng hoặc lạ: `DongYNhanTin = Chưa rõ`, không bao giờ `Có`.
3. Anh sửa `HoTen` trong `KhachHang` rồi landing gửi lại cùng SĐT với tên khác: giữ tên anh sửa.
4. SĐT trong `TuChoi` điền lại landing: không vào bất kỳ `Master_<mã>`, nhật ký có đếm "bị chặn".
5. Hai trigger chạy chồng (hoặc chạy lại sau khi chết giữa chừng): không trùng `MaKhach`, không nhân đôi dòng.
6. Ô tên bắt đầu bằng `=`, `+`, `-`, `@` khi ghi ra Sheet: không thành công thức.

---

## File Structure
- Create `engine/master-data/apps-script/Logic.gs`: hàm thuần (chuẩn hóa, đọc dòng landing, gộp, quyết định đích).
- Create engine/master-data/apps-script/Sheets.gs: chạy gộp/phân bổ, nhật ký, Telegram, menu, trigger.
- Create `engine/master-data/helpers.mjs`: `loadGs(files)` nạp `.gs` vào `vm`; `fakeSheets()` Sheet giả.
- Create `engine/master-data/fixtures.mjs`: dữ liệu mẫu ẩn danh hóa.
- Create `engine/master-data/logic.test.mjs`, engine/master-data/sheets.test.mjs.
- Modify `engine/landing/apps-script/Code.gs`, `engine/landing/apps-script.test.mjs`, `engine/landing/client.js`.
- Modify `engine/remotion/package.json` (glob test thêm `../master-data/*.test.mjs`).
- Create docs/huong-dan-master-data.md; modify `docs/README.md`.

### Task 1: Khung, trình nạp `.gs`, chuẩn hóa SĐT

**Files:**
- Create: `engine/master-data/helpers.mjs`, `engine/master-data/fixtures.mjs`, `engine/master-data/apps-script/Logic.gs`, `engine/master-data/logic.test.mjs`
- Modify: `engine/remotion/package.json` (dòng `"test"`)

**Interfaces:**
- Produces: `loadGs(paths: string[]) -> ctx` (các hàm `.gs` gọi được như `ctx.fn(...)`); `Logic.gs`: `normalizePhone_(s: any) -> string` (`0xxxxxxxxx` hoặc `''`); hằng `KHACH_COLS: string[]` (thứ tự cột `KhachHang`, spec mục 5, bỏ `HanGiu`): `MaKhach, SDT, HoTen, NgayTao, NgayCapNhat, NguonGoc, NguonChiTiet, DuAnQuanTam, NhuCau, CanXem, PTTT, DongYNhanTin, DongYBangChung, TrangThaiCRM, TrangThaiChamSoc, NguoiChamSoc, GhiChu`.
- `fixtures.mjs`: `PHONES_REAL_FORMS` gồm `+84 98 123 4567`, `84981234567`, `098.123.4567`, `(098) 123-4567`, `0981234567` (cùng một số, đã ẩn danh).

- [ ] **Step 1: Test thất bại.** Trong `logic.test.mjs`: mọi phần tử `PHONES_REAL_FORMS` → `"0981234567"`; `"12345"`, `""`, `null` → `""`; số 9 chữ số `981234567` (số) → `"0981234567"` (Review Focus 1); test **tương đương** với `engine/landing/apps-script/Code.gs`: với danh sách trên, `normalizePhone_` của Master_Data trả cùng kết quả như của `Code.gs` (trừ ca 9 chữ số, ghi chú là khác biệt có chủ ý).
- [ ] **Step 2: Chạy `cd engine/remotion && node --test ../master-data/logic.test.mjs`.** Mong đợi: FAIL (chưa có `Logic.gs`).
- [ ] **Step 3: Viết `loadGs`** (đọc file, `vm.createContext`, `runInContext`), thêm `../master-data/*.test.mjs` vào script `test`, viết `normalizePhone_` và `KHACH_COLS` trong `Logic.gs`. Số 9 chữ số bắt đầu bằng 3,5,7,8,9 thì thêm `0`.
- [ ] **Step 4: Chạy lại test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): scaffold + phone normalizer`.

### Task 2: Landing ghi cột "Dự án" (cổng G2: thử trên bản sao trước)

**Files:**
- Modify: `engine/landing/apps-script/Code.gs` (`HEADERS`, `validateLead_`, `rowFor_`), `engine/landing/client.js:91` (payload), `engine/landing/apps-script.test.mjs`
- Test: `engine/landing/apps-script.test.mjs`

**Interfaces:**
- Consumes: payload landing hiện có.
- Produces: `HEADERS` thêm hai cột cuối `Dự án`, `Đã gộp` (sau `Ghi chú`, để cột cũ không đổi vị trí). `validateLead_` trả `lead.duAn: string`: mã dạng `^[a-z0-9-]{3,40}$`, không khớp → `'khong-ro'`. `rowFor_` ghi `lead.duAn` vào cột `Dự án`, cột `Đã gộp` để trống.

- [ ] **Step 1: Test thất bại** thêm vào `apps-script.test.mjs`: payload `duAn: "bcons-central-park"` → `lead.duAn` giữ nguyên; `duAn: "<x>"`, thiếu, hoặc dài 100 ký tự → `"khong-ro"`; `rowFor_(...)` dài đúng `HEADERS.length`, phần tử cột `Dự án` đúng mã, cột `Đã gộp` rỗng; các test cũ vẫn qua (vị trí 17 cột đầu không đổi).
- [ ] **Step 2: Chạy `node --test ../landing/apps-script.test.mjs`.** Mong đợi: FAIL.
- [ ] **Step 3: Sửa `Code.gs` như Interfaces.** Trong `client.js` thêm `duAn` vào payload lấy từ dữ liệu trang đã nhúng (xem `page.mjs:93`, trường mã dự án; nếu chưa có trường đó, thêm `ma` vào JSON nhúng và test `page.test.mjs`).
- [ ] **Step 4: Chạy toàn bộ `npm test` trong `engine/remotion`.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(landing): record project code per lead`. **Không triển khai lên script thật**: anh dán vào bản sao Sheet và thử một lần (G2); em hướng dẫn theo `docs/huong-dan-landing.md`.

### Task 3: Đọc dòng landing thành bản ghi khách

**Files:** Modify `engine/master-data/apps-script/Logic.gs`, `engine/master-data/fixtures.mjs`; Test `engine/master-data/logic.test.mjs`

**Interfaces:**
- Consumes: `normalizePhone_`, `KHACH_COLS`.
- Produces: `parseLandingRow_(headers: string[], row: any[]) -> {ok: true, rec: Record} | {ok: false, lyDo: string}` với `rec` có đủ khóa `KHACH_COLS` (chuỗi). Ánh xạ theo **tên cột** (không theo vị trí): `SĐT→SDT`, `Họ tên→HoTen`, `Nhu cầu→NhuCau`, `Căn xem + Loại căn→CanXem`, `PTTT`, `Nguồn→NguonChiTiet`, `Dự án→DuAnQuanTam` (`khong-ro`/rỗng → `''`), `Thời gian→NgayTao`. `NguonGoc="Landing"`. `DongYNhanTin`: cột "Đồng ý nhận tin" bắt đầu `Có (` → `Có`, `DongYBangChung` = nguyên chuỗi đó; ngược lại `Chưa rõ`. Tên và ghi chú qua `cell_` kiểu `Code.gs` (chặn công thức).

- [ ] **Step 1: Test thất bại** với dòng dựng từ `HEADERS` thật của `Code.gs` (đọc từ file bằng `loadGs`, không gõ tay): chuỗi đồng ý thật `Có (2026-11-06T03:15:00.000Z, mẫu v1-2026-11-06, https://x.pages.dev/)`; SĐT dạng `'0981234567` và dạng số `981234567`; cột Dự án `khong-ro`; tên `=HYPERLINK(1)`; SĐT sai `12345` → `{ok:false, lyDo:"SĐT không hợp lệ"}`; ô đồng ý rỗng → `Chưa rõ`.
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement `parseLandingRow_`.** Dòng thiếu cột (ngắn hơn headers) coi ô thiếu là rỗng.
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): parse landing rows`.

### Task 4: Hợp nhất khách trùng SĐT

**Files:** Modify `Logic.gs`; Test `logic.test.mjs`

**Interfaces:**
- Produces: `mergeCustomer_(existing: Record, incoming: Record, nowIso: string) -> Record`. Quy tắc (spec mục 6): cột "anh" (`TrangThaiCRM, TrangThaiChamSoc, NguoiChamSoc, GhiChu`) giữ giá trị của `existing`, riêng ô `existing` trống thì điền từ `incoming` (khớp Task 7); cột "hệ thống/anh" (`HoTen, NhuCau, CanXem, PTTT, NguonChiTiet`) chỉ điền khi `existing` trống; `DuAnQuanTam` = hợp hai danh sách ngăn `;`, không trùng, giữ thứ tự cũ; `NguonGoc` → `Landing+CRM` khi hai nguồn khác nhau; `DongYNhanTin`: nếu một bên `Không` → `Không`; nếu `existing` là `Có` giữ; ngược lại `incoming` nếu `Có`, còn lại `Chưa rõ`; `DongYBangChung` giữ cái đầu tiên có; `NgayCapNhat = nowIso`, `NgayTao`/`MaKhach` giữ cũ.
- `dongYThang_(a, b) -> string` nội bộ nếu cần.

- [ ] **Step 1: Test thất bại**: (a) Review Focus 3: tên anh sửa không bị ghi đè; (b) landing rồi CRM → `Landing+CRM`, dự án hợp `a;b` không lặp; (c) `Không` thắng `Có`; (d) `incoming` không thể nâng `Chưa rõ` lên `Có` nếu `incoming.DongYNhanTin` cũng `Chưa rõ`; (e) cột anh không đổi dù incoming có giá trị.
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement** theo Interfaces.
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): merge duplicate customers`.

### Task 5: Quyết định đích phân bổ

**Files:** Modify `Logic.gs`; Test `logic.test.mjs`

**Interfaces:**
- Produces: `decideDestinations_(rec: Record, tuChoi: Set<string>, projectCodes: string[]) -> {chan: boolean, chua: boolean, dich: string[]}`. `chan=true` khi `rec.SDT` ∈ `tuChoi` hoặc `DongYNhanTin==='Không'` (khi đó `dich=[]`, `chua=false`). `dich` = các mã trong `DuAnQuanTam` có trong `projectCodes`; mã lạ bị bỏ và nếu không còn mã hợp lệ → `chua=true`. `DuAnQuanTam` rỗng → `chua=true`.

- [ ] **Step 1: Test thất bại**: hai dự án → `dich` có cả hai; rỗng → `chua`; mã lạ `xyz` → `chua`; SĐT trong `TuChoi` → `chan` (Review Focus 4); `Không` → `chan`; `Chưa rõ` (khách CRM) **không** bị chặn khỏi `Master_<mã>` (chỉ không nhắn hàng loạt, việc đó ở cột `DongYNhanTin`).
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): allocation decision`.

### Task 6: Gộp landing vào KhachHang (idempotent, có dryRun)

**Files:** Create engine/master-data/apps-script/Sheets.gs; Modify `helpers.mjs` (thêm `fakeSheets()`); Test engine/master-data/sheets.test.mjs

**Interfaces:**
- Consumes: `parseLandingRow_`, `mergeCustomer_`, `KHACH_COLS`.
- Produces: `fakeSheets(spec) -> {SpreadsheetApp, LockService, PropertiesService, UrlFetchApp, calls}` mô phỏng đủ API dùng (openById, getSheetByName, getDataRange().getValues(), getRange().setValues(), appendRow, insertSheet, waitLock/releaseLock). `Sheets.gs`: `ensureTabs_(ss)` tạo các tab `KhachHang, NhapCRM, Loi, ChuaPhanDuAn, TuChoi, NhatKy, CauHinh` với dòng tiêu đề nếu thiếu; `nextMaKhach_(rows) -> "KH-000001"` (max hiện có + 1, ghi 6 chữ số); `gopLanding_(opts: {dryRun: boolean, now: Date}) -> {doc: number, moi: number, trung: number, loi: number}`. Đọc từng Sheet landing (ID ở tab `CauHinh` cột `landingSheetId`), chỉ xử lý dòng cột `Đã gộp` rỗng; khi không `dryRun`, ghi `Đã gộp` = `MaKhach` **sau khi** ghi `KhachHang` xong; toàn hàm trong `LockService.getScriptLock()`.

- [ ] **Step 1: Test thất bại** trên Sheet giả: 3 dòng landing (1 mới, 1 trùng SĐT với khách đã có, 1 SĐT sai) → `{doc:3, moi:1, trung:1, loi:1}`, dòng sai vào `Loi` kèm lý do, `KhachHang` có đúng 2 dòng; chạy lần hai → `moi:0, trung:0` (idempotent); `dryRun:true` → số đếm đúng nhưng Sheet không đổi; giả lập chết giữa chừng (ném lỗi sau khi ghi `KhachHang`, trước khi đánh dấu `Đã gộp`) rồi chạy lại → không nhân đôi (khớp theo SĐT, Review Focus 5); `MaKhach` liên tục không trùng.
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement** theo Interfaces; tên ghi ra Sheet qua `cell_` (Review Focus 6, thêm bản sao `cell_` vào `Logic.gs` nếu chưa có).
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): merge landing leads`.

### Task 7: Gộp tab NhapCRM

**Files:** Modify `Sheets.gs`; Test `sheets.test.mjs`

**Interfaces:**
- Produces: `gopNhapCRM_(opts) -> {doc, moi, trung, loi}`. Cột tối thiểu của `NhapCRM`: `HoTen, SDT, DuAnQuanTam, TrangThaiCRM`; bản ghi có `NguonGoc="CRM"`, `DongYNhanTin="Chưa rõ"`. Dòng đã xử lý được đánh dấu cột `DaGop`; SĐT sai vào `Loi`.

- [ ] **Step 1: Test thất bại**: khách CRM mới → vào `KhachHang`, `NguonGoc=CRM`; cùng SĐT với khách landing → một dòng `Landing+CRM`, `TrangThaiCRM` lấy từ nhập tay; SĐT dạng `098.123.4567` và `0981234567` coi là một người; dòng thiếu SĐT → `Loi`.
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement** dùng lại `mergeCustomer_` và đường ghi của Task 6 (không nhân đôi mã).
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): merge CRM manual entries`.

### Task 8: Phân bổ sang `Master_<mã>` và xử lý rút lại

**Files:** Modify `Sheets.gs`; Test `sheets.test.mjs`

**Interfaces:**
- Consumes: `decideDestinations_`, tab `CauHinh` (cột `maDuAn`, `masterSheetId`), tab `TuChoi`.
- Produces: `phanBo_(opts) -> {dayVao: {[maDuAn]: number}, chua: number, chan: number}`. Với mỗi dự án: upsert theo `MaKhach` vào tab `KhachTuMaster` của `Master_<mã>`, **chỉ** các cột hệ thống `MaKhach, SDT, HoTen, NgayCapNhat, NguonGoc, DuAnQuanTam, NhuCau, CanXem, PTTT, DongYNhanTin, TrangThaiCRM, TrangThaiChamSoc` (cột `A..L`), cột từ `N` trở đi là của anh và không bao giờ bị ghi. Khách `chua` đưa sang tab `ChuaPhanDuAn` (cột `GanDuAn` để anh chọn). Khách `chan` bị **xóa dòng** khỏi mọi `Master_<mã>` và xóa `SDT`, `HoTen`, `NhuCau` trong `KhachHang` (giữ `MaKhach` + lý do `Rút lại`).

- [ ] **Step 1: Test thất bại**: khách hai dự án có mặt ở hai Sheet giả; cột `N+` của dòng đã có giá trị sau lần chạy lại vẫn nguyên; khách `chua` vào `ChuaPhanDuAn`; anh điền `GanDuAn` rồi chạy lại → khách đi đúng `Master_<mã>`; thêm SĐT vào `TuChoi` rồi chạy → dòng biến mất khỏi mọi `Master_<mã>` và `KhachHang` bị ẩn tên/SĐT; `dryRun` không ghi gì.
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): allocate to project sheets, honor opt-out`.

### Task 9: Nhật ký, báo Telegram, lịch chạy, menu

**Files:** Modify `Sheets.gs`; Test `sheets.test.mjs`

**Interfaces:**
- Produces: `chayTatCa_(opts: {dryRun: boolean}) -> object` gọi `gopLanding_`, `gopNhapCRM_`, `phanBo_` rồi `ghiNhatKy_(stats)` (một dòng `NhatKy`: thời điểm, số đếm, số lỗi; **không tên, không SĐT**); lỗi → `baoLoi_(loai: string, soDong: number)` gửi Telegram (token, chat id từ Script Properties `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, giống `Code.gs`); `baoCaoNgay_()` gửi tóm tắt 8:00 (khách mới theo nguồn hôm qua, số `ChuaPhanDuAn`, số `Loi`); `caiLich_()` tạo trigger 15 phút cho `chayTatCa_` và hằng ngày 8:00 cho `baoCaoNgay_`, xóa trigger cũ trùng tên; `onOpen()` thêm menu "Master_Data" với "Gộp ngay" (`chayTatCa_({dryRun:false})`) và "Chạy thử (không ghi)" (`dryRun:true`).

- [ ] **Step 1: Test thất bại**: dựng Master_Data giả chứa tên và SĐT, chạy `chayTatCa_`, kiểm **không** có chuỗi tên/SĐT nào trong `NhatKy`, trong mọi nội dung `UrlFetchApp.fetch` gửi Telegram, hay trong `Logger`; lỗi giả (ném khi đọc Sheet landing) → có đúng một tin báo lỗi chỉ gồm loại lỗi; `caiLich_` chạy hai lần không nhân đôi trigger.
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Chạy toàn bộ `npm test` và `npm run lint` trong `engine/remotion`.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): run log, alerts, schedule, menu`.

### Task 10: Hướng dẫn cho anh và tài liệu

**Files:** Create docs/huong-dan-master-data.md; Modify `docs/README.md`, `docs/superpowers/specs/2026-11-11-master-data-khach-hang-design.md` (dòng **Trạng thái**), `NOTES.md`

**Interfaces:** Hướng dẫn **không có lệnh PowerShell**, theo thứ tự cổng: G1 tạo bản sao Master_Data và `Master_<mã>` thử, dán `Logic.gs` + `Sheets.gs`, điền `CauHinh`; G2 thử landing; G3 bấm "Chạy thử (không ghi)" và đọc số liệu; G4 ghi thật lần đầu; G5 phân bổ thật; G6 chạy `caiLich_`. Có mục "khách xin rút lại": thêm SĐT vào tab `TuChoi`.

- [ ] **Step 1:** Viết hướng dẫn (ngắn, từng bước có tên nút), không dán khóa vào chat: khóa nhập ở Script Properties.
- [ ] **Step 2:** Cập nhật mục lục, trạng thái spec, `NOTES.md` (việc đang làm: anh duyệt từng cổng).
- [ ] **Step 3: Chạy `npm test`** (có test docs chặn lệch mục lục). Mong đợi: PASS.
- [ ] **Step 4: Commit** `docs(master-data): setup guide`.

## Self-Review
- **Độ phủ spec:** mục 5 (tab, cột) → T1, T6; mục 6 → T4, T6; mục 7 → T5, T8; mục 8 → T2, T6, T7; mục 9 → T8 (rút lại), T9 (không rò); mục 10 → T9; mục 11 → mọi task, Review Focus; mục 12 (cổng) → T2, T10, cờ `dryRun`.
- **Khác biệt có chủ ý:** `normalizePhone_` của Master_Data nhận thêm số 9 chữ số (Sheets làm mất số 0); test tương đương với `Code.gs` bỏ ca này.
- **Chưa làm trong kế hoạch này:** lệnh bot `/gopkhach`; đọc dòng tiêu đề thật của Masterfile `.xlsx` (không cần, vì dùng `Master_<mã>` mới).
- **Kiểm tra nhất quán tên:** `KHACH_COLS`, `parseLandingRow_`, `mergeCustomer_`, `decideDestinations_`, `gopLanding_`, `gopNhapCRM_`, `phanBo_`, `chayTatCa_` dùng đúng một tên ở mọi task.
