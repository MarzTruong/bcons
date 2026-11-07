// Gọi Telegram Bot API (chỉ những hàm bot cần). Không in token.
import fs from "node:fs";
import path from "node:path";
import { chunkText } from "../send-telegram.mjs";

export function createTg(token, fetchFn = fetch) {
  const url = (m) => `https://api.telegram.org/bot${token}/${m}`;
  async function call(method, params = {}) {
    const isForm = params instanceof FormData;
    const res = await fetchFn(url(method), {
      method: "POST",
      headers: isForm ? undefined : { "content-type": "application/json" },
      body: isForm ? params : JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) throw new Error(`Telegram ${method}: ${data.description ?? res.status}`);
    return data.result;
  }
  return {
    call,
    async sendMessage(chatId, text, extra = {}) {
      const parts = chunkText(text || "(trống)", 4000);
      for (let i = 0; i < parts.length; i++) {
        await call("sendMessage", { chat_id: chatId, text: parts[i], ...(i === parts.length - 1 ? extra : {}) });
      }
    },
    async sendVideo(chatId, file, caption = "") {
      const form = new FormData();
      form.set("chat_id", String(chatId));
      form.set("supports_streaming", "true");
      if (caption) form.set("caption", caption.slice(0, 1000));
      form.set("video", new Blob([fs.readFileSync(file)], { type: "video/mp4" }), path.basename(file));
      return call("sendVideo", form);
    },
    /** Gửi 2–10 ảnh thành một album (storyboard), chú thích ở ảnh đầu. */
    async sendPhotos(chatId, files, caption = "") {
      const form = new FormData();
      form.set("chat_id", String(chatId));
      const media = files.map((f, i) => ({ type: "photo", media: `attach://p${i}`, ...(i === 0 && caption ? { caption: caption.slice(0, 1000) } : {}) }));
      form.set("media", JSON.stringify(media));
      files.forEach((f, i) => form.set(`p${i}`, new Blob([fs.readFileSync(f)], { type: "image/png" }), path.basename(f)));
      return call("sendMediaGroup", form);
    },
    answerCallback(id, text = "") {
      return call("answerCallbackQuery", { callback_query_id: id, text });
    },
    getUpdates(offset, timeout = 30) {
      return call("getUpdates", { offset, timeout, allowed_updates: ["message", "callback_query"] });
    },
  };
}

/** Bàn phím nút bấm dưới tin nhắn: [["Đồng ý","ok:1"],["Hủy","huy:1"]] */
export function buttons(pairs) {
  return { reply_markup: { inline_keyboard: [pairs.map(([text, data]) => ({ text, callback_data: data }))] } };
}
