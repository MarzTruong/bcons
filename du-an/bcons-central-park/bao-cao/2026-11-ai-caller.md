# AI Caller cho phễu khách Bcons Central Park

Ngày làm: 08/11/2026. Người làm: Claude (phiên cloud). Trạng thái: **nháp, chờ anh duyệt**.
Bản đọc trên điện thoại (Artifact riêng tư): https://claude.ai/artifact/K87Py8XtdGxgwTXyN3a6ch (nguồn trang: `2026-11-ai-caller.html`).

> **Cách nghiên cứu và giới hạn.** Proxy của môi trường cloud chặn mọi trang nhà cung cấp em thử mở bằng curl (403 CONNECT): `elevenlabs.io`, `www.retellai.com`, `vapi.ai`, `vbee.ai`, `fpt.ai`, `stringee.com`, `viettelai.vn`, `omicall.com`, `thuvienphapluat.vn`, `www.twilio.com`, `autocalls.ai`. Theo quy tắc, em không tìm đường vòng. Mọi số liệu dưới đây lấy từ **kết quả WebSearch ngày 08/11/2026** (đoạn trích của trang, chưa mở trang gốc). Muốn em kiểm lại giá trên trang gốc, anh mở các host trên trong Environment (Settings → Network).

> **Giả định (anh chưa trả lời câu hỏi brainstorm, em đi tiếp với giả định hợp lý):**
> 1. Mục tiêu chính: **gọi lại ngay khách vừa để lại số trên landing**, và **nhắc lịch mở bán 29/11 và 27/12** cho khách đã đồng ý. Chăm khách cũ và nhận cuộc gọi đến là mục tiêu phụ.
> 2. Ngân sách thử: dưới khoảng 1–2 triệu đồng/tháng.
> 3. Kênh hiện có: landing (Cloudflare Pages) → Apps Script → Sheet CRM → báo Telegram. Chưa có tổng đài, chưa có tên định danh (brandname).

## 1. AI Caller là gì

AI Caller (callbot, voicebot, AI voice agent) là phần mềm **nói chuyện điện thoại bằng giọng máy**: nghe khách nói (chuyển giọng thành chữ), hiểu ý bằng mô hình ngôn ngữ, trả lời bằng giọng tổng hợp, rồi ghi kết quả vào CRM. Ví dụ đời thường: như một tổng đài viên trực 24/7 đọc theo kịch bản, nhưng biết trả lời câu hỏi lạc đề.

Hai kiểu:
- **Gọi ra (outbound):** máy chủ động gọi danh sách số. Rủi ro pháp lý và bị chặn số cao nhất.
- **Nhận gọi (inbound) hoặc gọi trên web:** khách tự bấm gọi (số tổng đài, hoặc nút "Nói chuyện ngay" trên landing qua trình duyệt). Khách chủ động nên ít rủi ro.

## 2. Dùng vào đâu trong quy trình bán căn hộ

| Bước phễu | AI Caller làm gì | Đánh giá |
|---|---|---|
| Khách vừa để số trên landing | Gọi lại trong 1–5 phút, hỏi nhu cầu (ở/đầu tư, tầm tiền, số phòng ngủ, PTTT quan tâm), đặt lịch anh gọi lại hoặc xem nhà mẫu, đẩy kết quả lên Sheet + Telegram | Hữu ích nhất. Lead nguội rất nhanh nếu gọi chậm (nhận định, chưa có số đo của anh) |
| Nhắc lịch mở bán 29/11, 27/12 | Gọi khách đã đồng ý, nhắc ngày giờ, hỏi có tham dự không | Hữu ích, nhưng là **cuộc gọi quảng cáo**: vướng quy định brandname (mục 3) |
| Trả lời câu hỏi thường gặp | Giá từ bao nhiêu (nói rõ chưa/có VAT, bảo trì 2%), PTTT, tiến độ, pháp lý | Rủi ro nói sai số. Chỉ cho đọc số từ `thong-tin.md`/`pttt-cdt.json`, không cho tự tính |
| Chăm khách cũ | Gọi hỏi thăm, cập nhật tiến độ | Ít lợi; tin nhắn Zalo OA/email rẻ và ít phiền hơn |
| Chốt cọc, thương lượng | **Không** dùng AI | Việc của anh |

