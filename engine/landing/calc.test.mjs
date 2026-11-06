import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANS, calc, pmt } from "./calc.mjs";

// Số đối chiếu: sheet TraGia của Master File, căn A4-01 (2PN-2WC 53,48 m²).
const P01 = 2805249296;
const P02 = 3065846251;
const P04 = 2990733018;
const near = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const amt = (c, k, i = 0) => c.rows.filter((r) => r.k === k)[i]?.amt;

test("PTTT 02 khớp TraGia A4-01", () => {
  const c = calc("02", P02);
  near(c.G, 3372430876);
  near(c.fee, 61316925);
  near(amt(c, "tt"), 153292313);
  near(amt(c, "hdmb"), 521193863);
  near(c.loan, 1686215438);
  near(c.handover, 858436950);
  near(c.so, 153292313);
  near(c.ownBefore, 674486176);
});

test("PTTT 03 khớp TraGia (đợt 2 = 5% + VAT 10%)", () => {
  const c = calc("03", P02);
  near(amt(c, "hdmb"), 183950775);
  near(c.ownBefore, 674486176);
  near(c.loan, 1686215438);
});

test("PTTT 01 không vay, khớp TraGia", () => {
  const c = calc("01", P01);
  assert.equal(c.loan, 0);
  near(c.G, 3085774226);
  near(c.ownBefore, 2160041958, 3);
  near(c.handover, 785469803);
});

test("PTTT 04/05: 3 lần giải ngân, khớp TraGia", () => {
  for (const k of ["04", "05"]) {
    const c = calc(k, P04);
    assert.equal(c.rows.filter((r) => r.bank).length, 3);
    near(c.loan, 1644903160, 2);
    near(c.ownBefore, 657961264, 2);
    near(c.handover, 837405245);
  }
});

test("tổng các đợt = giá có VAT (lệch tối đa 2 đồng do làm tròn) cho cả 5 PTTT", () => {
  for (const k of Object.keys(PLANS)) {
    const c = calc(k, k === "01" ? P01 : k >= "04" ? P04 : P02);
    near(c.rows.reduce((s, r) => s + r.amt, 0), c.G, 2);
  }
});

test("trần 6,9% chỉ có ở PTTT 03 và 04", () => {
  assert.deepEqual(Object.keys(PLANS).filter((k) => PLANS[k].cap), ["03", "04"]);
});

test("pmt: trả đều gốc + lãi", () => {
  near(pmt(1e9, 12, 1), 88848788, 1);
  assert.equal(pmt(0, 9.5, 20), 0);
  near(pmt(1.2e9, 0, 10), 1e7);
});
