# Master_Data: kho khách tập trung, cài và thử từng cổng

> **Trạng thái:** code đã dựng và test trên máy em (11/11/2026), **chưa cài lên Sheet thật nào**. Anh đi lần lượt G1 đến G6, mỗi cổng xong thì nhắn em "OK" hoặc "Dừng". Thiết kế: `superpowers/specs/2026-11-11-master-data-khach-hang-design.md`.

## Đây là gì
Khách nằm ở nhiều nơi: tab Landing của Google Sheet, CRM công ty, Masterfile từng dự án. Master_Data là **một Google Sheet riêng tư** gom hết về một chỗ, mỗi khách đúng một dòng (khóa là SĐT), rồi chép sang một Sheet nhỏ `Master_<mã dự án>` cho từng dự án.

Luồng, nói bằng lời:
1. Khách điền landing, vào tab Landing như hiện nay (Telegram vẫn báo như cũ).
2. Cứ 15 phút, Master_Data tự đọc các dòng Landing chưa gộp (cột **Đã gộp** trống), chuẩn hóa SĐT, gộp khách trùng.
3. Khách CRM thì anh gõ tay vào tab `NhapCRM`, hệ thống gộp chung.
4. Mỗi khách được chép (một chiều, không ghi ngược) sang tab `KhachTuMaster` của `Master_<mã>` đúng dự án họ quan tâm. Chưa rõ dự án thì vào tab `ChuaPhanDuAn` để anh gán.
5. Khách xin rút lại thì anh ghi SĐT vào tab `TuChoi`; lần chạy sau hệ thống xóa khách khỏi mọi `Master_<mã>` và xóa thông tin cá nhân ở `KhachHang`.

Hệ thống chạy trên máy chủ Google (Apps Script, đoạn chương trình nhỏ gắn vào Sheet, như macro Excel nhưng chạy trên mạng), không cần máy anh mở.

Thuật ngữ dùng trong bài: **Sheet id** = đoạn chữ dài giữa `/d/` và `/edit` trên thanh địa chỉ của một Google Sheet (như số CCCD của file). **Trigger** = lịch tự chạy (như hẹn giờ báo thức). **Script Properties** = ngăn kéo kín của Apps Script để cất khóa, không ai nhìn thấy trong code.

---

## G1. Tạo bản thử (chưa đụng dữ liệu thật)
1. Trong Google Drive, vào thư mục `Bcons/data/`, tạo thư mục con `master-data` nếu chưa có.
2. Trong thư mục đó: **Mới → Google Trang tính (Google Sheets)**, đặt tên **`Master_Data (thử)`**. Giữ riêng tư: không bấm Chia sẻ, không bật "Bất kỳ ai có đường liên kết".
3. Cũng ở đó, tạo mỗi dự án một Sheet trống tên **`Master_bcons-central-park (thử)`** và **`Master_bcons-newsky (thử)`** (thêm dự án khác thì làm tương tự). Sheet trống là đủ: tab `KhachTuMaster` hệ thống tự tạo ở lần ghi đầu. **Đừng tự tạo tab này**; nếu lỡ tạo thì dòng tiêu đề phải đúng 12 cột A..L: `MaKhach, SDT, HoTen, NgayCapNhat, NguonGoc, DuAnQuanTam, NhuCau, CanXem, PTTT, DongYNhanTin, TrangThaiCRM, TrangThaiChamSoc`, cột M để trống.
4. Mở `Master_Data (thử)`. Menu **Tiện ích mở rộng → Apps Script**. Một tab mới mở ra.
5. Dán code, hai file:
   - Bên trái bấm dấu **+** cạnh "Tệp" → **Tập lệnh**, đặt tên `Logic` (Google tự thêm đuôi `.gs`). Trong dự án mới đã có sẵn file `Code.gs`: đổi tên nó thành `Logic` cũng được, miễn cuối cùng có đúng hai file `Logic` và `Sheets`.
   - Mở repo **bcons** trên GitHub trong trình duyệt, vào `engine/master-data/apps-script/Logic.gs`, bấm nút **Raw**, bấm `Ctrl+A` rồi `Ctrl+C`, quay lại Apps Script, xóa hết chữ cũ trong file `Logic`, dán `Ctrl+V`, bấm **Lưu** (biểu tượng đĩa).
   - Làm y như vậy cho file thứ hai `Sheets` với `engine/master-data/apps-script/Sheets.gs`.
