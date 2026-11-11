// Phiếu (Phieu) + template HTML → PNG rộng 1080 px (và PDF A4) bằng Chrome headless dòng lệnh, không thêm thư viện.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const run = promisify(execFile);
const REMOTION = fileURLToPath(new URL("../../remotion/", import.meta.url));
const require = createRequire(new URL("../../remotion/package.json", import.meta.url));
const MARKER = "__PHIEU_DATA__";
export const MAU = fileURLToPath(new URL("./mau/phieu.html", import.meta.url));
const CAO_TOI_DA = 1800;

/** Thay marker bằng JSON dữ liệu phiếu (thoát </script> và <!--); template phải chứa marker đúng một lần. */
export function dungHtml(template, phieu) {
  if (template.split(MARKER).length !== 2) throw new Error(`Template phải có đúng một chuỗi ${MARKER}`);
  const json = JSON.stringify(phieu).replace(/</g, "\\u003c");
  return template.replace(MARKER, () => json);
}

/** Thêm mã QR (SVG) về landing vào phiếu; phiếu không đổi nếu không có đường dẫn. */
export async function themQr(phieu) {
  if (!phieu.lienHe?.qrLink) return phieu;
  const svg = await require("qrcode").toString(phieu.lienHe.qrLink, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#00000000" } });
  return { ...phieu, lienHe: { ...phieu.lienHe, qrSvg: svg } };
}

/** Chrome headless shell: tham số → REMOTION_BROWSER → bản Remotion đã tải (máy anh) → bản Playwright (cloud); null nếu không có. Chrome đầy đủ không dùng được ở chế độ dòng lệnh trên cloud (treo). */
export function timChrome(browser) {
  const ung = [browser, process.env.REMOTION_BROWSER];
  const rem = path.join(REMOTION, "node_modules", ".remotion", "chrome-headless-shell");
  if (fs.existsSync(rem)) {
    const tim = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tim(path.join(dir, e.name)) : /^chrome-headless-shell(\.exe)?$/.test(e.name) ? [path.join(dir, e.name)] : []));
    ung.push(...tim(rem));
  }
  const pw = "/opt/pw-browsers";
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw).filter((n) => n.startsWith("chromium_headless_shell"))) ung.push(path.join(pw, d, "chrome-headless-shell-linux64", "chrome-headless-shell"));
  return ung.find((p) => p && fs.existsSync(p)) ?? null;
}

const CO_BAN = ["--disable-gpu", "--hide-scrollbars", "--no-sandbox", "--virtual-time-budget=8000"];

/** html: nội dung đã dựng. Trả {png, pdf?, cao (px @2x), canhBao?}. Cao tối đa 1.800 px; vượt thì có canhBao (không cắt). */
export async function renderPhieu({ html, outDir, tenFile, pdf = false, browser }) {
  const chrome = timChrome(browser);
  if (!chrome) throw new Error("Chưa tìm thấy Chrome (đặt REMOTION_BROWSER hoặc chạy `npx remotion browser ensure`).");
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "phieu-"));
  try {
    const goc = path.join(tmp, "p.html");
    // đo chiều cao nội dung sau khi script của template chạy xong (chờ cờ data-ready)
    fs.writeFileSync(goc, html.replace("</body>", `<script>window.addEventListener("load",function(){document.title="CAO:"+Math.ceil(document.body.offsetHeight)});</script></body>`));
    const url = pathToFileURL(goc).href;
    const dom = (await run(chrome, [...CO_BAN, `--user-data-dir=${tmp}/u1`, "--dump-dom", url], { maxBuffer: 64 * 1024 * 1024 })).stdout;
    const cao1x = Number((dom.match(/<title>CAO:(\d+)<\/title>/) ?? [])[1]);
    if (!(cao1x > 0)) throw new Error("Không đo được chiều cao phiếu (template có chạy script không?)");
    const png = path.join(outDir, `${tenFile}.png`);
    await run(chrome, [...CO_BAN, `--user-data-dir=${tmp}/u2`, `--screenshot=${png}`, `--window-size=540,${cao1x}`, "--force-device-scale-factor=2", url]);
    const kq = { png, cao: cao1x * 2 };
    if (kq.cao > CAO_TOI_DA) kq.canhBao = `Phiếu cao ${kq.cao} px, quá ${CAO_TOI_DA} px: Zalo có thể cắt ảnh, nên gửi PDF hoặc chia đôi.`;
    if (pdf) {
      kq.pdf = path.join(outDir, `${tenFile}.pdf`);
      await run(chrome, [...CO_BAN, `--user-data-dir=${tmp}/u3`, `--print-to-pdf=${kq.pdf}`, "--no-pdf-header-footer", url]);
    }
    return kq;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
