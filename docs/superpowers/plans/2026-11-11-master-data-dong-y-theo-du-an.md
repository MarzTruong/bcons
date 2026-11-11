# Master_Data: đồng ý theo dự án, rút lại giữ hồ sơ — Implementation Plan

> **Trạng thái:** Task 1–5 đã dựng và test xanh trên máy (11/11/2026), chưa cài lên Sheet thật nào; chờ anh duyệt cổng G1–G6. Kế hoạch này sửa phần đã dựng ở `docs/superpowers/plans/2026-11-11-master-data-khach-hang.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ba thay đổi anh đã chốt: (1) đồng ý nhận tin theo từng dự án; (2) khách rút lại đồng ý thì đổi trạng thái và vẫn lưu hồ sơ, điền lại form thì đổi trạng thái và được nhắn lại (pháp chế xác nhận 11/11/2026); (3) khách landing cũ chưa có mã dự án để trống mã trong `KhachHang`, bỏ tab `ChuaPhanDuAn`.

**Architecture:** Giữ nguyên khung đã dựng (`Logic.gs` hàm thuần, `Sheets.gs` đọc/ghi). Thêm hai cột cuối cho `KhachHang` (đồng ý theo dự án, ngày rút lại), đổi `TuChoi` thành bản ghi có loại yêu cầu và ngày, và đổi quyết định phân bổ từ "chặn và xóa" sang "đổi trạng thái". Chỉ loại yêu cầu `Xóa` mới còn chạy luồng xóa dữ liệu hiện có.

**Tech Stack:** Google Apps Script (V8), Node `node --test`, Google Sheets (như kế hoạch trước).

**Spec:** `docs/superpowers/specs/2026-11-11-master-data-khach-hang-design.md` (mục 16, điểm 3, 4, 5, 6)

## Global Constraints
- Mọi ràng buộc của kế hoạch trước vẫn giữ: không dữ liệu khách trong repo/log/Telegram/`NhatKy`; một chiều Master_Data → `Master_<mã>`; không ghi đè cột anh nhập; test dùng dữ liệu ẩn danh đúng dạng thật; ghi lên Sheet thật chỉ qua cổng G1–G6.
- **Nhắn tin chỉ cho khách có đồng ý của đúng dự án đó và không đang ở trạng thái đã rút lại.**
- Rút lại đồng ý **không xóa** dữ liệu; chỉ loại `Xóa` mới xóa (giữ nguyên hành vi cũ của luồng xóa, gồm xóa bản sao ở `Master_<mã>` và giữ SĐT trong `TuChoi`).
- Điền lại form **không bị chặn** nếu bằng chứng đồng ý mới hơn ngày rút lại; bằng chứng cũ đọc lại không được mở nhắn lại.
- Đã quyết (em đặt, anh sửa được): `LoaiYeuCau` ∈ `Rút lại` (mặc định khi trống) | `Xóa`; gõ `Không` ở cột trạng thái đồng ý của `KhachHang` được coi là `Rút lại`.
- Chưa cài lên Sheet thật nào, nên không cần di chuyển dữ liệu cũ; vẫn phải tự sửa dòng tiêu đề tab `TuChoi` đã tạo bằng bản cũ (3 cột).

## Review Focus
1. Đồng ý cho dự án A không mở nhắn cho dự án B (khách có `DongYDuAn` = A, hỏi về B → không nhắn).
2. Landing gửi lại bằng chứng đồng ý **cũ hơn** ngày rút lại (đọc lại dòng đã gộp, hoặc dòng gộp muộn): vẫn là `Đã rút lại`.
3. Dòng `TuChoi` anh gõ tay không có `NgayGhi` hoặc `LoaiYeuCau`: hệ thống điền `NgayGhi` = thời điểm thấy lần đầu và coi loại là `Rút lại`; không bao giờ mở nhắn lại vì thiếu ngày.
4. Khách trùng SĐT rút lại ở một dự án nhưng còn đồng ý dự án khác: rút lại là toàn khách (an toàn), không phải theo dự án.
5. Loại `Xóa` rồi điền lại form: tạo hồ sơ mới có đồng ý mới (hồ sơ cũ đã xóa), vẫn không nhắn nhầm trước lần đồng ý mới.
6. Cột trạng thái đồng ý trên `Master_<mã>` luôn phản ánh đúng **dự án đó** (khách đồng ý Newsky, xem ở `Master_<Central Park>` thì không hiện `Có`).

---

## File Structure
- Modify `engine/master-data/apps-script/Logic.gs`: cột mới, mô hình đồng ý theo dự án, quyết định phân bổ mới.
- Modify `engine/master-data/apps-script/Sheets.gs`: luồng `phanBo_` mới, tiêu đề `TuChoi`, bỏ `ChuaPhanDuAn`, báo cáo.
- Modify `engine/master-data/logic.test.mjs`, `engine/master-data/sheets.test.mjs`, `engine/master-data/helpers.mjs` (fake: thêm sửa tiêu đề tab nếu cần).
- Modify `docs/huong-dan-master-data.md`, `docs/superpowers/specs/2026-11-11-master-data-khach-hang-design.md`, `NOTES.md`, `docs/README.md`.

### Task 1: Mô hình đồng ý theo dự án (Logic.gs)

**Files:** Modify `Logic.gs`; Test `logic.test.mjs`

**Interfaces:**
- Produces: `KHACH_COLS` thêm hai cột **ở cuối**: `DongYDuAn` (mã dự án đã đồng ý, ngăn `;`), `NgayRutLai` (ISO hoặc rỗng). `DongYNhanTin` đổi nghĩa thành trạng thái chung: `Có` (có đồng ý ít nhất một dự án và chưa rút lại), `Chưa rõ`, `Đã rút lại`. `DongYBangChung` = các bằng chứng, mỗi dự án một đoạn `<mã>: <bằng chứng>` ngăn bằng ` || `.
- `ngayDongY_(evidence: string) -> string` ISO lấy từ chuỗi `Có (<ISO>, mẫu ...)`, rỗng nếu sai khuôn.
- `coTheNhan_(rec: Record, maDuAn: string) -> boolean`: đúng khi `maDuAn` ∈ `DongYDuAn` và `DongYNhanTin !== 'Đã rút lại'`.
- `parseLandingRow_` (đã có): dòng landing có bằng chứng hợp lệ và có `Dự án` → `DongYDuAn = <mã>`, `DongYBangChung = "<mã>: <bằng chứng>"`, `DongYNhanTin = 'Có'`; không có `Dự án` hoặc không có bằng chứng → `DongYDuAn = ''`, `DongYNhanTin = 'Chưa rõ'` (khách cũ chưa có mã dự án vẫn được lưu, để trống mã; chưa nhắn vì không biết đồng ý cho dự án nào).

- [ ] **Step 1: Test thất bại**: (a) `KHACH_COLS` có 19 cột, 17 cột đầu không đổi vị trí; (b) landing dự án A có bằng chứng → `DongYDuAn='A'`, `coTheNhan_(rec,'A')` đúng và `coTheNhan_(rec,'B')` sai (Review Focus 1); (c) dòng landing cũ không có `Dự án` → `Chưa rõ`, `DongYDuAn=''`, vẫn `ok:true`; (d) `ngayDongY_` trên chuỗi thật trả ISO, trên chuỗi lạ (`' Có (x)'`, `'Có ('`) trả rỗng; (e) rec `Đã rút lại` thì `coTheNhan_` luôn sai.
- [ ] **Step 2: Chạy `cd engine/remotion && node --test ../master-data/logic.test.mjs`.** Mong đợi: FAIL.
- [ ] **Step 3: Implement** theo Interfaces; cập nhật mọi chỗ trong `Logic.gs` và `Sheets.gs` đang giả định 17 cột hoặc `DongYNhanTin === 'Không'` cho khỏi gãy test cũ (đổi kỳ vọng test cũ có chủ đích, ghi trong commit).
- [ ] **Step 4: Chạy test.** Mong đợi: PASS (cả bộ master-data).
- [ ] **Step 5: Commit** `feat(master-data): per-project consent model`.

### Task 2: Gộp khách theo mô hình mới (mergeCustomer_)

**Files:** Modify `Logic.gs`; Test `logic.test.mjs`

**Interfaces:**
- Consumes: Task 1.
- Produces: `mergeCustomer_(existing, incoming, nowIso)` mở rộng: `DongYDuAn` = hợp hai danh sách nhưng **chỉ giữ dự án có bằng chứng mới hơn `NgayRutLai`** (không có `NgayRutLai` thì giữ hết); `DongYBangChung` gộp theo mã dự án (mỗi mã giữ bằng chứng mới nhất); `NgayRutLai` giữ giá trị của `existing`, hoặc `nowIso` nếu `incoming.DongYNhanTin === 'Đã rút lại'`; `DongYNhanTin`: `Đã rút lại` nếu có `NgayRutLai` và **không** có bằng chứng nào mới hơn nó; `Có` nếu còn ít nhất một dự án đồng ý hợp lệ; ngược lại `Chưa rõ`. Hàm phụ `trangThaiDongY_(dongYDuAn, bangChung, ngayRutLai) -> 'Có'|'Chưa rõ'|'Đã rút lại'`.

- **Quy tắc đã chốt sau review Task 2 (đã cài ở `Logic.gs`, `Sheets.gs`):**
  - `NgayRutLai` = **lớn nhất** trong các ngày hợp lệ của `existing` và `incoming`; phía nào có chữ không đọc được thì giữ chữ đó và coi như mốc vô hạn (không bằng chứng nào mở lại được). Dấu đóng không bao giờ làm ngày lùi lại.
  - Đóng dấu: `Đã rút lại` mà chưa có ngày → dấu là `NgayCapNhat` của `existing` nếu đọc được, không thì `nowIso` (để bằng chứng mới đến cùng lượt gộp không bị chặn nhầm). `Không` gõ tay (đúng khuôn `dongYKieu_`, phía nào cũng vậy) chỉ là lần rút **mới** (dấu = `nowIso`, hoặc ngày bằng chứng mới nhất nếu nó muộn hơn `nowIso`) khi chưa có ngày hợp lệ hoặc đã có bằng chứng mới hơn ngày rút; đã rút mà không có bằng chứng mới hơn thì giữ nguyên ngày (chạy lại nhiều lần không đẩy ngày).
  - Bằng chứng ghi ngày muộn hơn `nowIso` + 5 phút bị bỏ lúc gộp (sheet sửa tay).
  - `parseLandingRow_` cắt phần trang của bằng chứng để mỗi đoạn lưu (`<mã>: Có (...)`) tối đa 200 ký tự; phần đầu quá dài thì không coi là đồng ý.
  - `DongYBangChung` và `DongYDuAn` ghi lên Sheet bằng `cellDai_` (giữ chặn công thức, không cắt ở 500, quá 45000 thì bỏ nguyên đoạn cũ nhất), không dùng `cell_`. Mọi chỗ ghi hai cột này (kể cả `phanBo_` ở Task 4) phải dùng `khachCell_`/`cellDai_`.
- **Ràng buộc từ review Task 1:** `DongYDuAn` phải được **suy ra** từ các đoạn bằng chứng hợp lệ trong `DongYBangChung` (không dùng "giá trị không rỗng đầu tiên"), để `DongYDuAn` và `DongYBangChung` không bao giờ lệch nhau; `DongYDuAn` gõ tay hoặc còn sót mà không có bằng chứng thì không bao giờ cho `Có`.
- [ ] **Step 1: Test thất bại**: (a) khách đồng ý A rồi landing đồng ý B → `DongYDuAn='A;B'`, trạng thái `Có`; (b) `NgayRutLai` = 10/11, landing gửi lại bằng chứng ngày 05/11 → vẫn `Đã rút lại`, `DongYDuAn` không chứa dự án đó (Review Focus 2); (c) bằng chứng ngày 12/11 → `Có`, `NgayRutLai` giữ nguyên làm lịch sử, `DongYDuAn` chứa dự án mới; (d) khách đồng ý A và B, rút lại, rồi chỉ điền lại A → chỉ A được nhắn (`coTheNhan_` B sai, Review Focus 4); (e) bằng chứng rác hoặc không hợp lệ không nâng trạng thái lên `Có`; (f) idempotent: gộp cùng một `incoming` hai lần cho cùng kết quả (trừ `NgayCapNhat`).
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement** `mergeCustomer_` và `trangThaiDongY_`.
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): merge consent per project with withdrawal dates`.

