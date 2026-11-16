// Xem trước lời đọc trước khi tạo giọng (anh yêu cầu 16/11/2026 sau khi giọng video 2 cảnh 3 bị lặp "hai hai" hai lần).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loiDocCacCanh, canhBaoLoiDoc, xemTruocLoiDoc, canhBaoChanCuaVideo, laCanhBaoChan } from "../scripts/loi-doc.mjs";
import { createBot } from "../scripts/bot/handlers.mjs";
import { taoDuAn } from "../scripts/bot/du-an.mjs";

const spec2 = {
  scenes: [
    { id: "scene1", markup: "Mua căn 3{ba} tỷ, có phải cầm sẵn 3{ba} tỷ không? Không. Bước đầu chỉ 150{một trăm năm mươi} triệu." },
    { id: "scene3", markup: "Tiền đóng rải từng đợt, từ lúc ký tới lúc nhận nhà. Em nói luôn: tiền sẽ nằm đó gần 2{hai} năm, anh chị tính trước nha." },
  ],
};

test("loiDocCacCanh: đúng chữ sẽ gửi cho giọng đọc (phần trong ngoặc, số đã đọc ra), không phải chữ hiển thị", () => {
  const r = loiDocCacCanh(spec2);
  assert.equal(r[0].speech, "Mua căn ba tỷ, có phải cầm sẵn ba tỷ không? Không. Bước đầu chỉ một trăm năm mươi triệu.");
  assert.equal(r[1].id, "scene3");
  assert.match(r[1].speech, /gần hai năm/);
});

test("canhBaoLoiDoc: từ lặp liền nhau ('hai hai'), câu quá dài, cụm đã từng bị lặp khi đọc", () => {
  assert.deepEqual(canhBaoLoiDoc("Cho thuê trong hai năm. Ví dụ ba tỷ chưa vê a tê."), []);
  const lap = canhBaoLoiDoc("Đóng hai hai tháng sau.");
  assert.ok(lap.some((w) => /lặp/i.test(w) && /hai hai/.test(w)), lap.join("|"));
  const dai = canhBaoLoiDoc("Cả căn chia ra ba phần và ngân hàng lo khoảng một nửa còn phần mình là vốn tự có trước khi nhận nhà cùng một đợt cuối lúc nhận nhà luôn.");
  assert.ok(dai.some((w) => /dài/i.test(w)), dai.join("|"));
  // dấu câu không che từ lặp
  assert.ok(canhBaoLoiDoc("Đóng hai, hai tháng.").some((w) => /lặp/i.test(w)));
  // hỏi rồi đáp qua dấu chấm hỏi là chủ ý (hook video 2): không báo
  assert.deepEqual(canhBaoLoiDoc("Có phải cầm sẵn ba tỷ không? Không."), []);
  // số đứng liền nhau hợp lệ ("một trăm năm mươi") không bị coi là lặp
  assert.deepEqual(canhBaoLoiDoc("Chỉ một trăm năm mươi triệu."), []);
  // cụm đã bị lỗi thật: báo trước để anh đổi câu
  const cum = canhBaoLoiDoc("Tiền đóng rải từng đợt, từ lúc ký tới lúc nhận nhà.");
  assert.ok(cum.some((w) => /từng gặp|đã từng/i.test(w)), cum.join("|"));
});

test("xemTruocLoiDoc: gọn cho Telegram, mỗi cảnh một dòng kèm cảnh báo; không có cảnh báo thì ghi rõ", () => {
  const t = xemTruocLoiDoc(spec2);
  assert.match(t, /Cảnh 1/);
  assert.match(t, /Cảnh 3/);
  assert.match(t, /một trăm năm mươi triệu/);
  assert.match(t, /⚠️/, "cảnh 3 chứa cụm từng lỗi");
  assert.ok(t.length < 3500);
  assert.match(xemTruocLoiDoc({ scenes: [spec2.scenes[0]] }), /Không thấy chỗ dễ lặp/);
  // chỉ xem một vài cảnh
  const mot = xemTruocLoiDoc(spec2, ["scene3"]);
  assert.doesNotMatch(mot, /Cảnh 1/);
  assert.match(mot, /Cảnh 3/);
});

test("canhBaoChanCuaVideo: chỉ chặn từ lặp và cụm đã từng lỗi; câu dài không chặn", () => {
  assert.ok(canhBaoChanCuaVideo(spec2).some((w) => /Cảnh 3/.test(w) && /Cụm/.test(w)));
  assert.deepEqual(canhBaoChanCuaVideo({ scenes: [spec2.scenes[0]] }), []);
  const dai = { scenes: [{ id: "scene1", markup: "Cả căn chia ra ba phần và ngân hàng lo khoảng một nửa còn phần mình là vốn tự có trước khi nhận nhà cùng một đợt cuối lúc nhận nhà luôn." }] };
  assert.deepEqual(canhBaoChanCuaVideo(dai), []);
  assert.deepEqual(canhBaoChanCuaVideo(spec2, ["scene1"]), [], "chỉ xét cảnh được chọn");
});

