import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ALLOWED } from "../scripts/bot/claude-bridge.mjs";

test("Claude nhận việc qua bot được dùng skill của repo (TDD, caption, video...)", () => {
  assert.ok(ALLOWED.includes("Skill"));
});

test("các skill cài thêm có mặt trong repo", () => {
  const dir = path.resolve(import.meta.dirname, "../../../.claude/skills");
  for (const s of ["find-skills", "frontend-design", "impeccable", "test-driven-development"]) {
    assert.ok(fs.existsSync(path.join(dir, s, "SKILL.md")), s);
  }
});
