import test from "node:test";
import assert from "node:assert/strict";
import { canCapNhat, docLogCapNhat } from "../scripts/bot/tu-cap-nhat.mjs";

test("canCapNhat: GitHub có bản mới hơn máy này thì true; lỗi mạng / git thì false (bot vẫn chạy bản đang có)", async () => {
  const run = (outs) => async (args) => outs[args[0]] ?? { code: 0, out: "" };
  assert.equal(await canCapNhat(run({ fetch: { code: 0, out: "" }, "rev-list": { code: 0, out: "3\n" } })), true);
  assert.equal(await canCapNhat(run({ fetch: { code: 0, out: "" }, "rev-list": { code: 0, out: "0\n" } })), false);
  assert.equal(await canCapNhat(run({ fetch: { code: 1, out: "Could not resolve host" } })), false);
});

test("docLogCapNhat: đọc kết quả lần cập nhật trước để báo Telegram; có chữ LOI thì báo lỗi và không tự cập nhật lại vòng lặp", () => {
  const r = docLogCapNhat("Cap nhat luc ...\nBan hien tai: abc123 Fix\n");
  assert.equal(r.ok, true);
  assert.equal(r.tomTat, "Cap nhat luc ...\nBan hien tai: abc123 Fix");
  assert.equal(r.ban, "abc123");
  assert.equal(r.khongMoi, false);
  assert.equal(docLogCapNhat("...\nLOI: khong lay duoc ban moi\n").ok, false);
  assert.equal(docLogCapNhat("fatal: unable to access").ok, false);
});

test("docLogCapNhat: /capnhat mà không có gì mới thì báo 'đã là bản mới nhất' kèm mã bản", () => {
  const r = docLogCapNhat("Cap nhat luc ...\nBan hien tai: 88ad23a Gemini warn\nup to date in 2s\nKHONG CO BAN MOI\n");
  assert.equal(r.ok, true);
  assert.equal(r.khongMoi, true);
  assert.equal(r.ban, "88ad23a");
});