function dungBot(sceneList) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ld-"));
  const d = path.join(root, "du-an", "bcons-newsky");
  fs.mkdirSync(path.join(d, "video", "02-von-mua-can-nao"), { recursive: true });
  fs.writeFileSync(path.join(d, "project.json"), JSON.stringify({ ma: "bcons-newsky", ten: "Bcons Newsky" }));
  fs.writeFileSync(path.join(d, "video", "02-von-mua-can-nao", "spec.json"), JSON.stringify({ so: 2, tieuDe: "Mua căn 3 tỷ", status: "approved", scenes: sceneList }));
  fs.writeFileSync(path.join(root, "config.json"), JSON.stringify({ duAnDangBan: "bcons-newsky" }));
  fs.mkdirSync(path.join(root, "out"));
  const said = [], execs = [];
  const tg = { sendMessage: async (_c, text, extra) => said.push({ text, extra }), answerCallback: async () => {} };
  const T0 = 1e12;
  const bot = createBot({ tg, chatId: "42", duAn: taoDuAn({ root, file: path.join(root, "out", "c.json") }), outDir: path.join(root, "out"), repoRoot: root, remotionDir: root, exec: async (c, a) => (execs.push([c, ...a].join(" ")), { code: 0, out: "" }), now: () => T0, startedAt: T0 });
  const msg = (text) => ({ message: { chat: { id: 42, type: "private" }, from: { id: 42 }, date: T0 / 1000, text } });
  const press = (data) => ({ callback_query: { id: "q", data, from: { id: 42 }, message: { chat: { id: 42, type: "private" }, date: T0 / 1000 } } });
  return { bot, said, execs, msg, press };
}

test("bot: /giong hỏi Đồng ý kèm lời đọc; không có cảnh báo chặn thì cho tạo; /loidoc chỉ xem, không tốn credit", async () => {
  const b = dungBot([spec2.scenes[0]]);
  await b.bot.handleUpdate(b.msg("/giong 2"));
  const hoi = b.said.at(-1);
  assert.match(hoi.text, /TỐN CREDIT/);
  assert.match(hoi.text, /Bước đầu chỉ một trăm năm mươi triệu/);
  assert.ok((hoi.extra?.reply_markup?.inline_keyboard ?? []).flat().some((x) => /Đồng ý/.test(x.text)), "có nút Đồng ý");
  assert.ok(!b.execs.some((e) => e.includes("voice")));
  b.said.length = 0;
  await b.bot.handleUpdate(b.msg("/loidoc 2"));
  assert.match(b.said.at(-1).text, /Cảnh 1/);
  assert.ok(!b.execs.some((e) => e.includes("voice")));
});

test("bot: lời đọc có từ lặp hoặc cụm đã từng lỗi → /giong KHÔNG hỏi Đồng ý, báo nhờ Claude sửa câu (anh không phải tự đọc); 'chapnhan' để cố tình tạo", async () => {
  const b = dungBot(spec2.scenes);
  await b.bot.handleUpdate(b.msg("/giong 2"));
  const m = b.said.at(-1);
  assert.match(m.text, /Cảnh 3/);
  assert.match(m.text, /nhờ Claude sửa|Claude sẽ sửa/i);
  assert.ok(!(m.extra?.reply_markup?.inline_keyboard ?? []).flat().some((x) => /Đồng ý/.test(x.text)), "không có nút Đồng ý");
  assert.ok(!b.execs.some((e) => e.includes("voice")));
  // chỉ tạo lại cảnh 1 (không dính cảnh lỗi): vẫn hỏi bình thường
  await b.bot.handleUpdate(b.msg("/giong 2 canh1"));
  assert.ok((b.said.at(-1).extra?.reply_markup?.inline_keyboard ?? []).flat().some((x) => /Đồng ý/.test(x.text)));
  // cố tình tạo cảnh 3 dù có cảnh báo
  await b.bot.handleUpdate(b.msg("/giong 2 canh3 chapnhan"));
  assert.ok((b.said.at(-1).extra?.reply_markup?.inline_keyboard ?? []).flat().some((x) => /Đồng ý/.test(x.text)));
});

test("tên riêng chưa có cách đọc (Newsky, Bcons, VAT viết trần trong markup) bị báo và CHẶN tạo giọng; đã có {cách đọc} thì qua (lỗi thật video Newsky 6 cảnh 1, 16/11/2026)", () => {
  const tran = { scenes: [{ id: "scene1", markup: "Newsky có 3{ba} cách thanh toán. Mỗi cách chia tiền một kiểu." }] };
  const ws = canhBaoLoiDoc(loiDocCacCanh(tran)[0].speech);
  assert.ok(ws.some((w) => /Tên riêng "Newsky"/.test(w) && /Newsky\{New Sky\}/.test(w)), ws.join("|"));
  assert.ok(ws.every((w) => !/^Tên riêng/.test(w) || laCanhBaoChan(w)), "cảnh báo tên riêng thuộc loại chặn");
  assert.ok(canhBaoChanCuaVideo(tran).length >= 1);
  const ok = { scenes: [{ id: "scene1", markup: "Newsky{New Sky} có 3{ba} cách thanh toán." }] };
  assert.deepEqual(canhBaoChanCuaVideo(ok), []);
  // Bcons và VAT
  assert.ok(canhBaoLoiDoc("Căn của Bcons chưa VAT.").length >= 2);
  assert.deepEqual(canhBaoLoiDoc("Căn của Bee Cons chưa vê a tê."), []);
});
