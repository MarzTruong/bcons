// Render video rồi chép bản hoàn chỉnh sang thư mục Drive (Google Drive for desktop).
// Chạy: npm run render:drive -- <tên-video> [tên-file.mp4]
// Chỉ render khi spec "approved" và mọi sourceId có trong bảng nguồn.
// Thư mục đích: DRIVE_VIDEO_DIR trong .env, nếu không có thì tự tìm
// "<ổ>:\My Drive\Bcons - Dong bo thiet bi\video" trên các ổ đĩa.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { checkTimestamps, prepareRun } from "./spec-tools.mjs";
import { loadMapboxEnv } from "./env.mjs";

try {
  process.loadEnvFile(".env");
} catch {
  // không có .env thì dùng biến môi trường hiện có
}

const COMPOSITION = "BconsCentralPark";
const name = process.argv[2];
const { spec, timestampsPath } = prepareRun(name); // cổng chặn trước mọi việc khác
if (!fs.existsSync(timestampsPath)) {
  console.error(`Chưa có giọng đọc: thiếu ${timestampsPath}. Chạy generate-voice.mjs ${name} trước.`);
  process.exit(1);
}
const timestamps = JSON.parse(fs.readFileSync(timestampsPath, "utf8"));
const tsErrors = checkTimestamps(spec, timestamps);
if (tsErrors.length) {
  console.error(tsErrors.join("\n"));
  process.exit(1);
}
// Cảnh bản đồ cần token Mapbox (đặt REMOTION_MAPBOX_TOKEN cho bundle).
if (spec.scenes.some((s) => s.template === "geo-map")) loadMapboxEnv();
const file = process.argv[3] ?? `${name}.mp4`;
const out = path.join("out", file);
fs.mkdirSync("out", { recursive: true });
const propsFile = path.join("out", `props-${name}.json`);
fs.writeFileSync(
  propsFile,
  JSON.stringify({ spec, timestamps }),
);

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

const render = spawnSync("npx", ["remotion", "render", COMPOSITION, out, `--props=${propsFile}`], {
  stdio: "inherit",
  shell: true,
});
if (render.status !== 0) process.exit(render.status ?? 1);

const dest = path.join(target, file);
fs.copyFileSync(out, dest);
console.log(`Đã chép lên Drive: ${dest}`);
