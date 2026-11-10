// Chọn máy chạy bot (PC / laptop) qua thư mục Drive dùng chung "Bcons/bot/".
// Telegram chỉ cho MỘT máy nhận tin, nên hai máy "nói chuyện" bằng file trên Drive:
// - may-<máy>.json: { host, role: "chay" | "cho", beat } — mỗi máy tự ghi file của mình (tránh hai máy ghi đè nhau).
// - lenh.json: { to, from, at } — máy đang chạy ghi khi anh bấm "chuyển sang máy X"; máy X thấy thì nhận việc.
import fs from "node:fs";
import path from "node:path";
import { findDriveRoot, sharedDir } from "../project.mjs";

export const MAY = {
  /** Mỗi máy ghi "còn sống" mỗi 30 giây. */
  beatMs: 30_000,
  /** Im quá 3 phút (Drive đồng bộ chậm + máy ngủ) thì coi như máy đó đã tắt. */
  deadMs: 180_000,
};

/** Thư mục trạng thái trên Drive; máy không có Drive thì null (bot chạy như cũ, không chuyển máy). */
export function stateDir() {
  if (!findDriveRoot()) return null;
  const d = sharedDir("bot");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

const fileOf = (dir, host) => path.join(dir, `may-${Buffer.from(host).toString("hex").slice(0, 60)}.json`);
const readJson = (f) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
};

export function writeBeat(dir, host, role, now = Date.now()) {
  fs.writeFileSync(fileOf(dir, host), JSON.stringify({ host, role, beat: now }));
}

export function machines(dir, now = Date.now()) {
  return fs
    .readdirSync(dir)
    .filter((f) => /^may-[0-9a-f]+\.json$/.test(f))
    .map((f) => readJson(path.join(dir, f)))
    .filter((m) => m?.host)
    .map((m) => ({ ...m, alive: now - m.beat <= MAY.deadMs }));
}

/** Máy đang chạy bot (còn sống), bỏ qua `except`. */
export function runnerOf(dir, now = Date.now(), except) {
  return machines(dir, now).filter((m) => m.alive && m.role === "chay" && m.host !== except).sort((a, b) => b.beat - a.beat)[0] ?? null;
}

/** Các máy đang chờ (còn sống), bỏ qua `except`. */
export function standbysOf(dir, now = Date.now(), except) {
  return machines(dir, now).filter((m) => m.alive && m.role === "cho" && m.host !== except);
}

/** Mở bot: không có máy nào khác đang chạy thì chạy, có thì chờ. */
export function startRole(dir, host, now = Date.now()) {
  return runnerOf(dir, now, host) ? "cho" : "chay";
}

export function requestSwitch(dir, to, from, now = Date.now()) {
  fs.writeFileSync(path.join(dir, "lenh.json"), JSON.stringify({ to, from, at: now }));
}

export function readSwitch(dir) {
  return readJson(path.join(dir, "lenh.json"));
}

export function clearSwitch(dir) {
  fs.rmSync(path.join(dir, "lenh.json"), { force: true });
}

/** Máy đang chờ: "nhan-lenh" (anh bấm chuyển sang máy này), "nhan-tu-dong" (máy đang chạy mất liên lạc), hoặc "cho". */
export function standbyDecision(dir, host, now = Date.now()) {
  const sw = readSwitch(dir);
  // lệnh cũ quá 5 phút (máy nhận đã tắt lúc đó) thì bỏ, tránh hai máy cùng chạy
  if (sw && sw.to === host && now - sw.at <= 5 * 60_000) return "nhan-lenh";
  // vừa có lệnh chuyển sang máy khác: chờ máy đó nhận việc, không tự lấy lại
  if (sw && sw.to !== host && now - sw.at <= 5 * 60_000) return "cho";
  if (!runnerOf(dir, now, host)) return "nhan-tu-dong";
  return "cho";
}
