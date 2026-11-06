// In mã cuộc trò chuyện (chat id) để chép vào .env → TELEGRAM_CHAT_ID.
// Trước khi chạy: mở bot của anh trên Telegram và nhắn "hi".
// Chạy trong engine/remotion: npm run telegram:chat-id
try {
  process.loadEnvFile(".env");
} catch {
  // dùng biến môi trường hiện có
}
const token = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
if (!token) {
  console.error("Thiếu TELEGRAM_BOT_TOKEN trong engine/remotion/.env (lấy từ @BotFather).");
  process.exit(1);
}
const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = await res.json();
if (!data.ok) {
  console.error(`Telegram báo lỗi: ${data.description ?? res.status} (kiểm tra lại token)`);
  process.exit(1);
}
const seen = new Map();
for (const u of data.result ?? []) {
  const m = u.message ?? u.channel_post;
  if (m?.chat) seen.set(m.chat.id, [m.chat.first_name, m.chat.last_name, m.chat.title].filter(Boolean).join(" "));
}
if (!seen.size) {
  console.log('Chưa thấy tin nhắn nào. Mở bot trên Telegram, nhắn "hi", rồi chạy lại lệnh này.');
} else {
  for (const [id, who] of seen) console.log(`TELEGRAM_CHAT_ID=${id}   (${who})`);
  console.log("Chép dòng TELEGRAM_CHAT_ID=... của anh vào engine/remotion/.env");
}
