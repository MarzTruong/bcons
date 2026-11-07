import test from "node:test";
import assert from "node:assert/strict";
import { relabelWords, checkShownSymbols, parseMarkup } from "../scripts/spec-tools.mjs";
import { groupWords, fontSizeFor, CAPTION } from "../src/captionChunks.ts";

const say = (markup) => parseMarkup(markup).filter((t) => t.say).map((t) => t.say).join(" ");

test("relabelWords: đổi chữ hiển thị (90 phần trăm → 90%) mà giữ đúng mốc giọng cũ, không cần tạo lại giọng", () => {
  const oldMarkup = "Lấp đầy 90{chín mươi} phần trăm, rất cao.";
  const newMarkup = "Lấp đầy 90%{chín mươi phần trăm,} rất cao.";
  // lời đọc giống hệt nhau
  assert.equal(say(oldMarkup).replace(/ ,/g, ","), say(newMarkup).replace(/ ,/g, ","));
  const oldWords = [
    { text: "Lấp", start: 0, end: 0.2 },
    { text: "đầy", start: 0.25, end: 0.4 },
    { text: "90", start: 0.5, end: 0.9 },
    { text: "phần", start: 1.0, end: 1.2 },
    { text: "trăm,", start: 1.25, end: 1.5 },
    { text: "rất", start: 1.7, end: 1.8 },
    { text: "cao.", start: 1.85, end: 2.0 },
  ];
  const r = relabelWords(newMarkup, oldMarkup, oldWords);
  assert.ok(r.ok, r.reason);
  assert.deepEqual(
    r.words.map((w) => [w.text, w.start, w.end]),
    [["Lấp", 0, 0.2], ["đầy", 0.25, 0.4], ["90%", 0.5, 1.5], ["rất", 1.7, 1.8], ["cao.", 1.85, 2.0]],
  );
  assert.equal(relabelWords("Khác hẳn.", oldMarkup, oldWords).ok, false, "lời đọc đổi thì phải tạo giọng lại");
});

test("checkShownSymbols: chữ hiện trên màn hình phải dùng ký hiệu (%, USD, m², ha, km)", () => {
  const spec = (markup) => ({ scenes: [{ id: "s1", markup }] });
  assert.ok(checkShownSymbols(spec("Tăng 4,4{bốn phẩy bốn} phần trăm")).some((e) => /phần trăm/.test(e)));
  assert.ok(checkShownSymbols(spec("1,88 tỷ đô la")).some((e) => /đô la/.test(e)));
  assert.ok(checkShownSymbols(spec("Rộng 335{ba trăm ba mươi lăm} héc-ta")).length > 0);
  assert.deepEqual(checkShownSymbols(spec("Tăng 4,4%{bốn phẩy bốn phần trăm} và 1,88{một phẩy tám mươi tám} tỷ USD{đô la Mỹ}")), []);
});

const W = (texts) => texts.map((text, i) => ({ text, start: i, end: i + 0.5 }));

test("groupWords: chia theo độ dài chữ (tối đa 2 dòng), ngắt ở dấu câu, không tách số khỏi đơn vị", () => {
  const words = W("Khu công nghiệp đầu tiên của Việt Nam rộng 335 ha đang được chuyển thành khu đô thị mới.".split(" "));
  const groups = groupWords(words);
  for (const g of groups) {
    const len = g.map((w) => w.text).join(" ").length;
    assert.ok(len <= CAPTION.maxChars, `cụm quá dài: ${len}`);
  }
  const flat = groups.map((g) => g.map((w) => w.text));
  const i = flat.findIndex((g) => g.includes("335"));
  assert.ok(flat[i].includes("ha"), "335 và ha phải cùng cụm");
  const p = groupWords(W(["Một,", "hai", "ba", "bốn."]));
  assert.deepEqual(p.map((g) => g.map((w) => w.text)), [["Một,", "hai", "ba", "bốn."]], "cụm cuối ngắn thì gộp vào cụm trước");
});

test("fontSizeFor: câu ngắn giữ cỡ lớn, câu dài thu nhỏ nhưng không dưới mức tối thiểu", () => {
  assert.equal(fontSizeFor("Ngắn gọn"), CAPTION.maxFont);
  const long = fontSizeFor("x".repeat(CAPTION.maxChars));
  assert.ok(long < CAPTION.maxFont && long >= CAPTION.minFont);
});

test("mergePunct: dấu câu đứng riêng (vd. '9,8 ,') dính vào từ trước, không có khoảng trống", async () => {
  const { mergePunct } = await import("../src/captionChunks.ts");
  const out = mergePunct([{ text: "9,8", start: 1, end: 1.5 }, { text: ",", start: 1.6, end: 1.6 }, { text: "Vietin", start: 2, end: 2.3 }]);
  assert.deepEqual(out.map((w) => w.text), ["9,8,", "Vietin"]);
  assert.equal(out[0].end, 1.5);
});
