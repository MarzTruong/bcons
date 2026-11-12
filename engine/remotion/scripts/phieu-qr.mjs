// Lưu sẵn mã QR của từng dự án vào du-an/<mã>/landing/phieu-qr.json (build trên Cloudflare không có thư viện dựng QR).
// Chạy lại khi đổi `watermark.link` trong project.json, rồi commit file này.
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./project.mjs";
import { qrSvgSync } from "../../landing/phieu/render.mjs";

for (const ma of fs.readdirSync(path.join(REPO_ROOT, "du-an")).filter((d) => !d.startsWith("_"))) {
  const proj = path.join(REPO_ROOT, "du-an", ma);
  const cfg = JSON.parse(fs.readFileSync(path.join(proj, "project.json"), "utf8"));
  const link = cfg.watermark?.link;
  if (!link || !fs.existsSync(path.join(proj, "landing"))) continue;
  fs.writeFileSync(path.join(proj, "landing", "phieu-qr.json"), JSON.stringify({ link, svg: qrSvgSync(link) }) + "\n");
  console.log(`${ma}: đã lưu QR cho ${link}`);
}
