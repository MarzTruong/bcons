import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Anh báo 05/11 và 07/11/2026: giọng trôi sang giọng Bắc giữa chừng. Giọng gốc là giọng nhân bản miền Nam,
// cần độ ổn định cao, bám sát giọng gốc, style vừa phải (anh muốn giữ cảm xúc). Test này giữ cài đặt không bị đổi lại.
test("cài đặt giọng ElevenLabs giữ chặt giọng miền Nam (không trôi giọng Bắc)", () => {
  const src = fs.readFileSync(new URL("../scripts/generate-voice.mjs", import.meta.url), "utf8");
  const num = (k) => Number(src.match(new RegExp(`${k}:\\s*([0-9.]+)`))[1]);
  assert.ok(num("stability") >= 0.8, "stability >= 0.8");
  assert.ok(num("similarity_boost") >= 0.9, "similarity_boost >= 0.9");
  assert.ok(num("style") <= 0.2, "style tối đa 0.2 (anh muốn giữ cảm xúc 07/11/2026)");
  assert.match(src, /language_code\s*=\s*"vi"/);
  assert.doesNotMatch(src, /stability:\s*0\.5\b/, "không hạ stability xuống 0.5 khi model từ chối");
});
