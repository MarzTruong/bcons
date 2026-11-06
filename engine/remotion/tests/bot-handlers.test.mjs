import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBot } from "../scripts/bot/handlers.mjs";
import { buildClaudeArgs, parseClaudeOutput } from "../scripts/bot/claude-bridge.mjs";
import { parseCaption } from "../scripts/caption.mjs";

const CHAT = "42";
const msg = (text, id = 42) => ({ message: { chat: { id }, text } });

function setup({ claude, gitStatus = "" } = {}) {
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
  const tg = {
    sendMessage: async (_c, text, extra) => said.push({ text, extra }),
    sendVideo: async (_c, file, caption) => videos.push({ file, caption }),
    answerCallback: async () => {},
  };
  const exec = async (cmd, args) => {
    execs.push([cmd, ...args].join(" "));
    if (cmd === "git" && args[0] === "status") return { code: 0, out: gitStatus };
    if (cmd === "git" && args[0] === "diff") return { code: 0, out: "x\n" };
    if (cmd === "npm" && args.includes("render:drive")) fs.writeFileSync(path.join(outDir, `${args.at(-1)}.mp4`), "video");
    return { code: 0, out: "ok" };
  };
  const bot = createBot({
    tg, chatId: CHAT, projDir, outDir, repoRoot, remotionDir: repoRoot, exec,
    runClaude: claude ?? (async () => ({ text: "Xong.", sessionId: "abc-123", isError: false })),
    sendApproved: async (o) => sent.push(o),
    now: () => 1000,
  });
  return { bot, said, videos, execs, sent, projDir, outDir };
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
  await s.bot.handleUpdate({ callback_query: { id: "q", data, message: { chat: { id: 42 } } } });
  assert.ok(s.execs.some((e) => e === "npm run voice -- a"));
  await s.bot.handleUpdate(msg("/giong a"));
  const huy = s.said.at(-1).extra.reply_markup.inline_keyboard[0][1].callback_data;
  await s.bot.handleUpdate({ callback_query: { id: "q2", data: huy, message: { chat: { id: 42 } } } });
  assert.equal(s.execs.filter((e) => e.includes("voice")).length, 1);
});

test("cách B: tin tự do → Claude; có file đổi thì hỏi Lưu/Bỏ; giữ phiên", async () => {
  const calls = [];
  const s = setup({
    gitStatus: " M du-an/x/video/a/caption.md\n",
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
  await s.bot.handleUpdate({ callback_query: { id: "q", data: luu, message: { chat: { id: 42 } } } });
  assert.ok(s.execs.some((e) => e.startsWith("git commit -m Bot: rút gọn")));
  await s.bot.handleUpdate(msg("thêm hashtag"));
  assert.equal(calls[1].sessionId, "s-1");
});

test("buildClaudeArgs: không nhận chữ người dùng, cấm voice/render/push, kiểm session id", () => {
  const a = buildClaudeArgs({ sessionId: "3f2b9c1e-0a4d-4e8b-9f1a-2c3d4e5f6a7b" });
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
