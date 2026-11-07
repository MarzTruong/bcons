// Storyboard CÓ HÌNH trước khi tạo giọng (cổng 2): chụp 3 khung mỗi cảnh (bot gửi thành album từng cảnh).
// Chưa có giọng: dùng thời lượng ước tính từ lời đọc (estimateTimestamps), không tốn credit.
// Chạy: npm run storyboard -- <tên>   (bot: /storyboard <tên>). Kết quả: out/tam/storyboard/<tên>/canh-<n>-<k>.png + manifest.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FPS, LEAD, TAIL, buildTiming } from "../src/timing.ts";
import { parseSpec } from "../src/spec.ts";
import { applyWatermark, checkCues, checkGeoFiles, checkTimestamps, estimateTimestamps, parseMarkup } from "./spec-tools.mjs";
import { readProjectConfig, takeProjectFlag, videoPaths } from "./project.mjs";
import { loadMapboxEnv } from "./env.mjs";

/** 3 khung mỗi cảnh: vừa vào (sau hiệu ứng mở), giữa lời đọc, gần cuối lời. */
export function storyboardFrames(ts) {
  const { SCENE_DATA, SCENE_STARTS } = buildTiming(ts);
  return SCENE_DATA.map((s, i) => {
    const a = SCENE_STARTS[i] + LEAD + 15;
    const end = SCENE_STARTS[i] + LEAD + s.audioFrames + Math.floor(TAIL / 2);
    const mid = Math.round((a + end) / 2);
    return { id: s.id, frames: [Math.min(a, mid - 1), mid, Math.max(end, mid + 1)] };
  });
}

async function main() {
  const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
  const name = rest[0];
  const vp = videoPaths(name, projDir);
  const spec = parseSpec(JSON.parse(fs.readFileSync(vp.spec, "utf8")));
  const errs = [...checkCues(spec), ...checkGeoFiles(spec, projDir)];
  if (errs.length) throw new Error(errs.join("\n"));
  let ts = fs.existsSync(vp.timestamps) ? JSON.parse(fs.readFileSync(vp.timestamps, "utf8")) : null;
  const uocTinh = !ts || checkTimestamps(spec, ts).length > 0;
  if (uocTinh) ts = estimateTimestamps(spec);

  try {
    process.loadEnvFile(".env");
  } catch {
    // cloud: không có .env
  }
  const hasMap = spec.scenes.some((s) => s.template === "geo-map");
  let mapOk = true;
  if (hasMap) {
    try {
      loadMapboxEnv();
    } catch {
      mapOk = false;
    }
  }

  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const outDir = path.join("out", "tam", "storyboard", name);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: projDir });
  const inputProps = { spec: applyWatermark(spec, readProjectConfig(projDir)), timestamps: ts, khongGiong: true };
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id: "BconsCentralPark", inputProps, browserExecutable });
  const plan = storyboardFrames(ts);
  const manifest = [];
  for (const [i, sc] of plan.entries()) {
    const scene = spec.scenes[i];
    const loi = parseMarkup(scene.markup).map((t) => t.show).join(" ");
    const giay = ts.scenes[i].durationSec.toFixed(1);
    if (scene.template === "geo-map" && !mapOk) {
      manifest.push({ canh: i + 1, id: scene.id, template: scene.template, giay, loi, anh: null, ghiChu: "Cần Mapbox (chụp trên máy anh)" });
      continue;
    }
    const pngs = [];
    for (const [k, frame] of sc.frames.entries()) {
      const out = path.join(outDir, `canh-${i + 1}-${k + 1}.png`);
      await renderStill({ composition, serveUrl, output: out, frame, inputProps, browserExecutable, scale: 0.5, chromiumOptions: hasMap ? { gl: "angle" } : {} });
      pngs.push(out);
    }
    manifest.push({ canh: i + 1, id: scene.id, template: scene.template, giay, loi, anh: pngs });
  }
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ name, uocTinh, canh: manifest }, null, 2));
  console.log(`Storyboard ${name}${uocTinh ? " (thời lượng ước tính, chưa có giọng)" : ""}:`);
  for (const m of manifest) console.log(`Cảnh ${m.canh} (${m.template}, ~${m.giay}s): ${m.anh ? m.anh.length + " ảnh" : m.ghiChu}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
