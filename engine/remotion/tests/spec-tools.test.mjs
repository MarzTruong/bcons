import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { REPO_ROOT } from "../scripts/project.mjs";
import {
  resolveSpecPath,
  readSourceIds,
  collectSourceIds,
  checkSources,
  assertApproved,
  parseMarkup,
} from "../scripts/spec-tools.mjs";

const md = `# X\n\n## Bảng nguồn\n\n| id | Số liệu | Ngày | Nguồn | Link |\n| --- | --- | --- | --- | --- |\n| s1 | a | 1 | n | l |\n| s2 | b | 2 | n | |\n\n## Khác\n| s9 | không tính |\n`;
const spec = (status = "draft", ids = ["s1", "s9"]) => ({
  name: "demo",
  status,
  scenes: [
    {
      id: "scene1",
      template: "data-cards",
      markup: "x",
      cues: {},
      props: { kicker: "", title: "", cards: ids.map((s) => ({ tag: "", big: "", sub: "", cueKey: "a", sourceId: s })) },
    },
  ],
});

test("resolveSpecPath từ chối tên có ..", () => {
  assert.throws(() => resolveSpecPath("../x"));
  assert.throws(() => resolveSpecPath("A b"));
});
test("resolveSpecPath trả đường dẫn du-an/<mã>/video/<name>/spec.json", () => {
  assert.match(resolveSpecPath("01-dong-nai-ha-tang", path.join(REPO_ROOT, "du-an", "bcons-central-park")).replaceAll("\\", "/"), /du-an\/bcons-central-park\/video\/01-dong-nai-ha-tang\/spec\.json$/);
});
test("readSourceIds chỉ đọc bảng dưới '## Bảng nguồn'", () => {
  assert.deepEqual(readSourceIds(md), ["s1", "s2"]);
});
test("collectSourceIds gom mọi sourceId", () => {
  assert.deepEqual(collectSourceIds(spec()).sort(), ["s1", "s9"]);
});
test("checkSources báo id thiếu", () => {
  assert.deepEqual(checkSources(spec(), md), { ok: false, missing: ["s9"] });
  assert.deepEqual(checkSources(spec("draft", ["s1"]), md), { ok: true, missing: [] });
});
test("assertApproved chặn draft", () => {
  assert.throws(() => assertApproved(spec("draft")), /draft/);
  assert.doesNotThrow(() => assertApproved(spec("approved")));
});
test("parseMarkup tách chữ hiển thị và chữ đọc", () => {
  assert.deepEqual(parseMarkup("gần 2,4{hai phẩy bốn} tỷ -{} x"), [
    { show: "gần", say: "gần" },
    { show: "2,4", say: "hai phẩy bốn" },
    { show: "tỷ", say: "tỷ" },
    { show: "-", say: "" },
    { show: "x", say: "x" },
  ]);
});

import { readSourceRows, checkSourceLinks, checkCues, checkTimestamps } from "../scripts/spec-tools.mjs";

test("readSourceIds dừng ở mọi tiêu đề, kể cả ###", () => {
  const m = `## Bảng nguồn\n\n| id | x |\n| --- | --- |\n| s1 | a |\n\n### Số đã loại\n\n| id | x |\n| --- | --- |\n| s7 | b |\n`;
  assert.deepEqual(readSourceIds(m), ["s1"]);
});

test("checkSourceLinks chỉ nhận link http(s) cho id đang dùng", () => {
  const m = `## Bảng nguồn\n\n| id | Số liệu | Ngày | Nguồn | Link |\n| --- | --- | --- | --- | --- |\n| s1 | a | 1 | n | https://x.vn/a |\n| s9 | b | 2 | n | chưa có link |\n`;
  assert.deepEqual(checkSourceLinks(spec("approved", ["s1", "s9"]), m), { ok: false, unlinked: ["s9"] });
  assert.deepEqual(checkSourceLinks(spec("approved", ["s1"]), m), { ok: true, unlinked: [] });
  assert.equal(readSourceRows(m)[0].link, "https://x.vn/a");
});

const cueSpec = (cues, cueKey = "a", markup = "một, hai và ba.") => ({
  name: "demo",
  status: "approved",
  scenes: [
    {
      id: "scene1",
      template: "data-cards",
      markup,
      cues,
      props: {
        kicker: "",
        title: "",
        cards: [1, 2].map((i) => ({ tag: "", big: "", sub: "", cueKey: i === 1 ? cueKey : "b", offset: 0, sourceId: "s1" })),
      },
    },
  ],
});

