// Dựng audio theo src/tuan/segments.json, gửi ElevenLabs Scribe và ghi src/tuan-words.json.
// Chạy: node scripts/build-tuan-captions.mjs  (cần ELEVENLABS_API_KEY trong .env)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { projectDir, readActiveProject } from "./project.mjs";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("Thiếu ELEVENLABS_API_KEY (node --env-file=.env scripts/build-tuan-captions.mjs)");

const segments = JSON.parse(readFileSync("src/tuan/segments.json", "utf8"));
const dir = mkdtempSync(join(tmpdir(), "tuan-"));
const mp3 = join(dir, "edited.mp3");

const parts = segments.map(
  (s, i) => `[0:a]atrim=start=${s.from}:end=${s.to},asetpts=PTS-STARTPTS[a${i}]`,
);
const labels = segments.map((_, i) => `[a${i}]`).join("");
const filter = `${parts.join(";")};${labels}concat=n=${segments.length}:v=0:a=1[o]`;
execFileSync("ffmpeg", [
  "-y", "-v", "error", "-i", join(projectDir(readActiveProject()), "assets", "raw-tuan.mp4"),
  "-filter_complex", filter, "-map", "[o]", "-ac", "1", "-ar", "16000", "-b:a", "64k", mp3,
]);

const form = new FormData();
form.set("model_id", "scribe_v1");
form.set("language_code", "vie");
form.set("timestamps_granularity", "word");
form.set("tag_audio_events", "false");
form.set("file", new Blob([readFileSync(mp3)]), "edited.mp3");

const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
  method: "POST",
  headers: { "xi-api-key": key },
  body: form,
});
if (!res.ok) throw new Error(`Scribe lỗi ${res.status}: ${await res.text()}`);
const json = await res.json();

const words = json.words
  .filter((w) => w.type === "word")
  .map((w) => ({ t: w.text, s: +w.start.toFixed(2), e: +w.end.toFixed(2) }));
writeFileSync("src/tuan-words.json", JSON.stringify(words));
console.log(json.text);
console.log(`${words.length} từ, ${words.at(-1).e}s`);
