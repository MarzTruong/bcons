// Xuất trang phieu.html (+ phieu-web.js, phieu-core.js, phieu-trang.js) vào thư mục landing đã dựng.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAU, dungHtml } from "./render.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** out: thư mục landing đã dựng (đã có calc.js). D: kết quả duLieuTrang. template: đường dẫn template (mặc định bản hiện hành). */
export function xuatTrangPhieu(out, D, template = MAU) {
  const doc = (f) => fs.readFileSync(path.join(HERE, f), "utf8");
  fs.writeFileSync(path.join(out, "phieu-core.js"), doc("phieu-core.mjs").replace('"../calc.mjs"', '"./calc.js"'));
  fs.writeFileSync(path.join(out, "phieu-web.js"), doc("phieu-web.mjs").replace('"./phieu-core.mjs"', '"./phieu-core.js"'));
  fs.copyFileSync(path.join(HERE, "phieu-trang.js"), path.join(out, "phieu-trang.js"));
  const duLieu = JSON.stringify(D).replace(/</g, "\\u003c");
  const them = `<div id="luu-anh-spacer" class="no-print" style="height:96px"></div><div id="luu-anh-bar" style="position:fixed;left:0;right:0;bottom:0;padding:10px;background:#fff;border-top:1px solid #ddd;text-align:center" class="no-print"><button id="luu-anh" hidden style="font:600 16px system-ui;padding:12px 22px">Lưu ảnh phiếu</button><div id="luu-anh-loi" style="font:14px system-ui;color:#b42318"></div></div>
<script type="application/json" id="phieu-du-lieu">${duLieu}</script>
<script type="module" src="phieu-trang.js"></script>
<style>@media print{.no-print{display:none}}body{width:auto!important;max-width:540px;margin:0 auto}</style>`;
  const html = dungHtml(fs.readFileSync(template, "utf8"), null).replace("</body>", () => them + "\n</body>").replace("<head>", '<head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">');
  fs.writeFileSync(path.join(out, "phieu.html"), html);
}
