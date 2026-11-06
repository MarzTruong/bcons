// Bot Telegram Bcons: chạy trên laptop, nhận lệnh của anh và chạy thay anh.
// Chạy: npm run bot (trong engine/remotion), hoặc bấm đúp Bcons-Bot.cmd ở gốc repo.
// Cần trong engine/remotion/.env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Xem docs/huong-dan-bot-telegram.md
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendApproved } from "../send-telegram.mjs";
import { REPO_ROOT, projectDir, readActiveProject } from "../project.mjs";
import { runClaude } from "./claude-bridge.mjs";
import { createBot } from "./handlers.mjs";
import { createTg } from "./tg.mjs";

const REMOTION_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MAX_OUT = 200_000;

/** Chạy lệnh, gom output. npm trên Windows phải qua shell (npm.cmd); tham số là hằng số hoặc tên video đã kiểm. */
export function exec(cmd, args, { cwd } = {}) {
  return new Promise((resolve) => {
    const shell = process.platform === "win32" && cmd === "npm";
    const child = spawn(cmd, args, { cwd, shell, windowsHide: true, env: process.env });
    let out = "";
    const add = (d) => {
      out = (out + d).slice(-MAX_OUT);
    };
    child.stdout.on("data", add);
    child.stderr.on("data", add);
    child.on("error", (e) => resolve({ code: 1, out: `${out}\n${e.message}` }));
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  process.chdir(REMOTION_DIR);
  try {
    process.loadEnvFile(".env");
  } catch {
    // dùng biến môi trường hiện có
  }
  const token = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID ?? "").trim();
  if (!token || !chatId) {
    console.error("Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong engine/remotion/.env (xem docs/huong-dan-bot-telegram.md)");
    process.exit(1);
  }
  const tg = createTg(token);
  const bot = createBot({
    tg,
    chatId,
    projDir: projectDir(readActiveProject()),
    outDir: path.join(REMOTION_DIR, "out", "video"),
    repoRoot: REPO_ROOT,
    remotionDir: REMOTION_DIR,
    exec,
    runClaude,
    sendApproved: (o) => sendApproved({ ...o, env: process.env }),
  });
  await tg.sendMessage(chatId, "🤖 Bot Bcons đã chạy trên laptop. Nhắn /huongdan để xem lệnh.").catch((e) => console.error(e.message));
  console.log("Bot đang chạy. Đóng cửa sổ này để tắt bot.");
  let offset = 0;
  for (;;) {
    try {
      const updates = await tg.getUpdates(offset, 30);
      for (const u of updates) {
        offset = u.update_id + 1;
        // Không chờ việc dài (render) xong mới đọc tin tiếp: việc tự xếp hàng trong bot.
        bot.handleUpdate(u).catch((e) => tg.sendMessage(chatId, `Lỗi: ${e.message}`).catch(() => {}));
      }
    } catch (e) {
      console.error(`Mất kết nối Telegram (${e.message}), thử lại sau 5 giây...`);
      await sleep(5000);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
