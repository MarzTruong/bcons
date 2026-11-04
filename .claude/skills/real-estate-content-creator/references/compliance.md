# Compliance and fact rules

Re-read `CLAUDE.md` in the repo too: if it has a newer decision than this file, the newer decision wins.

## General (all projects)

- No promised profit, rental yield or price increase ("chắc chắn tăng", "x2 sau 3 năm", "cho thuê bao lời"). You may show a scenario with labeled assumptions; you may not promise an outcome.
- No "sắp hết", "chỉ còn X căn", "cháy hàng" unless the user just confirmed the current unit status — the price file is a snapshot and goes stale.
- No comparison with a named competitor project using numbers that have no source.
- No content aimed at foreign buyers (Bcons does not sell to foreigners).
- Bank names + rates: only with source and date on screen/in post, because rates move monthly.
- Market statistics: publisher + publication date. Prefer official or major outlets (sbv.gov.vn, gso.gov.vn, chinhphu.vn, dongnai.gov.vn, VnExpress, CafeF, VnEconomy, Báo Đầu tư, VARS).
- Administrative names: since the 2025 mergers, Bình Dương and Dĩ An belong to TP.HCM and Biên Hòa is in TP. Đồng Nai. Use the naming the project file uses; when you use an old name for familiarity, add the new one once ("Dĩ An (nay thuộc TP.HCM)").
- Location claims must be literally true for that project. Bcons Central Park is in Tam Hiệp, Biên Hòa — do not call it "giáp Thủ Đức", "TOD Metro số 1" or "cạnh Dĩ An". Distances/travel times only with a source or as `[Cần bổ sung: thời gian di chuyển thực tế, đo Google Maps]`.

## Contact / CTA

- **Social posts** (Facebook, Zalo, Threads): end with `Tuấn - 0938.32.31.39`.
- **Video scripts** (VO and on-screen text): no phone number and no personal name (Tuấn decided 04/11/2026). CTA = comment/inbox ("comment 'bảng tính' em gửi file", "nhắn tin để nhận bảng giá theo căn"). The closing scene shows project info only (name, address). The caption may say "inbox" but also no phone.
- Add a short note like "Thông tin tham khảo theo chính sách CĐT tại thời điểm <ngày>, chi tiết theo hợp đồng." when prices or payment policies are mentioned.

## Bcons Central Park specifics

Source of truth: `docs/bcons-central-park.md`. These are the details most often gotten wrong:

- Scale: 5 tháp, 22 tầng nổi, **2.820 căn ở + 113 căn thương mại** (not "~2.800"), 60 tiện ích. Bàn giao **dự kiến Quý II/2029**.
- Prices in the file are **chưa VAT**. Whenever you mention a price, say "chưa VAT" and that there is a **2% phí bảo trì** on top. Do not compute a with-VAT price yourself (VAT on apartments excludes land-use value, and the file doesn't give that split) → `[Cần bổ sung: giá đã gồm VAT theo bảng tính CĐT]` if needed.
- PTTT discounts: PTTT 01 = −8,5% vs PTTT 02; PTTT 04/05 = −2,45% vs PTTT 02 (the PTTT 04/05 prices in the Master File are self-computed, CĐT hasn't issued a separate price list — say "tạm tính"). PTTT 03 discount is "theo thông báo (chưa ghi rõ)" → placeholder.
- **Interest cap 6,9%/năm applies only to PTTT 03 and PTTT 04. PTTT 05 has NO cap** (only "hỗ trợ lãi và ân hạn gốc tối đa 24 tháng"). PTTT 02 also = support up to 24 months, no cap.
- Cap duration is inconsistent between documents (PTTT 03: tối đa 48 tháng, không quá 24 tháng từ thông báo bàn giao; PTTT 04 detail says gói cố định tối đa 30 tháng tại MB). Don't state the duration for PTTT 04 unless the user confirms → placeholder.
- Bank: MB Bank (bảo lãnh + cho vay). Don't name other banks as lenders for this project.
- Units with status "CĐT LOCK" are not on sale: never advertise them. "Đã cọc" = sold.
- Price table status is a snapshot (30/10/2026). Unit availability claims need a fresh check.
- Sales events: đợt 2 29/11/2026, đợt 3 27/12/2026 — check the file in case dates changed.
- Old prompt files in the repo (`huong_dan_su_dung_prompt_remotion_bcons.md`, `prompt_cao_du_lieu_...md`) contain example numbers (85 triệu/m², 49,9 triệu/m², 6,2%, "tiết kiệm 60%") that have no source: never use them.

## Pre-publish checklist (copy into the output file)

- [ ] Mỗi số có nguồn (file dự án hoặc nguồn + ngày + link) trong Bảng nguồn
- [ ] Giá có ghi "chưa VAT" + phí bảo trì 2%
- [ ] Lãi trần 6,9% chỉ gắn với PTTT 03/04
- [ ] Không hứa lợi nhuận / tăng giá; giả định được ghi "(giả định)"
- [ ] Không "sắp hết"/"chỉ còn" khi chưa kiểm tra tình trạng căn; không quảng cáo căn CĐT LOCK
- [ ] Hạ tầng tương lai ghi rõ "dự kiến/kế hoạch" + ngày nguồn
- [ ] Có ít nhất một điểm đánh đổi thật (trade-off)
- [ ] Video: không số điện thoại, không tên cá nhân. Bài đăng: có "Tuấn - 0938.32.31.39"
- [ ] Không từ ngữ hype (xem voice-and-hooks.md)
- [ ] Anh duyệt toàn bộ trước khi đăng (công ty chưa ban hành quy định nội dung)
