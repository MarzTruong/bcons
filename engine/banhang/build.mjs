// Xuất trang tĩnh công cụ bán hàng: engine/banhang/dist/<mã>/ (Cloudflare Pages: build "node engine/banhang/build.mjs", output "engine/banhang/dist/bcons-newsky").
// Không dùng npm install. Trang KHÔNG chứa giá hay tình trạng căn: giỏ hàng đến từ Apps Script qua khóa (nguon.mjs).
// `giohang-mau.json` (mô phỏng, chỉ để xem thử ở #demo) là dữ liệu duy nhất đi kèm.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { planFromJson, loadCdt } from "../landing/plans-json.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const PTTT = ["09", "08", "10"]; // thứ tự hiện của giao diện
const MAT_BANG = ["2", "3", "4", "5-9", "10", "11", "12-29", "19", "20"];

const cp = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); };
const walk = (d, base = d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name), base) : [path.relative(base, path.join(d, e.name)).split(path.sep).join("/")]));

/** Dựng vào outDir; trả về thư mục. */
export function buildBanHang(projDir, outDir) {
  const ma = path.basename(projDir);
  const dir = path.join(outDir, ma);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const proj = JSON.parse(fs.readFileSync(path.join(projDir, "project.json"), "utf8"));
  const bh = path.join(projDir, "ban-hang");
  const web = path.join(HERE, "web");

  // Trang + mã
  cp(path.join(web, "index.template.html"), path.join(dir, "index.html"));
  for (const f of ["app.js", "main.js", "nguon.mjs", "manifest.webmanifest"]) cp(path.join(web, f), path.join(dir, f));
  // Lõi dùng chung với test: cùng file, không bản sao (nhập tương đối ../landing/calc.mjs đã được thay bằng ./calc.mjs)
  cp(path.join(ROOT, "engine/landing/calc.mjs"), path.join(dir, "core/calc.mjs"));
  cp(path.join(HERE, "giohang.mjs"), path.join(dir, "core/giohang.mjs"));
  fs.writeFileSync(
    path.join(dir, "core/tai-chinh.mjs"),
    fs.readFileSync(path.join(HERE, "tai-chinh.mjs"), "utf8").replace('"../landing/calc.mjs"', '"./calc.mjs"'),
  );

  // Lịch đợt (không phải giá), liên hệ + QR
  const cdt = loadCdt(projDir);
  const plans = Object.fromEntries(PTTT.map((k) => [k, planFromJson(cdt, k)]));
  fs.writeFileSync(path.join(dir, "plans.json"), JSON.stringify(plans));
  const qr = JSON.parse(fs.readFileSync(path.join(projDir, "landing", "phieu-qr.json"), "utf8"));
  fs.writeFileSync(path.join(dir, "lien-he.json"), JSON.stringify({ ten: proj.lienHe?.ten ?? "", sdtHienThi: proj.lienHe?.sdtHienThi ?? "", qrLink: qr.link, qrSvg: qr.svg }));

  // Ảnh mặt bằng CĐT (đã nén) và icon
  for (const m of MAT_BANG) {
    const tuLanding = path.join(projDir, "landing", "assets", `mbt-b-${m}.jpg`);
    const tuBanHang = path.join(bh, "mat-bang", `mbt-b-${m}.jpg`);
    const src = fs.existsSync(tuBanHang) ? tuBanHang : tuLanding;
    if (!fs.existsSync(src)) throw new Error(`Thiếu ảnh mặt bằng mbt-b-${m}.jpg (landing/assets hoặc ban-hang/mat-bang)`);
    cp(src, path.join(dir, "mat-bang", `mbt-b-${m}.jpg`));
  }
  for (const f of ["icon-192.png", "icon-512.png"]) cp(path.join(bh, f), path.join(dir, f));
  cp(path.join(projDir, "ban-hang-mau", "giohang-mau.json"), path.join(dir, "giohang-mau.json"));

  // Không cho máy tìm kiếm lập chỉ mục
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *\nDisallow: /\n");
  fs.writeFileSync(path.join(dir, "_headers"), "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Referrer-Policy: no-referrer\n/sw.js\n  Cache-Control: no-cache\n");

  // Service worker: tải trước toàn bộ file trang (không gồm ảnh lớn thì vẫn lưu khi mở lần đầu)
  const files = walk(dir).filter((f) => f !== "sw.js" && f !== "_headers");
  const phienBan = crypto.createHash("sha1").update(files.map((f) => f + fs.statSync(path.join(dir, f)).size).join("|") + files.filter((f) => /\.(m?js|html|json)$/.test(f)).map((f) => fs.readFileSync(path.join(dir, f))).join("")).digest("hex").slice(0, 10);
  const taiTruoc = ["./", ...files.filter((f) => !f.startsWith("mat-bang/") && f !== "robots.txt")];
  fs.writeFileSync(
    path.join(dir, "sw.js"),
    fs.readFileSync(path.join(web, "sw.template.js"), "utf8").replace("__PHIEN_BAN__", phienBan).replace("__TAI_TRUOC__", JSON.stringify(taiTruoc)),
  );
  return dir;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const only = process.argv.includes("--du-an") ? process.argv[process.argv.indexOf("--du-an") + 1] : null;
  const duAn = fs.readdirSync(path.join(ROOT, "du-an")).filter((d) => fs.existsSync(path.join(ROOT, "du-an", d, "ban-hang", "icon-192.png")) && (!only || d === only));
  if (!duAn.length) throw new Error("Không có dự án nào có thư mục ban-hang/");
  for (const m of duAn) console.log("Đã xuất", buildBanHang(path.join(ROOT, "du-an", m), path.join(HERE, "dist")));
}