## 3. Khung pháp lý Việt Nam (tóm tắt, không phải tư vấn luật)

**Cuộc gọi quảng cáo: Nghị định 91/2020/NĐ-CP** (hiệu lực 01/10/2020, vẫn đang áp dụng):
- Chỉ được gọi quảng cáo khi **đã có sự đồng ý trước** của người nhận.
- Chỉ được gọi quảng cáo khi **đã được cấp tên định danh** (brandname), **không được dùng số điện thoại thường** để gọi quảng cáo.
- Cấm gọi số đã đăng ký **danh sách không quảng cáo (DNC)** (nhắn `DNC` gửi 5656). Theo Bộ Công an, từ 01/10/2025 đến 13/8/2026 danh sách có hơn 1,66 triệu thuê bao.
- Năm 2024 Cục An toàn thông tin đã **thu hồi 6 brandname** của 2 doanh nghiệp vì gọi số DNC và gọi khi chưa có đồng ý.

**Dự thảo nghị định thay thế (Bộ Công an, 9/2026, chưa ban hành, đang thẩm định, dự kiến hiệu lực 01/01/2027):**
- Giữ yêu cầu tên định danh; tên định danh do **Bộ Công an cấp, có phí, thời hạn 3 năm**.
- Người gọi quảng cáo phải **giới thiệu họ tên, chức vụ, đơn vị ngay đầu cuộc gọi**; cấm che giấu nguồn gọi.
- Nhà mạng được hạn chế, tạm dừng, chặn cuộc gọi nếu có dấu hiệu rác.

**Dữ liệu cá nhân: Luật Bảo vệ dữ liệu cá nhân 2025 + Nghị định 356/2025/NĐ-CP** (hiệu lực 01/01/2026; **Nghị định 13/2023 đã bị thay thế**):
- Đồng ý phải rõ ràng, tự nguyện, kiểm chứng được; im lặng không phải đồng ý. Landing hiện có ô đồng ý không tick sẵn: đúng hướng, nhưng câu chữ nên ghi rõ **"đồng ý nhận cuộc gọi tư vấn, có thể là trợ lý AI, cuộc gọi được ghi âm"**.
- Giọng nói và bản ghi âm là dữ liệu cá nhân. Ghi âm phải thông báo ở đầu cuộc gọi; lưu trữ ở nhà cung cấp nước ngoài là chuyển dữ liệu ra nước ngoài (cần hồ sơ đánh giá tác động theo luật; em chưa kiểm chi tiết điều khoản, cần hỏi pháp chế công ty).
- Khách yêu cầu xóa dữ liệu: thời hạn 20 ngày, gia hạn tối đa 30 ngày (theo bài phân tích Nghị định 356).

**Kết luận pháp lý cho anh (nhận định của em):**
1. Anh là cá nhân, **không tự đăng ký brandname** để gọi quảng cáo được thuận lợi; nếu làm phải qua công ty (Bcons PS Land) hoặc nhà cung cấp tổng đài có đầu số/brandname hợp lệ. Gọi quảng cáo bằng số cá nhân hoặc số ảo nước ngoài là **sai Nghị định 91**.
2. "Gọi lại theo yêu cầu" (khách vừa bấm "nhờ tư vấn") ít rủi ro hơn gọi nhắc mở bán, nhưng ranh giới với "quảng cáo" chưa rõ, nên vẫn chỉ gọi khách đã tick đồng ý và giới thiệu rõ danh tính.
3. Nên hỏi công ty/CĐT trước: có CĐT từng **cấm sale telesale** (báo Tin nhanh chứng khoán), và nói thay mặt dự án bằng giọng máy có thể cần CĐT đồng ý kịch bản.

