import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildPrompt, slugify, nghienCuu, DEFAULT_MODEL } from "../scripts/gemini.mjs";

const TEMPLATE = "Khung\n```\nTìm trong [KHOẢNG THỜI GIAN: ví dụ 30 ngày qua] về [CHỦ ĐỀ: ví dụ lãi suất]. Đào sâu [CHỦ ĐỀ].\n```\n";

test("buildPrompt: lấy khung trong ``` và điền chủ đề, khoảng thời gian", () => {
  const p = buildPrompt(TEMPLATE, "lãi suất vay tháng 11", "30 ngày qua");
  assert.ok(p.includes("lãi suất vay tháng 11") && p.includes("30 ngày qua"));
  assert.ok(!p.includes("[CHỦ ĐỀ") && !p.includes("[KHOẢNG"));
  assert.ok(!p.includes("```"));
});

test("slugify: tiếng Việt về a-z0-9-", () => {
  assert.equal(slugify("Lãi suất vay mua nhà Đồng Nai!"), "lai-suat-vay-mua-nha-dong-nai");
});

test("nghienCuu: gọi Gemini có tìm Google, lưu báo cáo + danh sách link nguồn; thiếu key thì báo, không gọi mạng", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gem-"));
  const calls = [];
  const fetchFn = async (url, opt) => {
    calls.push({ url, body: JSON.parse(opt.body), key: opt.headers["x-goog-api-key"] });
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: "Lãi suất 8,5%" }, { text: " theo VnExpress." }] },
          groundingMetadata: { groundingChunks: [{ web: { uri: "https://vnexpress.net/a", title: "VnExpress" } }, { web: { uri: "https://vnexpress.net/a", title: "VnExpress" } }] },
        }],
      }),
    };
  };
  await assert.rejects(nghienCuu({ topic: "x", key: "", outDir: dir, template: TEMPLATE, fetchFn }), /GEMINI_API_KEY/);
  assert.equal(calls.length, 0);
  const r = await nghienCuu({ topic: "Lãi suất", key: "k", outDir: dir, template: TEMPLATE, fetchFn, today: "2026-11-07" });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.includes(`/models/${DEFAULT_MODEL}:generateContent`));
  assert.equal(calls[0].key, "k");
  assert.deepEqual(calls[0].body.tools, [{ google_search: {} }]);
  assert.equal(path.basename(r.file), "2026-11-07-lai-suat.md");
  const md = fs.readFileSync(r.file, "utf8");
  assert.ok(md.includes("Lãi suất 8,5% theo VnExpress."));
  assert.equal((md.match(/https:\/\/vnexpress\.net\/a/g) ?? []).length, 1, "link nguồn không trùng");
  assert.match(md, /chưa kiểm/i, "ghi rõ số liệu chưa được Claude kiểm");
  assert.equal(r.sources.length, 1);
});
