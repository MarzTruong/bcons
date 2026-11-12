# CLAUDE.md — Bcons (hướng dẫn cho Claude)

## Vai trò và cách giao tiếp
- Người dùng: anh, nhân viên kinh doanh sàn Bcons PS Land (phân phối chính thức của CĐT Bcons), không phải lập trình viên, là người quyết định của dự án. Từ 12/11/2026 đang bán **Bcons Newsky** (mặt tiền Quốc lộ 13, phường Lái Thiêu, Bình Dương cũ; `config.json`); Bcons Central Park tạm dừng làm mới (236 Phan Trung, Tam Hiệp, TP. Đồng Nai / Biên Hòa), vẫn chạy được bằng `--du-an bcons-central-park`.
- Mục tiêu repo: làm video và bài đăng Facebook/TikTok, phễu khách (landing, CRM, báo Telegram). Thiết kế: `docs/superpowers/specs/2026-11-05-bcons-automation-pipeline-design.md`.
- Tiếng Việt, anh xưng "anh", Claude xưng "em". Ngắn gọn, nói thẳng, có số liệu.
- Dùng thuật ngữ kỹ thuật thì giải thích 1 dòng kèm ví dụ đời thường (vd. "commit = lưu một mốc thay đổi, như bấm Lưu có ghi chú").
- Việc lớn đi theo thứ tự: Brainstorm → Thiết kế (spec) → Kế hoạch → Test trước (TDD) → Code → Review. Việc nhỏ làm thẳng.
- **Cổng duyệt:** trước khi sửa nhiều file cùng lúc hoặc chạy lệnh quan trọng (tốn tiền: tạo giọng ElevenLabs; đăng bài; xóa dữ liệu; push lên `main`), trình kế hoạch ngắn và chờ anh nói "OK"/"Làm đi".
- Model cho agent phụ: `opus` để lập kế hoạch kiến trúc, tái cấu trúc lớn; `sonnet` để viết code, kịch bản, kiểm tài liệu nguồn; `haiku` để dò tìm file.

## Máy đang chạy (tự nhận diện)
- **Cloud** (biến môi trường `CLAUDE_CODE_REMOTE=true`, anh dùng từ laptop/điện thoại): nghiên cứu, viết `kich-ban.md`, `storyboard.md`, `caption.md`, `spec.json`, lập trình `engine/`, viết test, `npm test`, `npm run lint`, commit/push. Cloud có `REMOTION_MAPBOX_TOKEN` trong biến môi trường nên chụp được storyboard bản đồ: `REMOTION_GL=swangle REMOTION_BROWSER=/opt/pw-browsers/chromium npm run storyboard -- <tên>` (cloud không có card đồ họa, swangle dựng bằng phần mềm). Cloud chạy được Gemini (key lưu trong Network secrets của môi trường, proxy tự gắn): `NODE_USE_ENV_PROXY=1 GEMINI_API_KEY=dummy npm run gemini -- <chủ đề>`; mở link báo bằng `curl` (WebFetch không qua proxy). **Bị chặn kết nối** (trang/host bị proxy từ chối, ENOTFOUND, 403 CONNECT): dừng ngay, báo anh tên host cần mở trong Environment, không tự tìm đường vòng (anh dặn 07/11/2026, tránh tốn token). **Không** chạy `npm run voice` hay `npm run render:drive` (tốn credit/không có Drive): việc đó qua bot trên máy anh.
- **Máy của anh** (laptop/máy bàn, có `engine/remotion/.env`): `git pull`, cổng chặn, `npm run voice` (sau khi anh đồng ý tốn credit), `npm run render:drive`.
- **Antigravity (AGY):** chạy trên PC trong bản sao riêng `E:\Claude\bcons-agy` (`git pull` đầu việc, chỉ đọc repo, không commit/push); trả kết quả ở Drive `Bcons/agy/den-claude/`. Anh tự tạo skill và giao việc cho AGY (thế mạnh: UI/UX, cào tin, kiểm toán); em là lõi hệ thống (engine, bot, Git, số liệu, công thức, quy tắc cứng), chỉ kiểm nội dung và code khi anh gọi `/agy-doc`. **Phân vai giao diện (anh chốt 12/11/2026):** mọi thứ nhìn thấy và chạm vào (bố cục, màu, chữ, ảnh, hiệu ứng, trang, template phiếu, ảnh minh họa) là việc của AGY; em không thiết kế UI/UX và không tạo ảnh/hình minh họa. Em được review UX và đề xuất bằng chữ; việc cần dựng thì giao AGY, có bản demo cho anh duyệt trước khi em tích hợp. Em chỉ viết phần lõi (dữ liệu, tính toán, hợp đồng dữ liệu cho giao diện, test) và lắp bản AGY đã được anh duyệt, không tự chỉnh bố cục/màu/chữ của nó (lỗi hiển thị thì ghi lại gửi AGY; riêng lỗi sai số liệu hoặc quy tắc cứng thì em sửa ngay). Chi tiết `agy/README.md`, `docs/phan-vai-claude-antigravity.md`.
- **Lệnh tắt trong Claude Code:** `/kiem` (test + lint, báo 2 dòng), `/luu [ghi chú]` (kiểm file nhạy cảm, test, commit + push `main`). GitHub tự chạy test mỗi lần push (`.github/workflows/kiem-tra.yml`): dấu ❌ đỏ trên GitHub/GitHub Desktop là có lỗi.
- **Anh không gõ lệnh:** trên laptop có bot Telegram (`Bcons-Bot.cmd`, `docs/huong-dan-bot-telegram.md`): 6 mục chính `/duan` (đổi dự án đang làm, bot nhớ; không khóa cứng một dự án), `/video` (thẻ tiến trình từng video, nút bước kế tiếp), `/khach`, `/nghiencuu`, `/may`, `/huy`; lệnh gõ nhanh cũ vẫn chạy (`/capnhat`, `/storyboard`, `/giong`, `/render`, `/duyet`, `/xem`, `/danhsach`, `/gemini`, `/sfx`, `/kiemgia`, `/chuyenmay`; mở bot cả hai máy thì máy sau chờ). Bot chạy theo dự án anh chọn bằng `/duan`, `config.json` chỉ là mặc định cho cloud và lần mở đầu. Khi cần anh làm gì trên máy, hướng dẫn bằng lệnh bot, không đưa lệnh PowerShell (trừ khi bot chưa chạy được).

