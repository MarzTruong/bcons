import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { taoPhieu } from "./du-lieu.mjs";
import { dungHtml, themQr, renderPhieu, timChrome, MAU } from "./render.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CP = path.join(ROOT, "du-an", "bcons-central-park");
const NS = path.join(ROOT, "du-an", "bcons-newsky");
const a1809 = { ma: "A18-09", loai: "2PN-2WC", thap: "Orchid (A)", tang: 18, dtTimTuong: 62.02, dtThongThuy: 56.91, giaChuaVat: { "03": 4066746600 }, tinhTrang: "Trống" };
const b1301 = { ma: "B1.3-01", loai: "3PN-2WC", tang: 3, dtTimTuong: 77.81, dtThongThuy: 70.06, giaChuaVat: { "08": 3831261156 }, tinhTrang: "Trống" };
const template = fs.readFileSync(MAU, "utf8");
const co = timChrome() !== null;
const rong = (f) => fs.readFileSync(f).readUInt32BE(16);
const cao = (f) => fs.readFileSync(f).readUInt32BE(20);

test("template có đúng một chuỗi __PHIEU_DATA__; dungHtml thay hết và không bị </script> trong dữ liệu phá", () => {
  assert.equal(template.split("__PHIEU_DATA__").length, 2);
  const p = taoPhieu({ projDir: CP, can: a1809, pttt: "03", khach: { ten: "</script><b>x" } });
  const html = dungHtml(template, p);
  assert.ok(!html.includes("__PHIEU_DATA__"));
  assert.equal(html.split("</script>").length, template.split("</script>").length);
  assert.throws(() => dungHtml("<html></html>", p), /đúng một chuỗi/);
});

test("renderPhieu: Central Park A18-09 PTTT 03 ra PNG rộng 1080 px, PDF bắt đầu bằng %PDF", { skip: !co && "không có Chrome" }, async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "phieu-t-"));
  const p = await themQr(taoPhieu({ projDir: CP, can: a1809, pttt: "03" }));
  assert.match(p.lienHe.qrSvg, /^<svg/);
  const r = await renderPhieu({ html: dungHtml(template, p), outDir: out, tenFile: "a1809-03", pdf: true });
  assert.equal(rong(r.png), 1080);
  assert.equal(cao(r.png), r.cao);
  assert.ok(r.cao > 800 && r.cao <= 1800, `cao ${r.cao}`);
  assert.equal(r.canhBao, undefined);
  assert.equal(fs.readFileSync(r.pdf).subarray(0, 4).toString(), "%PDF");
});

test("renderPhieu: Newsky PTTT 08 (12 đợt) vẫn ra ảnh; vượt 1.800 px thì có cảnh báo, không cắt", { skip: !co && "không có Chrome" }, async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "phieu-t-"));
  const p = await themQr(taoPhieu({ projDir: NS, can: b1301, pttt: "08", khach: { ten: "Nguyễn Thị Minh Anh Thư Khánh Linh Bảo Châu" } }));
  const r = await renderPhieu({ html: dungHtml(template, p), outDir: out, tenFile: "b1301-08" });
  assert.equal(rong(r.png), 1080);
  assert.equal(cao(r.png), r.cao);
  if (r.cao > 1800) assert.match(r.canhBao, /cao/); else assert.equal(r.canhBao, undefined);
});
