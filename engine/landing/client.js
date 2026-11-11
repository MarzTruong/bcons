// Chạy trên trình duyệt: chọn căn mẫu + PTTT → bảng từng đợt và trả góp ước tính; gửi form về Google Apps Script.
import { CAP, PLANS, calc, pmt } from "./calc.js";

const T0 = Date.now();

const D = JSON.parse(document.getElementById("data").textContent);
const $ = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat("vi-VN");
const dong = (n) => nf.format(Math.round(n));
const ty = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(2).replace(".", ",")} tỷ` : `${nf.format(Math.round(n / 1e6))} triệu`);
const trieu = (n) => `${(n / 1e6).toFixed(1).replace(".", ",")} triệu`;
const num = (s) => {
  const v = parseFloat(String(s).replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};
const S = { i: 0, k: "03" };

function result() {
  const u = D.canMau[S.i];
  const c = calc(S.k, u.giaChuaVat[S.k]);
  const lai = Math.min(30, Math.max(0, num($("lai").value)));
  const nam = Math.min(35, Math.max(1, num($("nam").value) || 20));
  return { u, c, lai, nam, monthly: pmt(c.loan, lai, nam) };
}

function render() {
  const { c, lai, nam, monthly } = result();
  const p = PLANS[S.k];
  $("tag").textContent = p.tag;
  $("sel").textContent = `Đang xem: ${$("cards").querySelector(".unit[aria-pressed=true] b").textContent}`;
  const capLine = p.cap && c.loan
    ? `<div class="wide">Lãi trần ${String(CAP).replace(".", ",")}%/năm theo điều kiện của chủ đầu tư<span>Áp dụng tối đa 48 tháng và không quá 24 tháng kể từ thông báo bàn giao; chủ đầu tư trả phần lãi vượt trần. Trong thời gian đó trả góp khoảng ${trieu(pmt(c.loan, CAP, nam))}/tháng; sau đó theo lãi ngân hàng (giả định ở trên).</span></div>`
    : "";
  const supLine = S.k === "02" || S.k === "05"
    ? '<div class="wide">Hỗ trợ của chủ đầu tư<span>Hỗ trợ lãi và ân hạn gốc từ lúc giải ngân đến thông báo bàn giao, tối đa 24 tháng. Số trả góp ở trên là sau thời gian hỗ trợ.</span></div>'
    : "";
  $("kv").innerHTML = `
<div>Giá chưa VAT<span>${dong(c.P)} đ</span></div>
<div>Giá có VAT<span>${dong(c.G)} đ</span></div>
<div>Tự có đến lúc nhận nhà<span>${ty(c.ownBefore)}</span></div>
<div>${c.loan ? "Vay ngân hàng" : "Không vay"}<span>${c.loan ? ty(c.loan) : "0"}</span></div>
<div>Khi nhận nhà (gồm phí bảo trì 2%)<span>${ty(c.handover + c.fee)}</span></div>
<div>Sổ hồng (không VAT)<span>${ty(c.so)}</span></div>
<div class="wide">${c.loan ? `Trả góp ước tính: ~${trieu(monthly)}/tháng` : "Phương thức này không vay ngân hàng"}${c.loan ? `<span>Giả định lãi ${String(lai).replace(".", ",")}%/năm, ${nam} năm, trả đều gốc và lãi.</span>` : ""}</div>
${capLine}${supLine}`;
  $("rows").innerHTML = c.rows
    .map((r, i) => `<tr class="${r.bank ? "bank" : ""}"><td>${i + 1}</td><td>${r.l}<br><span class="note">${r.w}</span></td><td class="r">${r.p}%</td><td class="r">${dong(r.amt)}${r.bank ? "<br><span class=note>ngân hàng</span>" : ""}</td></tr>`)
    .join("") + `<tr><td></td><td>Phí bảo trì 2% (đóng cùng đợt nhận nhà)</td><td class="r">2%</td><td class="r">${dong(c.fee)}</td></tr>`;
}

$("cards").addEventListener("click", (e) => {
  const b = e.target.closest(".unit");
  if (!b) return;
  S.i = Number(b.dataset.i);
  for (const x of $("cards").querySelectorAll(".unit")) x.setAttribute("aria-pressed", String(x === b));
  render();
});
$("plans").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  S.k = b.dataset.k;
  for (const x of $("plans").querySelectorAll(".chip")) x.setAttribute("aria-pressed", String(x === b));
  render();
});
$("lai").addEventListener("input", render);
$("nam").addEventListener("input", render);
render();

// ---- Form ----
const PHONE = /^(?:\+?84|0)\d{9,10}$/;

function source() {
  const q = new URLSearchParams(location.search);
  return q.get("utm_source") || q.get("nguon") || (document.referrer ? new URL(document.referrer).hostname : "truc tiep");
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("err").textContent = "";
  const ten = $("ten").value.trim();
  const sdt = $("sdt").value.replace(/[\s.()-]/g, "");
  if (!$("dongY").checked) return ($("err").textContent = "Anh/chị cần tick ô đồng ý để em liên hệ được.");
  if (ten.length < 2) return ($("err").textContent = "Anh/chị nhập họ tên giúp em.");
  if (!PHONE.test(sdt)) return ($("err").textContent = "Số điện thoại chưa đúng (vd. 09xx xxx xxx).");
  if (!D.formUrl) return ($("err").textContent = "Trang đang chạy thử, chưa nhận đăng ký.");
  const { u, c, lai, nam, monthly } = result();
  const payload = {
    ten, sdt, nhuCau: $("nhuCau").value, hp_x7: $("hp_x7").value, dongY: true, t: Date.now() - T0,
    canMa: u.ma, canLoai: u.loai, canMoTa: `tháp ${u.thap}, tầng ${u.tang}`, dt: u.dtTimTuong, pttt: PLANS[S.k].name,
    giaChuaVat: c.P, giaCoVat: c.G, phiBaoTri: c.fee, tuCo: c.ownBefore, vay: c.loan, traGop: Math.round(monthly), lai, nam,
    duAn: D.duAn, nguon: source(), trang: location.origin + location.pathname,
  };
  $("send").disabled = true;
  // Máy chủ coi gửi dưới 3 giây kể từ lúc mở trang là máy tự động: chờ đủ rồi mới gửi để không mất khách tự điền nhanh.
  const cho = 3200 - (Date.now() - T0);
  if (cho > 0) await new Promise((r) => setTimeout(r, cho));
  payload.t = Date.now() - T0;
  try {
    // Apps Script không trả CORS: gửi "no-cors" (text/plain), coi gửi được là thành công.
    await fetch(D.formUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    $("form").hidden = true;
    $("ok").hidden = false;
  } catch {
    $("err").textContent = "Gửi chưa được (mạng yếu?). Anh/chị thử lại giúp em.";
    $("send").disabled = false;
  }
});
