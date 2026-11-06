// Bot Telegram Bcons: chạy trên laptop, nhận lệnh của anh và chạy thay anh.
// Chạy: npm run bot (trong engine/remotion), hoặc bấm đúp Bcons-Bot.cmd ở gốc repo.
// Cần trong engine/remotion/.env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Xem docs/huong-dan-bot-telegram.md
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendApproved } from "../send-telegram.mjs";
import { REPO_ROOT, projectDir, readActiveProject } from "../project.mjs";
import { killTree, runClaude } from "./claude-bridge.mjs";
import { createBot } from "./handlers.mjs";
import { createTg } from "./tg.mjs";

const REMOTION_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MAX_OUT = 200_000;

// Mã thoát để Bcons-Bot.cmd biết: 2 = thiếu cấu hình, 3 = đã có bot khác đang chạy (cả hai: dừng hẳn, không chạy lại).
const EXIT_CONFIG = 2;
const EXIT_DUPLICATE = 3;
let currentChild = null;

/** Chạy lệnh, gom output. npm trên Windows phải qua shell (npm.cmd); tham số là hằng số hoặc tên video đã kiểm. */
export function exec(cmd, args, { cwd, timeoutMs = 30 * 60e3 } = {}) {
  return new Promise((resolve) => {
    const shell = process.platform === "win32" && cmd === "npm";
    const child = spawn(cmd, args, { cwd, shell, windowsHide: true, env: process.env });
    currentChild = child;
    let out = "";
    let done = false;
    const add = (d) => {
      out = (out + d).slice(-MAX_OUT);
    };
    const finish = (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (currentChild === child) currentChild = null;
      resolve({ code, out });
    };
    const timer = setTimeout(() => {
      out += `\nQuá ${Math.round(timeoutMs / 60e3)} phút, đã dừng.`;
      killTree(child);
    }, timeoutMs);
    child.stdout.on("data", add);
    child.stderr.on("data", add);
    child.on("error", (e) => {
      out += `\n${e.message}`;
      finish(1);
    });
    child.on("close", (code) => finish(code ?? 1));
    child.on("exit", (code) => setTimeout(() => finish(code ?? 1), 2000));
  });
}

/** /huy: dừng lệnh hoặc Claude đang chạy. */
function cancel() {
  if (!currentChild) return false;
  killTree(currentChild);
  return true;
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
    process.exit(EXIT_CONFIG);
  }
  process.on("unhandledRejection", (e) => console.error("Lỗi không xử lý:", e?.message ?? e));
  const tg = createTg(token);
  const bot = createBot({
    tg,
    chatId,
    projDir: projectDir(readActiveProject()),
    outDir: path.join(REMOTION_DIR, "out", "video"),
    repoRoot: REPO_ROOT,
    remotionDir: REMOTION_DIR,
    exec,
    cancel,
    startedAt: Date.now(),
    restart: () => {
      console.log("Khởi động lại để dùng bản bot mới...");
      process.exit(0);
    },
    runClaude: (prompt, o) => runClaude(prompt, { ...o, onChild: (c) => (currentChild = c) }),
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
      if (/409|terminated by other getUpdates/i.test(e.message)) {
        console.error("Bot đang chạy ở một cửa sổ khác. Đóng cửa sổ này, chỉ để một cửa sổ bot.");
        process.exit(EXIT_DUPLICATE);
      }
      console.error(`Mất kết nối Telegram (${e.message}), thử lại sau 5 giây...`);
      await sleep(5000);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
