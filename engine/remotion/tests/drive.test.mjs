import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findDriveRoot, sharedDir } from "../scripts/project.mjs";

test("findDriveRoot: ưu tiên DRIVE_DIR trong .env, không thì dò '<ổ>:\\My Drive\\Bcons'", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "drv-"));
  assert.equal(findDriveRoot({ env: { DRIVE_DIR: tmp } }), tmp);
  const seen = [];
  const exists = (p) => (seen.push(p), p === "H:\\My Drive\\Bcons");
  assert.equal(findDriveRoot({ env: {}, exists }), "H:\\My Drive\\Bcons");
  assert.ok(seen[0].startsWith("G:"), "dò ổ G trước (mặc định của Drive for desktop)");
  assert.equal(findDriveRoot({ env: {}, exists: () => false }), null);
});

test("findDriveRoot: máy chưa đồng bộ kịp sau khi đổi tên vẫn thấy tên cũ 'Bcons - Dong bo thiet bi'", () => {
  const cu = "G:\\My Drive\\Bcons - Dong bo thiet bi";
  assert.equal(findDriveRoot({ env: {}, exists: (p) => p === cu }), cu);
  const moi = "G:\\My Drive\\Bcons";
  assert.equal(findDriveRoot({ env: {}, exists: (p) => p === moi || p === cu }), moi, "có cả hai thì lấy tên mới");
});

test("sharedDir: dữ liệu dùng chung (nhạc, bảng giá) lấy trên Drive; máy không có Drive thì dùng thư mục trong repo", () => {
  const drive = fs.mkdtempSync(path.join(os.tmpdir(), "drv-"));
  fs.mkdirSync(path.join(drive, "am-thanh", "nhac"), { recursive: true });
  assert.equal(sharedDir("am-thanh/nhac", { env: { DRIVE_DIR: drive } }), path.join(drive, "am-thanh", "nhac"));
  const local = sharedDir("am-thanh/nhac", { env: {}, exists: () => false });
  assert.ok(local.endsWith(path.join("am-thanh", "nhac")) && !local.includes("My Drive"));
});

test("driveVideoDir: video render lên Drive vào thư mục riêng từng dự án (video/<mã>), hai dự án trùng tên video không đè nhau", async () => {
  const { driveVideoDir } = await import("../scripts/project.mjs");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "drv-"));
  fs.mkdirSync(path.join(root, "video"));
  const a = driveVideoDir("bcons-newsky", { env: { DRIVE_DIR: root } });
  const b = driveVideoDir("bcons-central-park", { env: { DRIVE_DIR: root } });
  assert.equal(a, path.join(root, "video", "bcons-newsky"));
  assert.notEqual(a, b);
  // DRIVE_VIDEO_DIR (cài đặt cũ trong .env) vẫn dùng được, cũng tách theo dự án
  assert.equal(driveVideoDir("bcons-newsky", { env: { DRIVE_VIDEO_DIR: path.join(root, "video") } }), path.join(root, "video", "bcons-newsky"));
  // không có Drive thì null (render-drive báo lỗi rõ)
  assert.equal(driveVideoDir("bcons-newsky", { env: {}, exists: () => false }), null);
  assert.throws(() => driveVideoDir("../x", { env: { DRIVE_DIR: root } }));
});