### Task 3: Quyết định phân bổ mới và đọc `TuChoi`

**Files:** Modify `Logic.gs`, `Sheets.gs` (`readTuChoi_`, `TAB_HEADERS_.TuChoi`, `ensureTabs_`); Test `logic.test.mjs`, `sheets.test.mjs`

**Interfaces:**
- Produces: tiêu đề `TuChoi` = `SDT | LyDo | NgayGhi | LoaiYeuCau | DaDongYLai`. `ensureTabs_` **sửa tab `TuChoi` cũ 3 cột** bằng cách thêm hai tiêu đề thiếu vào cuối (không đụng dữ liệu).
- `tuChoiMap_(rows) -> {[sdt]: {loai: 'Rút lại'|'Xóa', ngayGhi: string}}`: SĐT chuẩn hóa; `LoaiYeuCau` trống hoặc lạ → `Rút lại`; dòng không có `NgayGhi` → `Sheets.gs` ghi `NgayGhi = now` cho dòng đó ở lần chạy đầu (Review Focus 3) và coi như đã có; SĐT sai dạng vẫn đi vào `Loi` như hiện nay.
- `decideDestinations_(rec, tuChoi, projectCodes) -> {xoa: boolean, rutLai: boolean, dich: string[], lyDo: 'xoa'|'rutlai'|'khong'|''}` (**bỏ `chan` và `chua`**). `xoa` đúng khi SĐT thuộc `TuChoi` loại `Xóa` mà không có đồng ý mới hơn `NgayGhi`; `rutLai` đúng khi SĐT thuộc `TuChoi` loại `Rút lại` hoặc gõ `Không` đúng khuôn (hành vi `Không` giữ như đã sửa ở lần review cuối) mà **chưa** có đồng ý mới hơn; `dich` luôn tính từ `DuAnQuanTam` (kể cả khi `rutLai`, vì hồ sơ được giữ). Đồng ý mới hơn ngày ghi: `rutLai=false`, `xoa=false`.

