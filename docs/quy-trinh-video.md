# Quy trình làm video Bcons Central Park (bản hợp nhất, 04/11/2026)

Thay thế cách dùng "Bản 3 one-click" trong `huong_dan_su_dung_prompt_remotion_bcons.md`. Hai file prompt gốc vẫn giữ làm tài liệu tham khảo, nhưng **không dán nguyên văn vào CLAUDE.md**.

## 1. Nguyên tắc
- Một CLAUDE.md duy nhất (gốc repo). Không tạo CLAUDE.md thứ hai trong `engine/remotion/`.
- Tách giai đoạn, **có cổng duyệt của anh giữa các giai đoạn**: Nghiên cứu → Kịch bản + storyboard có hình (duyệt hình trước khi tốn credit giọng, anh đổi 06/11/2026) → Giọng → Render.
- Mọi số liệu phải có: ngày công bố, tên nguồn, link. Số liệu dự án lấy từ `du-an/bcons-central-park/thong-tin.md`.

## 2. Các bước
| # | Giai đoạn | Làm gì | Đầu ra | Cổng duyệt |
|---|-----------|--------|--------|-----------|
| 1 | Nghiên cứu (1 lần/tuần) | Chạy Bản 1 (Master Prompt) trên Claude/Gemini có web search. Chỉ lấy nguồn chính thống. | Bảng số liệu có ngày + link | Anh chọn góc |
| 2 | Kịch bản + spec | Claude viết kịch bản 45–60 giây vào `du-an/<mã>/video/<tên>/kich-ban.md`, **kèm bảng nguồn từng con số** và danh sách kiểm tra mục 3, cùng `du-an/<mã>/video/<tên>/spec.json` (`status: draft`) | Kịch bản + spec | **Anh duyệt chữ + số liệu** (rồi spec mới được đổi sang `approved`) |
| 2c | Storyboard có hình | `storyboard.md` + bot `/storyboard <tên>` (hoặc Claude chụp trên cloud nếu không có bản đồ): 3 khung mỗi cảnh, thời lượng ước tính | Ảnh từng cảnh | **Anh duyệt hình** cùng lúc với bước 2 |
| 3 | Lời bình | Lời bình nằm trong `markup` của spec (cú pháp `hiển-thị{đọc}`, chữ hiện dùng ký hiệu: `90%{chín mươi phần trăm}`), đã duyệt ở bước 2 | spec `approved` | Anh đồng ý tốn credit |
| 3b | Kiểm lời đọc | **Claude tự chạy** `npm run loi-doc -- <tên>` ở cổng 2 và sửa mọi cảnh báo trước khi đưa anh duyệt (anh không phải đọc lời đọc); bot `/giong` cũng tự chặn khi có từ lặp hoặc cụm đã từng lỗi, báo nhờ Claude sửa câu; `/loidoc <số>` để xem khi cần | chữ lời đọc đã kiểm | Không cần anh (chỉ anh duyệt kịch bản) |
| 4 | Giọng đọc | `node --env-file=.env scripts/generate-voice.mjs <tên>` (ElevenLabs, tốn credit; từ chối nếu spec chưa `approved`) | mp3 + timestamp | Anh nghe thử |
| 2b | Caption | `du-an/<mã>/video/<tên>/caption.md` (FB + TikTok), `npm run check:caption -- <tên>`; duyệt cùng lúc với bước 2 (`npm run duyet:caption`) | caption `approved` | Anh duyệt chữ + caption |
| 5 | Render | `npm run lint` rồi `npm run render:drive -- <tên>` (bot `/render <tên>`): nhạc nền, hiệu ứng, QR góc + tên và QR cảnh cuối tự thêm | mp4 lên Drive, kèm ảnh bìa `video/<mã>/bia/<tên>.png` | **Anh xem, duyệt trước khi đăng** (`npm run duyet:video`, rồi `npm run send:telegram`; đăng theo `docs/huong-dan-dang-bai.md`) |

