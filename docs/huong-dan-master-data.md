# Master_Data: kho khách tập trung, cài và thử từng cổng

> **Trạng thái:** code đã dựng và test trên máy em (11/11/2026), gồm cả đồng ý theo từng dự án và rút lại giữ hồ sơ, **chưa cài lên Sheet thật nào**. Anh đi lần lượt G1 đến G6, mỗi cổng xong thì nhắn em "OK" hoặc "Dừng". Thiết kế: `superpowers/specs/2026-11-11-master-data-khach-hang-design.md`.

## Đây là gì
Khách nằm ở nhiều nơi: tab Landing của Google Sheet, CRM công ty, Masterfile từng dự án. Master_Data là **một Google Sheet riêng tư** gom hết về một chỗ, mỗi khách đúng một dòng (khóa là SĐT), rồi chép sang một Sheet nhỏ `Master_<mã dự án>` cho từng dự án.

Luồng, nói bằng lời:
1. Khách điền landing, vào tab Landing như hiện nay (Telegram vẫn báo như cũ).
2. Cứ 15 phút, Master_Data tự đọc các dòng Landing chưa gộp (cột **Đã gộp** trống), chuẩn hóa SĐT, gộp khách trùng.
3. Khách CRM thì anh gõ tay vào tab `NhapCRM`, hệ thống gộp chung.
4. Mỗi khách được chép (một chiều, không ghi ngược) sang tab `KhachTuMaster` của `Master_<mã>` đúng dự án họ quan tâm. Khách chưa có mã dự án thì nằm lại ở `KhachHang`, anh gõ mã vào ô `DuAnQuanTam` của khách đó là xong.
5. Đồng ý nhận tin được lưu **theo từng dự án**. Khách xin rút lại thì anh ghi vào tab `TuChoi`: loại `Rút lại` (mặc định) chỉ đổi trạng thái thành "Đã rút lại" và giữ hồ sơ, loại `Xóa` mới xóa dữ liệu. Khách rút lại mà điền lại form thì hệ thống tự mở nhắn lại cho đúng dự án họ vừa đồng ý.

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
   - `landingSheetId`: Sheet id của Sheet có tab **Landing** mà landing dự án đó ghi vào. **Anh đã chọn (11/11/2026) chạy G4 trên Sheet thật, nên điền id Sheet thật "Bcons - Khach quan tam Messenger"** (chỉ điền sau khi xong G2; trước G4 phải làm **Bước 0** bên dưới). G3 "Chạy thử" chỉ đọc, không ghi gì vào Sheet thật. Muốn an toàn hơn thì điền tạm id bản sao `Landing (thử)` (anh tạo ở G2 bước 1) cho tới khi qua G5. Central Park và Newsky dùng chung một Sheet landing, nên hai dòng điền cùng một id (hệ thống tự bỏ trùng, không đọc hai lần). Dự án nào landing không ghi vào Sheet nào thì để trống ô này.
   - Nhớ: bấm **Gộp ngay** sẽ ghi mã khách `KH-...` (hoặc `LOI`) vào cột S **Đã gộp** của Sheet landing nào đang có trong `CauHinh`. Muốn làm lại từ đầu thì xóa cột S của Sheet landing đó (khách khớp theo SĐT nên không bị nhân đôi).
   - `masterSheetId`: Sheet id của `Master_<mã> (thử)` dự án đó. Để trống thì dự án đó không được phân bổ (khách vẫn ở `KhachHang`, không mất).
   - Cách lấy Sheet id: mở Sheet đó, nhìn thanh địa chỉ `https://docs.google.com/spreadsheets/d/`**`1AbC...xyz`**`/edit`, chép đoạn in đậm.
   - Phải có ít nhất một `landingSheetId`, nếu không **cả "Chạy thử" lẫn "Gộp ngay" đều báo `LOI_TAB`** (nên ở G1, khi cột này còn trống, báo `LOI_TAB` là bình thường). Chỉ dùng "Chạy thử" cho tới khi qua G4, đừng bấm "Gộp ngay".
10. Các tab còn lại (`KhachHang`, `NhapCRM`, `Loi`, `TuChoi`, `NhatKy`) tự được tạo ở lần **ghi** đầu tiên (G4). Ở "Chạy thử" thì chúng chưa cần có.

11. Đặt múi giờ **của chính Google Sheet** `Master_Data (thử)` là GMT+7: **Tệp → Cài đặt → Múi giờ** chọn "(GMT+07:00) Bangkok, Hà Nội, Jakarta" (em chưa kiểm tên nút). Việc này khác với múi giờ của script ở bước 6: cột ngày trong Sheet hiển thị đúng giờ Việt Nam, và ngày anh gõ ở `NgayGhi` không bị lệch một ngày. Với tab `TuChoi`, **để trống `NgayGhi` là an toàn nhất** (hệ thống tự điền ngày).