- **Quy tắc đã chốt sau review Task 3 (đã cài ở `Logic.gs`, `Sheets.gs`):**
  - `tuChoiMap_` trả **từng dòng**: `{[sdt]: [{loai, ngayGhi}, ...]}` theo thứ tự dòng (TuChoi chỉ thêm dòng, một SĐT có nhiều dòng). Không gộp loại/ngày theo SĐT.
  - Mỗi dòng **còn hiệu lực** khi không có đồng ý nào mới hơn nghiêm ngặt `NgayGhi` **của chính dòng đó** (cùng quy tắc bằng chứng tương lai như `mergeCustomer_`). `xoa` đúng khi có ít nhất một dòng `Xóa` còn hiệu lực; không thì `rutLai` đúng khi có một dòng `Rút lại` còn hiệu lực (hoặc gõ `Không` / trạng thái `Đã rút lại` theo `dongYKieu_`). Ví dụ: `Xóa` 05/11 + `Rút lại` 12/11 + đồng ý 10/11 → `Xóa` bị mở, `Rút lại` còn → `rutLai`, không xóa gì.
  - Dòng chưa có ngày (hoặc ngày rác): hệ thống ghi `NgayGhi` = now ở lần chạy thật đầu tiên; cho tới lúc đó dòng còn hiệu lực.
  - `NgayGhi` chỉ có ngày (Sheets trả 0 giờ giờ Việt Nam = `T17:00:00.000Z` của hôm trước, hoặc chuỗi `YYYY-MM-DD`, `DD/MM/YYYY`) được tính là **cuối ngày Việt Nam đó**, để đồng ý cùng ngày không mở lại nhầm. Dấu now do hệ thống ghi giữ nguyên.
  - `LoaiYeuCau` có chữ nhưng lạ (`Xóa dữ liệu`, `xóa hết`) vẫn là `Rút lại` (an toàn cho việc giữ hồ sơ) và ghi **một** dòng `Loi` (`Rút lại`, số dòng, `Loại yêu cầu lạ: ghi Rút lại hoặc Xóa`), không lặp ở lần chạy sau; có tính vào `tuChoiLoi`.
  - Xóa dở: chỉ làm nốt (xóa dữ liệu cá nhân của dòng không SĐT) khi dòng mang đúng dấu do `phanBo_` ghi (`DongYNhanTin` = `Không` **và** `GhiChu` = `Rút lại`) và còn dữ liệu cá nhân. Dòng không SĐT anh tự đánh `Không` không bao giờ bị xóa.
  - Thứ tự ghi của luồng `Xóa` (dấu trước): đóng dấu `NgayGhi` → ghi dấu `Không` + `Rút lại` ở KhachHang → xóa bản sao ở Master → xóa dữ liệu cá nhân ở KhachHang. Chết sau lần ghi dấu thì chạy lại làm nốt.
  - Rút lại hiện rõ ngay (cầu nối tới Task 4): khách có dòng `Rút lại` còn hiệu lực → KhachHang `DongYNhanTin` = `Đã rút lại`, `NgayRutLai` = `NgayGhi` mới nhất còn hiệu lực (không phải now, không bao giờ lùi; còn dòng chưa biết ngày thì điền ở lần sau); mọi dòng **đã có** của khách (theo `MaKhach`) ở mọi `KhachTuMaster` đổi ô `DongYNhanTin` thành `Đã rút lại` (không thêm, không xóa dòng). `rutLai` trong kết quả = số khách **mới** được ghi nhận ở lần chạy này (lần hai: 0). Task 4 xây trạng thái theo từng dự án ở Master trên nền này (khách được mở lại hoặc đồng ý dự án khác thì ô về `Có`/`Chưa rõ` theo dự án đó).
  - Hạn chế đã biết: Master không mở được và không có ai bị xóa thì `phanBo_` ném lỗi trước mọi lần ghi (như trước), nên lúc đó chưa hiện được rút lại; hai dòng KhachHang cùng SĐT mà chỉ một dòng có đồng ý mới hơn: dòng đó không bị xóa/chặn theo dòng kia, và SĐT của nó không dùng để xóa bản sao Master (chỉ khớp `MaKhach` của dòng bị xóa), nên bản sao cũ cùng SĐT khác `MaKhach` của người đã xóa có thể còn lại; Task 4 phải xử lý (gộp theo `MaKhach` mới).

