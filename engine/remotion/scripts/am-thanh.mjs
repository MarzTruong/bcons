// Nhạc nền + hiệu ứng âm thanh cho video.
// - Nhạc: anh để trong Drive "Bcons - Dong bo thiet bi\\am-thanh\\nhac" (máy nào cũng có); máy không có Drive thì <repo>/am-thanh/nhac/. Không lên git (giấy phép không cho phát tán file nhạc).
// - Hiệu ứng: tạo một lần bằng ElevenLabs (`npm run sfx -- --dong-y`, tốn ít credit), lưu Drive am-thanh/sfx/ (máy không có Drive: engine/remotion/am-thanh/sfx/).
// Trước khi render, chép vào <du-an>/.am-thanh/ (public dir của Remotion, không lên git).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { findDriveRoot, sharedDir } from "./project.mjs";

/** Chỗ cũ (trong repo, chỉ máy đã tạo mới có). Từ 07/11/2026 hiệu ứng để trên Drive am-thanh/sfx (máy nào cũng có). */
export const LEGACY_SFX_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "am-thanh", "sfx");
export const SFX_DIR = LEGACY_SFX_DIR;
/** Thư mục lưu hiệu ứng: Drive nếu máy có Drive, không thì trong repo. */
export const sfxSaveDir = () => (findDriveRoot() ? sharedDir("am-thanh/sfx") : LEGACY_SFX_DIR);
const hasMp3 = (d) => fs.existsSync(d) && fs.readdirSync(d).some((f) => /\.mp3$/i.test(f));
/** Thư mục đầu tiên có file hiệu ứng (Drive trước, rồi chỗ cũ). */
export function findSfxDir(cands = [sfxSaveDir(), LEGACY_SFX_DIR]) {
  return cands.find(hasMp3) ?? cands[0];
}

/** Mô tả cho ElevenLabs Sound Effects (giay = thời lượng). Tên khớp src/amThanh.ts. */
export const SFX_PROMPTS = {
  vut: { text: "Soft cinematic swoosh transition, clean, short, no music", giay: 1 },
  tach: { text: "Subtle soft UI pop click for a number appearing on screen, clean", giay: 0.6 },
  don: { text: "Short gentle rising swell riser before a reveal, cinematic, subtle", giay: 1.5 },
};

const isAudio = (f) => /\.(mp3|m4a|wav|ogg)$/i.test(f);

/** Chọn nhạc: file spec chỉ định (nếu có), không thì chọn cố định theo tên video (video khác nhau dùng bài khác nhau). */
export function pickMusic(name, files, preferred) {
  const list = files.filter(isAudio).sort();
  if (!list.length) return null;
  if (preferred && list.includes(preferred)) return preferred;
  const h = crypto.createHash("sha256").update(name).digest().readUInt32BE(0);
  return list[h % list.length];
}

/** Chép nhạc + hiệu ứng vào <projDir>/.am-thanh/, trả phần props `amThanh` cho Remotion. */
export function prepareAudio({ name, projDir, preferred, khongNhac = false, nhacDir = sharedDir("am-thanh/nhac"), sfxDir = findSfxDir() }) {
  const dest = path.join(projDir, ".am-thanh");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.join(dest, "sfx"), { recursive: true });
  let nhac = null;
  let nhacFile = null;
  if (!khongNhac && fs.existsSync(nhacDir)) {
    nhacFile = pickMusic(name, fs.readdirSync(nhacDir), preferred);
    if (nhacFile) {
      fs.copyFileSync(path.join(nhacDir, nhacFile), path.join(dest, "nhac.mp3"));
      nhac = ".am-thanh/nhac.mp3";
    }
  }
  const sfx = [];
  if (fs.existsSync(sfxDir)) {
    for (const f of fs.readdirSync(sfxDir).filter((x) => /\.mp3$/i.test(x)).sort()) {
      fs.copyFileSync(path.join(sfxDir, f), path.join(dest, "sfx", f));
      sfx.push(f.replace(/\.mp3$/i, ""));
    }
  }
  return { nhac, nhacFile, sfx };
}
