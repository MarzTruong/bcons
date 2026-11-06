// Gửi video + caption ĐÃ DUYỆT về Telegram của anh (để đăng TikTok kèm nhạc xu hướng, dán caption FB).
// Chạy trên máy anh, trong engine/remotion:
//   npm run send:telegram -- <tên> [file.mp4] [--du-an <mã>]
//   npm run send:telegram -- --bai <thư mục bài công ty>      (không có video: gửi 2 tin chữ)
// Cần trong .env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (xem docs/huong-dan-dang-bai.md). Không in token.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captionOptsFor, checkCaption, parseCaption } from "./caption.mjs";
import { approvalState, captionPathFor } from "./caption-cli.mjs";
import { takeProjectFlag } from "./project.mjs";

const MAX_BYTES = 50 * 1024 * 1024; // giới hạn gửi file của Telegram Bot API
const VIDEO_CAPTION_MAX = 1024;
const MESSAGE_MAX = 4096;

/** Chia chuỗi thành các phần ≤ max ký tự, ưu tiên cắt ở chỗ xuống dòng. */
export function chunkText(text, max = MESSAGE_MAX) {
  const out = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < max * 0.5) cut = max;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.length) out.push(rest);
  return out;
}

/** Các request gửi lên Telegram: sendVideo (nếu có mp4) rồi sendMessage cho từng phần. */
export function buildTelegramRequests({ token, chatId, mp4Path, caption, label = "" }) {
  const api = (m) => `https://api.telegram.org/bot${token}/${m}`;
  const reqs = [];
  const tiktok = caption.tiktok ?? "";
  const facebook = caption.facebook ?? "";
  if (mp4Path) {
    const body = new FormData();
    body.set("chat_id", chatId);
    body.set("supports_streaming", "true");
    // Caption TikTok dài hơn giới hạn của Telegram: gửi video kèm nhãn ngắn, caption đầy đủ gửi thành tin riêng (không cắt chữ).
    const fits = tiktok.length <= VIDEO_CAPTION_MAX;
    body.set("caption", fits ? tiktok : `${label} (caption TikTok ở tin kế tiếp)`);
    body.set("video", new Blob([fs.readFileSync(mp4Path)], { type: "video/mp4" }), path.basename(mp4Path));
    reqs.push({ url: api("sendVideo"), body });
    if (!fits) for (const part of chunkText(`TIKTOK ${label}\n\n${tiktok}`)) reqs.push(msg(api, chatId, part));
  } else if (tiktok) {
    for (const part of chunkText(`TIKTOK ${label}\n\n${tiktok}`)) reqs.push(msg(api, chatId, part));
  }
  if (facebook) for (const part of chunkText(`FACEBOOK ${label}\n\n${facebook}`)) reqs.push(msg(api, chatId, part));
  return reqs;
}

function msg(api, chatId, text) {
  const body = new FormData();
  body.set("chat_id", chatId);
  body.set("text", text);
  return { url: api("sendMessage"), body };
}

/** Kiểm đủ điều kiện TRƯỚC khi gọi mạng, rồi gửi. mp4Path = null cho bài không có video. */
export async function sendApproved({ captionPath, mp4Path, env = process.env, fetchFn = fetch, label = "" }) {
  const token = (env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (env.TELEGRAM_CHAT_ID ?? "").trim();
  if (!token || !chatId) throw new Error("Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong engine/remotion/.env (xem docs/huong-dan-dang-bai.md)");
  if (!fs.existsSync(captionPath)) throw new Error(`Không thấy ${captionPath}`);
  const text = fs.readFileSync(captionPath, "utf8");
  const st = approvalState(text, mp4Path);
  if (!st.ok) throw new Error(`Chưa gửi: ${st.reason}. Duyệt bằng npm run duyet:caption / duyet:video.`);
  const errs = checkCaption(text, captionOptsFor(captionPath)); // kiểm lại theo quy tắc hiện hành, phòng caption duyệt trước khi quy tắc chặt hơn
  if (errs.length) throw new Error(`Chưa gửi, caption vi phạm quy tắc:\n- ${errs.join("\n- ")}`);
  if (mp4Path && fs.statSync(mp4Path).size > MAX_BYTES) throw new Error("Video lớn hơn 50 MB, Telegram không nhận. Render bản nhẹ hơn.");
  const caption = parseCaption(text);
  for (const r of buildTelegramRequests({ token, chatId, mp4Path, caption, label })) {
    const res = await fetchFn(r.url, { method: "POST", body: r.body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(`Telegram báo lỗi: ${data.description ?? res.status}`);
  }
}

async function main(argv) {
  try {
    process.loadEnvFile(".env");
  } catch {
    // không có .env: dùng biến môi trường hiện có
  }
  const { projDir, rest } = takeProjectFlag(argv);
  const i = rest.indexOf("--bai");
  if (i >= 0) {
    const bai = rest[i + 1];
    if (!bai) throw new Error("Thiếu đường dẫn sau --bai (vd. --bai ../../du-an/bcons-central-park/content/bai-cong-ty/<thư mục>)");
    await sendApproved({ captionPath: captionPathFor(null, projDir, bai), mp4Path: null, label: path.basename(bai) });
    console.log(`Đã gửi bài ${path.basename(bai)} về Telegram.`);
    return;
  }
  const name = rest[0];
  const mp4 = path.resolve("out", "video", rest[1] ?? `${name}.mp4`);
  if (!fs.existsSync(mp4)) throw new Error(`Không thấy video ${mp4}. Render trước (npm run render:drive).`);
  await sendApproved({ captionPath: captionPathFor(name, projDir, null), mp4Path: mp4, label: name });
  console.log(`Đã gửi ${name} về Telegram.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