## Cấu trúc thư mục
- `engine/`: code dùng chung (`engine/remotion/` dựng video, `engine/automation/` script tiện ích). Không chứa số liệu dự án.
- `du-an/<mã>/`: mọi thứ của một dự án: `project.json`, `thong-tin.md`, `video/<tên>/` (spec.json, kich-ban.md, storyboard.md, caption.md, audio/), `assets/` (images, geo), `nguon/`, `content/`, `landing/`, `bao-cao/`. Dự án mới: skill `bcons-project-init` (chép `du-an/_mau/`).
- `config.json`: dự án đang bán (`duAnDangBan`). Lệnh nhận thêm `--du-an <mã>` để chạy cho dự án khác.
- Không lên git, cũng chia theo dự án: `data/<mã>/` (bảng giá), `anh/<mã>/` (ảnh gốc).
- Dùng chung giữa các máy qua Drive "Bcons" (code tự dò ổ, `findDriveRoot`/`sharedDir`): `video/` (render), `am-thanh/nhac/` (nhạc nền), `am-thanh/sfx/` (hiệu ứng ElevenLabs), `data/<mã>/gia/` (Master File, bảng giá), `data/<mã>/tai-lieu-cdt/` (tài liệu CĐT: mặt bằng, phối cảnh, PTTT, pháp lý, Q&A), `bot/` (máy nào đang chạy bot), `_luu-tru/` (đồ cũ). Sơ đồ: file `DOC-TRUOC.md` ở gốc thư mục Drive. Thêm dữ liệu dùng chung thì để trên Drive, không để riêng một máy.
- Quy tắc chi tiết: `.claude/rules/pipeline-constraints.md` (code video), `.claude/rules/preflight-and-sources.md` (cổng chặn, nguồn số liệu).

## Nguồn dữ liệu (đọc trước khi viết nội dung)
- `du-an/<mã>/nguon/pttt-cdt.json`: lịch thanh toán 5 PTTT chép từ thông báo CĐT, là "đáp án" cho test công cụ tính (`engine/landing/pttt-cdt.test.mjs`) và `/kiemgia`.
- `du-an/<mã>/project.json` và `du-an/<mã>/thong-tin.md`: thông tin dự án, 5 PTTT, lịch mở bán, tóm tắt bảng giá (đã đối chiếu tài liệu CĐT).
- `data/bcons-central-park/bang-gia.csv`: giá và tình trạng từng căn (996 căn), chỉ có trên máy anh.
- Sheet "Bcons - Lịch nội dung" (id trong `project.json` → `lichNoiDungSheetId`): mỗi bài một dòng, trạng thái Nháp → Chờ duyệt → Đã duyệt → Đã lên lịch → Đã đăng. Quy trình đăng: `docs/huong-dan-dang-bai.md`.
- Google Drive dự án (thư mục gốc id `1YUrtxPpYrDYCLGKKKXEFfmkreyROMniZ`): training, Q&A, PTTT, TVC, phối cảnh, mặt bằng. Đọc bằng connector Google Drive.
- Master File (`MasterFile_BconsCentralPark_ver2.xlsx`) anh gửi qua upload: sheet GiaTongHop (giá), KhachHang (khách), HoaHong (nội bộ).

