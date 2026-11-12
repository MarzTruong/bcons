// Xử lý tin nhắn/nút bấm của bot. Mọi việc ra ngoài (Telegram, chạy lệnh, Claude, gửi bài) đi qua deps để test được.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { approvalState, duyetCaption, duyetVideo } from "../caption-cli.mjs";
import { parseCaption } from "../caption.mjs";
import { videoPaths } from "../project.mjs";
import { buttons } from "./tg.mjs";
import { chayPhieu as chayPhieuThat, parseLenhPhieu } from "../phieu.mjs";
import { HELP, buocVideo, formatList, isAuthorized, parseCommand, resolveVideo, videoIndex } from "./core.mjs";
import { pidOf } from "./du-an.mjs";

const NAME_RE = /^[a-z0-9-]+$/;

/** Báo cáo Gemini (bỏ file -KIEM), mới trước. Nút 🎬 trỏ tới báo cáo bằng mã băm tên file nên bot khởi động lại vẫn bấm được. */
export function geminiReports(projDir) {
  const dir = path.join(projDir, "nguon", "gemini");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !/-KIEM\.md$/i.test(f))
    .sort()
    .reverse()
    .map((f) => ({ file: f, rel: path.join(dir, f), key: crypto.createHash("sha1").update(f).digest("hex").slice(0, 12) }));
}

const gemvidPrompt = (file) =>
  `/bcons-video Làm video từ báo cáo Gemini (file ${file}). Làm CỔNG 1 theo skill bcons-video: mở từng link gốc đối chiếu từng con số, loại số sai/bịa, ghi file -KIEM.md cạnh báo cáo; đề xuất 2-3 góc làm video và tên <số>-<tên>. Sau đó DỪNG, chờ anh chọn góc; chưa viết kịch bản, chưa tạo giọng.`;
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
 * deps: { tg, chatId, duAn (taoDuAn: nhiều dự án, anh chọn bằng /duan) hoặc projDir (một dự án cố định), outDir, repoRoot, remotionDir,
 *         exec(cmd, args, { cwd, timeoutMs }) → Promise<{ code, out }>, cancel() → bool,
 *         runClaude(prompt, { sessionId, cwd }) → Promise<{ text, sessionId, isError }>,
 *         sendApproved({ captionPath, mp4Path, label }) → Promise,
 *         now() → ms, startedAt (ms), restart() → void }
 */
