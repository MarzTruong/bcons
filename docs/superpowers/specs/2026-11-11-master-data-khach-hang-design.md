> **Trạng thái:** Đã duyệt (anh duyệt 11/11/2026, chốt: dùng `Master_<mã>`, không đặt thời hạn giữ dữ liệu). Code đã dựng và test xanh trên máy (11/11/2026, commit `89c5abc` đến `69655f5`), **chưa cài lên Sheet thật nào**. Tiếp theo: anh duyệt lần lượt cổng G1–G6 theo `docs/huong-dan-master-data.md`. **Mục 16 thay thế các chỗ cũ nói rút lại là xóa và tab `ChuaPhanDuAn`.**

# Thiết kế: Master_Data, kho khách hàng tập trung (11/11/2026)

## 1. Mục đích và lý do
Khách của anh đang nằm rải rác: CRM của công ty (`bconspsland.com`), tab "Landing" của Google Sheet, và các Masterfile theo dự án (`MasterFile_BconsCentralPark.xlsx`, `MasterFile_BconsNewsky.xlsx` trên Drive `Bcons/data/<mã>/gia/`). Một khách có thể nằm ở hai nơi mà không ai biết, hoặc điền landing xong rồi không ai chăm.

Cần **một kho duy nhất** (Master_Data) để: không trùng, không sót, biết khách thuộc dự án nào, đã chăm sóc chưa. Từ kho này, danh sách khách của từng dự án được đưa về Masterfile của dự án đó.

## 2. Mục tiêu / không phải mục tiêu / điều phải tránh
**Mục tiêu**
- Mỗi khách đúng **một dòng** trong Master_Data, khóa là SĐT đã chuẩn hóa.
- Khách từ landing tự vào Master_Data (không phải copy tay).
- Khách từ CRM do anh nhập tay vào Master_Data (anh quyết định 11/11/2026).
- Từ Master_Data, khách đi về đúng Masterfile theo "dự án quan tâm"; khách chưa rõ dự án vào tab riêng để anh gán.
- Có nhật ký thay đổi và báo lỗi qua Telegram.
- Thêm dự án thứ ba trở đi chỉ cần thêm một dòng cấu hình.

**Không phải mục tiêu**
- Không đọc/cào CRM, không bấm "Hiện số" thay anh (CRM che SĐT có chủ ý; anh chốt nhập tay).
- Không ghi ngược từ Masterfile về Master_Data (một chiều).
- Không gửi tin hàng loạt. Kênh nhắn (Zalo OA/ZNS, SMS brandname, email) là việc riêng, xem `NOTES.md`.
- Không làm giao diện mới. Anh làm việc ngay trong Google Sheet.

**Điều phải tránh (coi là thất bại dù chạy được)**
- Dữ liệu khách (tên, SĐT, nhu cầu, thu nhập) vào repo, log chung, hoặc tin nhắn Telegram dài.
- Ghi đè phần chăm sóc anh đã nhập tay.
- Khách vào Masterfile của dự án họ không quan tâm.
- Khách đã rút lại sự đồng ý (`Đã rút lại`) hoặc chưa có đồng ý cho đúng dự án vẫn nằm trong danh sách được nhắn.
- Ghi lên dữ liệu thật mà chưa thử trên bản sao.

## 3. Hiện trạng (đã đọc)
- Landing: `engine/landing/apps-script/Code.gs` ghi tab "Landing" của Sheet "Bcons - Khach quan tam Messenger". Đã có: chuẩn hóa SĐT (`0xxxxxxxxx`), chống trùng 120 giây, ô đồng ý (`Có (<thời điểm>, mẫu v1-2026-11-06, <trang>)`), cờ trạng thái chăm sóc "Mới", báo Telegram.
- **Chưa có cột "Dự án"** trong tab Landing (17 cột, xem `HEADERS`). Landing nay phục vụ nhiều dự án, nên phải thêm cột này (mục 8).
- CRM: không có nút xuất, không có API, IT công ty không cấp. SĐT bị che (`098****032`), chỉ hiện khi bấm "Hiện số". Danh sách hiện ~40 khách ("Đang liên hệ" 33). Cột nhìn thấy: Khách, Dự án, Nhu cầu, Trạng thái, Nhận lúc, Hạn liên hệ.
- Hai Masterfile hiện là **file `.xlsx` trên Drive** (không phải Google Sheet gốc), nên Sheets API không ghi thẳng vào được. Đây là ràng buộc thật cho bước phân bổ (mục 7).
- Em **chưa đọc dòng tiêu đề** của Masterfile (tránh đọc dữ liệu khách vào ngữ cảnh). Việc đầu của kế hoạch dựng: lấy dòng tiêu đề sheet KhachHang/ChamSoc của cả hai file để khớp cột.

