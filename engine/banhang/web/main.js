// Khởi động công cụ bán hàng: nạp lịch đợt (plans.json), thông tin liên hệ, giỏ hàng (nguon.mjs) rồi dựng giao diện.
import { taoNguon, luuCaiDat } from "./nguon.mjs";
import { khoiDong } from "./app.js";

function baoLoi(msg, cho = null) {
  const el = document.getElementById("loiDuLieu");
  if (!el) return;
  el.style.display = "flex";
  el.textContent = "";
  const p = document.createElement("div");
  p.id = "loiChu";
  p.textContent = msg;
  el.appendChild(p);
  if (cho === "cai-dat") formCaiDat(el);
}

// Chưa cài đặt hoặc đã đổi khóa: nhập link Apps Script + khóa ngay trên thiết bị (không gửi qua chat). Giao diện tối giản, chờ AGY làm đẹp.
function formCaiDat(el) {
  const f = document.createElement("form");
  f.id = "formCaiDat";
  f.style.cssText = "display:grid;gap:10px;margin-top:16px;max-width:460px;width:100%;font:500 16px system-ui,sans-serif;text-align:left;";
  f.innerHTML = '<label>Link Apps Script (…/exec)<input name="link" autocomplete="off" inputmode="url" style="width:100%;padding:10px;font-size:16px"></label>' +
    '<label>Khóa<input name="khoa" type="password" autocomplete="off" style="width:100%;padding:10px;font-size:16px"></label>' +
    '<button type="submit" style="padding:12px;font:700 16px system-ui,sans-serif">Lưu và mở</button><div id="loiForm" style="color:#b00020"></div>';
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = luuCaiDat(localStorage, f.link.value, f.khoa.value);
    if (!r.ok) { f.querySelector("#loiForm").textContent = r.loi; return; }
    location.reload();
  });
  el.firstChild.after(f);
}

(async () => {
  const nguon = taoNguon({ localStorage, fetch: (...a) => fetch(...a), location, history, navigator });
  window.layGioHang = nguon.layGioHang;
  try {
    const [plans, lienHe] = await Promise.all([
      fetch("plans.json").then((r) => r.json()),
      fetch("lien-he.json").then((r) => r.json()),
    ]);
    const giohang = await nguon.layGioHang();
    await khoiDong({ giohang, plans, lienHe, nguon });
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  } catch (e) {
    baoLoi(e && e.message ? e.message : "Không mở được dữ liệu giỏ hàng.", e && (e.ma === "chua-cai-dat" || e.ma === "sai-khoa") ? "cai-dat" : null);
  }
})();
