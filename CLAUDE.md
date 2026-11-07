# CLAUDE.md — Bcons (hướng dẫn cho Claude)

## Vai trò và cách giao tiếp
- Người dùng: anh, nhân viên kinh doanh sàn Bcons PS Land (phân phối chính thức của CĐT Bcons), không phải lập trình viên, là người quyết định của dự án. Đang bán **Bcons Central Park** (236 Phan Trung, Tam Hiệp, TP. Đồng Nai / Biên Hòa).
- Mục tiêu repo: làm video và bài đăng Facebook/TikTok, phễu khách (landing, CRM, báo Telegram). Thiết kế: `docs/superpowers/specs/2026-11-05-bcons-automation-pipeline-design.md`.
- Tiếng Việt, anh xưng "anh", Claude xưng "em". Ngắn gọn, nói thẳng, có số liệu.
- Dùng thuật ngữ kỹ thuật thì giải thích 1 dòng kèm ví dụ đời thường (vd. "commit = lưu một mốc thay đổi, như bấm Lưu có ghi chú").
- Việc lớn đi theo thứ tự: Brainstorm → Thiết kế (spec) → Kế hoạch → Test trước (TDD) → Code → Review. Việc nhỏ làm thẳng.
- **Cổng duyệt:** trước khi sửa nhiều file cùng lúc hoặc chạy lệnh quan trọng (tốn tiền: tạo giọng ElevenLabs; đăng bài; xóa dữ liệu; push lên `main`), trình kế hoạch ngắn và chờ anh nói "OK"/"Làm đi".
- Model cho agent phụ: `opus` để lập kế hoạch kiến trúc, tái cấu trúc lớn; `sonnet` để viết code, kịch bản, kiểm tài liệu nguồn; `haiku` để dò tìm file.

## Máy đang chạy (tự nhận diện)
- **Cloud** (biến môi trường `CLAUDE_CODE_REMOTE=true`, anh dùng từ laptop/điện thoại): nghiên cứu, viết `kich-ban.md`, `storyboard.md`, `caption.md`, `spec.json`, lập trình `engine/`, viết test, `npm test`, `npm run lint`, commit/push. **Không** chạy `npm run voice` hay `npm run render:drive` (không có `.env`, không có Drive).
- **Máy của anh** (laptop/máy bàn, có `engine/remotion/.env`): `git pull`, cổng chặn, `npm run voice` (sau khi anh đồng ý tốn credit), `npm run render:drive`.
- **Anh không gõ lệnh:** trên laptop có bot Telegram (`Bcons-Bot.cmd`, `docs/huong-dan-bot-telegram.md`): `/capnhat`, `/render`, `/giong`, `/duyet`, `/xem`, `/danhsach`. Khi cần anh làm gì trên máy, hướng dẫn bằng lệnh bot, không đưa lệnh PowerShell (trừ khi bot chưa chạy được).

## Cấu trúc thư mục
- `engine/`: code dùng chung (`engine/remotion/` dựng video, `engine/automation/` script tiện ích). Không chứa số liệu dự án.
- `du-an/<mã>/`: mọi thứ của một dự án: `project.json`, `thong-tin.md`, `video/<tên>/` (spec.json, kich-ban.md, storyboard.md, caption.md, audio/), `assets/` (images, geo), `nguon/`, `content/`, `landing/`, `bao-cao/`. Dự án mới: skill `bcons-project-init` (chép `du-an/_mau/`).
- `config.json`: dự án đang bán (`duAnDangBan`). Lệnh nhận thêm `--du-an <mã>` để chạy cho dự án khác.
- Không lên git, cũng chia theo dự án: `data/<mã>/` (bảng giá), `anh/<mã>/` (ảnh gốc).
- Dùng chung giữa các máy qua Drive "Bcons - Dong bo thiet bi" (code tự dò ổ, `findDriveRoot`/`sharedDir`): `video/` (render), `am-thanh/nhac/` (nhạc nền), `data/` (bảng giá). Thêm dữ liệu dùng chung thì để trên Drive, không để riêng một máy.
- Quy tắc chi tiết: `.claude/rules/pipeline-constraints.md` (code video), `.claude/rules/preflight-and-sources.md` (cổng chặn, nguồn số liệu).

## Nguồn dữ liệu (đọc trước khi viết nội dung)
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
7. Liên hệ cá nhân (anh đổi quy tắc 06/11/2026): video hiện **tên + mã QR** (mở landing) ở góc và cảnh cuối, cấu hình ở `project.json` → `watermark`; landing có nút **Gọi/Zalo** (`project.json` → `lienHe`). Caption được ghi SĐT của anh (chỉ số trong `lienHe`; số khác vẫn bị chặn). Lời đọc không đọc SĐT; chữ trên video không ghi SĐT dạng chữ (đã có QR).

