// Chép ảnh bìa video lên Drive: "<Drive>/video/<mã>/bia/<tên>.png", cạnh file mp4 của dự án.
// render-drive gọi sau khi chép mp4; bot đọc trạng thái "bìa đã chép" cho thẻ /video.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { biaPath } from "./bia.mjs";
import { driveVideoDir, videoPaths } from "./project.mjs";

const mtime = (f) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0);

/** Đường dẫn ảnh bìa trên Drive, hoặc null nếu máy không có Drive. */
export function biaDrivePath(name, projDir, opts = {}) {
  const dir = driveVideoDir(path.basename(projDir), opts);
  return dir ? path.join(dir, "bia", `${name}.png`) : null;
}

/** Ảnh bìa trong out/ cần chụp lại khi chưa có hoặc cũ hơn spec.json / bia.json. */
export function canChupBia(png, name, projDir) {
  if (!fs.existsSync(png)) return true;
  const t = mtime(png);
  return t < mtime(biaPath(name, projDir)) || t < mtime(videoPaths(name, projDir).spec);
}

/**
 * Chép bìa lên Drive. `chupBia(png)` chụp ảnh khi cần (mặc định chạy scripts/bia.mjs).
 * Trả { trangThai: "da-chep" | "khong-co-bia" | "khong-co-drive", dest? }.
 */
export function chepBiaLenDrive({ name, projDir, outDir = path.join("out", "bia"), opts = {}, chupBia }) {
  if (!fs.existsSync(biaPath(name, projDir))) return { trangThai: "khong-co-bia" };
  const dest = biaDrivePath(name, projDir, opts);
  const goc = driveVideoDir(path.basename(projDir), opts);
  if (!dest || !goc || !fs.existsSync(path.dirname(goc))) return { trangThai: "khong-co-drive" };
  const png = path.join(outDir, `${name}.png`);
  if (canChupBia(png, name, projDir)) (chupBia ?? chupBiaMacDinh)(png, name, projDir);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(png, dest);
  return { trangThai: "da-chep", dest };
}

function chupBiaMacDinh(png, name, projDir) {
  const r = spawnSync("node", ["scripts/bia.mjs", name, "--du-an", path.basename(projDir), "--ra", png], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`Không chụp được bìa ${name}.`);
}

/** Trạng thái cho thẻ /video: bìa trên Drive có và mới hơn bia.json + spec.json thì "đã chép". */
export function trangThaiBia(name, projDir, opts = {}) {
  const bia = biaPath(name, projDir);
  if (!fs.existsSync(bia)) return "không có";
  const dest = biaDrivePath(name, projDir, opts);
  if (!dest || !fs.existsSync(dest)) return "chưa chép";
  return mtime(dest) >= Math.max(mtime(bia), mtime(videoPaths(name, projDir).spec)) ? "đã chép" : "cũ, cần chép lại";
}
