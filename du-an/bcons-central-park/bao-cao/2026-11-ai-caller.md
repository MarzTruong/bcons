# AI Caller cho phễu khách Bcons Central Park

Ngày làm: 08/11/2026. Người làm: Claude (phiên cloud). Trạng thái: **nháp, chờ anh duyệt**.
Bản đọc trên điện thoại (Artifact riêng tư): https://claude.ai/artifact/K87Py8XtdGxgwTXyN3a6ch (nguồn trang: `2026-11-ai-caller.html`).

> **Cách nghiên cứu.** Bản đầu (sáng 08/11) chỉ dùng kết quả tìm kiếm vì proxy chặn trang nhà cung cấp. Anh đã duyệt mở host; bản này (08/11/2026) **mở trang giá gốc** của ElevenLabs, Retell, Vapi, LiveKit, Twilio, OmiCall, Stringee, Viettel AI, và đọc mã nguồn Audiocall, Lampline, Vocode, Pipecat trên GitHub. `thuvienphapluat.vn` tự chặn truy cập tự động (403 từ trang, không phải proxy), nên phần pháp lý vẫn dựa trên báo chí và trang luật khác.

> **Giả định (anh chưa trả lời câu hỏi brainstorm, em đi tiếp với giả định hợp lý):**
> 1. Mục tiêu chính: **gọi lại ngay khách vừa để lại số trên landing**, và **nhắc lịch mở bán 29/11 và 27/12** cho khách đã đồng ý. Chăm khách cũ và nhận cuộc gọi đến là mục tiêu phụ.
> 2. Ngân sách thử: dưới khoảng 1–2 triệu đồng/tháng.
> 3. Kênh hiện có: landing (Cloudflare Pages) → Apps Script → Sheet CRM → báo Telegram. Chưa có tổng đài, chưa có tên định danh (brandname).
> 4. Anh xác nhận (08/11): số gọi lấy từ **data của công ty** và **landing cá nhân** của anh (mục 5).

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

## 5. Nguồn số điện thoại: data công ty và landing của anh

Anh cho biết số gọi lấy từ hai nơi. Mỗi nơi có điều kiện khác nhau:

| Nguồn số | Ai giữ quyền dữ liệu | Điều kiện trước khi AI gọi |
|---|---|---|
| **Data của công ty Bcons PS Land** | Công ty (bên kiểm soát dữ liệu). Anh dùng là xử lý thay công ty | Công ty đồng ý bằng văn bản cho anh dùng, và xác nhận khách đã đồng ý nhận cuộc gọi tư vấn. Gọi qua tổng đài/đầu số của công ty. Không chép data này lên git, Sheet cá nhân hay dịch vụ nước ngoài khi công ty chưa cho |
| **Landing cá nhân của anh** | Anh | Ô đồng ý ghi rõ "nhận cuộc gọi tư vấn, có thể là trợ lý AI, có ghi âm" (hiện chưa ghi). Lọc danh sách từ chối (tab TuChoi) trước mỗi lượt gọi |

Cả hai nguồn: gọi để giới thiệu dự án là **cuộc gọi quảng cáo** theo Nghị định 91/2020, nên phải có đồng ý trước, tên định danh, và không gọi số trong danh sách không quảng cáo (DNC). Vì vậy đường gọi ra hợp lệ nhất là **tổng đài trong nước đứng tên công ty**, không phải số nước ngoài.

## 6. So sánh chi phí (giá mở trang gốc ngày 08/11/2026)

### 6.1 Điểm mấu chốt: cước gọi về di động Việt Nam

