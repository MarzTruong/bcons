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

test("applyWatermark: gắn tên + địa chỉ dự án (project.json) cho cảnh cuối, không viết cứng trong engine", () => {
  const cfg = readProjectConfig(projectDir("bcons-central-park"));
  const spec = { name: "a", status: "approved", scenes: [] };
  const out = applyWatermark(spec, cfg);
  assert.equal(out.duAn.ten, "Bcons Central Park");
  assert.equal(out.duAn.diaChi, cfg.diaChiVideo ?? cfg.diaChi);
  assert.equal(applyWatermark(spec, { ten: "Bcons Newsky", diaChi: "Dĩ An" }).duAn.ten, "Bcons Newsky");
  assert.equal(spec.duAn, undefined, "không sửa spec gốc");
});

test("engine không còn viết cứng tên/địa chỉ dự án hay dòng 'tham khảo' trong mẫu cảnh", async () => {
  const fs = await import("node:fs");
  for (const f of fs.readdirSync(new URL("../src/templates/", import.meta.url))) {
    const s = fs.readFileSync(new URL(`../src/templates/${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(s, /Bcons Central Park|236 Phan Trung|mang tính tham khảo/i, f);
  }
});