export function createBot(deps) {
  const { tg, chatId, outDir, repoRoot, remotionDir, exec, runClaude, sendApproved } = deps;
  // Dự án đang làm: đổi được khi bot đang chạy (/duan). Mọi lệnh con đọc projDir tại lúc chạy và truyền --du-an.
  const duAn = deps.duAn ?? null;
  let cur = duAn ? duAn.get() : null;
  let projDir = cur ? cur.dir : deps.projDir;
  const pid = () => (cur ? pidOf(cur.ma) : "");
  const nhan = () => (cur ? `🏢 ${cur.ten}\n` : "");
  const daFlag = () => (cur ? ["--du-an", cur.ma] : []);
  const now = deps.now ?? (() => Date.now());
  const startedAt = deps.startedAt ?? now();
  const runId = crypto.randomBytes(3).toString("hex"); // nút bấm của lần chạy trước hết hiệu lực
  const say = (text, extra) =>
    Promise.resolve()
      .then(() => tg.sendMessage(chatId, text, extra))
      .catch((e) => console.error(`Không gửi được tin Telegram: ${e.message}`));
  const sayP = (text, extra) => say(nhan() + text, extra);
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
        : kind === "gemvid"
          ? [["🎬 Làm video từ kết quả này", `ok:${kind}:${id}`], ["Để sau", `huy:${kind}:${id}`]]
          : [["✅ Đồng ý", `ok:${kind}:${id}`], ["✖️ Hủy", `huy:${kind}:${id}`]];
    return say((kind === "giong" ? nhan() : "") + text, buttons(labels));
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
    start: () => sayP(HELP),
    huongdan: () => sayP(HELP),
    danhsach: () => sayP(formatList(projDir, outDir)),
    duan(args) {
      if (!duAn) return say("Bot này đang chạy cố định một dự án.");
      const chu = (args ?? []).join(" ").trim();
      if (chu) {
        const hit = duAn.tim(chu);
        if (!hit) return say(`Không thấy dự án "${chu}" (hoặc khớp nhiều dự án). Gõ /duan để bấm chọn.`);
        return doiDuAn(hit.ma);
      }
      const rows = duAn.list().map((d) => [{ text: `${d.ma === cur?.ma ? "✅ " : ""}${d.ten}`.slice(0, 60), callback_data: `da:${d.ma}`.slice(0, 64) }]);
      return say(`Đang làm: ${cur?.ten ?? "(chưa có dự án)"}. Chọn dự án:`, { reply_markup: { inline_keyboard: rows } });
    },
    video() {
      const idx = videoIndex(projDir);
      if (!idx.length) return sayP("Chưa có video nào. Nhắn Claude chủ đề để bắt đầu video mới.");
      const icon = { kichban: "📝", giong: "🎙", render: "🎬", duyet: "👀", xong: "✅" };
      const rows = idx.map((v) => [{ text: `${icon[buocVideo(v.name, projDir, outDir).tiep]} ${v.so} · ${v.tieuDe}`.slice(0, 60), callback_data: `v:${pid()}:${v.so}` }]);
      if (idx.length > 1) rows.push([{ text: "☑ Làm nhiều video cùng lúc", callback_data: `vm:${pid()}` }]);
      return sayP("Bấm một video để xem tiến trình và làm bước kế tiếp.\n📝 chờ duyệt kịch bản · 🎙 chờ giọng · 🎬 chờ render · 👀 chờ duyệt · ✅ xong", { reply_markup: { inline_keyboard: rows } });
    },
    khach() {
      return sayP(
        "Phiếu tính gửi khách: gõ /phieu <mã căn> <PTTT> (thêm chữ pdf nếu cần), vd. /phieu B1.3-01 09\nHoặc bấm lệnh /phieu_... có sẵn trong tin báo khách mới.",
        buttons([["🔎 Kiểm giá Master File", "m:kiemgia"]]),
      );
    },
    nghiencuu() {
      return sayP("Tìm số liệu có nguồn: gõ /gemini <chủ đề>, vd. /gemini lãi suất vay mua nhà tháng 11 (tốn ít phí Google).", buttons([["📄 Chọn báo cáo cũ để làm video", "m:baocao"]]));
    },
    may() {
      const rows = [
        [{ text: "⬇️ Cập nhật bot", callback_data: "m:capnhat" }, { text: "🔁 Chuyển máy", callback_data: "m:chuyenmay" }],
        [{ text: "🔊 Tạo hiệu ứng âm thanh", callback_data: "m:sfx" }, { text: "🆕 Trò chuyện Claude mới", callback_data: "m:moi" }],
      ];
      return say(`Máy đang chạy bot: ${switcher?.self ?? "máy này"}.${busy ? `\nĐang làm: ${current}.` : ""}`, { reply_markup: { inline_keyboard: rows } });
    },
    async huy() {
      if (!busy) return say("Không có việc nào đang chạy.");
      const ok = deps.cancel?.();
      return say(ok ? `Đã dừng: ${current}.` : `Việc "${current}" không dừng giữa chừng được, chờ xong nhé.`);
    },
    xem([name, kieu]) {
      if (!checkName(name)) return;
      return enqueue(`xem ${name}`, async () => {
        const vp = videoPaths(name, projDir);
        const cap = vp.caption;
        if (/^icon$/i.test(kieu ?? "")) {
          if (!fs.existsSync(vp.captionIcon)) return say(`${name}: chưa có bản icon (caption-icon.md). Nhắn Claude "viết bản caption có icon cho ${name}".`);
          const c = parseCaption(fs.readFileSync(vp.captionIcon, "utf8"));
          await say(`📘 FACEBOOK (ICON) – ${name}\n\n${c.facebook ?? "(chưa có)"}`);
          await say(`🎵 TIKTOK (ICON) – ${name}\n\n${c.tiktok ?? "(chưa có)"}`);
          if (c.zalo) await say(`💬 ZALO (ICON) – ${name}\n\n${c.zalo}`);
          return;
        }
        if (fs.existsSync(vp.captionIcon)) await say(`Có thêm bản caption có icon: /xem ${name} icon`);
        if (fs.existsSync(cap)) {
          const c = parseCaption(fs.readFileSync(cap, "utf8"));
          await say(`📘 FACEBOOK – ${name}\n\n${c.facebook ?? "(chưa có)"}`);
          await say(`🎵 TIKTOK – ${name}\n\n${c.tiktok ?? "(chưa có)"}`);
          const zf = videoPaths(name, projDir).zalo;
          const zalo = c.zalo ?? (fs.existsSync(zf) ? parseCaption(fs.readFileSync(zf, "utf8")).zalo : null);
          if (zalo) await say(`💬 ZALO – ${name}\n\n${zalo}`);
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
        // Chỉ gửi chữ caption để sao chép (anh 08/11/2026): video đã xem ở bước render, gửi lại dễ vượt 50 MB.
        await sendApproved({ captionPath: cap, mp4Path: mp4, label: name, guiVideo: false });
        const saved = await gitSave([rel], `Duyet ${name}`);
        await say(`✅ Đã duyệt ${name} (caption + video bản render hiện tại). Caption FB/TikTok ở các tin phía trên. ${saved}\nViệc còn lại: nhắn Claude ngày giờ đăng để lên lịch.`);
      });
    },
    render([name, opt]) {
      if (!checkName(name)) return;
      // "/render <tên> khongnhac": bản chỉ có giọng + hiệu ứng, để anh tự chọn nhạc trên TikTok.
      const khongNhac = opt === "khongnhac" || opt === "khong-nhac";
      const file = `${name}${khongNhac ? "-khong-nhac" : ""}.mp4`;
      return enqueue(`render ${name}`, async () => {
        await sayP(`Đang render ${name}${khongNhac ? " (không nhạc)" : ""}, mất vài phút... (dừng: /huy)`);
        await run("npm", ["run", "render:drive", "--", ...daFlag(), name, ...(khongNhac ? ["--khong-nhac"] : [])], remotionDir, `Render ${name}`, 60 * 60e3);
        await sendPreview(path.join(outDir, file), khongNhac ? `Bản không nhạc ${name} (để chọn nhạc trên TikTok).` : `Bản xem thử ${name}. Ưng thì nhắn /duyet ${name}`);
      });
    },
    storyboard([name]) {
      if (!checkName(name)) return;
      return enqueue(`storyboard ${name}`, async () => {
        await sayP(`Đang chụp storyboard ${name} (không tốn credit, vài phút)...`);
        await run("npm", ["run", "storyboard", "--", ...daFlag(), name], remotionDir, `Storyboard ${name}`, 30 * 60e3);
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
    phieu(words) {
      let a;
      try {
        a = parseLenhPhieu((words ?? []).join(" "));
      } catch (e) {
        return say(e.message);
      }
      return enqueue(`phiếu ${a.ma}`, async () => {
        await sayP(`Đang dựng phiếu tính căn ${a.ma} (PTTT ${a.pttt})...`);
        try {
          const r = await (deps.chayPhieu ?? chayPhieuThat)({ ...a, projDir });
          const ten = r.png.split(/[\\/]/).pop();
          await tg.sendDocument(chatId, r.png, `Phiếu tính ${a.ma} – PTTT ${a.pttt}. Lưu ảnh này rồi gửi khách qua Zalo.`);
          if (r.pdf) await tg.sendDocument(chatId, r.pdf, `Bản PDF ${ten.replace(/\.png$/, "")}`);
          if (r.canhBao) await say(r.canhBao);
        } catch (e) {
          await say(e.message + (cur ? `\n(Bot đang ở dự án ${cur.ten}. Căn thuộc dự án khác thì gõ /duan đổi rồi bấm lại.)` : ""));
        }
      });
    },
    kiemgia() {
      return enqueue("kiểm Master File", async () => {
        await sayP("Đang kiểm Master File theo 5 thông báo PTTT của CĐT...");
        const out = await run("npm", ["run", "kiem-gia", ...(cur ? ["--", ...daFlag()] : [])], remotionDir, "Kiểm Master File", 10 * 60e3);
        await say(tail(out, 40));
      });
    },
    gemini(words) {
      const topic = (words ?? []).join(" ").trim();
      if (!topic) return say("Nhắn kèm chủ đề, ví dụ: /gemini lãi suất vay mua nhà tháng 11");
      return enqueue(`nghiên cứu ${topic}`, async () => {
        await sayP(`Đang nhờ Gemini tìm số liệu: "${topic}" (1–3 phút)...`);
        const out = await run("npm", ["run", "gemini", "--", ...daFlag(), ...words], remotionDir, "Nghiên cứu Gemini", 10 * 60e3);
        const saved = await gitSave([path.relative(repoRoot, path.join(projDir, "nguon", "gemini"))], `Gemini ${topic}`).catch((e) => `Chưa lưu lên GitHub: ${e.message}`);
        await say(`${tail(out, 40)}\n\n${saved}`);
        // Nối cổng 1 → 2: một nút giao Claude kiểm link + đề xuất góc từ chính báo cáo này (anh muốn 07/11/2026).
        const savedName = out.match(/Đã lưu \S*?([^\\/\s]+\.md)/)?.[1];
        const reports = geminiReports(projDir);
        const r = reports.find((x) => x.file === savedName) ?? reports[0];
        if (!r) return;
        return say(
          `Số liệu CHƯA KIỂM. Làm video từ kết quả này? (Claude kiểm từng link, đề xuất góc, rồi dừng chờ anh chọn)`,
          buttons([["🎬 Làm video từ kết quả này", `gv:${r.key}`], ["Để sau", "gv:-"]]),
        );
      });
    },
    baocao() {
      const list = geminiReports(projDir).slice(0, 8);
      if (!list.length) return say("Chưa có báo cáo Gemini nào. Gõ /gemini <chủ đề> để tạo.");
      const rows = list.map((r) => [{ text: `🎬 ${r.file.replace(/\.md$/, "")}`.slice(0, 60), callback_data: `gv:${r.key}` }]);
      return say("Chọn báo cáo Gemini để làm video (Claude kiểm từng link, đề xuất góc, rồi dừng chờ anh chọn):", { reply_markup: { inline_keyboard: rows } });
    },
    sfx() {
      return ask("Tạo hiệu ứng âm thanh còn thiếu trong kho (11 kiểu vút/tách/dồn) bằng ElevenLabs? Việc này TỐN CREDIT (file đã có thì bỏ qua).", "sfx", () =>
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
          await sayP(`Đang tạo giọng ${name}${label}...`);
          const args = ["run", "voice", "--", ...daFlag(), name, ...(ids ? [`--canh=${ids.join(",")}`] : [])];
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

  function claudeTask(text0) {
    const text = cur ? `[Dự án đang làm trên bot: ${cur.ma} (${cur.ten}), thư mục du-an/${cur.ma}/. Lệnh npm thêm --du-an ${cur.ma}.]\n${text0}` : text0;
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
          ? enqueue("lưu thay đổi của Claude", async () => say(await gitSave(mine, `Bot: ${text0.slice(0, 60)}`)))
          : enqueue("bỏ thay đổi", async () => {
              await run("git", ["stash", "push", "-u", "-m", `bot-bo-${now()}`, "--", ...mine], repoRoot, "Cất thay đổi (git stash)");
              await say("Đã bỏ thay đổi của Claude (cất vào git stash, lấy lại được nếu cần).");
            }),
      );
    });
  }

  const M_CMDS = new Set(["kiemgia", "baocao", "capnhat", "chuyenmay", "sfx", "moi", "video", "duan"]);
  const VIDEO_NHAN = [["storyboard", "🖼 Storyboard"], ["giong", "🎙 Tạo giọng"], ["render", "🎬 Render"], ["xem", "👀 Xem"], ["duyet", "✅ Duyệt"]];

  function doiDuAn(ma) {
    if (!duAn) return say("Bot này đang chạy cố định một dự án.");
    if (busy || queue.length) return say(`Đang làm: ${current ?? "việc xếp hàng"}. Đợi xong (hoặc /huy) rồi đổi dự án, để việc đang chạy không lẫn dự án.`);
    let hit;
    try {
      hit = duAn.set(ma);
    } catch {
      return say(`Không thấy dự án "${ma}". Gõ /duan để chọn lại.`);
    }
    cur = hit;
    projDir = hit.dir;
    pending.clear(); // nút Đồng ý của dự án trước hết hiệu lực
    picks.clear();
    const n = videoIndex(projDir).length;
    return say(`🏢 Đang làm: ${hit.ten} (${n} video). Mọi lệnh từ giờ chạy cho dự án này. Gõ /video để tiếp tục.`);
  }

  /** Thẻ một video: tiến trình + nút bước kế tiếp ở hàng đầu, các bước khác ở hàng dưới. */
  function theVideo(so) {
    const v = videoIndex(projDir).find((x) => String(x.so) === String(so));
    if (!v) return say("Không tìm thấy video này nữa. Gõ /video.");
    const b = buocVideo(v.name, projDir, outDir);
    const o = (x) => (x ? "✅" : "⬜");
    const nut = (cmd, text, extra) => ({ text, callback_data: `va:${pid()}:${cmd}:${v.so}${extra ? `:${extra}` : ""}` });
    const chinh = {
      kichban: [nut("storyboard", "🖼 Xem storyboard (chụp hình từng cảnh)")],
      giong: [nut("giong", "🎙 Tạo giọng (tốn credit, có hỏi lại)")],
      render: [nut("render", "🎬 Render video")],
      duyet: [nut("xem", "👀 Xem bản render"), nut("duyet", "✅ Duyệt")],
      xong: [nut("xem", "👀 Xem lại caption + video")],
    }[b.tiep];
    const daCo = new Set(chinh.map((x) => x.callback_data.split(":")[2]));
    const khac = VIDEO_NHAN.filter(([cmd]) => !daCo.has(cmd)).map(([cmd, t]) => nut(cmd, t));
    const rows = [chinh, khac.slice(0, 3), [...khac.slice(3), nut("render", "🎬 Render không nhạc", "khongnhac")], [{ text: "⬅ Danh sách video", callback_data: "m:video" }]].filter((r) => r.length);
    const tiep = {
      kichban: "Bước kế: kịch bản chưa duyệt. Xem storyboard rồi nhắn Claude duyệt hoặc sửa.",
      giong: "Bước kế: tạo giọng.",
      render: "Bước kế: render.",
      duyet: `Bước kế: xem rồi duyệt (caption: ${b.caption}, video: ${b.video}).`,
      xong: "Đã duyệt xong. Nhắn Claude ngày giờ đăng để lên lịch.",
    }[b.tiep];
    return sayP(`🎬 ${v.so} · ${v.tieuDe}\nKịch bản ${b.kichBan ? "✅" : "📝 nháp"} · Giọng ${o(b.giong)} · Render ${o(b.mp4)} · Duyệt ${o(b.duyet)}\n${tiep}`, { reply_markup: { inline_keyboard: rows } });
  }

  /** Menu tick chọn video (anh muốn 07/11/2026): ☐/☑ mỗi video, "Chọn tất cả", "▶ Làm (n video)". */
  const picks = new Map(); // cmd → { sel: Set<số>, extra }
  const sfx = () => (cur ? `:${pid()}` : "");
  /** Nút của dự án khác (tin cũ trước khi đổi dự án) thì không chạy. */
  function dungDuAn(p) {
    if (!cur || p === pid()) return true;
    say(`Nút này thuộc dự án khác (tin cũ). Bot đang làm: ${cur.ten}. Gõ /video để xem lại.`);
    return false;
  }
  function pickMarkup(cmd) {
    const idx = videoIndex(projDir);
    const p = picks.get(cmd) ?? { sel: new Set() };
    const all = idx.length > 0 && idx.every((v) => p.sel.has(v.so));
    const rows = idx.map((v) => [{ text: `${p.sel.has(v.so) ? "☑" : "☐"} ${v.so} · ${v.tieuDe}`.slice(0, 60), callback_data: `tick:${cmd}:${v.so}${sfx()}` }]);
    rows.push([{ text: all ? "☑ Bỏ chọn tất cả" : "☐ Chọn tất cả", callback_data: `tick:${cmd}:all${sfx()}` }]);
    rows.push([{ text: p.sel.size ? `▶ Làm (${p.sel.size} video)` : "▶ Làm (chưa chọn)", callback_data: `tick:${cmd}:ok${sfx()}` }]);
    return { inline_keyboard: rows };
  }
  function pickVideo(cmd, extra = []) {
    const idx = videoIndex(projDir);
    if (!idx.length) return say("Chưa có video nào có số. Xem /danhsach.");
    picks.set(cmd, { sel: new Set(), extra: extra[0] });
    return sayP(`/${cmd}: tick chọn 1 hoặc nhiều video (hoặc Chọn tất cả), rồi bấm ▶ Làm.`, { reply_markup: pickMarkup(cmd) });
  }
  async function onTick(cq) {
    const [, cmd, what, p0] = cq.data.split(":");
    await Promise.resolve(tg.answerCallback(cq.id)).catch(() => {});
    if (!VIDEO_CMDS.has(cmd)) return;
    if (!dungDuAn(p0)) return;
    const p = picks.get(cmd) ?? { sel: new Set() };
    picks.set(cmd, p);
    const idx = videoIndex(projDir);
    if (what === "ok") {
      if (!p.sel.size) return say("Chưa tick video nào.");
      const names = idx.filter((v) => p.sel.has(v.so)).map((v) => v.name);
      picks.delete(cmd);
      await Promise.resolve(tg.editMarkup?.(cq.message?.chat?.id ?? chatId, cq.message?.message_id, { inline_keyboard: [] })).catch(() => {});
      await say(`/${cmd} ${names.length} video: ${idx.filter((v) => names.includes(v.name)).map((v) => v.so).join(", ")}`);
      for (const n of names) await commands[cmd]([n, ...(p.extra ? [p.extra] : [])]);
      return;
    }
    if (what === "all") {
      const all = idx.every((v) => p.sel.has(v.so));
      p.sel = all ? new Set() : new Set(idx.map((v) => v.so));
    } else {
      const so = Number(what);
      if (p.sel.has(so)) p.sel.delete(so);
      else p.sel.add(so);
    }
    await Promise.resolve(tg.editMarkup?.(cq.message?.chat?.id ?? chatId, cq.message?.message_id, pickMarkup(cmd))).catch(() => {});
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
    if (String(cq.data ?? "").startsWith("tick:")) return onTick(cq);
    const d = String(cq.data ?? "");
    if (/^(da|v|va|vm|vmc|m):/.test(d) || d === "vm") {
      await Promise.resolve(tg.answerCallback(cq.id)).catch(() => {});
      const [loai, a, b, c, e] = d.split(":");
      if (loai === "da") return doiDuAn(d.slice(3));
      if (loai === "m") return M_CMDS.has(a) ? commands[a]([]) : undefined;
      if (!dungDuAn(a)) return;
      if (loai === "v") return theVideo(b);
      if (loai === "vm") return say("Làm việc gì cho nhiều video?", buttons(VIDEO_NHAN.map(([cmd, nhanNut]) => [nhanNut, `vmc:${a}:${cmd}`])));
      if (loai === "vmc") return VIDEO_CMDS.has(b) ? pickVideo(b) : undefined;
      if (loai === "va") {
        const name = resolveVideo(c, projDir);
        if (!name || !VIDEO_CMDS.has(b)) return say("Không tìm thấy video này nữa. Gõ /video.");
        return commands[b]([name, ...(e ? [e] : [])]);
      }
    }
    if (String(cq.data ?? "").startsWith("gv:")) {
      await Promise.resolve(tg.answerCallback(cq.id)).catch(() => {});
      const key = cq.data.slice(3);
      if (key === "-") return say("Để sau. Lúc nào muốn làm thì gõ /baocao để chọn lại báo cáo.");
      const r = geminiReports(projDir).find((x) => x.key === key);
      if (!r) return say("Không thấy báo cáo này nữa. Gõ /baocao để xem danh sách.");
      return claudeTask(gemvidPrompt(path.relative(repoRoot, r.rel).split(path.sep).join("/")));
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
    // Nút 🎬 kiểu cũ (trước bản 08/11) không mang tên báo cáo: hiện danh sách để anh chọn lại.
    if (kind === "gemvid") return commands.baocao();
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
    // Lệnh bấm được trong tin báo khách: /phieu_<mã>_<PTTT>_<lãi>_<năm> (Telegram không cho dấu '-' và '.').
    if (/^phieu_\w+$/.test(c.cmd)) return commands.phieu([`/${c.cmd}`, ...c.args]);
    const fn = commands[c.cmd];
    if (!fn) return sayP(`Không có lệnh /${c.cmd}.\n\n${HELP}`);
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
    _tg: tg,
    commandNames: Object.keys(commands),
    setSwitcher: (s) => (switcher = s),
    setExitForUpdate: (f) => (exitForUpdate = f),
    _state: () => ({ busy, queue: queue.length, pending: pending.size, session }),
  };
}