## Gợi ý sáng tạo (linh hoạt, ưu tiên nội dung hay)
- Hook, cách dẫn chuyện, cảm xúc, giọng quảng bá, so sánh hình ảnh: tự do sáng tạo, thử nhiều kiểu, đề xuất phương án táo bạo.
- Số liệu thị trường (lãi suất, hạ tầng, giá khu vực) nên có nguồn; chú thích nguồn để ở bảng nguồn hoặc chữ nhỏ trên màn hình, không làm câu chữ cứng lại.
- Hạn chế so sánh dự án khác bằng số không có nguồn, hoặc nói "sắp hết" khi chưa kiểm tra giỏ hàng; nếu cần thì ghi rõ là nhận định.
- Ảnh phối cảnh ghi "hình ảnh minh họa".
- Caption là quảng cáo: viết tự nhiên như người thật kể chuyện, không khuôn sẵn, không danh sách ✅ liệt kê số, nguồn và lưu ý gom thành chữ nhỏ cuối bài. Chi tiết: `docs/quy-tac-caption.md` (được ưu tiên hơn skill `real-estate-content-creator` khi viết caption).

## Skill dùng tự động (không cần anh gọi)
- Viết/sửa code `engine/`: `test-driven-development` (test trước), xong việc `verification-before-completion`; lỗi khó: `systematic-debugging`.
- Việc lớn: `brainstorming` → `writing-plans` → `executing-plans`.
- Sửa giao diện landing (`engine/landing/`): `frontend-design` (hướng thiết kế) và `impeccable` (soát, chỉnh, `audit`/`polish`); giữ quy tắc giá/VAT/ô đồng ý.
- Video: `bcons-video`; caption: `docs/quy-tac-caption.md`; bài công ty: `bai-cong-ty`; dự án mới: `bcons-project-init`.
- Cần khả năng chưa có: `find-skills` tìm skill, **báo anh trước khi cài** (cài skill = thêm code người khác vào repo).

## Tin nhắn hàng loạt
- Không dùng Zalo/Facebook cá nhân để nhắn hàng loạt (dễ bị khóa). Kênh phù hợp: Zalo OA/ZNS, SMS brandname, email.
- Chỉ nhắn khách đã đồng ý nhận tin; có danh sách từ chối; không gửi trùng; cá nhân hóa theo tên và nhu cầu. Chưa chọn kênh gửi (xem `NOTES.md`).

## Video
- Làm video bằng skill/lệnh `/bcons-video [chủ đề]`: 4 cổng chờ anh duyệt (số liệu → chữ + số → tốn credit giọng → storyboard/render). Không "one-click" từ cào tin đến render. Chi tiết: `docs/quy-trinh-video.md`.
- Có Superpowers thì dùng brainstorming/plan/verification cho việc phức tạp; việc nhỏ làm thẳng.

## Quy ước làm việc
- Làm việc trên nhánh `main`. Không tạo PR nếu anh chưa yêu cầu.
- Nội dung dự án viết Markdown trong `du-an/<mã>/` (bài đăng ở `content/`, kịch bản ở `video/<tên>/`); `docs/` chỉ chứa tài liệu chung (quy trình, thiết kế, kế hoạch, hướng dẫn).
- Lịch mở bán: xem `du-an/bcons-central-park/thong-tin.md` (đợt 2 giới thiệu 29/11/2026, đợt 3 ngày 27/12/2026).

## Lệnh "Off" (kết thúc phiên làm việc)
Khi anh gõ đúng "Off" (không phân biệt hoa thường), làm tự động theo thứ tự, không hỏi lại:
1. Cập nhật `NOTES.md`: ghi ngày ở dòng "Cập nhật lần cuối"; chuyển việc đã xong sang "Đã làm", việc dở sang "Đang làm", việc mới phát sinh sang "Chưa làm"; thêm câu hỏi còn mở và ghi chú kỹ thuật mới. Chỉ ghi điều có thật trong phiên, không bịa.
2. Kiểm tra `git status`: không được stage `.env`, `data/`, `anh/`, `*.xlsx`, `*.mp4`, `out/`, `node_modules`, hay bất kỳ API key/dữ liệu khách/hoa hồng. Nếu thấy, dừng lại và báo.
3. Commit (message tiếng Anh ngắn, kèm dòng Co-Authored-By) rồi `git push` lên nhánh hiện tại. Không tạo PR.
4. Báo lại bằng 2-3 dòng: commit nào, đã push chưa, việc dở còn lại. Nếu push lỗi thì nói rõ, không báo là đã xong.
