# Biên bản /agy-doc: phân tích 5 video tham khảo (15/11/2026)

Nguồn: Drive `Bcons/agy/den-claude/2026-11-15-phan-tich-video-tham-khao/` (`phan-tich.md`, `ket-qua.md`, `khung/`, kèm `README-TONG-HOP-5-MAU-VIDEO.md`, `remotion-video-props.ts`). Chưa commit/push vào repo.

## AGY làm gì
Xem trực tiếp 5/5 video (khung 4 fps ở 0–3 s, 1 fps phần còn lại, nghe mẫu 0–25 s, đo độ lớn tiếng), điền đủ bảng 8 cột, đưa 8 kỹ thuật có phân việc AGY/Claude. Không đưa khung hình vào repo, không sửa repo.

## Đúng (đã kiểm)
- Xem 2 lưới khung trên Drive (`810f` và `2c51`): khớp mô tả. `810f` có poster đủ chữ ở 0,00 s, số đếm 432 → 487 nghìn tỷ ở 0,75–1,25 s, có dòng hotline chạy mờ (AGY đã cảnh báo đúng). `2c51` giây 0 gần đen, chữ tiêu đề đủ ở ~0,5 s.
- `810f` chính là video Capital Land (Hàng Xanh) mà em lấy phụ đề từ TikTok hôm nay: các số AGY ghi (108 ha = 54,3 + 54,1; 216.000 tỷ cho 51 ha; 15.500 tỷ vốn tự có; 7,3 triệu m² sàn; hơn 4.100 hộ; giá đất mặt tiền; "chỉ là ý tưởng") khớp phụ đề. `cabf` khớp phân tích em làm trước đó (nhịp 1,5–2,2 s, kết "Lưu lại" + câu hỏi).
- Trường `vetChay`, `vienChay`, `drawFrames`, `kind: "illustrative"` đều có thật trong `engine/remotion/src/spec.ts`.
- Kỹ thuật P1 AGY chọn (khung 0 đủ chữ, 0–4 s vào thẳng con số/câu hỏi, câu hỏi chọn A/B ở cuối) trùng checklist em đã ghi vào skill và `docs/quy-trinh-video.md` mục 3b.

## Sai / cần sửa trước khi dùng
1. **Kỹ thuật 2 có số bịa:** ví dụ "Vốn ban đầu 680 triệu…" không có trong nguồn dự án (vi phạm quy tắc 2). Câu "Vì sao Quốc lộ 13 **sắp** lên 8 làn?" cũng sai chữ: nguồn nói "**đang** được làm rộng". Chỉ dùng làm kiểu câu, không dùng số/chữ này.
2. **Kỹ thuật 8, mốc "-16 đến -18 LUFS" chưa có căn cứ:** 5 video đo được -13,0 / -15,8 / -19,7 / -24,8 / -33,8 LUFS (`green skyline` là bản quay màn hình nên không tính). Chưa có số đo video mình. Chỉ ghi "đo bản render của mình rồi so", không đặt chuẩn.
3. **Mốc giây của `green skyline`** không đáng tin (bản quay màn hình có đuôi lặp, nút Play); AGY đã tự ghi rõ, em chỉ dùng kỹ thuật chữ 2 tầng, không dùng nhịp.
4. **Các độ cao chữ (Y%) AGY nêu mâu thuẫn nhau** (chữ ở Y~83% vừa gọi là an toàn, vừa có video chừa 18,5–25% đáy). Chưa chốt vùng an toàn bằng số; việc đó thuộc brief ảnh bìa/AGY, em chưa đưa vào quy trình.
5. **AGY làm thêm ngoài yêu cầu:** `README-TONG-HOP-5-MAU-VIDEO.md` (bản "blueprint" dựng lại 5 video bằng Remotion: nền lưới, thẻ kính mờ, neon) và `remotion-video-props.ts`. Hình thức đó trái "No AI Slop" và chưa ai duyệt; **không tích hợp**. Em không đọc được `remotion-video-props.ts` qua connector (file trả rỗng). Ngoài ra AGY chép bản sao `phan-tich.md`/`ket-qua.md` sang thư mục `2026-11-15-blueprint-video-tham-khao/`, chỉ ghi nhận.
6. Đề xuất "bảng nguồn cuối video" (kỹ thuật 7): video của mình đã có huy hiệu nguồn trên cảnh số liệu; thêm khung nguồn cuối là việc **anh quyết**, em chưa làm.
7. Không kiểm được: tên miền/dự án của người khác nêu trong tài liệu AGY (chỉ để trên Drive, không vào repo); các khung 1 fps ngoài 2 lưới đã mở.

## Việc cần anh quyết
- Duyệt cho em ghép bảng 5 video + kỹ thuật đã lọc (bỏ ví dụ số bịa, bỏ mốc LUFS, không ghi tên thương hiệu/số liệu của họ) vào `docs/phan-tich-video-tham-khao.md`, thêm vào checklist 3b: câu hỏi chọn A/B ở cuối, ghi rõ tình trạng pháp lý của hạ tầng ("ý tưởng / chủ trương / đã duyệt") khi video nói về quy hoạch.
- Duyệt thêm cảnh báo `check-spec` (cảnh 1 dài hơn 14 chữ, tổng lời hơn 100 chữ, cảnh hơn 8 giây) theo kế hoạch ở `docs/phan-tich-video-tham-khao.md` mục 5.
- Giao tiếp AGY `agy/giao-viec/2026-11-15-hook-va-nhip-video.md`: dán dòng giao việc cho AGY khi anh sẵn sàng; không dùng bản blueprint của họ làm đầu vào.
