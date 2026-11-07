// Tạo hiệu ứng âm thanh (vút, tách, dồn) bằng ElevenLabs Sound Effects. TỐN CREDIT: chỉ chạy khi anh đồng ý (--dong-y).
// Chạy một lần trên máy anh: npm run sfx -- --dong-y   (bot: /sfx). File đã có thì bỏ qua.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LEGACY_SFX_DIR, SFX_PROMPTS, sfxSaveDir } from "./am-thanh.mjs";

export async function taoSfx({ dongY, key, dir = sfxSaveDir(), legacyDir = LEGACY_SFX_DIR, fetchFn = fetch, log = () => {} }) {
  if (!dongY) throw new Error("Tạo hiệu ứng tốn credit ElevenLabs: chạy lại với --dong-y khi anh đã đồng ý.");
  if (!key) throw new Error("Thiếu ELEVENLABS_API_KEY trong engine/remotion/.env");
  fs.mkdirSync(dir, { recursive: true });
  const made = [];
  for (const [name, p] of Object.entries(SFX_PROMPTS)) {
    const file = path.join(dir, `${name}.mp3`);
    if (fs.existsSync(file)) {
      log(`${name}: đã có, bỏ qua`);
      continue;
    }
    const cu = path.join(legacyDir, `${name}.mp3`);
    if (path.resolve(cu) !== path.resolve(file) && fs.existsSync(cu)) {
      fs.copyFileSync(cu, file); // đã tạo trước đó trên máy này: chép sang Drive, không tốn credit
      log(`${name}: chép từ máy sang Drive`);
      continue;
    }
    const res = await fetchFn("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text: p.text, duration_seconds: p.giay, prompt_influence: 0.5 }),
    });
    if (!res.ok) throw new Error(`${name}: ElevenLabs lỗi ${res.status} ${(await res.text?.())?.slice(0, 200) ?? ""}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    made.push(name);
    log(`${name}: xong (${p.giay} giây)`);
  }
  return made;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  taoSfx({ dongY: process.argv.includes("--dong-y"), key: (process.env.ELEVENLABS_API_KEY ?? "").trim(), log: console.log })
    .then((m) => console.log(m.length ? `Đã tạo: ${m.join(", ")} trong ${sfxSaveDir()}` : `Đủ hiệu ứng trong ${sfxSaveDir()}, không tốn credit.`))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
