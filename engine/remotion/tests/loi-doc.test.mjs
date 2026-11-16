// Xem trước lời đọc trước khi tạo giọng (anh yêu cầu 16/11/2026 sau khi giọng video 2 cảnh 3 bị lặp "hai hai" hai lần).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loiDocCacCanh, canhBaoLoiDoc, xemTruocLoiDoc } from "../scripts/loi-doc.mjs";
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
  assert.deepEqual(canhBaoLoiDoc("Cho thuê trong hai năm. Ví dụ ba tỷ chưa VAT."), []);
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

test("bot: /giong hỏi Đồng ý KÈM lời đọc từng cảnh; /loidoc chỉ xem, không tạo giọng, không tốn credit", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ld-"));
  const d = path.join(root, "du-an", "bcons-newsky");
  fs.mkdirSync(path.join(d, "video", "02-von-mua-can-nao"), { recursive: true });
  fs.writeFileSync(path.join(d, "project.json"), JSON.stringify({ ma: "bcons-newsky", ten: "Bcons Newsky" }));
  fs.writeFileSync(path.join(d, "video", "02-von-mua-can-nao", "spec.json"), JSON.stringify({ so: 2, tieuDe: "Mua căn 3 tỷ", status: "approved", scenes: spec2.scenes }));
  fs.writeFileSync(path.join(root, "config.json"), JSON.stringify({ duAnDangBan: "bcons-newsky" }));
  fs.mkdirSync(path.join(root, "out"));
  const said = [], execs = [];
  const tg = { sendMessage: async (_c, text, extra) => said.push({ text, extra }), answerCallback: async () => {} };
  const T0 = 1e12;
  const bot = createBot({ tg, chatId: "42", duAn: taoDuAn({ root, file: path.join(root, "out", "c.json") }), outDir: path.join(root, "out"), repoRoot: root, remotionDir: root, exec: async (c, a) => (execs.push([c, ...a].join(" ")), { code: 0, out: "" }), now: () => T0, startedAt: T0 });
  const msg = (text) => ({ message: { chat: { id: 42, type: "private" }, from: { id: 42 }, date: T0 / 1000, text } });
  await bot.handleUpdate(msg("/giong 2"));
  const hoi = said.at(-1).text;
  assert.match(hoi, /TỐN CREDIT/);
  assert.match(hoi, /Cảnh 1/);
  assert.match(hoi, /Bước đầu chỉ một trăm năm mươi triệu/);
  assert.match(hoi, /⚠️/);
  assert.ok(!execs.some((e) => e.includes("voice")));
  said.length = 0;
  await bot.handleUpdate(msg("/loidoc 2"));
  assert.match(said.at(-1).text, /Cảnh 3/);
  assert.ok(!execs.some((e) => e.includes("voice")));
  // tạo lại một cảnh: chỉ hiện cảnh đó
  said.length = 0;
  await bot.handleUpdate(msg("/giong 2 canh3"));
  assert.match(said.at(-1).text, /Cảnh 3/);
  assert.doesNotMatch(said.at(-1).text, /Cảnh 1/);
});
