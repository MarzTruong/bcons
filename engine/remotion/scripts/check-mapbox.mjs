// Kiểm tra token Mapbox còn dùng được (không in token). Chạy: npm run check:mapbox
import { loadMapboxEnv } from "./env.mjs";

const token = loadMapboxEnv();
const res = await fetch(
  `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${encodeURIComponent(token)}`,
);
console.log(res.ok ? `OK (${res.status})` : `Token không dùng được: HTTP ${res.status}`);
process.exit(res.ok ? 0 : 1);
