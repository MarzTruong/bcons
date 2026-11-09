// Antigravity chỉ đọc code và xuất báo cáo: commit có tiêu đề bắt đầu "audit:" chỉ được đụng file trong kiem-toan/.
// Chạy trong GitHub Actions (.github/workflows/kiem-tra.yml): node engine/automation/kiem-audit.mjs <sha trước> <sha sau>
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** commits: [{ sha, subject, files }] → [{ sha, files ngoài kiem-toan/ }] của các commit "audit:". */
export function auditViolations(commits) {
  return commits
    .filter((c) => /^audit:/i.test(c.subject))
    .map((c) => ({ sha: c.sha, files: c.files.filter((f) => !f.startsWith("kiem-toan/")) }))
    .filter((c) => c.files.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [before, after] = process.argv.slice(2);
  const zero = !before || /^0+$/.test(before);
  const range = zero ? ["-1", after ?? "HEAD"] : [`${before}..${after ?? "HEAD"}`];
  const git = (args) => execFileSync("git", args, { encoding: "utf8" });
  const commits = git(["log", "--format=%H%x09%s", ...range]).split("\n").filter(Boolean).map((l) => {
    const [sha, subject] = l.split("\t");
    const files = git(["show", "--name-only", "--format=", sha]).split("\n").filter(Boolean);
    return { sha, subject, files };
  });
  const bad = auditViolations(commits);
  for (const b of bad) console.error(`Commit audit ${b.sha.slice(0, 7)} sửa file ngoài kiem-toan/: ${b.files.join(", ")}`);
  if (bad.length) process.exit(1);
  console.log(`Kiểm ${commits.length} commit: commit audit chỉ đụng kiem-toan/.`);
}
