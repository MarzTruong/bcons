import test from "node:test";
import assert from "node:assert/strict";
import { parseCanh, mergeScenes, neighborText } from "../scripts/voice-tools.mjs";

test("parseCanh: 'canh1', '1,3', 'scene2' → id cảnh; trống = tất cả", () => {
  assert.deepEqual(parseCanh("canh1"), ["scene1"]);
  assert.deepEqual(parseCanh("1,3"), ["scene1", "scene3"]);
  assert.deepEqual(parseCanh("scene2"), ["scene2"]);
  assert.equal(parseCanh(undefined), null);
});

test("mergeScenes: thay cảnh tạo lại, giữ cảnh cũ, đúng thứ tự spec", () => {
  const old = { scenes: [{ id: "scene1", v: 1 }, { id: "scene2", v: 1 }] };
  const merged = mergeScenes(old, [{ id: "scene1", v: 2 }], ["scene1", "scene2"]);
  assert.deepEqual(merged.map((s) => s.v), [2, 1]);
  assert.throws(() => mergeScenes({ scenes: [] }, [{ id: "scene1" }], ["scene1", "scene2"]), /scene2/);
});

test("neighborText: lời cảnh trước/sau làm ngữ cảnh để giọng liền mạch", () => {
  const sp = ["a", "b", "c"];
  assert.deepEqual(neighborText(sp, 0), { previous_text: undefined, next_text: "b" });
  assert.deepEqual(neighborText(sp, 1), { previous_text: "a", next_text: "c" });
});
