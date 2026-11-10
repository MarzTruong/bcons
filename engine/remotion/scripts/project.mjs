// Nơi duy nhất biết đường dẫn dự án và video: du-an/<mã>/video/<tên>/...
// Mã dự án đang bán đọc từ config.json ở gốc repo; lệnh có thể ghi đè bằng --du-an <mã>.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NAME_RE = /^[a-z0-9-]+$/;

function findRepoRoot(start) {
  let dir = start;
  while (!fs.existsSync(path.join(dir, "CLAUDE.md"))) {
    const up = path.dirname(dir);
    if (up === dir) throw new Error("Không tìm thấy gốc repo (thư mục có CLAUDE.md)");
    dir = up;
  }
  return dir;
}

export const REPO_ROOT = findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));

// Tên thư mục Drive: "Bcons" (anh đổi 11/11/2026); tên cũ vẫn dò được cho máy chưa đồng bộ kịp.
const DRIVE_SUBS = ["My Drive\\Bcons", "My Drive\\Bcons - Dong bo thiet bi"];

/**
 * Thư mục Drive dùng chung giữa các máy ("Bcons"): video render, nhạc, bảng giá.
 * DRIVE_DIR trong .env nếu đặt; không thì dò các ổ (Drive for desktop thường là G:). Không có thì null.
 */
export function findDriveRoot({ env = process.env, exists = fs.existsSync } = {}) {
  if (env.DRIVE_DIR) return env.DRIVE_DIR;
  for (const letter of "GHIJKLMNOPQRSTUVWXYZDEF") {
    for (const sub of DRIVE_SUBS) {
      const dir = `${letter}:\\${sub}`;
      if (exists(dir)) return dir;
    }
  }
  return null;
}

/** Thư mục dùng chung `rel` (vd. "am-thanh/nhac", "data"): trên Drive nếu có, không thì trong repo. */
export function sharedDir(rel, opts = {}) {
  const root = findDriveRoot(opts);
  const parts = rel.split("/");
  return root ? path.join(root, ...parts) : path.join(REPO_ROOT, ...parts);
}

/** Kiểm tên video/mã dự án: chỉ a-z, 0-9, gạch ngang. */
export function assertName(value, what = "Tên video") {
  if (!NAME_RE.test(value ?? "")) {
    throw new Error(`${what} không hợp lệ: "${value}" (chỉ a-z, 0-9, dấu gạch ngang)`);
  }
  return value;
}

/** Mã dự án đang bán, từ config.json → duAnDangBan. */
export function readActiveProject(root = REPO_ROOT) {
  const file = path.join(root, "config.json");
  if (!fs.existsSync(file)) throw new Error(`Thiếu ${file} (cần { "duAnDangBan": "<mã>" })`);
  const ma = JSON.parse(fs.readFileSync(file, "utf8")).duAnDangBan;
  return assertName(ma, "Mã dự án trong config.json");
}

/** Thư mục du-an/<mã>, báo lỗi nếu không có. */
export function projectDir(ma, root = REPO_ROOT) {
  assertName(ma, "Mã dự án");
  const dir = path.join(root, "du-an", ma);
  if (!fs.existsSync(dir)) throw new Error(`Không thấy du-an/${ma} (${dir})`);
  return dir;
}

/** Đường dẫn các file của một video trong thư mục dự án. */
export function videoPaths(name, projDir) {
  assertName(name);
  const dir = path.join(projDir, "video", name);
  return {
    dir,
    spec: path.join(dir, "spec.json"),
    timestamps: path.join(dir, "timestamps.json"),
    sources: path.join(dir, "kich-ban.md"),
    storyboard: path.join(dir, "storyboard.md"),
    caption: path.join(dir, "caption.md"),
    zalo: path.join(dir, "zalo.md"),
    captionIcon: path.join(dir, "caption-icon.md"),
    audioDir: path.join(dir, "audio"),
  };
}

/** Tên các video có spec.json, sắp xếp. */
export function listVideos(projDir) {
  const root = path.join(projDir, "video");
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, "spec.json")))
    .map((d) => d.name)
    .sort();
}

/** Bóc "--du-an <mã>" khỏi argv; không có thì dùng dự án đang bán. */
export function takeProjectFlag(argv, root = REPO_ROOT) {
  const rest = [...argv];
  const i = rest.indexOf("--du-an");
  let ma;
  if (i >= 0) {
    ma = rest[i + 1];
    rest.splice(i, 2);
  } else {
    ma = readActiveProject(root);
  }
  return { ma, projDir: projectDir(ma, root), rest };
}

const REQUIRED = ["ma", "ten", "diaChi", "toaDo", "chuDauTu", "donViPhanPhoi", "soCan", "thongTin", "tuKhoaNghienCuu", "tenKenh"];

/** Đọc du-an/<mã>/project.json và kiểm đủ khóa bắt buộc. */
export function readProjectConfig(projDir) {
  const cfg = JSON.parse(fs.readFileSync(path.join(projDir, "project.json"), "utf8"));
  const missing = REQUIRED.filter((k) => !(k in cfg));
  if (missing.length) throw new Error(`project.json thiếu khóa: ${missing.join(", ")}`);
  return cfg;
}
