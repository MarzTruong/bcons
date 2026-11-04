// Kiểm tra spec: đúng schema và mọi sourceId có trong bảng nguồn docs/video/<name>.md.
// Chạy: node scripts/check-spec.mjs <name>   |   node scripts/check-spec.mjs --all
import fs from "node:fs";
import path from "node:path";
import { parseSpec } from "../src/spec.ts";
import {
  DOCS_VIDEO_DIR,
  SPECS_DIR,
  checkCues,
  checkGeoFiles,
  checkSourceLinks,
  checkSources,
  resolveSpecPath,
} from "./spec-tools.mjs";

const PUBLIC_DIR = path.resolve(SPECS_DIR, "../public");
const arg = process.argv[2];
const names =
  arg === "--all"
    ? fs
        .readdirSync(SPECS_DIR)
        .filter((f) => f.endsWith(".json") && !f.endsWith(".timestamps.json"))
        .map((f) => f.replace(/\.json$/, ""))
    : [arg];

let failed = false;
for (const name of names) {
  try {
    const spec = parseSpec(JSON.parse(fs.readFileSync(resolveSpecPath(name), "utf8")));
    const mdPath = path.join(DOCS_VIDEO_DIR, `${name}.md`);
    const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : "";
    const { ok, missing } = checkSources(spec, md);
    if (!ok) throw new Error(`sourceId không có trong bảng nguồn ${mdPath}: ${missing.join(", ")}`);
    if (spec.name !== name) throw new Error(`spec.name "${spec.name}" khác tên file "${name}"`);
    const cueErrors = checkCues(spec);
    if (cueErrors.length) throw new Error(cueErrors.join("; "));
    const geoErrors = checkGeoFiles(spec, PUBLIC_DIR);
    if (geoErrors.length) throw new Error(geoErrors.join("; "));
    const links = checkSourceLinks(spec, md);
    if (!links.ok) {
      console.warn(`CẢNH BÁO ${name}: nguồn chưa có link http(s): ${links.unlinked.join(", ")} (tạo giọng/render sẽ bị chặn)`);
    }
    console.log(`OK ${name} (${spec.status})`);
  } catch (e) {
    failed = true;
    console.error(`LỖI ${name}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
