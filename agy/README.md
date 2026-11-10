# agy/ — chỗ làm việc của Antigravity (AGY)

**Bắt đầu đọc từ file này.** AGY chỉ ĐỌC repo `MarzTruong/bcons`: không commit, không push, không sửa hay viết code trong repo (anh chốt 10/11/2026). Việc của AGY là làm ra tài liệu, bản mẫu, bản nháp rồi để vào thư mục bàn giao. Claude Code đọc, đối chiếu với repo, rồi mới đưa vào repo.

## Chỗ chạy (anh chốt 10/11/2026)
AGY chạy trên PC của anh, trong **bản sao riêng `E:\Claude\bcons-agy`**, không mở thư mục bot `E:\Claude\bcons` (thư mục đó có `.env`, `data/`, `anh/`). Bản sao lấy từ GitHub nên không có dữ liệu nội bộ; quyền push đã tắt (`git remote set-url --push origin DISABLED`).
- **Đầu mỗi việc: chạy `git pull`** trong bản sao rồi mới đọc nhiệm vụ (không pull sẽ làm việc trên bản cũ).
- Cần chạy thử (landing, test): `npm ci` trong `engine/landing` hoặc `engine/remotion` của bản sao. Không có khóa API nên không gọi được ElevenLabs/Gemini, đúng ý.
- Claude chạy trên cloud, **không đọc được bản sao trên PC**: mọi thành phẩm (báo cáo, HTML, ảnh chụp) phải lưu vào thư mục bàn giao Drive bên dưới, không để lại trong bản sao.
- Không đọc `E:\Claude\bcons`, `data/`, `anh/`, `.env`, và không chép dữ liệu trong đó vào báo cáo. Cần bảng giá để thiết kế thì dùng số trong `du-an/<mã>/thong-tin.md` hoặc file giá công khai Claude đính kèm trong nhiệm vụ.

## Thế mạnh của AGY và việc giao (theo báo cáo đề xuất vận hành 09/11/2026, đã đối chiếu)
| Loại việc | AGY làm | Skill / lệnh tắt | Claude làm tiếp |
|---|---|---|---|
| Nghiên cứu thị trường có nguồn | Tìm báo chính thống 30 ngày gần nhất, ra bảng 6 cột | skill `bcons-nghien-cuu`, lệnh `/nghien-cuu` | Cổng 1: mở từng link kiểm, loại số sai, rồi viết kịch bản |
| Kiểm toán độc lập (CISA, bảo mật, rớt lead, pháp lý) | Đọc repo, chạy test, ra báo cáo có file:dòng | skill `bcons-kiem-toan`, lệnh `/kiem-toan` | Đối chiếu từng mã, ghi `phan-hoi.md`, sửa phát hiện đúng |
| Thiết kế giao diện (landing, thẻ, banner) | Dựng **bản mẫu HTML + ảnh chụp** cho anh chọn | skill `bcons-thiet-ke`, lệnh `/thiet-ke` | Chụp ảnh mẫu cho anh chọn; được chọn thì tích hợp vào `engine/landing` và chạy test |
| Content creator: bài đăng Zalo từ kịch bản video | Đọc `kich-ban.md` + bảng nguồn + `spec.json` của từng video, viết một bài Zalo cho mỗi video (như caption FB/TikTok, thêm nền tảng thứ ba) | skill `bcons-content-zalo`, lệnh `/zalo` | Lưu `video/<tên>/zalo.md`, chạy kiểm quy tắc cứng, đưa anh duyệt |

AGY **không** làm: video Remotion, giọng ElevenLabs, bot Telegram, sửa `engine/`, đăng bài, nhắn khách.

## Nhận việc
Việc của AGY nằm ở `agy/nhiem-vu/` (Claude viết, mới nhất có ngày lớn nhất; mẫu `agy/nhiem-vu/_mau.md`). Anh cũng có thể giao thẳng bằng lệnh tắt trong khung chat của AGY (ví dụ `/nghien-cuu lãi suất vay mua nhà tháng 11`).

## Trả kết quả (thư mục bàn giao)
- **Drive:** `Bcons/agy/den-claude/<yyyy-mm-dd>-<loại>-<chủ đề>/` (trên máy anh: `G:\My Drive\Bcons\agy\den-claude\`). Loại: `nghien-cuu` | `kiem-toan` | `thiet-ke` | `zalo`.
- File chính `ket-qua.md` theo mẫu `agy/mau/<loại>.md`; dòng đầu ghi commit repo đã đọc (`git log -1`) và nhiệm vụ gốc.
- Không ghi được vào Drive: lưu ở Artifact, anh tải về và gửi cho Claude.
- Xong thì báo anh: "AGY xong việc <tên thư mục>". Anh gọi Claude bằng `/agy-doc`.

## Luật chung (không nới)
1. Đọc `CLAUDE.md` mục "Quy tắc cứng" và "Quy tắc nào được hiện cho khách xem" trước khi viết bất kỳ nội dung nào.
2. Số liệu dự án chỉ lấy từ `du-an/<mã>/project.json`, `thong-tin.md`, `nguon/pttt-cdt.json`. Thiếu thì ghi "chưa có", không đoán.
3. Không đưa số liệu không có link gốc đã mở. Không tự viết link. Không dùng số mẫu cũ (85 triệu/m², 49,9 triệu/m², 6,2%, "tiết kiệm 60%").
4. Không cam kết lợi nhuận, không hứa tăng giá, không "sắp hết", không quảng cáo căn CĐT LOCK, căn đã cọc là đã bán. Giá thì nói chưa VAT hay có VAT và phí bảo trì 2%. Trần lãi 6,9% chỉ PTTT 03 và 04, **không** có ở PTTT 05.
5. SĐT chỉ ghi số trong `project.json` → `lienHe`, và chỉ ở caption chữ (không trên hình/video).
6. Căn cứ pháp lý hiện hành: Luật Bảo vệ dữ liệu cá nhân 2025 + Nghị định 356/2025/NĐ-CP (Nghị định 13/2023 đã bị thay thế), Nghị định 91/2020 cho cuộc gọi/tin nhắn quảng cáo. Không dùng Nghị định 13/2023.
7. "No AI Slop": xem `CLAUDE.md`. Không bảng màu tự đặt khi chưa được anh chọn; thiết kế mới luôn đưa ít nhất 2 phương án để anh chọn.
8. Không chép dữ liệu khách, hoa hồng, `.env`, API key vào bất kỳ file nào.
