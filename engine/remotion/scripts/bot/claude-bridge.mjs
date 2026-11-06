// Cách B: chuyển câu anh nhắn cho Claude Code chạy trên laptop (`claude -p`), dùng gói Claude anh đang có.
// Câu của anh đi qua stdin, KHÔNG ghép vào dòng lệnh. Quyền bị giới hạn: không tạo giọng, không render, không commit/push.
import { spawn } from "node:child_process";

export const ALLOWED = [
  "Read", "Edit", "Write", "Glob", "Grep", "WebSearch", "WebFetch",
  "Bash(npm test:*)", "Bash(npm run lint:*)", "Bash(npm run check:caption:*)", "Bash(npm run check:spec:*)",
  "Bash(node --test:*)", "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
];
export const DENIED = [
  "Bash(npm run voice:*)", "Bash(npm run render:drive:*)", "Bash(git commit:*)", "Bash(git push:*)",
  "Bash(git reset:*)", "Bash(git checkout:*)", "Bash(rm:*)",
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
    "-p", "--output-format", "json", "--max-turns", "40",
    "--allowedTools", ALLOWED.join(" "),
    "--disallowedTools", DENIED.join(" "),
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
      if (j && typeof j === "object" && "result" in j) {
        return { text: String(j.result ?? ""), sessionId: j.session_id ?? null, isError: !!j.is_error };
      }
    } catch {
      // dòng không phải JSON
    }
  }
  return { text: String(stdout).trim().slice(-3000) || "(Claude không trả lời)", sessionId: null, isError: true };
}

/** Trên Windows phải chạy qua shell (claude.cmd): bọc từng tham số trong ngoặc kép. */
function winQuote(a) {
  return `"${String(a).replace(/"/g, '\\"')}"`;
}

/** Chạy Claude thật trên máy. Trả { text, sessionId, isError }. */
export function runClaude(prompt, { sessionId, cwd, timeoutMs = 20 * 60e3 } = {}) {
  return new Promise((resolve) => {
    const args = buildClaudeArgs({ sessionId });
    const win = process.platform === "win32";
    const child = win
      ? spawn("claude", args.map(winQuote), { cwd, shell: true, windowsHide: true })
      : spawn("claude", args, { cwd });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) =>
      resolve({ text: `Không chạy được Claude Code trên máy (${e.message}). Cài Claude Code: xem docs/huong-dan-bot-telegram.md`, sessionId: null, isError: true }),
    );
    child.on("close", () => {
      clearTimeout(timer);
      const r = parseClaudeOutput(out);
      if (r.isError && !out.trim() && err.trim()) r.text = err.trim().slice(-1500);
      resolve(r);
    });
    child.stdin.end(prompt);
  });
}
