// Đọc lịch đợt của từng dự án từ nguon/pttt-cdt.json (tỷ lệ `dot` + nhãn `dotChiTiet`), dùng chung lõi calcWith.
import fs from "node:fs";
import path from "node:path";

/** Đọc du-an/<mã>/nguon/pttt-cdt.json. */
export function loadCdt(projDir) {
  return JSON.parse(fs.readFileSync(path.join(projDir, "nguon", "pttt-cdt.json"), "utf8"));
}

/** Một PTTT thành plan (tag = tomTat, câu một dòng cho khách; ghiChu là ghi chú nội bộ, không dùng ra ngoài) cho calcWith: rows {l, p, k, w}, cap (có trần lãi), chiết khấu, VAT, phí bảo trì. */
export function planFromJson(cdt, key) {
  const p = cdt.pttt?.[key];
  if (!p) throw new Error(`Không có PTTT ${key}`);
  if (!p.dotChiTiet || p.dotChiTiet.length !== p.dot.length) throw new Error(`PTTT ${key}: dotChiTiet không khớp dot`);
  return {
    name: `PTTT ${key}`,
    tag: p.tomTat ?? "",
    cap: p.tranLai != null,
    chietKhau: p.chietKhau ?? 0,
    vat: cdt.chung?.vat ?? 0.1,
    fee: cdt.chung?.phiBaoTri ?? 0.02,
    rows: p.dot.map((pct, i) => ({ l: p.dotChiTiet[i].l, p: pct, k: p.dotChiTiet[i].k, w: p.dotChiTiet[i].w })),
  };
}
