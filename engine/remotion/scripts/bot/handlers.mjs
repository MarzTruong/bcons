// Xử lý tin nhắn/nút bấm của bot. Mọi việc ra ngoài (Telegram, chạy lệnh, Claude, gửi bài) đi qua deps để test được.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { approvalState, duyetCaption, duyetVideo } from "../caption-cli.mjs";
import { parseCaption } from "../caption.mjs";
import { videoPaths } from "../project.mjs";
import { buttons } from "./tg.mjs";
import { HELP, formatList, isAuthorized, parseCommand } from "./core.mjs";

const NAME_RE = /^[a-z0-9-]+$/;
const SESSION_TTL_MS = 3 * 3600e3;
const tail = (s, n = 15) => String(s).trim().split(/\r?\n/).slice(-n).join("\n");

/**
 * deps: { tg, chatId, projDir, outDir, repoRoot, remotionDir,
 *         exec(cmd, args, { cwd }) → Promise<{ code, out }>,
 *         runClaude(prompt, { sessionId, cwd }) → Promise<{ text, sessionId, isError }>,
 *         sendApproved({ captionPath, mp4Path, label }) → Promise, now() → number }
 */
export function createBot(deps) {
  const { tg, chatId, projDir, outDir, repoRoot, remotionDir, exec, runClaude, sendApproved } = deps;
  const now = deps.now ?? (() => Date.now());
  const say = (text, extra) => tg.sendMessage(chatId, text, extra);
  const pending = new Map(); // id → { kind, run }
  let seq = 0;
  let session = null; // { id, at }
  let busy = false;
  const queue = [];

  function enqueue(label, job) {
    return new Promise((resolve) => {
      queue.push({ label, job, resolve });
      if (busy) say(`Đang làm việc trước, đã xếp hàng: ${label}`);
      pump();
    });
  }
  async function pump() {
    if (busy || !queue.length) return;
    busy = true;
    const { label, job, resolve } = queue.shift();
    try {
      await job();
    } catch (e) {
      await say(`Lỗi khi ${label}:\n${tail(e.message, 20)}`);
    } finally {
      busy = false;
      resolve();
      pump();
    }
  }

  async function run(cmd, args, cwd, what) {
    const r = await exec(cmd, args, { cwd });
    if (r.code !== 0) throw new Error(`${what} không thành công:\n${tail(r.out)}`);
    return r.out;
  }

  async function gitSave(paths, message) {
    await run("git", ["add", "--", ...paths], repoRoot, "git add");
    const st = await exec("git", ["diff", "--cached", "--name-only"], { cwd: repoRoot });
    if (!st.out.trim()) return "Không có gì mới để lưu.";
    await run("git", ["commit", "-m", message], repoRoot, "Lưu (commit)");
    await run("git", ["pull", "--rebase"], repoRoot, "Lấy bản mới (pull)");
    await run("git", ["push"], repoRoot, "Đẩy lên GitHub (push)");
    return "Đã lưu lên GitHub.";
  }

  function ask(text, kind, action) {
    const id = String(++seq);
    pending.set(id, { kind, run: action });
    const labels = kind === "claude" ? [["💾 Lưu lên GitHub", `ok:${id}`], ["↩️ Bỏ thay đổi", `huy:${id}`]] : [["✅ Đồng ý", `ok:${id}`], ["✖️ Hủy", `huy:${id}`]];
    return say(text, buttons(labels));
  }

  function checkName(name) {
    if (!NAME_RE.test(name ?? "")) {
      say(`Thiếu hoặc sai tên video "${name ?? ""}". Xem tên bằng /danhsach.`);
      return false;
    }
    return true;
  }

  const commands = {
    async start() {
      await say(HELP);
    },
    async huongdan() {
      await say(HELP);
    },
    async danhsach() {
      await say(formatList(projDir, outDir));
    },
    async xem([name]) {
      if (!checkName(name)) return;
      const cap = videoPaths(name, projDir).caption;
      if (fs.existsSync(cap)) {
        const c = parseCaption(fs.readFileSync(cap, "utf8"));
        await say(`📘 FACEBOOK – ${name}\n\n${c.facebook ?? "(chưa có)"}`);
        await say(`🎵 TIKTOK – ${name}\n\n${c.tiktok ?? "(chưa có)"}`);
      } else await say(`${name}: chưa có caption.`);
      const mp4 = path.join(outDir, `${name}.mp4`);
      if (fs.existsSync(mp4)) await tg.sendVideo(chatId, mp4, `Bản xem thử ${name} (chưa phải bản đăng)`);
      else await say(`${name}: chưa có video. Nhắn /render ${name}`);
    },
    duyet([name]) {
      if (!checkName(name)) return;
      return enqueue(`duyệt ${name}`, async () => {
        const cap = videoPaths(name, projDir).caption;
        if (!fs.existsSync(cap)) return say(`${name}: chưa có caption, chưa duyệt được.`);
        if (!approvalState(fs.readFileSync(cap, "utf8"), null).ok) duyetCaption(cap);
        const mp4 = path.join(outDir, `${name}.mp4`);
        const saved = await gitSave([path.relative(repoRoot, cap)], `Duyet caption ${name}`);
        if (!fs.existsSync(mp4)) return say(`Đã duyệt caption ${name}. ${saved}\nChưa có video: nhắn /render ${name}, xem xong nhắn lại /duyet ${name}.`);
        if (!approvalState(fs.readFileSync(cap, "utf8"), mp4).ok) duyetVideo(cap, mp4);
        await sendApproved({ captionPath: cap, mp4Path: mp4, label: name });
        const saved2 = await gitSave([path.relative(repoRoot, cap)], `Duyet video ${name}`);
        await say(`✅ Đã duyệt ${name}, bản đăng ở các tin phía trên. ${saved2}\nViệc còn lại: hẹn giờ trên Metricool (TikTok) và Business Suite (Facebook).`);
      });
    },
    render([name]) {
      if (!checkName(name)) return;
      return enqueue(`render ${name}`, async () => {
        await say(`Đang render ${name}, mất vài phút...`);
        await run("npm", ["run", "render:drive", "--", name], remotionDir, `Render ${name}`);
        await tg.sendVideo(chatId, path.join(outDir, `${name}.mp4`), `Bản xem thử ${name}. Ưng thì nhắn /duyet ${name}`);
      });
    },
    async giong([name]) {
      if (!checkName(name)) return;
      await ask(`Tạo giọng ElevenLabs cho ${name}? Việc này TỐN CREDIT.`, "giong", () =>
        enqueue(`tạo giọng ${name}`, async () => {
          await say(`Đang tạo giọng ${name}...`);
          const out = await run("npm", ["run", "voice", "--", name], remotionDir, `Tạo giọng ${name}`);
          await say(`Xong giọng ${name}.\n${tail(out, 8)}\nTiếp: /render ${name}`);
        }),
      );
    },
    capnhat() {
      return enqueue("lấy bản mới", async () => {
        const lock = path.join(remotionDir, "package-lock.json");
        const h = () => (fs.existsSync(lock) ? crypto.createHash("sha256").update(fs.readFileSync(lock)).digest("hex") : "");
        const before = h();
        const out = await run("git", ["pull", "--ff-only"], repoRoot, "Lấy bản mới (git pull)");
        let extra = "";
        if (h() !== before) {
          await run("npm", ["ci"], remotionDir, "Cài thư viện (npm ci)");
          extra = "\nĐã cài lại thư viện.";
        }
        await say(`Đã cập nhật.\n${tail(out, 5)}${extra}`);
      });
    },
    async moi() {
      session = null;
      await say("Đã bắt đầu cuộc trò chuyện Claude mới.");
    },
  };

  function claudeTask(text) {
    return enqueue("việc giao cho Claude", async () => {
      await say("Đã nhận, Claude đang làm trên laptop...");
      const fresh = session && now() - session.at < SESSION_TTL_MS ? session.id : undefined;
      const r = await runClaude(text, { sessionId: fresh, cwd: repoRoot });
      if (r.sessionId) session = { id: r.sessionId, at: now() };
      await say(r.text || "(Claude không trả lời)");
      const st = await exec("git", ["status", "--porcelain"], { cwd: repoRoot });
      const changed = st.out.split(/\r?\n/).filter(Boolean);
      if (!changed.length) return;
      const files = changed.map((l) => l.slice(3)).join("\n");
      await ask(`Claude đã sửa ${changed.length} file:\n${files}\n\nLưu lên GitHub?`, "claude", async (ok) => {
        if (ok) {
          await enqueue("lưu thay đổi của Claude", async () => say(await gitSave(["."], `Bot: ${text.slice(0, 60)}`)));
        } else {
          await enqueue("bỏ thay đổi", async () => {
            await run("git", ["stash", "push", "-u", "-m", `bot-bo-${now()}`], repoRoot, "Cất thay đổi (git stash)");
            await say("Đã bỏ thay đổi (cất vào git stash, lấy lại được nếu cần).");
          });
        }
      });
    });
  }

  async function onCallback(cq) {
    const [act, id] = String(cq.data ?? "").split(":");
    const p = pending.get(id);
    await tg.answerCallback(cq.id).catch(() => {});
    if (!p) return say("Nút này đã hết hiệu lực.");
    pending.delete(id);
    if (p.kind === "claude") return p.run(act === "ok");
    if (act === "ok") return p.run();
    return say("Đã hủy.");
  }

  async function handleUpdate(update) {
    if (!isAuthorized(update, chatId)) return;
    if (update.callback_query) return onCallback(update.callback_query);
    const text = update.message?.text;
    if (!text) return;
    const c = parseCommand(text);
    if (!c.cmd) return claudeTask(c.text);
    const fn = commands[c.cmd];
    if (!fn) return say(`Không có lệnh /${c.cmd}.\n\n${HELP}`);
    return fn(c.args);
  }

  return { handleUpdate, _state: () => ({ busy, queue: queue.length, pending: pending.size, session }) };
}
