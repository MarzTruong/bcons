import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { planMoves, rewriteAssetPaths, run } from "./doi-thu-muc.mjs";

const DA = "du-an/bcons-central-park";

function fakeRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "doi-"));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  return root;
}
const quiet = { log: () => {} };
const read = (root, rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("spec, timestamps, kịch bản, storyboard, audio về chung một thư mục video", () => {
  const root = fakeRepo({
    "remotion-video/specs/a.json": "{}",
    "remotion-video/specs/a.timestamps.json": "{}",
    "remotion-video/public/audio/a/scene1.mp3": "x",
    "docs/video/a.md": "kb",
    "docs/video/a-storyboard.md": "sb",
  });
  const plan = planMoves(root);
  const to = Object.fromEntries(plan.map((p) => [p.from, p.to]));
  assert.equal(to["remotion-video/specs/a.json"], `${DA}/video/a/spec.json`);
  assert.equal(to["remotion-video/specs/a.timestamps.json"], `${DA}/video/a/timestamps.json`);
  assert.equal(to["remotion-video/public/audio/a"], `${DA}/video/a/audio`);
  assert.equal(to["docs/video/a.md"], `${DA}/video/a/kich-ban.md`);
  assert.equal(to["docs/video/a-storyboard.md"], `${DA}/video/a/storyboard.md`);
  run(root, { chay: true, ...quiet });
  assert.equal(read(root, `${DA}/video/a/audio/scene1.mp3`), "x");
  assert.ok(!fs.existsSync(path.join(root, "remotion-video")));
});

test("đích đã có thì bỏ qua, không ghi đè; nguồn không có thì skip-missing", () => {
  const root = fakeRepo({
    "remotion-video/.env": "MOI",
    "engine/remotion/.env": "CU",
  });
  const p = planMoves(root).find((x) => x.from === "remotion-video/.env");
  assert.equal(p.action, "skip-exists");
  assert.equal(planMoves(root).find((x) => x.from === "docs/bcons-central-park.md").action, "skip-missing");
  run(root, { chay: true, ...quiet });
  assert.equal(read(root, "engine/remotion/.env"), "CU");
  assert.equal(read(root, "remotion-video/.env"), "MOI");
});

test("gộp thư mục đã có (máy anh sau git pull) và chạy lần 2 không làm gì", () => {
  const root = fakeRepo({
    "engine/remotion/package.json": "{}",
    "remotion-video/node_modules/x/index.js": "1",
    "remotion-video/out/video/a.mp4": "v",
    "remotion-video/public/raw-tuan.mp4": "r",
    "data/bang-gia.csv": "g",
    "anh/ẢNH GỐC/1.jpg": "i",
  });
  run(root, { chay: true, ...quiet });
  assert.equal(read(root, "engine/remotion/node_modules/x/index.js"), "1");
  assert.equal(read(root, "engine/remotion/out/video/a.mp4"), "v");
  assert.equal(read(root, `${DA}/assets/raw-tuan.mp4`), "r");
  assert.equal(read(root, "data/bcons-central-park/bang-gia.csv"), "g");
  assert.equal(read(root, "anh/bcons-central-park/ẢNH GỐC/1.jpg"), "i");
  const again = planMoves(root).filter((p) => p.action === "move" || p.action === "merge");
  assert.deepEqual(again, []);
  assert.doesNotThrow(() => run(root, { chay: true, ...quiet }));
});

test("tên có dấu và khoảng trắng dời đúng", () => {
  const root = fakeRepo({
    "map/KCN Biên Hòa 1.geojson": "{}",
    "Gemini Deep Research/ket qua.md": "g",
  });
  run(root, { chay: true, ...quiet });
  assert.equal(read(root, `${DA}/assets/geo/osm-xuat/KCN Biên Hòa 1.geojson`), "{}");
  assert.equal(read(root, `${DA}/nguon/gemini/ket qua.md`), "g");
});

test("chạy thử không dời gì", () => {
  const root = fakeRepo({ "docs/bcons-central-park.md": "t" });
  run(root, quiet);
  assert.ok(fs.existsSync(path.join(root, "docs/bcons-central-park.md")));
});

test("rewriteAssetPaths chỉ đổi khóa file bắt đầu bằng geo/ hoặc images/", () => {
  const out = rewriteAssetPaths({
    name: "geo/x",
    scenes: [{ props: { image: { file: "images/a.jpg" }, layers: [{ file: "geo/b.geojson" }, { file: "assets/geo/c.geojson" }] } }],
  });
  assert.equal(out.name, "geo/x");
  assert.equal(out.scenes[0].props.image.file, "assets/images/a.jpg");
  assert.equal(out.scenes[0].props.layers[0].file, "assets/geo/b.geojson");
  assert.equal(out.scenes[0].props.layers[1].file, "assets/geo/c.geojson");
});

test("spec được viết lại khi dời", () => {
  const root = fakeRepo({
    "remotion-video/specs/a.json": JSON.stringify({ scenes: [{ props: { image: { file: "images/a.jpg" } } }] }),
  });
  run(root, { chay: true, ...quiet });
  assert.equal(JSON.parse(read(root, `${DA}/video/a/spec.json`)).scenes[0].props.image.file, "assets/images/a.jpg");
});
