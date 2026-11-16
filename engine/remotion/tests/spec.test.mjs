import test from "node:test";
import assert from "node:assert/strict";
import { parseSpec } from "../src/spec.ts";

const card = (extra = {}) => ({ tag: "T", big: "1", sub: "s", cueKey: "a", offset: 0, sourceId: "s1", ...extra });
const base = (props, template = "data-cards", status = "draft") => ({
  name: "demo",
  status,
  scenes: [{ id: "scene1", template, markup: "xin chào", cues: { a: "xin" }, props }],
});
const cards = (n) => ({ kicker: "K", title: "T", cards: Array.from({ length: n }, () => card()) });

test("spec hợp lệ tối thiểu parse thành công", () => {
  const s = parseSpec(base(cards(2)));
  assert.equal(s.scenes[0].template, "data-cards");
});

test("template lạ bị từ chối", () => {
  assert.throws(() => parseSpec(base(cards(2), "foo")));
});

test("thiếu sourceId báo đúng đường dẫn", () => {
  const p = cards(2);
  delete p.cards[0].sourceId;
  assert.throws(() => parseSpec(base(p)), /scenes\.0\.props\.cards\.0\.sourceId/);
});

test("status sai bị từ chối", () => {
  assert.throws(() => parseSpec(base(cards(2), "data-cards", "ok")));
});

test("data-cards 4 thẻ bị từ chối", () => {
  assert.throws(() => parseSpec(base(cards(4))));
});

test("compare-bars cần 2 đến 4 cột", () => {
  const bar = { label: "a", value: 1, cueKey: "a", sourceId: "s1" };
  const ok = { kicker: "K", title: "T", unit: "%", bars: [bar, bar] };
  assert.doesNotThrow(() => parseSpec(base(ok, "compare-bars")));
  assert.throws(() => parseSpec(base({ ...ok, bars: [bar] }, "compare-bars")));
});

test("project-close: ghiChu tùy chọn (dòng chữ nhỏ cuối video chỉ hiện khi spec ghi, anh duyệt từng video)", async () => {
  const { ProjectCloseProps } = await import("../src/spec.ts");
  assert.equal(ProjectCloseProps.safeParse({ message: "x" }).success, true);
  assert.equal(ProjectCloseProps.parse({ message: "x", ghiChu: "Thông tin mang tính tham khảo" }).ghiChu, "Thông tin mang tính tham khảo");
});

// --- Mở đầu (hook) và cảnh danh sách có đếm (AGY kiểu 1, anh chọn 15/11/2026) ---
const hookOk = () => ({
  lines: ["Quốc lộ 13", "lên 8 làn"],
  soNhan: "8",
  donVi: "làn xe",
  dongPhu: "từ cầu Vĩnh Bình đến ngã tư Lê Hồng Phong",
  image: { file: "assets/images/phoi-canh-quoc-lo-13.jpg", label: "Phối cảnh minh họa", sourceId: "phoi-canh-ql13" },
});
const withHook = (hook) => ({ ...base(cards(2)), hook });
const muc = (n) =>
  Array.from({ length: n }, (_, i) => ({ ten: `Mục ${i + 1}`, so: "số", cueKey: `m${i + 1}`, sourceId: "s1" }));
const dsProps = (n = 3, extra = {}) => ({ kicker: "Cuối năm 2026", title: "3 công trình về đích", muc: muc(n), ...extra });

test("không có hook thì spec vẫn hợp lệ (video cũ không đổi)", () => {
  assert.equal(parseSpec(base(cards(2))).hook, undefined);
});

test("hook hợp lệ parse đủ trường", () => {
  const h = parseSpec(withHook(hookOk())).hook;
  assert.deepEqual(h.lines, ["Quốc lộ 13", "lên 8 làn"]);
  assert.equal(h.soNhan, "8");
});

test("hook cần 1 đến 3 dòng, ảnh bắt buộc có sourceId", () => {
  assert.throws(() => parseSpec(withHook({ ...hookOk(), lines: [] })), /hook\.lines/);
  assert.throws(() => parseSpec(withHook({ ...hookOk(), lines: ["a", "b", "c", "d"] })), /hook\.lines/);
  const h = hookOk();
  delete h.image.sourceId;
  assert.throws(() => parseSpec(withHook(h)), /hook\.image\.sourceId/);
});

test("danh-sach: 2 đến 5 mục, mỗi mục có cueKey và sourceId", () => {
  assert.equal(parseSpec(base(dsProps(3), "danh-sach")).scenes[0].template, "danh-sach");
  assert.throws(() => parseSpec(base(dsProps(1), "danh-sach")), /muc/);
  assert.throws(() => parseSpec(base(dsProps(6), "danh-sach")), /muc/);
  const p = dsProps(2);
  delete p.muc[1].sourceId;
  assert.throws(() => parseSpec(base(p, "danh-sach")), /muc\.1\.sourceId/);
});

