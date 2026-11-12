// Bot nhiều dự án + menu gom nhóm (anh yêu cầu 12/11/2026: bán nhiều dự án, không khóa cứng một dự án; lệnh đỡ rối).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBot } from "../scripts/bot/handlers.mjs";
import { taoDuAn, pidOf } from "../scripts/bot/du-an.mjs";
import { MENU, HELP, buocVideo } from "../scripts/bot/core.mjs";

const CHAT = "42";
const T0 = 1_000_000_000_000;
const msg = (text) => ({ message: { chat: { id: 42, type: "private" }, from: { id: 42 }, date: T0 / 1000, text } });
const press = (data) => ({ callback_query: { id: "q", data, from: { id: 42 }, message: { chat: { id: 42, type: "private" }, date: T0 / 1000, message_id: 9 } } });
const CAP = "---\nstatus: draft\nkenh: [facebook, tiktok]\n---\n## Facebook\nBài FB\n\n## TikTok\nTikTok\n";

function taoRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "botda-"));
  fs.writeFileSync(path.join(root, "config.json"), JSON.stringify({ duAnDangBan: "bcons-newsky" }));
  const da = (ma, ten, videos) => {
    const d = path.join(root, "du-an", ma);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "project.json"), JSON.stringify({ ma, ten }));
    for (const [name, spec] of Object.entries(videos)) {
      fs.mkdirSync(path.join(d, "video", name), { recursive: true });
      fs.writeFileSync(path.join(d, "video", name, "spec.json"), JSON.stringify(spec));
      fs.writeFileSync(path.join(d, "video", name, "caption.md"), CAP);
    }
  };
  // Hai dự án đều có video số 1 (tình huống thật: Central Park 1–8, Newsky 1).
  da("bcons-newsky", "Bcons Newsky", { "01-mat-tien-quoc-lo-13": { so: 1, tieuDe: "Newsky mặt tiền Quốc lộ 13", status: "approved" } });
  da("bcons-central-park", "Bcons Central Park", { "01-dong-nai-ha-tang": { so: 1, tieuDe: "Đồng Nai: FDI, cao tốc", status: "approved" }, "08-cuoi-nam-ve-dich": { so: 8, tieuDe: "Cuối năm", status: "draft" } });
  fs.mkdirSync(path.join(root, "du-an", "_mau"), { recursive: true });
  fs.writeFileSync(path.join(root, "du-an", "_mau", "project.json"), "{}");
  fs.mkdirSync(path.join(root, "out"));
  return root;
}

function setup(root = taoRepo()) {
  const said = [], execs = [], edits = [], claude = [];
  const tg = {
    sendMessage: async (_c, text, extra) => said.push({ text, extra }),
    sendVideo: async () => {}, sendPhotos: async () => {}, sendDocument: async () => {},
    answerCallback: async () => {},
    editMarkup: async (_c, _m, markup) => edits.push(markup),
  };
  const exec = async (cmd, args) => {
    execs.push([cmd, ...args].join(" "));
    if (cmd === "git" && args[0] === "status") return { code: 0, out: "" };
    return { code: 0, out: "ok" };
  };
  const duAn = taoDuAn({ root, file: path.join(root, "out", "du-an-dang-chon.json") });
  const bot = createBot({
    tg, chatId: CHAT, duAn, outDir: path.join(root, "out"), repoRoot: root, remotionDir: root, exec,
    runClaude: async (prompt) => (claude.push(prompt), { text: "Xong.", sessionId: "abc-123", isError: false }),
    sendApproved: async () => {}, now: () => T0, startedAt: T0, cancel: () => true,
    chayPhieu: async (a) => ({ png: `/x/${path.basename(a.projDir)}-${a.ma}.png` }),
  });
  const nut = (m) => (m?.extra?.reply_markup?.inline_keyboard ?? []).flat();
  return { bot, said, execs, edits, claude, root, duAn, nut, last: () => said.at(-1) };
}

