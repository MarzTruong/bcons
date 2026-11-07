// Đối chiếu công cụ tính (calc.mjs) và giá căn mẫu (landing.json) với "đáp án" lấy từ 5 thông báo PTTT của CĐT
// (du-an/bcons-central-park/nguon/pttt-cdt.json). Test cũ so với Master File; test này so với tài liệu gốc của CĐT.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLANS, VAT, FEE, CAP, calc } from "./calc.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROJ = path.join(ROOT, "du-an", "bcons-central-park");
const cdt = JSON.parse(fs.readFileSync(path.join(PROJ, "nguon", "pttt-cdt.json"), "utf8"));
const landing = JSON.parse(fs.readFileSync(path.join(PROJ, "landing", "landing.json"), "utf8"));
const KEYS = ["01", "02", "03", "04", "05"];

test("tỷ lệ từng đợt của 5 PTTT khớp thông báo CĐT, cộng đủ 100%", () => {
  for (const k of KEYS) {
    const want = cdt.pttt[k].dot;
    assert.deepEqual(PLANS[k].rows.map((r) => r.p), want, `PTTT ${k}`);
    assert.equal(want.reduce((a, b) => a + b, 0), 100, `PTTT ${k} cộng 100%`);
  }
});

test("đợt ngân hàng giải ngân đúng vị trí theo CĐT", () => {
  for (const k of KEYS) {
    const loanIdx = PLANS[k].rows.map((r, i) => (r.k === "loan" ? i + 1 : null)).filter(Boolean);
    assert.deepEqual(loanIdx, cdt.pttt[k].vay ?? [], `PTTT ${k}`);
  }
});

test("VAT 10%, phí bảo trì 2%, trần 6,9% chỉ ở PTTT 03 và 04 (không ở 05)", () => {
  assert.equal(VAT, cdt.chung.vat);
  assert.equal(FEE, cdt.chung.phiBaoTri);
  for (const k of KEYS) {
    const coTran = cdt.pttt[k].tranLai != null;
    assert.equal(!!PLANS[k].cap, coTran, `PTTT ${k}`);
    if (coTran) assert.equal(CAP, cdt.pttt[k].tranLai);
  }
  assert.equal(PLANS["05"].cap, undefined, "PTTT 05 không có trần 6,9%");
});

test("tiền: tổng các đợt = giá có VAT; tới bàn giao = 95% giá + 100% VAT (CĐT ghi rõ)", () => {
  const P = 4_000_000_000;
  for (const k of KEYS) {
    const r = calc(k, P);
    const total = r.rows.reduce((a, x) => a + x.amt, 0);
    assert.ok(Math.abs(total - P * (1 + VAT)) <= 2, `PTTT ${k}: tổng ${total}`);
    const truocSo = total - r.so;
    assert.ok(Math.abs(truocSo - (0.95 * P + P * VAT)) <= 2, `PTTT ${k}: tới bàn giao ${truocSo}`);
    assert.ok(Math.abs(r.so - 0.05 * P) <= 1, `PTTT ${k}: đợt sổ 5% không VAT`);
  }
});

test("giá căn mẫu trên landing: PTTT 01 = 02 trừ 8,5%; 04 = 05 = 02 trừ 2,45%; 03 = 02 (sai lệch ≤ 1.000 đồng do làm tròn)", () => {
  for (const u of landing.canMau) {
    const g = u.giaChuaVat;
    const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= 1000, `${u.loai} ${msg}: ${a} vs ${Math.round(b)}`);
    near(g["01"], g["02"] * (1 - cdt.pttt["01"].chietKhau), "PTTT 01");
    near(g["04"], g["02"] * (1 - cdt.pttt["04"].chietKhau), "PTTT 04");
    near(g["05"], g["02"] * (1 - cdt.pttt["05"].chietKhau), "PTTT 05");
    assert.equal(g["03"], g["02"], `${u.loai}: PTTT 03 không chiết khấu`);
  }
});