test("checkCues báo cueKey thiếu trong cues", () => {
  const errs = checkCues(cueSpec({ a: "một," }));
  assert.equal(errs.length, 1);
  assert.match(errs[0], /scene1.*"b"/);
});
test("checkCues báo chữ cue không có trong lời bình (kể cả dấu câu)", () => {
  const errs = checkCues(cueSpec({ a: "một", b: "hai" }));
  assert.match(errs.join("\n"), /scene1.*"một"/s);
});
test("checkCues pass khi hợp lệ", () => {
  assert.deepEqual(checkCues(cueSpec({ a: "một,", b: "hai" })), []);
});
test("checkCues yêu cầu cues.value cho stat-hero", () => {
  const s = {
    name: "demo",
    status: "approved",
    scenes: [{ id: "scene1", template: "stat-hero", markup: "x", cues: {}, props: { sourceId: "s1" } }],
  };
  assert.match(checkCues(s).join("\n"), /value/);
});

test("checkTimestamps bắt lệch số cảnh, id và lời đọc", () => {
  const s = cueSpec({ a: "một,", b: "hai" });
  const ok = { scenes: [{ id: "scene1", speech: "một, hai và ba." }] };
  assert.deepEqual(checkTimestamps(s, ok), []);
  assert.match(checkTimestamps(s, { scenes: [] }).join("\n"), /số cảnh/);
  assert.match(checkTimestamps(s, { scenes: [{ id: "x", speech: "một, hai và ba." }] }).join("\n"), /id/);
  assert.match(checkTimestamps(s, { scenes: [{ id: "scene1", speech: "cũ" }] }).join("\n"), /lời bình.*generate-voice/s);
});

test("checkDoubledNumber: số đứng trước đơn vị có ngoặc đọc lại số ('15 km{mười lăm ki-lô-mét}') bị chặn (video 8 bị đọc lặp 15, anh báo 10/11/2026)", async () => {
  const { checkDoubledNumber } = await import("../scripts/spec-tools.mjs");
  const mk = (markup) => ({ scenes: [{ id: "scene2", markup }] });
  const cu = "Gần nhất là Vành đai 3{ba} đoạn trên cao, gần 15 km{mười lăm ki-lô-mét} tới nút giao Tân Vạn, mục tiêu thông xe trong tháng 11.{mười một.}";
  const cu4 = "Từ dự án tới sân bay khoảng 33 km{ba mươi ba ki-lô-mét} đường xe chạy.";
  assert.equal(checkDoubledNumber(mk(cu)).length, 1);
  assert.match(checkDoubledNumber(mk(cu4))[0], /33.*đọc lặp/);
  const moi = "Gần nhất là Vành đai 3{ba} đoạn trên cao, gần 15{mười lăm} km{ki-lô-mét} tới nút giao Tân Vạn, mục tiêu thông xe trong tháng 11.{mười một.}";
  assert.deepEqual(checkDoubledNumber(mk(moi)), []);
  assert.deepEqual(checkDoubledNumber(mk("thấp hơn mức 9,5{chín phẩy năm} đến 11,5%{mười một phẩy năm phần trăm} của quý III.{ba.}")), []);
});

// --- Kiểm nhịp và hook (cảnh báo, không chặn; 15/11/2026) ---
import fs from "node:fs";
import { checkPacing, PACING } from "../scripts/spec-tools.mjs";

const mk = (markups) => ({
  name: "demo",
  status: "draft",
  scenes: markups.map((m, i) => ({ id: `scene${i + 1}`, template: "stat-hero", markup: m, cues: {}, props: {} })),
});
const words = (n) => Array.from({ length: n }, () => "chữ").join(" ");

test("PACING giữ đúng ngưỡng đã duyệt", () => {
  assert.deepEqual(PACING, { openingWords: 14, totalWords: 100, sceneSeconds: 8 });
});

test("cảnh 1 gọn, có số sớm, không cảnh báo", () => {
  assert.deepEqual(checkPacing(mk(["Quốc lộ 13 lên 8{tám} làn xe.", words(20)])), []);
});