test("danh-sach: kicker, tổng kết và ảnh là tùy chọn", () => {
  const p = dsProps(2);
  delete p.kicker;
  assert.ok(parseSpec(base(p, "danh-sach")));
  const q = dsProps(2, { tongKet: { text: "Dự kiến về đích cuối 2026", cueKey: "a" } });
  assert.equal(parseSpec(base(q, "danh-sach")).scenes[0].props.tongKet.cueKey, "a");
});

// --- nguonCuoi: khung nguồn cuối video ---
test("nguonCuoi: 1 đến 3 dòng, mỗi dòng có tên, ngày dd/mm/yyyy và sourceId; video không khai thì như cũ", () => {
  const ok = { ten: "Tuổi Trẻ", ngay: "12/10/2026", sourceId: "s1" };
  assert.deepEqual(parseSpec({ ...base(cards(2)), nguonCuoi: [ok] }).nguonCuoi, [ok]);
  assert.equal(parseSpec(base(cards(2))).nguonCuoi, undefined);
  assert.throws(() => parseSpec({ ...base(cards(2)), nguonCuoi: [] }), /nguonCuoi/);
  assert.throws(() => parseSpec({ ...base(cards(2)), nguonCuoi: [ok, ok, ok, ok] }), /nguonCuoi/);
  assert.throws(() => parseSpec({ ...base(cards(2)), nguonCuoi: [{ ...ok, ngay: "12-10-2026" }] }), /nguonCuoi\.0\.ngay/);
  assert.throws(() => parseSpec({ ...base(cards(2)), nguonCuoi: [{ ten: "A", ngay: "12/10/2026" }] }), /nguonCuoi\.0\.sourceId/);
});

// --- bang-chung: popup bài báo/thông báo (AGY 16/11/2026) ---
const bcProps = (extra = {}) => ({
  kieu: "toi",
  kicker: "Quốc lộ 13",
  title: "Từ Lái Thiêu về Bình Triệu",
  anhNen: { file: "assets/images/a.jpg", nhan: "Ảnh: Tuổi Trẻ, 10/2026", chuThichRo: "Quốc lộ 13, tháng 10/2026", sourceId: "s1" },
  popup: { file: "assets/images/b.png", nguon: "Tuổi Trẻ", ngay: "05/10/2026", sourceId: "s1" },
  popupCue: "a",
  rangCue: "b",
  ...extra,
});

test("bang-chung: hợp lệ không biểu đồ, kiểu toi hoặc sang", () => {
  assert.equal(parseSpec(base(bcProps(), "bang-chung")).scenes[0].template, "bang-chung");
  assert.ok(parseSpec(base(bcProps({ kieu: "sang" }), "bang-chung")));
  assert.throws(() => parseSpec(base(bcProps({ kieu: "khac" }), "bang-chung")), /kieu/);
});

test("bang-chung: ảnh nền và popup bắt buộc có sourceId, popup có nguồn và ngày", () => {
  const p = bcProps();
  delete p.popup.sourceId;
  assert.throws(() => parseSpec(base(p, "bang-chung")), /popup\.sourceId/);
  const q = bcProps();
  delete q.anhNen.sourceId;
  assert.throws(() => parseSpec(base(q, "bang-chung")), /anhNen\.sourceId/);
  const r = bcProps();
  delete r.popup.ngay;
  assert.throws(() => parseSpec(base(r, "bang-chung")), /popup\.ngay/);
});

test("bang-chung: biểu đồ 2 đến 3 cột, cột là dải (tu, den) hoặc một giá trị", () => {
  const bd = (cot) => ({ tieuDe: "Giá", donVi: "triệu/m²", nguon: "VnExpress", sourceId: "s1", cot });
  const ok = bcProps({ bieuDo: bd([{ nhan: "Trước", tu: 35, den: 40 }, { nhan: "Nay", giaTri: 60 }]) });
  assert.equal(parseSpec(base(ok, "bang-chung")).scenes[0].props.bieuDo.cot.length, 2);
  assert.throws(() => parseSpec(base(bcProps({ bieuDo: bd([{ nhan: "Nay", giaTri: 60 }]) }), "bang-chung")), /cot/);
  assert.throws(() => parseSpec(base(bcProps({ bieuDo: { ...bd([{ nhan: "a", giaTri: 1 }, { nhan: "b", giaTri: 2 }]), sourceId: undefined } }), "bang-chung")), /bieuDo\.sourceId/);
});
