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
  assert.deepEqual(docLogCapNhat("Cap nhat luc ...\nBan hien tai: abc123 Fix\n"), { ok: true, tomTat: "Cap nhat luc ...\nBan hien tai: abc123 Fix" });
  assert.equal(docLogCapNhat("...\nLOI: khong lay duoc ban moi\n").ok, false);
  assert.equal(docLogCapNhat("fatal: unable to access").ok, false);
});
