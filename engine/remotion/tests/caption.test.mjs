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
  assert.ok(checkCaption(make("Căn 2PN giá 3,1 tỷ", "x")).some((e) => /VAT/.test(e)));
  assert.deepEqual(checkCaption(make("Khu đất đấu giá, giá khởi điểm 9.363 tỷ đồng.", "x")), []);
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

test("rà soát: SĐT có ngoặc, máy bàn, 84 không dấu +; không bắt nhầm ngày/%/số căn", () => {
  for (const p of ["(+84) 912 345 678", "Hotline (028) 3823 4567", "84912345678"]) {
    assert.ok(checkCaption(make(`Gọi ${p}`, "x")).some((e) => /số điện thoại/.test(e)), p);
  }
  assert.deepEqual(checkCaption(make("Lãi 0,5% ngày 05/11/2026, dự án 2.820 căn ở.", "x")), []);
});

test("rà soát: giá căn kiểu tỉ / tr / không có chữ giá; VAT kiểm riêng từng phần", () => {
  assert.ok(checkCaption(make("Giá bán chỉ 2 tỉ/căn", "x")).some((e) => /VAT/.test(e)));
  assert.ok(checkCaption(make("Chỉ 1,9 tỷ sở hữu căn hộ", "x")).some((e) => /VAT/.test(e)));
  assert.ok(checkCaption(make("Trả trước 300tr là có căn", "x")).some((e) => /VAT/.test(e)));
  const fbOk = make("Căn 2PN giá 3,1 tỷ chưa VAT, chưa gồm phí bảo trì 2%.", "Căn hộ giá từ 2 tỷ");
  assert.ok(checkCaption(fbOk).some((e) => /TikTok/.test(e) && /VAT/.test(e)));
});

test("rà soát: cụm sinh lời, số lợi nhuận; file có BOM vẫn đọc đúng", () => {
  assert.ok(checkCaption(make("Cam kết sinh lời", "x")).length > 0);
  assert.ok(checkCaption(make("Lợi nhuận 20%/năm", "x")).length > 0);
  const bom = "﻿" + CLEAN;
  assert.equal(parseCaption(bom).meta.status, "draft");
  assert.deepEqual(checkCaption(bom), []);
  assert.equal(bodyHash(bom), bodyHash(CLEAN));
  assert.ok(!writeMeta(bom, { status: "approved" }).includes("status: draft"));
});

test("SĐT: số của tư vấn viên (project.json → lienHe) được ghi trong caption, số khác vẫn bị chặn", () => {
  const own = make("Nhắn em qua Zalo 0938.32.31.39 nha.", "Zalo 0938 323 139 #bienhoa");
  assert.deepEqual(checkCaption(own, { allowPhones: ["0938323139"] }), []);
  assert.ok(checkCaption(own).some((e) => /số điện thoại/.test(e)), "không truyền số được phép thì vẫn chặn");
  const other = make("Gọi 0901 234 567 nha.", "x #bienhoa");
  assert.ok(checkCaption(other, { allowPhones: ["0938323139"] }).some((e) => /0901 234 567/.test(e)));
  assert.deepEqual(checkCaption(make("Gọi +84 938 323 139", "x"), { allowPhones: ["0938323139"] }), []);
});

test("captionOptsFor: caption trong du-an/<mã>/ lấy SĐT được phép từ project.json của dự án", async () => {
  const { captionOptsFor } = await import("../scripts/caption.mjs");
  const p = new URL("../../../du-an/bcons-central-park/video/04-ha-tang-bien-hoa/caption.md", import.meta.url).pathname;
  assert.deepEqual(captionOptsFor(p).allowPhones, ["0938323139"]);
});
