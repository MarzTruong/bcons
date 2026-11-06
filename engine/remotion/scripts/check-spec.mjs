// Kiểm tra spec: đúng schema và mọi sourceId có trong bảng nguồn du-an/<mã>/video/<name>/kich-ban.md.
// Chạy: node scripts/check-spec.mjs <name>|--all [--du-an <mã>]
import fs from "node:fs";
import path from "node:path";
import { parseSpec } from "../src/spec.ts";
import { listVideos, takeProjectFlag, videoPaths } from "./project.mjs";
import {
  checkCues,
  checkGeoFiles,
  checkSourceLinks,
  checkSources,
  resolveSpecPath,
} from "./spec-tools.mjs";

const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
const arg = rest[0];
const names = arg === "--all" ? listVideos(projDir) : [arg];

let failed = false;
for (const name of names) {
  try {
    const spec = parseSpec(JSON.parse(fs.readFileSync(resolveSpecPath(name, projDir), "utf8")));
    const mdPath = videoPaths(name, projDir).sources;
    const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : "";
    const { ok, missing } = checkSources(spec, md);
    if (!ok) throw new Error(`sourceId không có trong bảng nguồn ${mdPath}: ${missing.join(", ")}`);
    if (spec.name !== name) throw new Error(`spec.name "${spec.name}" khác tên file "${name}"`);
    const cueErrors = checkCues(spec);
    if (cueErrors.length) throw new Error(cueErrors.join("; "));
    const geoErrors = checkGeoFiles(spec, projDir);
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
