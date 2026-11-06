// Nạp token Mapbox từ .env và đặt REMOTION_MAPBOX_TOKEN cho bundle Remotion.
// Không bao giờ in giá trị token.
import fs from "node:fs";

/** Đọc MAPBOX_TOKEN_KEY (từ file .env, hoặc biến môi trường), gán env.REMOTION_MAPBOX_TOKEN, trả token. */
export function loadMapboxEnv(envPath = ".env", env = process.env) {
  let token = (env.MAPBOX_TOKEN_KEY ?? "").trim();
  if (!token && fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, "utf8").match(/^\s*MAPBOX_TOKEN_KEY\s*=\s*(.*)$/m);
    token = (m?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  }
  if (!token) throw new Error("Thiếu MAPBOX_TOKEN_KEY trong remotion-video/.env");
  env.REMOTION_MAPBOX_TOKEN = token;
  return token;
}
