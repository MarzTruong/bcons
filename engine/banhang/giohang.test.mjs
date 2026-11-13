import test from "node:test";
import assert from "node:assert/strict";
import { parseMa, trangThai, canHienThi, danhDauGiaRe, cungViTri, matBangTang, theCan } from "./giohang.mjs";

const c = (ma, loai, gia, tt = "Trống", dt = 60) => {
  const p = parseMa(ma);
  return { ma, thap: p.thap, block: p.block, tang: p.tang, viTri: p.viTri, loai, dtTimTuong: dt, dtThongThuy: dt - 5,
    giaChuaVat: { "08": gia * 0.94, "09": gia, "10": gia * 0.98 }, tinhTrang: tt };
};
const G = [
  c("B2.4-01", "2PN-1WC", 2500e6), c("B2.4-02", "2PN-2WC", 3000e6), c("B2.4-04", "3PN-2WC", 4100e6),
  c("B2.5-01", "2PN-1WC", 2480e6), c("B2.5-02", "2PN-2WC", 3050e6), c("B2.5-04", "3PN-2WC", 4000e6, "ĐÃ CỌC"),
  c("B2.6-01", "2PN-1WC", 2400e6, "CĐT LOCK"), c("B2.6-02", "2PN-2WC", 3000e6), c("B2.6-04", "3PN-2WC", 4200e6),
  c("B1.4-04", "3PN-2WC", 3900e6),
];

test("parseMa: B2.4-04 = tháp B, block B2, tầng 4, vị trí 4", () => {
  assert.deepEqual(parseMa("B2.4-04"), { ma: "B2.4-04", thap: "B", block: "B2", tang: 4, viTri: 4 });
  assert.equal(parseMa("B1.12-14").tang, 12);
  assert.equal(parseMa(" b2.4-04 ").ma, "B2.4-04");
  for (const x of ["", "B2-4-04", "X", null, "B2.4"]) assert.equal(parseMa(x), null);
});

test("trạng thái: Trống / đã bán (đã cọc) / lock / không rõ", () => {
  assert.equal(trangThai("Trống"), "trong");
  assert.equal(trangThai("ĐÃ CỌC"), "daBan");
  assert.equal(trangThai("đã cọc"), "daBan");
  assert.equal(trangThai("CĐT LOCK"), "lock");
  assert.equal(trangThai("???"), "khac");
});

test("căn CĐT LOCK không bao giờ hiện; căn lạ không tư vấn", () => {
  const ds = canHienThi(G);
  assert.ok(!ds.some((x) => x.ma === "B2.6-01"));
  assert.equal(ds.length, G.length - 1);
});

test("giá rẻ: chỉ so căn Trống, theo loại trong block và theo loại trong tầng", () => {
  const m = danhDauGiaRe(G, { pttt: "09" });
  // 2PN-1WC block B2: B2.4-01 (2500) vs B2.5-01 (2480) -> B2.5-01 rẻ nhất; B2.6-01 là LOCK nên bị loại
  assert.equal(m["B2.5-01"].reNhatBlock, true);
  assert.equal(m["B2.4-01"].reNhatBlock, false);
  assert.equal(m["B2.4-01"].hangBlock, 2);
  // trong tầng 4 chỉ có 1 căn mỗi loại -> rẻ nhất tầng
  assert.equal(m["B2.4-01"].reNhatTang, true);
  // 3PN-2WC B2: B2.5-04 đã cọc bị loại; 4100 (t4) vs 4200 (t6)
  assert.equal(m["B2.4-04"].reNhatBlock, true);
  assert.equal(m["B2.6-04"].reNhatBlock, false);
  // block B1 tách riêng: B1.4-04 rẻ nhất loại của block B1
  assert.equal(m["B1.4-04"].reNhatBlock, true);
  // căn đã cọc / lock không có cờ
  assert.equal(m["B2.5-04"], undefined);
  assert.equal(m["B2.6-01"], undefined);
});

test("giá rẻ đồng giá: cùng rẻ nhất thì đều được đánh dấu", () => {
  const m = danhDauGiaRe([c("B2.4-01", "A", 100e6), c("B2.5-01", "A", 100e6), c("B2.6-01", "A", 120e6)], { pttt: "09" });
  assert.equal(m["B2.4-01"].reNhatBlock, true);
  assert.equal(m["B2.5-01"].reNhatBlock, true);
  assert.equal(m["B2.6-01"].reNhatBlock, false);
  assert.equal(m["B2.6-01"].hangBlock, 2);
});

