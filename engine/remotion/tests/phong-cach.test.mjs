import test from "node:test";
import assert from "node:assert/strict";
import { STYLE_NAMES } from "../src/spec.ts";
import { TAPCHI, BANG, issueOf, flapChar } from "../src/issues.ts";

test("style tapchi và bangls có trong spec", () => {
  assert.ok(STYLE_NAMES.includes("tapchi"));
  assert.ok(STYLE_NAMES.includes("bangls"));
});

test("issueOf: màu bìa xoay vòng theo số video, video liền nhau khác màu", () => {
  assert.equal(TAPCHI.length, 5);
  assert.equal(BANG.length, 3);
  const a = issueOf("tapchi", 7);
  const b = issueOf("tapchi", 8);
  assert.notEqual(a.ground, b.ground);
  assert.equal(issueOf("tapchi", 7).ground, issueOf("tapchi", 12).ground, "chu kỳ 5");
  assert.equal(issueOf("bangls", 1).frame, issueOf("bangls", 4).frame, "chu kỳ 3");
  assert.equal(issueOf("tapchi", undefined).ground, TAPCHI[0].ground, "không có số thì màu đầu");
  for (const p of [...TAPCHI, ...BANG]) for (const v of Object.values(p)) if (typeof v === "string" && v.startsWith("#")) assert.match(v, /^#[0-9a-f]{6}$/i);
});

test("flapChar: chữ số lật qua vài số rồi dừng đúng; ký tự khác hiện thẳng; trước giờ thì trống", () => {
  assert.equal(flapChar("9", 0, 10, 0), " ");
  const mid = flapChar("9", 12, 10, 0);
  assert.match(mid, /^\d$/);
  assert.equal(flapChar("9", 40, 10, 0), "9");
  assert.equal(flapChar("%", 11, 10, 0), "%");
  assert.equal(flapChar("5", 12, 10, 3), " ", "ô sau lật trễ hơn ô trước");
  assert.equal(flapChar("5", 60, 10, 3), "5");
});

test("tapchi: trang ruột cùng nền bìa, chữ cùng màu chữ bìa (anh 07/11: trang tối khó đọc, phụ đề mất)", () => {
  for (const t of TAPCHI) {
    assert.equal(t.page, t.ground, t.name);
    assert.equal(t.pageInk, t.ink, t.name);
  }
});
