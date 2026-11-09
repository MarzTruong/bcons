import test from "node:test";
import assert from "node:assert/strict";
import { parseSpec } from "../src/spec.ts";

const card = (extra = {}) => ({ tag: "T", big: "1", sub: "s", cueKey: "a", offset: 0, sourceId: "s1", ...extra });
const base = (props, template = "data-cards", status = "draft") => ({
  name: "demo",
  status,
  scenes: [{ id: "scene1", template, markup: "xin chào", cues: { a: "xin" }, props }],
});
const cards = (n) => ({ kicker: "K", title: "T", cards: Array.from({ length: n }, () => card()) });

test("spec hợp lệ tối thiểu parse thành công", () => {
  const s = parseSpec(base(cards(2)));
  assert.equal(s.scenes[0].template, "data-cards");
});

test("template lạ bị từ chối", () => {
  assert.throws(() => parseSpec(base(cards(2), "foo")));
});

test("thiếu sourceId báo đúng đường dẫn", () => {
  const p = cards(2);
  delete p.cards[0].sourceId;
  assert.throws(() => parseSpec(base(p)), /scenes\.0\.props\.cards\.0\.sourceId/);
});

test("status sai bị từ chối", () => {
  assert.throws(() => parseSpec(base(cards(2), "data-cards", "ok")));
});

test("data-cards 4 thẻ bị từ chối", () => {
  assert.throws(() => parseSpec(base(cards(4))));
});

test("compare-bars cần 2 đến 4 cột", () => {
  const bar = { label: "a", value: 1, cueKey: "a", sourceId: "s1" };
  const ok = { kicker: "K", title: "T", unit: "%", bars: [bar, bar] };
  assert.doesNotThrow(() => parseSpec(base(ok, "compare-bars")));
  assert.throws(() => parseSpec(base({ ...ok, bars: [bar] }, "compare-bars")));
});

test("project-close: ghiChu tùy chọn (dòng chữ nhỏ cuối video chỉ hiện khi spec ghi, anh duyệt từng video)", async () => {
  const { ProjectCloseProps } = await import("../src/spec.ts");
  assert.equal(ProjectCloseProps.safeParse({ message: "x" }).success, true);
  assert.equal(ProjectCloseProps.parse({ message: "x", ghiChu: "Thông tin mang tính tham khảo" }).ghiChu, "Thông tin mang tính tham khảo");
});