6. Khai báo múi giờ và quyền: bên trái bấm ⚙️ **Cài đặt dự án (Project Settings)** → tích **Hiện tệp kê khai "appsscript.json" trong trình chỉnh sửa (Show "appsscript.json" manifest file)**. Quay lại Trình chỉnh sửa, mở file `appsscript.json`, xóa hết, dán nội dung file `engine/master-data/apps-script/appsscript.json` (cũng lấy bằng Raw), Lưu. Vì sao: file này đặt múi giờ `Asia/Ho_Chi_Minh` (để giờ ghi và báo cáo 8 giờ sáng đúng giờ Việt Nam) và khai báo bốn quyền cần dùng: đọc/ghi Google Sheets, tạo lịch tự chạy, gửi tin ra Telegram, hiện menu trong Sheet.
7. Cất khóa Telegram (anh tự gõ ở trang cài đặt, **không gửi cho em**): ⚙️ Cài đặt dự án → kéo xuống **Thuộc tính tập lệnh (Script Properties)** → **Thêm thuộc tính** hai lần: `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`, cùng giá trị với script landing (xem `huong-dan-landing.md`, Bước 2). Bấm **Lưu thuộc tính tập lệnh**. Script Master_Data là một dự án riêng nên phải nhập lại, không tự lấy từ script landing. Thiếu hai thuộc tính này thì hệ thống vẫn chạy nhưng **im lặng, không báo Telegram** (không có thông báo lỗi nào).
8. Quay lại `Master_Data (thử)`, tải lại trang (`F5`). Sau vài giây có menu **Master_Data** trên thanh menu.
9. Tạo tab `CauHinh` bằng tay (bấm dấu **+** ở góc dưới trái, đặt tên đúng chữ `CauHinh`). Hàng 1 gõ ba tiêu đề đúng chữ, từng ô một: `maDuAn` | `landingSheetId` | `masterSheetId`. Mỗi dự án một dòng:
   - `maDuAn`: mã dự án như `bcons-central-park`, `bcons-newsky` (chữ thường, gạch ngang, đúng mã trong `du-an/`).
   - `landingSheetId`: Sheet id của Sheet có tab **Landing** mà landing dự án đó ghi vào. **Cho đến khi qua G5, điền id của bản sao `Landing (thử)`** (anh tạo ở G2 bước 1; lúc làm G1 chưa có thì để trống, điền sau khi làm G2 bước 1 và trước G3). **Không điền Sheet thật "Bcons - Khach quan tam Messenger" lúc này.** Sau khi G5 đạt mới đổi sang id Sheet thật (xem cuối G5). Central Park và Newsky dùng chung một Sheet landing, nên hai dòng điền cùng một id (hệ thống tự bỏ trùng, không đọc hai lần). Dự án nào landing không ghi vào Sheet nào thì để trống ô này.
   - Nhớ: bấm **Gộp ngay** sẽ ghi mã khách `KH-...` (hoặc `LOI`) vào cột S **Đã gộp** của Sheet landing nào đang có trong `CauHinh`. Muốn làm lại từ đầu thì xóa cột S của Sheet landing đó (khách khớp theo SĐT nên không bị nhân đôi).
   - `masterSheetId`: Sheet id của `Master_<mã> (thử)` dự án đó. Để trống thì dự án đó không được phân bổ và khách của nó rơi vào `ChuaPhanDuAn`.
   - Cách lấy Sheet id: mở Sheet đó, nhìn thanh địa chỉ `https://docs.google.com/spreadsheets/d/`**`1AbC...xyz`**`/edit`, chép đoạn in đậm.
   - Phải có ít nhất một `landingSheetId`, nếu không lần chạy báo lỗi `LOI_TAB`.
10. Các tab còn lại (`KhachHang`, `NhapCRM`, `Loi`, `ChuaPhanDuAn`, `TuChoi`, `NhatKy`) tự được tạo ở lần **ghi** đầu tiên (G4). Ở "Chạy thử" thì chúng chưa cần có.

