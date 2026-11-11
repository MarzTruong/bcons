import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { taoPhieu } from "./du-lieu.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CP = path.join(ROOT, "du-an", "bcons-central-park");
const NS = path.join(ROOT, "du-an", "bcons-newsky");
const a1809 = { ma: "A18-09", loai: "2PN-2WC", thap: "Orchid (A)", tang: 18, dtTimTuong: 62.02, dtThongThuy: 56.91, giaChuaVat: { "01": 3721073155, "02": 4066746600, "03": 4066746600, "04": 3967111308, "05": 3967111308 }, tinhTrang: "Trống" };
const b1301 = { ma: "B1.3-01", loai: "3PN-2WC", tang: 3, dtTimTuong: 77.81, dtThongThuy: 70.06, giaChuaVat: { "08": 3831261156, "09": 4060690141, "10": 3973385292 }, tinhTrang: "Trống" };
const ngay = new Date(2026, 10, 11);

test("Central Park A18-09 PTTT 03: các khoản cộng đủ giá có VAT, có vay và trả góp", () => {
  const p = taoPhieu({ projDir: CP, can: a1809, pttt: "03", ngay });
  const tong = p.tong.tuCoTruocBanGiao + p.tong.khoanVay + p.tong.banGiao + p.tong.soHong;
  assert.ok(Math.abs(tong - p.gia.coVat) <= 10, `${tong} so với ${p.gia.coVat}`);
  assert.equal(p.gia.chuaVat, 4066746600);
  assert.equal(p.pttt.coTranLai, true);
  assert.equal(p.vay.soTien, p.tong.khoanVay);
  assert.ok(p.vay.traGopThang > 0 && p.vay.lai === 9.5 && p.vay.namVay === 20);
  assert.equal(p.ngay, "11/11/2026");
  assert.equal(p.dot.length, 7);
  assert.ok(p.dot.some((d) => d.loai === "nganhang"));
});

test("trần lãi: có ở Central Park 03 và Newsky 09, không có ở Central Park 05 và Newsky 10", () => {
  assert.equal(taoPhieu({ projDir: CP, can: a1809, pttt: "05" }).pttt.coTranLai, false);
  assert.equal(taoPhieu({ projDir: NS, can: b1301, pttt: "09" }).pttt.coTranLai, true);
  assert.equal(taoPhieu({ projDir: NS, can: b1301, pttt: "10" }).pttt.coTranLai, false);
});

test("PTTT không vay (Central Park 01, Newsky 08): không có vay và không có đợt ngân hàng; Newsky 08 đủ 12 đợt", () => {
  const p01 = taoPhieu({ projDir: CP, can: a1809, pttt: "01" });
  assert.equal(p01.vay, null);
  assert.ok(!p01.dot.some((d) => d.loai === "nganhang"));
  const p08 = taoPhieu({ projDir: NS, can: b1301, pttt: "08" });
  assert.equal(p08.vay, null);
  assert.equal(p08.dot.length, 12);
});

test("phiếu không chứa hoa hồng, số điện thoại hay ghi chú nội bộ", () => {
  for (const [dir, can, k] of [[CP, a1809, "05"], [CP, a1809, "03"], [NS, b1301, "10"]]) {
    const s = JSON.stringify(taoPhieu({ projDir: dir, can, pttt: k }));
    assert.ok(!/hoa ?hồng|hoaHong|0938|sdt|⚠|ghi nhầm/i.test(s), `${k}: ${s.match(/hoa ?hồng|hoaHong|0938|sdt|⚠|ghi nhầm/i)}`);
  }
});

test("không lập phiếu cho căn đã cọc, LOCK, ngoài giỏ hàng, PTTT lạ hoặc thiếu giá", () => {
  for (const tt of ["ĐÃ CỌC", "LOCK", "Không có trong GHC"]) {
    assert.throws(() => taoPhieu({ projDir: CP, can: { ...a1809, tinhTrang: tt }, pttt: "03" }), /^Error: Không lập phiếu:/, tt);
  }
  assert.throws(() => taoPhieu({ projDir: NS, can: b1301, pttt: "03" }), /Không lập phiếu:/);
  assert.throws(() => taoPhieu({ projDir: CP, can: { ...a1809, giaChuaVat: {} }, pttt: "03" }), /Không lập phiếu:/);
});

test("khách: không tên thì xưng anh/chị; tên dài giữ nguyên; chấp nhận 'PTTT 03'", () => {
  assert.equal(taoPhieu({ projDir: CP, can: a1809, pttt: "03" }).khach.xungHo, "anh/chị");
  const dai = "Nguyễn Thị Minh Anh Thư Khánh Linh Bảo Châu Ngọc Diệp Phương Thảo";
  assert.equal(taoPhieu({ projDir: CP, can: a1809, pttt: "PTTT 03", khach: { ten: dai } }).khach.xungHo, `anh/chị ${dai}`);
});

test("lienHe có tên và đường dẫn mã QR, không có số điện thoại", () => {
  const p = taoPhieu({ projDir: CP, can: a1809, pttt: "03" });
  assert.equal(p.lienHe.ten, "Tuấn Trương");
  assert.match(p.lienHe.qrLink, /^HTTPS:\/\//i);
  assert.equal(p.lienHe.sdt, undefined);
});
