import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MAY, writeBeat, machines, runnerOf, standbysOf, startRole, requestSwitch, readSwitch, clearSwitch } from "../scripts/bot/may.mjs";

const T = 1_000_000_000_000;
const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), "may-"));

test("startRole: chưa có máy nào chạy (hoặc máy chạy đã mất liên lạc) thì chạy; có máy đang chạy thì chờ", () => {
  const d = dir();
  assert.equal(startRole(d, "LAPTOP", T), "chay");
  writeBeat(d, "PC", "chay", T);
  assert.equal(startRole(d, "LAPTOP", T + 10_000), "cho");
  assert.equal(startRole(d, "LAPTOP", T + MAY.deadMs + 1), "chay", "PC im quá lâu: coi như tắt");
  assert.equal(startRole(d, "PC", T + 10_000), "chay", "chính máy đó mở lại thì chạy tiếp");
});

test("machines / runnerOf / standbysOf: mỗi máy một file, biết máy nào chạy, máy nào chờ, còn sống không", () => {
  const d = dir();
  writeBeat(d, "PC", "chay", T);
  writeBeat(d, "LAPTOP", "cho", T + 5_000);
  writeBeat(d, "CU", "cho", T - MAY.deadMs - 10);
  const ms = machines(d, T + 10_000);
  assert.equal(ms.length, 3);
  assert.equal(runnerOf(d, T + 10_000)?.host, "PC");
  assert.equal(runnerOf(d, T + 10_000, "PC"), null, "bỏ qua chính mình");
  assert.deepEqual(standbysOf(d, T + 10_000).map((m) => m.host), ["LAPTOP"], "máy chờ đã chết không hiện");
});

test("requestSwitch / readSwitch / clearSwitch: lệnh chuyển ghi tên máy nhận và thời điểm", () => {
  const d = dir();
  assert.equal(readSwitch(d), null);
  requestSwitch(d, "LAPTOP", "PC", T);
  assert.deepEqual(readSwitch(d), { to: "LAPTOP", from: "PC", at: T });
  clearSwitch(d);
  assert.equal(readSwitch(d), null);
});

test("tên máy lạ (dấu cách, ký tự đặc biệt) vẫn ghi file an toàn", () => {
  const d = dir();
  writeBeat(d, "Máy của anh/PC 1", "chay", T);
  assert.equal(runnerOf(d, T)?.host, "Máy của anh/PC 1");
  assert.ok(fs.readdirSync(d).every((f) => /^[\w.-]+$/.test(f)));
});

test("standbyDecision: máy chờ nhận việc khi có lệnh chuyển cho nó, hoặc máy đang chạy mất liên lạc; không thì chờ tiếp", async () => {
  const { standbyDecision } = await import("../scripts/bot/may.mjs");
  const d = dir();
  writeBeat(d, "PC", "chay", T);
  assert.equal(standbyDecision(d, "LAPTOP", T + 10_000), "cho");
  requestSwitch(d, "LAPTOP", "PC", T + 20_000);
  assert.equal(standbyDecision(d, "LAPTOP", T + 25_000), "nhan-lenh");
  clearSwitch(d);
  assert.equal(standbyDecision(d, "LAPTOP", T + MAY.deadMs + 5_000), "nhan-tu-dong");
  requestSwitch(d, "MAY-KHAC", "PC", T);
  writeBeat(d, "PC", "chay", T + 1);
  assert.equal(standbyDecision(d, "LAPTOP", T + 10), "cho", "lệnh chuyển cho máy khác thì mình vẫn chờ");
});

test("standbyDecision: vừa nhường bot cho máy khác (dưới 5 phút) thì không tự lấy lại, dù Drive chưa kịp báo máy kia đã chạy", async () => {
  const { standbyDecision } = await import("../scripts/bot/may.mjs");
  const d = dir();
  writeBeat(d, "LAPTOP", "cho", T); // Drive chưa cập nhật: laptop vẫn ghi là "chờ"
  requestSwitch(d, "LAPTOP", "PC", T);
  assert.equal(standbyDecision(d, "PC", T + 20_000), "cho");
  assert.equal(standbyDecision(d, "PC", T + 6 * 60_000), "nhan-tu-dong", "quá 5 phút mà máy kia không chạy thì PC lấy lại");
});
