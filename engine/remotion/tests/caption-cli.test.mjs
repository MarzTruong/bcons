import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { approvalState, duyetCaption, duyetVideo, nowVN } from "../scripts/caption-cli.mjs";
import { parseCaption } from "../scripts/caption.mjs";

const CAP = "---\nstatus: draft\nkenh: [facebook, tiktok]\n---\n## Facebook\nHạ tầng Biên Hòa.\n\n## TikTok\nHạ tầng #bienhoa\n";

function setup(caption = CAP) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cap-"));
  const cap = path.join(dir, "caption.md");
  const mp4 = path.join(dir, "a.mp4");
  fs.writeFileSync(cap, caption);
  fs.writeFileSync(mp4, "video-1");
  return { cap, mp4 };
}

test("nowVN ra giờ Việt Nam dạng ISO +07:00", () => {
  assert.equal(nowVN(new Date("2026-11-07T02:30:00Z")), "2026-11-07T09:30:00+07:00");
});

test("duyetCaption từ chối caption có lỗi (SĐT)", () => {
  const { cap } = setup(CAP.replace("Hạ tầng Biên Hòa.", "Gọi 0905 935 935"));
  assert.throws(() => duyetCaption(cap), /số điện thoại/);
  assert.equal(parseCaption(fs.readFileSync(cap, "utf8")).meta.status, "draft");
});

test("duyệt caption rồi video: approvalState ok", () => {
  const { cap, mp4 } = setup();
  assert.equal(approvalState(fs.readFileSync(cap, "utf8"), mp4).reason, "caption chưa duyệt");
  duyetCaption(cap, new Date("2026-11-07T02:30:00Z"));
  const meta = parseCaption(fs.readFileSync(cap, "utf8")).meta;
  assert.equal(meta.status, "approved");
  assert.equal(meta.duyetLuc, "2026-11-07T09:30:00+07:00");
  assert.equal(approvalState(fs.readFileSync(cap, "utf8"), mp4).reason, "video chưa duyệt");
  duyetVideo(cap, mp4);
  assert.deepEqual(approvalState(fs.readFileSync(cap, "utf8"), mp4), { ok: true, reason: "" });
  // bài không có video (bài công ty): chỉ cần caption
  assert.equal(approvalState(fs.readFileSync(cap, "utf8"), null).ok, true);
});

test("sửa caption sau khi duyệt, hoặc render lại video, thì phải duyệt lại", () => {
  const { cap, mp4 } = setup();
  duyetCaption(cap);
  duyetVideo(cap, mp4);
  fs.writeFileSync(mp4, "video-2");
  assert.equal(approvalState(fs.readFileSync(cap, "utf8"), mp4).reason, "video đã render lại sau khi duyệt");
  fs.writeFileSync(mp4, "video-1");
  fs.writeFileSync(cap, fs.readFileSync(cap, "utf8").replace("Hạ tầng Biên Hòa.", "Hạ tầng Biên Hòa, thêm một câu."));
  assert.equal(approvalState(fs.readFileSync(cap, "utf8"), mp4).reason, "caption đổi sau khi duyệt");
});

test("duyetVideo từ chối khi caption chưa duyệt hoặc thiếu mp4", () => {
  const { cap, mp4 } = setup();
  assert.throws(() => duyetVideo(cap, mp4), /chưa duyệt caption/);
  duyetCaption(cap);
  assert.throws(() => duyetVideo(cap, mp4 + ".khong-co"), /Không thấy video/);
});

test("checkVideoFiles: kiểm cả video/<tên>/zalo.md (nếu có) theo quy tắc cứng; không có zalo.md thì chỉ kiểm caption.md", async () => {
  const { checkVideoFiles } = await import("../scripts/caption-cli.mjs");
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), "zl-"));
  const dir = path.join(projDir, "video", "a");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "caption.md"), CAP);
  assert.deepEqual(checkVideoFiles("a", projDir).map((r) => path.basename(r.file)), ["caption.md"]);
  const zalo = (body) => `---\nstatus: draft\nkenh: [zalo]\n---\n## Zalo\n${body}\n`;
  fs.writeFileSync(path.join(dir, "zalo.md"), zalo("Gọi 0905 935 935 nha anh chị"));
  const r = checkVideoFiles("a", projDir);
  assert.deepEqual(r.map((x) => path.basename(x.file)), ["caption.md", "zalo.md"]);
  assert.deepEqual(r[0].errs, []);
  assert.ok(r[1].errs.some((e) => /số điện thoại/.test(e)));
  fs.writeFileSync(path.join(dir, "zalo.md"), zalo("Đợt 2 giới thiệu ngày 29/11, nhắn em đặt lịch xem nhà mẫu nha."));
  assert.deepEqual(checkVideoFiles("a", projDir)[1].errs, []);
});

test("checkVideoFiles: kiểm cả caption-icon.md (quy tắc cứng + giới hạn icon)", async () => {
  const { checkVideoFiles } = await import("../scripts/caption-cli.mjs");
  const projDir = fs.mkdtempSync(path.join(os.tmpdir(), "ic-"));
  const dir = path.join(projDir, "video", "a");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "caption.md"), CAP);
  const icon = (fb) => `---\nstatus: draft\nkenh: [facebook, tiktok]\n---\n## Facebook\n${fb}\n\n## TikTok\nx\n`;
  fs.writeFileSync(path.join(dir, "caption-icon.md"), icon("Hạ tầng 🏠 gần chợ 🔥 và 📍 trường 🌿 cùng 💬 nữa 🚗"));
  const r = checkVideoFiles("a", projDir);
  assert.deepEqual(r.map((x) => path.basename(x.file)), ["caption.md", "caption-icon.md"]);
  assert.ok(r[1].errs.some((e) => /tối đa 4|🔥/.test(e)));
  fs.writeFileSync(path.join(dir, "caption-icon.md"), icon("Hạ tầng Biên Hòa 🏠 đang đổi khác."));
  assert.deepEqual(checkVideoFiles("a", projDir)[1].errs, []);
});