## 4. Rủi ro thực tế

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Bị chặn/đánh dấu số rác (nhà mạng, app chặn cuộc gọi) | Cao nếu gọi ra số lượng lớn | Gọi ít, chỉ khách đồng ý, đầu số hợp lệ, có danh sách từ chối |
| Số nước ngoài (Twilio…) gọi về Việt Nam hiện số lạ, khách không nghe | Cao (nhận định) | Dùng tổng đài trong nước, hoặc chỉ dùng gọi trên web |
| Khách khó chịu khi biết là máy | Trung bình | Nói ngay "em là trợ lý AI của anh Tuấn", cho chuyển máy anh bất cứ lúc nào |
| Giọng không chuẩn miền Nam, đọc sai số tiền | Trung bình | Dùng giọng ElevenLabs anh đã chọn (`9CCqsrTCLkHgQlKSMchK`), nghe thử 20 cuộc trước |
| AI nói sai giá/PTTT, hứa lợi nhuận | Cao | Kịch bản khóa: chỉ đọc số có trong tài liệu CĐT, cấm nói tăng giá/lợi nhuận, câu khó thì hẹn anh gọi lại |
| Lộ dữ liệu khách | Trung bình | Không lưu ghi âm lâu, không đẩy dữ liệu khách lên git (đã có hook chặn) |

## 5. So sánh sản phẩm

Giá quy USD/phút là giá **nền tảng AI**; chưa gồm cước viễn thông trừ khi ghi rõ. "Chưa công bố" = không tìm thấy giá công khai, phải xin báo giá.

