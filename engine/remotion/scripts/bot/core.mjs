// Hàm lõi của bot Telegram (không gọi mạng, không chạy lệnh): đọc lệnh, kiểm người gửi, trạng thái video.
import fs from "node:fs";
import path from "node:path";
import { bodyHash, parseCaption } from "../caption.mjs";
import { sha256File } from "../caption-cli.mjs";
import { listVideos, videoPaths } from "../project.mjs";

export const HELP = [
  "Bot Bcons – gõ một trong 6 mục, phần còn lại bấm nút:",
  "",
  "/duan – đổi dự án đang làm (mọi lệnh bên dưới chạy theo dự án này)",
  "/video – danh sách video, bấm một video để làm bước kế tiếp",
  "/khach – phiếu tính cho khách, kiểm giá Master File",
  "/nghiencuu – Gemini tìm số liệu, chọn báo cáo cũ để làm video",
  "/may – cập nhật bot, chuyển máy, hiệu ứng âm thanh, trò chuyện Claude mới",
  "/huy – dừng việc đang chạy",
  "/huongdan – xem lại bảng này",
  "",
  "Nhắn câu bình thường (không có dấu /) để giao việc cho Claude trên máy.",
  "",
  "Lệnh gõ nhanh (vẫn chạy như cũ, <số> là số video trong /video):",
  "Video: /danhsach · /storyboard <số> · /giong <số> [canh1] · /render <số> [khongnhac] · /xem <số> [icon] · /duyet <số>",
  "Khách: /phieu <mã căn> <PTTT> [pdf] · /kiemgia",
  "Nghiên cứu: /gemini <chủ đề> · /baocao",
  "Máy: /capnhat · /chuyenmay · /sfx · /moi",
].join("\n");

/** Menu hiện khi anh gõ "/" trong Telegram: chỉ các mục gom nhóm (anh thấy 19 lệnh ngang hàng là rối, 12/11/2026). Mô tả lấy từ HELP để không lệch. */
export const MENU = ["duan", "video", "khach", "nghiencuu", "may", "huy", "huongdan"].map((command) => ({
  command,
  description: HELP.split("\n").find((l) => l.startsWith(`/${command} –`)).split("–").slice(1).join("–").trim().slice(0, 256),
}));

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

/**
 * Tiến trình một video: kịch bản (spec approved) → giọng (có timestamps.json) → render (có mp4) → duyệt.
 * `tiep`: bước kế tiếp anh cần làm ("kichban" | "giong" | "render" | "duyet" | "xong").
 */
export function buocVideo(name, projDir, outDir) {
  const st = videoStatus(name, projDir, outDir);
  let spec = {};
  try {
    spec = JSON.parse(fs.readFileSync(videoPaths(name, projDir).spec, "utf8"));
  } catch {
    // spec hỏng: coi như chưa duyệt
  }
  const kichBan = spec.status === "approved";
  const giong = fs.existsSync(videoPaths(name, projDir).timestamps);
  const duyet = st.caption === "đã duyệt" && st.video === "đã duyệt";
  const tiep = !kichBan ? "kichban" : !giong ? "giong" : !st.mp4 ? "render" : !duyet ? "duyet" : "xong";
  return { kichBan, giong, mp4: st.mp4, duyet, tiep, caption: st.caption, video: st.video };
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
    "\n\nBấm một video trong /video để làm bước kế tiếp (hoặc gõ nhanh, vd. /render 3)."
  );
}
