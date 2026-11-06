// Dựng HTML landing page từ dữ liệu dự án (không đọc file, không gọi mạng: test được).
import { PLANS } from "./calc.mjs";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const nf = new Intl.NumberFormat("vi-VN");
export const ty = (n) => `${(n / 1e9).toFixed(2).replace(".", ",")} tỷ`;
const loaiNhan = (t) => (t === "Studio" ? "Studio" : t.replace("PN", " phòng ngủ").replace("-", ", ").replace("WC", " WC"));

const CSS = `
:root{--bg:#F3F5F1;--surface:#fff;--ink:#15262E;--muted:#47585F;--line:#D2D8D2;--accent:#0F5C45;--accent-ink:#fff;--soft:#E8EDE6;--warn:#7A4F00}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Be Vietnam Pro',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.5}
.wrap{max-width:960px;margin:0 auto;padding:0 16px}
header.hero{background:var(--surface)}
.hero img{width:100%;max-height:420px;object-fit:cover;display:block}
.cap{font-size:11px;color:var(--muted);padding:4px 16px 0;text-align:right}
h1{font-size:24px;line-height:1.25;margin:16px 0 6px}h2{font-size:19px;margin:28px 0 10px}
.sub{color:var(--muted);margin:0 0 12px}
.cta{display:inline-block;background:var(--accent);color:var(--accent-ink);padding:12px 18px;border-radius:10px;font-weight:700;text-decoration:none;margin:8px 0 18px}
ul.hl{padding-left:20px;margin:0}ul.hl li{margin:4px 0}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:10px}
.card{background:var(--surface);border:1.5px solid var(--line);border-radius:12px;padding:12px;cursor:pointer;text-align:left;font:inherit;color:inherit}
.card[aria-pressed=true]{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.card b{font-size:17px}.card .m{color:var(--muted);font-size:13px}.card .p{font-size:20px;font-weight:700;margin-top:6px}
.card .n{font-size:12px;color:var(--muted)}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px;margin-top:10px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.chip{min-height:40px;padding:6px 12px;border-radius:8px;border:1.5px solid var(--line);background:var(--surface);font:inherit;font-weight:600;cursor:pointer}
.chip[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
label{font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:3px}
input,select,textarea{width:100%;height:46px;border:1.5px solid var(--line);border-radius:8px;padding:0 10px;font:inherit;font-size:16px;background:var(--bg);color:var(--ink)}
.kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}
.kv div{background:var(--soft);border-radius:8px;padding:8px 10px;font-weight:700}
.kv span{display:block;font-size:12px;font-weight:500;color:var(--muted)}
.kv .wide{grid-column:1/-1}
.tbl{overflow-x:auto}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums;font-size:13px}
th,td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:11px;color:var(--muted);text-transform:uppercase}
td.r,th.r{text-align:right}tr.bank td{color:var(--muted);background:var(--soft)}
.note{font-size:12.5px;color:var(--muted)}
.card span{display:block}
.consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;font-weight:400;color:var(--ink);margin:12px 0;background:var(--soft);padding:10px;border-radius:8px}
.consent input{width:22px;height:22px;flex:0 0 auto;margin-top:2px;accent-color:var(--accent)}
button.send{width:100%;height:50px;border:0;border-radius:10px;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:700;font-size:16px;cursor:pointer}
button.send:disabled{opacity:.45;cursor:not-allowed}
.hp{position:absolute;left:-5000px;width:1px;height:1px;overflow:hidden}
.ok{background:#E3F2E9;border:1px solid #1B7048;padding:12px;border-radius:10px;font-weight:600}
.err{color:#9B2C1F;font-weight:600;font-size:13px}
footer{margin:32px 0 24px;font-size:12px;color:var(--muted)}footer a{color:var(--muted)}
.draft{background:#7A4F00;color:#fff;text-align:center;padding:6px;font-weight:700}
@media (max-width:520px){.row{grid-template-columns:1fr}h1{font-size:21px}}
`;

function consentText(dongY, projectName) {
  return `Tôi đồng ý để <b>${esc(dongY.nguoiGiu || "[CHƯA ĐIỀN TÊN]")}</b>, ${esc(dongY.vaiTro)}, lưu họ tên, số điện thoại và lựa chọn của tôi trên trang này (căn hộ, phương thức thanh toán, nhu cầu) để liên hệ tư vấn về dự án ${esc(projectName)} qua điện thoại hoặc Zalo. Thông tin chỉ dùng cho mục đích này, không bán hay chia sẻ cho bên khác. Tôi có thể yêu cầu ngừng liên hệ và xóa thông tin bất cứ lúc nào bằng cách ${esc(dongY.kenhNgung)}. <a href="chinh-sach.html">Xem chính sách dữ liệu</a>.`;
}

