import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { projectDir } from "../scripts/project.mjs";
import { biaDrivePath, canChupBia, chepBiaLenDrive, trangThaiBia } from "../scripts/bia-drive.mjs";

const NAME = "02-von-mua-can-nao";
// Bản sao cấu trúc dự án thật (bcons.newsky: bia.json + spec.json của video 02) trong thư mục tạm, mtime cố định: không phụ thuộc giờ sửa file thật.
const T_FILE = Date.now() - 1000 * 3600 * 24; // giờ sửa cố định của bia.json/spec.json
const proj = (() => {
  const goc = projectDir("bcons-newsky");
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "da-")), "bcons-newsky");
  fs.mkdirSync(path.join(dir, "video", NAME), { recursive: true });
  for (const f of ["bia.json", "spec.json"]) {
    const dst = path.join(dir, "video", NAME, f);
    fs.copyFileSync(path.join(goc, "video", NAME, f), dst);
    const t = new Date(T_FILE);
    fs.utimesSync(dst, t, t);
  }
  return dir;
})();
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "bia-drv-"));
const hoTro = (drive) => {
  fs.mkdirSync(path.join(drive, "video", "bcons-newsky"), { recursive: true }); // cấu trúc Drive thật: video/<mã>
  return { env: { DRIVE_DIR: drive } };
};

test("biaDrivePath: video/<mã>/bia/<tên>.png trên Drive; không có Drive thì null", () => {
  const drive = tmp();
  assert.equal(biaDrivePath(NAME, proj, { env: { DRIVE_DIR: drive } }), path.join(drive, "video", "bcons-newsky", "bia", `${NAME}.png`));
  assert.equal(biaDrivePath(NAME, proj, { env: {}, exists: () => false }), null);
});

test("chepBiaLenDrive: tạo thư mục bia nếu thiếu, chụp bìa khi chưa có, chép lên Drive", () => {
  const drive = tmp();
  const opts = hoTro(drive);
  const outDir = tmp();
  let chup = 0;
  const r = chepBiaLenDrive({ name: NAME, projDir: proj, outDir, opts, chupBia: (png) => (chup++, fs.writeFileSync(png, "PNG1")) });
  assert.equal(r.trangThai, "da-chep");
  assert.equal(r.dest, path.join(drive, "video", "bcons-newsky", "bia", `${NAME}.png`));
  assert.equal(fs.readFileSync(r.dest, "utf8"), "PNG1");
  assert.equal(chup, 1);
  // đã có ảnh mới hơn spec/bia.json thì không chụp lại
  const mới = new Date(T_FILE + 60_000);
  fs.utimesSync(path.join(outDir, `${NAME}.png`), mới, mới);
  chepBiaLenDrive({ name: NAME, projDir: proj, outDir, opts, chupBia: () => chup++ });
  assert.equal(chup, 1);
});

test("canChupBia: ảnh cũ hơn bia.json hoặc spec.json thì chụp lại", () => {
  const png = path.join(tmp(), "x.png");
  assert.equal(canChupBia(png, NAME, proj), true, "chưa có ảnh");
  fs.writeFileSync(png, "x");
  const cu = new Date(T_FILE - 3600e3);
  fs.utimesSync(png, cu, cu);
  assert.equal(canChupBia(png, NAME, proj), true, "cũ hơn bia.json");
  const mới = new Date(T_FILE + 3600e3);
  fs.utimesSync(png, mới, mới);
  assert.equal(canChupBia(png, NAME, proj), false);
});

test("chepBiaLenDrive: video không có bia.json hoặc máy không có Drive thì bỏ qua, không lỗi", () => {
  const drive = tmp();
  const opts = hoTro(drive);
  const khongBia = fs.mkdtempSync(path.join(os.tmpdir(), "du-an-")); // thư mục dự án rỗng, tên hợp lệ
  const proj2 = path.join(khongBia, "bcons-newsky");
  fs.mkdirSync(path.join(proj2, "video", "x"), { recursive: true });
  assert.equal(chepBiaLenDrive({ name: "x", projDir: proj2, opts }).trangThai, "khong-co-bia");
  assert.equal(chepBiaLenDrive({ name: NAME, projDir: proj, opts: { env: {}, exists: () => false } }).trangThai, "khong-co-drive");
});

test("trangThaiBia: chưa chép → đã chép → cũ khi bia.json mới hơn (thẻ /video)", () => {
  const drive = tmp();
  const opts = hoTro(drive);
  assert.equal(trangThaiBia(NAME, proj, opts), "chưa chép");
  const r = chepBiaLenDrive({ name: NAME, projDir: proj, outDir: tmp(), opts, chupBia: (p) => fs.writeFileSync(p, "P") });
  const mới = new Date(T_FILE + 60_000);
  fs.utimesSync(r.dest, mới, mới);
  assert.equal(trangThaiBia(NAME, proj, opts), "đã chép");
  const cu = new Date(T_FILE - 3600e3);
  fs.utimesSync(r.dest, cu, cu);
  assert.equal(trangThaiBia(NAME, proj, opts), "cũ, cần chép lại");
});