## 4. Sơ đồ luồng
```
 Landing (form khách) ──> Sheet landing, tab "Landing"  ──┐ (tự động, mỗi 15 phút)
                          (Code.gs, thêm cột Dự án)       │
                                                          v
 CRM (anh nhập tay) ───────────────────────────>  MASTER_DATA (Google Sheet riêng tư)
                                                   tab KhachHang  <- một dòng/khách
                                                   tab TuChoi, NhatKy, CauHinh, Loi, NhapCRM
                                                          │ (tự động, một chiều)
                              ┌───────────────────────────┴───────────────┐
                              v                                           v
                 Master_BconsCentralPark                      Master_BconsNewsky ...
                 (Google Sheet, tab KhachTuMaster)           (mỗi dự án một Sheet)
                 Masterfile .xlsx hiện có: giữ nguyên, anh dùng song song (mục 7)
```
Mọi bước ghi: kiểm tra trùng, kiểm tra đồng ý, ghi nhật ký, lỗi thì báo Telegram (không kèm tên/SĐT).

## 5. Schema Master_Data
Google Sheet **riêng tư** (chỉ tài khoản anh), đặt ở Drive `Bcons/data/master-data/`. Không bật chia sẻ bằng link.

**Tab `KhachHang`** (một dòng một khách). Cột chia hai nhóm:

| Cột | Ai ghi | Ghi chú |
|---|---|---|
| MaKhach | hệ thống | `KH-000001`, tăng dần, không đổi |
| SDT | hệ thống / anh | **khóa chống trùng**, dạng `0xxxxxxxxx`, kiểu chữ |
| HoTen | hệ thống / anh | |
| NgayTao, NgayCapNhat | hệ thống | |
| NguonGoc | hệ thống | `Landing`, `CRM`, hoặc `Landing+CRM` |
| NguonChiTiet | hệ thống | utm/nguồn từ landing (cột "Nguồn" hiện có) |
| DuAnQuanTam | hệ thống / anh | mã dự án, nhiều thì ngăn bằng `;` (vd `bcons-central-park;bcons-newsky`); trống = chưa rõ |
| NhuCau | hệ thống / anh | Mua để ở / Mua cho thuê / Tìm hiểu thêm |
| CanXem, PTTT | hệ thống | từ landing (căn, loại căn, PTTT khách chọn) |
| DongYNhanTin | hệ thống / anh | `Có`, `Chưa rõ`, `Đã rút lại` (anh gõ đúng `Không` để rút lại, hệ thống ghi lại thành `Đã rút lại`; giá trị lạ khác bị chặn nhắn và ghi `Loi`); **không bao giờ tự đổi thành `Có`** khi không có bằng chứng |
| DongYBangChung | hệ thống | thời điểm, mẫu đồng ý, trang (chép từ cột "Đồng ý nhận tin" của landing) |
| **TrangThaiCRM** | **anh** | Mới / Đang liên hệ / Quan tâm / Đã gặp / Cọc/Booking/HĐMB / Không QT (theo CRM) |
| **TrangThaiChamSoc** | **anh** | Chưa chăm / Đã gọi / Hẹn gặp / ... (anh định nghĩa, mục 14) |
| **NguoiChamSoc**, **GhiChu** | **anh** | |

Quy tắc cột: hệ thống chỉ điền hoặc cập nhật cột "hệ thống". Cột "anh" hệ thống chỉ đọc. Cột "hệ thống / anh": hệ thống chỉ điền khi ô đang **trống**, không ghi đè ô đã có chữ.

*(Đã bỏ tab `ChuaPhanDuAn`: khách chưa có mã dự án ở lại `KhachHang`, anh gõ mã vào `DuAnQuanTam`; xem mục 16.)*
**Tab `TuChoi`** (`SDT | LyDo | NgayGhi | LoaiYeuCau | DaDongYLai`): SĐT đã rút lại sự đồng ý (`Rút lại`, giữ hồ sơ) hoặc yêu cầu xóa (`Xóa`). Danh sách chặn: mọi bước phân bổ và mọi chiến dịch nhắn phải loại các SĐT này.
**Tab `NhatKy`**: mỗi lần chạy một dòng: thời điểm, nguồn, số dòng đọc, số khách mới, số gộp trùng, số đẩy sang từng dự án, số lỗi. **Không ghi tên, SĐT**, chỉ `MaKhach`.
**Tab `CauHinh`**: danh sách dự án (mã, ID Sheet đích, ID Sheet landing), lịch chạy, hạn giữ dữ liệu.

