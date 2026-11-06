// Toán camera bản đồ thuần (Web Mercator, ô 512px, không xoay/nghiêng); dùng cho GeoMap và test.
export type Cam = { center: [number, number]; zoom: number };

/** Chiếu kinh/vĩ độ ra pixel màn hình (Web Mercator, ô 512px, không xoay/nghiêng) cho camera `cam`. */
export const projectLngLat = (lng: number, lat: number, cam: Cam, w: number, h: number): [number, number] => {
  const ws = 512 * 2 ** cam.zoom;
  const x = (l: number) => ((l + 180) / 360) * ws;
  const y = (a: number) => (0.5 - Math.log(Math.tan(Math.PI / 4 + (a * Math.PI) / 360)) / (2 * Math.PI)) * ws;
  return [x(lng) - x(cam.center[0]) + w / 2, y(lat) - y(cam.center[1]) + h / 2];
};

/** Dời tâm bản đồ để điểm `center` hiện cao hơn tâm màn hình `dy` px. */
export const shiftCenter = (center: [number, number], zoom: number, dy: number): [number, number] => {
  if (!dy) return center;
  const ws = 512 * 2 ** zoom;
  const y = (0.5 - Math.log(Math.tan(Math.PI / 4 + (center[1] * Math.PI) / 360)) / (2 * Math.PI)) * ws + dy;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / ws))) * 180) / Math.PI;
  return [center[0], lat];
};

type Pad = number | { top: number; bottom: number; left: number; right: number };

/** Khung nhìn vừa các điểm `coords` trong vùng trống (trừ lề `pad`), tính bằng toán Mercator, không cần bản đồ. */
export const fitCam = (coords: number[][], pad: Pad, maxZoom: number, w: number, h: number): Cam => {
  const P = typeof pad === "number" ? { top: pad, bottom: pad, left: pad, right: pad } : pad;
  const px = (lng: number) => ((lng + 180) / 360) * 512;
  const py = (lat: number) => (0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (2 * Math.PI)) * 512;
  const xs = coords.map((c) => px(c[0]));
  const ys = coords.map((c) => py(c[1]));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const availW = w - P.left - P.right;
  const availH = h - P.top - P.bottom;
  const zoom = Math.min(maxZoom, Math.log2(availW / Math.max(x1 - x0, 1e-9)), Math.log2(availH / Math.max(y1 - y0, 1e-9)));
  const ws = 512 * 2 ** zoom;
  // Tâm khung bao nằm giữa vùng trống; tâm bản đồ cách đó (w/2 - giữa vùng trống) px.
  const cx = ((x0 + x1) / 2) * 2 ** zoom + (w / 2 - (P.left + availW / 2));
  const cy = ((y0 + y1) / 2) * 2 ** zoom + (h / 2 - (P.top + availH / 2));
  const lng = (cx / ws) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * cy) / ws))) * 180) / Math.PI;
  return { center: [lng, lat], zoom };
};

