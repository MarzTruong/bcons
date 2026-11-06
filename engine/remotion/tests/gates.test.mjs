import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepareRun } from "../scripts/spec-tools.mjs";

const close = (status) => ({
  name: "demo",
  status,
  scenes: [{ id: "scene1", template: "project-close", markup: "xin chào", cues: {}, props: { message: "m" } }],
});
const cardsSpec = {
  name: "demo",
  status: "approved",
  scenes: [
    {
      id: "scene1",
      template: "data-cards",
      markup: "xin chào",
      cues: { a: "xin" },
      props: {
        kicker: "k",
        title: "t",
        cards: [1, 2].map(() => ({ tag: "t", big: "b", sub: "s", cueKey: "a", offset: 0, sourceId: "thieu-id" })),
      },
    },
  ],
};

function fixture(spec, md = "# demo\n\n## Bảng nguồn\n\n| id | x |\n| --- | --- |\n| s1 | a |\n") {
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), "bcons-"));
  const videoDir = path.join(projDir, "video", "demo");
  fs.mkdirSync(videoDir, { recursive: true });
  fs.writeFileSync(path.join(videoDir, "spec.json"), JSON.stringify(spec));
  fs.writeFileSync(path.join(videoDir, "kich-ban.md"), md);
  return { projDir };
}

test("spec draft bị chặn và không gọi mạng", () => {
  let calls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => {
    calls++;
    throw new Error("không được gọi mạng");
  };
  try {
    assert.throws(() => prepareRun("demo", fixture(close("draft"))), /draft/);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(calls, 0);
});

test("sourceId thiếu bị chặn và nêu id", () => {
  assert.throws(() => prepareRun("demo", fixture(cardsSpec)), /thieu-id/);
});

test("spec approved hợp lệ chạy được", () => {
  const r = prepareRun("demo", fixture(close("approved")));
  assert.equal(r.spec.name, "demo");
  assert.match(r.timestampsPath.replaceAll("\\", "/"), /video[\\/]demo[\\/]timestamps\.json$/);
});

test("tên spec không tồn tại báo lỗi rõ", () => {
  const f = fixture(close("approved"));
  assert.throws(() => prepareRun("khong-co", f), /khong-co/);
});

test("spec.name khác tên file bị chặn", () => {
  const spec = close("approved");
  spec.name = "khac";
  assert.throws(() => prepareRun("demo", fixture(spec)), /khac/);
});

test("id có trong bảng nhưng không có link http bị chặn", () => {
  const spec = { ...cardsSpec };
  spec.scenes[0].props.cards.forEach((c) => (c.sourceId = "s1"));
  const md = "## Bảng nguồn\n\n| id | Số liệu | Ngày | Nguồn | Link |\n| --- | --- | --- | --- | --- |\n| s1 | a | chưa có | chưa có | chưa có link |\n";
  assert.throws(() => prepareRun("demo", fixture(spec, md)), /link.*s1/s);
});

test("cue không khớp lời bình bị chặn trước khi tạo giọng", () => {
  const spec = { ...cardsSpec };
  spec.scenes[0].props.cards.forEach((c) => (c.sourceId = "s1"));
  spec.scenes[0].cues = { a: "khongco" };
  const md = "## Bảng nguồn\n\n| id | Số liệu | Ngày | Nguồn | Link |\n| --- | --- | --- | --- | --- |\n| s1 | a | 1 | n | https://x.vn |\n";
  assert.throws(() => prepareRun("demo", fixture(spec, md)), /khongco/);
});