test("taoDuAn: liệt kê dự án thật (bỏ _mau), mặc định theo config.json, nhớ lựa chọn qua lần mở sau", () => {
  const root = taoRepo();
  const file = path.join(root, "out", "chon.json");
  const d = taoDuAn({ root, file });
  assert.deepEqual(d.list().map((x) => x.ma), ["bcons-central-park", "bcons-newsky"]);
  assert.equal(d.get().ma, "bcons-newsky");
  assert.equal(d.get().ten, "Bcons Newsky");
  d.set("bcons-central-park");
  assert.equal(taoDuAn({ root, file }).get().ma, "bcons-central-park", "mở lại bot (/capnhat) vẫn nhớ");
  assert.throws(() => d.set("khong-co"));
  assert.throws(() => d.set("_mau"));
  // File nhớ hỏng hoặc trỏ dự án đã xóa → quay về config.json, không sập.
  fs.writeFileSync(file, "{hỏng");
  assert.equal(taoDuAn({ root, file }).get().ma, "bcons-newsky");
  fs.writeFileSync(file, JSON.stringify({ ma: "da-xoa" }));
  assert.equal(taoDuAn({ root, file }).get().ma, "bcons-newsky");
  assert.match(pidOf("bcons-newsky"), /^[0-9a-f]{6}$/);
  assert.notEqual(pidOf("bcons-newsky"), pidOf("bcons-central-park"));
});

test("menu gõ '/' chỉ còn các mục gom nhóm; lệnh cũ không nằm trong menu nhưng vẫn có trong hướng dẫn và vẫn chạy", () => {
  assert.deepEqual(MENU.map((m) => m.command), ["duan", "video", "khach", "nghiencuu", "may", "huy", "huongdan"]);
  for (const c of ["render", "giong", "storyboard", "xem", "duyet", "phieu", "kiemgia", "gemini", "baocao", "capnhat", "chuyenmay", "sfx", "moi", "danhsach"]) assert.ok(HELP.includes(`/${c}`), c);
  const s = setup();
  for (const c of ["render", "giong", "storyboard", "xem", "duyet", "phieu", "kiemgia", "gemini", "baocao", "capnhat", "chuyenmay", "sfx", "moi", "danhsach", ...MENU.map((m) => m.command)]) assert.ok(s.bot.commandNames.includes(c), c);
});

test("/duan: hiện nút từng dự án, đánh dấu dự án đang làm; bấm thì đổi ngay và nhớ", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/duan"));
  const b = s.nut(s.last());
  assert.deepEqual(b.map((x) => x.callback_data), ["da:bcons-central-park", "da:bcons-newsky"]);
  assert.match(b[1].text, /✅.*Bcons Newsky/);
  assert.doesNotMatch(b[0].text, /✅/);
  await s.bot.handleUpdate(press("da:bcons-central-park"));
  assert.match(s.last().text, /Bcons Central Park/);
  assert.equal(s.duAn.get().ma, "bcons-central-park");
  await s.bot.handleUpdate(msg("/danhsach"));
  assert.match(s.last().text, /🏢 Bcons Central Park/);
  assert.match(s.last().text, /Đồng Nai: FDI/);
  assert.doesNotMatch(s.last().text, /Quốc lộ 13/);
  // gõ thẳng tên cũng được
  await s.bot.handleUpdate(msg("/duan newsky"));
  assert.equal(s.duAn.get().ma, "bcons-newsky");
  await s.bot.handleUpdate(press("da:khong-co"));
  assert.match(s.last().text, /Không thấy dự án/);
  assert.equal(s.duAn.get().ma, "bcons-newsky");
});

test("lệnh con chạy đúng dự án đang chọn: cùng video số 1 nhưng hai dự án ra hai video khác nhau, kèm --du-an", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/storyboard 1"));
  assert.ok(s.execs.some((e) => e === "npm run storyboard -- --du-an bcons-newsky 01-mat-tien-quoc-lo-13"), s.execs.join("|"));
  await s.bot.handleUpdate(msg("/duan bcons-central-park"));
  await s.bot.handleUpdate(msg("/storyboard 1"));
  assert.ok(s.execs.some((e) => e === "npm run storyboard -- --du-an bcons-central-park 01-dong-nai-ha-tang"), s.execs.join("|"));
  await s.bot.handleUpdate(msg("/kiemgia"));
  assert.ok(s.execs.includes("npm run kiem-gia -- --du-an bcons-central-park"));
  await s.bot.handleUpdate(msg("/gemini lãi vay"));
  assert.ok(s.execs.includes("npm run gemini -- --du-an bcons-central-park lãi vay"));
  await s.bot.handleUpdate(msg("/render 1 khongnhac"));
  assert.ok(s.execs.includes("npm run render:drive -- --du-an bcons-central-park 01-dong-nai-ha-tang --khong-nhac"));
});

