// Dựng HTML landing page từ dữ liệu dự án (không đọc file, không gọi mạng: test được).
import { PLANS } from "./calc.mjs";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const nf = new Intl.NumberFormat("vi-VN");
export const ty = (n) => `${(n / 1e9).toFixed(2).replace(".", ",")} tỷ`;
const loaiNhan = (t) => (t === "Studio" ? "Studio" : t.replace("PN", " phòng ngủ").replace("-", ", ").replace("WC", " WC"));

const CSS = `
:root{--y:#ffe14d;--ink:#18201b;--paper:#fffdf4;--mute:#5a5f57;--line:#d9d6c6;--soft:#f3efdc;--err:#b42318}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'Be Vietnam Pro',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.55}
.wrap{max-width:560px;margin:0 auto;padding:0 16px}
figure.hero{position:relative;margin:0;max-width:560px;margin-inline:auto}
figure.hero img{width:100%;height:58vh;min-height:340px;max-height:520px;object-fit:cover;display:block}
figure.hero figcaption{position:absolute;right:10px;top:12px;color:#fff;font-size:12px;text-shadow:0 1px 5px rgba(0,0,0,.7)}
.block{background:var(--y);margin:-56px 16px 0;position:relative;padding:20px 18px 22px;max-width:528px;margin-inline:auto}
@media (min-width:592px){.block{margin-inline:auto}}
h1{font:900 44px/.95 Montserrat,'Be Vietnam Pro',sans-serif;letter-spacing:-.04em;margin:0}
.block p{margin:12px 0 0;font-size:15px}
.nums{display:grid;grid-template-columns:1fr 1fr;margin-top:28px;border-top:3px solid var(--ink)}
.nums div{padding:14px 12px 14px 0;border-bottom:1px solid var(--line)}
.nums b{display:block;font:900 30px/1 Montserrat,'Be Vietnam Pro',sans-serif;letter-spacing:-.03em}
.nums span{font-size:14px;color:var(--mute)}
h2{font:900 28px/1 Montserrat,'Be Vietnam Pro',sans-serif;letter-spacing:-.03em;margin:44px 0 14px}
.mosaic{display:grid;grid-template-columns:1.3fr 1fr;grid-template-rows:170px 130px;gap:6px}
.mosaic img{width:100%;height:100%;object-fit:cover;display:block}.mosaic img:first-child{grid-row:span 2}
.mcap{font-size:13px;color:var(--mute);margin:8px 0 0}
.units{display:block}
.unit{display:flex;justify-content:space-between;align-items:center;width:100%;padding:12px 0;border:0;border-bottom:1px solid var(--line);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}
.unit[aria-pressed=true]{background:var(--y);margin:0 -16px;width:calc(100% + 32px);padding:12px 16px}
.unit .l small{display:block;color:var(--mute);font-size:13px}
.unit .p{font:900 22px Montserrat,'Be Vietnam Pro',sans-serif;letter-spacing:-.02em}
.note{font-size:13px;color:var(--mute)}
.units+.note{margin:10px 0 0}
.contact{display:grid;gap:8px;margin:28px 0 0}
.contact a{text-align:center;padding:16px;font-weight:700;font-size:17px;text-decoration:none}
.contact a.zalo{background:var(--y);color:var(--ink)}.contact a.call{background:var(--ink);color:#fff}
.sel{font-weight:700;margin:0 0 8px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.chip{min-height:42px;padding:6px 14px;border:1.5px solid var(--ink);background:var(--paper);font:inherit;font-weight:700;cursor:pointer}
.chip[aria-pressed=true]{background:var(--ink);color:#fff}
.row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
label{font-size:13px;font-weight:700;color:var(--mute);display:block;margin-bottom:3px}
input,select{width:100%;height:48px;border:1.5px solid var(--ink);border-radius:0;padding:0 10px;font:inherit;font-size:16px;background:#fff;color:var(--ink)}
.kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}
.kv div{background:var(--soft);padding:8px 10px;font-weight:700}
.kv span{display:block;font-size:12.5px;font-weight:400;color:var(--mute)}
.kv .wide{grid-column:1/-1;background:var(--y)}.kv .wide span{color:var(--ink)}
.tbl{overflow-x:auto}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums;font-size:13px}
th,td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--mute);font-weight:600}
td.r,th.r{text-align:right}tr.bank td{color:var(--mute);background:var(--soft)}
.consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;font-weight:400;color:var(--ink);margin:12px 0;background:var(--soft);padding:10px}
.consent input{width:22px;height:22px;flex:0 0 auto;margin-top:2px;accent-color:var(--ink)}
button.send{width:100%;height:52px;border:0;background:var(--y);color:var(--ink);font:inherit;font-weight:700;font-size:17px;cursor:pointer}
button.send:disabled{opacity:.45;cursor:not-allowed}
.hp{position:absolute;left:-5000px;width:1px;height:1px;overflow:hidden}
.ok{background:var(--y);padding:14px;font-weight:700}
.err{color:var(--err);font-weight:600;font-size:13px}
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
footer{margin:36px 0 28px;font-size:12px;color:var(--mute)}footer a{color:var(--mute)}
.draft{background:var(--ink);color:#fff;text-align:center;padding:6px;font-weight:700}
@media (max-width:520px){.row{grid-template-columns:1fr}h1{font-size:40px}}
`;

