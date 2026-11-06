// Tạo giọng đọc ElevenLabs (with-timestamps) + đo thời lượng thật.
// Chạy: node --env-file=.env scripts/generate-voice.mjs <tên-video> [--model=<id>] [--du-an <mã>]
// Chỉ chạy khi du-an/<mã>/video/<tên-video>/spec.json có status "approved" và mọi sourceId có trong bảng nguồn.
import fs from "node:fs";
import path from "node:path";
import { parseMedia } from "@remotion/media-parser";
import { nodeReader } from "@remotion/media-parser/node";
import { parseMarkup, prepareRun } from "./spec-tools.mjs";
import { takeProjectFlag, videoPaths } from "./project.mjs";

const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
const name = rest.find((a) => !a.startsWith("--"));
// Cổng chặn chạy TRƯỚC khi đọc API key hoặc gọi mạng.
const { spec, timestampsPath } = prepareRun(name, { projDir });

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("Thiếu ELEVENLABS_API_KEY trong .env");

const VOICE_ID = "9CCqsrTCLkHgQlKSMchK";
const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.8,
  style: 0.2,
  use_speaker_boost: true,
};
// Ưu tiên model mới nhất hỗ trợ tiếng Việt; key không có quyền models_read nên thử lần lượt.
const MODEL_CHAIN = ["eleven_v4", "eleven_v3", "eleven_turbo_v2_5", "eleven_multilingual_v2"];
const SUPPORTS_LANGUAGE_CODE = (m) => m !== "eleven_multilingual_v2";

const forced = process.argv.find((a) => a.startsWith("--model="))?.split("=")[1];
const audioDir = videoPaths(spec.name, projDir).audioDir;
fs.mkdirSync(audioDir, { recursive: true });

const SEED = 20260;
let prevRequestIds = []; // nối giọng giữa các cảnh để không bị đổi giọng/âm sắc

async function tts(model, text, settings) {
  const body = { text, model_id: model, voice_settings: settings, seed: SEED };
  if (prevRequestIds.length) body.previous_request_ids = prevRequestIds.slice(-3);
  if (SUPPORTS_LANGUAGE_CODE(model)) body.language_code = "vi";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  data.request_id = res.headers.get("request-id");
  return data;
}

/** Thử model (và stability gần nhất nếu bị từ chối). */
async function ttsWithFallback(model, text) {
  try {
    return { data: await tts(model, text, VOICE_SETTINGS), settings: VOICE_SETTINGS };
  } catch (e) {
    if (e.status === 400 || e.status === 422) {
      const relaxed = { ...VOICE_SETTINGS, stability: 0.5 };
      if (/stability/i.test(e.message)) {
        return { data: await tts(model, text, relaxed), settings: relaxed };
      }
    }
    throw e;
  }
}

const parsed = spec.scenes.map((s) => {
  const tokens = parseMarkup(s.markup);
  const speech = tokens.filter((t) => t.say).map((t) => t.say).join(" ");
  return { ...s, tokens, speech };
});

let model = null;
let usedSettings = VOICE_SETTINGS;
const results = [];

for (const [i, scene] of parsed.entries()) {
  let out;
  const candidates = model ? [model] : forced ? [forced] : MODEL_CHAIN;
  for (const m of candidates) {
    try {
      out = { ...(await ttsWithFallback(m, scene.speech)), model: m };
      break;
    } catch (e) {
      console.log(`  model ${m}: không dùng được (${e.message.replace(KEY, "***")})`);
    }
  }
  if (!out) throw new Error(`Không model nào chạy được cho ${scene.id}`);
  if (!model) {
    model = out.model;
    usedSettings = out.settings;
    console.log(`Dùng model: ${model}, stability=${usedSettings.stability}`);
  }

  if (out.data.request_id) prevRequestIds.push(out.data.request_id);
  const file = path.join(audioDir, `${scene.id}.mp3`);
  fs.writeFileSync(file, Buffer.from(out.data.audio_base64, "base64"));

  const { chars, starts, ends } = {
    chars: out.data.alignment.characters,
    starts: out.data.alignment.character_start_times_seconds,
    ends: out.data.alignment.character_end_times_seconds,
  };
  if (chars.length !== scene.speech.length) {
    throw new Error(`${scene.id}: alignment ${chars.length} ký tự != text ${scene.speech.length}`);
  }

  // Map từng token (chữ hiển thị) về khoảng thời gian của phần chữ đọc.
  let cursor = 0;
  const words = scene.tokens.map((t) => {
    if (!t.say) return { text: t.show, start: null, end: null };
    const a = cursor;
    const b = cursor + t.say.length - 1;
    cursor = b + 2; // bỏ dấu cách
    return { text: t.show, start: starts[a], end: ends[b] };
  });
  // Token chỉ hiển thị: lấy mốc bắt đầu của từ kế tiếp.
  words.forEach((w, k) => {
    if (w.start === null) {
      const next = words.slice(k + 1).find((x) => x.start !== null);
      w.start = w.end = next ? next.start : words[k - 1].end;
    }
  });

  const info = await parseMedia({
    src: file,
    reader: nodeReader,
    fields: { durationInSeconds: true },
    acknowledgeRemotionLicense: true,
  });
  results.push({ id: scene.id, durationSec: info.durationInSeconds, speech: scene.speech, words });
  console.log(`${scene.id}: ${info.durationInSeconds.toFixed(2)}s, ${words.length} từ`);
}

fs.writeFileSync(
  timestampsPath,
  JSON.stringify({ model, voiceId: VOICE_ID, voiceSettings: usedSettings, scenes: results }, null, 2),
);
console.log(`Đã ghi ${timestampsPath}`);
