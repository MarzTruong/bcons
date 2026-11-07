// Kiểm tra spec: đúng schema và mọi sourceId có trong bảng nguồn du-an/<mã>/video/<name>/kich-ban.md.
// Chạy: node scripts/check-spec.mjs <name>|--all [--du-an <mã>]
import fs from "node:fs";
import path from "node:path";
import { parseSpec } from "../src/spec.ts";
import { listVideos, takeProjectFlag, videoPaths } from "./project.mjs";
import { captionOptsFor, checkCaption, parseCaption } from "./caption.mjs";
import {
  checkCues,
  checkGeoFiles,
  checkShownSymbols,
  checkTimestamps,
  checkSourceLinks,
  checkSources,
  parseMarkup,
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
    const cueErrors = [...checkCues(spec), ...checkShownSymbols(spec)];
    if (cueErrors.length) throw new Error(cueErrors.join("; "));
    // Có giọng rồi: timestamps phải khớp lời đọc (sửa chữ hiển thị thì chạy npm run phu-de, không cần tạo giọng lại)
    const tsPath = videoPaths(name, projDir).timestamps;
    if (fs.existsSync(tsPath)) {
      const tsErr = checkTimestamps(spec, JSON.parse(fs.readFileSync(tsPath, "utf8")));
      if (tsErr.length) throw new Error(tsErr.join("; "));
      const ts = JSON.parse(fs.readFileSync(tsPath, "utf8"));
      spec.scenes.forEach((s, i) => {
        const shows = parseMarkup(s.markup).map((t) => t.show).join(" ");
        if (ts.scenes[i] && ts.scenes[i].words.map((w) => w.text).join(" ") !== shows) {
          throw new Error(`Cảnh ${s.id}: phụ đề trong timestamps khác chữ hiển thị trong spec. Chạy npm run phu-de -- ${name}`);
        }
      });
    }
    const geoErrors = checkGeoFiles(spec, projDir);
    if (geoErrors.length) throw new Error(geoErrors.join("; "));
    const links = checkSourceLinks(spec, md);
    if (!links.ok) {
      console.warn(`CẢNH BÁO ${name}: nguồn chưa có link http(s): ${links.unlinked.join(", ")} (tạo giọng/render sẽ bị chặn)`);
    }
    // Caption (nếu có): bản nháp có lỗi chỉ cảnh báo; bản đã duyệt có lỗi là lỗi.
    const capPath = videoPaths(name, projDir).caption;
    if (fs.existsSync(capPath)) {
      const cap = fs.readFileSync(capPath, "utf8");
      const capErrs = checkCaption(cap, captionOptsFor(capPath));
      if (capErrs.length) {
        if (parseCaption(cap).meta.status === "approved") throw new Error(`caption.md: ${capErrs.join("; ")}`);
        console.warn(`CẢNH BÁO ${name} caption.md: ${capErrs.join("; ")}`);
      }
    }
    console.log(`OK ${name} (${spec.status})`);
  } catch (e) {
    failed = true;
    console.error(`LỖI ${name}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
