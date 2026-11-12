// Lõi công cụ bán hàng: đọc giỏ hàng (giohang.json), đánh dấu căn giá rẻ, mặt bằng tầng, danh sách cùng vị trí.
// Quy tắc cứng: chỉ căn "Trống" được tư vấn/so giá; "ĐÃ CỌC" = đã bán (hiện mờ, không giá); "CĐT LOCK" không hiện.
const VAT = 0.1;
const khoa = (s) => String(s ?? "").normalize("NFC").trim();

export function parseMa(ma) {
  const m = /^([A-Z])(\d+)\.(\d+)-(\d+)$/.exec(khoa(ma).toUpperCase());
  if (!m) return null;
  return { ma: `${m[1]}${m[2]}.${m[3]}-${m[4].padStart(2, "0")}`, thap: m[1], block: `${m[1]}${m[2]}`, tang: Number(m[3]), viTri: Number(m[4]) };
}

export function trangThai(tinhTrang) {
  const s = khoa(tinhTrang).toLowerCase();
  if (s === "trống" || s === "trong") return "trong";
  if (s.includes("cọc") || s.includes("coc") || s.includes("đã bán")) return "daBan";
  if (s.includes("lock")) return "lock";
  return "khac";
}

/** Bỏ căn CĐT LOCK (chưa mở bán). */
export const canHienThi = (ds) => ds.filter((x) => trangThai(x.tinhTrang) !== "lock");

const gia = (x, pttt) => x.giaChuaVat?.[pttt];

function xepHang(nhom, pttt) {
  const co = nhom.filter((x) => Number.isFinite(gia(x, pttt))).sort((a, b) => gia(a, pttt) - gia(b, pttt));
  const out = new Map();
  let hang = 0, truoc = null;
  for (const x of co) {
    if (gia(x, pttt) !== truoc) { hang += 1; truoc = gia(x, pttt); }
    out.set(x.ma, hang);
  }
  return out;
}

/** Cờ giá rẻ cho căn Trống: rẻ nhất theo loại trong block, và theo loại trong tầng (đồng giá thì cùng được đánh dấu). */
export function danhDauGiaRe(ds, { pttt = "09" } = {}) {
  const trong = ds.filter((x) => trangThai(x.tinhTrang) === "trong").map((x) => ({ ...x, ...(parseMa(x.ma) || {}) }));
  const theo = (keyFn) => {
    const g = new Map();
    for (const x of trong) { const k = keyFn(x); if (!g.has(k)) g.set(k, []); g.get(k).push(x); }
    const hang = new Map();
    for (const nhom of g.values()) for (const [ma, h] of xepHang(nhom, pttt)) hang.set(ma, h);
    return hang;
  };
  const hb = theo((x) => `${x.block}|${x.loai}`);
  const ht = theo((x) => `${x.block}|${x.tang}|${x.loai}`);
  const out = {};
  for (const x of trong) {
    if (!hb.has(x.ma)) continue;
    out[x.ma] = { hangBlock: hb.get(x.ma), reNhatBlock: hb.get(x.ma) === 1, hangTang: ht.get(x.ma), reNhatTang: ht.get(x.ma) === 1 };
  }
  return out;
}

const tomTat = (x) => ({ ...x, ...(parseMa(x.ma) || {}), trangThai: trangThai(x.tinhTrang) });

/** Mọi căn cùng vị trí (vd. 04) của cả block, theo tầng; không có căn LOCK. */
export function cungViTri(ds, ma) {
  const p = parseMa(ma);
  if (!p) return [];
  return canHienThi(ds).map(tomTat).filter((x) => x.block === p.block && x.viTri === p.viTri).sort((a, b) => a.tang - b.tang);
}

/** Mặt bằng một tầng của block: căn sắp theo vị trí, kèm trạng thái và cờ giá rẻ. */
export function matBangTang(ds, block, tang, opt = {}) {
  const re = danhDauGiaRe(ds, opt);
  return canHienThi(ds).map(tomTat).filter((x) => x.block === block && x.tang === tang).sort((a, b) => a.viTri - b.viTri)
    .map((x) => ({ ...x, reNhatBlock: !!re[x.ma]?.reNhatBlock, reNhatTang: !!re[x.ma]?.reNhatTang, hangBlock: re[x.ma]?.hangBlock ?? null, hangTang: re[x.ma]?.hangTang ?? null }));
}

/** Thẻ căn khi bấm: giá các PTTT (chưa VAT/có VAT), tình trạng, cờ giá rẻ, danh sách cùng vị trí. Căn đã bán không trả giá. */
export function theCan(ds, ma, opt = {}) {
  const p = parseMa(ma);
  const x = p && canHienThi(ds).find((y) => parseMa(y.ma)?.ma === p.ma);
  if (!x) return null;
  const t = tomTat(x);
  const re = danhDauGiaRe(ds, opt)[t.ma] || {};
  let g = null;
  if (t.trangThai === "trong") {
    g = {};
    for (const [k, v] of Object.entries(x.giaChuaVat || {})) g[k] = { chuaVat: v, coVat: Math.round(v * (1 + VAT)) };
  }
  return { ma: t.ma, block: t.block, tang: t.tang, viTri: t.viTri, loai: x.loai, dtTimTuong: x.dtTimTuong, dtThongThuy: x.dtThongThuy,
    trangThai: t.trangThai, gia: g, reNhatBlock: !!re.reNhatBlock, reNhatTang: !!re.reNhatTang, hangBlock: re.hangBlock ?? null, hangTang: re.hangTang ?? null,
    cungViTri: cungViTri(ds, ma) };
}
