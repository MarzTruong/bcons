import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildTelegramRequests, chunkText, sendApproved } from "../scripts/send-telegram.mjs";
import { duyetCaption, duyetVideo } from "../scripts/caption-cli.mjs";

const cap = (fb = "Bài FB", tt = "Caption TikTok #bienhoa") =>
  `---\nstatus: draft\nkenh: [facebook, tiktok]\n---\n## Facebook\n${fb}\n\n## TikTok\n${tt}\n`;

function setup(text = cap()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tg-"));
  const c = path.join(dir, "caption.md");
  const mp4 = path.join(dir, "a.mp4");
  fs.writeFileSync(c, text);
  fs.writeFileSync(mp4, "video");
  return { c, mp4 };
}
const ENV = { TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_CHAT_ID: "42" };

test("chunkText chia tin dài theo giới hạn, không mất chữ", () => {
  const parts = chunkText("a".repeat(5000), 4096);
  assert.equal(parts.length, 2);
  assert.equal(parts.join("").length, 5000);
});

test("buildTelegramRequests: sendVideo (caption ≤ 1.024) + sendMessage FB chia nhiều tin", () => {
  const { mp4 } = setup();
  const reqs = buildTelegramRequests({
    token: "123:abc",
    chatId: "42",
    mp4Path: mp4,
    caption: { tiktok: "t".repeat(2000), facebook: "f".repeat(5000) },
  });
  assert.equal(reqs.length, 3);
  assert.match(reqs[0].url, /^https:\/\/api\.telegram\.org\/bot123:abc\/sendVideo$/);
  assert.ok(reqs[0].body.get("caption").length <= 1024);
  assert.equal(reqs[0].body.get("chat_id"), "42");
  assert.ok(reqs.slice(1).every((r) => /\/sendMessage$/.test(r.url)));
});

function fakeFetch() {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ ok: true }) };
  };
  return { calls, fn };
}

test("không gọi mạng khi thiếu token, caption chưa duyệt, hoặc file > 50 MB", async () => {
  const { c, mp4 } = setup();
  const f = fakeFetch();
  await assert.rejects(sendApproved({ captionPath: c, mp4Path: mp4, env: {}, fetchFn: f.fn }), /TELEGRAM_BOT_TOKEN/);
  await assert.rejects(sendApproved({ captionPath: c, mp4Path: mp4, env: ENV, fetchFn: f.fn }), /caption chưa duyệt/);
  duyetCaption(c);
  duyetVideo(c, mp4);
  fs.truncateSync(mp4, 51 * 1024 * 1024);
  await assert.rejects(sendApproved({ captionPath: c, mp4Path: mp4, env: ENV, fetchFn: f.fn }), /render lại|50 MB/);
  assert.equal(f.calls.length, 0);
});

test("đã duyệt đủ thì gửi; bài công ty (không video) gửi tin chữ", async () => {
  const { c, mp4 } = setup();
  duyetCaption(c);
  duyetVideo(c, mp4);
  const f = fakeFetch();
  await sendApproved({ captionPath: c, mp4Path: mp4, env: ENV, fetchFn: f.fn });
  assert.equal(f.calls.length, 2);
  const g = setup();
  duyetCaption(g.c);
  const f2 = fakeFetch();
  await sendApproved({ captionPath: g.c, mp4Path: null, env: ENV, fetchFn: f2.fn });
  assert.ok(f2.calls.every((u) => /sendMessage$/.test(u)));
  assert.equal(f2.calls.length, 2);
});
