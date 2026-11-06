import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { musicVolume, sfxEvents, MUSIC } from "../src/amThanh.ts";
import { buildTiming } from "../src/timing.ts";
import { pickMusic, prepareAudio, SFX_PROMPTS } from "../scripts/am-thanh.mjs";

const ts = {
  scenes: [
    { id: "s1", durationSec: 4, words: [{ text: "Biên", start: 0.5, end: 0.8 }, { text: "90%", start: 2, end: 2.5 }] },
    { id: "s2", durationSec: 3, words: [{ text: "Hai", start: 0.2, end: 0.6 }] },
    { id: "s3", durationSec: 2, words: [{ text: "Bcons", start: 0.1, end: 0.5 }] },
  ],
};
const timing = buildTiming(ts);
const spec = {
  scenes: [
    { id: "s1", template: "stat-hero", cues: { a: "Biên", b: "90%" } },
    { id: "s2", template: "data-cards", cues: { c: "Hai" } },
    { id: "s3", template: "project-close", cues: {} },
  ],
};

test("musicVolume: nhỏ khi có giọng, to hơn ở khoảng lặng, mở và kết nhỏ dần", () => {
  const { SCENE_STARTS, SCENE_DATA, TOTAL_FRAMES } = timing;
  const inVoice = SCENE_STARTS[0] + 12 + 30; // giữa lời cảnh 1
  const gap = SCENE_STARTS[1] - 5; // đuôi cảnh 1, chưa vào lời cảnh 2
  assert.ok(Math.abs(musicVolume(inVoice, timing) - MUSIC.duoiGiong) < 1e-6);
  assert.ok(musicVolume(gap, timing) > musicVolume(inVoice, timing));
  assert.ok(musicVolume(gap, timing) <= MUSIC.khoangLang + 1e-6);
  assert.equal(musicVolume(0, timing), 0);
  assert.ok(musicVolume(TOTAL_FRAMES - 1, timing) < 0.02);
  assert.ok(SCENE_DATA.length === 3);
  for (let f = 0; f < TOTAL_FRAMES; f += 7) {
    const v = musicVolume(f, timing);
    assert.ok(v >= 0 && v <= MUSIC.khoangLang + 1e-6, `khung ${f}: ${v}`);
  }
});

test("sfxEvents: vút khi chuyển cảnh, tách khi số/ý hiện (cue), dồn trước cảnh cuối; không trùng khung", () => {
  const ev = sfxEvents(spec, timing);
  const at = (name) => ev.filter((e) => e.name === name).map((e) => e.frame);
  assert.deepEqual(at("vut"), [timing.SCENE_STARTS[1], timing.SCENE_STARTS[2]]);
  assert.equal(at("tach").length, 3);
  assert.equal(at("don").length, 1);
  assert.ok(at("don")[0] < timing.SCENE_STARTS[2]);
  const keys = ev.map((e) => `${e.name}@${e.frame}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(ev.every((e) => e.frame >= 0));
});

test("pickMusic: theo spec nếu có file; không thì chọn cố định theo tên video; không có nhạc thì null", () => {
  const files = ["b.mp3", "a.mp3", "c.mp3"];
  assert.equal(pickMusic("x", files, "c.mp3"), "c.mp3");
  assert.equal(pickMusic("video-1", files), pickMusic("video-1", [...files].reverse()), "không phụ thuộc thứ tự file");
  assert.ok(files.includes(pickMusic("video-1", files)));
  assert.equal(pickMusic("x", [], "c.mp3"), null);
  assert.equal(pickMusic("x", files, "khong-co.mp3"), pickMusic("x", files));
});

test("prepareAudio: chép nhạc + hiệu ứng vào thư mục tạm của dự án, trả props; --khong-nhac thì bỏ nhạc", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "amthanh-"));
  const nhacDir = path.join(root, "am-thanh", "nhac");
  const sfxDir = path.join(root, "sfx");
  const projDir = path.join(root, "du-an", "p");
  fs.mkdirSync(nhacDir, { recursive: true });
  fs.mkdirSync(sfxDir, { recursive: true });
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(nhacDir, "piano.mp3"), "x");
  fs.writeFileSync(path.join(nhacDir, "ghi-chu.txt"), "x");
  fs.writeFileSync(path.join(sfxDir, "vut.mp3"), "x");
  const a = prepareAudio({ name: "v", projDir, nhacDir, sfxDir });
  assert.equal(a.nhac, ".am-thanh/nhac.mp3");
  assert.deepEqual(a.sfx, ["vut"]);
  assert.ok(fs.existsSync(path.join(projDir, ".am-thanh", "nhac.mp3")));
  assert.ok(fs.existsSync(path.join(projDir, ".am-thanh", "sfx", "vut.mp3")));
  assert.equal(prepareAudio({ name: "v", projDir, nhacDir, sfxDir, khongNhac: true }).nhac, null);
  assert.equal(prepareAudio({ name: "v", projDir, nhacDir: path.join(root, "khong"), sfxDir }).nhac, null);
});

test("SFX_PROMPTS: đủ 3 hiệu ứng dùng trong video, mỗi cái ngắn", () => {
  assert.deepEqual(Object.keys(SFX_PROMPTS).sort(), ["don", "tach", "vut"]);
  for (const p of Object.values(SFX_PROMPTS)) assert.ok(p.giay > 0 && p.giay <= 3 && p.text.length > 10);
});

test(".gitignore chặn nhạc tải về và thư mục âm thanh tạm của dự án", () => {
  const gi = fs.readFileSync(new URL("../../../.gitignore", import.meta.url), "utf8");
  assert.match(gi, /^\/am-thanh\/$/m);
  assert.match(gi, /^du-an\/\*\/\.am-thanh\/$/m);
});

test("taoSfx: không --dong-y thì từ chối, không gọi mạng; có thì tạo file còn thiếu, bỏ qua file đã có", async () => {
  const { taoSfx } = await import("../scripts/tao-sfx.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sfx-"));
  fs.writeFileSync(path.join(dir, "vut.mp3"), "co-roi");
  const calls = [];
  const fetchFn = async (url, opt) => {
    calls.push({ url, body: JSON.parse(opt.body), key: opt.headers["xi-api-key"] });
    return { ok: true, arrayBuffer: async () => new TextEncoder().encode("mp3").buffer };
  };
  await assert.rejects(taoSfx({ dongY: false, key: "k", dir, fetchFn }), /tốn credit/);
  assert.equal(calls.length, 0);
  await assert.rejects(taoSfx({ dongY: true, key: "", dir, fetchFn }), /ELEVENLABS_API_KEY/);
  const made = await taoSfx({ dongY: true, key: "k", dir, fetchFn });
  assert.deepEqual(made.sort(), ["don", "tach"]);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((c) => c.url.endsWith("/v1/sound-generation") && c.key === "k" && c.body.duration_seconds > 0));
  assert.equal(fs.readFileSync(path.join(dir, "vut.mp3"), "utf8"), "co-roi");
});