test("cảnh 1 dài hơn 14 chữ trước con số đầu thì cảnh báo", () => {
  const w = checkPacing(mk([`${words(15)} 8{tám} làn.`]));
  assert.equal(w.length > 0, true);
  assert.match(w.join(" "), /cảnh 1/i);
});

test("cảnh 1 không có số nào: tính cả cảnh", () => {
  assert.match(checkPacing(mk([words(20)])).join(" "), /cảnh 1/i);
  assert.deepEqual(checkPacing(mk([words(10)])), []);
});

test("tổng lời hơn 100 chữ thì cảnh báo", () => {
  const w = checkPacing(mk(["8{tám} làn.", words(50), words(50)]));
  assert.match(w.join(" "), /tổng/i);
});

test("một cảnh ước tính hơn 8 giây thì cảnh báo", () => {
  // 40 chữ x 0,23 s ≈ 9,2 s
  const w = checkPacing(mk(["8{tám} làn.", words(40)]));
  assert.match(w.join(" "), /scene2/);
});

test("video thật: Newsky 01 (4 cảnh) chạy được và chỉ trả cảnh báo là chuỗi", () => {
  const p = path.join(REPO_ROOT, "du-an/bcons-newsky/video/01-mat-tien-quoc-lo-13/spec.json");
  const w = checkPacing(JSON.parse(fs.readFileSync(p, "utf8")));
  assert.ok(Array.isArray(w) && w.every((x) => typeof x === "string"));
  assert.match(w.join(" "), /tổng/i); // video này 109 chữ lời, vượt ngưỡng 100
});

// --- Kiểm hook và danh-sach (15/11/2026) ---
import { checkHook } from "../scripts/spec-tools.mjs";

const hookSpec = (hook, markup = "Quốc lộ 13 đang mở rộng lên 8{tám} làn xe.") => ({
  name: "demo",
  status: "draft",
  hook,
  scenes: [{ id: "scene1", template: "stat-hero", markup, cues: {}, props: {} }],
});
const hk = (extra = {}) => ({ lines: ["Quốc lộ 13", "lên 8 làn"], soNhan: "8", donVi: "làn xe", ...extra });

test("checkHook: không có hook thì không lỗi", () => {
  assert.deepEqual(checkHook({ scenes: [] }, "/x"), []);
});

test("checkHook: hook hợp lệ, số khớp lời bình", () => {
  assert.deepEqual(checkHook(hookSpec(hk()), "/x"), []);
});

test("checkHook: tiêu đề quá 7 chữ bị báo", () => {
  const e = checkHook(hookSpec(hk({ lines: ["Quốc lộ 13 sắp mở rộng", "lên 8 làn xe nhé"] })), "/x");
  assert.match(e.join(" "), /7 chữ/);
});

test("checkHook: số nhấn không có trong video bị báo", () => {
  const e = checkHook(hookSpec(hk({ soNhan: "9" })), "/x");
  assert.match(e.join(" "), /soNhan/);
});

test("checkHook: ảnh không tồn tại bị báo", () => {
  const e = checkHook(hookSpec(hk({ image: { file: "assets/images/khong-co.jpg", label: "x", sourceId: "s" } })), "/x");
  assert.match(e.join(" "), /không thấy file/);
});

test("checkCues: danh-sach đòi cue của từng mục và của tổng kết", () => {
  const sc = (cues) => ({
    name: "d",
    status: "draft",
    scenes: [
      {
        id: "scene1",
        template: "danh-sach",
        markup: "Vành đai 3 xong, rồi Tân Hiệp.",
        cues,
        props: {
          title: "T",
          muc: [
            { ten: "a", so: "b", cueKey: "m1", sourceId: "s" },
            { ten: "c", so: "d", cueKey: "m2", sourceId: "s" },
          ],
          tongKet: { text: "t", cueKey: "tk" },
        },
      },
    ],
  });
  assert.match(checkCues(sc({ m1: "Vành" })).join(" "), /m2/);
  assert.deepEqual(checkCues(sc({ m1: "Vành", m2: "Tân", tk: "Hiệp." })), []);
});

// --- checkNguonCuoi: tên và ngày trên hình phải khớp bảng nguồn ---
import { checkNguonCuoi } from "../scripts/spec-tools.mjs";

