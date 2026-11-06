import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyHash, checkCaption, parseCaption, writeMeta } from "../scripts/caption.mjs";

const make = (fb, tt, meta = "status: draft") =>
  `---\n${meta}\nkenh: [facebook, tiktok]\n---\n## Facebook\n${fb}\n\n## TikTok\n${tt}\n`;
const CLEAN = make("Biên Hòa năm 2026 có gì mới về hạ tầng?\n\nXem video để biết.", "Hạ tầng Biên Hòa 2026 #bienhoa");

test("parseCaption đọc frontmatter và tách 2 phần", () => {
  const c = parseCaption(CLEAN);
  assert.equal(c.meta.status, "draft");
  assert.deepEqual(c.meta.kenh, ["facebook", "tiktok"]);
  assert.equal(c.meta.videoSha256, "");
  assert.match(c.facebook, /^Biên Hòa năm 2026/);
  assert.match(c.facebook, /Xem video để biết\.$/);
  assert.equal(c.tiktok, "Hạ tầng Biên Hòa 2026 #bienhoa");
});

test("bodyHash không đổi khi chỉ khác kiểu xuống dòng hoặc khoảng trắng cuối dòng", () => {
  const crlf = CLEAN.replaceAll("\n", "\r\n").replace("biết.", "biết.   ");
  assert.equal(bodyHash(crlf), bodyHash(CLEAN));
  assert.notEqual(bodyHash(CLEAN.replace("biết.", "biết!")), bodyHash(CLEAN));
});

test("caption sạch không có lỗi", () => {
  assert.deepEqual(checkCaption(CLEAN), []);
});

test("bắt SĐT viết nhiều kiểu", () => {
  for (const p of ["0905935935", "0905.935.935", "0905 935 935", "+84 905 935 935", "0905-935-935"]) {
    const errs = checkCaption(make(`Liên hệ ${p}`, "x"));
    assert.ok(errs.some((e) => /số điện thoại/.test(e)), p);
  }
  assert.deepEqual(checkCaption(make("Ngày 05/11/2026, giá 2,06 tỷ chưa VAT, phí bảo trì 2%.", "x")), []);
});

test("bắt cụm hứa lợi nhuận/tăng giá, không phân biệt hoa thường và dấu", () => {
  assert.ok(checkCaption(make("Cam kết LỢI NHUẬN 10%", "x")).some((e) => /cam kết lợi nhuận/i.test(e)));
  assert.ok(checkCaption(make("x", "dam bao tang gia")).some((e) => /đảm bảo tăng giá/i.test(e)));
});

test("nhắc giá thì phải có VAT và phí bảo trì, lỗi nêu số dòng", () => {
  const errs = checkCaption(make("Giá từ 2,06 tỷ/căn", "x"));
  assert.ok(errs.some((e) => /VAT/.test(e) && /dòng 6/.test(e)), errs.join("|"));
  assert.deepEqual(checkCaption(make("Giá từ 2,06 tỷ chưa VAT, chưa gồm phí bảo trì 2%.", "x")), []);
});

test("thiếu phần theo kênh, TikTok quá dài, approved thiếu duyetLuc", () => {
  assert.ok(checkCaption("---\nstatus: draft\nkenh: [facebook, tiktok]\n---\n## Facebook\nabc\n").some((e) => /TikTok/.test(e)));
  assert.ok(checkCaption(make("x", "a".repeat(2201))).some((e) => /2\.200/.test(e)));
  assert.ok(checkCaption(make("x", "y", "status: approved")).some((e) => /duyetLuc/.test(e)));
});

test("writeMeta cập nhật frontmatter, giữ nguyên nội dung", () => {
  const out = writeMeta(CLEAN, { status: "approved", duyetLuc: "2026-11-07T09:30:00+07:00" });
  const c = parseCaption(out);
  assert.equal(c.meta.status, "approved");
  assert.equal(c.meta.duyetLuc, "2026-11-07T09:30:00+07:00");
  assert.deepEqual(c.meta.kenh, ["facebook", "tiktok"]);
  assert.equal(bodyHash(out), bodyHash(CLEAN));
});