## Quy tắc cứng (pháp lý, dữ liệu; không nới)
1. **Không commit dữ liệu cá nhân hoặc nội bộ**: tên/SĐT khách, hoa hồng, thưởng nóng, file xlsx, API key. Có `.gitignore`, `.claude/settings.json` và hook `.githooks/pre-commit` chặn; vẫn tự kiểm `git status` trước khi commit.
2. **Số liệu dự án lấy từ tài liệu chủ đầu tư**, không tự suy ra. Thiếu thì ghi "chưa có" và hỏi lại.
3. **Không cam kết lợi nhuận, không hứa tăng giá.**
4. **Căn đã cọc = đã bán**, không tư vấn. Căn "CĐT LOCK" chưa mở bán, không quảng cáo.
5. Không bán cho người nước ngoài. Nhắc giá thì nói rõ **chưa VAT/có VAT** và phí bảo trì 2%. PTTT 01 đã trừ 8,5%, PTTT 04/05 trừ 2,45% so với giá PTTT 02. Lãi suất trần 6,9% chỉ có ở PTTT 03 và 04, **không** có ở PTTT 05.
6. Thu thông tin khách phải có ô đồng ý nhận tin (không tick sẵn). Nội dung chỉ vào lịch đăng tự động sau khi anh duyệt.
7. Liên hệ cá nhân (anh đổi quy tắc 06/11/2026): video hiện **mã QR** (mở landing) ở góc suốt video, **tên + QR** ở cảnh cuối (anh đổi 07/11/2026: góc chỉ QR), cấu hình ở `project.json` → `watermark`; landing có nút **Gọi/Zalo** (`project.json` → `lienHe`). Caption được ghi SĐT của anh (chỉ số trong `lienHe`; số khác vẫn bị chặn). Lời đọc không đọc SĐT; chữ trên video không ghi SĐT dạng chữ (đã có QR).

### Quy tắc nào được hiện cho khách xem (anh dặn 08/11/2026, áp dụng khi code landing, video, caption)
Bảy quy tắc trên là **nguyên tắc làm việc của em**, không phải câu chữ để in lên sản phẩm. Khách chỉ thấy kết quả của quy tắc, không thấy lời nhắc. Câu kiểu "không cam kết lợi nhuận", "không bán cho người nước ngoài", "giá theo bảng giá chủ đầu tư ngày..." đọc ra là máy viết, **không đưa lên trang/video**. Riêng dòng "Thông tin mang tính tham khảo": tùy ngữ cảnh, **hỏi anh trước khi thêm** (video: `ghiChu` của cảnh `project-close`; video 1–7 đã có, giữ nguyên; anh dặn 09/11/2026).
- **Nội bộ, không bao giờ hiện:** (1) dữ liệu cá nhân/nội bộ; (2) nguồn và ngày của số liệu (nguồn ghi ở `nguon/`, bảng nguồn trong `kich-ban.md`, không in "theo bảng giá CĐT ngày..." lên landing); (3) không cam kết lợi nhuận/tăng giá (chỉ là việc **không viết** câu đó, không viết thêm câu phủ nhận); (4) lọc căn đã cọc/CĐT LOCK (chỉ là việc **chọn căn nào** để đưa lên); (5) không bán cho người nước ngoài (nội bộ, không ghi lên trang); phần "đã trừ bao nhiêu %" là dữ liệu PTTT, không phải lời nhắc.
- **Hiện, mỗi thứ một chỗ cố định, không lặp:**
  - Giá: đúng **một dòng** ngay dưới bảng giá, "chưa VAT" hay "có VAT" và phí bảo trì 2%. Công cụ tính ghi rõ dòng "có VAT" ở kết quả.
  - Chiết khấu PTTT 01 (8,5%), PTTT 04/05 (2,45%), trần lãi 6,9%: chỉ hiện trong công cụ tính, **khi khách chọn đúng PTTT đó** (trần 6,9% chỉ PTTT 03 và 04, không có ở PTTT 05).
  - "Hình ảnh minh họa": nhãn nhỏ gắn trên chính tấm phối cảnh, không ghi chung ở chân trang. Ảnh chụp nhà mẫu thật chỉ ghi tên căn.
  - Ô đồng ý nhận tin: sát nút gửi của form, không tick sẵn (kèm bên giữ dữ liệu và cách rút lại, ngắn).
  - Gọi/Zalo (quy tắc 7): theo `lienHe`.
