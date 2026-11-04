import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSpecPath,
  readSourceIds,
  collectSourceIds,
  checkSources,
  assertApproved,
  parseMarkup,
} from "../scripts/spec-tools.mjs";

const md = `# X\n\n## Bảng nguồn\n\n| id | Số liệu | Ngày | Nguồn | Link |\n| --- | --- | --- | --- | --- |\n| s1 | a | 1 | n | l |\n| s2 | b | 2 | n | |\n\n## Khác\n| s9 | không tính |\n`;
const spec = (status = "draft", ids = ["s1", "s9"]) => ({
  name: "demo",
  status,
  scenes: [
    {
      id: "scene1",
      template: "data-cards",
      markup: "x",
      cues: {},
      props: { kicker: "", title: "", cards: ids.map((s) => ({ tag: "", big: "", sub: "", cueKey: "a", sourceId: s })) },
    },
  ],
});

test("resolveSpecPath từ chối tên có ..", () => {
  assert.throws(() => resolveSpecPath("../x"));
  assert.throws(() => resolveSpecPath("A b"));
});
test("resolveSpecPath trả đường dẫn specs/<name>.json", () => {
  assert.match(resolveSpecPath("dong-nai-ha-tang").replaceAll("\\", "/"), /specs\/dong-nai-ha-tang\.json$/);
});
test("readSourceIds chỉ đọc bảng dưới '## Bảng nguồn'", () => {
  assert.deepEqual(readSourceIds(md), ["s1", "s2"]);
});
test("collectSourceIds gom mọi sourceId", () => {
  assert.deepEqual(collectSourceIds(spec()).sort(), ["s1", "s9"]);
});
test("checkSources báo id thiếu", () => {
  assert.deepEqual(checkSources(spec(), md), { ok: false, missing: ["s9"] });
  assert.deepEqual(checkSources(spec("draft", ["s1"]), md), { ok: true, missing: [] });
});
test("assertApproved chặn draft", () => {
  assert.throws(() => assertApproved(spec("draft")), /draft/);
  assert.doesNotThrow(() => assertApproved(spec("approved")));
});
test("parseMarkup tách chữ hiển thị và chữ đọc", () => {
  assert.deepEqual(parseMarkup("gần 2,4{hai phẩy bốn} tỷ -{} x"), [
    { show: "gần", say: "gần" },
    { show: "2,4", say: "hai phẩy bốn" },
    { show: "tỷ", say: "tỷ" },
    { show: "-", say: "" },
    { show: "x", say: "x" },
  ]);
});

import { readSourceRows, checkSourceLinks, checkCues, checkTimestamps } from "../scripts/spec-tools.mjs";

test("readSourceIds dừng ở mọi tiêu đề, kể cả ###", () => {
  const m = `## Bảng nguồn\n\n| id | x |\n| --- | --- |\n| s1 | a |\n\n### Số đã loại\n\n| id | x |\n| --- | --- |\n| s7 | b |\n`;
  assert.deepEqual(readSourceIds(m), ["s1"]);
});

test("checkSourceLinks chỉ nhận link http(s) cho id đang dùng", () => {
  const m = `## Bảng nguồn\n\n| id | Số liệu | Ngày | Nguồn | Link |\n| --- | --- | --- | --- | --- |\n| s1 | a | 1 | n | https://x.vn/a |\n| s9 | b | 2 | n | chưa có link |\n`;
  assert.deepEqual(checkSourceLinks(spec("approved", ["s1", "s9"]), m), { ok: false, unlinked: ["s9"] });
  assert.deepEqual(checkSourceLinks(spec("approved", ["s1"]), m), { ok: true, unlinked: [] });
  assert.equal(readSourceRows(m)[0].link, "https://x.vn/a");
});

const cueSpec = (cues, cueKey = "a", markup = "một, hai và ba.") => ({
  name: "demo",
  status: "approved",
  scenes: [
    {
      id: "scene1",
      template: "data-cards",
      markup,
      cues,
      props: {
        kicker: "",
        title: "",
        cards: [1, 2].map((i) => ({ tag: "", big: "", sub: "", cueKey: i === 1 ? cueKey : "b", offset: 0, sourceId: "s1" })),
      },
    },
  ],
});

test("checkCues báo cueKey thiếu trong cues", () => {
  const errs = checkCues(cueSpec({ a: "một," }));
  assert.equal(errs.length, 1);
  assert.match(errs[0], /scene1.*"b"/);
});
test("checkCues báo chữ cue không có trong lời bình (kể cả dấu câu)", () => {
  const errs = checkCues(cueSpec({ a: "một", b: "hai" }));
  assert.match(errs.join("\n"), /scene1.*"một"/s);
});
test("checkCues pass khi hợp lệ", () => {
  assert.deepEqual(checkCues(cueSpec({ a: "một,", b: "hai" })), []);
});
test("checkCues yêu cầu cues.value cho stat-hero", () => {
  const s = {
    name: "demo",
    status: "approved",
    scenes: [{ id: "scene1", template: "stat-hero", markup: "x", cues: {}, props: { sourceId: "s1" } }],
  };
  assert.match(checkCues(s).join("\n"), /value/);
});

test("checkTimestamps bắt lệch số cảnh, id và lời đọc", () => {
  const s = cueSpec({ a: "một,", b: "hai" });
  const ok = { scenes: [{ id: "scene1", speech: "một, hai và ba." }] };
  assert.deepEqual(checkTimestamps(s, ok), []);
  assert.match(checkTimestamps(s, { scenes: [] }).join("\n"), /số cảnh/);
  assert.match(checkTimestamps(s, { scenes: [{ id: "x", speech: "một, hai và ba." }] }).join("\n"), /id/);
  assert.match(checkTimestamps(s, { scenes: [{ id: "scene1", speech: "cũ" }] }).join("\n"), /lời bình.*generate-voice/s);
});
