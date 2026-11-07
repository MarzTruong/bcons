import test from "node:test";
import assert from "node:assert/strict";
import { cometRanges, cometPhase, VIEN } from "../src/vienChay.ts";

test("cometRanges: đoạn sáng dài 'frac' chu vi, chạy vòng; qua điểm đầu thì tách 2 đoạn", () => {
  assert.deepEqual(cometRanges(0.1, 100, 0.12), [[10, 22]]);
  const wrap = cometRanges(0.95, 100, 0.12);
  assert.equal(wrap.length, 2);
  assert.deepEqual(wrap[0].map((x) => +x.toFixed(6)), [95, 100]);
  assert.deepEqual(wrap[1].map((x) => +x.toFixed(6)), [0, 7]);
});

test("cometPhase: chưa vẽ xong viền thì chưa chạy (null); sau đó lặp mỗi VIEN.chuKy khung", () => {
  assert.equal(cometPhase(50, 40, 30), null, "đang vẽ viền");
  assert.equal(cometPhase(70, 40, 30), 0);
  assert.ok(Math.abs(cometPhase(70 + VIEN.chuKy / 2, 40, 30) - 0.5) < 1e-9);
  assert.equal(cometPhase(70 + VIEN.chuKy, 40, 30), 0);
});