## 6. Quy tắc chống trùng và hợp nhất
1. Chuẩn hóa SĐT đúng như `normalizePhone_` trong `Code.gs` (`+84…`, `84…`, dấu cách, chấm, ngoặc đều về `0xxxxxxxxx`). SĐT không chuẩn hóa được thì **không** vào KhachHang; vào tab `Loi` kèm lý do để anh xem.
2. Trùng SĐT thì **gộp vào dòng cũ**, không thêm dòng:
   - `NguonGoc` thành `Landing+CRM` nếu đến từ hai nguồn.
   - `DuAnQuanTam` hợp (union) hai danh sách.
   - Ô trống thì điền; ô đã có chữ thì giữ (ưu tiên giá trị cũ, đặc biệt các cột anh nhập).
   - `DongYNhanTin`: nếu dòng mới là `Không`/`Đã rút lại` hoặc nằm trong `TuChoi` mà chưa có đồng ý mới hơn, **thắng** (an toàn pháp lý).
3. Khách landing điền lại nhiều lần: mỗi lần chỉ bổ sung dự án/căn quan tâm mới, không tạo dòng mới.
4. Hệ thống **không** tự đoán khớp mờ (tên + 3 số đầu + 3 số cuối kiểu CRM che SĐT), vì anh nhập SĐT đầy đủ.

## 7. Quy tắc phân bổ về Masterfile theo dự án
Anh đồng ý bốn điểm (11/11/2026):
1. Mỗi khách một dòng duy nhất trong Master_Data, `DuAnQuanTam` có thể nhiều dự án.
2. Khách quan tâm hai dự án thì **xuất hiện ở cả hai** nơi, cùng `MaKhach`.
3. Khách chưa có mã dự án ở lại `KhachHang` (không có tab riêng), anh gõ mã vào `DuAnQuanTam`.
4. **Một chiều** Master_Data → Masterfile; hệ thống không bao giờ ghi đè phần chăm sóc anh nhập tay trong Masterfile.

**Điểm cần anh chốt (mục 13):** Masterfile hiện là `.xlsx` trên Drive, Google không cho ghi tự động vào file đó. Đề xuất của em (mặc định trong spec):
- Mỗi dự án có **một Google Sheet nhỏ `Master_<mã>`** (tab `KhachTuMaster`) nhận khách đã lọc theo dự án. Hệ thống ghi vào đây, chỉ các cột hệ thống, theo `MaKhach` (thêm mới hoặc cập nhật, không xóa).
- `MasterFile_<tên>.xlsx` hiện có **giữ nguyên**, anh vẫn dùng cho giá, hoa hồng, vay. Khi cần đưa khách vào Masterfile thì chép từ `Master_<mã>` (một lần bấm tải/dán). Nếu sau này anh chuyển Masterfile sang Google Sheet gốc, chỉ cần đổi ID đích trong `CauHinh`.
- Cột anh nhập tay (ghi chú, chăm sóc chi tiết) nằm ở các cột bên phải của `KhachTuMaster`, hệ thống không động tới.

## 8. Lấy dữ liệu: landing và CRM
**Landing (tự động)**
- `Code.gs` hiện ghi ở tab "Landing". Đề xuất giữ nguyên báo Telegram và logic hiện có, **thêm một cột "Dự án"** (mã dự án, lấy từ trang landing đang gửi) để biết khách quan tâm dự án nào. Đây là thay đổi trên script đang chạy thật, đi qua cổng G2 (mục 12): thử trên bản sao Sheet và bản triển khai thử trước.
- Một hàm gộp (Apps Script gắn với Master_Data) chạy **mỗi 15 phút** (my call), đọc các dòng tab Landing chưa có dấu "đã gộp", chuẩn hóa, gộp theo mục 6, ghi nhật ký rồi đánh dấu "đã gộp" ở cột phụ. Chạy lại nhiều lần không sinh thêm dòng (idempotent). Chạy trên máy chủ Google, không cần máy anh mở.
- Lý do không gắn thẳng vào `doPost`: nếu ghi Master_Data lỗi thì khách vẫn phải được lưu ở tab Landing và báo Telegram như hiện nay. Landing không được hỏng vì Master_Data.

