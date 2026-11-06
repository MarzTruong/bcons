// Tạo dự án mới từ du-an/_mau/.
// Chạy ở gốc repo: node engine/automation/tao-du-an.mjs <mã> ["Tên dự án"]
// Không đổi config.json (đổi dự án đang bán là việc anh quyết định).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Chép du-an/_mau → du-an/<ma>, điền "ma" (và "ten" nếu có) vào project.json. Trả thư mục mới. */
export function taoDuAn(ma, { ten = "", root = process.cwd() } = {}) {
  if (!/^[a-z0-9-]+$/.test(ma ?? "")) throw new Error(`Mã dự án "${ma}" không hợp lệ (chỉ a-z, 0-9, gạch ngang; vd. bcons-solary)`);
  const src = path.join(root, "du-an", "_mau");
  const dst = path.join(root, "du-an", ma);
  if (!fs.existsSync(src)) throw new Error(`Không thấy ${src}`);
  if (fs.existsSync(dst)) throw new Error(`du-an/${ma} đã có, không ghi đè`);
  fs.cpSync(src, dst, { recursive: true });
  fs.rmSync(path.join(dst, "README.md"), { force: true });
  const pj = path.join(dst, "project.json");
  const cfg = JSON.parse(fs.readFileSync(pj, "utf8"));
  cfg.ma = ma;
  if (ten) cfg.ten = ten;
  fs.writeFileSync(pj, JSON.stringify(cfg, null, 2) + "\n");
  if (ten) {
    const tt = path.join(dst, "thong-tin.md");
    fs.writeFileSync(tt, fs.readFileSync(tt, "utf8").replace("<Tên dự án>", ten));
  }
  return dst;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [ma, ten] = process.argv.slice(2);
  const dir = taoDuAn(ma, { ten });
  console.log(`Đã tạo ${path.relative(process.cwd(), dir)}. Điền project.json và thong-tin.md; đổi config.json khi chuyển sang bán dự án này.`);
}
