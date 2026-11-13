import test from "node:test";
import assert from "node:assert/strict";
import { loadCdt, planFromJson } from "../landing/plans-json.mjs";
import { calcWith, pmt } from "../landing/calc.mjs";
import { phuongAn, giaCoVat } from "./tai-chinh.mjs";

const cdt = loadCdt(new URL("../../du-an/bcons-newsky", import.meta.url).pathname);
const plans = Object.fromEntries(["08", "09", "10"].map((k) => [k, planFromJson(cdt, k)]));
// B1.3-01, giá PTTT 09 đã có trong test landing (đáp án đối chiếu với Master File).
const P09 = 4060690141;

test("đáp án đã đối chiếu: B1.3-01 PTTT 09 = vay 2,233 tỷ, nhận nhà 1,137 tỷ (khớp test landing)", () => {
  const a = phuongAn(plans["09"], P09);
  assert.equal(a.khoanVay, 2233379578);
  assert.equal(a.handover, 1136993239);
  assert.equal(a.G, 4466759155);
  assert.equal(a.nhanNha, 1136993239 + 81213803);
  assert.equal(a.tuCo, 893351831);
});

test("mỗi PTTT: các đợt cộng lại đúng giá có VAT (08, 09, 10)", () => {
  for (const k of ["08", "09", "10"]) {
    const a = phuongAn(plans[k], P09);
    const tong = a.rows.reduce((s, r) => s + r.amt, 0);
    assert.ok(Math.abs(tong - a.G) <= 2, `PTTT ${k}: lệch ${tong - a.G}`);
  }
});

test("vay tùy chọn: tự có + vay + nhận nhà + sổ hồng luôn bằng giá có VAT (không lọt đợt sổ hồng vào tự có)", () => {
  for (const k of ["08", "09", "10"]) {
    for (const t of [0, 0.5, 0.6]) {
      const a = phuongAn(plans[k], P09, { vay: t });
      assert.equal(a.khoanVay, Math.round(a.G * t));
      assert.ok(Math.abs(a.tuCo + a.khoanVay + a.handover + a.so - a.G) <= 2, `PTTT ${k} vay ${t}`);
    }
  }
  // Lỗi cũ của bản AGY: bỏ sót đợt sổ hồng nên tự có cao hơn đúng 5% giá chưa VAT.
  const a = phuongAn(plans["09"], P09, { vay: 0.5 });
  const bangAgy = a.G - a.khoanVay - a.handover;
  assert.equal(bangAgy - a.tuCo, a.so);
  assert.ok(a.so > 200e6);
});

test("vay 70% trên PTTT 09 (25% nhận nhà + 5% sổ) cho tự có 0, không âm", () => {
  const a = phuongAn(plans["09"], P09, { vay: 0.7 });
  assert.ok(a.tuCo >= 0 && a.tuCo < 5e6);
});

test("trả góp dùng pmt của lõi: lãi 9,5%/năm, 20 năm, chỉnh được; không vay thì 0 (PTTT 08)", () => {
  const a = phuongAn(plans["09"], P09);
  assert.equal(a.traGopThang, Math.round(pmt(a.khoanVay, 9.5, 20)));
  assert.ok(a.traGopThang > 0);
  const b = phuongAn(plans["09"], P09, { lai: 8, nam: 25 });
  assert.equal(b.traGopThang, Math.round(pmt(a.khoanVay, 8, 25)));
  const c = phuongAn(plans["08"], P09);
  assert.equal(c.khoanVay, 0);
  assert.equal(c.traGopThang, 0);
});

test("trần lãi 6,9% chỉ PTTT 09 và chỉ khi theo lịch CĐT; PTTT 10, 08 và vay tùy chọn thì không", () => {
  assert.equal(phuongAn(plans["09"], P09).coTranLai, true);
  assert.equal(phuongAn(plans["10"], P09).coTranLai, false);
  assert.equal(phuongAn(plans["08"], P09).coTranLai, false);
  assert.equal(phuongAn(plans["09"], P09, { vay: 0.7 }).coTranLai, false);
  assert.equal(phuongAn(plans["09"], P09, { vay: 0 }).coTranLai, false);
});

test("tính trùng lõi calcWith từng đồng; giá có VAT làm tròn", () => {
  const a = phuongAn(plans["10"], 3973385292);
  const r = calcWith(plans["10"], 3973385292);
  assert.deepEqual(a.rows, r.rows);
  assert.equal(giaCoVat(4060690141), Math.round(4060690141 * 1.1));
});

test("tỷ lệ vay sai thì báo lỗi", () => {
  assert.throws(() => phuongAn(plans["09"], P09, { vay: 1.5 }), /không hợp lệ/);
  assert.throws(() => phuongAn(plans["09"], P09, { vay: "abc" }), /không hợp lệ/);
});