**CRM (nhập tay, anh quyết định)**
- Anh gõ hoặc dán thẳng vào tab `KhachHang` (hoặc tab `NhapCRM` có đúng các cột cần, hệ thống gộp vào `KhachHang` mỗi 15 phút để anh khỏi sửa nhầm công thức). Đề xuất mặc định: **tab `NhapCRM`** (my call).
- Cột tối thiểu: `HoTen`, `SDT`, `DuAnQuanTam`, `TrangThaiCRM`. Còn lại tùy chọn.
- Hệ thống kiểm SĐT ngay khi gộp, dòng lỗi vào tab `Loi`.
- Việc nhập CRM phụ thuộc anh: không nhập thì Master_Data thiếu khách CRM. Báo cáo nhật ký sẽ cho thấy số khách CRM mới theo tuần để anh tự thấy.

## 9. Bảo mật và pháp lý dữ liệu cá nhân
> Mục 16 thay thế các chỗ cũ nói rút lại là xóa và tab `ChuaPhanDuAn`: rút lại đồng ý chỉ đổi trạng thái và giữ hồ sơ; chỉ yêu cầu `Xóa` mới xóa dữ liệu.

- Dữ liệu chỉ ở Google Sheet/Drive riêng tư của anh. Không vào repo, không vào log chung. Test dùng dữ liệu ẩn danh hóa (mục 11).
- Khóa API (Telegram bot token, ID sheet) ở Script Properties của Apps Script, **không dán vào chat hay file**. Lệnh nào cần khóa ở máy cloud thì dùng `request_credential`.
- Tab `NhatKy` chỉ có số liệu và `MaKhach`. Tin Telegram báo lỗi chỉ ghi loại lỗi và số dòng.
- Căn cứ: Luật Bảo vệ dữ liệu cá nhân 2025 và Nghị định 356/2025. Cần ghi rõ **mục đích** (tư vấn dự án Bcons), **thời hạn giữ** (anh chốt 11/11/2026: không đặt thời hạn cố định; ghi trên mẫu đồng ý là "cho đến khi khách rút lại sự đồng ý hoặc yêu cầu xóa", nên cách rút lại/xóa dưới đây là bắt buộc phải chạy được), **cách rút lại/xóa** (khách nhắn xin rút lại đồng ý → anh thêm SĐT vào tab `TuChoi` loại `Rút lại` → lần chạy sau đổi trạng thái thành `Đã rút lại` và giữ hồ sơ, không nhắn nữa; khách yêu cầu xóa dữ liệu → loại `Xóa` → xóa khỏi các `Master_<mã>` và ẩn thông tin cá nhân ở `KhachHang`). 
- Chỉ nhắn khách có `DongYNhanTin = Có` ở `Master_<mã>` của đúng dự án đó (không `Đã rút lại`). Khách CRM nhập tay có `DongYNhanTin = Chưa rõ`; **chưa rõ thì không đưa vào danh sách nhắn hàng loạt**, chỉ để anh gọi/nhắn tư vấn từng người.
- Không dùng Zalo/Facebook cá nhân nhắn hàng loạt.

## 10. Lịch chạy, báo lỗi, nhật ký
- Mỗi 15 phút: gộp landing, gộp `NhapCRM`, phân bổ sang các `Master_<mã>`.
- Hàng ngày 8:00: tin Telegram tóm tắt (số khách mới hôm qua theo nguồn, số khách chưa có mã dự án, số mã dự án không có trong `CauHinh`, số dòng lỗi, số rút lại và điền lại hôm qua). Chỉ số liệu.
- Lỗi (không đọc được Sheet, hết hạn quyền, dòng lỗi quá ngưỡng): báo Telegram ngay, nội dung chỉ có loại lỗi.
- Chạy tay: menu "Master_Data" trong chính Sheet ("Gộp ngay"). Lệnh bot `/gopkhach` là việc tùy chọn giai đoạn sau (my call, không đưa vào bản đầu).