function consentText(dongY, projectName) {
  return `Tôi đồng ý để ${esc(dongY.vaiTro)} lưu họ tên, số điện thoại và lựa chọn của tôi trên trang này (căn hộ, phương thức thanh toán, nhu cầu) để liên hệ tư vấn về dự án ${esc(projectName)} qua điện thoại hoặc Zalo. Thông tin chỉ dùng cho mục đích này, không bán hay chia sẻ cho bên khác. Tôi có thể yêu cầu ngừng liên hệ và xóa thông tin bất cứ lúc nào bằng cách ${esc(dongY.kenhNgung)}. <a href="chinh-sach.html">Xem chính sách dữ liệu</a>.`;
}

/** Nút Gọi và Zalo của tư vấn viên (anh đổi quy tắc 06/11/2026; bỏ tên khỏi trang 08/11/2026). */
function contactButtons(lh) {
  if (!lh?.sdt) return "";
  const tel = String(lh.sdt).replace(/\D/g, "");
  return `<nav class="contact" aria-label="Liên hệ tư vấn viên">
${lh.zalo ? `<a class="zalo" href="${esc(lh.zalo)}" target="_blank" rel="noopener">Nhắn Zalo</a>` : ""}
<a class="call" href="tel:${tel}">Gọi ${esc(lh.sdtHienThi ?? tel)}</a>
</nav>`;
}

const base = (f) => String(f).split("/").pop();