**Cấp quyền lần đầu:** lần đầu bấm một mục trong menu Master_Data, Google hỏi quyền. Chọn tài khoản của anh. Có thể hiện màn **"Google chưa xác minh ứng dụng này" (Google hasn't verified this app)**: bình thường vì đây là script anh tự dán, không phải ứng dụng công khai. Bấm **Nâng cao (Advanced)** → **Đi tới ... (không an toàn) (Go to ... (unsafe))** → **Cho phép (Allow)**. Xong thì bấm lại mục menu vừa rồi (lần đầu có thể chỉ cấp quyền chứ chưa chạy). Cách hiện màn này giống Bước 2 của landing; riêng script Master_Data chưa kiểm trên Google thật.

**Em cần thấy ở G1:** anh báo "đã dán hai file + manifest + CauHinh xong" (không cần gửi id nào cho em nếu anh ngại; chỉ cần nói xong). **Anh nói "OK G1" hoặc "Dừng".**

## G2. Sửa script landing, thử trên bản sao trước
Bản `Code.gs` mới của landing thêm hai cột cuối: **Dự án** (cột R) và **Đã gộp** (cột S). Đừng chạm script thật vội.
1. Trong Drive, chuột phải Sheet **Bcons - Khach quan tam Messenger** → **Tạo bản sao (Make a copy)**, đặt tên `Landing (thử)`.
2. Mở bản sao → **Tiện ích mở rộng → Apps Script**. Bản sao có thể đã kèm một bản script cũ; xóa hết chữ trong file đó và dán nội dung mới của `engine/landing/apps-script/Code.gs` (GitHub → Raw → `Ctrl+A`, `Ctrl+C`). Lưu.
3. Cài Script Properties `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` như Bước 2 trong `huong-dan-landing.md` (bản sao không giữ thuộc tính; có thể bỏ qua bước này nếu anh không muốn tin thử bắn vào Telegram thật, khi đó chỉ ghi Sheet).
*(Các bước 3, 4, 5 dưới đây chỉ để thử gửi một khách thật qua đường landing; **không bắt buộc** để đi tiếp. Nếu bỏ qua, anh chỉ cần gõ tay `Dự án` vào R1 và `Đã gộp` vào S1 của bản sao `Landing (thử)` như ở bước 6, điền id bản sao đó vào cột `landingSheetId` của `CauHinh`, rồi sang G3.)*
4. **Triển khai (Deploy) → Bản triển khai mới (New deployment)** → ⚙️ **Ứng dụng web (Web app)**, Execute as **Me**, Who has access **Anyone**. Chép link `/exec` (chỉ để thử).
5. Gửi thử một khách: anh gửi em link `/exec` thử này (không phải khóa bí mật, nhưng **ai có link đều gửi được dòng vào Sheet thử**, nên xong G2 anh **xóa bản triển khai thử này**: Triển khai → Quản lý bản triển khai → lưu trữ/xóa). Em dựng một bản trang landing để thử (chế độ nháp, tên kỹ thuật `--nhap`, không phải trang khách thấy) trỏ vào link đó; anh mở trang, điền một khách thử (tên và SĐT giả) rồi bấm gửi. Kết quả mong đợi: tab **Landing** của bản sao có dòng mới với `Dự án` = mã dự án (vd `bcons-central-park`) ở cột R, cột S `Đã gộp` trống.
6. Nếu tab Landing của bản sao còn tiêu đề cũ 17 cột: script **tự sửa hàng tiêu đề ở lần khách kế tiếp** (thêm `Dự án`, `Đã gộp`). Anh muốn chắc ngay thì gõ tay `Dự án` vào ô R1 và `Đã gộp` vào ô S1.
7. **Anh nói "OK G2"** thì mới làm bước thật: trong Sheet thật, Apps Script → dán đè `Code.gs` mới → Lưu → **Triển khai → Quản lý bản triển khai (Manage deployments) → ✏️ → Phiên bản: Phiên bản mới (New version) → Triển khai**. **Không** tạo "Bản triển khai mới" (sẽ ra link khác, landing không gửi tới được); link `/exec` phải giữ nguyên. Sau đó gõ `Dự án` vào R1 và `Đã gộp` vào S1 của Sheet thật (nếu chưa có), vì G3 cần cột `Đã gộp` có sẵn.
8. Lưu ý: mã dự án trong landing đã được đẩy lên GitHub; trang landing chạy trên dịch vụ Cloudflare (nơi đặt trang web), và trang chỉ gửi kèm mã dự án sau lần "dựng lại trang" kế tiếp (build = đóng gói lại trang, như in lại tờ rơi bản mới); trước đó dòng khách mới vẫn có thể thiếu mã. Newsky đã gửi mã dự án từ trước.
9. Khách **đến trước lúc thay `Code.gs` ở bước 7** có cột `Dự án` trống, nên sau khi gộp họ nằm ở `KhachHang` với ô `DuAnQuanTam` trống và `DongYNhanTin` = `Chưa rõ` (chưa biết họ đồng ý cho dự án nào, nên chưa nhắn được). Anh gõ mã dự án (vd `bcons-central-park`) vào ô `DuAnQuanTam` của từng người đó để họ được chép sang `Master_<mã>` đúng dự án; muốn nhắn họ thì cần họ đồng ý lại qua form. (Có nên để em tự đoán dự án cho khách cũ hay không là quyết định của anh, em chưa làm.)

## G3. Chạy thử, không ghi gì
1. Mở `Master_Data (thử)` → menu **Master_Data → Chạy thử (không ghi)**. Chờ hộp thoại (vài giây đến một phút).
2. Đọc hộp thoại:
   - **Landing: đọc / mới / trùng / lỗi**: đọc = số dòng Landing chưa gộp; mới = khách chưa có trong KhachHang; trùng = khách cùng SĐT với người đã có (hoặc xuất hiện hai lần trong cùng lượt); lỗi = SĐT sai dạng.
   - **CRM: đọc / mới / trùng / lỗi**: như trên, với tab NhapCRM (chưa có tab thì đọc 0).
   - **Phân bổ: vào dự án / chưa có mã dự án / rút lại / đồng ý lại / xóa / Master lỗi**: vào dự án = số lượt khách được thêm mới hoặc cập nhật vào các `Master_<mã>` (một khách ở hai dự án tính hai lượt; khách đã có mà có thay đổi cũng tính); chưa có mã dự án = số khách ở `KhachHang` có SĐT mà ô `DuAnQuanTam` trống hoặc không có mã hợp lệ (họ chỉ nằm yên ở `KhachHang`, không bị mất); rút lại = số khách **mới** được đổi sang "Đã rút lại" (hồ sơ giữ nguyên); đồng ý lại = số khách đã rút lại mà vừa điền lại form nên được mở nhắn lại; xóa = số khách bị xóa dữ liệu vì dòng `TuChoi` loại `Xóa`.
   - **Dòng cuối của phần Phân bổ:** "Dòng TuChoi lỗi" = số dòng `TuChoi` sai mới phát hiện; "Giá trị trạng thái lạ" = số khách có ô `DongYNhanTin` gõ giá trị lạ (xem `LOI_DONG_Y`); "Mã dự án không có trong CauHinh" = số khách có mã đúng dạng nhưng không khớp dự án nào ở `CauHinh` (thường là gõ nhầm tên, ví dụ `bcons-centrl-park`): sửa lại ô `DuAnQuanTam` của họ.
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
| `LOI_TUCHOI` | Có một dòng sai trong tab `TuChoi`: SĐT gõ sai dạng, hoặc `NgayGhi` ở tương lai (quá một ngày sau hôm nay). Báo ngay từ dòng đầu tiên vì đây là yêu cầu của khách. **SĐT sai thì dòng đó không có tác dụng** (hệ thống không biết là ai). **Loại yêu cầu lạ và ngày ở tương lai vẫn được áp dụng theo hướng an toàn**: khách đó được tính là `Đã rút lại` | Mở tab `Loi` xem số dòng của `TuChoi`, sửa SĐT, ghi đúng `Rút lại` hoặc `Xóa`, sửa ngày (hoặc để trống `NgayGhi`) |
| `LOI_DONG_Y` | Có khách mà ô `DongYNhanTin` ở `KhachHang` anh gõ một giá trị hệ thống không nhận ra (ví dụ `Rút lại`, `Từ chối`, `No`, `Không rõ`). Khách đó **không được nhắn** (hiện `Chưa rõ` ở `Master_<mã>`), chữ của anh giữ nguyên, ghi một dòng ở `Loi` (mỗi dòng khách chỉ ghi một lần) | Muốn rút lại: gõ đúng `Không`. Muốn bỏ: xóa trống ô. Chỉ các giá trị `Có`, `Chưa rõ`, `Đã rút lại` (hệ thống tự ghi) và `Không` là hợp lệ |
| `LOI_HAN_MUC` | Chạm hạn mức của Google | Chờ rồi chạy lại |
| `LOI_HET_GIO` | Lần chạy quá lâu, dừng sạch giữa chừng | Chạy lại, lần sau làm tiếp phần còn lại |
| `LOI_MASTER` | Một `Master_<mã>` không mở được lúc phân bổ (sai `masterSheetId`, không có quyền), hoặc không xóa được dòng khi có yêu cầu `Xóa`. **Chỉ cần một dự án sai id là hệ thống dừng phân bổ cho TẤT CẢ dự án** (cách làm an toàn, tránh nhắn nhầm); việc rút lại vẫn được đánh dấu ở `KhachHang` và ở các Master mở được | Kiểm id và tiêu đề tab `KhachTuMaster` của dự án đó; lần sau hệ thống tự làm tiếp |
| `LOI_KHAC` | Lỗi chưa phân loại | Gửi em mã lỗi và việc anh vừa làm |

Các mã này em phân loại dựa vào chữ trong thông báo lỗi của Google, **chưa kiểm với dịch vụ Google thật**: có thể một lỗi rơi nhầm vào `LOI_KHAC` hoặc mã gần nghĩa. Hộp thoại và tin Telegram chỉ ghi mã, không ghi tên hay SĐT; khi gặp lỗi lạ, anh mở Apps Script → **Thực thi (Executions)** (danh sách các lần script đã chạy, có lần nào đỏ là lần lỗi; chưa kiểm tên nút trên giao diện thật), bấm vào lần chạy bị đỏ và **chụp màn hình gửi em**; nguyên nhân thật nằm ở đó (chuỗi giống SĐT đã được che). Nếu lịch tự chạy không khởi động được (ví dụ quyền hết hạn), Google còn gửi email báo lỗi vào tài khoản của anh.

**Anh nói "OK G3" hoặc "Dừng".**

## G4 và G5. Ghi thật lần đầu, rồi phân bổ
Menu chỉ có **Gộp ngay**, chạy cả ba bước (landing, NhapCRM, phân bổ) trong một lần, nên G4 và G5 nằm chung một cú bấm. **Lần này ghi lên Sheet landing THẬT** (anh đã chọn), nên làm đúng **Bước 0** trước khi bấm.

**Bước 0 (bắt buộc), tạo bản lưu:**
1. Trong Drive, chuột phải Sheet **Bcons - Khach quan tam Messenger** → **Tạo bản sao (Make a copy)**, đặt tên `Landing (lưu trước G4 - ngày hôm nay)`. Không chạm vào bản này nữa. Đó là bản để quay lại.
2. Nếu anh đã gõ khách vào tab `NhapCRM` của `Master_Data (thử)`, tạo bản sao của luôn Sheet đó (cùng cách) đặt tên `Master_Data (lưu trước G4)`.
3. Đọc phần dưới đây để biết hệ thống sẽ ghi gì, rồi mới bấm.

**Hệ thống sẽ ghi những gì khi bấm Gộp ngay:**
- Trong **Sheet landing thật**: chỉ ghi vào **cột S `Đã gộp`** của các dòng khách chưa có chữ ở cột đó (điền mã `KH-...` hoặc `LOI`). **Không sửa** tên, SĐT hay cột nào khác, và không xóa dòng nào.
- Trong **`Master_Data`**: tạo các tab còn thiếu (`KhachHang`, `NhapCRM`, `Loi`, `TuChoi`, `NhatKy`) và ghi khách vào đó.
- Trong **`Master_<mã>`**: tạo tab `KhachTuMaster` và thêm khách (cột A..L).
- Telegram: chỉ gửi tin khi có lỗi (không kèm tên/SĐT).

**Nếu sai thì quay lại:**
- Cột S của landing thật: mở bản lưu, copy cột S (hoặc để trống nếu bản lưu chưa có chữ), dán đè vào cột S của Sheet thật; hoặc xóa trống cột S (không xóa tiêu đề) rồi **Gộp ngay** lại, hệ thống đọc lại từ đầu và không nhân đôi khách (khớp theo SĐT).
- `Master_Data` và `Master_<mã>`: xóa nội dung các tab mới tạo (hoặc xóa hẳn Sheet thử rồi làm lại G1), vì chúng chỉ là bản gộp, nguồn gốc vẫn còn nguyên ở landing và CRM.

**Anh nói "OK G4" (và đã làm Bước 0) thì em mới hướng dẫn bấm.** Chưa có chữ "OK G4" thì anh không bấm Gộp ngay.
1. Menu **Master_Data → Gộp ngay**. Hộp thoại ghi "Đã gộp" kèm số đếm.
2. **G4, kiểm `Master_Data (thử)`:**
   - `KhachHang`: một dòng một khách, mã `KH-000001`, `KH-000002`..., SĐT dạng `0xxxxxxxxx`, `NguonGoc` = Landing (hoặc CRM / Landing+CRM), `DongYNhanTin` = `Có` với khách landing có ô đồng ý và có mã dự án, `Chưa rõ` với khách CRM và khách landing cũ chưa có mã dự án. Hai cột cuối `DongYDuAn` (các dự án khách đã đồng ý) và `NgayRutLai` (ngày khách rút lại, nếu có).
   - `Loi`: các dòng SĐT sai (thời gian, nguồn, số dòng, lý do). Sửa SĐT ở nguồn thì không tự thử lại; dòng đã bị đánh dấu `LOI` ở cột **Đã gộp** (Landing) hoặc **DaGop** (NhapCRM) **không được thử lại cho đến khi anh xóa chữ `LOI` đó** (xóa xong lần chạy sau đọc lại).
   - Tab Landing: cột `Đã gộp` điền mã `KH-...` (hoặc `LOI`). **Đừng sửa cột này bằng tay** trừ khi muốn đọc lại một dòng.
   - Khách chưa có mã dự án vẫn ở `KhachHang` với ô `DuAnQuanTam` trống; số này hiện ở hộp thoại ("chưa có mã dự án") và tin Telegram hằng ngày.
   - `NhatKy`: có một dòng cho lần chạy (xem G6).
   - So số khách với CRM và Landing, như yêu cầu của cổng G4. **Anh nói "OK G4".**
3. **G5, kiểm vài khách ở `Master_<mã> (thử)`**, tab `KhachTuMaster`:
   - Cột **A..L** là cột hệ thống: `MaKhach, SDT, HoTen, NgayCapNhat, NguonGoc, DuAnQuanTam, NhuCau, CanXem, PTTT, DongYNhanTin, TrangThaiCRM, TrangThaiChamSoc`. Cột **M** để trống. Từ cột **N** (tiêu đề "Ghi chú của anh") là cột **của anh**, hệ thống không bao giờ ghi vào; thêm cột bên phải N thoải mái.
   - Hai cột `TrangThaiCRM` (K) và `TrangThaiChamSoc` (L) hệ thống **chỉ điền khi ô còn trống**; anh gõ vào đó thì không bị ghi đè. Thay đổi trạng thái làm **sau này** ở `KhachHang` **không chảy** sang `Master_<mã>`: cột trạng thái của `KhachHang` chỉ là lần điền đầu. Vì vậy hãy **cập nhật trạng thái ở `Master_<mã>`** (nơi anh làm việc hằng ngày). *(Anh đã chốt 11/11/2026: trạng thái cập nhật ở riêng từng dự án.)* Các cột A..J được cập nhật theo `KhachHang` mỗi lần chạy.
   - Khách quan tâm hai dự án có mặt ở cả hai Sheet, cùng `MaKhach`.
   - Cột `DongYNhanTin` (J) ở mỗi `Master_<mã>` nói về **đúng dự án đó**: `Có` = được nhắn về dự án này; `Chưa rõ` = chưa có đồng ý hợp lệ cho dự án này (ví dụ khách chỉ đồng ý Newsky thì ở `Master_<Central Park>` hiện `Chưa rõ`); `Đã rút lại` = khách đã rút lại, không nhắn. **Chỉ nhắn những dòng hiện `Có`.** Khách anh gõ tay ở `NhapCRM` không có bằng chứng đồng ý nên luôn là `Chưa rõ`. Cột này là cột hệ thống, hệ thống cập nhật mỗi lần chạy, anh đừng sửa tay.
   - Kiểm: khách đúng dự án chưa, ai thiếu, ai thừa.
   - **Lưu ý:** sau G2, mọi dòng landing cũ đều chưa có mã dự án nên đọc là `Chưa rõ`; anh sẽ **không thấy `Có` ở dữ liệu cũ**, đó là đúng. `Có` chỉ xuất hiện ở khách điền form sau G2.
   - **Thử nghiệm nghiệm thu (bắt buộc trước khi tin hệ thống):** (1) mỗi dự án điền một khách thử qua landing, dùng **số điện thoại của chính anh** và tick đồng ý; (2) bấm **Gộp ngay**; (3) kiểm: dòng khách thử hiện `Có` **chỉ** ở `Master_<mã>` của đúng dự án đó, dự án kia `Chưa rõ` hoặc không có dòng; (4) thử rút lại: thêm SĐT của anh vào `TuChoi` (loại để trống = Rút lại), Gộp ngay, kiểm `KhachHang` và các `Master_<mã>` đều `Đã rút lại` và hồ sơ còn nguyên; (5) thử xóa: đổi `LoaiYeuCau` thành `Xóa` ở một khách thử khác (SĐT thứ hai của anh nếu có, hoặc điền lại một khách thử mới), Gộp ngay, kiểm dòng ở `Master_<mã>` đã mất và SĐT, họ tên ở `KhachHang` đã trống; (6) xóa các dòng thử còn lại ở Landing và `NhapCRM` theo danh sách "Anh vẫn phải tự xóa tay". **Anh nói "OK G5".** Từ đó, Sheet thử dùng luôn làm bản thật: đổi tên bỏ chữ "(thử)" (id không đổi nên `CauHinh` vẫn đúng). Muốn trỏ sang Sheet khác thì sửa `masterSheetId` rồi bấm **Gộp ngay**. Vì G4 đã chạy trên Sheet landing thật, không còn bước "chuyển sang dữ liệu thật" riêng. Sheet landing thật phải có cột S `Đã gộp` (xem G2 bước 7).

## G6. Bật lịch tự chạy
1. Menu **Master_Data → Cài lịch tự động**. Có thể hiện hộp xin quyền (Google gọi là tạo trigger); cho phép như G1. Hộp thoại báo: "Đã cài lịch: gộp mỗi 15 phút, tin tóm tắt khoảng 8-9 giờ mỗi ngày."
2. Hai lịch được tạo: `chayTatCaTuDong` mỗi 15 phút (gộp + phân bổ) và `baoCaoNgayTuDong` mỗi ngày trong khung 8 đến 9 giờ sáng (Apps Script tự chọn phút, nên không đúng 8:00). Bấm menu này nhiều lần không nhân đôi lịch. Nếu tab `CauHinh` chưa có dòng hợp lệ nào thì menu báo "Chưa có CauHinh hợp lệ" và **không cài lịch** (làm xong G1 bước 9 rồi bấm lại).
3. Xem hoặc tắt lịch: Apps Script → biểu tượng đồng hồ **Trình kích hoạt (Triggers)** ở thanh bên trái → thấy hai dòng → bấm dấu ba chấm ⋮ cuối dòng → **Xóa trình kích hoạt (Delete trigger)**. Xóa cả hai là dừng hẳn tự chạy; menu **Gộp ngay** vẫn dùng được.
4. **Tin Telegram hằng ngày** (chỉ số, không tên, không SĐT): số khách mới hôm qua theo nguồn, "Chưa có mã dự án: N" (khách ở `KhachHang` chưa có mã dự án hợp lệ), "Mã dự án không có trong CauHinh: N" (mã gõ nhầm tên), "Dòng lỗi: N" (số dòng ở `Loi`), "Rút lại hôm qua: N" (khách có ngày rút lại rơi vào hôm qua), "Điền lại hôm qua: N" (khách rút lại mà điền lại form hôm qua, đếm theo cột `DaDongYLai` của `TuChoi`), và "**Lần chạy cuối: N phút trước**" = lần chạy gần nhất, **mọi lần chạy đều tính** (kể cả lần rảnh không ghi NhatKy và lần bấm Gộp ngay); Chạy thử và lần bị bỏ qua vì khóa bận không tính. Nếu số này lớn hơn khoảng 30 phút thì lịch đang không chạy: vào Trình kích hoạt xem. Muốn thử tin này ngay: Apps Script → chọn hàm `baoCaoNgayTuDong` ở thanh trên → ▶ Chạy.
5. **Tab `NhatKy`:** cột `Thời gian | Nguồn | Số dòng đọc | Khách mới | Gộp trùng | Lỗi | Ghi chú`. Mỗi lần chạy có việc (có khách mới, trùng, lỗi, rút lại, điền lại, xóa...) thì ghi **một dòng**. Lần chạy "rảnh" (không có gì mới, không lỗi) **không ghi**, trừ một dòng "nhịp: đang chạy, không có gì mới" mỗi ngày để anh biết hệ thống còn sống. Cột Ghi chú có `rutlai=` (khách mới được đổi sang Đã rút lại), `dongylai=` (khách điền lại form, được mở nhắn lại), `xoa=` (khách bị xóa dữ liệu), `tuchoi=` / `khong=` (trong số bị xóa: vì dòng `TuChoi` / vì lần xóa dở còn lại), `vao=` (chép sang dự án), `ms=` (mất bao nhiêu mili giây), và mã lỗi nếu có. Chỉ có "chưa có mã dự án" thì lần chạy vẫn tính là rảnh (không ghi dòng mới). Có lỗi thì Telegram báo một tin `⚠️ Master_Data: <mã lỗi> (<n> dòng). Xem tab NhatKy.`; cùng loại lỗi chỉ báo lại sau 6 giờ. Lỗi từng dòng khách (SĐT sai) chỉ báo Telegram khi **từ 5 dòng trở lên** trong một lần chạy (mã `LOI_DONG`); ít hơn thì anh xem tab `Loi`.

---

## Dùng hằng ngày

### Nhập khách CRM
Mở tab **NhapCRM** (có sau lần ghi đầu). Cột tối thiểu, đúng tiêu đề này: `HoTen | SDT | DuAnQuanTam | TrangThaiCRM | DaGop`. **Để trống cột `DaGop`**; hệ thống tự điền.
- `DuAnQuanTam` phải là **mã dự án** như `bcons-central-park` (nhiều dự án thì ngăn bằng dấu `;`). Gõ chữ thường như "Central Park" thì không được nhận là mã, khách đó ở lại `KhachHang` như khách chưa có mã dự án.
- SĐT gõ kiểu nào cũng được (`098.123.4567`, `+84 98 123 4567`). Cột đã đặt dạng chữ để giữ số 0 đầu.
- Sau khi gộp, `DaGop` hiện **mã khách** `KH-...` (đã vào) hoặc **`LOI`** (SĐT sai, đã ghi ở tab `Loi`, không thử lại cho đến khi anh xóa chữ `LOI` sau khi sửa SĐT).
- Dòng đã `DaGop` thì sửa tiếp ở NhapCRM **không** có tác dụng. Muốn đổi trạng thái khách đã có, sửa ở tab `KhachTuMaster` của `Master_<mã>` (nơi anh làm việc hằng ngày); trạng thái ở `KhachHang` chỉ được dùng cho lần điền đầu và không chảy sang `Master_<mã>` về sau. *(Anh chưa chốt nơi sửa trạng thái.)* Đừng gõ khách trực tiếp vào `KhachHang`: dòng không có mã `KH-...` bị bỏ qua; khách mới gõ ở `NhapCRM`.
- Khách CRM có `DongYNhanTin` = **Chưa rõ**.

### Khách chưa có mã dự án
Không còn tab riêng cho nhóm này. Khách chưa có mã dự án (ví dụ khách landing cũ, trước G2, cột `Dự án` trống) **nằm lại trong `KhachHang`** với ô `DuAnQuanTam` trống, `DongYNhanTin` = `Chưa rõ`. Họ chưa được chép sang `Master_<mã>` nào. Muốn đưa họ vào một dự án: mở `KhachHang`, **gõ mã dự án** (ví dụ `bcons-central-park`; nhiều dự án thì ngăn bằng `;`) vào ô `DuAnQuanTam` của khách đó. Lần chạy sau (tối đa 15 phút, hoặc bấm Gộp ngay) khách được chép sang `Master_<mã>` đó, với trạng thái đồng ý `Chưa rõ` vì chưa có tick đồng ý cho dự án; mã phải có trong tab `CauHinh` (có `masterSheetId`), nếu không khách vẫn ở yên. Số khách chưa có mã hiện ở hộp thoại và tin hằng ngày.

### Khách xin rút lại
*(Anh chốt 11/11/2026, pháp chế đã xác nhận cùng ngày: rút lại đồng ý thì chỉ đổi trạng thái và **vẫn giữ hồ sơ**; điền lại form thì được nhắn lại; xóa dữ liệu là việc riêng.)* Có hai loại yêu cầu, ghi ở tab **TuChoi**, cột: `SDT | LyDo | NgayGhi | LoaiYeuCau | DaDongYLai`. Tab tự được tạo đủ 5 cột; nếu anh lỡ tạo bản cũ 3 cột (`SDT | LyDo | NgayGhi`) thì hệ thống tự thêm hai tiêu đề còn thiếu, dữ liệu cũ giữ nguyên.

**1. Rút lại (mặc định)** - khách không muốn nhận tin nữa.
- Hệ thống đổi khách sang **Đã rút lại**: ở `KhachHang` (kèm ngày ở cột `NgayRutLai`) và ở ô `DongYNhanTin` của mọi dòng khách đó trong các `Master_<mã>`. Hồ sơ **giữ nguyên**, không xóa gì, và rút lại áp dụng cho cả khách (mọi dự án), nên khách này không nhận tin dự án nào.
- Cách ghi: gõ SĐT vào cột `SDT` của `TuChoi` (cột A). Các cột khác tùy chọn:
  - `LoaiYeuCau` để trống hoặc ghi `Rút lại` đều là loại Rút lại. Ghi chữ lạ (ví dụ "xóa hết") cũng được coi là Rút lại cho an toàn, kèm một dòng ở tab `Loi` nhắc ghi đúng `Rút lại` hoặc `Xóa`.
  - `NgayGhi`: **để trống là an toàn nhất**, hệ thống tự điền ngày ở lần chạy kế tiếp. Muốn tự gõ ngày cũng được; ngày không kèm giờ được tính đến **hết ngày đó** (giờ Việt Nam), nên khách điền lại form trong cùng ngày vẫn chưa được mở nhắn lại. Ngày ở tương lai (quá một ngày sau hôm nay) bị coi là gõ sai: ghi ở `Loi`, báo `LOI_TUCHOI`.
  - `DaDongYLai`: hệ thống điền, anh không gõ.
- Cách thứ hai: gõ đúng chữ `Không` vào ô `DongYNhanTin` của khách ở `KhachHang`. Hệ thống tự đổi chữ đó thành `Đã rút lại` và ghi ngày rút lại. Cách này **không** tạo dòng trong `TuChoi`. **Muốn rút lại thì gõ đúng chữ `Không`** (hoa thường, có hay không dấu đều được). Mọi giá trị khác ngoài `Có`, `Chưa rõ`, `Đã rút lại` và `Không` (ví dụ `Rút lại`, `Từ chối`, `No`, `Không rõ`, `Không nhận tin`) đều **bị chặn và ghi lại**: hệ thống không rút lại ai, nhưng cũng **không cho nhắn** khách đó (hiện `Chưa rõ` ở `Master_<mã>`), giữ nguyên chữ anh gõ, ghi một dòng ở tab `Loi` ("gõ đúng Không để rút lại, hoặc xóa ô") **một lần cho mỗi dòng khách** và báo Telegram `LOI_DONG_Y`. Sửa lại ô cho đúng là xong.
- Không nhắn khách nào hiện `Đã rút lại` ở cột `DongYNhanTin`.

Cách đổi lời khách ra loại yêu cầu (*anh chốt lại với pháp chế*): khách nhắn **NGỪNG** (từ khóa của Central Park) hoặc "dừng nhắn" = `Rút lại` (giữ hồ sơ); khách nói "xóa dữ liệu" = `Xóa`. Em chỉ gợi ý, chưa tự quyết.

**Điền lại form (mở nhắn lại).** Khách đã rút lại mà sau đó điền landing lần nữa, có tick đồng ý **mới hơn** ngày rút lại: hệ thống đổi khách về `Có` cho **đúng dự án của lần điền đó** và khách được nhắn lại về dự án ấy; các dự án khác khách từng đồng ý trước kia **không** tự mở lại (muốn nhắn dự án khác thì khách phải đồng ý cho dự án đó). Dòng `TuChoi` vẫn nằm đó, cột `DaDongYLai` được điền ngày đồng ý mới (không xóa dòng). Đồng ý cũ hơn ngày rút lại (ví dụ hệ thống đọc lại dòng landing cũ) **không** mở lại gì.

**2. Xóa** - khách yêu cầu xóa dữ liệu (khác với chỉ ngừng nhận tin). Ghi `Xóa` ở cột `LoaiYeuCau`. Lần chạy sau (tối đa 15 phút, hoặc bấm Gộp ngay), hệ thống làm các việc dưới đây. Danh sách này **chỉ áp dụng cho loại Xóa**; với loại Rút lại không có gì bị xóa.

**Hệ thống tự xóa:**
- Ở `KhachHang`: SĐT, họ tên, nhu cầu, căn xem, bằng chứng đồng ý, dự án đã đồng ý, nguồn chi tiết, PTTT, người chăm sóc; `GhiChu` thành "Rút lại", `DongYNhanTin` = `Đã rút lại`. Mã khách `KH-...` giữ lại.
- Mọi dòng của khách trong tab `KhachTuMaster` của **mọi** `Master_<mã>` (kể cả ghi chú anh gõ ở cột N trở đi của dòng đó).

**Anh vẫn phải tự xóa tay** (các bản sao này nằm ngoài hệ thống, em không với tới):
- Các bản lưu ở Bước 0 của G4 (`Landing (lưu trước G4 - ...)`, `Master_Data (lưu trước G4)`) và mọi bản sao `(thử)`: chúng chứa **đầy đủ** dữ liệu lúc sao chép, hệ thống không đụng tới.
- Lịch sử phiên bản của Google Sheet và thùng rác Drive vẫn giữ dữ liệu đã xóa. Muốn xóa hẳn: mở Sheet → **Tệp → Lịch sử phiên bản → Xem lịch sử phiên bản**, xóa hoặc bỏ các phiên bản cũ; rồi dọn thùng rác Drive (em chưa kiểm tên nút trên giao diện thật).
- Cột `LyDo` trong `TuChoi` là chữ tự do, có thể có tên khách: xóa tên nếu có (chỉ nên để SĐT).
- Dòng của khách ở tab **Landing** (có tên + SĐT, và mã `KH-...` ở cột Đã gộp).
- Dòng của khách ở tab **NhapCRM**.
- Các tin Telegram của khách đó (tin báo khách mới và tin mẫu Zalo).
- Dòng đã chép dán vào file Masterfile `.xlsx`.
- Bản ghi trong CRM của công ty.

Sau khi xóa, ở `KhachHang` vẫn còn mã khách, `NgayTao`, `DuAnQuanTam`, `TrangThaiCRM` và các cột anh tự thêm; chỉ SĐT (không tên) còn lại ở `TuChoi`. Nếu cần xóa luôn các ô đó thì anh tự xóa tay. Vì các bản sao tay ở trên có thể còn SĐT, hãy xóa hết khi nhận yêu cầu. Khách loại Xóa mà điền landing lại với tick đồng ý mới thì tạo hồ sơ mới, có đồng ý mới; từ đó nhắn được như khách mới. Nếu dòng `TuChoi` loại Xóa nằm lại, nó không xóa hồ sơ mới đó (đồng ý mới hơn ngày ghi).

Khi dòng `TuChoi` có SĐT gõ sai dạng (thiếu số, có chữ) thì không áp dụng cho ai: hệ thống ghi một dòng vào tab `Loi` (nguồn "Rút lại", chỉ có số dòng của `TuChoi`, không ghi SĐT), báo Telegram `LOI_TUCHOI` và `NhatKy`; anh sửa lại SĐT cho đúng. Mỗi dòng sai chỉ ghi `Loi` một lần.

Hạn chế đã biết: nếu cùng lúc một hồ sơ bị `Xóa` và anh đang gõ `Không` ở chính hồ sơ đó, hồ sơ mới điền lại sau đó chỉ biết ngày của dòng `Xóa`, không biết ngày gõ `Không`.

### Cột DongYNhanTin ở Master_<mã>
Mỗi dòng khách ở `Master_<mã>` có cột `DongYNhanTin` (cột J) tính **riêng cho dự án đó**:
- **Có** = được nhắn về dự án này (khách đã tick đồng ý cho đúng dự án này và chưa rút lại).
- **Chưa rõ** = chưa có đồng ý hợp lệ cho dự án này (ví dụ chỉ đồng ý dự án khác, hoặc khách do anh gõ ở `NhapCRM`, hoặc khách landing cũ chưa có mã).
- **Đã rút lại** = khách đã rút lại, không nhắn.

Chỉ nhắn các dòng hiện **Có**.

**Với loại Rút lại, không có gì bị xóa**: chữ `Có` cũ vẫn còn nằm ở những chỗ hệ thống không với tới (danh sách anh đã dán ra ngoài, file Masterfile `.xlsx`, danh sách Zalo OA, CRM công ty). Vì vậy quy tắc: **trước mỗi đợt nhắn, bấm Gộp ngay, rồi chỉ dùng các dòng `Master_<mã>` đang hiện `Có`.**

### Quy tắc
1. Chỉ nhắn hàng loạt khách có `DongYNhanTin` = **Có** ở `Master_<mã>` của dự án đang nhắn. Khách CRM (`Chưa rõ`) chỉ gọi hoặc nhắn tư vấn từng người.
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
| Khách không thấy ở `Master_<mã>` | Xem `KhachHang`: ô `DuAnQuanTam` trống hoặc không phải mã (cột R "Dự án" của dòng landing trống, `khong-ro`, hoặc mã không có trong `CauHinh`): gõ mã dự án vào ô `DuAnQuanTam` |
| Số 0 đầu SĐT mất | Hệ thống tự sửa số 9 chữ số về `0...`; nếu vẫn sai, SĐT đó sẽ vào tab `Loi` |
| Dòng `LOI` không tự thử lại | Đúng thiết kế; sửa SĐT rồi xóa chữ `LOI` ở cột Đã gộp / DaGop |
| Muốn dừng tất cả | Apps Script → Trình kích hoạt (đồng hồ) → xóa hai trigger |

**Điều em chưa kiểm:** toàn bộ chạy thử trên Sheet giả trong test, **chưa chạy trên Google Sheets thật**. Chưa kiểm: nội dung thật của các thông báo lỗi Google (nên phân loại mã lỗi chỉ là cố gắng tốt nhất), màn cấp quyền cụ thể, khung giờ 8 đến 9 giờ của báo cáo, tốc độ khi có hàng nghìn khách. Có gì khác hướng dẫn này, anh chụp màn hình gửi em.
