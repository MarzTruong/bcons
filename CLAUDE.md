# CLAUDE.md — Bcons Central Park (hướng dẫn cho Claude)

## Bối cảnh
- Người dùng là nhân viên kinh doanh của Bcons PS, đang bán dự án **Bcons Central Park** (236 Phan Trung, Tam Hiệp, TP. Đồng Nai / Biên Hòa). Mới chuyển sang bất động sản.
- Mục tiêu của repo: (1) làm nội dung video bất động sản, (2) gửi tin nhắn tự động hàng loạt cho khách hàng.
- Giao tiếp bằng **tiếng Việt**. Người dùng xưng "anh", Claude xưng "em". Trả lời ngắn gọn, nói thẳng, có số liệu.

## Nguồn dữ liệu (đọc trước khi viết nội dung)
- `docs/bcons-central-park.md`: thông tin dự án, 5 phương thức thanh toán, lịch mở bán, tóm tắt bảng giá. Đây là nguồn chính, đã đối chiếu với tài liệu chủ đầu tư.
- `data/bang-gia.csv`: giá và tình trạng từng căn (996 căn). File này **không đưa lên git**.
- Google Drive dự án (thư mục gốc id `1YUrtxPpYrDYCLGKKKXEFfmkreyROMniZ`): training, Q&A, PTTT, TVC, phối cảnh, mặt bằng. Đọc bằng connector Google Drive khi cần.
- Master File (`MasterFile_BconsCentralPark_ver2.xlsx`) do người dùng gửi qua upload. Có sheet GiaTongHop (giá), KhachHang (khách), HoaHong (nội bộ).

## Quy tắc bắt buộc
1. **Không commit dữ liệu cá nhân hoặc nội bộ**: tên/SĐT khách, hoa hồng, thưởng nóng, file xlsx. `data/` và `*.xlsx` đã nằm trong `.gitignore`; giữ nguyên.
2. **Số liệu lấy từ tài liệu chủ đầu tư**, không tự suy ra. Thiếu thì ghi "chưa có" và hỏi lại, không đoán.
3. **Nội dung quảng cáo thận trọng**: không cam kết lợi nhuận, không hứa tăng giá, không so sánh dự án khác bằng số liệu không có nguồn, không nói căn "sắp hết" nếu chưa kiểm tra tình trạng. Công ty chưa gửi quy định nội dung chính thức, nên mọi nội dung đều phải để người dùng duyệt trước khi dùng.
4. **Căn đã cọc = đã bán**, không tư vấn. Căn "CĐT LOCK" chưa mở bán, không quảng cáo.
5. Không bán cho người nước ngoài. Phí bảo trì 2% và VAT phải nói rõ khi nhắc giá.
6. Phân biệt rõ giá **chưa VAT** và **có VAT**; PTTT 01 đã trừ 8,5%, PTTT 04/05 trừ 2,45% so với giá PTTT 02. Lãi suất trần 6,9% chỉ có ở PTTT 03 và 04, **không** có ở PTTT 05.

## Tin nhắn hàng loạt
- Không dùng Zalo/Facebook cá nhân để nhắn hàng loạt (dễ bị khóa). Kênh phù hợp: Zalo OA/ZNS, SMS brandname, email.
- Chỉ nhắn khách đã đồng ý nhận tin; có danh sách từ chối; không gửi trùng; cá nhân hóa theo tên và nhu cầu.
- Chưa chọn kênh gửi (xem `NOTES.md`).

## Quy ước làm việc
- Làm việc trên nhánh `claude/trusting-feynman-1b00ns`. Không tạo PR nếu người dùng chưa yêu cầu.
- Nội dung sản phẩm viết bằng Markdown trong `docs/`; kịch bản video trong `docs/video/`.
- Ngày hiện tại và lịch mở bán xem `docs/bcons-central-park.md`: đợt 2 giới thiệu ngày 29/11/2026, đợt 3 ngày 27/12/2026.
