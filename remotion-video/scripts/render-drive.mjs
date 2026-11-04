// Render video rồi chép bản hoàn chỉnh sang thư mục Drive (Google Drive for desktop).
// Chạy: npm run render:drive [-- <tên-file.mp4>]
// Thư mục đích: DRIVE_VIDEO_DIR trong .env, nếu không có thì tự tìm
// "<ổ>:\My Drive\Bcons - Dong bo thiet bi\video" trên các ổ đĩa.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

try {
  process.loadEnvFile(".env");
} catch {
  // không có .env thì dùng biến môi trường hiện có
}

const COMPOSITION = "BconsCentralPark";
const file = process.argv[2] ?? "bcons-central-park-elevenlabs.mp4";
const out = path.join("out", file);

function findDriveDir() {
  if (process.env.DRIVE_VIDEO_DIR) return process.env.DRIVE_VIDEO_DIR;
  for (const letter of "GHIJKLMNOPQRSTUVWXYZDEF") {
    const dir = `${letter}:\\My Drive\\Bcons - Dong bo thiet bi\\video`;
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

const target = findDriveDir();
if (!target || !fs.existsSync(target)) {
  console.error(
    "Không thấy thư mục Drive. Cài Google Drive for desktop hoặc đặt DRIVE_VIDEO_DIR trong .env.",
  );
  process.exit(1);
}

const render = spawnSync("npx", ["remotion", "render", COMPOSITION, out], {
  stdio: "inherit",
  shell: true,
});
if (render.status !== 0) process.exit(render.status ?? 1);

const dest = path.join(target, file);
fs.copyFileSync(out, dest);
console.log(`Đã chép lên Drive: ${dest}`);
