// Cách B: chuyển câu anh nhắn cho Claude Code chạy trên laptop (`claude -p`), dùng gói Claude anh đang có.
// Câu của anh đi qua stdin, KHÔNG ghép vào dòng lệnh. Quyền bị giới hạn: không tạo giọng, không render, không commit/push.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const ALLOWED = [
  "Read", "Edit", "Write", "Glob", "Grep", "WebSearch", "WebFetch", "Skill",
  "Bash(npm test:*)", "Bash(npm run lint:*)", "Bash(npm run check:caption:*)", "Bash(npm run check:spec:*)",
  "Bash(node --test:*)", "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
];
export const DENIED = [
  "Bash(npm run voice:*)", "Bash(npm run render:drive:*)", "Bash(git commit:*)", "Bash(git push:*)",
  "Bash(git reset:*)", "Bash(git checkout:*)", "Bash(git stash:*)", "Bash(rm:*)",
  // Chặn "sửa rồi chạy" vòng qua lệnh test, hook, bot, cấu hình quyền (rào chống nhầm lẫn, không phải tường bảo mật tuyệt đối)
  ...["**/package.json", "**/package-lock.json", ".claude/**", ".githooks/**", "*.cmd", "engine/remotion/scripts/bot/**", "engine/remotion/tests/**", "engine/automation/**", "**/.env"]
    .flatMap((p) => [`Edit(./${p})`, `Write(./${p})`]),
];
const SYSTEM = [
  "Anh dang giao viec qua bot Telegram, khong ngoi truoc may.",
  "Lam theo CLAUDE.md. Khong tao giong, khong render, khong commit, khong push: bot se hoi anh sau.",
  "Tra loi ngan gon bang tieng Viet co dau, cuoi cau tra loi liet ke cac file da sua.",
].join(" ");

const SESSION_RE = /^[0-9a-f-]{8,64}$/i;

/** Tham số dòng lệnh cố định (không chứa chữ của người dùng). */
export function buildClaudeArgs({ sessionId } = {}) {
  const args = [
    "-p", "--output-format", "json", "--max-turns", "40", "--permission-mode", "default",
    "--allowedTools", ALLOWED.join(","),
    "--disallowedTools", DENIED.join(","),
    "--append-system-prompt", SYSTEM,
  ];
  if (sessionId) {
    if (!SESSION_RE.test(sessionId)) throw new Error("session id không hợp lệ");
    args.push("--resume", sessionId);
  }
  return args;
}

/** Đọc kết quả JSON của `claude -p --output-format json`. */
export function parseClaudeOutput(stdout) {
  const lines = String(stdout).trim().split(/\r?\n/).reverse();
  for (const l of lines) {
    try {
      const j = JSON.parse(l);
      if (j && typeof j === "object" && (j.type === "result" || "result" in j)) {
        const sub = String(j.subtype ?? "");
        const why = sub === "error_max_turns" ? "Claude dừng vì việc quá dài (hết số bước). Nhắn tiếp để làm nốt, hoặc chia nhỏ việc."
          : sub.startsWith("error") ? `Claude gặp lỗi khi làm (${sub}).` : "";
        const text = j.result ? String(j.result) : why || "(Claude không trả lời)";
        return { text: why && j.result ? `${text}\n\n${why}` : text, sessionId: j.session_id ?? null, isError: !!j.is_error || sub.startsWith("error") };
      }
    } catch {
      // dòng không phải JSON
    }
  }
  return { text: String(stdout).trim().slice(-3000) || "(Claude không trả lời)", sessionId: null, isError: true };
}

/** Dừng hẳn tiến trình và các tiến trình con (Windows: taskkill /T, vì kill() chỉ dừng cmd.exe). */
export function killTree(child) {
  if (!child?.pid) return;
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
  else child.kill("SIGTERM");
}

/** Trên Windows phải chạy qua shell (claude.cmd): bọc từng tham số trong ngoặc kép. */
function winQuote(a) {
  return `"${String(a).replace(/"/g, '\\"')}"`;
}

/** Bản cài chính thức trên Windows nằm ở %USERPROFILE%\\.local\\bin\\claude.exe: chạy thẳng file .exe (không qua shell, không phụ thuộc PATH). */
export function findClaudeExe(home = os.homedir(), exists = fs.existsSync) {
  const exe = path.join(home, ".local", "bin", "claude.exe");
  return exists(exe) ? exe : null;
}

/** Chạy Claude thật trên máy. Trả { text, sessionId, isError }. */
export function runClaude(prompt, { sessionId, cwd, timeoutMs = 20 * 60e3, onChild } = {}) {
  return new Promise((resolve) => {
    const args = buildClaudeArgs({ sessionId });
    const win = process.platform === "win32";
    const exe = win ? findClaudeExe() : null;
    const child = exe
      ? spawn(exe, args, { cwd, windowsHide: true })
      : win
        ? spawn("claude", args.map(winQuote), { cwd, shell: true, windowsHide: true })
        : spawn("claude", args, { cwd });
    let out = "";
    let err = "";
    onChild?.(child);
    const timer = setTimeout(() => killTree(child), timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) =>
      resolve({ text: `Không chạy được Claude Code trên máy (${e.message}). Cài Claude Code: xem docs/huong-dan-bot-telegram.md`, sessionId: null, isError: true }),
    );
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const r = parseClaudeOutput(out);
      if (r.isError && !out.trim() && err.trim()) r.text = err.trim().slice(-1500);
      resolve(r);
    };
    child.on("close", finish);
    // Windows: cửa sổ con có thể giữ ống dẫn; tiến trình đã thoát thì 2 giây sau coi như xong.
    child.on("exit", () => setTimeout(finish, 2000));
    child.stdin.end(prompt);
  });
}
