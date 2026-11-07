import test from "node:test";
import assert from "node:assert/strict";
import { viToNumber, fixMarkup, checkSpelledNumbers, formatViNumber } from "../scripts/itn.mjs";
import { parseMarkup } from "../scripts/spec-tools.mjs";

const say = (m) => parseMarkup(m).filter((t) => t.say).map((t) => t.say).join(" ");

test("viToNumber: đọc số tiếng Việt (mốt, lăm, tư, linh, trăm, ngàn/nghìn, phẩy)", () => {
  assert.equal(viToNumber("mười"), 10);
  assert.equal(viToNumber("mười hai"), 12);
  assert.equal(viToNumber("hai mươi mốt"), 21);
  assert.equal(viToNumber("hai mươi lăm"), 25);
  assert.equal(viToNumber("ba mươi tư"), 34);
  assert.equal(viToNumber("một trăm linh năm"), 105);
  assert.equal(viToNumber("chín ngàn ba trăm sáu mươi ba"), 9363);
  assert.equal(viToNumber("hai ngàn không trăm hai mươi sáu"), 2026);
  assert.equal(viToNumber("bốn phẩy bốn"), 4.4);
  assert.equal(viToNumber("chín mươi chín phẩy hai mươi sáu"), 99.26);
  assert.equal(viToNumber("ngân hàng"), null);
});

test("formatViNumber: dấu chấm hàng nghìn, dấu phẩy thập phân; năm không chấm", () => {
  assert.equal(formatViNumber(9363), "9.363");
  assert.equal(formatViNumber(99.26), "99,26");
  assert.equal(formatViNumber(2026, { nam: true }), "2026");
});

test("checkSpelledNumbers: báo số viết chữ trên màn hình (≥ 10), '% một năm', 'quý 2'; cho phép 'tỷ' sau số, 'một/hai/ba' đếm lẻ", () => {
  const spec = (markup) => ({ scenes: [{ id: "s1", markup }] });
  assert.ok(checkSpelledNumbers(spec("Khảo sát tại mười ngân hàng.")).some((e) => /mười/.test(e)));
  assert.ok(checkSpelledNumbers(spec("Gói cố định mười hai tháng.")).some((e) => /12/.test(e)));
  assert.ok(checkSpelledNumbers(spec("Từ 8,5{tám phẩy năm} đến 11%{mười một phần trăm} một năm.")).some((e) => /\/năm/.test(e)));
  assert.ok(checkSpelledNumbers(spec("Theo khảo sát quý 2{hai} năm nay")).some((e) => /quý II/.test(e)));
  assert.deepEqual(checkSpelledNumbers(spec("Hơn 860{tám trăm sáu mươi} ngàn tỷ đồng và ba con số.")), []);
});

test("fixMarkup: tự sửa nhưng GIỮ NGUYÊN lời đọc (không phải tạo giọng lại)", () => {
  const cases = [
    ["Khảo sát tại mười ngân hàng.", "Khảo sát tại 10{mười} ngân hàng."],
    ["Gói cố định mười hai tháng: Agribank", "Gói cố định 12{mười hai} tháng: Agribank"],
    ["đến 11%{mười một phần trăm} một năm.", "đến 11%/năm.{mười một phần trăm một năm.}"],
    ["Theo khảo sát quý 2{hai} tại", "Theo khảo sát quý II{hai} tại"],
  ];
  for (const [a, b] of cases) {
    assert.equal(fixMarkup(a), b);
    assert.equal(say(fixMarkup(a)), say(a), `lời đọc giữ nguyên: ${a}`);
  }
});
