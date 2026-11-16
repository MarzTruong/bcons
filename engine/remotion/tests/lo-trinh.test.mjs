import test from "node:test";
import assert from "node:assert/strict";
import { tongLoTrinh, nhomHienLuc, hangHien, chiaDoanThanh, dinhDangTr } from "../src/loTrinh.ts";
import { parseSpec } from "../src/spec.ts";
import { checkLoTrinh, checkCues } from "../scripts/spec-tools.mjs";

// Dữ liệu thật của video Newsky 2 (căn ví dụ 3 tỷ chưa VAT, PTTT 09; kiểm AGY 16/11/2026: kiem-toan/2026-11-16-bang-lo-trinh-tien/KIEM.md), triệu đồng.
const MOC = [
  { nhan: "Ký thỏa thuận", khi: "Khi ký", ghiChu: "5% chưa VAT", soTien: 150, nhom: "tuCo", cueKey: "c1", sourceId: "pttt-09" },
  { nhan: "Ký hợp đồng", khi: "Ký HĐMB", ghiChu: "5% + VAT hai đợt đầu", soTien: 180, nhom: "tuCo", cueKey: "c1", offset: 20, sourceId: "tinh-toan-von" },
  { nhan: "Ngân hàng giải ngân", khi: "+7 ngày", ghiChu: "50% giá căn (nếu vay)", soTien: 1650, nhom: "nganHang", cueKey: "c2", sourceId: "pttt-09" },
  { nhan: "Đợt 4", khi: "+2 tháng", ghiChu: "5% đã gồm VAT", soTien: 165, nhom: "tuCo", cueKey: "c3", sourceId: "tinh-toan-von" },
  { nhan: "Đợt 5", khi: "+4 tháng", ghiChu: "5% đã gồm VAT", soTien: 165, nhom: "tuCo", cueKey: "c3", offset: 20, sourceId: "tinh-toan-von" },
  { nhan: "Nhận nhà", khi: "Dự kiến Quý II/2028", ghiChu: "25% + VAT còn lại + phí bảo trì 2%", soTien: 900, nhom: "nhanNha", cueKey: "c4", sourceId: "tinh-toan-von" },
  { nhan: "Sổ hồng", khi: "Khi có sổ", ghiChu: "5% còn lại", soTien: 150, nhom: "soHong", cueKey: "c4", offset: 25, sourceId: "pttt-09" },
];

test("tổng tính từ moc[]: tự có 660, ngân hàng 1.650, nhận nhà 900, sổ hồng 150, cộng 3.360", () => {
  const t = tongLoTrinh(MOC);
  assert.deepEqual(
    { tuCo: t.tuCo, nganHang: t.nganHang, nhanNha: t.nhanNha, soHong: t.soHong, tong: t.tong, lonNhat: t.lonNhat },
    { tuCo: 660, nganHang: 1650, nhanNha: 900, soHong: 150, tong: 3360, lonNhat: 1650 },
  );
  assert.equal(t.soDotTuCo, 4);
});

test("sửa một mốc thì tổng đổi theo (không có số tổng viết sẵn)", () => {
  const sua = MOC.map((m) => (m.nhan === "Đợt 4" ? { ...m, soTien: 200 } : m));
  const t = tongLoTrinh(sua);
  assert.equal(t.tuCo, 695);
  assert.equal(t.tong, 3395);
});

test("tổng = giá căn có VAT + phí bảo trì: 3 tỷ x (1 + 10% + 2%) = 3.360", () => {
  assert.equal(Math.round(3000 * (1 + 0.1 + 0.02)), tongLoTrinh(MOC).tong);
});

test("định dạng: dấu chấm ngăn hàng nghìn kiểu Việt Nam", () => {
  assert.equal(dinhDangTr(1650), "1.650");
  assert.equal(dinhDangTr(660), "660");
  assert.equal(dinhDangTr(3360), "3.360");
});

test("nhóm hiện khi mốc đầu tiên của nhóm hiện (cue + offset), lấy từ cue thật chứ không số cứng", () => {
  const cue = (k) => ({ c1: 20, c2: 90, c3: 150, c4: 210 })[k];
  const at = nhomHienLuc(MOC, cue);
  assert.deepEqual(at, { tuCo: 20, nganHang: 90, nhanNha: 210, soHong: 235 });
});