- Tự soát trước khi đưa anh xem: mỗi câu chữ có làm khách hiểu hoặc làm được gì không? Câu chỉ để "tự bảo vệ" hoặc "giới thiệu hay" thì bỏ. Ảnh mẫu thiết kế chỉ ghi chữ thật sẽ có trên trang. Test của `engine/landing` phải khớp: không kiểm sự có mặt của các câu nội bộ nói trên (hiện `page.test.mjs` và `page.mjs` còn kiểm/in chúng, sửa khi dựng lại landing).

## Gợi ý sáng tạo (linh hoạt, ưu tiên nội dung hay)
- Hook, cách dẫn chuyện, cảm xúc, giọng quảng bá, so sánh hình ảnh: tự do sáng tạo, thử nhiều kiểu, đề xuất phương án táo bạo.
- Số liệu thị trường (lãi suất, hạ tầng, giá khu vực) nên có nguồn; chú thích nguồn để ở bảng nguồn hoặc chữ nhỏ trên màn hình, không làm câu chữ cứng lại.
- Hạn chế so sánh dự án khác bằng số không có nguồn, hoặc nói "sắp hết" khi chưa kiểm tra giỏ hàng; nếu cần thì ghi rõ là nhận định.
- Ảnh phối cảnh ghi "hình ảnh minh họa".
- Caption là quảng cáo: viết tự nhiên như người thật kể chuyện, không khuôn sẵn, không danh sách ✅ liệt kê số, nguồn và lưu ý gom thành chữ nhỏ cuối bài. Chi tiết: `docs/quy-tac-caption.md` (được ưu tiên hơn skill `real-estate-content-creator` khi viết caption).

## Nguyên tắc "No AI Slop" (anh dặn 07/11/2026, áp dụng cho mọi sản phẩm)
Sản phẩm phải trông và nghe như người làm có chủ ý, không như máy rập khuôn. Trước khi đưa anh xem, tự soát:
- **Hình (video, landing):** không hộp bo góc viền phát sáng, không nền tối kẻ sọc/lưới trang trí, không chữ dính/đè/lem, không thẻ giống hệt nhau xếp hàng, không nhãn CHỮ HOA giãn chữ trên mọi tiêu đề, không đánh số 01/02/03 khi nội dung không phải trình tự. Mỗi cảnh một điểm nhấn rõ, chữ đọc được trong 1 giây trên điện thoại. Chụp storyboard và tự xem trước khi gửi anh.
- **Chữ (caption, kịch bản):** theo `docs/quy-tac-caption.md`: không mở bài kiểu nhãn dán, không câu sáo ("không chỉ A mà còn B", "đáng để cân nhắc"), không danh sách ✅, không bịa chuyện cá nhân.
- **Âm thanh:** giọng đúng giọng gốc miền Nam, nhạc và hiệu ứng thay đổi giữa các video, không một tiếng lặp mãi.
- **Thiết kế mới (UI/UX, ảnh):** do AGY làm và đưa anh bản demo/ảnh mẫu để chọn trước khi vào code (anh đã chê nhiều vòng khi dựng thẳng). Em dùng skill `impeccable` + `frontend-design` chỉ để **review và đề xuất** (checklist "No AI Slop" ở trên), không để dựng thiết kế.

## Skill dùng tự động (không cần anh gọi)
- Viết/sửa code `engine/`: `test-driven-development` (test trước), xong việc `verification-before-completion`; lỗi khó: `systematic-debugging`.
  - Test phải dùng **dữ liệu và tình huống thật**, không dữ liệu tự bịa cho dễ qua: tiêu đề cột thật của file anh dùng (Master File gộp cột "PTTT 02 / 03"), output thật của lệnh, bot khởi động lại giữa chừng (`/capnhat`), tin nhắn/nút cũ. Anh dặn 08/11/2026 sau 2 lỗi lọt test (`/kiemgia`, nút Gemini).
