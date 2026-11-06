// Hàm lõi của bot Telegram (không gọi mạng, không chạy lệnh): đọc lệnh, kiểm người gửi, trạng thái video.
import fs from "node:fs";
import path from "node:path";
import { bodyHash, parseCaption } from "../caption.mjs";
import { sha256File } from "../caption-cli.mjs";
import { listVideos, videoPaths } from "../project.mjs";

export const HELP = [
  "Lệnh bot Bcons:",
  "/danhsach – trạng thái các video",
  "/xem <tên> – gửi caption + bản xem thử",
  "/duyet <tên> – duyệt caption + video, gửi bản đăng, lưu lên GitHub",
  "/render <tên> – render video (vài phút)",
  "/giong <tên> – tạo giọng ElevenLabs (tốn credit, hỏi trước)",
  "/capnhat – lấy bản mới nhất từ GitHub",
  "/moi – bắt đầu trò chuyện Claude mới",
  "/huy – dừng việc đang chạy",
  "",
  "Nhắn câu bình thường (không có dấu /) để giao việc cho Claude trên laptop.",
].join("\n");

/** "/duyet abc" → { cmd: "duyet", args: ["abc"] }; tin thường → { cmd: null, text }. */
export function parseCommand(raw) {
  const text = (raw ?? "").trim();
  if (!text.startsWith("/")) return { cmd: null, text };
  const [head, ...args] = text.split(/\s+/);
  return { cmd: head.slice(1).split("@")[0].toLowerCase(), args };
}

/** Chỉ nhận tin/nút bấm của chính anh, trong cuộc trò chuyện riêng với bot (không nhận nhóm). */
export function isAuthorized(update, chatId) {
  if (!chatId) return false;
  const m = update?.message ?? update?.callback_query?.message;
  const from = update?.message?.from ?? update?.callback_query?.from;
  if (!m?.chat || !from) return false;
  return m.chat.type === "private" && String(m.chat.id) === String(chatId) && String(from.id) === String(chatId);
}

/** Trạng thái một video: caption, có mp4 chưa, video đã duyệt chưa. */
export function videoStatus(name, projDir, outDir) {
  const capPath = videoPaths(name, projDir).caption;
  const mp4 = path.join(outDir, `${name}.mp4`);
  const hasMp4 = fs.existsSync(mp4);
  let caption = "chưa có";
  let video = "chưa duyệt";
  if (fs.existsSync(capPath)) {
    const text = fs.readFileSync(capPath, "utf8");
    const { meta } = parseCaption(text);
    if (meta.status !== "approved") caption = "nháp";
    else if (meta.noiDungSha256 !== bodyHash(text)) caption = "đổi sau khi duyệt";
    else caption = "đã duyệt";
    if (meta.videoSha256) video = hasMp4 && sha256File(mp4) === meta.videoSha256 ? "đã duyệt" : "render lại, cần duyệt lại";
  }
  return { name, caption, mp4: hasMp4, video };
}

/** Danh sách gửi về Telegram. */
export function formatList(projDir, outDir) {
  const rows = listVideos(projDir).map((n) => videoStatus(n, projDir, outDir));
  if (!rows.length) return "Chưa có video nào.";
  const icon = (r) => (r.caption === "đã duyệt" && r.video === "đã duyệt" ? "✅" : r.caption === "chưa có" ? "▫️" : "📝");
  return rows
    .map((r) => `${icon(r)} ${r.name}\n   caption: ${r.caption} · mp4: ${r.mp4 ? "có" : "chưa"} · video: ${r.video}`)
    .join("\n");
}
