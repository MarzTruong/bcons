# Quy tắc viết số trên màn hình (chuẩn hóa số, ITN)

Anh yêu cầu 07/11/2026. **Chữ đọc** (giọng ElevenLabs) và **chữ hiện** (phụ đề, thẻ số) tách riêng bằng cú pháp `hiện{đọc}`: giọng đọc tự nhiên, màn hình hiện số gọn. Tiếng Anh gọi là *Inverse Text Normalization (ITN)* / *subtitle number formatting*.

`npm run lint` chặn chữ hiện sai quy tắc. Sửa video đã có giọng mà lời đọc giữ nguyên: sửa `markup` rồi chạy `npm run phu-de -- <tên>`, không cần tạo giọng lại, không tốn credit. Code: `engine/remotion/scripts/itn.mjs` (`checkSpelledNumbers`, `fixMarkup`), `spec-tools.mjs` (`checkShownSymbols`).

| Loại | Hiện trên màn hình | Đọc (trong `{}`) | Ghi chú |
|---|---|---|---|
| Mọi số đếm, kể cả 1–9 | `2 nhóm`, `8 tháng`, `Nhóm 1`, `10`, `236` | hai, tám, một, mười… | Anh đổi 07/11/2026: cứ là số thì hiện chữ số. Giữ chữ khi không phải số đếm: "một lựa chọn", "một số", "đầu tư", "thứ ba", "không có", "11% một năm" (đã thành `11%/năm`) |
| Hàng nghìn | `9.363` | chín ngàn ba trăm sáu mươi ba | Dấu **chấm** ngăn hàng nghìn |
| Thập phân | `4,4`, `99,26` | bốn phẩy bốn | Dấu **phẩy** thập phân |
| Phần trăm | `11%` | mười một phần trăm | Không hiện chữ "phần trăm" |
| Theo năm | `11%/năm`, `6,9%/năm` | … một năm | Không hiện "11% một năm" |
| Khoảng | `13–15%/năm`, `45–50%` | từ … đến … | Đơn vị đặt ở số sau |
| Tiền | `9.363 tỷ đồng`, `1,88 tỷ USD`, `860 ngàn tỷ đồng` | đô la Mỹ… | Giữ chữ "tỷ, triệu, ngàn"; USD thay "đô la" |
| Đơn vị | `335 ha`, `58 km`, `62 m²` | héc-ta, ki-lô-mét, mét vuông | Ký hiệu, số liền đơn vị |
| Năm | `2026`, `2029` | hai ngàn không trăm hai mươi sáu | Năm **không** có dấu chấm |
| Ngày, tháng | `29/11/2026`, `tháng 11/2025` | ngày hai mươi chín tháng mười một… | |
| Quý | `quý II/2029` | quý hai | Số La Mã |
| Tên riêng | `BIDV`, `Bcons Central Park` | bee eye dee vee, Bee Cons… | Hiện đúng tên, đọc theo phiên âm |
| Số điện thoại | không hiện dạng chữ | không đọc | Đã có QR (quy tắc 7) |

Phụ đề: số không bị tách khỏi đơn vị khi xuống dòng; số tự được nhấn màu (`src/captionChunks.ts`, `src/Captions.tsx`).
