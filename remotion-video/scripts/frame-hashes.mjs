// In sha256 của mọi PNG trong một thư mục, dùng để so khung hình trước/sau refactor.
// Chạy: node scripts/frame-hashes.mjs <thư-mục>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = process.argv[2];
if (!dir) throw new Error("Thiếu thư mục");
const out = {};
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".png")).sort()) {
  out[f] = crypto.createHash("sha256").update(fs.readFileSync(path.join(dir, f))).digest("hex");
}
console.log(JSON.stringify(out, null, 2));