test("hàng hiện dần: trước mốc = 0, sau ~0,38 s (11 khung) = 1; offset dời mốc", () => {
  const cue = (k) => ({ c1: 20, c2: 90, c3: 150, c4: 210 })[k];
  assert.equal(hangHien(MOC[0], 10, cue), 0);
  assert.ok(hangHien(MOC[0], 29, cue) > 0.9);
  assert.equal(hangHien(MOC[0], 60, cue), 1);
  assert.equal(hangHien(MOC[1], 30, cue), 0); // có offset 20: bắt đầu ở khung 40
  assert.equal(hangHien(MOC[1], 39, cue), 0);
  assert.ok(hangHien(MOC[1], 50, cue) > 0.9);
});

test("thanh xếp chồng: phần trăm theo tổng, đúng thứ tự tự có, ngân hàng, nhận nhà, sổ hồng", () => {
  const d = chiaDoanThanh(MOC);
  assert.deepEqual(d.map((x) => x.nhom), ["tuCo", "nganHang", "nhanNha", "soHong"]);
  assert.deepEqual(d.map((x) => x.so), [660, 1650, 900, 150]);
  assert.ok(Math.abs(d.reduce((a, x) => a + x.phanTram, 0) - 100) < 1e-9);
  assert.ok(Math.abs(d[1].phanTram - (1650 / 3360) * 100) < 1e-9);
});

// --- schema và cổng kiểm ---
const props = (extra = {}) => ({
  pttt: "PTTT 09",
  canViDu: "3 tỷ, chưa VAT",
  donVi: "triệu đồng",
  title: "Lộ trình tiền theo thời gian",
  phan: "trinh-tu",
  giaChuaVat: 3000,
  vat: 0.1,
  baoTri: 0.02,
  moc: MOC,
  ghiChuCuoi: "Đơn vị: triệu đồng.",
  ...extra,
});
const sp = (p = props()) => ({
  name: "demo",
  status: "draft",
  scenes: [
    {
      id: "scene1",
      template: "lo-trinh",
      markup: "ký nhiều nằm đợt",
      cues: { c1: "ký", c2: "nhiều", c3: "nằm", c4: "đợt" },
      props: p,
    },
  ],
});

test("lo-trinh parse được; 3 đến 8 mốc; nhóm hợp lệ; mốc có sourceId", () => {
  assert.equal(parseSpec(sp()).scenes[0].template, "lo-trinh");
  assert.throws(() => parseSpec(sp(props({ moc: MOC.slice(0, 2) }))), /moc/);
  assert.throws(() => parseSpec(sp(props({ moc: [{ ...MOC[0], nhom: "khac" }, MOC[1], MOC[2]] }))), /nhom/);
  const thieu = MOC.map((m, i) => (i === 0 ? { ...m, sourceId: undefined } : m));
  assert.throws(() => parseSpec(sp(props({ moc: thieu }))), /moc\.0\.sourceId/);
  assert.throws(() => parseSpec(sp(props({ phan: "la" }))), /phan/);
});

test("checkLoTrinh: tổng khớp giá có VAT + phí bảo trì thì không lỗi", () => {
  assert.deepEqual(checkLoTrinh(parseSpec(sp())), []);
});

test("checkLoTrinh: sửa một mốc mà không đổi giá căn thì báo lệch tổng", () => {
  const sua = MOC.map((m) => (m.nhan === "Đợt 4" ? { ...m, soTien: 200 } : m));
  const e = checkLoTrinh(parseSpec(sp(props({ moc: sua }))));
  assert.match(e.join(" "), /3\.395/);
  assert.match(e.join(" "), /3\.360/);
});

test("checkLoTrinh: không khai giá căn thì bỏ qua phép kiểm tổng", () => {
  assert.deepEqual(checkLoTrinh(parseSpec(sp(props({ giaChuaVat: undefined, vat: undefined, baoTri: undefined })))), []);
});

test("checkCues: lo-trinh đòi cue của từng mốc", () => {
  const s = parseSpec(sp());
  assert.deepEqual(checkCues(s), []);
  s.scenes[0].cues = { c1: "ký" };
  assert.match(checkCues(s).join(" "), /c2/);
});