const bang = `## Bảng nguồn
| id | Số liệu | Ngày công bố | Nguồn | Link | Ghi chú |
|---|---|---|---|---|---|
| vanh-dai-3 | x | 04/11/2026 | CafeF (dẫn VTC News) | https://a | |
| tan-hiep | y | 01/11/2026 | Pháp Luật Plus | https://b | |
| san-bay | z | 30/10/2026 | CafeF (dẫn VTV) | https://c | |
`;
const nc = (list) => ({ nguonCuoi: list });

test("checkNguonCuoi: không khai thì không lỗi", () => {
  assert.deepEqual(checkNguonCuoi({}, bang), []);
});

test("checkNguonCuoi: video 8 thật (Pháp Luật Plus 01/11, CafeF 30/10 và 04/11) khớp bảng nguồn", () => {
  const e = checkNguonCuoi(
    nc([
      { ten: "Pháp Luật Plus", ngay: "01/11/2026", sourceId: "tan-hiep" },
      { ten: "CafeF", ngay: "30/10/2026", sourceId: "san-bay" },
      { ten: "CafeF", ngay: "04/11/2026", sourceId: "vanh-dai-3" },
    ]),
    bang,
  );
  assert.deepEqual(e, []);
});

test("checkNguonCuoi: sai ngày, sai tên hoặc sourceId không có bị báo", () => {
  assert.match(checkNguonCuoi(nc([{ ten: "CafeF", ngay: "05/11/2026", sourceId: "vanh-dai-3" }]), bang).join(" "), /ngày/);
  assert.match(checkNguonCuoi(nc([{ ten: "Tuổi Trẻ", ngay: "04/11/2026", sourceId: "vanh-dai-3" }]), bang).join(" "), /tên/);
  assert.match(checkNguonCuoi(nc([{ ten: "CafeF", ngay: "04/11/2026", sourceId: "khong-co" }]), bang).join(" "), /khong-co/);
});

test("checkNguonCuoi: bỏ dấu và hoa/thường khi so tên", () => {
  assert.deepEqual(checkNguonCuoi(nc([{ ten: "PHAP LUAT PLUS", ngay: "01/11/2026", sourceId: "tan-hiep" }]), bang), []);
});

test("readSourceRows trả thêm ngày và nguồn của từng hàng", () => {
  const r = readSourceRows(bang).find((x) => x.id === "tan-hiep");
  assert.equal(r.ngay, "01/11/2026");
  assert.equal(r.nguon, "Pháp Luật Plus");
  assert.equal(r.link, "https://b");
});

// --- bang-chung (16/11/2026) ---
import { checkGeoFiles } from "../scripts/spec-tools.mjs";
import os from "node:os";

const bcSpec = (cues, props = {}) => ({
  name: "d",
  status: "draft",
  scenes: [
    {
      id: "scene1",
      template: "bang-chung",
      markup: "Theo Tuổi Trẻ ngày 5/10, đường đang thi công.",
      cues,
      props: {
        kieu: "toi",
        kicker: "K",
        title: "T",
        anhNen: { file: "assets/images/a.jpg", nhan: "n", sourceId: "s" },
        popup: { file: "assets/images/b.png", nguon: "Tuổi Trẻ", ngay: "05/10/2026", sourceId: "s" },
        popupCue: "p",
        rangCue: "r",
        ...props,
      },
    },
  ],
});

test("checkCues: bang-chung đòi cue popup và cue thu ra", () => {
  assert.match(checkCues(bcSpec({ p: "Theo" })).join(" "), /"r"/);
  assert.deepEqual(checkCues(bcSpec({ p: "Theo", r: "đường" })), []);
});

test("checkGeoFiles: bang-chung báo thiếu ảnh nền và ảnh popup, báo ảnh giữ chỗ", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bc-"));
  fs.mkdirSync(path.join(dir, "assets/images"), { recursive: true });
  const e = checkGeoFiles(bcSpec({ p: "Theo", r: "đường" }), dir).join(" ");
  assert.match(e, /a\.jpg: không thấy file/);
  assert.match(e, /b\.png: không thấy file/);
  fs.writeFileSync(path.join(dir, "assets/images/a.jpg"), "x");
  fs.writeFileSync(path.join(dir, "assets/images/placeholder-b.png"), "x");
  const s = bcSpec({ p: "Theo", r: "đường" }, { popup: { file: "assets/images/placeholder-b.png", nguon: "n", ngay: "d", sourceId: "s" } });
  assert.match(checkGeoFiles(s, dir).join(" "), /giữ chỗ/);
});