**Cấp quyền lần đầu:** lần đầu bấm một mục trong menu Master_Data, Google hỏi quyền. Chọn tài khoản của anh. Có thể hiện màn **"Google chưa xác minh ứng dụng này" (Google hasn't verified this app)**: bình thường vì đây là script anh tự dán, không phải ứng dụng công khai. Bấm **Nâng cao (Advanced)** → **Đi tới ... (không an toàn) (Go to ... (unsafe))** → **Cho phép (Allow)**. Xong thì bấm lại mục menu vừa rồi (lần đầu có thể chỉ cấp quyền chứ chưa chạy). Cách hiện màn này giống Bước 2 của landing; riêng script Master_Data chưa kiểm trên Google thật.

**Em cần thấy ở G1:** anh báo "đã dán hai file + manifest + CauHinh xong" (không cần gửi id nào cho em nếu anh ngại; chỉ cần nói xong). **Anh nói "OK G1" hoặc "Dừng".**

## G2. Sửa script landing, thử trên bản sao trước
Bản `Code.gs` mới của landing thêm hai cột cuối: **Dự án** (cột R) và **Đã gộp** (cột S). Đừng chạm script thật vội.
1. Trong Drive, chuột phải Sheet **Bcons - Khach quan tam Messenger** → **Tạo bản sao (Make a copy)**, đặt tên `Landing (thử)`.
2. Mở bản sao → **Tiện ích mở rộng → Apps Script**. Bản sao có thể đã kèm một bản script cũ; xóa hết chữ trong file đó và dán nội dung mới của `engine/landing/apps-script/Code.gs` (GitHub → Raw → `Ctrl+A`, `Ctrl+C`). Lưu.
3. Cài Script Properties `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` như Bước 2 trong `huong-dan-landing.md` (bản sao không giữ thuộc tính; có thể bỏ qua bước này nếu anh không muốn tin thử bắn vào Telegram thật, khi đó chỉ ghi Sheet).
4. **Triển khai (Deploy) → Bản triển khai mới (New deployment)** → ⚙️ **Ứng dụng web (Web app)**, Execute as **Me**, Who has access **Anyone**. Chép link `/exec` (chỉ để thử).
5. Gửi thử một khách: anh gửi em link `/exec` thử này (không phải khóa bí mật, nhưng **ai có link đều gửi được dòng vào Sheet thử**, nên xong G2 anh **xóa bản triển khai thử này**: Triển khai → Quản lý bản triển khai → lưu trữ/xóa). Em dựng một trang landing chế độ `--nhap` (trang nháp, chỉ để thử) trỏ vào link đó; anh mở trang, điền một khách thử (tên và SĐT giả) rồi bấm gửi. Kết quả mong đợi: tab **Landing** của bản sao có dòng mới với `Dự án` = mã dự án (vd `bcons-central-park`) ở cột R, cột S `Đã gộp` trống.
6. Nếu tab Landing của bản sao còn tiêu đề cũ 17 cột: script **tự sửa hàng tiêu đề ở lần khách kế tiếp** (thêm `Dự án`, `Đã gộp`). Anh muốn chắc ngay thì gõ tay `Dự án` vào ô R1 và `Đã gộp` vào ô S1.
7. **Anh nói "OK G2"** thì mới làm bước thật: trong Sheet thật, Apps Script → dán đè `Code.gs` mới → Lưu → **Triển khai → Quản lý bản triển khai (Manage deployments) → ✏️ → Phiên bản: Phiên bản mới (New version) → Triển khai**. **Không** tạo "Bản triển khai mới" (sẽ ra link khác, landing không gửi tới được); link `/exec` phải giữ nguyên. Sau đó gõ `Dự án` vào R1 và `Đã gộp` vào S1 của Sheet thật (nếu chưa có), vì G3 cần cột `Đã gộp` có sẵn.
8. Lưu ý: mã dự án trong landing đã được đẩy lên GitHub; Cloudflare sẽ gửi `duAn` sau lần build kế tiếp của trang (trước đó dòng mới vẫn có thể thiếu mã). Newsky đã gửi mã dự án từ trước.
9. Khách **đến trước lúc thay `Code.gs` ở bước 7** có cột `Dự án` trống nên sẽ hiện ở `ChuaPhanDuAn`: anh gõ `GanDuAn` cho từng người đó. (Có nên để em tự đoán dự án cho khách cũ hay không là quyết định của anh, em chưa làm.)

## G3. Chạy thử, không ghi gì
1. Mở `Master_Data (thử)` → menu **Master_Data → Chạy thử (không ghi)**. Chờ hộp thoại (vài giây đến một phút).
2. Đọc hộp thoại:
   - **Landing: đọc / mới / trùng / lỗi**: đọc = số dòng Landing chưa gộp; mới = khách chưa có trong KhachHang; trùng = khách cùng SĐT với người đã có (hoặc xuất hiện hai lần trong cùng lượt); lỗi = SĐT sai dạng.
   - **CRM: đọc / mới / trùng / lỗi**: như trên, với tab NhapCRM (chưa có tab thì đọc 0).
   - **Phân bổ: vào dự án / chưa phân (chua) / rút lại (chan) / Master lỗi**: vào dự án = số lượt khách được thêm mới hoặc cập nhật vào các `Master_<mã>` (một khách ở hai dự án tính hai lượt; khách đã có mà có thay đổi cũng tính); chưa phân = số vào `ChuaPhanDuAn`; rút lại = số dòng khách sẽ bị xóa vì nằm trong `TuChoi` hoặc bị gõ `Không`.
   - **Lưu ý:** chạy thử không ghi gì nên bước Phân bổ chỉ nhìn các khách **đã có sẵn** trong `KhachHang`. Lần đầu, `KhachHang` còn trống nên Phân bổ sẽ là 0; đó là bình thường, số thật xuất hiện sau khi ghi (G4).
3. Anh so với đời thực: số **mới** của Landing có khớp số dòng thật trong tab Landing chưa có chữ ở cột Đã gộp (với trường hợp SĐT trùng nhau thì mới nhỏ hơn đọc); số **lỗi** thì mở tab Landing xem các SĐT sai. Số khách CRM thì so với danh sách anh gõ ở NhapCRM nếu đã gõ.
4. Nếu dòng cuối hộp thoại có `Lỗi: LOI_...`, xem bảng dưới.

| Mã lỗi | Nghĩa | Anh làm |
|---|---|---|
| `LOI_KHOA` | Lỗi khóa, hiếm gặp (thường thấy hơn là hộp thoại "Một lần chạy khác đang chạy. Chờ ít phút rồi bấm lại." khi hai lần chạy chồng nhau) | Chờ vài phút, bấm lại |
| `LOI_QUYEN` | Google chưa cho phép (hoặc quyền bị thu) | Bấm lại mục menu, cấp quyền như ở G1 |
| `LOI_DOC_SHEET` | Không mở được một Sheet (sai id, không có quyền, bị xóa) | Kiểm lại id trong `CauHinh`, tài khoản của anh phải mở được Sheet đó |
| `LOI_TAB` | Thiếu tab hoặc thiếu cột (vd tab Landing không có cột `Đã gộp`, NhapCRM thiếu cột, `CauHinh` thiếu), **hoặc tab `KhachTuMaster` của một `Master_<mã>` có tiêu đề sai/không mở được** (cột A..L phải đúng chữ như ở G1) | Thêm hoặc sửa tiêu đề cột đúng chữ |
| `LOI_DONG` | Một lần chạy có **từ 5 dòng khách trở lên** bị lỗi (SĐT sai ở Landing + NhapCRM); ít hơn 5 thì chỉ ghi tab `Loi`, không báo Telegram | Mở tab `Loi`, sửa SĐT ở nguồn, xóa chữ `LOI` để thử lại |
| `LOI_HAN_MUC` | Chạm hạn mức của Google | Chờ rồi chạy lại |
| `LOI_HET_GIO` | Lần chạy quá lâu, dừng sạch giữa chừng | Chạy lại, lần sau làm tiếp phần còn lại |
| `LOI_MASTER` | Một `Master_<mã>` không mở được hoặc không xóa được dòng (chỉ báo khi có khách rút lại) | Kiểm id và tiêu đề tab `KhachTuMaster` của dự án đó; `KhachHang` được giữ nguyên, lần sau làm lại |
| `LOI_KHAC` | Lỗi chưa phân loại | Gửi em mã lỗi và việc anh vừa làm |

Các mã này em phân loại dựa vào chữ trong thông báo lỗi của Google, **chưa kiểm với dịch vụ Google thật**: có thể một lỗi rơi nhầm vào `LOI_KHAC` hoặc mã gần nghĩa. Hộp thoại và tin Telegram chỉ ghi mã, không ghi tên hay SĐT; khi gặp lỗi lạ, anh mở Apps Script → **Thực thi (Executions)** (chưa kiểm tên nút trên giao diện thật), bấm vào lần chạy bị đỏ và **chụp màn hình gửi em**; nguyên nhân thật nằm ở đó (chuỗi giống SĐT đã được che). Nếu lịch tự chạy không khởi động được (ví dụ quyền hết hạn), Google còn gửi email báo lỗi vào tài khoản của anh.

**Anh nói "OK G3" hoặc "Dừng".**

## G4 và G5. Ghi thật lần đầu, rồi phân bổ
Menu chỉ có **Gộp ngay**, chạy cả ba bước (landing, NhapCRM, phân bổ) trong một lần, nên G4 và G5 nằm chung một cú bấm. An toàn vì đang trỏ vào các Sheet **thử**.
1. Menu **Master_Data → Gộp ngay**. Hộp thoại ghi "Đã gộp" kèm số đếm.
2. **G4, kiểm `Master_Data (thử)`:**
   - `KhachHang`: một dòng một khách, mã `KH-000001`, `KH-000002`..., SĐT dạng `0xxxxxxxxx`, `NguonGoc` = Landing (hoặc CRM / Landing+CRM), `DongYNhanTin` = `Có` với khách landing có ô đồng ý, `Chưa rõ` với khách CRM.
   - `Loi`: các dòng SĐT sai (thời gian, nguồn, số dòng, lý do). Sửa SĐT ở nguồn thì không tự thử lại; dòng đã bị đánh dấu `LOI` ở cột **Đã gộp** (Landing) hoặc **DaGop** (NhapCRM) **không được thử lại cho đến khi anh xóa chữ `LOI` đó** (xóa xong lần chạy sau đọc lại).
   - Tab Landing: cột `Đã gộp` điền mã `KH-...` (hoặc `LOI`). **Đừng sửa cột này bằng tay** trừ khi muốn đọc lại một dòng.
   - `ChuaPhanDuAn`: khách chưa có dự án hợp lệ (kèm cột `GanDuAn` ở cuối).
   - `NhatKy`: có một dòng cho lần chạy (xem G6).
   - So số khách với CRM và Landing, như yêu cầu của cổng G4. **Anh nói "OK G4".**
3. **G5, kiểm vài khách ở `Master_<mã> (thử)`**, tab `KhachTuMaster`:
   - Cột **A..L** là cột hệ thống: `MaKhach, SDT, HoTen, NgayCapNhat, NguonGoc, DuAnQuanTam, NhuCau, CanXem, PTTT, DongYNhanTin, TrangThaiCRM, TrangThaiChamSoc`. Cột **M** để trống. Từ cột **N** (tiêu đề "Ghi chú của anh") là cột **của anh**, hệ thống không bao giờ ghi vào; thêm cột bên phải N thoải mái.
   - Hai cột `TrangThaiCRM` (K) và `TrangThaiChamSoc` (L) hệ thống **chỉ điền khi ô còn trống**; anh gõ vào đó thì không bị ghi đè. Thay đổi trạng thái làm **sau này** ở `KhachHang` **không chảy** sang `Master_<mã>`: cột trạng thái của `KhachHang` chỉ là lần điền đầu. Vì vậy hãy **cập nhật trạng thái ở `Master_<mã>`** (nơi anh làm việc hằng ngày). *(Anh đã chốt 11/11/2026: trạng thái cập nhật ở riêng từng dự án.)* Các cột A..J được cập nhật theo `KhachHang` mỗi lần chạy.
   - Khách quan tâm hai dự án có mặt ở cả hai Sheet, cùng `MaKhach`.
   - Kiểm: khách đúng dự án chưa, ai thiếu, ai thừa. **Anh nói "OK G5".** Từ đó, Sheet thử dùng luôn làm bản thật: đổi tên bỏ chữ "(thử)" (id không đổi nên `CauHinh` vẫn đúng). Muốn trỏ sang Sheet khác thì sửa `masterSheetId` rồi bấm **Gộp ngay**. **Chuyển sang dữ liệu thật:** ở tab `CauHinh`, đổi `landingSheetId` từ bản `Landing (thử)` sang id Sheet thật "Bcons - Khach quan tam Messenger" (sheet thật phải có cột S `Đã gộp`, xem G2 bước 7); lần **Gộp ngay** kế tiếp sẽ gộp các dòng thật chưa có dấu ở cột S, khách trùng SĐT với bản thử thì gộp vào dòng đã có.

## G6. Bật lịch tự chạy
1. Menu **Master_Data → Cài lịch tự động**. Có thể hiện hộp xin quyền (Google gọi là tạo trigger); cho phép như G1. Hộp thoại báo: "Đã cài lịch: gộp mỗi 15 phút, tin tóm tắt khoảng 8-9 giờ mỗi ngày."
2. Hai lịch được tạo: `chayTatCaTuDong` mỗi 15 phút (gộp + phân bổ) và `baoCaoNgayTuDong` mỗi ngày trong khung 8 đến 9 giờ sáng (Apps Script tự chọn phút, nên không đúng 8:00). Bấm menu này nhiều lần không nhân đôi lịch.
3. Xem hoặc tắt lịch: Apps Script → biểu tượng đồng hồ **Trình kích hoạt (Triggers)** ở thanh bên trái → thấy hai dòng → bấm dấu ba chấm ⋮ cuối dòng → **Xóa trình kích hoạt (Delete trigger)**. Xóa cả hai là dừng hẳn tự chạy; menu **Gộp ngay** vẫn dùng được.
4. **Tin Telegram hằng ngày** (chỉ số, không tên, không SĐT): số khách mới hôm qua theo nguồn, số dòng ở `ChuaPhanDuAn`, số dòng ở `Loi`, số khách rút lại hôm qua, và "**Lần chạy cuối: N phút trước**" = lần chạy gần nhất, **mọi lần chạy đều tính** (kể cả lần rảnh không ghi NhatKy và lần bấm Gộp ngay); Chạy thử và lần bị bỏ qua vì khóa bận không tính. Nếu số này lớn hơn khoảng 30 phút thì lịch đang không chạy: vào Trình kích hoạt xem. Muốn thử tin này ngay: Apps Script → chọn hàm `baoCaoNgayTuDong` ở thanh trên → ▶ Chạy.
5. **Tab `NhatKy`:** cột `Thời gian | Nguồn | Số dòng đọc | Khách mới | Gộp trùng | Lỗi | Ghi chú`. Mỗi lần chạy có việc (có khách mới, trùng, lỗi, rút lại...) thì ghi **một dòng**. Lần chạy "rảnh" (không có gì mới, không lỗi) **không ghi**, trừ một dòng "nhịp: đang chạy, không có gì mới" mỗi ngày để anh biết hệ thống còn sống. Cột Ghi chú có `chua=` (vào ChuaPhanDuAn), `chan=` (rút lại), `tuchoi=` / `khong=` (rút lại vì TuChoi / vì gõ Không), `vao=` (chép sang dự án), `ms=` (mất bao nhiêu mili giây), và mã lỗi nếu có. Có lỗi thì Telegram báo một tin `⚠️ Master_Data: <mã lỗi> (<n> dòng). Xem tab NhatKy.`; cùng loại lỗi chỉ báo lại sau 6 giờ. Lỗi từng dòng khách (SĐT sai) chỉ báo Telegram khi **từ 5 dòng trở lên** trong một lần chạy (mã `LOI_DONG`); ít hơn thì anh xem tab `Loi`.

---

## Dùng hằng ngày

### Nhập khách CRM
Mở tab **NhapCRM** (có sau lần ghi đầu). Cột tối thiểu, đúng tiêu đề này: `HoTen | SDT | DuAnQuanTam | TrangThaiCRM | DaGop`. **Để trống cột `DaGop`**; hệ thống tự điền.
- `DuAnQuanTam` phải là **mã dự án** như `bcons-central-park` (nhiều dự án thì ngăn bằng dấu `;`). Gõ chữ thường như "Central Park" thì bị bỏ, khách đó vào `ChuaPhanDuAn`.
- SĐT gõ kiểu nào cũng được (`098.123.4567`, `+84 98 123 4567`). Cột đã đặt dạng chữ để giữ số 0 đầu.
- Sau khi gộp, `DaGop` hiện **mã khách** `KH-...` (đã vào) hoặc **`LOI`** (SĐT sai, đã ghi ở tab `Loi`, không thử lại cho đến khi anh xóa chữ `LOI` sau khi sửa SĐT).
- Dòng đã `DaGop` thì sửa tiếp ở NhapCRM **không** có tác dụng. Muốn đổi trạng thái khách đã có, sửa ở tab `KhachTuMaster` của `Master_<mã>` (nơi anh làm việc hằng ngày); trạng thái ở `KhachHang` chỉ được dùng cho lần điền đầu và không chảy sang `Master_<mã>` về sau. *(Anh chưa chốt nơi sửa trạng thái.)* Đừng gõ khách trực tiếp vào `KhachHang`: dòng không có mã `KH-...` bị bỏ qua; khách mới gõ ở `NhapCRM`.
- Khách CRM có `DongYNhanTin` = **Chưa rõ**.

### Khách chưa rõ dự án
Tab **ChuaPhanDuAn**: **chỉ gõ cột `GanDuAn`** (các cột khác do hệ thống điền; chữ anh gõ vào một ô còn trống thì được giữ, nhưng khách được chuyển sang `Master_<mã>` thì cả dòng bị xóa, nên đừng dùng chỗ này để lưu ghi chú). Gõ mã dự án vào cột **GanDuAn** của khách. Lần chạy sau, khách được thêm dự án đó vào `DuAnQuanTam`, chép sang `Master_<mã>` và dòng biến mất khỏi `ChuaPhanDuAn`. Mã phải có trong tab `CauHinh` (có `masterSheetId`), nếu không khách vẫn nằm lại.

### Khách xin rút lại
Hai cách, kết quả như nhau:
- Thêm SĐT khách vào cột **SDT** của tab **TuChoi** (cột A, các cột LyDo, NgayGhi tùy anh điền).
- Hoặc gõ `Không` vào cột `DongYNhanTin` của khách ở `KhachHang`; hệ thống tự ghi SĐT đó vào `TuChoi` (LyDo "Rút lại (cột)").

Ghi `NgayGhi` (cột C của `TuChoi`) là **ngày hôm nay** khi anh tự gõ dòng; tin tóm tắt hằng ngày đếm "Rút lại" theo cột này. Dòng hệ thống tự ghi thì đã có ngày. SĐT trong `TuChoi` gõ sai dạng (thiếu số, có chữ) thì không chặn được ai: hệ thống ghi một dòng vào tab `Loi` (nguồn "Rút lại", chỉ có số dòng của `TuChoi`, không ghi SĐT) và báo trong `NhatKy`; anh sửa lại SĐT cho đúng.

Lần chạy sau (tối đa 15 phút, hoặc bấm Gộp ngay), danh sách việc khi có yêu cầu xóa dữ liệu của một khách:

**Hệ thống tự xóa:**
- Ở `KhachHang`: SĐT, họ tên, nhu cầu, căn xem, bằng chứng đồng ý, nguồn chi tiết, PTTT, người chăm sóc; `GhiChu` thành "Rút lại", `DongYNhanTin` = `Không`.
- Mọi dòng của khách trong tab `KhachTuMaster` của **mọi** `Master_<mã>` (kể cả ghi chú anh gõ ở cột N trở đi của dòng đó).
- Dòng của khách ở `ChuaPhanDuAn`.

**Anh vẫn phải tự xóa tay** (các bản sao này nằm ngoài hệ thống, em không với tới):
- Dòng của khách ở tab **Landing** (có tên + SĐT, và mã `KH-...` ở cột Đã gộp).
- Dòng của khách ở tab **NhapCRM**.
- Các tin Telegram của khách đó (tin báo khách mới và tin mẫu Zalo).
- Dòng đã chép dán vào file Masterfile `.xlsx`.
- Bản ghi trong CRM của công ty.

SĐT chỉ còn ở `TuChoi` (để tiếp tục chặn): khách điền landing lại cũng bị xóa ở lần chạy sau. Vì các bản sao tay ở trên có thể còn SĐT, hãy xóa hết khi nhận yêu cầu. Muốn cho một người được nhận lại, **anh phải tự xóa dòng của họ trong `TuChoi`**; thông tin cá nhân cũ đã xóa nên khách phải điền lại.

Nếu anh gõ ở `DongYNhanTin` một giá trị bắt đầu bằng "không" nhưng không đúng chữ `Không` (ví dụ "Không rõ", "Không biết"), hệ thống **không** rút lại khách đó, coi như `Chưa rõ`, và ghi một dòng vào tab `Loi` ("ghi đúng Không để rút lại") mỗi lần chạy cho đến khi anh sửa. Muốn rút lại thì ghi đúng `Không`.

### Quy tắc
1. Chỉ nhắn hàng loạt khách có `DongYNhanTin` = **Có**. Khách CRM (`Chưa rõ`) chỉ gọi hoặc nhắn tư vấn từng người.
2. Không dùng Zalo hay Facebook cá nhân để nhắn hàng loạt.
3. Không chia sẻ Master_Data hay Master_<mã> bằng đường liên kết; chỉ tài khoản của anh.
4. Dữ liệu khách không bao giờ vào repo hay chat với em; nếu cần em kiểm, anh chỉ cần nói số lượng và mã lỗi.
5. Khóa Telegram chỉ gõ ở Script Properties.

---

## Khi có trục trặc
| Dấu hiệu | Làm gì |
|---|---|
| Không thấy menu Master_Data | Tải lại trang Sheet (`F5`), chờ vài giây; kiểm đã Lưu cả hai file trong Apps Script |
| Hộp thoại `Lỗi: LOI_TAB` | Kiểm tab `CauHinh` (3 tiêu đề đúng chữ, ít nhất một `landingSheetId`) và tab Landing có cột `Đã gộp` (ô S1); kiểm cả tiêu đề cột A..L của tab `KhachTuMaster` ở từng `Master_<mã>` |
| `LOI_DOC_SHEET` | Sai Sheet id, hoặc tài khoản anh không mở được Sheet đó |
| Telegram không báo gì | Kiểm `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` trong Script Properties của **dự án Master_Data**; hệ thống không báo lỗi khi thiếu |
| Khách landing không thấy trong KhachHang | Xem cột `Đã gộp` ở dòng đó: trống = chưa chạy; `KH-...` = đã gộp; `LOI` = SĐT sai |
| Khách nằm ở `ChuaPhanDuAn` | Cột R "Dự án" của dòng landing trống hoặc `khong-ro`, hoặc mã không có trong `CauHinh`: gõ `GanDuAn` |
| Số 0 đầu SĐT mất | Hệ thống tự sửa số 9 chữ số về `0...`; nếu vẫn sai, SĐT đó sẽ vào tab `Loi` |
| Dòng `LOI` không tự thử lại | Đúng thiết kế; sửa SĐT rồi xóa chữ `LOI` ở cột Đã gộp / DaGop |
| Muốn dừng tất cả | Apps Script → Trình kích hoạt (đồng hồ) → xóa hai trigger |

**Điều em chưa kiểm:** toàn bộ chạy thử trên Sheet giả trong test, **chưa chạy trên Google Sheets thật**. Chưa kiểm: nội dung thật của các thông báo lỗi Google (nên phân loại mã lỗi chỉ là cố gắng tốt nhất), màn cấp quyền cụ thể, khung giờ 8 đến 9 giờ của báo cáo, tốc độ khi có hàng nghìn khách. Có gì khác hướng dẫn này, anh chụp màn hình gửi em.
