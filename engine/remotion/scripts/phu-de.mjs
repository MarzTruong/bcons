// Đổi chữ hiện trong phụ đề (vd. "90 phần trăm" → "90%") cho video đã có giọng, KHÔNG tạo lại giọng.
// Dùng sau khi sửa markup mà lời đọc giữ nguyên: so với bản spec trong git (HEAD), cập nhật timestamps.json.
// Chạy: npm run phu-de -- <tên> | --all
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { relabelWords } from "./spec-tools.mjs";
import { REPO_ROOT, listVideos, takeProjectFlag, videoPaths } from "./project.mjs";

const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
const names = rest[0] === "--all" ? listVideos(projDir) : rest;
let bad = false;
for (const name of names) {
  const vp = videoPaths(name, projDir);
  if (!fs.existsSync(vp.timestamps)) continue;
  const rel = path.relative(REPO_ROOT, vp.spec).replaceAll("\\", "/");
  let old;
  try {
    old = JSON.parse(execFileSync("git", ["show", `HEAD:${rel}`], { cwd: REPO_ROOT, encoding: "utf8" }));
  } catch {
    continue;
  }
  const spec = JSON.parse(fs.readFileSync(vp.spec, "utf8"));
  const ts = JSON.parse(fs.readFileSync(vp.timestamps, "utf8"));
  let changed = 0;
  spec.scenes.forEach((scene, i) => {
    const oldScene = old.scenes[i];
    if (!oldScene || oldScene.markup === scene.markup) return;
    const r = relabelWords(scene.markup, oldScene.markup, ts.scenes[i].words);
    if (!r.ok) {
      console.error(`${name}/${scene.id}: ${r.reason}`);
      bad = true;
      return;
    }
    ts.scenes[i].words = r.words;
    changed++;
  });
  if (changed) {
    fs.writeFileSync(vp.timestamps, JSON.stringify(ts, null, 2));
    console.log(`${name}: cập nhật phụ đề ${changed} cảnh (giữ giọng cũ)`);
  }
}
process.exit(bad ? 1 : 0);