/** Trang chủ landing. data = landing.json, project = project.json. draft = true thì hiện dải "BẢN NHÁP". */
export function renderPage(data, project, { draft = false } = {}) {
  const units = data.canMau
    .map(
      (u, i) => `<button class="unit" type="button" data-i="${i}" aria-pressed="${i === 0}">
  <span class="l"><b>${esc(loaiNhan(u.loai))}</b><small>${esc(String(u.dtThongThuy).replace(".", ","))} m²</small></span>
  <span class="p">${ty(u.giaChuaVat["02"])}</span>
</button>`,
    )
    .join("\n");
  const json = JSON.stringify({
    canMau: data.canMau.map(({ ma, ...u }) => u), // không đưa mã căn lên trang (giỏ hàng đổi liên tục)
    lai: data.laiGiaDinh,
    nam: data.namGiaDinh,
    formUrl: data.formUrl,
    duAn: project.ma,
  }).replace(/</g, "\\u003c");
  const mau = data.anhNhaMau ?? [];
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(project.ten)} – Tính dòng tiền căn hộ</title>
<meta name="description" content="${esc(data.moTa)}">
<meta property="og:title" content="${esc(data.tieuDe)}"><meta property="og:description" content="${esc(data.moTa)}">
<meta property="og:image" content="${esc((data.siteUrl ? data.siteUrl.replace(/\/$/, "") + "/" : "") + base(data.anhChinh))}">${data.siteUrl ? `<meta property="og:url" content="${esc(data.siteUrl)}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Be+Vietnam+Pro:wght@400;500;700&display=swap">
<style>${CSS}</style></head>
<body>
${draft ? '<div class="draft">BẢN NHÁP – chưa đăng chính thức</div>' : ""}
<figure class="hero"><img src="${esc(base(data.anhChinh))}" alt="Phối cảnh ${esc(project.ten)}"><figcaption>Hình ảnh minh họa</figcaption></figure>
<div class="block"><h1>${esc(project.ten)}</h1><p>${esc(project.diaChi)}</p></div>
<main class="wrap">
<div class="nums">${data.soLieu.map((x) => `<div><b>${esc(x.so)}</b><span>${esc(x.nhan)}</span></div>`).join("")}</div>
${mau.length ? `<h2>Nhà mẫu</h2>
<div class="mosaic">${mau.slice(0, 3).map((a) => `<img src="${esc(base(a.file))}" alt="${esc(a.nhan)}" loading="lazy">`).join("")}</div>
<p class="mcap">${esc(mau[0].nhan)}</p>` : ""}

<h2 id="gia">Giá căn mẫu</h2>
<div class="units" id="cards">
${units}
</div>
<p class="note">Giá theo PTTT 02, chưa VAT, chưa phí bảo trì 2%.</p>
${contactButtons(project.lienHe)}

<h2 id="tinh">Trả từng đợt</h2>
<p class="sel" id="sel"></p>
<div class="chips" id="plans">${Object.entries(PLANS).map(([k, p]) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${k === "03"}">${p.name}</button>`).join("")}</div>
<p class="note" id="tag"></p>
<div class="row">
<div><label for="lai">Lãi vay giả định (%/năm)</label><input id="lai" inputmode="decimal" value="${String(data.laiGiaDinh).replace(".", ",")}"></div>
<div><label for="nam">Kỳ hạn vay (năm)</label><input id="nam" inputmode="numeric" value="${data.namGiaDinh}"></div>
</div>
<div class="kv" id="kv"></div>
<div class="tbl"><table><thead><tr><th>Đợt</th><th>Nội dung, thời điểm</th><th class="r">%</th><th class="r">Số tiền (đồng)</th></tr></thead><tbody id="rows"></tbody></table></div>
<p class="note">Lãi vay và kỳ hạn là giả định, lãi thực tế theo ngân hàng lúc vay.</p>

<h2 id="dangky">Nhận bảng tính theo căn anh/chị chọn</h2>
<form id="form" novalidate>
<div class="row">
<div><label for="ten">Họ tên</label><input id="ten" name="ten" autocomplete="name" required maxlength="80"></div>
<div><label for="sdt">Số điện thoại / Zalo</label><input id="sdt" name="sdt" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20"></div>
</div>
<div style="margin-top:10px"><label for="nhuCau">Nhu cầu</label><select id="nhuCau" name="nhuCau"><option>Mua để ở</option><option>Mua cho thuê</option><option>Tìm hiểu thêm</option></select></div>
<div class="hp" aria-hidden="true"><label for="hp_x7">Để trống ô này</label><input id="hp_x7" name="hp_x7" tabindex="-1" autocomplete="off"></div>
<label class="consent"><input type="checkbox" id="dongY" name="dongY"><span>${consentText(data.dongY, project.ten)}</span></label>
<button class="send" id="send" type="submit">Gửi, nhận bảng tính</button>
<p class="err" id="err" role="alert"></p>
</form>
<div class="ok" id="ok" hidden>Đã nhận thông tin. Tư vấn viên sẽ liên hệ anh/chị qua điện thoại hoặc Zalo sớm nhất.</div>
</main>
<footer class="wrap">
<p>${esc(project.ten)}, ${esc(project.diaChi)}. Chủ đầu tư: ${esc(project.chuDauTu)}. Phân phối: ${esc(project.donViPhanPhoi)}. <a href="chinh-sach.html">Chính sách dữ liệu</a></p>
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
<p><b>Bên thu thập và giữ dữ liệu:</b> ${esc(d.vaiTro)}.</p>
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
