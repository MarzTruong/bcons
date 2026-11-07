// Tự cập nhật bot: mỗi lần mở bot (hoặc nhận việc khi chuyển máy), xem GitHub có bản mới không.
// Có thì bot thoát mã 4 để Bcons-Bot.cmd chạy scripts/bot/capnhat.cmd (lấy bản mới khi bot đã tắt) rồi bật lại.

/** run(args) chạy git trong thư mục repo, trả { code, out }. */
export async function canCapNhat(run) {
  const f = await run(["fetch", "origin", "main"]);
  if (f.code !== 0) return false; // mất mạng: chạy tiếp bản đang có
  const r = await run(["rev-list", "--count", "HEAD..origin/main"]);
  return r.code === 0 && Number(r.out.trim()) > 0;
}

/** Nội dung capnhat.log → { ok, tomTat } để báo Telegram. */
export function docLogCapNhat(log) {
  const tomTat = String(log).trim().split(/\r?\n/).slice(-12).join("\n");
  return { ok: !/\bLOI\b|error|fatal|lỗi/i.test(tomTat), tomTat };
}
