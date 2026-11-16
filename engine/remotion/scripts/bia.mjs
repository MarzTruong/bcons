// Chụp ảnh bìa video 1080x1920 (khung 0 của video, AGY phương án 1) từ du-an/<mã>/video/<tên>/bia.json.
// Chạy: npm run bia -- <tên> [--du-an <mã>] [--ra <file.png>]   Mặc định ra out/bia/<tên>.png (cloud: REMOTION_BROWSER=/opt/pw-browsers/chromium).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSpec } from "../src/spec.ts";
import { readBia, checkBia } from "./bia-tools.mjs";
import { readProjectConfig, takeProjectFlag, videoPaths } from "./project.mjs";

export const biaPath = (name, projDir) => path.join(path.dirname(videoPaths(name, projDir).spec), "bia.json");

async function main() {
  const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
  const name = rest[0];
  if (!name) throw new Error("Thiếu tên video: npm run bia -- <tên>");
  const iRa = rest.indexOf("--ra");
  const file = biaPath(name, projDir);
  if (!fs.existsSync(file)) throw new Error(`Chưa có ${file}`);
  const bia = readBia(file);
  const vp = videoPaths(name, projDir);
  if (fs.existsSync(vp.spec)) {
    const errs = checkBia(bia, parseSpec(JSON.parse(fs.readFileSync(vp.spec, "utf8"))), projDir);
    if (errs.length) throw new Error(errs.join("\n"));
  } else if (!fs.existsSync(path.join(projDir, bia.anhNen))) {
    throw new Error(`bia: ảnh ${bia.anhNen}: không thấy file`);
  }
  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const out = path.resolve(iRa >= 0 ? rest[iRa + 1] : path.join("out", "bia", `${name}.png`));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: projDir });
  const inputProps = { bia, tenDuAn: readProjectConfig(projDir).ten };
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id: "BiaVideo", inputProps, browserExecutable });
  await renderStill({ composition, serveUrl, output: out, frame: 0, inputProps, browserExecutable });
  console.log(`Bìa ${name}: ${out}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
