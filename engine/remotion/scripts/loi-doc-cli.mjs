// Xem trước lời đọc của một video (không gọi mạng, không tốn credit).
// Chạy: node scripts/loi-doc-cli.mjs <tên-video> [--canh=scene3] [--du-an <mã>]
import fs from "node:fs";
import { takeProjectFlag, videoPaths } from "./project.mjs";
import { parseCanh } from "./voice-tools.mjs";
import { xemTruocLoiDoc } from "./loi-doc.mjs";

const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
const name = rest.find((a) => !a.startsWith("--"));
if (!name) {
  console.error("Cú pháp: npm run loi-doc -- <tên-video> [--canh=scene3] [--du-an <mã>]");
  process.exit(1);
}
const ids = parseCanh(rest.find((a) => a.startsWith("--canh="))?.split("=")[1]);
const spec = JSON.parse(fs.readFileSync(videoPaths(name, projDir).spec, "utf8"));
console.log(xemTruocLoiDoc(spec, ids));