| Sản phẩm | Tiếng Việt / giọng miền Nam | Giá (nguồn, xem 08/11/2026) | Tích hợp | Ưu | Nhược | Hợp Bcons |
|---|---|---|---|---|---|---|
| **ElevenLabs Agents** | Có tiếng Việt; **dùng được giọng miền Nam anh đang dùng** | $0,08/phút (gọi dồn $0,16), LLM tính thêm ([elevenlabs.io/pricing/agents](https://elevenlabs.io/pricing/agents), [Macha](https://www.getmacha.com/blog/elevenlabs-agents-pricing-explained)) | Twilio, SIP trunk, **widget gọi trên web**, webhook | Giọng đã quen, có widget nhúng landing không cần số điện thoại | Gọi số VN phải qua SIP của nhà mạng VN; dữ liệu lưu nước ngoài | **Cao** cho thử nghiệm gọi trên web |
| **Retell AI** | Có trang tiếng Việt; tùy engine giọng (có ElevenLabs) | Từ $0,07/phút, cộng dồn hạ tầng $0,055 + giọng + LLM + cước ([eesel.ai](https://eesel.ai/blog/retell-ai-pricing), [retellai.com (trang ngôn ngữ tiếng Việt)](https://www.retellai.com/es/languages-ai/vietnamese-ai)) | API, webhook, Twilio/SIP | Công cụ dựng kịch bản tốt, gọi ra hàng loạt | Như trên: số nước ngoài; tổng chi phí khó đoán | Trung bình |
| **Vapi** | Tùy engine giọng chọn | Phí nền $0,05/phút + nhà cung cấp, thực tế khoảng $0,10–0,20/phút ([happyrobot.ai](https://www.happyrobot.ai/hub/vapi-ai-pricing), [beri.net](https://www.beri.net/article/voice-ai-per-minute-pricing-vapi-retell-elevenlabs-bland-cost-per-resolved-call)) | API cho lập trình viên | Linh hoạt nhất | Phải tự ghép nhiều thứ, tốn công | Thấp (quá kỹ thuật) |
| **OmiCall (OmiBot)** | Tổng đài Việt Nam, có API callBot gọi tự động, TTS/STT tiếng Việt | Chưa công bố; có trang chính sách giá `omicall.com/chinh-sach-gia/` (chưa mở được) ([api.omicall.com](https://api.omicall.com/omicall-api/ai-api), [mpt.com.vn/omibot](https://mpt.com.vn/en/omibot/)) | API, tích hợp CRM (Bitrix24…) | Đầu số trong nước, phổ biến với sàn BĐS | Chưa rõ giọng miền Nam; giá phải hỏi | **Cao** cho gọi lại lead hợp lệ |
| **Stringee** | Nền tảng API thoại Việt Nam | Chưa công bố ([G2](https://www.g2.com/products/stringee-call-apis/pricing)) | API gọi, SIP, webhook | Có thể làm "đường SIP" cho ElevenLabs/Retell gọi số VN | Phải tự ghép phần AI | Trung bình–cao (làm cầu nối) |
| **Viettel AI Callbot** | Tiếng Việt, nhiều vùng miền (theo Viettel) | Chưa công bố; có dùng thử ngắn hạn ([viettelai.vn](https://viettelai.vn/en/tin-tuc/callbot-la-gi-giai-phap-tu-dong-hoa-cuoc-goi-tu-viettel-ai)) | Hợp đồng doanh nghiệp | Nhà mạng lớn, brandname dễ | Bán cho doanh nghiệp, khó với cá nhân | Thấp (trừ khi công ty làm) |
| **Vbee AICall** | Giọng Việt (Vbee mạnh TTS tiếng Việt), trụ sở Hà Nội | Chưa công bố ([PitchBook](https://pitchbook.com/profiles/company/592888-87)) | API | Giọng Việt tự nhiên | Giá phải hỏi | Trung bình |
| **FPT AI Engage** | Tiếng Việt | Chưa công bố ([G2](https://www.g2.com/products/fpt-ai/pricing)) | Hợp đồng doanh nghiệp | Dùng nhiều ở ngân hàng (nhắc nợ) | Hướng doanh nghiệp lớn | Thấp |

Ước tính chi phí thử nghiệm (em tự tính, không phải báo giá): 100 cuộc × 3 phút = 300 phút × $0,08 ≈ **$24 (khoảng 600 ngàn đồng)** phí ElevenLabs, chưa gồm LLM và cước.

## 6. Đề xuất

**Lựa chọn 1 (làm trước, rủi ro thấp): ElevenLabs Agents gắn nút "Nói chuyện với trợ lý" trên landing.**
- Khách tự bấm, nói qua trình duyệt, không có cuộc gọi đi nên không vướng Nghị định 91 về gọi quảng cáo.
- Dùng giọng miền Nam anh đã duyệt. Trợ lý chỉ đọc số trong `thong-tin.md` và `pttt-cdt.json`, mở đầu nói rõ là trợ lý AI, cuộc trò chuyện được ghi lại.
- Cuối cuộc: hỏi tên + số + tick đồng ý → webhook về Apps Script hiện có → Sheet CRM + Telegram (tái dùng đường đang chạy).

**Lựa chọn 2 (sau khi hỏi công ty): tổng đài trong nước (OmiCall hoặc Stringee) gọi lại lead landing trong 5 phút.**
- Điều kiện: đầu số/brandname hợp lệ qua Bcons PS Land; câu đồng ý trên landing ghi rõ "nhận cuộc gọi tư vấn, có thể là trợ lý AI, có ghi âm".
- Có thể nối Stringee làm đường SIP cho chính agent ElevenLabs để giữ giọng.

**Không khuyên:** gọi ra hàng loạt danh sách khách cũ/số mua ngoài; dùng số Twilio nước ngoài gọi khách Việt Nam.

### Kế hoạch thử nghiệm nhỏ (2 tuần, đề xuất)
1. Anh hỏi công ty: được dùng trợ lý AI nói về dự án không; công ty có brandname/tổng đài không.
2. Em sửa câu đồng ý trên landing (thêm "trợ lý AI", "ghi âm"), thêm tab **TuChoi** dùng chung (Sheet đã có) làm danh sách từ chối; máy kiểm trước mỗi cuộc.
3. Dựng agent ElevenLabs (bản nháp kịch bản để anh duyệt), thử nội bộ 20 cuộc: anh và người quen đóng vai khách, chấm giọng, đọc số, câu khó.
4. Bật trên landing 2 tuần, giới hạn chi phí ví dụ $20 (khoảng 500 ngàn). Đo: số cuộc, thời lượng, số khách để lại số, số khách than phiền, số lần nói sai.
5. Anh xem kết quả rồi quyết định có làm Lựa chọn 2 không. Không cam kết số khách hay doanh số.

Việc tốn tiền (tạo agent, nạp credit) và sửa landing chỉ làm sau khi anh nói "OK".

## 7. Câu hỏi cho anh
1. Mục tiêu đúng như giả định chưa (gọi lại lead landing + nhắc mở bán), hay anh muốn nhận cuộc gọi đến là chính?
2. Ngân sách thử tối đa mỗi tháng?
3. Công ty Bcons PS Land có tổng đài/brandname không, có cho sale dùng giọng AI không?
4. Anh mở các host bị chặn (danh sách đầu file) để em kiểm giá trên trang gốc không?

## 8. Ghi chú skill
- Skill `find-skills`: skill nghiên cứu phù hợp là `anthropic-skills:deep-research`, **đã có sẵn**, không cần cài thêm. Em không dùng vì nó chạy nhiều agent phụ (tốn), và các trang nguồn đang bị proxy chặn.

## Nguồn (xem 08/11/2026 qua WebSearch)
- Nghị định 91/2020, DNC 5656: [hethongphapluat.com](https://hethongphapluat.com/nghi-dinh-91-2020-nd-cp-ve-chong-tin-nhan-rac-thu-dien-tu-rac-cuoc-goi-rac/chuong-5), [voh.com.vn](https://voh.com.vn/cong-nghe/nhung-diem-moi-cua-nghi-dinh-91-ve-chong-thu-rac-tin-nhan-rac-379453.html)
- Thu hồi 6 brandname: [tuoitre.vn](https://tuoitre.vn/6-brandname-cua-2-doanh-nghiep-bi-thu-hoi-vi-phat-tan-tin-nhan-rac-cuoc-goi-rac-20240909210604468.htm), [vneconomy.vn](https://vneconomy.vn/thu-hoi-6-ten-dinh-danh-doanh-nghiep-vi-phat-tan-tin-nhan-cuoc-goi-rac.htm)
- Dự thảo thay Nghị định 91: [vneconomy.vn](https://vneconomy.vn/de-xuat-thay-nghi-dinh-91-siet-quan-ly-cuoc-goi-va-tin-nhan-rac.htm), [thanhnien.vn](https://thanhnien.vn/bo-cong-an-de-xuat-doanh-nghiep-khong-duoc-che-giau-nguon-goi-khi-quang-cao-185260915123149054.htm), [vnexpress.net](https://vnexpress.net/bo-cong-an-de-xuat-nhieu-co-che-moi-chong-tin-nhan-cuoc-goi-rac-5120449.html), [luatvietnam.vn](https://luatvietnam.vn/thong-tin/du-thao-nghi-dinh-chong-tin-nhan-rac-thu-dien-tu-rac-va-cuoc-goi-rac-447610-d10.html)
- Luật BVDLCN 2025, Nghị định 356/2025: [luatvietnam.vn](https://luatvietnam.vn/dan-su/nghi-dinh-huong-dan-luat-bao-ve-du-lieu-ca-nhan-2025-la-nghi-dinh-nao-568-103658-article.html), [thuvienphapluat.vn](https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Nghi-dinh-356-2025-ND-CP-huong-dan-Luat-Bao-ve-du-lieu-ca-nhan-687428.aspx), [luatvietan.vn](https://luatvietan.vn/diem-moi-cua-nghi-dinh-356-2025-so-voi-nghi-dinh-13-2023-ve-huong-dan-bao-ve-du-lieu-ca-nhan.html), [EY](https://www.ey.com/content/dam/ey-unified-site/ey-com/vi-vn/technical/tax/documents/ey-vietnam-legal-alert-march-2026-decree-no356-2025-nd-cp-providing-detailed-guidance-for-implementation-of-personal-data-protection-law-viet.pdf)
- CĐT cấm telesale: [tinnhanhchungkhoan.vn](https://www.tinnhanhchungkhoan.vn/ban-nha-bang-telesales-toi-ca-trieu-cuoc-goi-moi-ngay-da-co-chu-dau-tu-ra-lenh-cam-post159698.html)
- Giá sản phẩm: xem link trong bảng mục 5.
