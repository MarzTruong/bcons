# Giao việc AGY: chỉnh bố cục công cụ bán hàng, mặt bằng rộng hơn (13/11/2026)

Anh dán cho AGY: "Em `git pull` trong `E:\Claude\bcons-agy`, đọc `agy/giao-viec/2026-11-13-cong-cu-ban-hang-bo-cuc.md` rồi làm theo."

## Việc cần làm
Anh dùng bản đã đăng (`engine/banhang/web/index.template.html`, `app.js`; chạy thử bằng `node engine/banhang/build.mjs` rồi mở `engine/banhang/dist/bcons-newsky/index.html#demo` qua một máy chủ tĩnh) và góp ý trên iPad:
1. **Mặt bằng tầng đang nhỏ.** Phải rộng hơn, chữ trên từng căn (mã, loại, giá) đọc được ở khoảng cách tay cầm iPad, ngoài nắng.
2. **Cột bảng tính bên phải đang rộng quá** (thẻ căn, tiền, lịch đợt). Bóp cột này vừa với chữ và số (không cần chừa chỗ thừa), nhường chỗ cho mặt bằng. Hiện lưới chính ở dòng `grid-template-columns: minmax(0, 1.45fr) minmax(370px, 0.95fr)` (khoảng dòng 295 của template); đó chỉ là chỗ để AGY tìm, cách làm AGY tự chọn.

## Giữ nguyên (em đã gắn lõi, test chặn)
- Không đổi `id` các phần tử mà `app.js` và `engine/banhang/web.test.mjs` dùng (`canMa`, `giaChuaVat`, `giaCoVat`, `tuCo`, `khoanVay`, `banGiao`, `traGop`, `canStatus`, `schedBody`, `svgContainer`, `cungVtGrid`, `tangPills`, `loiDuLieu`, các nút `btn*`, `.pttt-btn`, `.loan-pill`, `.tang-btn`, `.unit-vector`, `.vt-card`).
- Không đưa công thức tính tiền vào giao diện (mọi số đi qua `core/tai-chinh.mjs`); không thêm câu hứa lợi nhuận/"sắp hết"; không ghi SĐT chữ trên ảnh xuất.
- Mặt bằng vẫn đủ: giá trên từng căn, dấu giá rẻ block/tầng, danh sách cùng vị trí dưới mặt bằng.

## Kiểm
iPad ngang, iPad dọc, điện thoại 390px (ảnh chụp từng cỡ); số liệu ở thẻ căn vẫn đọc rõ khi cột hẹp lại (số tỷ, số tiền đủ dòng, không cắt chữ).

## Trả kết quả
Drive `Bcons/agy/den-claude/2026-11-13-cong-cu-ban-hang-bo-cuc/`: file `index.template.html` (và `app.js` nếu sửa phần vẽ SVG), ảnh chụp 3 cỡ, `ket-qua.md` ngắn. **Không sửa, commit, push file trong repo.** Anh gọi `/agy-doc`, em chạy test rồi lắp.