/** Trang chủ landing. data = landing.json, project = project.json. draft = true thì hiện dải "BẢN NHÁP". */
export function renderPage(data, project, { draft = false } = {}) {
  const units = data.canMau
    .map(
      (u, i) => `<button class="card" type="button" data-i="${i}" aria-pressed="${i === 0}">
  <b>${esc(loaiNhan(u.loai))}</b>
  <span class="m">${esc(String(u.dtTimTuong).replace(".", ","))} m² tim tường · ${esc(String(u.dtThongThuy).replace(".", ","))} m² thông thủy · tháp ${esc(u.thap)}, tầng ${esc(u.tang)}</span>
  <span class="p">${ty(u.giaChuaVat["02"])}</span>
  <span class="n">Giá PTTT 02/03 chưa VAT · có VAT ${ty(u.giaChuaVat["02"] * 1.1)} · phí bảo trì 2% tính riêng</span>
  <span class="n">PTTT 01 (thanh toán giãn, đã trừ 8,5%): ${ty(u.giaChuaVat["01"])} chưa VAT</span>
</button>`,
    )
    .join("\n");
  const json = JSON.stringify({
    canMau: data.canMau.map(({ ma, ...u }) => u), // không đưa mã căn lên trang (giỏ hàng đổi liên tục)
    lai: data.laiGiaDinh,
    nam: data.namGiaDinh,
    formUrl: data.formUrl,
  }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(project.ten)} – Tính dòng tiền căn hộ</title>
<meta name="description" content="${esc(data.moTa)}">
<meta property="og:title" content="${esc(data.tieuDe)}"><meta property="og:description" content="${esc(data.moTa)}">
<meta property="og:image" content="${esc((data.siteUrl ? data.siteUrl.replace(/\/$/, "") + "/" : "") + data.anhChinh.split("/").pop())}">${data.siteUrl ? `<meta property="og:url" content="${esc(data.siteUrl)}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap">
<style>${CSS}</style></head>
<body>
${draft ? '<div class="draft">BẢN NHÁP – chưa đăng chính thức</div>' : ""}
<header class="hero"><img src="${esc(data.anhChinh.split("/").pop())}" alt="Phối cảnh ${esc(project.ten)}"><div class="cap">Hình ảnh phối cảnh mang tính minh họa</div>
<div class="wrap"><h1>${esc(data.tieuDe)}</h1><p class="sub">${esc(data.moTa)}</p><a class="cta" href="#tinh">Tính thử dòng tiền</a></div></header>
<main class="wrap">
<h2>Thông tin dự án</h2>
<ul class="hl">${data.diemNoiBat.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>

<h2 id="tinh">Chọn căn mẫu</h2>
<p class="note">5 căn mẫu, mỗi loại một căn, giá theo ${esc(data.nguonGia)}. Giá và tình trạng từng căn có thể thay đổi; tư vấn viên xác nhận căn còn bán trước khi báo giá chính thức.</p>
<div class="cards" id="cards">
${units}
</div>

<div class="panel">
<p class="note" style="font-weight:700;margin:0">Phương thức thanh toán</p>
<div class="chips" id="plans">${Object.entries(PLANS).map(([k, p], i) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${k === "03"}">${p.name}</button>`).join("")}</div>
<p class="note" id="tag"></p>
<div class="row">
<div><label for="lai">Lãi vay giả định sau ưu đãi (%/năm)</label><input id="lai" inputmode="decimal" value="${String(data.laiGiaDinh).replace(".", ",")}"></div>
<div><label for="nam">Kỳ hạn vay (năm)</label><input id="nam" inputmode="numeric" value="${data.namGiaDinh}"></div>
</div>
<div class="kv" id="kv"></div>
<div class="tbl"><table><thead><tr><th>Đợt</th><th>Nội dung, thời điểm</th><th class="r">%</th><th class="r">Số tiền (đồng)</th></tr></thead><tbody id="rows"></tbody></table></div>
<p class="note">Đợt 2 đã gồm VAT của đợt 1 và 2; các đợt sau đã gồm VAT; đợt sổ hồng không VAT; phí bảo trì 2% đóng cùng đợt nhận nhà. Lãi vay, kỳ hạn là <b>giả định</b> để tham khảo, lãi thực tế theo ngân hàng tại thời điểm vay. Đây là ước tính, không phải cam kết của chủ đầu tư hay ngân hàng.</p>
</div>

