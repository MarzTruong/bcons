// Tạo vài bản thử giọng cảnh 2 để so sánh (lưu ở audio-test/, không dùng cho video).
import fs from "node:fs";
import { SCENES, parseMarkup } from "./scenes.mjs";
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = "9CCqsrTCLkHgQlKSMchK";
const scene = SCENES.find((s) => s.id === "scene2");
const text = parseMarkup(scene.markup).filter((t) => t.say).map((t) => t.say).join(" ");
const base = { stability: 0.55, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true };
const firm = { stability: 0.85, similarity_boost: 0.9, style: 0, use_speaker_boost: true };
const variants = [
  ["A_v4_firm", "eleven_v4", firm],
  ["B_turbo25_base", "eleven_turbo_v2_5", base],
  ["C_turbo25_firm", "eleven_turbo_v2_5", firm],
  ["D_v3_base", "eleven_v3", base],
];
for (const [name, model, vs] of variants) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: model, voice_settings: vs, language_code: "vi", seed: 7 }),
  });
  if (!res.ok) { console.log(name, res.status, (await res.text()).slice(0, 150)); continue; }
  fs.writeFileSync(`audio-test/scene2_${name}.mp3`, Buffer.from(await res.arrayBuffer()));
  console.log("ok", name);
}
