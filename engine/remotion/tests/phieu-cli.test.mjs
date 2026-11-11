import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLenhPhieu, chayPhieu } from "../scripts/phieu.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CP = path.join(ROOT, "du-an", "bcons-central-park");

test("parseLenhPhieu: dạng gõ tay", () => {
  assert.deepEqual(parseLenhPhieu("A18-09 03 lai=9.5 nam=20 ten=Minh pdf"), { ma: "A18-09", pttt: "03", lai: 9.5, nam: 20, ten: "Minh", pdf: true });
  assert.deepEqual(parseLenhPhieu("/phieu a18-09 PTTT 03"), { ma: "A18-09", pttt: "03", pdf: false });
  assert.equal(parseLenhPhieu("/phieu@BconsBot B1.3-01 9").pttt, "09");
  assert.equal(parseLenhPhieu('A18-09 03 ten="Nguyễn Văn Minh"').ten, "Nguyễn Văn Minh");
});

test("parseLenhPhieu: dạng lệnh bấm được của Telegram /phieu_<mã>_<PTTT>_<lãi>_<năm>", () => {
  const a = { ma: "A18-09", pttt: "03", lai: 9.5, nam: 20, pdf: false };
  assert.deepEqual(parseLenhPhieu("/phieu_A18_09_03_9p5_20"), a);
  assert.deepEqual(parseLenhPhieu("/phieu_B1p3_01_09_9p5_20"), { ma: "B1.3-01", pttt: "09", lai: 9.5, nam: 20, pdf: false });
  assert.deepEqual(parseLenhPhieu("/phieu_A18_09_03_9_25 pdf ten=An"), { ma: "A18-09", pttt: "03", lai: 9, nam: 25, ten: "An", pdf: true });
  assert.throws(() => parseLenhPhieu("/phieu_A18"), /Cú pháp/);
  assert.throws(() => parseLenhPhieu("/phieu"), /Cú pháp/);
});

const can = (tt) => ({ ma: "A18-09", loai: "2PN-2WC", dtTimTuong: 62.02, giaChuaVat: { "03": 4066746600 }, tinhTrang: tt });
const deps = (tt, ghi = []) => ({
  timCan: async (_d, ma) => (ma === "A18-09" ? can(tt) : null),
  render: async (o) => { ghi.push(o); return { png: `/tmp/${o.tenFile}.png`, cao: 1640, ...(o.pdf ? { pdf: `/tmp/${o.tenFile}.pdf` } : {}) }; },
});

test("chayPhieu: thành công trả đường dẫn PNG (và PDF khi cần), tên file không chứa ký tự lạ", async () => {
  const ghi = [];
  const r = await chayPhieu({ ma: "A18-09", pttt: "03", pdf: true, projDir: CP }, deps("Trống", ghi));
  assert.match(r.png, /A18-09-03\.png$/);
  assert.match(r.pdf, /A18-09-03\.pdf$/);
  assert.equal(r.phieu.can.ma, "A18-09");
  assert.match(ghi[0].outDir.replaceAll("\\", "/"), /engine\/remotion\/out\/phieu$/);
});

test("chayPhieu: căn đã cọc hoặc LOCK không lập phiếu; mã lạ báo không thấy căn", async () => {
  await assert.rejects(chayPhieu({ ma: "A18-09", pttt: "03", projDir: CP }, deps("ĐÃ CỌC")), /Không lập phiếu:/);
  await assert.rejects(chayPhieu({ ma: "A18-09", pttt: "03", projDir: CP }, deps("LOCK")), /Không lập phiếu:/);
  await assert.rejects(chayPhieu({ ma: "Z1-01", pttt: "03", projDir: CP }, deps("Trống")), /Không thấy căn Z1-01/);
});
