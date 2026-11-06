// Chặn commit file nhạy cảm/nặng: .env, data/, anh/, *.xlsx, *.mp4, out/, node_modules/.
// (File .mp3 giọng đọc được phép: lên git có chủ đích để máy khác render không tốn credit.)
// Hai cách dùng:
//   1. Git hook (mọi lần commit, kể cả anh tự commit): git config core.hooksPath .githooks
//   2. Hook Claude Code (PreToolUse, Bash): node engine/automation/kiem-commit.mjs --hook  (đọc JSON từ stdin)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RULES = [
  [/(^|\/)\.env(\..*)?$/, "file .env (API key)"],
  [/^data\//, "data/ (bảng giá, dữ liệu nội bộ)"],
  [/^anh\//, "anh/ (ảnh gốc nặng)"],
  [/\.xlsx$/i, "file Excel (dữ liệu khách/hoa hồng)"],
  [/\.mp4$/i, "video mp4"],
  [/(^|\/)out\//, "thư mục out/ (file render)"],
  [/(^|\/)node_modules\//, "node_modules/"],
];

/** Trả danh sách { file, why } vi phạm. */
export function findBlocked(files) {
  const out = [];
  for (const f of files) {
    const n = f.replaceAll("\\", "/").replace(/^"|"$/g, "");
    const hit = RULES.find(([re]) => re.test(n));
    if (hit) out.push({ file: n, why: hit[1] });
  }
  return out;
}

/** Lệnh Bash có tạo commit không (git commit, kể cả sau &&). */
export function isCommitCommand(cmd) {
  return /(^|[;&|]\s*|\s)git(\s+-[^\s]+(\s+[^\s-][^\s]*)?)*\s+commit\b/.test(cmd ?? "");
}

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).split("\n").filter(Boolean);
}

/** File sẽ vào commit: đã stage, cộng file đã theo dõi bị sửa nếu commit -a/--all. */
export function filesForCommit(cwd, cmd = "") {
  const staged = git(["diff", "--cached", "--name-only", "--diff-filter=d"], cwd);
  const all = /\scommit\b[^;&|]*\s(-a\b|--all\b|-[a-zA-Z]*a[a-zA-Z]*\b)/.test(cmd) ? git(["diff", "--name-only", "--diff-filter=d"], cwd) : [];
  return [...new Set([...staged, ...all, ...filesFromAdd(cwd, cmd)])];
}

/** "git add ... && git commit" trong cùng một lệnh: file sắp được add (chưa nằm trong stage lúc hook chạy). */
export function filesFromAdd(cwd, cmd = "") {
  const out = [];
  for (const m of cmd.matchAll(/\bgit\s+add\s+([^;&|]*)/g)) {
    const args = m[1].trim().split(/\s+/).filter(Boolean);
    const paths = args.filter((a) => !a.startsWith("-"));
    const all = args.some((a) => a === "-A" || a === "--all" || a === "-u") || paths.includes(".");
    if (all) {
      // file chưa theo dõi (không bị ignore) + file đã sửa
      out.push(...git(["ls-files", "--others", "--exclude-standard"], cwd), ...git(["diff", "--name-only", "--diff-filter=d"], cwd));
    }
    out.push(...paths.filter((x) => x !== "."));
  }
  return out;
}

function report(blocked) {
  return `Chặn commit: có file không được lên git\n${blocked.map((b) => `  - ${b.file}  (${b.why})`).join("\n")}\nBỏ khỏi stage: git restore --staged <file>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--hook")) {
    // Hook Claude Code: stdin là JSON { tool_input: { command } }. Exit 2 = chặn, lý do in ra stderr.
    let input = {};
    try {
      input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
    } catch {
      process.exit(0);
    }
    const cmd = input.tool_input?.command ?? "";
    if (!isCommitCommand(cmd)) process.exit(0);
    const blocked = findBlocked(filesForCommit(input.cwd ?? process.cwd(), cmd));
    if (blocked.length) {
      console.error(report(blocked));
      process.exit(2);
    }
    process.exit(0);
  }
  // Git pre-commit hook
  const blocked = findBlocked(filesForCommit(process.cwd()));
  if (blocked.length) {
    console.error(report(blocked));
    process.exit(1);
  }
}
