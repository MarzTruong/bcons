import test from "node:test";
import assert from "node:assert/strict";
import { HOOK_FRAMES, hookState, danhSachState } from "../src/moDau.ts";

// Mốc theo bản AGY kiểu 1 (hook 0–3 s ở 30 fps; danh sách mục hiện lần lượt, đếm "Đã xem n/N").

test("hook: khung 0 khớp ảnh bìa (chưa zoom, số chưa bật, hook hiện đủ chữ, dòng phụ đã hiện một phần)", () => {
  const s = hookState(0, 2);
  assert.equal(s.bgScale, 1);
  assert.equal(s.numScale, 1);
  assert.equal(s.blockOpacity, 1);
  assert.equal(s.overlayOpacity, 1);
  assert.equal(s.wordsOn.length, 2);
  assert.equal(s.wordsOn[0], false); // 0,22 s mới sáng từ đầu
});

test("hook: số bật to nhẹ quanh 0,5 s rồi về cỡ thường; gạch nhấn đầy ở 1,0 s", () => {
  assert.ok(hookState(0.45, 2).numScale > 1.07);
  assert.equal(hookState(2, 2).numScale, 1);
  assert.ok(hookState(0.5, 2).underline < hookState(1, 2).underline);
  assert.equal(hookState(1, 2).underline, 68);
});

test("hook: từ trên dòng cuối sáng lần lượt", () => {
  assert.deepEqual(hookState(0.3, 3).wordsOn, [true, false, false]);
  assert.deepEqual(hookState(1.0, 3).wordsOn, [true, true, true]);
});

test("hook: hết 3 s thì mờ hẳn để lộ cảnh 1 bên dưới, khối chữ nâng 44 px", () => {
  const mid = hookState(2.45, 2);
  assert.equal(mid.overlayOpacity, 1);
  const end = hookState(3, 2);
  assert.equal(end.overlayOpacity, 0);
  assert.equal(end.blockShift, -44);
  assert.equal(HOOK_FRAMES, 90);
});

test("hook: ngoài 0–3 s thì kẹp lại", () => {
  assert.deepEqual(hookState(-1, 2), hookState(0, 2));
  assert.deepEqual(hookState(9, 2), hookState(3, 2));
});

const reveals = [15, 85, 150]; // frame từng mục hiện (theo cues)
test("danh sách: trước mục đầu chưa hiện gì, đếm 0", () => {
  const s = danhSachState(5, reveals, 210, 3);
  assert.equal(s.seen, 0);
  assert.deepEqual(s.rows.map((r) => r.phase), ["hidden", "hidden", "hidden"]);
});

test("danh sách: mục hiện lần lượt, mục trước thành 'done', đếm tăng", () => {
  const a = danhSachState(100, reveals, 210, 3);
  assert.equal(a.seen, 2);
  assert.deepEqual(a.rows.map((r) => r.phase), ["done", "active", "hidden"]);
  const b = danhSachState(160, reveals, 210, 3);
  assert.equal(b.seen, 3);
  assert.deepEqual(b.rows.map((r) => r.phase), ["done", "done", "active"]);
});

test("danh sách: mục vào mượt trong ~0,35 s (10 khung)", () => {
  assert.equal(danhSachState(15, reveals, 210, 3).rows[0].enter, 0);
  assert.equal(danhSachState(25, reveals, 210, 3).rows[0].enter > 0.9, true);
  assert.equal(danhSachState(60, reveals, 210, 3).rows[0].enter, 1);
});

test("danh sách: tổng kết gom cả 3 mục, đếm đủ N/N, băng hiện dần", () => {
  const s = danhSachState(215, reveals, 210, 3);
  assert.equal(s.summary, true);
  assert.equal(s.seen, 3);
  assert.deepEqual(s.rows.map((r) => r.phase), ["summary", "summary", "summary"]);
  assert.equal(danhSachState(210, reveals, 210, 3).bannerP, 0);
  assert.equal(danhSachState(220, reveals, 210, 3).bannerP, 1);
});

test("danh sách: mục hiện trước khi cue sau đã tới, không đảo thứ tự", () => {
  const s = danhSachState(90, [15, 85, 85], 210, 3); // 2 mục cùng mốc
  assert.deepEqual(s.rows.map((r) => r.phase), ["done", "done", "active"]);
});
