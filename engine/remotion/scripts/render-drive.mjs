// Render video rồi chép bản hoàn chỉnh sang thư mục Drive (Google Drive for desktop).
// Chạy: npm run render:drive -- <tên-video> [tên-file.mp4] [--du-an <mã>]
// Chỉ render khi spec "approved" và mọi sourceId có trong bảng nguồn.
// Thư mục đích: DRIVE_VIDEO_DIR trong .env, nếu không có thì tự tìm
// "<ổ>:\My Drive\Bcons\video" trên các ổ đĩa.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { applyWatermark, checkTimestamps, prepareRun } from "./spec-tools.mjs";
import { loadMapboxEnv } from "./env.mjs";
import { findDriveRoot, readProjectConfig, takeProjectFlag } from "./project.mjs";
import { prepareAudio } from "./am-thanh.mjs";

try {
  process.loadEnvFile(".env");
} catch {
  // không có .env thì dùng biến môi trường hiện có
}

const COMPOSITION = "BconsCentralPark";
const { projDir, rest: args } = takeProjectFlag(process.argv.slice(2));
// --khong-nhac: bản chỉ có giọng + hiệu ứng, để anh tự chọn nhạc trên TikTok.
const khongNhac = args.includes("--khong-nhac");
const rest = args.filter((a) => a !== "--khong-nhac");
const name = rest[0];
const { spec, timestampsPath } = prepareRun(name, { projDir }); // cổng chặn trước mọi việc khác
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
const file = rest[1] ?? `${name}${khongNhac ? "-khong-nhac" : ""}.mp4`;
// Tên file đi vào lệnh npx (shell: true): chỉ nhận chữ, số, chấm, gạch.
if (!/^[A-Za-z0-9._-]+\.mp4$/.test(file)) {
  console.error(`Tên file không hợp lệ: "${file}" (chỉ chữ, số, . _ -, đuôi .mp4).`);
  process.exit(1);
}
// out/video = video thành phẩm; out/tam = file tạm (props, khung kiểm tra, log). Cả out/ đã gitignore.
const out = path.join("out", "video", file);
fs.mkdirSync(path.join("out", "video"), { recursive: true });
fs.mkdirSync(path.join("out", "tam", "props"), { recursive: true });
const propsFile = path.join("out", "tam", "props", `props-${name}.json`);
const amThanh = prepareAudio({ name, projDir, preferred: spec.nhac, khongNhac });
console.log(
  amThanh.nhac ? `Nhạc nền: ${amThanh.nhacFile}` : khongNhac ? "Bản không nhạc." : "Chưa có nhạc trong am-thanh/nhac/ (render không nhạc).",
  amThanh.sfx.length ? `Hiệu ứng: ${amThanh.sfx.join(", ")}` : "Chưa có hiệu ứng (chạy /sfx một lần).",
);
fs.writeFileSync(
  propsFile,
  JSON.stringify({ spec: applyWatermark(spec, readProjectConfig(projDir)), timestamps, amThanh }),
);

function findDriveDir() {
  if (process.env.DRIVE_VIDEO_DIR) return process.env.DRIVE_VIDEO_DIR;
  const root = findDriveRoot();
  return root ? path.join(root, "video") : null;
}

const target = findDriveDir();
if (!target || !fs.existsSync(target)) {
  console.error(
    "Không thấy thư mục Drive. Cài Google Drive for desktop hoặc đặt DRIVE_VIDEO_DIR trong .env.",
  );
  process.exit(1);
}

// Cảnh bản đồ Mapbox cần WebGL qua ANGLE và render tuần tự (concurrency 1).
const mapFlags = spec.scenes.some((s) => s.template === "geo-map") ? ["--gl=angle", "--concurrency=1"] : [];
const render = spawnSync("npx", ["remotion", "render", COMPOSITION, out, `--props=${propsFile}`, `--public-dir="${projDir}"`, ...mapFlags], {
  stdio: "inherit",
  shell: true,
});
if (render.status !== 0) process.exit(render.status ?? 1);

const dest = path.join(target, file);
fs.copyFileSync(out, dest);
console.log(`Đã chép lên Drive: ${dest}`);
