// Xử lý tin nhắn/nút bấm của bot. Mọi việc ra ngoài (Telegram, chạy lệnh, Claude, gửi bài) đi qua deps để test được.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { approvalState, duyetCaption, duyetVideo } from "../caption-cli.mjs";
import { parseCaption } from "../caption.mjs";
import { videoPaths } from "../project.mjs";
import { buttons } from "./tg.mjs";
import { HELP, formatList, isAuthorized, parseCommand, resolveVideo, videoIndex } from "./core.mjs";

const NAME_RE = /^[a-z0-9-]+$/;
const SESSION_TTL_MS = 3 * 3600e3;
const TG_MAX_BYTES = 50 * 1024 * 1024;
const tail = (s, n = 15) => String(s).trim().split(/\r?\n/).slice(-n).join("\n");

/** Đọc `git status --porcelain=v1 -z -uall` → danh sách đường dẫn (tương đối gốc repo). */
export function parsePorcelainZ(out) {
  const parts = String(out).split("\0").filter(Boolean);
  const paths = [];
  for (let i = 0; i < parts.length; i++) {
    const xy = parts[i].slice(0, 2);
    paths.push(parts[i].slice(3));
    if (xy[0] === "R" || xy[0] === "C") paths.push(parts[++i]); // tên cũ khi đổi tên
  }
  return paths;
}

/**
 * deps: { tg, chatId, projDir, outDir, repoRoot, remotionDir,
 *         exec(cmd, args, { cwd, timeoutMs }) → Promise<{ code, out }>, cancel() → bool,
 *         runClaude(prompt, { sessionId, cwd }) → Promise<{ text, sessionId, isError }>,
 *         sendApproved({ captionPath, mp4Path, label }) → Promise,
 *         now() → ms, startedAt (ms), restart() → void }
 */
