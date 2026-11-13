// Nguồn dữ liệu giỏ hàng của công cụ bán hàng: Apps Script (khóa bí mật) → lưu trong máy → dùng khi mất mạng.
// Hàm thuần, nhận môi trường (localStorage, fetch, location, navigator) để test được bằng Node. Không chứa giá nào.
export const KHOA_CAI_DAT = "bcons_ban_hang_cai_dat";
export const KHOA_GIO_HANG = "bcons_ban_hang_giohang";

/** Liên kết cài đặt: https://trang/#cai-dat=<base64url của {"u":"<link Apps Script>","k":"<khóa>"}>. Khóa nằm trong #, không gửi lên máy chủ. */
export function giaiMaCaiDat(hash) {
  const m = /#cai-dat=([A-Za-z0-9_-]+)/.exec(hash || "");
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    const json = decodeURIComponent(bin.split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
    const o = JSON.parse(json);
    return /^https:\/\/script\.google\.com\//.test(o.u || "") && typeof o.k === "string" && o.k ? { u: o.u, k: o.k } : null;
  } catch {
    return null;
  }
}

/** Lưu cài đặt anh nhập tay trên thiết bị (link Apps Script + khóa); trả lỗi tiếng Việt nếu sai dạng. */
export function luuCaiDat(localStorage, link, khoa) {
  const u = String(link || "").trim();
  const k = String(khoa || "").trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u)) return { ok: false, loi: "Link phải dạng https://script.google.com/macros/s/.../exec" };
  if (k.length < 8) return { ok: false, loi: "Khóa quá ngắn (ít nhất 8 ký tự)." };
  localStorage.setItem(KHOA_CAI_DAT, JSON.stringify({ u, k }));
  return { ok: true };
}

/** Dữ liệu giỏ hàng hợp lệ: có danh sách căn không rỗng, mỗi căn có mã. */
export function giohangHopLe(d) {
  return Boolean(d && Array.isArray(d.can) && d.can.length > 0 && d.can.every((c) => c && typeof c.ma === "string"));
}

export function taoNguon({ localStorage, fetch, location, history, navigator = {}, urlMau = "giohang-mau.json" }) {
  const doc = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
  const ghi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* đầy bộ nhớ: bỏ qua */ } };
  let state = { offline: false, tuCache: false, demo: false };

  // Mở liên kết cài đặt: lưu khóa, xóa khóa khỏi thanh địa chỉ.
  const cd = giaiMaCaiDat(location?.hash);
  if (cd) {
    ghi(KHOA_CAI_DAT, cd);
    try { history?.replaceState?.(null, "", (location.pathname || "/") + (location.search || "")); } catch { /* bỏ qua */ }
  }
  const demo = /#demo\b/.test(location?.hash || "");

  async function taiTuMang() {
    const cfg = doc(KHOA_CAI_DAT);
    if (!cfg) throw Object.assign(new Error("Chưa cài đặt: mở liên kết cài đặt anh đã lưu một lần trên thiết bị này."), { ma: "chua-cai-dat" });
    const url = cfg.u + (cfg.u.includes("?") ? "&" : "?") + "khoa=" + encodeURIComponent(cfg.k);
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw Object.assign(new Error(`Máy chủ trả lỗi ${r.status}`), { ma: "mang" });
    const d = await r.json();
    if (d && d.loi) throw Object.assign(new Error(d.loi === "khoa" ? "Sai khóa: mở lại liên kết cài đặt mới." : String(d.loi)), { ma: d.loi === "khoa" ? "sai-khoa" : "may-chu" });
    if (!giohangHopLe(d)) throw Object.assign(new Error("Dữ liệu giỏ hàng trống hoặc sai dạng."), { ma: "du-lieu" });
    ghi(KHOA_GIO_HANG, d);
    return d;
  }

  /** Nút Cập nhật: tải mới từ mạng; lỗi thì ném lỗi (giao diện giữ dữ liệu cũ, báo offline). */
  async function capNhat() {
    try {
      const d = await taiTuMang();
      state = { offline: false, tuCache: false, demo: false };
      return d;
    } catch (e) {
      state = { ...state, offline: true };
      throw e;
    }
  }

  /** Hàm duy nhất giao diện gọi (window.layGioHang). Có mạng: tải mới; mất mạng hoặc lỗi: dữ liệu đã lưu lần trước. */
  async function layGioHang() {
    if (demo) {
      const r = await fetch(urlMau);
      state = { offline: false, tuCache: false, demo: true };
      return r.json();
    }
    try {
      return await capNhat();
    } catch (e) {
      if (e.ma === "chua-cai-dat" || e.ma === "sai-khoa") throw e;
      const cache = doc(KHOA_GIO_HANG);
      if (giohangHopLe(cache)) {
        state = { offline: true, tuCache: true, demo: false };
        return cache;
      }
      throw e;
    }
  }

  return { layGioHang, capNhat, trangThai: () => ({ ...state }), _doc: doc };
}
