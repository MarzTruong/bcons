// Giữ docs khớp với code: kế hoạch/thiết kế phải ghi trạng thái, mục lục docs/README.md đủ file,
// tài liệu đang dùng không trỏ tới file không còn tồn tại. Chạy trong npm test.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rel = (p) => path.relative(ROOT, p).replaceAll("\\", "/");
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const docs = walk(path.join(ROOT, "docs")).filter((f) => f.endsWith(".md"));
const statusOf = (file) => fs.readFileSync(file, "utf8").split("\n").slice(0, 6).find((l) => l.includes("**Trạng thái:**")) ?? "";
const isHistory = (file) => /Đã xong|Lịch sử|lịch sử/.test(statusOf(file));

test("mỗi kế hoạch/thiết kế (docs/superpowers) có dòng **Trạng thái:** ở đầu file", () => {
  const missing = docs.filter((f) => rel(f).startsWith("docs/superpowers/") && !statusOf(f)).map(rel);
  assert.deepEqual(missing, [], "thêm '> **Trạng thái:** Đã xong / Đang làm / Chưa làm' ở đầu file");
});

test("docs/README.md liệt kê đủ mọi file trong docs/", () => {
  const index = fs.readFileSync(path.join(ROOT, "docs", "README.md"), "utf8");
  const missing = docs.map(rel).filter((p) => p !== "docs/README.md" && !index.includes(p.slice("docs/".length)));
  assert.deepEqual(missing, [], "thêm vào docs/README.md");
});

test("tài liệu đang dùng không trỏ tới file/thư mục không còn trong repo", () => {
  const live = [
    ...docs.filter((f) => !isHistory(f)),
    path.join(ROOT, "CLAUDE.md"),
    ...walk(path.join(ROOT, ".claude", "rules")),
    ...["bcons-video", "bai-cong-ty", "bcons-project-init"].map((s) => path.join(ROOT, ".claude", "skills", s, "SKILL.md")),
  ];
  const dead = [];
  for (const f of live) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/`((?:engine|du-an|docs|\.claude)\/[^`\s]+)`/g)) {
      const p = m[1].replace(/[#:].*$/, "");
      if (/[<>*{}]/.test(p) || p.includes("/x/")) continue; // mẫu đường dẫn, không phải file thật
      if (/\.env$|\/out\/|node_modules|\.am-thanh|audio-test/.test(p)) continue; // chỉ có trên máy anh
      if (!fs.existsSync(path.join(ROOT, p))) dead.push(`${rel(f)} → ${p}`);
    }
  }
  assert.deepEqual(dead, []);
});
