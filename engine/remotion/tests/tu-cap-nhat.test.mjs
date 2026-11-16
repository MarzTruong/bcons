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

test("docLogCapNhat: commit mới có chữ 'lỗi'/'error' trong dòng 'Ban hien tai' không bị báo nhầm là cập nhật lỗi", () => {
  assert.equal(docLogCapNhat("Cap nhat luc ...\nBan hien tai: 85778ce Sửa lỗi đọc cột PTTT\n").ok, true);
  assert.equal(docLogCapNhat("Cap nhat luc ...\nBan hien tai: 4bf520f bot: fix error buttons\n").ok, true);
  assert.equal(docLogCapNhat("Ban hien tai: 85778ce Sửa lỗi\nLOI: khong lay duoc ban moi\n").ok, false);
});

test("docLogCapNhat: tên file có chữ 'loi' (loi-doc.mjs) hoặc 'error' trong bảng thống kê git KHÔNG bị coi là lỗi (log thật 16/11/2026)", () => {
  const log = [
    "Cap nhat luc Mon 11/16/2026 13:47:02.10",
    "From https://github.com/MarzTruong/bcons",
    "Updating a3766ad..b04cc01",
    "Fast-forward",
    " engine/remotion/scripts/bot/core.mjs              |   2 +-",
    " engine/remotion/scripts/bot/handlers.mjs          |  35 ++++++-",
    " engine/remotion/scripts/bot/loi-doc-cli.mjs       |  16 +++",
    " engine/remotion/scripts/loi-doc.mjs               |  75 ++++++++++++++",
    " engine/remotion/tests/loi-doc.test.mjs            | 109 ++++++++++++++++",
    " engine/remotion/tests/check-error-log.test.mjs    |   5 +",
    " 11 files changed, 241 insertions(+), 8 deletions(-)",
    " create mode 100644 engine/remotion/scripts/loi-doc-cli.mjs",
    " create mode 100644 engine/remotion/scripts/loi-doc.mjs",
    "Ban hien tai: a3766ad Video 2 scene 3: new opening line; bot blocks voice on repeated words/known-bad phrases",
    "up to date in 534ms",
  ].join("\n");
  const r = docLogCapNhat(log);
  assert.equal(r.ok, true);
  assert.equal(r.ban, "a3766ad");
  // lỗi thật vẫn bị bắt
  assert.equal(docLogCapNhat("Cap nhat luc ...\nLOI: khong lay duoc ban moi, bot chay tiep ban dang co.\n").ok, false);
  assert.equal(docLogCapNhat("Cap nhat luc ...\nfatal: unable to access 'https://github.com/'\n").ok, false);
  assert.equal(docLogCapNhat("Cap nhat luc ...\nnpm error code ERESOLVE\n").ok, false);
  assert.equal(docLogCapNhat("Cap nhat luc ...\nerror: Your local changes would be overwritten\n").ok, false);
});
