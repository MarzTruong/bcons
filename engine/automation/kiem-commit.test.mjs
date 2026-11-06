import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findBlocked, isCommitCommand } from "./kiem-commit.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "kiem-commit.mjs");

test("chặn .env, data/, anh/, xlsx, mp4, out/, node_modules; cho phép mp3 và code", () => {
  const bad = [
    "engine/remotion/.env",
    ".env.local",
    "data/bcons-central-park/bang-gia.csv",
    "anh/bcons-central-park/a.jpg",
    "MasterFile.xlsx",
    "engine/remotion/out/video/a.mp4",
    "engine/remotion/out/tam/x.png",
    "engine/remotion/node_modules/x/i.js",
  ];
  assert.deepEqual(findBlocked(bad).map((b) => b.file), bad);
  const ok = [
    "du-an/bcons-central-park/video/a/audio/scene1.mp3",
    "engine/remotion/src/BconsVideo.tsx",
    "docs/huong-dan.md",
    "du-an/bcons-central-park/assets/images/a.jpg",
    "engine/remotion/scripts/env.mjs",
  ];
  assert.deepEqual(findBlocked(ok), []);
});

test("nhận ra lệnh commit", () => {
  assert.ok(isCommitCommand("git commit -m x"));
  assert.ok(isCommitCommand("git add a && git commit -q -m x"));
  assert.ok(isCommitCommand("git -c core.quotepath=false commit -m x"));
  assert.ok(!isCommitCommand("git status"));
  assert.ok(!isCommitCommand("git log --grep commit"));
});

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kc-"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}

test("hook Claude: commit có .env bị chặn (exit 2), commit sạch qua (exit 0)", () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, "a.md"), "x");
  execFileSync("git", ["add", "a.md"], { cwd: dir });
  const run = (command) =>
    spawnSync("node", [SCRIPT, "--hook"], { input: JSON.stringify({ cwd: dir, tool_input: { command } }), encoding: "utf8" });
  assert.equal(run("git commit -m ok").status, 0);
  fs.writeFileSync(path.join(dir, ".env"), "KEY=1");
  execFileSync("git", ["add", "-f", ".env"], { cwd: dir });
  const r = run("git commit -m x");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /\.env/);
  assert.equal(run("git status").status, 0);
});

test("git pre-commit: có mp4 trong stage thì exit 1", () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, "v.mp4"), "x");
  execFileSync("git", ["add", "v.mp4"], { cwd: dir });
  assert.equal(spawnSync("node", [SCRIPT], { cwd: dir }).status, 1);
});
