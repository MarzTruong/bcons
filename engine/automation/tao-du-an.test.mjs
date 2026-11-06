import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { taoDuAn } from "./tao-du-an.mjs";

function fakeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tda-"));
  fs.mkdirSync(path.join(root, "du-an", "_mau", "video"), { recursive: true });
  fs.writeFileSync(path.join(root, "du-an", "_mau", "video", ".gitkeep"), "");
  fs.writeFileSync(path.join(root, "du-an", "_mau", "project.json"), JSON.stringify({ ma: "", ten: "" }));
  fs.writeFileSync(path.join(root, "du-an", "_mau", "thong-tin.md"), "# <Tên dự án>\n");
  fs.mkdirSync(path.join(root, "du-an", "co-roi"));
  return root;
}

test("chép _mau sang du-an/<mã>, điền mã và tên", () => {
  const root = fakeRepo();
  const dir = taoDuAn("bcons-solary", { ten: "Bcons Solary", root });
  assert.equal(dir, path.join(root, "du-an", "bcons-solary"));
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
  assert.equal(cfg.ma, "bcons-solary");
  assert.equal(cfg.ten, "Bcons Solary");
  assert.match(fs.readFileSync(path.join(dir, "thong-tin.md"), "utf8"), /^# Bcons Solary/);
  assert.ok(fs.existsSync(path.join(dir, "video", ".gitkeep")));
});

test("từ chối mã sai dạng và mã đã có", () => {
  const root = fakeRepo();
  assert.throws(() => taoDuAn("Bcons Solary", { root }), /a-z, 0-9/);
  assert.throws(() => taoDuAn("_mau", { root }), /a-z, 0-9/);
  assert.throws(() => taoDuAn("co-roi", { root }), /đã có/);
});
