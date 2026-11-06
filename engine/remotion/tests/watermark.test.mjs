import test from "node:test";
import assert from "node:assert/strict";
import { applyWatermark } from "../scripts/spec-tools.mjs";
import { readProjectConfig, projectDir } from "../scripts/project.mjs";

const wm = { kieu: "qr", ten: "Tuấn Trương", link: "https://x.pages.dev/?utm_source=qr" };

test("applyWatermark: spec chưa có watermark thì lấy của dự án; spec có sẵn thì giữ", () => {
  const spec = { name: "a", status: "approved", scenes: [] };
  assert.deepEqual(applyWatermark(spec, { watermark: wm }).watermark, wm);
  const own = { ...spec, watermark: { kieu: "troi", text: "X" } };
  assert.deepEqual(applyWatermark(own, { watermark: wm }).watermark, own.watermark);
  assert.equal(applyWatermark(spec, {}).watermark, undefined);
  assert.equal(spec.watermark, undefined, "không sửa spec gốc");
});

test("dự án đang bán có watermark QR mở landing (utm_source=qr), có tên", () => {
  const cfg = readProjectConfig(projectDir("bcons-central-park"));
  assert.equal(cfg.watermark.kieu, "qr");
  assert.ok(cfg.watermark.ten);
  assert.match(cfg.watermark.link, /^HTTPS:\/\/[A-Z0-9.-]+\/QR$/, "viết hoa, ngắn: QR thưa, quét được khi nhỏ");
});
