# CLAUDE.md — Bcons Central Park (hướng dẫn cho Claude)

## Bối cảnh
- Người dùng là nhân viên kinh doanh của Bcons PS, đang bán dự án **Bcons Central Park** (236 Phan Trung, Tam Hiệp, TP. Đồng Nai / Biên Hòa). Mới chuyển sang bất động sản.
- Mục tiêu của repo: (1) làm nội dung video bất động sản, (2) gửi tin nhắn tự động hàng loạt cho khách hàng.
- Giao tiếp bằng **tiếng Việt**. Người dùng xưng "anh", Claude xưng "em". Trả lời ngắn gọn, nói thẳng, có số liệu.

## Cấu trúc thư mục
- `engine/`: code dùng chung (`engine/remotion/` dựng video, `engine/automation/` script tiện ích). Không chứa số liệu dự án.
- `du-an/<mã>/`: mọi thứ của một dự án: `project.json`, `thong-tin.md`, `video/<tên>/` (spec.json, kich-ban.md, storyboard.md, caption.md, audio/), `assets/` (images, geo), `nguon/`, `content/`, `landing/`, `bao-cao/`. Dự án mới: chép `du-an/_mau/` (xem README trong đó).
- `config.json`: dự án đang bán (`duAnDangBan`). Lệnh video nhận thêm `--du-an <mã>` để chạy cho dự án khác.
- Không lên git, cũng chia theo dự án: `data/<mã>/`, `anh/<mã>/`.

## Nguồn dữ liệu (đọc trước khi viết nội dung)
- `du-an/bcons-central-park/thong-tin.md`: thông tin dự án, 5 phương thức thanh toán, lịch mở bán, tóm tắt bảng giá. Đây là nguồn chính, đã đối chiếu với tài liệu chủ đầu tư.
- `data/bcons-central-park/bang-gia.csv`: giá và tình trạng từng căn (996 căn). File này **không đưa lên git**.
- Google Drive dự án (thư mục gốc id `1YUrtxPpYrDYCLGKKKXEFfmkreyROMniZ`): training, Q&A, PTTT, TVC, phối cảnh, mặt bằng. Đọc bằng connector Google Drive khi cần.
- Master File (`MasterFile_BconsCentralPark_ver2.xlsx`) do người dùng gửi qua upload. Có sheet GiaTongHop (giá), KhachHang (khách), HoaHong (nội bộ).

## Quy tắc cứng (pháp lý, dữ liệu; không nới)
1. **Không commit dữ liệu cá nhân hoặc nội bộ**: tên/SĐT khách, hoa hồng, thưởng nóng, file xlsx, API key. `data/` và `*.xlsx` đã nằm trong `.gitignore`; giữ nguyên.
2. **Số liệu dự án lấy từ tài liệu chủ đầu tư**, không tự suy ra. Thiếu thì ghi "chưa có" và hỏi lại.
3. **Không cam kết lợi nhuận, không hứa tăng giá.**
4. **Căn đã cọc = đã bán**, không tư vấn. Căn "CĐT LOCK" chưa mở bán, không quảng cáo.
5. Không bán cho người nước ngoài. Nhắc giá thì nói rõ **chưa VAT/có VAT** và phí bảo trì 2%. PTTT 01 đã trừ 8,5%, PTTT 04/05 trừ 2,45% so với giá PTTT 02. Lãi suất trần 6,9% chỉ có ở PTTT 03 và 04, **không** có ở PTTT 05.
6. Thu thông tin khách phải có ô đồng ý nhận tin (không tick sẵn). Nội dung chỉ vào lịch đăng tự động sau khi anh duyệt.

## Gợi ý sáng tạo (linh hoạt, ưu tiên nội dung hay)
- Hook, cách dẫn chuyện, cảm xúc, giọng quảng bá, so sánh hình ảnh: tự do sáng tạo, thử nhiều kiểu, đề xuất phương án táo bạo.
- Số liệu thị trường (lãi suất, hạ tầng, giá khu vực) nên có nguồn; chú thích nguồn để ở bảng nguồn hoặc chữ nhỏ trên màn hình, không làm câu chữ cứng lại.
- Hạn chế so sánh dự án khác bằng số không có nguồn, hoặc nói "sắp hết" khi chưa kiểm tra giỏ hàng; nếu cần thì ghi rõ là nhận định.
- Ảnh phối cảnh ghi "hình ảnh minh họa".
- Thiết kế hệ thống tự động hóa: `docs/superpowers/specs/2026-11-05-bcons-automation-pipeline-design.md`.