Không dùng `edge-tts` + `props.json` + composition `RealEstateShortVideo` của bản prompt cũ: repo hiện dùng composition `BconsCentralPark` nhận spec qua `--props`, giọng ElevenLabs, phụ đề từng từ.

**Lệnh tắt:** `/bcons-video [chủ đề]` (`.claude/skills/bcons-video/SKILL.md`) chạy cả quy trình trên, dừng chờ anh ở 4 cổng: (1) chọn góc sau khi kiểm số liệu, (2) duyệt chữ + số liệu + caption + storyboard có hình, (3) đồng ý tốn credit giọng, (4) duyệt video trước khi đăng.
**Bước 1 với Gemini:** nhắn bot `/gemini <chủ đề>` (xong bấm nút **🎬 Làm video từ kết quả này** để Claude kiểm link và đề xuất góc ngay, nối thẳng cổng 1 → cổng 2) (tự gửi `docs/prompt-gemini-nghien-cuu.md` cho Gemini có tìm Google, lưu `du-an/<mã>/nguon/gemini/`), hoặc dán prompt vào app Gemini Deep Research. Sau đó Claude kiểm lại từng link.
**Mẫu cảnh:** `stat-hero`, `route-map`, `data-cards`, `compare-bars`, `geo-map` (bản đồ Mapbox thật; dữ liệu địa lý trong `du-an/bcons-central-park/assets/geo/`, nguồn ở `du-an/bcons-central-park/assets/geo/NGUON.md`; lớp chưa có dữ liệu chính thức phải là "minh họa"), `project-close`, `lo-trinh` (bảng lộ trình tiền theo thời gian cho video giải thích cách đóng tiền: thanh xếp chồng, hai số lớn, trục các mốc; số tổng tự tính từ các mốc), `danh-sach` (danh sách 2–5 mục hiện lần lượt theo cue, có đếm; dùng khi nội dung thật là danh sách) (schema `engine/remotion/src/spec.ts`). Khung mở đầu: trường `hook` ở gốc spec (`lines` mục tiêu ≤ 6 chữ, tối đa 7, `soNhan`, `donVi`, `dongPhu`, `image`) phủ 3 giây đầu cảnh 1; `check:spec` kiểm số nhấn có trong video và ảnh có thật. Khung nguồn cuối video (tùy chọn, anh duyệt 16/11/2026): trường `nguonCuoi` (tối đa 3 dòng tên nguồn + ngày + `sourceId`), 2,5 giây không lời chèn trước cảnh cuối, video dài thêm 2,5 giây; `check:spec` đối chiếu với bảng nguồn. Mỗi số trong spec có `sourceId` trỏ tới bảng nguồn; `npm run lint` kiểm tra.

## 3. Danh sách kiểm tra nội dung (bắt buộc trước bước 2 → anh duyệt)
- [ ] Mỗi số liệu có nguồn + ngày; số dự án khớp `du-an/bcons-central-park/thong-tin.md` (5 tháp, 22 tầng, 2.820 căn ở + 113 căn thương mại, 60 tiện ích).
- [ ] Không "tiết kiệm tới 60% so với nhà phố", "điểm trũng đón sóng", "dòng vốn dịch chuyển mạnh" nếu chưa có nguồn. Không hứa tăng giá/lợi nhuận.
- [ ] Số trong JSON mẫu của Bản 2 (85 triệu/m², 49,9 triệu/m², lãi 6,2%) chỉ là ví dụ, **không được dùng** nếu chưa có nguồn thật. Giá chủ đầu tư: tim tường 54–70 triệu/m² chưa VAT.
- [ ] Nhắc giá thì nói rõ chưa VAT/có VAT và phí bảo trì 2%.
- [ ] Không quảng cáo căn "CĐT LOCK"; không nói "sắp hết" khi chưa kiểm tra tình trạng.
- [ ] Không so sánh dự án khác bằng số không nguồn.
- [x] Cảnh cuối: **không đọc và không hiện số điện thoại** (anh quyết định 04/11/2026). Cuối video chỉ chạy thông tin dự án (tên, địa chỉ, tin nhắn/liên hệ qua kênh anh chọn). Không dùng cụm "Liên hệ: Tuấn - ..." của prompt cũ.
- [ ] Công ty chưa gửi quy định nội dung chính thức → anh duyệt toàn bộ.

