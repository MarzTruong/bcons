// Kiểm các trang landing ĐANG CHẠY trên mạng: bản có mới nhất không, file nào thiếu hoặc bị Cloudflare trả trang chủ giả, mã QR, form.
// Chạy: npm run kiem-mang [-- --cho]   (--cho: chờ tối đa 5 phút cho Cloudflare build xong). Cloud cần NODE_USE_ENV_PROXY=1.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { REPO_ROOT } from "./project.mjs";

const EXT_NOI_BO = /\.(?:jpe?g|png|webp|svg|js|mjs|css|pdf|json|html|ico)$/i;

/** Danh sách file nội bộ trang tham chiếu (src/href), bỏ link ngoài, tel:, mailto:, #neo. */
export function thamChieuTrang(html) {
  const out = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(?:https?:|\/\/|tel:|mailto:|#|data:)/i.test(u)) continue;
    const f = u.split(/[?#]/)[0];
    if (EXT_NOI_BO.test(f)) out.add(f);
  }
  return [...out];
}

/** Cloudflare trả trang chủ (text/html) cho file không có: file không phải .html mà nhận text/html là giả. */
export function laTrangChuGia(file, contentType) {
  return !/\.html?$/i.test(file) && /text\/html/i.test(contentType ?? "");
}

export function danhGiaPhienBan(tren, main) {
  if (!tren) return { ok: false, lyDo: "trang không có version.json (build cũ hoặc build lỗi)" };
  const ngan = Math.min(tren.length, main.length, 7);
  return tren.slice(0, ngan) === main.slice(0, ngan) ? { ok: true } : { ok: false, lyDo: `trang đang ở ${tren.slice(0, 7)}, main là ${main.slice(0, 7)}` };
}

async function lay(url, opt) {
  const r = await fetch(url, opt);
  return { status: r.status, type: r.headers.get("content-type") ?? "", loc: r.headers.get("location"), text: async () => r.text() };
}

export async function kiemMotTrang(goc, mainSha) {
  const loi = [];
  const ok = [];
  const base = goc.replace(/\/$/, "");
  let tren = null;
  try {
    const v = await lay(base + "/version.json");
    if (v.status === 200 && /json/.test(v.type)) tren = JSON.parse(await v.text()).commit;
  } catch {}
  const pb = danhGiaPhienBan(tren, mainSha);
  (pb.ok ? ok : loi).push(pb.ok ? `phiên bản ${tren.slice(0, 7)} = main` : `phiên bản: ${pb.lyDo}`);
  const trang = await lay(base + "/");
  if (trang.status !== 200) return { loi: [`trang chủ ${trang.status}`], ok };
  const html = await trang.text();
  const dsFile = new Set([...thamChieuTrang(html), "phieu.html", "phieu-core.js", "phieu-web.js", "phieu-trang.js", "calc.js", "chinh-sach.html"]);
  for (const f of dsFile) {
    const r = await lay(`${base}/${f}`);
    if (r.status !== 200) loi.push(`${f}: ${r.status}`);
    else if (laTrangChuGia(f, r.type)) loi.push(`${f}: không có trên mạng (Cloudflare trả trang chủ)`);
  }
  if (!loi.some((x) => /^(?:phieu|calc|client)/.test(x))) ok.push(`${dsFile.size} file tham chiếu đều có`);
  const ph = await (await lay(base + "/phieu.html")).text();
  if (!/id="phieu-du-lieu"/.test(ph)) loi.push("phieu.html không phải trang phiếu");
  const qr = await lay(base + "/qr", { redirect: "manual" });
  if (!(qr.status === 301 || qr.status === 302) || !/utm_source=qr/.test(qr.loc ?? "")) loi.push(`/qr không chuyển về trang chủ kèm nguồn qr (status ${qr.status})`);
  else ok.push("/qr chuyển đúng");
  return { loi, ok };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cho = process.argv.includes("--cho");
  let main;
  try {
    execFileSync("git", ["fetch", "-q", "origin", "main"], { cwd: REPO_ROOT, stdio: "ignore" });
    main = execFileSync("git", ["rev-parse", "origin/main"], { cwd: REPO_ROOT }).toString().trim();
  } catch {
    main = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT }).toString().trim();
  }
  const trang = [];
  for (const ma of fs.readdirSync(path.join(REPO_ROOT, "du-an")).filter((d) => !d.startsWith("_"))) {
    const f = path.join(REPO_ROOT, "du-an", ma, "project.json");
    const link = JSON.parse(fs.readFileSync(f, "utf8")).watermark?.link;
    if (link && fs.existsSync(path.join(REPO_ROOT, "du-an", ma, "landing"))) trang.push([ma, new URL(link).origin.toLowerCase()]);
  }
  let thua = 0;
  for (const [ma, goc] of trang) {
    let kq;
    for (let i = 0; i < (cho ? 25 : 1); i++) {
      kq = await kiemMotTrang(goc, main);
      if (!kq.loi.some((x) => /^phiên bản/.test(x))) break;
      await new Promise((r) => setTimeout(r, 12000));
    }
    console.log(`${kq.loi.length ? "LỖI" : "OK  "} ${ma} ${goc}`);
    for (const x of kq.ok) console.log(`   ✓ ${x}`);
    for (const x of kq.loi) console.log(`   ✗ ${x}`);
    thua += kq.loi.length;
  }
  process.exit(thua ? 1 : 0);
}
