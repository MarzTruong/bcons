import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { videoIndex, resolveVideo, slugMoi } from "../scripts/bot/core.mjs";

function proj() {
  const p = fs.mkdtempSync(path.join(os.tmpdir(), "pj-"));
  const add = (name, spec) => {
    fs.mkdirSync(path.join(p, "video", name), { recursive: true });
    fs.writeFileSync(path.join(p, "video", name, "spec.json"), JSON.stringify({ name, ...spec }));
  };
  add("lai-suat-vay-mua-nha-2026", { so: 3, tieuDe: "Lãi suất vay mua nhà 2026" });
  add("ha-tang-bien-hoa-2026", { so: 4, tieuDe: "Hạ tầng Biên Hòa 2026" });
  add("mau-lai-suat", {}); // mẫu thử: không có số, không hiện trong danh sách chọn
  return p;
}

test("videoIndex: danh sách theo số, có tiêu đề dễ đọc; video không có số thì ẩn", () => {
  assert.deepEqual(videoIndex(proj()).map((v) => [v.so, v.name, v.tieuDe]), [
    [3, "lai-suat-vay-mua-nha-2026", "Lãi suất vay mua nhà 2026"],
    [4, "ha-tang-bien-hoa-2026", "Hạ tầng Biên Hòa 2026"],
  ]);
});

test("resolveVideo: gõ số, tên đủ, hay vài chữ đầu đều ra đúng video; mơ hồ hoặc sai thì null", () => {
  const p = proj();
  assert.equal(resolveVideo("3", p), "lai-suat-vay-mua-nha-2026");
  assert.equal(resolveVideo("ha-tang-bien-hoa-2026", p), "ha-tang-bien-hoa-2026");
  assert.equal(resolveVideo("lai", p), "lai-suat-vay-mua-nha-2026");
  assert.equal(resolveVideo("mau-lai-suat", p), "mau-lai-suat", "tên đủ vẫn gọi được video ẩn");
  assert.equal(resolveVideo("9", p), null);
  assert.equal(resolveVideo("", p), null);
  assert.equal(resolveVideo(undefined, p), null);
});

test("slugMoi: tên video mới = <số 2 chữ số>-<vài chữ không dấu>, số kế tiếp", () => {
  assert.equal(slugMoi(proj(), "Giới thiệu đợt 2 tháng 11"), "05-gioi-thieu-dot-2");
});
