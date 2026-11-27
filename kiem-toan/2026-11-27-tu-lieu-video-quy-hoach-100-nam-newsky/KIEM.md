# Kiểm AGY: bộ tư liệu video "Quy hoạch 100 năm, QL13, lãi suất, giá thị trường" (27/11/2026)

Nguồn: Drive `den-claude/2026-11-27-tu-lieu-video-quy-hoach-100-nam-newsky/…md`. Em mở lại 8 link bằng curl (cả 8 trả 200) và đối chiếu `du-an/bcons-newsky/` (`thong-tin.md`, `nguon/pttt-cdt.json`). Chỉ kiểm nội dung.

## Đúng (đã khớp nguồn)
- Quy hoạch (Tuổi Trẻ 16/11): QĐ 7308 ngày 31/10, 6.772,59 km², 168 đơn vị, 5 cực động lực, Cực đổi mới sáng tạo phía Đông gồm Thủ Đức, Thuận An, Dĩ An, Tân Uyên. GRDP 10%/năm, 200–225 tỷ USD, 14.500 / 25.000 / 75.000 USD (Báo Đầu tư).
- Metro số 2 (Tuổi Trẻ 05/10): 33,2 km, 17,8 km ngầm, 24 ga, ga C10 trước BV Quốc tế Becamex và Lotte Mart Bình Dương, khởi công tháng 12/2026.
- QL13 (Tuổi Trẻ 05/10): 6 lên 8 làn; đoạn TP.HCM 5,9 km, 10–14 làn, 60 m, khởi công 29/8, dự kiến xong 2028.
- Lãi vay (VnExpress, DKRA): 11 ngân hàng, cố định 12 tháng 9,5–12%; Standard Chartered/Hong Leong 9,8%, VCB/BIDV ~10%, VietinBank 10,2%, Techcombank 10,8%, VPBank 11,5%; thả nổi 13–16%, phí trả nợ trước hạn 4–5%; 46 ngân hàng giảm lãi huy động 0,5–0,7 điểm.
- Giá thị trường: One Mount: TP.HCM cũ ~104, Bình Dương cũ ~60 triệu/m².
- Số dự án khớp `thong-tin.md`: PTTT 09 từ ~45,2 triệu/m² tim tường; 2PN-1WC 2,56–2,70 tỷ (PTTT 08: 2,42–2,55); 2PN-2WC 2,75–3,50 tỷ (PTTT 08: 2,59–3,30); chiết khấu PTTT 08 5,65%, PTTT 10 2,15%; thuê lại 11/13/14/15 triệu, 24 tháng.

## Sai hoặc không có trong nguồn (không dùng)
1. **"QL13 thành Trục Bắc–Nam 1, Lái Thiêu vào Cực…" (hook video 1) dễ hiểu sai.** Tuổi Trẻ 17/11 ghi trục Bắc–Nam 1 *bắt đầu từ nút giao QL13 – Vành đai 3*, đi QL13 – Xô Viết Nghệ Tĩnh – Nguyễn Thị Minh Khai… về Thủ Thiêm – Cần Giờ. Nút giao đó ở phía TP.HCM; Lái Thiêu nằm xa hơn về phía bắc, bài không nói trục kéo tới Lái Thiêu. Bài cũng không có "tối thiểu 4 làn". Chỉ được nói: "trục Bắc–Nam 1 bắt đầu từ QL13 giao Vành đai 3", kèm Newsky mặt tiền QL13.
2. **Cực đổi mới sáng tạo**: bài nêu *Thuận An*, không nêu Lái Thiêu. Nói "khu vực Thuận An (Bình Dương cũ)", không "Lái Thiêu nằm trong cực".
3. **"Bình Dương 8 làn xong Q4/2026"** (video 1): không có trong nguồn. Bài 05/10 chỉ nói đơn vị phấn đấu xong phần tuyến đường trong tháng 10. Bỏ.
4. **"Mở lại giao lộ cầu Phú Long từ 10/2026"**: chỉ là tiêu đề bài liên quan ("Đọc ngay") nằm trong trang, không phải nội dung bài, không có ngày. Bỏ. "Đã tháo cổng chào" sai thì: nguồn ghi đang tháo dỡ.
5. **"Ga C10 ngay tại Lái Thiêu"**: nguồn không nêu phường. Chỉ nói "trước BV Quốc tế Becamex và Lotte Mart Bình Dương".
6. **"Nhiều nhà thầu quan tâm đến 21/11"**: nguồn 05/10 không có. Bỏ.
7. **Giá 69,3 triệu/m²** (Tuổi Trẻ 13/11) là giá sơ cấp trung bình tại **TP.HCM** tháng 10 theo DKRA, không phải "TP.HCM và phụ cận" hay "dọc QL13 và metro". **"10.000 căn"**: DKRA dự báo quý IV có 7.000–10.000 căn; nói "7.000–10.000".
8. **"104–110 triệu/m² và Knight Frank"**: nguồn chỉ có 104 (One Mount). Bỏ 110 và Knight Frank.
9. **"221/TB-BPS"**: không có trong repo, chưa kiểm được. Không dùng.
10. **PTTT 09**: nguồn ghi "không quá 24 tháng **kể từ thông báo bàn giao**" (`pttt-cdt.json`), AGY viết "24 tháng sau nhận nhà". Dùng đúng chữ nguồn.

## Đụng quy tắc / quyết định của anh (cần tránh khi làm video)
- **Video 3 (dòng tiền thuê): "tiền thuê bù phần lớn lãi vay 2 năm đầu"**: vi phạm quy tắc (không tính lợi suất, không nói bù lãi vay, không hứa lợi nhuận). Bỏ câu này.
- **Video 3: "264–360 triệu"**: số tự cộng (11–15 triệu x 24), thông báo chỉ ghi mức tháng; anh dặn nêu đúng nguyên văn, không tính lợi suất. Không dùng.
- **Video 3: thiếu "một số căn"**: thuê lại chỉ áp dụng cho 594 căn trong danh sách (anh chốt 15/11). Bắt buộc có "một số căn" trong lời hoặc caption. "Nhận nhà chưa cần sắm nội thất…" ám chỉ mọi căn: bỏ.
- **Video 1: dùng metro cho Newsky**: anh đã chốt không dùng metro cho Newsky. Bỏ phần metro khỏi video Newsky (giữ lại chỉ làm tư liệu).
- **Video 4: "tìm đâu rổ hàng từ ~45 triệu/m² ngay mặt tiền QL13"**: video Newsky 5 đã chốt không nói đơn giá Newsky, không so phần trăm. Giữ đúng quyết định đó.
- **"Giúp tránh cú sốc trả nợ"** (PTTT 09): lời hứa kết quả; bỏ. Trần 6,9% chỉ nói kèm điều kiện (tối đa 48 tháng, không quá 24 tháng kể từ thông báo bàn giao, CĐT bù chênh lệch, chỉ cá nhân).

## Việc cần anh quyết
Chọn góc nào làm video tiếp? Em đề xuất 2 góc sạch nhất:
1. **Lãi vay 11/2026 (số đã kiểm đủ)** ghép PTTT 09 trần 6,9% đúng điều kiện (không metro).
2. **Quy hoạch 100 năm**: chỉ dùng 4 ý đã kiểm (QĐ 7308 công bố 16/11, Cực đổi mới sáng tạo phía Đông có Thuận An, Trục Bắc–Nam 1 bắt đầu từ QL13 giao Vành đai 3, QL13 đoạn TP.HCM xong 2028), nói đúng phạm vi, không nối thẳng tới Lái Thiêu.