- Việc lớn: `brainstorming` → `writing-plans` → `executing-plans`.
- Giao diện landing/phiếu (`engine/landing/`, `du-an/<mã>/landing/`): AGY thiết kế; em dùng `impeccable` (`audit`/`critique`) để soát và đề xuất, giữ quy tắc giá/VAT/ô đồng ý khi tích hợp.
- Video: `bcons-video`; caption: `docs/quy-tac-caption.md`; bài công ty: `bai-cong-ty`; dự án mới: `bcons-project-init`.
- Cần khả năng chưa có: `find-skills` tìm skill, **báo anh trước khi cài** (cài skill = thêm code người khác vào repo).

## Tin nhắn hàng loạt
- Không dùng Zalo/Facebook cá nhân để nhắn hàng loạt (dễ bị khóa). Kênh phù hợp: Zalo OA/ZNS, SMS brandname, email.
- Chỉ nhắn khách đã đồng ý nhận tin; có danh sách từ chối; không gửi trùng; cá nhân hóa theo tên và nhu cầu. Chưa chọn kênh gửi (xem `NOTES.md`).

## Video
- Làm video bằng skill/lệnh `/bcons-video [chủ đề]`: 4 cổng chờ anh duyệt (số liệu → chữ + số + storyboard có hình → tốn credit giọng → render). Không "one-click" từ cào tin đến render. Chi tiết: `docs/quy-trinh-video.md`.
- Có Superpowers thì dùng brainstorming/plan/verification cho việc phức tạp; việc nhỏ làm thẳng.

## Quy ước làm việc
- Làm việc trên nhánh `main`. Không tạo PR nếu anh chưa yêu cầu.
- **Liên kết giữa các phần phải test cả chuỗi** (anh dặn 12/11/2026): đổi một đầu nối (landing, `Code.gs`, `project.json`, tên miền, phiếu, bot) thì chạy `npm test` (có `chuoi-lien-ket.test.mjs`: landing → Apps Script → Telegram → link phiếu → trang phiếu) và, sau khi push, `npm run kiem-mang -- --cho` (trang đang chạy trên mạng đúng bản main, đủ file, mã QR). Có lỗi ở một đầu nối thì sửa và thêm test cho đầu nối đó, không chỉ sửa chỗ vừa thấy. GitHub tự chạy kiểm mạng mỗi sáng (`.github/workflows/kiem-mang.yml`).
- Tài liệu: mục lục và trạng thái ở `docs/README.md`. Xong/đổi một kế hoạch thì sửa dòng **Trạng thái** đầu file và mục lục cùng lúc với code; đổi tên/xóa file thì sửa chỗ nhắc tới nó (`npm test` có test docs chặn lệch).
- Nội dung dự án viết Markdown trong `du-an/<mã>/` (bài đăng ở `content/`, kịch bản ở `video/<tên>/`); `docs/` chỉ chứa tài liệu chung (quy trình, thiết kế, kế hoạch, hướng dẫn).
- Lịch mở bán: xem `du-an/bcons-central-park/thong-tin.md` (đợt 2 giới thiệu 29/11/2026, đợt 3 ngày 27/12/2026).

## Lệnh "Off" (kết thúc phiên làm việc)
Khi anh gõ đúng "Off" (không phân biệt hoa thường), làm tự động theo thứ tự, không hỏi lại:
1. Cập nhật `NOTES.md`: ghi ngày ở dòng "Cập nhật lần cuối"; chuyển việc đã xong sang "Đã làm" (quá 15 dòng thì dời phần cũ xuống `docs/nhat-ky.md`, giữ `NOTES.md` ngắn), việc dở sang "Đang làm", việc mới phát sinh sang "Chưa làm"; thêm câu hỏi còn mở và ghi chú kỹ thuật mới. Chỉ ghi điều có thật trong phiên, không bịa.
2. Kiểm tra `git status`: không được stage `.env`, `data/`, `anh/`, `*.xlsx`, `*.mp4`, `out/`, `node_modules`, hay bất kỳ API key/dữ liệu khách/hoa hồng. Nếu thấy, dừng lại và báo.
3. Commit (message tiếng Anh ngắn, kèm dòng Co-Authored-By) rồi `git push` lên nhánh hiện tại. Không tạo PR.
4. Báo lại bằng 2-3 dòng: commit nào, đã push chưa, việc dở còn lại. Nếu push lỗi thì nói rõ, không báo là đã xong.
