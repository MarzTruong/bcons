// Lịch đợt đọc từ nguon/pttt-cdt.json của từng dự án (Central Park và Newsky dùng chung lõi tính).
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calc, calcWith } from "./calc.mjs";
import { loadCdt, planFromJson } from "./plans-json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CP = path.join(ROOT, "du-an", "bcons-central-park");
const NS = path.join(ROOT, "du-an", "bcons-newsky");
const cp = loadCdt(CP);
const ns = loadCdt(NS);

test("Central Park: calcWith(planFromJson) trùng calc() cho cả 5 PTTT với căn A18-09", () => {
  const A1809 = { "01": 3721073155, "02": 4066746600, "03": 4066746600, "04": 3967111308, "05": 3967111308 };
  for (const k of ["01", "02", "03", "04", "05"]) {
    const { key, ...goc } = calc(k, A1809[k]);
    assert.deepEqual(calcWith(planFromJson(cp, k), A1809[k]), goc, `PTTT ${k}`);
  }
});

test("mỗi PTTT của cả hai dự án: dotChiTiet đủ độ dài dot, cộng đủ 100%, có nhãn và mốc", () => {
  for (const cdt of [cp, ns]) {
    for (const [k, p] of Object.entries(cdt.pttt)) {
      assert.equal(p.dotChiTiet.length, p.dot.length, `PTTT ${k}`);
      assert.equal(p.dot.reduce((a, b) => a + b, 0), 100, `PTTT ${k}`);
      for (const d of p.dotChiTiet) assert.ok(d.l && d.w && d.k, `PTTT ${k} đợt thiếu nhãn`);
    }
  }
});

test("planFromJson: trần lãi chỉ khi tranLai khác null; vat, phí bảo trì lấy từ chung", () => {
  assert.equal(planFromJson(cp, "03").cap, true);
  assert.equal(planFromJson(cp, "05").cap, false);
  assert.equal(planFromJson(ns, "09").cap, true);
  assert.equal(planFromJson(ns, "10").cap, false);
  assert.equal(planFromJson(ns, "10").vat, 0.1);
  assert.equal(planFromJson(ns, "10").fee, 0.02);
  assert.throws(() => planFromJson(ns, "01"), /Không có PTTT/);
});

test("Newsky căn B1.3-01 khớp file giá CĐT: PTTT 09, 10 đúng từng đồng, PTTT 08 lệch ≤ 3 đồng", () => {
  const r09 = calcWith(planFromJson(ns, "09"), 4060690141);
  assert.equal(r09.handover, 1136993239);
  assert.equal(r09.loan, 2233379578);
  const r10 = calcWith(planFromJson(ns, "10"), 3973385292);
  assert.equal(r10.handover, 1112547882);
  assert.ok(Math.abs(r10.loan - 2185361911) <= 1, `PTTT 10 vay ${r10.loan}`); // làm tròn từng đợt, Master File làm tròn một lần
  const r08 = calcWith(planFromJson(ns, "08"), 3831261156);
  assert.ok(Math.abs(r08.handover - 1072753122) <= 3, `PTTT 08 bàn giao ${r08.handover}`);
  assert.equal(r08.loan, 0);
  for (const r of [r09, r10, r08]) {
    const tong = r.rows.reduce((s, x) => s + x.amt, 0);
    assert.ok(Math.abs(tong - r.G) <= 10, `tổng đợt ${tong} so với giá có VAT ${r.G}`);
  }
});