## 3b. Kiểm hook và nhịp (bắt buộc ở cổng 2, thêm 15/11/2026)
Căn cứ: báo cáo tuần 06–12/11 (thời gian xem TB TikTok 1–4 s trên video 49–58 s, 0 bình luận) và `docs/phan-tich-video-tham-khao.md`. Là mục tiêu để thử, chưa phải kết luận; đo lại ở báo cáo tuần.
- [ ] **3 phương án hook** (một con số / một câu hỏi / một kết quả), anh chọn một; ghi hook đã chọn vào đầu `kich-ban.md`.
- [ ] **Khung 0 có chữ và hình** (không ô trắng/đen): khung đầu cũng là ảnh bìa lưới TikTok. Mỗi video có `bia.json` (cùng chữ với `hook` của spec, `check:spec` kiểm); chụp bìa bằng `npm run bia -- <tên>` (ra `engine/remotion/out/bia/<tên>.png`, dùng cho Reel Facebook; TikTok lấy khung 0 của video). Tiêu đề hook mục tiêu 6 chữ (tối đa 7), có con số hoặc kết quả, hiện trong 1 giây đầu.
- [ ] **Lời cảnh 1 tới con số đầu trong 12 chữ** (khoảng 4 giây). Hiện cảnh 1 của 9 video đã làm dài 20–42 chữ.
- [ ] **Độ dài mục tiêu 25–35 giây** (70–95 chữ lời); mỗi cảnh không quá 8 giây. Dài hơn phải có lý do.
- [ ] **Nhịp: cứ 2–3 giây có một thứ mới** trên hình (số hiện, thẻ vào, vùng sáng); storyboard ghi "điểm đổi" từng cảnh. Không để một cảnh đứng yên 10 giây.
- [ ] **Cảnh cuối có một câu hỏi dễ trả lời** (chọn 1 trong 2, hoặc trả lời bằng một con số/một chữ), thay lời mời "comment …"; QR đã tự thêm.
- [ ] **Video hạ tầng/quy hoạch:** một dòng nói đúng tình trạng thật (ý tưởng / chủ trương / đã duyệt / đang thi công); không để người xem hiểu ý tưởng là đã chắc chắn, không cần kể hết các bước (mục 3c).
- [ ] **Gợi tò mò, một lời kêu gọi (mục 3c):** video nêu một phần, chừa chi tiết cho khi khách nhắn; không liệt kê điều kiện từng câu.
- [ ] `npm run check:spec` in cảnh báo nhịp/hook (cảnh 1 > 14 chữ trước con số đầu, tổng > 100 chữ, cảnh > 8 s): không chặn, nhưng vượt thì ghi lý do trong kịch bản.
- [ ] Hình/chữ dựng: không bắt chước kiểu nền tối kẻ lưới, thẻ viền sáng, nhãn chữ hoa của video tham khảo (trái "No AI Slop"). Chỉ học nhịp và cấu trúc.

