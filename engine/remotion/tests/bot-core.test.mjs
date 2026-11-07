import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { formatList, isAuthorized, parseCommand, videoStatus } from "../scripts/bot/core.mjs";
import { duyetCaption, duyetVideo } from "../scripts/caption-cli.mjs";

test("parseCommand: lệnh, tham số, bỏ @tênbot, tin tự do", () => {
  assert.deepEqual(parseCommand("/duyet ha-tang-bien-hoa-2026"), { cmd: "duyet", args: ["ha-tang-bien-hoa-2026"] });
  assert.deepEqual(parseCommand("/danhsach@bcons_dangbai_bot"), { cmd: "danhsach", args: [] });
  assert.deepEqual(parseCommand("  /XEM  abc  "), { cmd: "xem", args: ["abc"] });
  assert.deepEqual(parseCommand("làm video về lãi suất"), { cmd: null, text: "làm video về lãi suất" });
  assert.deepEqual(parseCommand(""), { cmd: null, text: "" });
});

test("isAuthorized: chỉ chính anh trong chat riêng, cả tin nhắn lẫn nút bấm; không nhận nhóm", () => {
  const priv = { id: 42, type: "private" };
  assert.equal(isAuthorized({ message: { chat: priv, from: { id: 42 }, text: "hi" } }, "42"), true);
  assert.equal(isAuthorized({ message: { chat: { id: 7, type: "private" }, from: { id: 7 }, text: "hi" } }, "42"), false);
  assert.equal(isAuthorized({ message: { chat: { id: 42, type: "group" }, from: { id: 42 } } }, "42"), false);
  assert.equal(isAuthorized({ message: { chat: { id: 42, type: "group" }, from: { id: 9 } } }, "42"), false);
  assert.equal(isAuthorized({ callback_query: { message: { chat: priv }, from: { id: 42 } } }, "42"), true);
  assert.equal(isAuthorized({ callback_query: { message: { chat: priv }, from: { id: 9 } } }, "42"), false);
  assert.equal(isAuthorized({ message: { chat: priv, from: { id: 42 } } }, ""), false);
});

function project() {
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), "botp-"));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "boto-"));
  const mk = (name, caption) => {
    fs.mkdirSync(path.join(projDir, "video", name), { recursive: true });
    fs.writeFileSync(path.join(projDir, "video", name, "spec.json"), "{}");
    if (caption) fs.writeFileSync(path.join(projDir, "video", name, "caption.md"), caption);
  };
  const cap = "---\nstatus: draft\nkenh: [facebook, tiktok]\n---\n## Facebook\nA\n\n## TikTok\nB\n";
  mk("a-nhap", cap);
  mk("b-khong-caption");
  mk("c-xong", cap);
  fs.writeFileSync(path.join(outDir, "c-xong.mp4"), "v");
  const c = path.join(projDir, "video", "c-xong", "caption.md");
  duyetCaption(c);
  duyetVideo(c, path.join(outDir, "c-xong.mp4"));
  return { projDir, outDir };
}

test("videoStatus và formatList phản ánh trạng thái từng video", () => {
  const { projDir, outDir } = project();
  assert.deepEqual(videoStatus("a-nhap", projDir, outDir), { name: "a-nhap", caption: "nháp", mp4: false, video: "chưa duyệt" });
  assert.equal(videoStatus("b-khong-caption", projDir, outDir).caption, "chưa có");
  assert.deepEqual(videoStatus("c-xong", projDir, outDir), { name: "c-xong", caption: "đã duyệt", mp4: true, video: "đã duyệt" });
  fs.writeFileSync(path.join(outDir, "c-xong.mp4"), "khac");
  assert.equal(videoStatus("c-xong", projDir, outDir).video, "render lại, cần duyệt lại");
  const text = formatList(projDir, outDir);
  assert.match(text, /a-nhap/);
  assert.match(text, /b-khong-caption/);
  assert.match(text, /c-xong/);
});

test("xung đột 409: bot vừa mở (dưới 2 phút) thì thoát; bot đã chạy lâu thì giữ, chờ bot kia thoát", async () => {
  const { onConflict } = await import("../scripts/bot/core.mjs");
  const t0 = 1_000_000;
  assert.equal(onConflict(t0, t0 + 30_000), "thoat");
  assert.equal(onConflict(t0, t0 + 3 * 60_000), "cho");
});