## 11. Kiểm thử
- Code lõi viết bằng hàm thuần (chuẩn hóa SĐT, gộp, quyết định phân bổ) trong `engine/master-data/`, test bằng `node --test` giống cách `engine/landing/apps-script.test.mjs` đang kiểm `Code.gs`. Test trước, code sau (TDD).
- Dữ liệu test **ẩn danh hóa nhưng giữ dạng thật**: SĐT viết `+84 98 123 4567`, `84981234567`, `098.123.4567`, `0981234567`; dòng landing với chuỗi đồng ý thật `Có (…, mẫu v1-2026-11-06, …)`; `DuAnQuanTam` nhiều dự án; tên có dấu, ký tự `=+-@` ở đầu ô; khách trùng giữa landing và CRM; dòng đã gộp bị chạy lại sau khi trigger chết giữa chừng; dòng trống.
- Kiểm tiêu đề cột thật của hai Masterfile (đọc một lần, ghi vào fixture dạng chỉ tên cột).
- Một test "không rò": dựng cả Master_Data giả và đảm bảo `NhatKy`/tin báo lỗi không chứa SĐT hay tên.
- Thử đầu-cuối trên **bản sao** các Sheet trước khi chạm bản thật.

## 12. Cổng duyệt
| Cổng | Việc | Anh duyệt gì |
|---|---|---|
| G0 | Spec này | Cả thiết kế |
| G1 | Tạo bản sao Master_Data và `Master_<mã>` thử | Cột, tên tab |
| G2 | Sửa `Code.gs` (thêm cột Dự án) | Trên bản sao Sheet và bản triển khai thử, rồi mới sang bản thật |
| G3 | Chạy gộp thử ở chế độ chỉ báo cáo (không ghi) | Số liệu: bao nhiêu khách, bao nhiêu trùng, bao nhiêu lỗi |
| G4 | Lần ghi thật đầu tiên vào Master_Data | Anh so với CRM và Landing |
| G5 | Lần phân bổ thật đầu tiên sang `Master_<mã>` | Anh kiểm vài khách |
| G6 | Bật lịch tự chạy 15 phút | |

## 13. Việc anh cần làm và điều anh cần chốt
1. Duyệt spec này (G0).
2. ~~Cách nhận khách ở phía dự án~~ Đã chốt: dùng Google Sheet nhỏ `Master_<mã>` song song Masterfile `.xlsx`.
3. ~~Hạn giữ dữ liệu~~ Đã chốt: không đặt thời hạn (giữ đến khi khách rút lại hoặc yêu cầu xóa).
4. Định nghĩa các giá trị `TrangThaiChamSoc` anh muốn dùng.
5. Cấp quyền chỉnh sửa cho Apps Script mới trên Master_Data và các Sheet landing (anh bấm "Cho phép" khi em hướng dẫn, không gửi khóa trong chat).
6. Tạo bản sao Sheet để thử (em hướng dẫn từng bước khi tới G1).

## 14. Quyết định em tự đặt (anh sửa được)
- Chu kỳ gộp 15 phút, báo cáo hằng ngày 8:00.
- Tab nhập CRM tên `NhapCRM`, hệ thống gộp vào `KhachHang`.
- `DongYNhanTin` của khách CRM nhập tay mặc định `Chưa rõ`; giá trị lạ anh gõ (ngoài `Có`, `Chưa rõ`, `Đã rút lại`, `Không`) bị coi là chưa đồng ý và ghi `Loi`.
- SĐT lỗi vào tab `Loi`, không bỏ im lặng.
- Không khớp mờ theo SĐT che.
- Lệnh bot `/gopkhach` để giai đoạn sau.

## 15. Phần dành cho người dựng
- Chọn thư viện hoặc cách test Apps Script (đang dùng cách của `apps-script.test.mjs`).
- Cách đặt `MaKhach` và khóa chống chạy trùng (`LockService`).
- Chi tiết định dạng ngày, múi giờ `Asia/Ho_Chi_Minh`.
- Chi tiết khớp cột với Masterfile khi đã đọc dòng tiêu đề.

## 16. Quyết định bổ sung của anh (11/11/2026, sau khi duyệt spec)
Đã chốt:
1. **Thời hạn giữ:** không đặt thời hạn (khớp mục 9). Hai trang chính sách của landing đã sửa theo: "đến khi rút lại đồng ý hoặc yêu cầu xóa".
2. **Nơi cập nhật trạng thái chăm sóc:** ở riêng từng dự án (`Master_<mã>`). Hiện đúng như code: hai cột trạng thái ở `Master_<mã>` chỉ được điền khi còn trống, không bị ghi đè; thay đổi sau này ở `KhachHang` không chảy sang.

