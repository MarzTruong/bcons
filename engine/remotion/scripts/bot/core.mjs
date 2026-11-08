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
  "/duyet <tên> – duyệt caption + video vừa render, gửi chữ caption để đăng, lưu lên GitHub",
  "/render <số> – render video có nhạc + hiệu ứng (vài phút); thêm chữ khongnhac để ra bản không nhạc",
  "(Các lệnh cần video: gõ số trong /danhsach, hoặc gõ lệnh không kèm gì để tick chọn 1, nhiều hoặc tất cả video.)",
  "/sfx – tạo hiệu ứng âm thanh còn thiếu trong kho 11 kiểu (tốn ít credit, hỏi trước)",
  "/kiemgia – kiểm giá từng căn trong Master File theo tài liệu PTTT của CĐT",
  "/gemini <chủ đề> – nhờ Gemini tìm số liệu có nguồn (tốn ít phí Google)",
  "/baocao – chọn lại báo cáo Gemini cũ để làm video",
  "/storyboard <tên> – chụp hình từng cảnh để duyệt TRƯỚC khi tạo giọng (không tốn credit)",
  "/giong <tên> – tạo giọng ElevenLabs (tốn credit, hỏi trước); thêm canh1 để chỉ tạo lại cảnh 1",
  "/capnhat – lấy bản mới nhất từ GitHub",
  "/chuyenmay – chuyển bot sang máy khác đang mở bot (PC ⇄ laptop)",
  "/moi – bắt đầu trò chuyện Claude mới",
  "/huy – dừng việc đang chạy",
  "",
  "Nhắn câu bình thường (không có dấu /) để giao việc cho Claude trên laptop.",
].join("\n");

/** Menu lệnh hiện khi anh gõ "/" trong Telegram: lấy từ HELP để hai chỗ không lệch nhau. */
export const MENU = HELP.split("\n")
  .map((l) => l.match(/^\/([a-z0-9_]+)\b[^–]*–\s*(.+)$/))
  .filter(Boolean)
  .map(([, command, description]) => ({ command, description: description.trim().slice(0, 256) }));

/** Đăng ký menu với Telegram (setMyCommands). Lỗi mạng thì bỏ qua: gõ tay lệnh vẫn chạy. */
export async function setMenu(tg) {
  try {
    await tg.call("setMyCommands", { commands: MENU });
    return true;
  } catch {
    return false;
  }
}

/** Hai máy cùng mở bot (Telegram báo 409): máy MỚI mở thì thoát, máy ĐANG chạy lâu thì giữ và chờ máy kia thoát.
 *  Tránh chuyện mở laptop làm tắt luôn bot trên PC ở nhà. */
export const NEW_BOT_MS = 2 * 60_000;
export function onConflict(startedAt, now = Date.now()) {
  return now - startedAt < NEW_BOT_MS ? "thoat" : "cho";
}

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
const readSpec = (projDir, name) => {
  try {
    return JSON.parse(fs.readFileSync(videoPaths(name, projDir).spec, "utf8"));
  } catch {
    return {};
  }
};

/**
 * Danh sách video để chọn (quy ước 07/11/2026): mỗi video có số `so` (ổn định, không đổi) và `tieuDe` dễ đọc trong spec.
 * Video không có số (mẫu thử, nháp bỏ) không hiện.
 */
export function videoIndex(projDir) {
  return listVideos(projDir)
    .map((name) => ({ name, ...readSpec(projDir, name) }))
    .filter((v) => Number.isInteger(v.so))
    .map((v) => ({ so: v.so, name: v.name, tieuDe: v.tieuDe ?? v.name }))
    .sort((a, b) => a.so - b.so);
}

/** "3" → video số 3; tên đủ; hoặc vài chữ đầu nếu chỉ khớp 1 video. Không ra thì null. */
export function resolveVideo(arg, projDir) {
  const a = String(arg ?? "").trim().toLowerCase();
  if (!a) return null;
  const idx = videoIndex(projDir);
  if (/^\d+$/.test(a)) return idx.find((v) => v.so === Number(a))?.name ?? null;
  if (listVideos(projDir).includes(a)) return a;
  const hit = idx.filter((v) => v.name.startsWith(a) || v.name.includes(`-${a}`));
  return hit.length === 1 ? hit[0].name : null;
}

/** Tên thư mục video mới: "<số 2 chữ số>-<4 chữ đầu không dấu>", vd. "05-gioi-thieu-dot-2". */
export function slugMoi(projDir, tieuDe) {
  const so = Math.max(0, ...videoIndex(projDir).map((v) => v.so)) + 1;
  const words = tieuDe.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).slice(0, 4);
  return `${String(so).padStart(2, "0")}-${words.join("-")}`;
}

export function formatList(projDir, outDir) {
  const idx = videoIndex(projDir);
  const khongSo = listVideos(projDir).filter((n) => !idx.some((v) => v.name === n));
  if (!idx.length && !khongSo.length) return "Chưa có video nào.";
  const icon = (r) => (r.caption === "đã duyệt" && r.video === "đã duyệt" ? "✅" : r.caption === "chưa có" ? "▫️" : "📝");
  const line = (label, name) => {
    const r = videoStatus(name, projDir, outDir);
    return `${icon(r)} ${label}\n   caption: ${r.caption} · mp4: ${r.mp4 ? "có" : "chưa"} · video: ${r.video}`;
  };
  return (
    [...idx.map((v) => line(`${v.so} · ${v.tieuDe}`, v.name)), ...khongSo.map((n) => line(`(chưa có số) ${n}`, n))].join("\n") +
    "\n\nGọi lệnh bằng số, vd. /render 3 (hoặc gõ /render rồi bấm chọn)."
  );
}
