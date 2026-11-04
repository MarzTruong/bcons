import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadMapboxEnv } from "../scripts/env.mjs";

const envFile = (text) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "bcons-env-")), ".env");
  fs.writeFileSync(f, text);
  return f;
};

test("thiếu MAPBOX_TOKEN_KEY báo lỗi tiếng Việt, không lộ giá trị khác", () => {
  const f = envFile("ELEVENLABS_API_KEY=bi-mat-khong-duoc-lo\n");
  const env = {};
  assert.throws(
    () => loadMapboxEnv(f, env),
    (e) => /MAPBOX_TOKEN_KEY/.test(e.message) && !e.message.includes("bi-mat-khong-duoc-lo"),
  );
  assert.equal(env.REMOTION_MAPBOX_TOKEN, undefined);
});

test("có token thì đặt REMOTION_MAPBOX_TOKEN (bỏ ngoặc kép, khoảng trắng)", () => {
  const env = {};
  const t = loadMapboxEnv(envFile('A=1\nMAPBOX_TOKEN_KEY = "pk.abc"\n'), env);
  assert.equal(t, "pk.abc");
  assert.equal(env.REMOTION_MAPBOX_TOKEN, "pk.abc");
});

test("token rỗng bị coi là thiếu", () => {
  assert.throws(() => loadMapboxEnv(envFile("MAPBOX_TOKEN_KEY=\n"), {}), /MAPBOX_TOKEN_KEY/);
});
