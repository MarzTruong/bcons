import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { CHU_DE_MAU, mauChuDe, kichCoBia, BiaSchema, hookTuBia } from "../src/bia.ts";
import { parseSpec } from "../src/spec.ts";
import { checkBia } from "../scripts/bia-tools.mjs";
import { REPO_ROOT } from "../scripts/project.mjs";

// Công thức cỡ chữ của AGY (bìa phương án 1, kiểm 16/11/2026) ra đúng cỡ trên các bìa thật.
const k = (tieuDe, diemNhan, ghiChuNhan) => kichCoBia({ tieuDe, diemNhan, ghiChuNhan });

test("màu theo chủ đề: 4 giá trị cố định, thiếu thì dùng màu dự án", () => {
  assert.deepEqual(Object.keys(CHU_DE_MAU), ["ha-tang", "tien-do", "tai-chinh", "du-an"]);
  assert.equal(mauChuDe("ha-tang"), "#7ee0c3");
  assert.equal(mauChuDe("tai-chinh"), "#ff9e44");
  assert.equal(mauChuDe(undefined), "#7cc4ff");
});

test("cỡ chữ: số 1 chữ số to nhất; số dài thu nhỏ; ghi chú dài thu nhỏ", () => {
  assert.deepEqual(k(["Quốc lộ 13", "lên 8 làn"], "8", "làn xe"), { num: 220, unit: 56, title: 92 });
  assert.deepEqual(k(["Mua căn 3 tỷ", "cần bao nhiêu?"], "150", "triệu bước đầu"), { num: 196, unit: 44, title: 92 });
  assert.deepEqual(k(["Lãi vay", "hạ nhiệt"], "9–10,7%", "/năm (1–2 năm đầu)"), { num: 124, unit: 27, title: 92 });
  assert.deepEqual(k(["Cuối năm,", "3 công trình về đích"], "3", "công trình"), { num: 220, unit: 56, title: 78 });
});

test("schema bìa: 1–3 dòng, ảnh và nhãn ảnh bắt buộc, chủ đề hợp lệ", () => {
  const ok = { tieuDe: ["Quốc lộ 13", "lên 8 làn"], diemNhan: "8", ghiChuNhan: "làn xe", chuDe: "ha-tang", anhNen: "assets/images/a.jpg", nhanAnh: "Phối cảnh minh họa", duAn: "bcons-newsky" };
  assert.ok(BiaSchema.parse(ok));
  assert.throws(() => BiaSchema.parse({ ...ok, tieuDe: [] }));
  assert.throws(() => BiaSchema.parse({ ...ok, tieuDe: ["a", "b", "c", "d"] }));
  assert.throws(() => BiaSchema.parse({ ...ok, chuDe: "la" }));
  assert.throws(() => BiaSchema.parse({ ...ok, nhanAnh: "" }));
  const { anhNen, ...thieu } = ok;
  assert.throws(() => BiaSchema.parse(thieu));
});

test("hookTuBia: bìa và khung mở đầu dùng cùng dữ liệu", () => {
  const bia = BiaSchema.parse({ tieuDe: ["Ba cách", "thanh toán"], diemNhan: "3", ghiChuNhan: "lịch đóng", chuDe: "tai-chinh", anhNen: "assets/images/phoi-canh-tong-the.jpg", viTriAnh: "left 45%", nhanAnh: "Phối cảnh minh họa", duAn: "bcons-newsky" });
  const h = hookTuBia(bia);
  assert.deepEqual(h.lines, ["Ba cách", "thanh toán"]);
  assert.equal(h.soNhan, "3");
  assert.equal(h.donVi, "lịch đóng");
  assert.equal(h.chuDe, "tai-chinh");
  assert.equal(h.viTriAnh, "left 45%");
  assert.deepEqual(h.image, { file: "assets/images/phoi-canh-tong-the.jpg", label: "Phối cảnh minh họa" });
});

// --- checkBia: bìa phải khớp video ---
const projDir = path.join(REPO_ROOT, "du-an/bcons-newsky");
const bia = (extra = {}) => ({
  tieuDe: ["Quốc lộ 13", "lên 8 làn"],
  diemNhan: "8",
  ghiChuNhan: "làn xe",
  chuDe: "ha-tang",
  anhNen: "assets/images/phoi-canh-quoc-lo-13.jpg",
  nhanAnh: "Phối cảnh minh họa",
  duAn: "bcons-newsky",
  ...extra,
});
const spec = (hook) => ({
  name: "demo",
  status: "draft",
  hook,
  scenes: [{ id: "scene1", template: "stat-hero", markup: "Quốc lộ 13 lên 8{tám} làn xe.", cues: { value: "8" }, props: { badge: "x", titleLines: ["a"], cardLabel: "y", value: 8, decimals: 0, unit: "làn xe", sourceId: "s" } }],
});
const hookOk = { lines: ["Quốc lộ 13", "lên 8 làn"], soNhan: "8", donVi: "làn xe", chuDe: "ha-tang", image: { file: "assets/images/phoi-canh-quoc-lo-13.jpg", label: "Phối cảnh minh họa", sourceId: "x" } };

test("checkBia: bìa khớp hook và video thì không lỗi", () => {
  assert.deepEqual(checkBia(BiaSchema.parse(bia()), parseSpec(spec(hookOk)), projDir), []);
});

test("checkBia: số trên bìa không có trong video bị báo", () => {
  const e = checkBia(BiaSchema.parse(bia({ diemNhan: "9" })), parseSpec(spec({ ...hookOk, soNhan: "9" })), projDir);
  assert.match(e.join(" "), /9/);
});

test("checkBia: tiêu đề quá 6 chữ, ảnh không có file bị báo", () => {
  assert.match(checkBia(BiaSchema.parse(bia({ tieuDe: ["Quốc lộ 13 sắp mở rộng", "lên 8 làn xe nhé"] })), parseSpec(spec(hookOk)), projDir).join(" "), /7 chữ/);
  assert.match(checkBia(BiaSchema.parse(bia({ anhNen: "assets/images/khong-co.jpg" })), parseSpec(spec(hookOk)), projDir).join(" "), /không thấy file/);
});

test("checkBia: khung đầu video (hook) khác bìa thì báo (khung 0 phải là bìa)", () => {
  const e = checkBia(BiaSchema.parse(bia()), parseSpec(spec({ ...hookOk, lines: ["Quốc lộ 13", "mở rộng"] })), projDir);
  assert.match(e.join(" "), /hook/);
  assert.match(checkBia(BiaSchema.parse(bia()), parseSpec(spec({ ...hookOk, chuDe: "tai-chinh" })), projDir).join(" "), /chuDe|chủ đề/);
});

test("checkBia: video chưa có hook thì chỉ kiểm bìa", () => {
  assert.deepEqual(checkBia(BiaSchema.parse(bia()), parseSpec(spec(undefined)), projDir), []);
});
