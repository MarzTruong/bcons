// Keo trang phieu.html: doc lien ket -> dung phieu bang loi tinh -> giao cho template ve -> nut luu anh.
// GIAO DIEN (mau, chu, bo cuc) la cua template do AGY lam; file nay chi lo du lieu va nut luu anh toi thieu.
import { phieuTuLienKet } from "./phieu-web.js";

const D = JSON.parse(document.getElementById("phieu-du-lieu").textContent);
const app = document.getElementById("app");
const r = phieuTuLienKet(location.search, D);
if (!r.ok) {
  app.textContent = r.loi + " Anh/chị nhắn Zalo giúp em nhé.";
  document.documentElement.dataset.ready = "1";
} else {
  window.__phieu = r.phieu; // để test tự động đối chiếu số
  window.veTheoDuLieu(r.phieu);
  const ten = `phieu-tinh-${r.phieu.can.ma || r.phieu.pttt.ma}-PTTT${r.phieu.pttt.ma}`.replace(/[^A-Za-z0-9.-]/g, "_");
  const nut = document.getElementById("luu-anh");
  const baoLoi = document.getElementById("luu-anh-loi");
  nut.hidden = false;
  nut.addEventListener("click", async () => {
    baoLoi.textContent = "";
    try {
      const png = await chupPhan();
      const a = document.createElement("a");
      a.href = png;
      a.download = ten + ".png";
      a.click();
    } catch {
      baoLoi.textContent = "Máy này chưa lưu được ảnh trực tiếp: anh chụp màn hình phiếu giúp em nhé.";
    }
  });
}

/** Chup toan bo noi dung phieu (than trang, tru thanh nut) thanh PNG rong 1080 px bang SVG foreignObject; khong can thu vien ngoai. */
async function chupPhan() {
  const body = document.body;
  const cs = getComputedStyle(body);
  const rect = body.getBoundingClientRect();
  const cach = document.getElementById("luu-anh-spacer")?.offsetHeight ?? 0;
  const w = Math.ceil(rect.width), h = Math.ceil(rect.height - cach) + 24;
  const css = [...document.styleSheets].map((s) => { try { return [...s.cssRules].map((x) => x.cssText).join("\n"); } catch { return ""; } }).join("\n");
  const trong = [...body.children].filter((n) => !["SCRIPT", "STYLE"].includes(n.tagName) && !["luu-anh-bar", "luu-anh-spacer"].includes(n.id)).map((n) => n.outerHTML).join("");
  const html = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;box-sizing:border-box;padding:${cs.padding};background:${cs.backgroundColor};color:${cs.color};font:${cs.font.replace(/"/g, "'")}"><style>${css}</style>${trong}</div>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(new DOMParser().parseFromString(html, "text/html").body.firstChild)}</foreignObject></svg>`;
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  const k = 1080 / w;
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = Math.round(h * k);
  const ctx = c.getContext("2d");
  ctx.scale(k, k);
  ctx.drawImage(img, 0, 0);
  return c.toDataURL("image/png");
}