## 3c. Nguyên tắc truyền thông bán hàng: gợi tò mò, để chi tiết cho lúc có khách (anh chốt 16/11/2026)
Video và caption là **mồi kéo khách nhắn**, không phải bản thông tin đầy đủ. Chi tiết, điều kiện, mức theo từng căn, danh sách căn: **tư vấn lại khi khách liên hệ**. Căn cứ: các công thức hook và CTA của skill `marketing:content-creation` (hook ngắn, một ý chính, một lời kêu gọi), đã chỉnh cho bất động sản.
**Làm:**
- Mỗi video **một ý chính, một điều khiến người xem muốn hỏi thêm** (con số bất ngờ, một câu hỏi, một kết quả chưa nói hết). Nêu một phần thông tin, chừa phần còn lại.
- **Một lời kêu gọi, đúng một việc**: nhắn/hỏi để nhận chi tiết (QR và tên đã tự có); thêm câu hỏi dễ trả lời để kéo bình luận. Không nhồi nhiều lời mời.
- Không cần liệt kê điều kiện, ngoại lệ, mọi bước của từng câu. Nói "một số căn", "từ", "khoảng" khi đúng với nguồn là đủ. Chữ nhỏ trên hình chỉ giữ thứ cần để không sai (ví dụ "căn ví dụ").
- Viết như người kể chuyện, không như bản tin hay văn bản pháp lý. Câu ngắn, có hình ảnh, có điểm đau của khách (vốn bao nhiêu, vay thế nào, bao giờ nhận nhà).
**Vẫn không được phá (quy tắc cứng `CLAUDE.md`, không vì "tò mò" mà nới):**
- Không bịa, không sai số liệu: nêu một phần thì phần đó phải **đúng nguồn** và không để người xem hiểu sai thành điều ngược lại (ví dụ cam kết thuê lại chỉ áp dụng cho một số căn: bìa/tiêu đề được viết ngắn như "Chủ đầu tư thuê lại 2 năm" để gợi tò mò, nhưng lời đọc hoặc caption phải có "một số căn"; anh chốt giữ bìa N03 ngắn 16/11/2026).
- Không hứa lợi nhuận/tăng giá, không "sắp hết" khi chưa kiểm, không quảng cáo căn đã cọc/CĐT LOCK, không SĐT chữ trên hình.
- Có nhắc giá căn thì một nhãn ngắn chưa VAT/có VAT (và phí bảo trì 2% khi nói tổng chi phí); căn ví dụ ghi rõ "ví dụ"; phối cảnh ghi "minh họa".
- Hạ tầng/quy hoạch: một dòng nói đúng tình trạng thật (chủ trương / đã duyệt / đang thi công / dự kiến), không cần kể hết các bước.
- Thu thông tin khách phải có ô đồng ý nhận tin.
**Nới thêm (anh chốt 27/11/2026, theo tư liệu AGY):** video Newsky được dùng metro số 2 (nói là "phía sau lưng dự án", anh xác nhận vị trí; nguồn Tuổi Trẻ 05/10: ga C10 trước BV Quốc tế Becamex và Lotte Mart Bình Dương, khởi công 12/2026, không hứa thời điểm vận hành); được nêu giá/m² Newsky so với thị trường khi số có nguồn và nói đúng phạm vi từng số; không cần chữ nhỏ điều kiện dài. Vẫn giữ: số đúng nguồn, không hứa lợi nhuận/tăng giá, không "tiền thuê bù lãi vay", không hứa kết quả, thuê lại ghi "một số căn", không nối Trục Bắc–Nam 1 tới Lái Thiêu.

## 4. Công cụ hỗ trợ
- **Superpowers** (cài theo mục 5): dùng `brainstorming` khi lên ý tưởng/kịch bản mới, `writing-plans` + `verification-before-completion` khi sửa code Remotion/script, `systematic-debugging` khi render hoặc giọng đọc lỗi.
- **Plugin Remotion** (đã cài): quy chuẩn viết composition.
- **ECC**: không cài nguyên bộ (xem mục 5).

## 5. Superpowers / ECC
- **Superpowers: đã cài dạng skill của dự án** trong `.claude/skills/` (MIT, lấy từ `obra/superpowers` đúng commit `bb92a77`, bản ghim trong marketplace chính thức). Chỉ chép 5 skill: brainstorming, writing-plans, executing-plans, systematic-debugging, verification-before-completion. Không chép hook SessionStart và skill using-superpowers (ép dùng skill mọi lúc). Cách này dùng được vì lệnh `/plugin` không chạy trong app/PowerShell. Cần mở phiên mới để nhận skill.
- **ECC: không cài** (anh quyết định 04/11/2026): bên thứ ba, thiên về lập trình, nặng hook.
