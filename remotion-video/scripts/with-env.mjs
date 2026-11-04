// Chạy một lệnh sau khi nạp .env và đặt REMOTION_MAPBOX_TOKEN. Dùng: node scripts/with-env.mjs remotion studio
import { spawnSync } from "node:child_process";
import { loadMapboxEnv } from "./env.mjs";

try {
  process.loadEnvFile(".env");
} catch {
  // không có .env thì dùng biến môi trường hiện có
}
loadMapboxEnv();
const [cmd, ...args] = process.argv.slice(2);
const r = spawnSync("npx", [cmd, ...args], { stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