<h2 id="dangky">Nhận bảng tính chi tiết theo căn anh/chị quan tâm</h2>
<form class="panel" id="form" novalidate>
<div class="row">
<div><label for="ten">Họ tên</label><input id="ten" name="ten" autocomplete="name" required maxlength="80"></div>
<div><label for="sdt">Số điện thoại / Zalo</label><input id="sdt" name="sdt" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20"></div>
</div>
<div style="margin-top:10px"><label for="nhuCau">Nhu cầu</label><select id="nhuCau" name="nhuCau"><option>Mua để ở</option><option>Mua cho thuê</option><option>Tìm hiểu thêm</option></select></div>
<div class="hp" aria-hidden="true"><label for="hp_x7">Để trống ô này</label><input id="hp_x7" name="hp_x7" tabindex="-1" autocomplete="off"></div>
<label class="consent"><input type="checkbox" id="dongY" name="dongY"><span>${consentText(data.dongY, project.ten)}</span></label>
<button class="send" id="send" type="submit">Gửi, nhận bảng tính chi tiết</button>
<p class="err" id="err" role="alert"></p>
</form>
<div class="ok" id="ok" hidden>Đã nhận thông tin. Tư vấn viên sẽ liên hệ anh/chị qua điện thoại hoặc Zalo sớm nhất.</div>
</main>
<footer class="wrap">
<p>Giá tham khảo theo ${esc(data.nguonGia)}, chưa gồm VAT 10% và phí bảo trì 2% trừ khi ghi rõ. PTTT 01 đã trừ chiết khấu 8,5%, PTTT 04/05 trừ 2,45% so với giá PTTT 02; PTTT 03 không chiết khấu. Lãi suất trần 6,9%/năm chỉ áp dụng cho PTTT 03 và 04 theo điều kiện của chủ đầu tư. Dự án không bán cho người nước ngoài. Nội dung mang tính tham khảo, không cam kết lợi nhuận hay giá trị tăng thêm.</p>
<p>${esc(project.ten)} · ${esc(project.diaChi)} · Chủ đầu tư: ${esc(project.chuDauTu)} · Phân phối: ${esc(project.donViPhanPhoi)}. <a href="chinh-sach.html">Chính sách dữ liệu</a></p>
</footer>
<script id="data" type="application/json">${json}</script>
<script type="module" src="client.js"></script>
</body></html>
`;
}

/** Trang chính sách dữ liệu (Nghị định 13/2023). */
export function renderPolicy(data, project) {
  const d = data.dongY;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chính sách dữ liệu – ${esc(project.ten)}</title><style>${CSS}</style></head><body><main class="wrap">
<h1>Chính sách dữ liệu cá nhân</h1>
<p><b>Bên thu thập và giữ dữ liệu:</b> ${esc(d.nguoiGiu || "[CHƯA ĐIỀN TÊN]")}, ${esc(d.vaiTro)}.</p>
<p><b>Dữ liệu thu thập:</b> họ tên, số điện thoại/Zalo, nhu cầu, căn hộ và phương thức thanh toán anh/chị chọn trên trang.</p>
<p><b>Mục đích:</b> liên hệ tư vấn về dự án ${esc(project.ten)} và gửi bảng tính anh/chị yêu cầu. Không dùng cho mục đích khác, không bán hay chia sẻ cho bên khác.</p>
<p><b>Nơi lưu và công cụ xử lý:</b> dữ liệu được lưu trong Google Sheets (Google) và thông báo cho tư vấn viên qua Telegram; máy chủ của các dịch vụ này có thể đặt ngoài Việt Nam. Ngoài các dịch vụ kỹ thuật đó, không bên nào khác nhận dữ liệu.</p>
<p><b>Thời gian lưu:</b> đến khi anh/chị yêu cầu xóa, hoặc tối đa 24 tháng kể từ lần liên hệ gần nhất.</p>
<p><b>Quyền của anh/chị:</b> xem, sửa, rút lại đồng ý, yêu cầu ngừng liên hệ và xóa dữ liệu bất cứ lúc nào bằng cách ${esc(d.kenhNgung)}${data.fanpageUrl ? ` (<a href="${esc(data.fanpageUrl)}">mở fanpage</a>)` : ""}.</p>
<p>Chính sách này áp dụng theo quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân. Mẫu ô đồng ý: v1-2026-11-06.</p>
<p><a href="index.html">Quay lại trang chính</a></p>
</main></body></html>
`;
}
