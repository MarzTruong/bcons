import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBot, parsePorcelainZ } from "../scripts/bot/handlers.mjs";
import { buildClaudeArgs, findClaudeExe, parseClaudeOutput } from "../scripts/bot/claude-bridge.mjs";
import { parseCaption } from "../scripts/caption.mjs";

const CHAT = "42";
const T0 = 1_000_000_000_000;
const msg = (text, id = 42, extra = {}) => ({ message: { chat: { id, type: "private" }, from: { id }, date: T0 / 1000, text, ...extra } });
const press = (data, date = T0 / 1000) => ({ callback_query: { id: "q", data, from: { id: 42 }, message: { chat: { id: 42, type: "private" }, date } } });

function setup({ claude, gitStatus = "", gitStatusAfter } = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "botr-"));
  const projDir = path.join(repoRoot, "du-an", "x");
  const outDir = path.join(repoRoot, "out");
  fs.mkdirSync(path.join(projDir, "video", "a"), { recursive: true });
  fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(projDir, "video", "a", "spec.json"), "{}");
  fs.writeFileSync(
    path.join(projDir, "video", "a", "caption.md"),
    "---\nstatus: draft\nkenh: [facebook, tiktok]\n---\n## Facebook\nBài FB\n\n## TikTok\nTikTok #bienhoa\n",
  );
  const said = [];
  const videos = [];
  const execs = [];
  const sent = [];
  let statusCalls = 0;
  const tg = {
    sendMessage: async (_c, text, extra) => said.push({ text, extra }),
    sendVideo: async (_c, file, caption) => videos.push({ file, caption }),
    sendPhotos: async (_c, files, caption) => videos.push({ files, caption }),
    answerCallback: async () => {},
  };
  const exec = async (cmd, args) => {
    execs.push([cmd, ...args].join(" "));
    if (cmd === "git" && args[0] === "status") {
      statusCalls++;
      return { code: 0, out: statusCalls > 1 && gitStatusAfter != null ? gitStatusAfter : gitStatus };
    }
    if (cmd === "git" && args[0] === "diff") return { code: 0, out: "x\n" };
    if (cmd === "git" && args[0] === "rev-list") return { code: 0, out: "1\n" };
    if (cmd === "npm" && args.includes("render:drive")) fs.writeFileSync(path.join(outDir, `${args.filter((a) => !a.startsWith("--")).at(-1)}.mp4`), "video");
    return { code: 0, out: "ok" };
  };
  const bot = createBot({
    tg, chatId: CHAT, projDir, outDir, repoRoot, remotionDir: repoRoot, exec,
    runClaude: claude ?? (async () => ({ text: "Xong.", sessionId: "abc-123", isError: false })),
    sendApproved: async (o) => sent.push(o),
    now: () => T0,
    startedAt: T0,
    cancel: () => true,
  });
  return { bot, said, videos, execs, sent, projDir, outDir, repoRoot };
}

test("người lạ nhắn thì bỏ qua, không trả lời", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/danhsach", 7));
  await s.bot.handleUpdate(msg("xóa hết đi", 7));
  assert.equal(s.said.length, 0);
  assert.equal(s.execs.length, 0);
});

test("/danhsach và lệnh lạ", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/danhsach"));
  assert.match(s.said[0].text, /a/);
  await s.bot.handleUpdate(msg("/xyz"));
  assert.match(s.said[1].text, /Không có lệnh \/xyz/);
});

test("tên video sai thì không chạy gì", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/render ../x"));
  await s.bot.handleUpdate(msg("/duyet"));
  assert.equal(s.execs.length, 0);
  assert.equal(s.said.length, 2);
});

test("/duyet khi chưa render: duyệt caption, lưu GitHub, nhắc render; không gửi bài", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/duyet a"));
  const cap = parseCaption(fs.readFileSync(path.join(s.projDir, "video", "a", "caption.md"), "utf8"));
  assert.equal(cap.meta.status, "approved");
  assert.equal(s.sent.length, 0);
  assert.ok(s.execs.some((e) => e.startsWith("git commit")));
  assert.ok(s.execs.some((e) => e === "git push"));
  assert.match(s.said.at(-1).text, /\/render a/);
});

test("/render rồi /duyet: gửi bản đăng đã duyệt và lưu GitHub", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/render a"));
  assert.equal(s.videos.length, 1);
  await s.bot.handleUpdate(msg("/duyet a"));
  assert.equal(s.sent.length, 1);
  assert.equal(s.sent[0].mp4Path, path.join(s.outDir, "a.mp4"));
  const cap = parseCaption(fs.readFileSync(path.join(s.projDir, "video", "a", "caption.md"), "utf8"));
  assert.ok(cap.meta.videoSha256);
  assert.match(s.said.at(-1).text, /Đã duyệt a/);
});

