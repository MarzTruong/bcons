import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findDriveRoot, sharedDir } from "../scripts/project.mjs";

test("findDriveRoot: ưu tiên DRIVE_DIR trong .env, không thì dò '<ổ>:\\My Drive\\Bcons - Dong bo thiet bi'", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "drv-"));
  assert.equal(findDriveRoot({ env: { DRIVE_DIR: tmp } }), tmp);
  const seen = [];
  const exists = (p) => (seen.push(p), p === "H:\\My Drive\\Bcons - Dong bo thiet bi");
  assert.equal(findDriveRoot({ env: {}, exists }), "H:\\My Drive\\Bcons - Dong bo thiet bi");
  assert.ok(seen[0].startsWith("G:"), "dò ổ G trước (mặc định của Drive for desktop)");
  assert.equal(findDriveRoot({ env: {}, exists: () => false }), null);
});

test("sharedDir: dữ liệu dùng chung (nhạc, bảng giá) lấy trên Drive; máy không có Drive thì dùng thư mục trong repo", () => {
  const drive = fs.mkdtempSync(path.join(os.tmpdir(), "drv-"));
  fs.mkdirSync(path.join(drive, "am-thanh", "nhac"), { recursive: true });
  assert.equal(sharedDir("am-thanh/nhac", { env: { DRIVE_DIR: drive } }), path.join(drive, "am-thanh", "nhac"));
  const local = sharedDir("am-thanh/nhac", { env: {}, exists: () => false });
  assert.ok(local.endsWith(path.join("am-thanh", "nhac")) && !local.includes("My Drive"));
});