## Tin nhắn hàng loạt
- Không dùng Zalo/Facebook cá nhân để nhắn hàng loạt (dễ bị khóa). Kênh phù hợp: Zalo OA/ZNS, SMS brandname, email.
- Chỉ nhắn khách đã đồng ý nhận tin; có danh sách từ chối; không gửi trùng; cá nhân hóa theo tên và nhu cầu.
- Chưa chọn kênh gửi (xem `NOTES.md`).

## Quy trình video (xem `docs/quy-trinh-video.md`)
- 3 giai đoạn có cổng duyệt: Nghiên cứu → Kịch bản (kèm bảng nguồn từng số) → Storyboard (video có bản đồ/camera/ảnh chèn: `du-an/<mã>/video/<tên>/storyboard.md`, anh duyệt trước khi code và render) → Dựng/Render. Không chạy "one-click" từ cào tin đến render; anh duyệt chữ và số liệu trước khi tạo giọng (tốn credit) và trước khi đăng.
- Hai file `huong_dan_su_dung_prompt_remotion_bcons.md` và `prompt_cao_du_lieu_bds_bcons_central_park.md` chỉ là tài liệu tham khảo. Không dùng `edge-tts`, `props/bcons-latest.json`, composition `RealEstateShortVideo`; repo dùng `BconsCentralPark` + ElevenLabs.
- Số trong JSON/ví dụ của các prompt đó (85 triệu/m², 49,9 triệu/m², 6,2%, "tiết kiệm 60%") là ví dụ, không có nguồn: không dùng.
- Số lượng căn theo tài liệu CĐT: 2.820 căn ở + 113 căn thương mại (không ghi "~2.800").
- Cảnh cuối video: không đọc/hiện số điện thoại hay tên cá nhân; chỉ chạy thông tin dự án (anh quyết định 04/11/2026). Bỏ cụm CTA "Liên hệ: Tuấn - ..." trong 2 file prompt.
- Có Superpowers thì dùng brainstorming/plan/verification cho việc phức tạp; việc nhỏ làm thẳng.

## Quy ước làm việc
- Làm việc trên nhánh `main`. Không tạo PR nếu người dùng chưa yêu cầu.
- Nội dung của dự án viết bằng Markdown trong `du-an/<mã>/` (bài đăng ở `content/`, kịch bản ở `video/<tên>/`); `docs/` chỉ chứa tài liệu chung (quy trình, thiết kế, kế hoạch).
- Video Remotion nằm trong `engine/remotion/`. Mỗi video là một spec `du-an/<mã>/video/<tên>/spec.json` (lời bình `markup` + mẫu cảnh + `status`), bảng nguồn ở `du-an/<mã>/video/<tên>/kich-ban.md`. Làm video bằng lệnh `/bcons-video [chủ đề]` (4 cổng chờ anh duyệt). Tạo giọng (trong `engine/remotion/`): `npm run voice -- <tên>` (tốn credit ElevenLabs, hỏi anh trước; chỉ chạy khi spec `approved`). Render và xuất lên Drive: `npm run render:drive -- <tên>` (video thành phẩm ra `engine/remotion/out/video/`, file tạm như khung thử, log, props để trong `engine/remotion/out/tam/`; không thả file lẫn trong `out/`). Spec `draft` hoặc có `sourceId` thiếu trong bảng nguồn thì cả hai lệnh từ chối chạy. Số liệu trong video phải được anh duyệt trước khi đăng.
- Ngày hiện tại và lịch mở bán xem `du-an/bcons-central-park/thong-tin.md`: đợt 2 giới thiệu ngày 29/11/2026, đợt 3 ngày 27/12/2026.

## Lệnh "Off" (kết thúc phiên làm việc)
Khi người dùng gõ đúng "Off" (không phân biệt hoa thường), làm tự động theo thứ tự, không hỏi lại:
1. Cập nhật `NOTES.md`: ghi ngày ở dòng "Cập nhật lần cuối"; chuyển việc đã xong sang "Đã làm", việc dở sang "Đang làm", việc mới phát sinh sang "Chưa làm"; thêm câu hỏi còn mở và ghi chú kỹ thuật mới. Chỉ ghi điều có thật trong phiên, không bịa.
2. Kiểm tra `git status`: không được stage `.env`, `data/`, `*.xlsx`, `*.mp4`, `node_modules`, hay bất kỳ API key/dữ liệu khách/hoa hồng. Nếu thấy, dừng lại và báo.
3. Commit (message tiếng Anh ngắn, kèm dòng Co-Authored-By) rồi `git push` lên nhánh hiện tại. Không tạo PR.
4. Báo lại bằng 2-3 dòng: commit nào, đã push chưa, việc dở còn lại. Nếu push lỗi thì nói rõ, không báo là đã xong.
