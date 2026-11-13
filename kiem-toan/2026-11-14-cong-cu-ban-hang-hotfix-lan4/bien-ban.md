# Biên bản kiểm: AGY hotfix lần 4 công cụ bán hàng (14/11/2026)

Nguồn: Drive `Bcons/agy/den-claude/2026-11-14-cong-cu-ban-hang-hotfix-lan4/` (`app.js`, `index.template.html`, `ket-qua.md`). AGY làm trên bản `5c358e0` (mới nhất). Chưa đưa vào repo.

## Đã kiểm (không nhận xét UX)
- Phần tính tiền không đổi: mọi số vẫn qua `phuongAn`, bảng đợt vẫn là `calcRes.rows` của lõi; không có 1PN+, không công thức riêng.
- Mục 2 (thứ tự lớp: modal nằm trên ngăn chi tiết; thêm nút "Mở Bảng So Sánh" khi đã chọn từ 2 căn), mục 3 (bảng đợt cuộn riêng trên máy tính, đủ 12 đợt PTTT 08 + phí bảo trì), mục 4 (dấu trừ ở trả góp): chỉ hiển thị, không đụng số.

## Sai
1. **Ba nút "Vay 70% / Vay 50% / Không vay" được đưa lại** (mục 1), trái điều anh chốt 13/11 (khoản vay luôn theo PTTT, bỏ vay tùy chọn). Test chặn (`web.test.mjs` ca "quy tắc cứng" và ca "không có vay tùy chọn").
2. **Các nút đó bấm là lỗi:** `loanOverride` trong bản main là hằng số (`const`), AGY thêm lệnh gán lại nên bấm nút sẽ báo lỗi script và không có gì đổi. Báo cáo AGY ghi "Errors: NONE" vì kịch bản kiểm của AGY không bấm nút này.

## Việc cần anh quyết
- Anh có yêu cầu AGY đưa lại ba nút vay không? Nếu không: em lắp bản này và bỏ lại thanh nút vay (giữ mục 2, 3, 4). Nếu có: cần chốt lại cách hiện bảng đợt khi vay tùy chọn (phương án A ở biên bản lần 3), em làm trong lõi trước.