Đã chốt và **đã làm** trong kế hoạch `docs/superpowers/plans/2026-11-11-master-data-dong-y-theo-du-an.md` (code dựng và test trên máy, chưa cài lên Sheet thật):
3. **Đồng ý nhận tin theo từng dự án.** `KhachHang` có thêm hai cột cuối: `DongYDuAn` (mã dự án khách đã đồng ý, ngăn `;`) và `NgayRutLai`; `DongYBangChung` lưu mỗi dự án một đoạn `<mã>: Có (...)`. Chỉ nhắn về dự án có trong `DongYDuAn` và chưa rút lại; đồng ý dự án A không mở nhắn dự án B. `DongYNhanTin` ở `KhachHang` là trạng thái chung (`Có` / `Chưa rõ` / `Đã rút lại`); cột cùng tên ở `Master_<mã>` nói riêng về dự án của sheet đó. Rút lại vẫn áp dụng cho cả khách (an toàn hơn), không theo từng dự án.
4. **Rút lại đồng ý và điền lại form (pháp chế đã xác nhận 11/11/2026):**
   - Khách **rút lại**: hệ thống đổi trạng thái sang `Đã rút lại` (ghi `NgayRutLai`), **giữ hồ sơ** ở `KhachHang` và `Master_<mã>` để mọi chiến dịch loại họ ra. Gõ đúng `Không` ở `DongYNhanTin` cũng là rút lại (hệ thống ghi lại thành `Đã rút lại`); mọi giá trị lạ khác (`Không rõ`, `Từ chối`, `No`...) **không** rút lại nhưng cũng **không được nhắn** (Master hiện `Chưa rõ`), chữ của anh giữ nguyên và ghi một dòng `Loi` (báo Telegram `LOI_DONG_Y`).
   - Khách **điền lại form** có tick đồng ý mới hơn ngày rút lại: hệ thống đổi về `Có` **chỉ cho dự án của lần điền đó** và được nhắn lại về dự án ấy; đồng ý các dự án khác không tự mở lại. Dòng `TuChoi` không bị xóa mà điền `DaDongYLai` = ngày đồng ý mới. Đồng ý cũ hơn ngày rút lại không mở lại gì.
   - **Yêu cầu xóa dữ liệu** tách riêng: `TuChoi` có cột `LoaiYeuCau` = `Rút lại` (mặc định, cũng là giá trị cho ô trống hoặc chữ lạ, chữ lạ được ghi ở `Loi`) hoặc `Xóa` (anh đã duyệt thiết kế này); chỉ `Xóa` chạy luồng xóa dữ liệu. Cột `NgayGhi` có thể để trống (hệ thống điền); ngày không kèm giờ tính tới hết ngày đó giờ Việt Nam. Phạm vi xóa ở điểm 6 áp dụng cho `Xóa`.
5. **Khách landing cũ chưa có mã dự án:** nằm lại trong `KhachHang` với `DuAnQuanTam` trống, `DongYNhanTin` = `Chưa rõ`, **không** có tab `ChuaPhanDuAn` (tab và cột `GanDuAn` đã bỏ). Anh gõ mã dự án vào ô `DuAnQuanTam` ngay trong `KhachHang`. Số khách này hiện ở hộp thoại và tin hằng ngày ("Chưa có mã dự án: N") và không làm lần chạy mất trạng thái rảnh.

6. **Phạm vi xóa khi khách yêu cầu xóa (loại `Xóa`; loại `Rút lại` không xóa gì), đã làm:** hệ thống tự xóa ở `KhachHang` và `Master_<mã>`; các nơi khác (tab Landing, `NhapCRM`, Telegram, Masterfile `.xlsx`, CRM công ty) anh xóa tay theo danh sách trong hướng dẫn; SĐT (chỉ SĐT, không tên) giữ riêng trong `TuChoi` để không nhắn lại.
7. **Cổng G4 chạy trên Sheet landing thật** (anh chọn). Vì vậy hướng dẫn có **Bước 0 bắt buộc** tạo bản sao lưu, liệt kê chính xác cột bị ghi (cột `Đã gộp` của landing, các tab mới) và cách quay lại; vẫn dừng chờ anh nói "OK G4".

**Pháp chế đã xác nhận điểm 4 (11/11/2026)**, và điểm 3, 4, 5 đã được làm trong kế hoạch `docs/superpowers/plans/2026-11-11-master-data-dong-y-theo-du-an.md`. Hướng dẫn cài `docs/huong-dan-master-data.md` mô tả đúng hành vi mới.