test("/giong hỏi Đồng ý có ghi tên dự án; đổi dự án trước khi bấm thì nút cũ hết hiệu lực (không tạo giọng nhầm dự án)", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/giong 1"));
  assert.match(s.last().text, /Bcons Newsky/);
  const ok = s.nut(s.last())[0].callback_data;
  await s.bot.handleUpdate(msg("/duan bcons-central-park"));
  await s.bot.handleUpdate(press(ok));
  assert.match(s.last().text, /hết hiệu lực/);
  assert.ok(!s.execs.some((e) => e.includes("voice")));
  // làm lại ở đúng dự án thì chạy
  await s.bot.handleUpdate(msg("/giong 1"));
  await s.bot.handleUpdate(press(s.nut(s.last())[0].callback_data));
  assert.ok(s.execs.includes("npm run voice -- --du-an bcons-central-park 01-dong-nai-ha-tang"));
});

test("đang chạy việc thì không cho đổi dự án (việc đang chạy không bị lẫn dự án)", async () => {
  const s = setup();
  let tha;
  const root = s.root;
  const said = s.said;
  const duAn = s.duAn;
  const bot = createBot({
    tg: { sendMessage: async (_c, text, extra) => said.push({ text, extra }), answerCallback: async () => {}, sendPhotos: async () => {} },
    chatId: CHAT, duAn, outDir: path.join(root, "out"), repoRoot: root, remotionDir: root,
    exec: () => new Promise((r) => (tha = () => r({ code: 1, out: "dừng" }))),
    now: () => T0, startedAt: T0,
  });
  const p = bot.handleUpdate(msg("/storyboard 1"));
  await new Promise((r) => setTimeout(r, 20));
  await bot.handleUpdate(msg("/duan bcons-central-park"));
  assert.match(said.at(-1).text, /Đang làm.*đợi xong|đợi xong/i);
  assert.equal(duAn.get().ma, "bcons-newsky");
  tha();
  await p;
});

test("/video: danh sách có nhãn dự án, mỗi video một nút; bấm ra thẻ video với bước kế tiếp nổi lên đầu", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/video"));
  assert.match(s.last().text, /🏢 Bcons Newsky/);
  const pid = pidOf("bcons-newsky");
  const b = s.nut(s.last());
  assert.equal(b[0].callback_data, `v:${pid}:1`);
  assert.match(b[0].text, /1 · Newsky mặt tiền Quốc lộ 13/);
  await s.bot.handleUpdate(press(`v:${pid}:1`));
  const the = s.last();
  assert.match(the.text, /Kịch bản ✅/);
  assert.match(the.text, /Giọng ⬜/);
  const nb = s.nut(the);
  assert.equal(nb[0].callback_data, `va:${pid}:giong:1`, "kịch bản đã duyệt, chưa có giọng → bước kế là tạo giọng");
  assert.match(nb[0].text, /giọng/i);
  assert.ok(nb.some((x) => x.callback_data === `va:${pid}:storyboard:1`));
  // bấm bước kế: vẫn hỏi Đồng ý vì tốn credit
  await s.bot.handleUpdate(press(`va:${pid}:giong:1`));
  assert.match(s.last().text, /TỐN CREDIT/);
  assert.ok(!s.execs.some((e) => e.includes("voice")));
});

test("buocVideo: bước kế tiếp theo tiến trình kịch bản → giọng → render → duyệt", () => {
  const s = setup();
  const cp = path.join(s.root, "du-an", "bcons-central-park");
  const out = path.join(s.root, "out");
  assert.equal(buocVideo("08-cuoi-nam-ve-dich", cp, out).tiep, "kichban");
  const b1 = buocVideo("01-dong-nai-ha-tang", cp, out);
  assert.deepEqual([b1.kichBan, b1.giong, b1.mp4, b1.duyet, b1.tiep], [true, false, false, false, "giong"]);
  fs.writeFileSync(path.join(cp, "video", "01-dong-nai-ha-tang", "timestamps.json"), "{}");
  assert.equal(buocVideo("01-dong-nai-ha-tang", cp, out).tiep, "render");
  fs.writeFileSync(path.join(out, "01-dong-nai-ha-tang.mp4"), "v");
  assert.equal(buocVideo("01-dong-nai-ha-tang", cp, out).tiep, "duyet");
});