export function createBot(deps) {
  const { tg, chatId, projDir, outDir, repoRoot, remotionDir, exec, runClaude, sendApproved } = deps;
  const now = deps.now ?? (() => Date.now());
  const startedAt = deps.startedAt ?? now();
  const runId = crypto.randomBytes(3).toString("hex"); // nút bấm của lần chạy trước hết hiệu lực
  const say = (text, extra) =>
    Promise.resolve()
      .then(() => tg.sendMessage(chatId, text, extra))
      .catch((e) => console.error(`Không gửi được tin Telegram: ${e.message}`));
  const pending = new Map(); // id → { kind, run }
  let session = null; // { id, at }
  let current = null; // tên việc đang chạy
  let busy = false;
  let restartAfter = false;
  const queue = [];

  function enqueue(label, job) {
    return new Promise((resolve) => {
      queue.push({ label, job, resolve });
      if (busy) say(`Đang làm: ${current}. Đã xếp hàng: ${label}`);
      pump().catch(() => {});
    });
  }
  async function pump() {
    if (busy || !queue.length) return;
    busy = true;
    const { label, job, resolve } = queue.shift();
    current = label;
    try {
      await job();
    } catch (e) {
      await say(`Lỗi khi ${label}:\n${tail(e.message, 20)}`);
    } finally {
      busy = false;
      current = null;
      resolve();
      if (restartAfter && !queue.length) deps.restart?.();
      pump().catch(() => {});
    }
  }

  async function run(cmd, args, cwd, what, timeoutMs) {
    const r = await exec(cmd, args, { cwd, timeoutMs });
    if (r.code !== 0) throw new Error(`${what} không thành công:\n${tail(r.out)}`);
    return r.out;
  }
  const git = (args) => exec("git", args, { cwd: repoRoot });

  /** Lưu đúng các file chỉ định lên GitHub. Luôn đẩy cả commit cũ chưa đẩy. */
  async function gitSave(paths, message) {
    await run("git", ["add", "--", ...paths], repoRoot, "git add");
    const staged = (await git(["diff", "--cached", "--name-only", "--", ...paths])).out.trim();
    if (staged) await run("git", ["commit", "-m", message, "--", ...paths], repoRoot, "Lưu (commit)");
    const pull = await git(["pull", "--rebase", "--autostash"]);
    if (pull.code !== 0) {
      await git(["rebase", "--abort"]);
      throw new Error(`Lấy bản mới từ GitHub bị vướng (có thể trùng chỗ sửa). Đã lưu trên laptop, chưa đẩy lên. Báo em xử lý.\n${tail(pull.out)}`);
    }
    const ahead = Number((await git(["rev-list", "--count", "@{u}..HEAD"])).out.trim() || 0);
    if (ahead > 0) await run("git", ["push"], repoRoot, "Đẩy lên GitHub (push)");
    return staged || ahead > 0 ? "Đã lưu lên GitHub." : "Không có gì mới để lưu.";
  }

  async function changedPaths() {
    return parsePorcelainZ((await git(["status", "--porcelain=v1", "-z", "-uall"])).out);
  }

  function ask(text, kind, action) {
    if (kind === "claude") for (const [k, v] of pending) if (v.kind === "claude") pending.delete(k);
    const id = `${runId}${crypto.randomBytes(4).toString("hex")}`;
    pending.set(id, { kind, run: action });
    const labels =
      kind === "claude"
        ? [["💾 Lưu lên GitHub", `ok:${kind}:${id}`], ["↩️ Bỏ thay đổi", `huy:${kind}:${id}`]]
        : [["✅ Đồng ý", `ok:${kind}:${id}`], ["✖️ Hủy", `huy:${kind}:${id}`]];
    return say(text, buttons(labels));
  }

  function checkName(name) {
    if (!NAME_RE.test(name ?? "")) {
      say(`Thiếu hoặc sai tên video "${name ?? ""}". Xem tên bằng /danhsach.`);
      return false;
    }
    return true;
  }

  async function sendPreview(mp4, caption) {
    if (fs.statSync(mp4).size > TG_MAX_BYTES) return say(`Video nặng hơn 50 MB, Telegram không nhận. Xem trên Drive: ${path.basename(mp4)}`);
    await tg.sendVideo(chatId, mp4, caption);
  }

  /** Chuyển máy chạy bot (bot.mjs gắn vào): { self, standbys(), request(host) }. */
  let switcher = null;
  /** bot.mjs gắn vào: thoát mã 4 để Bcons-Bot.cmd cập nhật khi bot không chạy. */
  let exitForUpdate = null;

  const VIDEO_CMDS = new Set(["xem", "duyet", "render", "giong", "storyboard"]);

  const commands = {
    start: () => say(HELP),
    huongdan: () => say(HELP),
    danhsach: () => say(formatList(projDir, outDir)),
    async huy() {
      if (!busy) return say("Không có việc nào đang chạy.");
      const ok = deps.cancel?.();
      return say(ok ? `Đã dừng: ${current}.` : `Việc "${current}" không dừng giữa chừng được, chờ xong nhé.`);
    },
    xem([name]) {
      if (!checkName(name)) return;
      return enqueue(`xem ${name}`, async () => {
        const cap = videoPaths(name, projDir).caption;
        if (fs.existsSync(cap)) {
          const c = parseCaption(fs.readFileSync(cap, "utf8"));
          await say(`📘 FACEBOOK – ${name}\n\n${c.facebook ?? "(chưa có)"}`);
          await say(`🎵 TIKTOK – ${name}\n\n${c.tiktok ?? "(chưa có)"}`);
        } else await say(`${name}: chưa có caption.`);
        const mp4 = path.join(outDir, `${name}.mp4`);
        if (fs.existsSync(mp4)) await sendPreview(mp4, `Bản xem thử ${name} (chưa phải bản đăng)`);
        else await say(`${name}: chưa có video. Nhắn /render ${name}`);
      });
    },
    duyet([name]) {
      if (!checkName(name)) return;
      return enqueue(`duyệt ${name}`, async () => {
        const cap = videoPaths(name, projDir).caption;
        if (!fs.existsSync(cap)) return say(`${name}: chưa có caption, chưa duyệt được.`);
        const rel = path.relative(repoRoot, cap);
        if (!approvalState(fs.readFileSync(cap, "utf8"), null).ok) duyetCaption(cap);
        const mp4 = path.join(outDir, `${name}.mp4`);
        if (!fs.existsSync(mp4)) {
          const saved = await gitSave([rel], `Duyet caption ${name}`);
          return say(`Đã duyệt caption ${name}. ${saved}\nChưa có video: nhắn /render ${name}, xem xong nhắn lại /duyet ${name}.`);
        }
        if (!approvalState(fs.readFileSync(cap, "utf8"), mp4).ok) duyetVideo(cap, mp4);
        await sendApproved({ captionPath: cap, mp4Path: mp4, label: name });
        const saved = await gitSave([rel], `Duyet ${name}`);
        await say(`✅ Đã duyệt ${name}, bản đăng ở các tin phía trên. ${saved}\nViệc còn lại: hẹn giờ trên Metricool (TikTok) và Business Suite (Facebook).`);
      });
    },
    render([name, opt]) {
      if (!checkName(name)) return;
      // "/render <tên> khongnhac": bản chỉ có giọng + hiệu ứng, để anh tự chọn nhạc trên TikTok.
      const khongNhac = opt === "khongnhac" || opt === "khong-nhac";
      const file = `${name}${khongNhac ? "-khong-nhac" : ""}.mp4`;
      return enqueue(`render ${name}`, async () => {
        await say(`Đang render ${name}${khongNhac ? " (không nhạc)" : ""}, mất vài phút... (dừng: /huy)`);
        await run("npm", ["run", "render:drive", "--", name, ...(khongNhac ? ["--khong-nhac"] : [])], remotionDir, `Render ${name}`, 60 * 60e3);
        await sendPreview(path.join(outDir, file), khongNhac ? `Bản không nhạc ${name} (để chọn nhạc trên TikTok).` : `Bản xem thử ${name}. Ưng thì nhắn /duyet ${name}`);
      });
    },
    storyboard([name]) {
      if (!checkName(name)) return;
      return enqueue(`storyboard ${name}`, async () => {
        await say(`Đang chụp storyboard ${name} (không tốn credit, vài phút)...`);
        await run("npm", ["run", "storyboard", "--", name], remotionDir, `Storyboard ${name}`, 30 * 60e3);
        const dir = path.join(remotionDir, "out", "tam", "storyboard", name);
        const m = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
        if (m.uocTinh) await say("Thời lượng từng cảnh đang là ước tính (chưa có giọng). Có giọng thật thì hình giữ nguyên, chỉ khớp lại thời gian.");
        for (const c of m.canh) {
          const cap = `Cảnh ${c.canh} (${c.template}, ~${c.giay} giây)\n${c.loi}`;
          if (c.anh?.length) await tg.sendPhotos(chatId, c.anh.map((f) => path.resolve(remotionDir, f)), cap);
          else await say(`${cap}\n⚠️ ${c.ghiChu}`);
        }
        await say(`Xem xong: ưng thì nhắn Claude "duyệt storyboard ${name}" (rồi mới /giong ${name}); cần sửa cảnh nào thì nói cảnh đó.`);
      });
    },
    chuyenmay() {
      if (!switcher) return say("Máy này chưa có Drive dùng chung nên chưa chuyển máy được.");
      const list = switcher.standbys();
      if (!list.length) return say(`Bot đang chạy trên ${switcher.self}. Không có máy nào đang chờ: mở Bcons-Bot.cmd trên máy kia trước, rồi nhắn lại /chuyenmay.`);
      const rows = list.map((m) => [{ text: `➡️ Chuyển sang ${m.host}`, callback_data: `may:${m.host}`.slice(0, 64) }]);
      rows.push([{ text: `Giữ trên ${switcher.self}`, callback_data: "may:" }]);
      return say(`Bot đang chạy trên ${switcher.self}. Chuyển sang máy nào?`, { reply_markup: { inline_keyboard: rows } });
    },
    kiemgia() {
      return enqueue("kiểm Master File", async () => {
        await say("Đang kiểm Master File theo 5 thông báo PTTT của CĐT...");
        const out = await run("npm", ["run", "kiem-gia"], remotionDir, "Kiểm Master File", 10 * 60e3);
        await say(tail(out, 40));
      });
    },
    gemini(words) {
      const topic = (words ?? []).join(" ").trim();
      if (!topic) return say("Nhắn kèm chủ đề, ví dụ: /gemini lãi suất vay mua nhà tháng 11");
      return enqueue(`nghiên cứu ${topic}`, async () => {
        await say(`Đang nhờ Gemini tìm số liệu: "${topic}" (1–3 phút)...`);
        const out = await run("npm", ["run", "gemini", "--", ...words], remotionDir, "Nghiên cứu Gemini", 10 * 60e3);
        const saved = await gitSave([path.relative(repoRoot, path.join(projDir, "nguon", "gemini"))], `Gemini ${topic}`).catch((e) => `Chưa lưu lên GitHub: ${e.message}`);
        await say(`${tail(out, 40)}\n\n${saved}\nSố liệu CHƯA KIỂM: nhắn Claude "/bcons-video ${topic}" để kiểm từng link và đề xuất góc làm video.`);
      });
    },
    sfx() {
      return ask("Tạo 3 hiệu ứng âm thanh (vút, tách, dồn) bằng ElevenLabs? Việc này TỐN CREDIT (ít, chỉ làm 1 lần).", "sfx", () =>
        enqueue("tạo hiệu ứng", async () => {
          await say("Đang tạo hiệu ứng âm thanh...");
          const out = await run("npm", ["run", "sfx", "--", "--dong-y"], remotionDir, "Tạo hiệu ứng", 10 * 60e3);
          const saved = await gitSave(["engine/remotion/am-thanh/sfx"], "Hieu ung am thanh").catch((e) => `Chưa lưu lên GitHub: ${e.message}`);
          await say(`Xong hiệu ứng.\n${tail(out, 5)}\n${saved}\nTừ giờ /render tự có nhạc + hiệu ứng.`);
        }),
      );
    },
    giong([name, canh]) {
      if (!checkName(name)) return;
      // "/giong 7 canh1": chỉ tạo lại cảnh 1 (vd. giọng bị trôi), đỡ tốn credit.
      const n = canh?.match(/^(?:canh|c|scene)?(\d+(?:,\d+)*)$/i)?.[1];
      const ids = n ? n.split(",").map((x) => `scene${Number(x)}`) : null;
      const label = ids ? ` cảnh ${n}` : "";
      return ask(`Tạo giọng ElevenLabs cho ${name}${label}? Việc này TỐN CREDIT.`, "giong", () =>
        enqueue(`tạo giọng ${name}${label}`, async () => {
          await say(`Đang tạo giọng ${name}${label}...`);
          const args = ["run", "voice", "--", name, ...(ids ? [`--canh=${ids.join(",")}`] : [])];
          const out = await run("npm", args, remotionDir, `Tạo giọng ${name}${label}`, 20 * 60e3);
          const audio = path.relative(repoRoot, videoPaths(name, projDir).audioDir);
          const saved = await gitSave([audio, path.relative(repoRoot, videoPaths(name, projDir).timestamps)], `Giong ${name}${label}`).catch((e) => `Chưa lưu được giọng lên GitHub: ${e.message}`);
          await say(`Xong giọng ${name}${label}.\n${tail(out, 6)}\n${saved}\nCảnh nào còn lệch giọng: /giong ${name} canh<số>. Ổn rồi: /render ${name}`);
        }),
      );
    },
    capnhat() {
      // Windows không cho thay file code của bot khi bot đang chạy: bot tắt (mã 4), Bcons-Bot.cmd lấy bản mới rồi bật lại.
      if (exitForUpdate) {
        return enqueue("cập nhật", async () => {
          await say("⏳ Bot tắt để lấy bản mới, khoảng 1–2 phút sau tự bật lại và báo kết quả.");
          exitForUpdate();
        });
      }
      return enqueue("lấy bản mới", async () => {
        const lock = path.join(remotionDir, "package-lock.json");
        const h = (f) => (fs.existsSync(f) ? crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex") : "");
        const head = async () => (await git(["rev-parse", "HEAD"])).out.trim();
        const before = { lock: h(lock), head: await head() };
        const out = await run("git", ["pull", "--ff-only"], repoRoot, "Lấy bản mới (git pull)");
        let extra = "";
        if (h(lock) !== before.lock) {
          await run("npm", ["ci"], remotionDir, "Cài thư viện (npm ci)", 20 * 60e3);
          extra += "\nĐã cài lại thư viện.";
        }
        const botChanged = (await git(["diff", "--name-only", before.head, "HEAD", "--", "engine/remotion/scripts"])).out.trim();
        if (botChanged) {
          restartAfter = true;
          extra += "\nCó bản bot mới: bot tự khởi động lại trong ít giây.";
        }
        await say(`Đã cập nhật.\n${tail(out, 5)}${extra}`);
      });
    },
    moi() {
      session = null;
      return say("Đã bắt đầu cuộc trò chuyện Claude mới.");
    },
  };

  function claudeTask(text) {
    return enqueue("việc giao cho Claude", async () => {
      const before = new Set(await changedPaths());
      if (before.size) await say(`Lưu ý: laptop đang có ${before.size} file sửa dở chưa lưu. Em chỉ lưu/bỏ những file Claude sửa lần này.`);
      await say("Đã nhận, Claude đang làm trên laptop... (dừng: /huy)");
      const fresh = session && now() - session.at < SESSION_TTL_MS ? session.id : undefined;
      const r = await runClaude(text, { sessionId: fresh, cwd: repoRoot });
      if (r.sessionId) session = { id: r.sessionId, at: now() };
      await say(r.text || "(Claude không trả lời)");
      const mine = (await changedPaths()).filter((p) => !before.has(p));
      if (!mine.length) return;
      await ask(`Claude đã sửa ${mine.length} file:\n${mine.join("\n")}\n\nLưu lên GitHub?`, "claude", (ok) =>
        ok
          ? enqueue("lưu thay đổi của Claude", async () => say(await gitSave(mine, `Bot: ${text.slice(0, 60)}`)))
          : enqueue("bỏ thay đổi", async () => {
              await run("git", ["stash", "push", "-u", "-m", `bot-bo-${now()}`, "--", ...mine], repoRoot, "Cất thay đổi (git stash)");
              await say("Đã bỏ thay đổi của Claude (cất vào git stash, lấy lại được nếu cần).");
            }),
      );
    });
  }

  /** Nút chọn video (mỗi video một hàng): "<số> · <tiêu đề>". */
  function pickVideo(cmd, extra = []) {
    const idx = videoIndex(projDir);
    if (!idx.length) return say("Chưa có video nào có số. Xem /danhsach.");
    const rows = idx.map((v) => [{ text: `${v.so} · ${v.tieuDe}`.slice(0, 60), callback_data: `chon:${cmd}:${v.so}${extra[0] ? `:${extra[0]}` : ""}` }]);
    return say(`Chọn video cho /${cmd}:`, { reply_markup: { inline_keyboard: rows } });
  }

  async function onCallback(cq) {
    if (String(cq.data ?? "").startsWith("may:")) {
      await Promise.resolve(tg.answerCallback(cq.id)).catch(() => {});
      const host = cq.data.slice(4);
      if (!switcher) return say("Máy này chưa có Drive dùng chung nên chưa chuyển máy được.");
      if (!host || host === switcher.self) return say(`Giữ bot trên ${switcher.self}.`);
      if (busy) return say("Bot đang chạy một việc (render, tạo giọng...). Đợi xong hoặc nhắn /huy rồi chuyển máy.");
      switcher.request(host);
      return say(`Đang chuyển bot sang ${host} (khoảng 10–40 giây, chờ Drive đồng bộ)...`);
    }
    if (String(cq.data ?? "").startsWith("chon:")) {
      const [, cmd, so, extra] = cq.data.split(":");
      await Promise.resolve(tg.answerCallback(cq.id)).catch(() => {});
      const name = resolveVideo(so, projDir);
      if (!name || !VIDEO_CMDS.has(cmd)) return say("Không tìm thấy video này nữa. Xem /danhsach.");
      return commands[cmd]([name, ...(extra ? [extra] : [])]);
    }
    const [act, kind, id] = String(cq.data ?? "").split(":");
    await Promise.resolve(tg.answerCallback(cq.id)).catch(() => {});
    const p = pending.get(id);
    if (!p || p.kind !== kind || (cq.message?.date ?? 0) * 1000 < startedAt - 5000) {
      return say("Nút này đã hết hiệu lực (bot đã khởi động lại hoặc đã bấm rồi).");
    }
    pending.delete(id);
    if (kind === "claude") return p.run(act === "ok");
    if (act === "ok") return p.run();
    return say("Đã hủy.");
  }

  async function handleUpdate(update) {
    if (!isAuthorized(update, chatId)) return;
    if (update.callback_query) return onCallback(update.callback_query);
    const m = update.message;
    const text = m?.text;
    if (!text) return;
    if (m.date && m.date * 1000 < startedAt - 2 * 60e3) {
      return say(`Bỏ qua tin cũ lúc laptop tắt: "${text.slice(0, 40)}". Nhắn lại nếu vẫn cần.`);
    }
    if (m.forward_origin || m.forward_from || m.forward_date) {
      return say("Bot không nhận tin chuyển tiếp. Anh gõ trực tiếp lệnh hoặc yêu cầu nhé.");
    }
    const c = parseCommand(text);
    if (!c.cmd) return claudeTask(c.text);
    const fn = commands[c.cmd];
    if (!fn) return say(`Không có lệnh /${c.cmd}.\n\n${HELP}`);
    if (VIDEO_CMDS.has(c.cmd)) {
      // Lệnh cần video: nhận số (/render 3), tên, hoặc vài chữ đầu; không có/không khớp thì hiện nút chọn.
      const name = resolveVideo(c.args[0], projDir);
      if (!name) return pickVideo(c.cmd, c.args.slice(1));
      return fn([name, ...c.args.slice(1)]);
    }
    return fn(c.args);
  }

  return {
    handleUpdate,
    commandNames: Object.keys(commands),
    setSwitcher: (s) => (switcher = s),
    setExitForUpdate: (f) => (exitForUpdate = f),
    _state: () => ({ busy, queue: queue.length, pending: pending.size, session }),
  };
}