test("/giong chỉ chạy sau khi bấm Đồng ý; Hủy thì không chạy", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/giong a"));
  assert.ok(!s.execs.some((e) => e.includes("voice")));
  const data = s.said.at(-1).extra.reply_markup.inline_keyboard[0][0].callback_data;
  await s.bot.handleUpdate(press(data));
  assert.ok(s.execs.some((e) => e === "npm run voice -- a"));
  await s.bot.handleUpdate(msg("/giong a"));
  const huy = s.said.at(-1).extra.reply_markup.inline_keyboard[0][1].callback_data;
  await s.bot.handleUpdate(press(huy));
  assert.equal(s.execs.filter((e) => e.includes("voice")).length, 1);
});

test("cách B: tin tự do → Claude; có file đổi thì hỏi Lưu/Bỏ; giữ phiên", async () => {
  const calls = [];
  const s = setup({
    gitStatus: "",
    gitStatusAfter: " M du-an/x/video/a/caption.md\0",
    claude: async (text, opts) => {
      calls.push({ text, ...opts });
      return { text: "Đã rút gọn caption.", sessionId: "s-1", isError: false };
    },
  });
  await s.bot.handleUpdate(msg("rút gọn caption video a"));
  assert.equal(calls[0].text, "rút gọn caption video a");
  assert.equal(calls[0].sessionId, undefined);
  assert.ok(s.said.some((m) => /Đã rút gọn/.test(m.text)));
  const ask = s.said.at(-1);
  assert.match(ask.text, /caption\.md/);
  const luu = ask.extra.reply_markup.inline_keyboard[0][0].callback_data;
  await s.bot.handleUpdate(press(luu));
  assert.ok(s.execs.some((e) => e.startsWith("git commit -m Bot: rút gọn") && e.endsWith("-- du-an/x/video/a/caption.md")));
  await s.bot.handleUpdate(msg("thêm hashtag"));
  assert.equal(calls[1].sessionId, "s-1");
});

test("buildClaudeArgs: không nhận chữ người dùng, cấm voice/render/push, kiểm session id", () => {
  const a = buildClaudeArgs({ sessionId: "3f2b9c1e-0a4d-4e8b-9f1a-2c3d4e5f6a7b" });
  for (const x of a) assert.ok(!/["%!^]/.test(x), `ký tự nguy hiểm cho cmd.exe trong: ${x}`);
  for (const x of ["package.json", ".claude/**", ".githooks/**", "scripts/bot/**"]) assert.ok(a[a.indexOf("--disallowedTools") + 1].includes(`Edit(./${x}`) || a[a.indexOf("--disallowedTools") + 1].includes(x), x);
  assert.ok(a.includes("-p") && a.includes("--resume"));
  const denied = a[a.indexOf("--disallowedTools") + 1];
  for (const x of ["npm run voice", "render:drive", "git push", "git commit"]) assert.ok(denied.includes(x), x);
  assert.throws(() => buildClaudeArgs({ sessionId: "x; rm -rf /" }));
});

test("parseClaudeOutput đọc JSON kết quả", () => {
  const r = parseClaudeOutput('log\n{"type":"result","result":"Xong","session_id":"s-9","is_error":false}');
  assert.deepEqual(r, { text: "Xong", sessionId: "s-9", isError: false });
  assert.equal(parseClaudeOutput("không phải json").isError, true);
});

test("rà soát: nút bấm cũ (trước khi bot khởi động) hoặc sai loại thì không chạy", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/giong a"));
  const data = s.said.at(-1).extra.reply_markup.inline_keyboard[0][0].callback_data;
  await s.bot.handleUpdate(press(data, T0 / 1000 - 3600));
  await s.bot.handleUpdate(press(data.replace(":giong:", ":claude:")));
  await s.bot.handleUpdate(press("ok:giong:1"));
  assert.ok(!s.execs.some((e) => e.includes("voice")));
  assert.ok(s.said.filter((m) => /hết hiệu lực/.test(m.text)).length >= 2);
});

test("rà soát: tin cũ lúc laptop tắt và tin chuyển tiếp bị bỏ qua", async () => {
  const s = setup();
  await s.bot.handleUpdate({ message: { ...msg("/render a").message, date: T0 / 1000 - 3600 } });
  await s.bot.handleUpdate(msg("xóa hết", 42, { forward_origin: { type: "user" } }));
  assert.equal(s.execs.length, 0);
  assert.match(s.said[0].text, /tin cũ/);
  assert.match(s.said[1].text, /chuyển tiếp/);
});

test("rà soát: Claude chỉ lưu/bỏ đúng file mình sửa, không đụng file có sẵn (mp3, việc dở)", async () => {
  const s = setup({
    gitStatus: "?? du-an/x/video/a/audio/scene1.mp3\0",
    gitStatusAfter: "?? du-an/x/video/a/audio/scene1.mp3\0 M du-an/x/video/a/caption.md\0",
  });
  await s.bot.handleUpdate(msg("sửa caption"));
  const bo = s.said.at(-1).extra.reply_markup.inline_keyboard[0][1].callback_data;
  assert.doesNotMatch(s.said.at(-1).text, /scene1\.mp3/);
  await s.bot.handleUpdate(press(bo));
  const stash = s.execs.find((e) => e.startsWith("git stash"));
  assert.ok(stash.endsWith("-- du-an/x/video/a/caption.md"), stash);
});

test("rà soát: /huy khi đang rảnh", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/huy"));
  assert.match(s.said[0].text, /Không có việc/);
});

