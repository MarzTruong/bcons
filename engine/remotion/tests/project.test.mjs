import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  REPO_ROOT,
  listVideos,
  projectDir,
  readActiveProject,
  readProjectConfig,
  takeProjectFlag,
  videoPaths,
} from "../scripts/project.mjs";

function fakeRepo(config = { duAnDangBan: "du-an-a" }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repo-"));
  fs.writeFileSync(path.join(root, "CLAUDE.md"), "");
  if (config) fs.writeFileSync(path.join(root, "config.json"), JSON.stringify(config));
  for (const ma of ["du-an-a", "du-an-b"]) {
    fs.mkdirSync(path.join(root, "du-an", ma, "video", "co-spec"), { recursive: true });
    fs.writeFileSync(path.join(root, "du-an", ma, "video", "co-spec", "spec.json"), "{}");
    fs.mkdirSync(path.join(root, "du-an", ma, "video", "dot-2"), { recursive: true });
  }
  return root;
}

test("REPO_ROOT là thư mục có CLAUDE.md", () => {
  assert.ok(fs.existsSync(path.join(REPO_ROOT, "CLAUDE.md")));
});

test("readActiveProject đọc config.json", () => {
  assert.equal(readActiveProject(fakeRepo()), "du-an-a");
});

test("readActiveProject báo lỗi khi thiếu config hoặc mã sai dạng", () => {
  assert.throws(() => readActiveProject(fakeRepo(null)), /config\.json/);
  assert.throws(() => readActiveProject(fakeRepo({ duAnDangBan: "../x" })), /Mã dự án/);
});

test("projectDir báo lỗi khi không có thư mục dự án", () => {
  const root = fakeRepo();
  assert.equal(projectDir("du-an-a", root), path.join(root, "du-an", "du-an-a"));
  assert.throws(() => projectDir("khong-co", root), /Không thấy du-an\/khong-co/);
});

test("videoPaths trả đủ đường dẫn của một video", () => {
  const p = videoPaths("lai-suat", "/x/du-an/a");
  const n = (s) => s.replaceAll("\\", "/");
  assert.match(n(p.dir), /\/x\/du-an\/a\/video\/lai-suat$/);
  assert.match(n(p.spec), /video\/lai-suat\/spec\.json$/);
  assert.match(n(p.timestamps), /video\/lai-suat\/timestamps\.json$/);
  assert.match(n(p.sources), /video\/lai-suat\/kich-ban\.md$/);
  assert.match(n(p.storyboard), /video\/lai-suat\/storyboard\.md$/);
  assert.match(n(p.caption), /video\/lai-suat\/caption\.md$/);
  assert.match(n(p.audioDir), /video\/lai-suat\/audio$/);
  assert.throws(() => videoPaths("../x", "/x"));
});

test("listVideos chỉ lấy thư mục có spec.json", () => {
  const root = fakeRepo();
  assert.deepEqual(listVideos(path.join(root, "du-an", "du-an-a")), ["co-spec"]);
});

test("takeProjectFlag bóc --du-an, không có thì lấy config.json", () => {
  const root = fakeRepo();
  const a = takeProjectFlag(["ten", "--du-an", "du-an-b"], root);
  assert.equal(a.ma, "du-an-b");
  assert.deepEqual(a.rest, ["ten"]);
  assert.equal(a.projDir, path.join(root, "du-an", "du-an-b"));
  const b = takeProjectFlag(["ten", "x.mp4"], root);
  assert.equal(b.ma, "du-an-a");
  assert.deepEqual(b.rest, ["ten", "x.mp4"]);
  assert.throws(() => takeProjectFlag(["ten", "--du-an", "khong-co"], root), /Không thấy du-an\/khong-co/);
});

const FULL = {
  ma: "du-an-a",
  ten: "Dự án A",
  diaChi: "x",
  toaDo: [106.8, 10.9],
  chuDauTu: "x",
  donViPhanPhoi: "x",
  soCan: { o: 1, thuongMai: 0 },
  thongTin: "thong-tin.md",
  tuKhoaNghienCuu: [],
  tenKenh: { facebook: "", tiktok: "" },
};

test("readProjectConfig kiểm khóa bắt buộc", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-"));
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(FULL));
  assert.equal(readProjectConfig(dir).ten, "Dự án A");
  const { ten: _ten, ...thieu } = FULL;
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(thieu));
  assert.throws(() => readProjectConfig(dir), /ten/);
});

test("project.json của Bcons Central Park khớp số CĐT; _mau đủ khóa", () => {
  const cfg = readProjectConfig(path.join(REPO_ROOT, "du-an", "bcons-central-park"));
  assert.equal(cfg.ma, "bcons-central-park");
  assert.equal(cfg.soCan.o, 2820);
  assert.equal(cfg.soCan.thuongMai, 113);
  assert.doesNotThrow(() => readProjectConfig(path.join(REPO_ROOT, "du-an", "_mau")));
  assert.equal(readActiveProject(), "bcons-central-park");
});