test("giá rẻ theo PTTT được chọn", () => {
  const a = c("B2.4-01", "A", 100e6), b = c("B2.5-01", "A", 99e6);
  b.giaChuaVat["08"] = 95e6; a.giaChuaVat["08"] = 90e6; // PTTT 08 thì a rẻ hơn
  assert.equal(danhDauGiaRe([a, b], { pttt: "09" })["B2.5-01"].reNhatBlock, true);
  assert.equal(danhDauGiaRe([a, b], { pttt: "08" })["B2.4-01"].reNhatBlock, true);
});

test("cùng vị trí: chọn B2.4-04 -> danh sách căn 04 cả block B2, đủ trạng thái, đúng thứ tự tầng", () => {
  const ds = cungViTri(G, "B2.4-04");
  assert.deepEqual(ds.map((x) => x.ma), ["B2.4-04", "B2.5-04", "B2.6-04"]);
  assert.equal(ds[1].trangThai, "daBan");
  assert.equal(ds[0].tang, 4);
  assert.ok(!ds.some((x) => x.ma.startsWith("B1.")), "không lẫn block khác");
  assert.deepEqual(cungViTri(G, "Z9.9-99"), []);
  // vị trí có căn LOCK: không hiện căn LOCK
  assert.deepEqual(cungViTri(G, "B2.4-01").map((x) => x.ma), ["B2.4-01", "B2.5-01"]);
});

test("mặt bằng tầng: đủ căn của tầng, sắp theo vị trí, kèm cờ giá rẻ và trạng thái", () => {
  const mb = matBangTang(G, "B2", 5, { pttt: "09" });
  assert.deepEqual(mb.map((x) => x.viTri), [1, 2, 4]);
  assert.equal(mb[0].reNhatBlock, true);
  assert.equal(mb[2].trangThai, "daBan");
  assert.equal(mb[2].reNhatBlock, false);
  assert.equal(matBangTang(G, "B2", 99).length, 0);
});

test("thẻ căn: giá/PTTT/tình trạng; đã bán thì không có giá để tư vấn", () => {
  const t = theCan(G, "B2.4-04");
  assert.equal(t.trangThai, "trong");
  assert.equal(t.gia["09"].chuaVat, 4100e6);
  assert.equal(t.gia["09"].coVat, Math.round(4100e6 * 1.1));
  assert.equal(t.cungViTri.length, 3);
  assert.equal(t.reNhatBlock, true);
  const ban = theCan(G, "B2.5-04");
  assert.equal(ban.trangThai, "daBan");
  assert.equal(ban.gia, null);
  assert.equal(theCan(G, "B2.6-01"), null); // LOCK
  assert.equal(theCan(G, "nope"), null);
});

test("dữ liệu mẫu giohang-mau.json (mô phỏng): chạy được cả chuỗi, mỗi tầng có ≥1 cờ rẻ theo loại", async () => {
  const { readFileSync } = await import("node:fs");
  const g = JSON.parse(readFileSync(new URL("../../du-an/bcons-newsky/ban-hang-mau/giohang-mau.json", import.meta.url), "utf8"));
  const mb = matBangTang(g.can, "B1", 5);
  assert.equal(mb.length, 14);
  assert.ok(mb.some((x) => x.reNhatTang));
  const t = theCan(g.can, "B1.5-01");
  assert.ok(t.cungViTri.length > 1 && t.cungViTri.every((x) => x.viTri === 1 && x.block === "B1"));
});

test("thẻ căn mang hướng view của Master File (lỗi cũ: giao diện luôn hiện 'Đang cập nhật')", () => {
  const g = [{ ...G[0], huong: "TN - ĐN" }, G[1]];
  assert.equal(theCan(g, "B2.4-01").huong, "TN - ĐN");
  assert.equal(theCan(g, "B2.4-02").huong, null); // giỏ hàng chưa có cột hướng thì null, không bịa
  assert.equal(theCan(g, "B2.4-01").cungViTri.find((x) => x.ma === "B2.4-01").huong, "TN - ĐN");
});