Mọi bộ công cụ nước ngoài (ElevenLabs, Retell, Vapi, LiveKit, Pipecat, Audiocall, Lampline) đều cần một nhà mạng để gọi ra số Việt Nam. Twilio tính **$0,1777/phút gọi di động Việt Nam**, $0,1947/phút gọi số bàn ([twilio.com/en-us/voice/pricing/vn](https://www.twilio.com/en-us/voice/pricing/vn)). Khoản này **lớn hơn cả phần AI** (thường $0,02–0,18/phút), và số gọi đến khách là số nước ngoài, không phải tên định danh. Em chưa kiểm Twilio có cấp số Việt Nam không.

### 6.2 Bảng giá từng lựa chọn

| Lựa chọn | Loại | Giá phần AI/nền tảng (nguồn) | Gọi ra di động VN | Tiếng Việt / giọng Nam | Hợp Bcons |
|---|---|---|---|---|---|
| **ElevenLabs Agents** | Dịch vụ | $0,08/phút; gói Creator $22/tháng có 275 phút, Pro $99 có 1.238 phút; vượt đồng thời $0,16/phút; LLM tính riêng ([elevenlabs.io/pricing/agents](https://elevenlabs.io/pricing/agents)) | + Twilio $0,1777 | Có, giọng anh đã duyệt | **Cao cho gọi trên web** |
| **Retell AI** | Dịch vụ | $0,07–0,31/phút; ví dụ trang: LLM $0,04 + hạ tầng $0,055 + giọng $0,015 = $0,11; giọng ElevenLabs v4 Turbo $0,08 ([retellai.com/pricing](https://www.retellai.com/pricing)) | + Twilio $0,1777 | Tùy giọng | Trung bình |
| **Vapi** | Dịch vụ | $0,05/phút hosting + Deepgram ~$0,0097 + OpenAI $0,0077–0,0452 + ElevenLabs $0,0146–0,0238; $5 dùng thử ([vapi.ai/pricing](https://vapi.ai/pricing)) | + Twilio $0,1777 | Tùy giọng | Thấp |
| **LiveKit Agents** | Mã nguồn mở + dịch vụ đám mây | Ví dụ trang: phiên agent $0,01 + LLM $0,0014 + STT $0,0075 + TTS $0,009 + giám sát $0,01 + điện thoại Mỹ $0,01 = **$0,0479/phút**; gói Build $0, Ship $50/tháng ([livekit.com/pricing](https://livekit.com/pricing)) | + Twilio $0,1777 (+ SIP $0,004) | Tùy model STT/TTS chọn | Trung bình (cần lập trình) |
| **Pipecat** | Mã nguồn mở (cập nhật 07/11/2026) | Miễn phí; trả tiền model + máy chủ. Lampline (chạy trên Pipecat) ước tính model $0,0153/phút (Deepgram + Claude Haiku + Fish Audio) hoặc $0,0303 (toàn Google) ([COSTS.md](https://github.com/C4rohan/lampline/blob/main/costs/COSTS.md)) | + Twilio $0,1777 | Tùy model | Trung bình (cần lập trình + máy chủ) |
| **Iamsdt/audiocall** | Mã nguồn mở, khoảng 500 dòng Python (cập nhật 24/3/2026) | Gemini Live API (em chưa tính giá) + máy chủ; chỉ chạy qua Twilio ([github.com/Iamsdt/audiocall](https://github.com/Iamsdt/audiocall)) | + Twilio $0,1777 | Gemini tự trả lời theo ngôn ngữ khách; giọng mặc định "Puck", chưa có giọng Nam | Thấp (mẫu demo, kịch bản mặc định là tuyển dụng) |
| **Vocode** | Mã nguồn mở | Miễn phí, nhưng **ngừng cập nhật từ 15/11/2024** ([github.com/vocodedev/vocode-core](https://github.com/vocodedev/vocode-core)) | + Twilio | – | **Loại** |
| **Lampline** | Mã nguồn mở Apache-2.0 (cập nhật 29/10/2026) | Miễn phí; chủ yếu là **công cụ kiểm thử** agent điện thoại (Dialogflow CX), có thể chạy agent qua Twilio/Telnyx/SIP ([github.com/C4rohan/lampline](https://github.com/C4rohan/lampline)) | + nhà mạng | Tùy model | Thấp để gọi khách; có thể dùng để **chấm thử kịch bản** |
| **OmiCall – Contact Center AI** | Tổng đài Việt Nam | **280.000đ/user/tháng**, trả theo block 6 tháng (1.680.000đ/user), có AI Callbot, giọng nam/nữ 3 miền, chuyển máy telesale khi khách quan tâm ([omicall.com/bang-gia](https://omicall.com/bang-gia/), [omicall.com/tong-dai-ai](https://omicall.com/tong-dai-ai/)) | Chưa công bố cước và phí phút callbot | Có giọng miền Nam | **Cao cho gọi ra** (qua công ty) |
| **Stringee Call API** | Hạ tầng gọi Việt Nam | Phần mềm: gói Miễn phí 1.500 phút/tháng, gói Chuẩn 15.000.000đ/năm (11.111 phút), vượt 150đ/phút; **chưa gồm cước nhà mạng** ([stringee.com/vi/pricing-call](https://stringee.com/vi/pricing-call)) | Cước nhà mạng chưa công bố | Không có AI sẵn, phải ghép | Trung bình (cầu nối) |
| **Viettel AI** | Dịch vụ VN | "Cung cấp theo yêu cầu", liên hệ viettelai@viettel.com.vn ([viettelai.vn/bang-gia](https://viettelai.vn/bang-gia)) | – | Có | Thấp (cá nhân khó mua) |
| **Vbee AICall, FPT AI** | Dịch vụ VN | Trang chủ không có giá ([vbee.ai](https://vbee.ai), [fpt.ai](https://fpt.ai/vi/)) | – | Có | Thấp–trung bình |

### 6.3 Chi phí ước tính theo tháng (em tự tính từ giá trên, USD, chưa gồm thuế)

Giả định: mỗi cuộc 3 phút. Kịch bản nhỏ 100 cuộc = 300 phút; kịch bản vừa 500 cuộc = 1.500 phút. Chưa tính LLM ở ElevenLabs, máy chủ ở bộ tự dựng, công lập trình.

| Lựa chọn | 300 phút/tháng | 1.500 phút/tháng | Ghi chú |
|---|---|---|---|
| ElevenLabs **gọi trên web** (không nhà mạng) | ~$24 (Creator $22 + 25 phút × $0,08) | ~$120 | Rẻ nhất, hợp pháp nhất, không cần số |
| LiveKit **gọi trên web** | ~$11 ($0,0379/phút) | ~$57 | Cần lập trình |
| ElevenLabs + Twilio gọi di động VN | ~$77 | ~$387 | Twilio chiếm khoảng 70% |
| Retell + Twilio | ~$86–106 | ~$432–529 | Tùy giọng |
| Vapi + Twilio | ~$78–92 | ~$390–460 | |
| LiveKit Cloud + Twilio | ~$66 | ~$329 | |
| Pipecat tự dựng + Twilio | ~$59 + máy chủ | ~$296 + máy chủ | |
| Audiocall + Twilio | ~$53 + Gemini + máy chủ | ~$267 + Gemini + máy chủ | |
| OmiCall Contact Center AI (1 user) | 280.000đ/tháng, trả trước 1.680.000đ | như cột trái | **Chưa gồm cước và phí phút callbot**: phải xin báo giá |

**Nhận xét:**
- Gọi ra di động Việt Nam qua bộ nước ngoài tốn **$0,18–0,35/phút**, phần lớn là cước Twilio, và vẫn **sai Nghị định 91** vì không có tên định danh. Mã nguồn mở (LiveKit, Pipecat, Audiocall) chỉ tiết kiệm phần AI, không tiết kiệm cước, lại thêm công lập trình và máy chủ.
- Gọi trên web (khách bấm nút trên landing) bỏ được cước và rủi ro pháp lý: ElevenLabs khoảng $24/300 phút.
- Gọi ra hợp lệ: tổng đài Việt Nam đứng tên công ty. OmiCall có giá công khai và có callbot giọng 3 miền; còn thiếu phí phút callbot và cước.

## 7. Đề xuất

1. **Landing: nút "Nói chuyện với trợ lý" bằng ElevenLabs Agents.** Khoảng $22–24/tháng cho 300 phút. Giọng miền Nam anh đã duyệt, không cần số điện thoại, kết quả đẩy về Apps Script → Sheet + Telegram như hiện nay.
2. **Gọi ra (data công ty + lead landing): qua tổng đài của công ty, ứng viên OmiCall Contact Center AI.** Anh hỏi công ty trước: có tổng đài/tên định danh chưa, có cho dùng data và callbot không. Nếu có, em xin báo giá OmiCall (phí phút callbot, cước di động, số user tối thiểu cho gói AI).
3. **Không dùng:** Vocode (ngừng cập nhật), Audiocall (mẫu demo), số Twilio nước ngoài để gọi khách. LiveKit/Pipecat chỉ đáng làm khi số phút lớn (hàng chục ngàn phút/tháng) và có người lập trình, vì khi đó phần AI mới chênh nhiều.
4. **Lampline:** có thể dùng sau này để chấm thử kịch bản trợ lý (gọi giả lập, kiểm agent không nói sai giá, không hứa lợi nhuận) trước khi bật thật.

### Kế hoạch thử nghiệm nhỏ (2 tuần)
1. Anh hỏi công ty: tổng đài, tên định danh, quyền dùng data công ty, có cho dùng giọng AI không.
2. Em sửa câu đồng ý trên landing (thêm "trợ lý AI", "ghi âm"); dùng tab **TuChoi** làm danh sách từ chối.
3. Dựng agent ElevenLabs (kịch bản để anh duyệt), thử nội bộ 20 cuộc.
4. Bật trên landing 2 tuần, trần chi phí khoảng $25. Đo số cuộc, số khách để lại số, than phiền, lần nói sai.
5. Anh xem kết quả rồi quyết định bước tổng đài. Không cam kết số khách hay doanh số.

Việc tốn tiền (tạo agent, nạp credit) và sửa landing chỉ làm sau khi anh nói "OK".

## 8. Câu hỏi cho anh
1. Mục tiêu đúng như giả định chưa (gọi lại lead landing + nhắc mở bán), hay anh muốn nhận cuộc gọi đến là chính?
2. Ngân sách thử tối đa mỗi tháng?
3. Công ty Bcons PS Land có tổng đài/brandname không, có cho sale dùng giọng AI không?
4. Công ty cho anh dùng data khách để gọi bằng trợ lý AI không, qua tổng đài nào?

## 9. Ghi chú skill
- Skill `find-skills`: skill nghiên cứu phù hợp là `anthropic-skills:deep-research`, **đã có sẵn**, không cần cài thêm. Em không dùng vì nó chạy nhiều agent phụ (tốn), và các trang nguồn đang bị proxy chặn.

## Nguồn pháp lý (xem 08/11/2026 qua WebSearch; nguồn giá nằm trong bảng mục 6)
- Nghị định 91/2020, DNC 5656: [hethongphapluat.com](https://hethongphapluat.com/nghi-dinh-91-2020-nd-cp-ve-chong-tin-nhan-rac-thu-dien-tu-rac-cuoc-goi-rac/chuong-5), [voh.com.vn](https://voh.com.vn/cong-nghe/nhung-diem-moi-cua-nghi-dinh-91-ve-chong-thu-rac-tin-nhan-rac-379453.html)
- Thu hồi 6 brandname: [tuoitre.vn](https://tuoitre.vn/6-brandname-cua-2-doanh-nghiep-bi-thu-hoi-vi-phat-tan-tin-nhan-rac-cuoc-goi-rac-20240909210604468.htm), [vneconomy.vn](https://vneconomy.vn/thu-hoi-6-ten-dinh-danh-doanh-nghiep-vi-phat-tan-tin-nhan-cuoc-goi-rac.htm)
- Dự thảo thay Nghị định 91: [vneconomy.vn](https://vneconomy.vn/de-xuat-thay-nghi-dinh-91-siet-quan-ly-cuoc-goi-va-tin-nhan-rac.htm), [thanhnien.vn](https://thanhnien.vn/bo-cong-an-de-xuat-doanh-nghiep-khong-duoc-che-giau-nguon-goi-khi-quang-cao-185260915123149054.htm), [vnexpress.net](https://vnexpress.net/bo-cong-an-de-xuat-nhieu-co-che-moi-chong-tin-nhan-cuoc-goi-rac-5120449.html), [luatvietnam.vn](https://luatvietnam.vn/thong-tin/du-thao-nghi-dinh-chong-tin-nhan-rac-thu-dien-tu-rac-va-cuoc-goi-rac-447610-d10.html)
- Luật BVDLCN 2025, Nghị định 356/2025: [luatvietnam.vn](https://luatvietnam.vn/dan-su/nghi-dinh-huong-dan-luat-bao-ve-du-lieu-ca-nhan-2025-la-nghi-dinh-nao-568-103658-article.html), [thuvienphapluat.vn](https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Nghi-dinh-356-2025-ND-CP-huong-dan-Luat-Bao-ve-du-lieu-ca-nhan-687428.aspx), [luatvietan.vn](https://luatvietan.vn/diem-moi-cua-nghi-dinh-356-2025-so-voi-nghi-dinh-13-2023-ve-huong-dan-bao-ve-du-lieu-ca-nhan.html), [EY](https://www.ey.com/content/dam/ey-unified-site/ey-com/vi-vn/technical/tax/documents/ey-vietnam-legal-alert-march-2026-decree-no356-2025-nd-cp-providing-detailed-guidance-for-implementation-of-personal-data-protection-law-viet.pdf)
- CĐT cấm telesale: [tinnhanhchungkhoan.vn](https://www.tinnhanhchungkhoan.vn/ban-nha-bang-telesales-toi-ca-trieu-cuoc-goi-moi-ngay-da-co-chu-dau-tu-ra-lenh-cam-post159698.html)
- Giá sản phẩm: xem link trong bảng mục 6.