test("nút video của dự án khác (tin cũ trước khi đổi dự án) không chạy nhầm sang dự án đang chọn", async () => {
  const s = setup();
  const pidNs = pidOf("bcons-newsky");
  await s.bot.handleUpdate(msg("/duan bcons-central-park"));
  for (const data of [`v:${pidNs}:1`, `va:${pidNs}:render:1`, `tick:render:1:${pidNs}`, `tick:render:ok:${pidNs}`, "tick:render:1"]) {
    await s.bot.handleUpdate(press(data));
    assert.match(s.last().text, /dự án khác|tin cũ/i, data);
  }
  assert.ok(!s.execs.some((e) => e.includes("render:drive")));
});

test("menu tick nhiều video mang mã dự án; ▶ Làm chạy đúng video của dự án đang chọn", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/duan bcons-central-park"));
  await s.bot.handleUpdate(msg("/render"));
  const pid = pidOf("bcons-central-park");
  const b = s.nut(s.last());
  assert.equal(b[0].callback_data, `tick:render:1:${pid}`);
  await s.bot.handleUpdate(press(`tick:render:8:${pid}`));
  await s.bot.handleUpdate(press(`tick:render:ok:${pid}`));
  assert.ok(s.execs.includes("npm run render:drive -- --du-an bcons-central-park 08-cuoi-nam-ve-dich"));
});

test("/khach, /nghiencuu, /may: nút mở đúng việc; /may có cập nhật, chuyển máy, hiệu ứng, trò chuyện mới", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/khach"));
  assert.match(s.last().text, /\/phieu <mã căn> <PTTT>/);
  assert.deepEqual(s.nut(s.last()).map((x) => x.callback_data), ["m:kiemgia"]);
  await s.bot.handleUpdate(press("m:kiemgia"));
  assert.ok(s.execs.includes("npm run kiem-gia -- --du-an bcons-newsky"));
  await s.bot.handleUpdate(msg("/nghiencuu"));
  assert.match(s.last().text, /\/gemini <chủ đề>/);
  assert.deepEqual(s.nut(s.last()).map((x) => x.callback_data), ["m:baocao"]);
  await s.bot.handleUpdate(msg("/may"));
  assert.deepEqual(s.nut(s.last()).map((x) => x.callback_data), ["m:capnhat", "m:chuyenmay", "m:sfx", "m:moi"]);
  await s.bot.handleUpdate(press("m:moi"));
  assert.match(s.last().text, /trò chuyện Claude mới/);
  // nút m: chỉ nhận lệnh trong danh sách cho phép
  await s.bot.handleUpdate(press("m:giong"));
  assert.ok(!s.execs.some((e) => e.includes("voice")));
});

test("giao việc cho Claude: lời nhắn kèm dự án đang làm để Claude không làm nhầm dự án", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("viết caption cho video 1"));
  assert.match(s.claude[0], /bcons-newsky/);
  assert.match(s.claude[0], /viết caption cho video 1/);
});

test("/phieu dùng dự án đang chọn; lỗi thì nhắc đang ở dự án nào (tin báo khách có thể của dự án khác)", async () => {
  const s = setup();
  const docs = [];
  s.bot._tg.sendDocument = async (_c, file) => docs.push(file);
  await s.bot.handleUpdate(msg("/phieu B1.3-01 09"));
  assert.match(docs[0], /bcons-newsky-B1\.3-01\.png$/);
});

test("/huongdan và lệnh lạ: hướng dẫn theo nhóm, có dòng dự án đang làm", async () => {
  const s = setup();
  await s.bot.handleUpdate(msg("/huongdan"));
  assert.match(s.last().text, /🏢 Bcons Newsky/);
  assert.match(s.last().text, /\/video/);
});
