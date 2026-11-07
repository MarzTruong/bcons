import os from "node:os";
// Bot Telegram Bcons: chạy trên laptop, nhận lệnh của anh và chạy thay anh.
// Chạy: npm run bot (trong engine/remotion), hoặc bấm đúp Bcons-Bot.cmd ở gốc repo.
// Cần trong engine/remotion/.env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Xem docs/huong-dan-bot-telegram.md
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendApproved } from "../send-telegram.mjs";
import { REPO_ROOT, projectDir, readActiveProject } from "../project.mjs";
import { killTree, runClaude } from "./claude-bridge.mjs";
import { createBot } from "./handlers.mjs";
import { createTg } from "./tg.mjs";
import { onConflict } from "./core.mjs";
import { MAY, requestSwitch, standbyDecision, standbysOf, startRole, stateDir, writeBeat } from "./may.mjs";

const REMOTION_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MAX_OUT = 200_000;

// Mã thoát để Bcons-Bot.cmd biết: 2 = thiếu cấu hình, 3 = đã có bot khác đang chạy (cả hai: dừng hẳn, không chạy lại).
const EXIT_CONFIG = 2;
const EXIT_DUPLICATE = 3;
/** 4 = anh nhắn /capnhat: Bcons-Bot.cmd lấy bản mới (bot đã tắt nên Windows cho thay file) rồi bật lại. */
const EXIT_UPDATE = 4;
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
  // Tên máy hiện trên Telegram: TEN_MAY trong .env (vd. PC, Laptop), không có thì tên Windows.
  bot.setExitForUpdate(() => setTimeout(() => process.exit(EXIT_UPDATE), 1500));
  // Kết quả lần cập nhật trước (Bcons-Bot.cmd ghi), báo lại cho anh.
  const logFile = path.join(REMOTION_DIR, "out", "tam", "capnhat.log");
  if (fs.existsSync(logFile)) {
    const log = fs.readFileSync(logFile, "utf8").trim().split(/\r?\n/).slice(-12).join("\n");
    fs.rmSync(logFile, { force: true });
    const ok = !/error|fatal|lỗi|loi/i.test(log);
    await tg.sendMessage(chatId, `${ok ? "✅ Đã cập nhật bản mới." : "⚠️ Cập nhật có lỗi, gửi em ảnh này:"}\n${log}`).catch(() => {});
  }
  const host = (process.env.TEN_MAY ?? "").trim() || os.hostname();
  const dir = (() => {
    try {
      return stateDir();
    } catch {
      return null;
    }
  })();
  let role = dir ? startRole(dir, host) : "chay";
  let handover = null; // máy sẽ nhận bot (anh vừa bấm chuyển)
  if (dir) {
    bot.setSwitcher({
      self: host,
      standbys: () => standbysOf(dir, Date.now(), host),
      request: (to) => {
        requestSwitch(dir, to, host);
        handover = to;
      },
    });
  }
  const beat = () => dir && writeBeat(dir, host, role);
  setInterval(beat, MAY.beatMs).unref();
  beat();

  if (role === "cho") {
    await tg
      .sendMessage(chatId, `🖥 ${host} vừa mở bot, nhưng bot đang chạy trên máy khác. ${host} sẽ CHỜ.\nMuốn dùng ${host}: nhắn /chuyenmay rồi bấm "Chuyển sang ${host}".`, {
        reply_markup: { inline_keyboard: [[{ text: `➡️ Chuyển sang ${host}`, callback_data: `may:${host}`.slice(0, 64) }]] },
      })
      .catch((e) => console.error(e.message));
  } else {
    console.log("Bot đang chạy. Đóng cửa sổ này để tắt bot.");
    await tg.sendMessage(chatId, `🤖 Bot Bcons đã chạy trên máy ${host}. Nhắn /huongdan để xem lệnh.`).catch((e) => console.error(e.message));
  }

  let offset = 0;
  let startedAt = Date.now();
  let warned = false;
  let viaSwitch = false; // vừa nhận bot từ máy khác: máy kia có thể còn đang nhận tin vài giây
  for (;;) {
    if (role === "cho") {
      // Máy chờ: không nhận tin Telegram (để máy kia nhận), chỉ xem Drive mỗi 5 giây.
      console.log(`Đang CHỜ (bot chạy trên máy khác). Nhắn /chuyenmay trên Telegram để chuyển sang ${host}.`);
      for (;;) {
        await sleep(5000);
        const d = standbyDecision(dir, host);
        if (d === "cho") continue;
        role = "chay";
        beat();
        startedAt = Date.now();
        viaSwitch = true;
        offset = 0;
        await tg
          .sendMessage(chatId, d === "nhan-lenh" ? `✅ Bot đã chuyển sang ${host}.` : `✅ Máy đang chạy bot mất liên lạc hơn 3 phút, bot tự chuyển sang ${host}.`)
          .catch(() => {});
        console.log("Bot đang chạy. Đóng cửa sổ này để tắt bot.");
        break;
      }
    }
    try {
      // chờ tin tối đa 10 giây/lượt: nhường máy nhanh khi anh bấm chuyển
      const updates = await tg.getUpdates(offset, handover ? 0 : 10);
      for (const u of updates) {
        offset = u.update_id + 1;
        // Không chờ việc dài (render) xong mới đọc tin tiếp: việc tự xếp hàng trong bot.
        bot.handleUpdate(u).catch((e) => tg.sendMessage(chatId, `Lỗi: ${e.message}`).catch(() => {}));
      }
      if (handover) {
        // Báo Telegram đã đọc các tin tới đây (để máy kia không nhận lại), rồi chuyển sang chờ.
        await tg.getUpdates(offset, 0).catch(() => {});
        console.log(`Đã nhường bot cho ${handover}. Máy này chuyển sang CHỜ.`);
        role = "cho";
        handover = null;
        beat();
      }
    } catch (e) {
      if (/409|terminated by other getUpdates/i.test(e.message)) {
        if (viaSwitch && Date.now() - startedAt < 2 * 60_000) {
          await sleep(3000); // máy cũ đang dừng nhận tin, thử lại
          continue;
        }
        if (onConflict(startedAt) === "thoat") {
          console.error("Bot đang chạy ở máy/cửa sổ khác. Cửa sổ này tự đóng, giữ bot đang chạy.");
          process.exit(EXIT_DUPLICATE);
        }
        if (!warned) {
          warned = true;
          await tg.sendMessage(chatId, `⚠️ Có bot thứ hai vừa mở ở máy khác. Bot trên ${host} vẫn giữ, bot mới sẽ tự đóng.`).catch(() => {});
        }
        await sleep(15000);
        continue;
      }
      console.error(`Mất kết nối Telegram (${e.message}), thử lại sau 5 giây...`);
      await sleep(5000);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
