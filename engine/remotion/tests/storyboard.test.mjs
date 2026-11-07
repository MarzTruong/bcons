import test from "node:test";
import assert from "node:assert/strict";
import { estimateTimestamps, checkTimestamps } from "../scripts/spec-tools.mjs";
import { storyboardFrames } from "../scripts/storyboard.mjs";

const spec = {
  name: "x",
  scenes: [
    { id: "s1", markup: "Lãi suất 8,5%,{tám phẩy năm phần trăm,} khá cao.", cues: {} },
    { id: "s2", markup: "Bcons{Bee Cons} Central Park.", cues: {} },
  ],
};

test("estimateTimestamps: chưa có giọng thì ước tính từ lời đọc (số âm tiết, nghỉ ở dấu câu), đúng định dạng timestamps", () => {
  const ts = estimateTimestamps(spec);
  assert.equal(ts.uocTinh, true);
  assert.equal(ts.scenes.length, 2);
  assert.deepEqual(checkTimestamps(spec, ts), [], "khớp lời đọc như giọng thật");
  const s1 = ts.scenes[0];
  assert.deepEqual(s1.words.map((w) => w.text), ["Lãi", "suất", "8,5%,", "khá", "cao."]);
  for (let i = 1; i < s1.words.length; i++) assert.ok(s1.words[i].start >= s1.words[i - 1].end);
  const pct = s1.words[2];
  assert.ok(pct.end - pct.start > s1.words[0].end - s1.words[0].start, "chữ đọc dài (5 âm tiết) lâu hơn chữ 1 âm tiết");
  assert.ok(s1.durationSec >= s1.words.at(-1).end);
  assert.ok(s1.durationSec > 1.5 && s1.durationSec < 6);
});

test("storyboardFrames: mỗi cảnh 3 khung (vào cảnh, giữa, cuối lời), nằm trong cảnh", () => {
  const ts = estimateTimestamps(spec);
  const f = storyboardFrames(ts);
  assert.equal(f.length, 2);
  const starts = [0];
  for (const s of ts.scenes.slice(0, -1)) starts.push(starts.at(-1) + 12 + Math.ceil(s.durationSec * 30) + 24);
  f.forEach((sc, i) => {
    assert.equal(sc.frames.length, 3);
    const end = starts[i] + 12 + Math.ceil(ts.scenes[i].durationSec * 30) + 24;
    assert.ok(sc.frames.every((x) => x >= starts[i] && x < end), JSON.stringify(sc));
    assert.ok(sc.frames[0] < sc.frames[1] && sc.frames[1] < sc.frames[2]);
  });
});