- [ ] **Step 1: Test thất bại**: (a) SĐT loại `Rút lại` → `rutLai`, `dich` vẫn đủ dự án; (b) loại `Xóa` → `xoa`; (c) bằng chứng mới hơn `NgayGhi` → cả hai sai (điền lại form); bằng chứng cũ hơn → vẫn `rutLai` (Review Focus 2); (d) `LoaiYeuCau` trống/lạ → `Rút lại`; (e) dòng `TuChoi` thiếu `NgayGhi` được ghi `NgayGhi=now` và không mở nhắn lại; (f) tab `TuChoi` cũ 3 cột được thêm hai tiêu đề, dữ liệu cũ nguyên; (g) mọi kiểu dạng `tuChoi` lạ vẫn ném lỗi trước khi ghi (giữ hành vi fail-closed).
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement** theo Interfaces; cập nhật nơi đang dùng `chan`/`chua`.
- [ ] **Step 4: Chạy test.** Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(master-data): withdrawal types and re-consent decision`.

### Task 4: `phanBo_` mới: rút lại giữ hồ sơ, điền lại mở nhắn, bỏ ChuaPhanDuAn

**Files:** Modify `Sheets.gs`; Test `sheets.test.mjs`

**Interfaces:**
- Consumes: Task 1–3.
- Produces: `phanBo_(opts) -> {dayVao: {[maDuAn]: number}, rutLai: number, dongYLai: number, xoa: number, lyDo: {...}, masterLoi: string[], tuChoiLoi: number, chuaCoDuAn: number}` (**bỏ `chua`, `chan`**).
  - `rutLai`: khách vừa chuyển sang `Đã rút lại`: đặt `KhachHang.DongYNhanTin='Đã rút lại'`, `NgayRutLai=now`, **không xóa** trường nào; mọi dòng của khách ở `Master_<mã>` được cập nhật cột `DongYNhanTin` thành `Đã rút lại` (hồ sơ vẫn ở đó).
  - `dongYLai`: khách có `TuChoi` loại `Rút lại` mà vừa có đồng ý mới hơn: cập nhật `KhachHang` (`Có`, `DongYDuAn`), điền cột `DaDongYLai` = ngày của dòng `TuChoi` (không xóa dòng), và cột `DongYNhanTin` ở `Master_<mã>` thành `Có` **cho dự án đó** và `Chưa rõ` cho dự án khác chưa có đồng ý (Review Focus 6).
  - `xoa`: giữ nguyên luồng xóa hiện có (xóa bản sao ở mọi `Master_<mã>`, xóa dữ liệu cá nhân ở `KhachHang`, giữ `MaKhach` và `DongYNhanTin='Đã rút lại'`, ghi SĐT vào `TuChoi` nếu chưa có), nhưng chỉ cho loại `Xóa`; khách `Xóa` điền lại form với đồng ý mới → hồ sơ mới (Review Focus 5).
  - `chuaCoDuAn`: số khách `DuAnQuanTam` trống, chỉ **đếm** (hiển thị ở báo cáo), **không** ghi sang tab nào; tab `ChuaPhanDuAn` và cột `GanDuAn` bị bỏ khỏi `TAB_HEADERS_`, `ensureTabs_` không tạo nữa (tab cũ nếu đã có thì để yên).
  - Cột `DongYNhanTin` ở `KhachTuMaster` tính theo **dự án của sheet đó**: `Có` nếu `coTheNhan_`, `Đã rút lại` nếu khách đã rút lại, còn lại `Chưa rõ`. Cột này là cột hệ thống (luôn cập nhật).
- **Ghi chú sau review Task 3:** phần `rutLai` (KhachHang `Đã rút lại`, `NgayRutLai`, ô `DongYNhanTin` của dòng sẵn có ở Master) đã làm ở Task 3; Task 4 chỉ **xây tiếp** trạng thái theo từng dự án ở Master trên nền đó (và `dongYLai`, `DaDongYLai`, bỏ `ChuaPhanDuAn`), không làm lại. `rutLai` là số khách mới được ghi nhận. Dấu của luồng `Xóa` là `Không` + `Rút lại` ở `GhiChu`; khi Task 4 đổi dấu sang `Đã rút lại` + giữ `MaKhach`, phải giữ quy tắc làm nốt xóa dở: chỉ khi đúng dấu do `phanBo_` ghi.
- Giữ nguyên: thứ tự ghi an toàn (tính hết trong bộ nhớ trước; xóa trước khi sửa `KhachHang`), batching, `dryRun` không ghi gì, khóa script, không PII trong lỗi/log, hành vi `Master` không mở được.

- **Ràng buộc từ review Task 2:** `phanBo_` chỉ đưa vào `mergeCustomer_` dòng `KhachHang` (không bao giờ đọc lại chữ `Không` gõ tay từ bản sao `Master_<mã>` để gộp mỗi lần chạy), và chỉ ghi `DongYBangChung`/`DongYDuAn` bằng `khachCell_`.
- **Ràng buộc từ review Task 1:** khi xóa dữ liệu (loại `Xóa`), `phanBo_` phải xóa luôn `DongYDuAn` (và `NgayRutLai` nếu cần giữ lịch sử thì giữ, nhưng `DongYDuAn` về rỗng), để hồ sơ đã xóa không còn mã dự án nào có thể khớp `coTheNhan_`.
- **Quy tắc đã chốt sau review Task 4 (đã cài ở `Logic.gs`, `Sheets.gs`):**
  - `phanBo_` không tin ô thô: mỗi khách có SĐT được tính lại thành bản ghi khẩn bằng `mergeCustomer_` chỉ từ dòng `KhachHang`; `NgayRutLai` được nâng lên tới ngày lớn nhất của mọi dòng `TuChoi` đã biết (dòng chưa biết ngày hoặc ngày ở tương lai > now + 1 ngày = chưa biết: tính là now, chỉ dòng chưa có ngày mới bị đóng dấu); `DongYNhanTin`, `DongYDuAn`, `NgayRutLai` ở `KhachHang` được sửa nếu lệch. Quyết định xóa/rút lại xét từng dòng `TuChoi` trên đồng ý hợp lệ nhưng chưa nâng mốc theo `TuChoi` (để dòng `Rút lại` mới hơn không làm dòng `Xóa` cũ sống lại).
  - `Không` là chữ chỉ anh gõ (hệ thống ghi `Đã rút lại`): mỗi lần thấy là lần rút mới, `NgayRutLai` = max(ngày hiện có, now, bằng chứng mới nhất).
  - Trạng thái `Master_<mã>`: quét MỌI dòng sẵn có (khớp `MaKhach` hoặc SĐT chuẩn hóa, cả dự án khách không còn quan tâm), mức hạn chế nhất khi nhiều khách khớp; Master hỏng vẫn hạ quyền nhắn ở Master mở được, chỉ phân bổ thuần mới ném lỗi (`Master <mã> không mở được` = `LOI_MASTER`).
  - Cửa sổ chết giữa chừng (M2): dấu `KhachHang` ghi trước, trạng thái `Master_<mã>` ghi ngay sau trong cùng giai đoạn (khi không có xóa; có xóa thì sau bước xóa vì chỉ số dòng đổi). Chết ở bất kỳ điểm ghi nào thì lượt kế tiếp hội tụ; tối đa MỘT chu kỳ (15 phút) một dòng Master của khách đã rút lại còn `Có` cũ (đã có test chết ở từng điểm ghi).
  - `TuChoi` SĐT sai/loại lạ/ngày tương lai: một dòng `Loi` cho mỗi dòng `TuChoi` (không lặp), `tuChoiLoi` chỉ đếm dòng mới, một tin Telegram `LOI_TUCHOI` (dedupe 6 giờ theo loại).
  - Tab `KhachHang` cũ 17 cột: `ensureTabs_`/`phanBo_` thêm tiêu đề `DongYDuAn`, `NgayRutLai` ở cuối (chỉ ô tiêu đề, không ở dryRun). `ensureTabs_` vẫn gọi `setNumberFormat` mỗi lần chạy với tab có trong `touch` (chấp nhận).
  - Hạn chế đã biết: gõ `Không` lên hồ sơ đang bị xóa cùng lượt thì hồ sơ mới điền lại sau đó chỉ biết ngày dòng `Xóa` (không biết ngày gõ `Không` trên hồ sơ đã xóa).
- [ ] **Step 1: Test thất bại** trên Sheet giả: (a) SĐT vào `TuChoi` loại `Rút lại` → hồ sơ `KhachHang` còn đủ tên, SĐT, `NhuCau`; `DongYNhanTin='Đã rút lại'`; dòng ở `Master_<mã>` còn nguyên, cột `DongYNhanTin` = `Đã rút lại`; (b) lần chạy thứ hai: không ghi gì (idempotent); (c) khách đó điền lại form (đồng ý mới) → `Có`, `DongYDuAn` có dự án mới, cột `DaDongYLai` ghi ngày, dòng `TuChoi` còn nguyên; `Master_<mã>` của dự án đó hiện `Có`, dự án kia hiện `Chưa rõ`; (d) landing gửi lại bằng chứng cũ hơn → vẫn `Đã rút lại`; (e) loại `Xóa` → luồng xóa cũ chạy (các test xóa hiện có vẫn qua sau khi đổi tên trường kết quả); `Xóa` rồi điền lại → hồ sơ mới `Có`; (f) khách `DuAnQuanTam` trống: ở lại `KhachHang`, không có tab `ChuaPhanDuAn`, `chuaCoDuAn` đếm đúng; (g) `dryRun` giữ nguyên cả bốn kiểu; (h) `Master_<mã>` không mở được khi có khách rút lại: vẫn cập nhật trạng thái ở các Master mở được, `masterLoi` liệt kê mã lỗi, không có PII; (i) số lần ghi cho 500 khách vẫn hằng số nhỏ (≤ 20).
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement.** Chỉ ghi các ô trạng thái đồng ý ở `Master_<mã>` (một cột), không chạm cột anh nhập.
- [ ] **Step 4: Chạy test.** Mong đợi: PASS, cùng `npm test` và `npm run lint`.
- [ ] **Step 5: Commit** `feat(master-data): keep records on withdrawal, re-consent, drop ChuaPhanDuAn`.

### Task 5: Báo cáo, nhật ký, hướng dẫn và tài liệu

**Files:** Modify `Sheets.gs` (`baoCaoNgay_`, `chayTatCa_`, `ghiNhatKy_`), `docs/huong-dan-master-data.md`, `docs/superpowers/specs/2026-11-11-master-data-khach-hang-design.md`, `NOTES.md`, `docs/README.md`; Test `sheets.test.mjs`

**Interfaces:**
- Consumes: kết quả `phanBo_` ở Task 4.
- Produces: `NhatKy` ghi `rutlai=.. dongylai=.. xoa=..` thay cho `chua`/`chan`; `chayTatCa_` coi lần chạy là "nhàn rỗi" chỉ khi các số đó và `dayVao` đều bằng 0. `baoCaoNgay_` thay dòng "Chưa phân dự án" bằng "Chưa có mã dự án: N" (đếm ở `KhachHang`), "Rút lại hôm qua: N" và "Điền lại: N"; vẫn chỉ có số.

- [ ] **Step 1: Test thất bại**: ghi chú `NhatKy` đúng định dạng mới và không có PII; chạy chỉ có khách điền lại → không nhàn rỗi; báo cáo ngày có ba số mới, đúng múi giờ Việt Nam.
- [ ] **Step 2: Chạy test.** Mong đợi: FAIL.
- [ ] **Step 3: Implement**, rồi sửa hướng dẫn: bỏ mọi chỗ nói về `ChuaPhanDuAn`/`GanDuAn` (anh gõ mã dự án trực tiếp vào `DuAnQuanTam` ở `KhachHang`); phần "Khách xin rút lại" mô tả hai loại (`Rút lại` giữ hồ sơ, đổi trạng thái; `Xóa` xóa dữ liệu), cột `NgayGhi` (anh gõ tay thì để trống cũng được, hệ thống điền ngày), điền lại form sẽ tự mở nhắn lại; xóa câu cảnh báo "chưa dùng `TuChoi` cho khách thật"; cập nhật bảng lỗi nếu mã lỗi đổi; ghi `NOTES.md` và dòng **Trạng thái** của spec/kế hoạch này sang đã làm.
- [ ] **Step 4: Chạy `cd engine/remotion && npm test && npm run lint`.** Mong đợi: PASS (kể cả test docs, chỉ nhắc file có thật trong dấu backtick).
- [ ] **Step 5: Commit** `feat(master-data): reports and guide for per-project consent`.

## Self-Review
- **Độ phủ spec mục 16:** điểm 3 → Task 1, 2; điểm 4 (pháp chế) → Task 2, 3, 4; điểm 5 (khách cũ trống mã) → Task 1, 4; điểm 6 (phạm vi xóa) → Task 4 (`Xóa`) và hướng dẫn ở Task 5; điểm 2 (trạng thái ở `Master_<mã>`) → giữ cột `TrangThaiCRM`/`TrangThaiChamSoc` fill-only, không đổi.
- **Quyết định em tự đặt:** cột `LoaiYeuCau`; rút lại là theo cả khách chứ không theo từng dự án; so mốc bằng ngày của bằng chứng đồng ý mới với `NgayGhi`/`NgayRutLai`; bỏ tab `ChuaPhanDuAn`.
- **Rủi ro cần anh lưu ý:** đổi nghĩa cột `DongYNhanTin` (trước là `Có/Chưa rõ/Không`, nay `Có/Chưa rõ/Đã rút lại`); vì chưa cài lên Sheet thật nên không cần di chuyển dữ liệu.
- **Nhất quán tên:** `coTheNhan_`, `ngayDongY_`, `trangThaiDongY_`, `tuChoiMap_`, `decideDestinations_` (`xoa`, `rutLai`, `dich`, `lyDo`), `phanBo_` (`rutLai`, `dongYLai`, `xoa`, `chuaCoDuAn`) dùng đúng một tên ở mọi task.