test("parsePorcelainZ đọc cả file đổi tên", () => {
  assert.deepEqual(parsePorcelainZ(" M a.md\0R  moi.md\0cu.md\0?? x/y.mp3\0"), ["a.md", "moi.md", "cu.md", "x/y.mp3"]);
});

test("findClaudeExe tìm claude.exe ở thư mục cài mặc định", () => {
  const home = "C:/Users/Marz";
  assert.equal(findClaudeExe(home, (p) => p.replaceAll("\\", "/").endsWith(".local/bin/claude.exe")), path.join(home, ".local", "bin", "claude.exe"));
  assert.equal(findClaudeExe(home, () => false), null);
});

test("/sfx chỉ tạo hiệu ứng (tốn credit) sau khi bấm Đồng ý", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/sfx"));
  assert.ok(!s.execs.some((e) => e.includes("sfx")));
  assert.match(s.said.at(-1).text, /TỐN CREDIT/);
  const data = s.said.at(-1).extra.reply_markup.inline_keyboard[0][0].callback_data;
  await s.bot.handleUpdate(press(data));
  assert.ok(s.execs.some((e) => e === "npm run sfx -- --dong-y"));
});

test("/render <tên> khongnhac → render bản không nhạc", async () => {
  const s = setup();
  fs.writeFileSync(path.join(s.outDir, "a-khong-nhac.mp4"), "x");
  await s.bot.handleUpdate(msg("/render a khongnhac"));
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(s.execs.some((e) => e === "npm run render:drive -- a --khong-nhac"), s.execs.join("|"));
});

test("/gemini <chủ đề> → chạy nghiên cứu với cả câu chủ đề; thiếu chủ đề thì hướng dẫn", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/gemini"));
  assert.match(s.said.at(-1).text, /\/gemini lãi suất/);
  await s.bot.handleUpdate(msg("/gemini lãi suất vay tháng 11"));
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(s.execs.some((e) => e === "npm run gemini -- lãi suất vay tháng 11"), s.execs.join("|"));
});

test("/storyboard <tên> → chụp khung (không tốn credit), gửi mỗi cảnh một album kèm lời đọc", async () => {
  const s = setup();
  const dir = path.join(s.repoRoot, "out", "tam", "storyboard", "a");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ name: "a", uocTinh: true, canh: [
    { canh: 1, template: "stat-hero", giay: "6.0", loi: "Lãi suất 8%", anh: ["x1.png", "x2.png", "x3.png"] },
    { canh: 2, template: "geo-map", giay: "9.0", loi: "Bản đồ", anh: null, ghiChu: "Cần Mapbox" },
  ] }));
  await s.bot.handleUpdate(msg("/storyboard a"));
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(s.execs.some((e) => e === "npm run storyboard -- a"), s.execs.join("|"));
  const album = s.videos.find((v) => v.files);
  assert.equal(album.files.length, 3);
  assert.match(album.caption, /Cảnh 1.*Lãi suất 8%/s);
  assert.ok(s.said.some((m) => /Cần Mapbox/.test(m.text)));
  assert.ok(s.said.some((m) => /ước tính/.test(m.text)));
});

test("/kiemgia → kiểm Master File theo CĐT, gửi kết quả (không lưu gì lên GitHub)", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/kiemgia"));
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(s.execs.some((e) => e === "npm run kiem-gia"), s.execs.join("|"));
  assert.ok(!s.execs.some((e) => e.startsWith("git commit")));
});
