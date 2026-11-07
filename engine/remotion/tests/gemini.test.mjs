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

test("nghienCuu: model đầu không còn (404) thì tự thử model kế tiếp, ghi model đã dùng", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gem-"));
  const urls = [];
  const fetchFn = async (url) => {
    urls.push(url);
    if (urls.length === 1) return { ok: false, status: 404, text: async () => "model not found" };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] }, groundingMetadata: { groundingChunks: [{ web: { uri: "https://x.vn" } }] } }] }) };
  };
  const { MODELS } = await import("../scripts/gemini.mjs");
  const r = await nghienCuu({ topic: "a", key: "k", outDir: dir, template: TEMPLATE, fetchFn, models: MODELS });
  assert.equal(urls.length, 2);
  assert.ok(urls[1].includes(MODELS[1]));
  assert.equal(r.model, MODELS[1]);
  assert.ok(fs.readFileSync(r.file, "utf8").includes(MODELS[1]));
});

test("nghienCuu: lần đầu Gemini không tìm Google (không có nguồn) thì hỏi lại 1 lần, nhắc bắt buộc tìm Google", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gem-"));
  const bodies = [];
  const fetchFn = async (_url, opt) => {
    bodies.push(JSON.parse(opt.body));
    const grounded = bodies.length === 2;
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: grounded ? "có nguồn" : "trí nhớ" }] },
          ...(grounded ? { groundingMetadata: { groundingChunks: [{ web: { uri: "https://x.vn/a", title: "x.vn" } }] } } : {}),
        }],
      }),
    };
  };
  const r = await nghienCuu({ topic: "a", key: "k", outDir: dir, template: TEMPLATE, fetchFn });
  assert.equal(bodies.length, 2);
  assert.match(bodies[1].contents[0].parts[0].text, /Google Search/);
  assert.equal(r.text, "có nguồn");
  assert.equal(r.sources.length, 1);
});

test("nghienCuu: hỏi lại vẫn không có nguồn thì giữ kết quả, ghi cảnh báo; không hỏi quá 2 lần", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gem-"));
  let n = 0;
  const fetchFn = async () => (n++, { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "trí nhớ" }] } }] }) });
  const r = await nghienCuu({ topic: "a", key: "k", outDir: dir, template: TEMPLATE, fetchFn });
  assert.equal(n, 2);
  assert.equal(r.sources.length, 0);
  assert.match(fs.readFileSync(r.file, "utf8"), /KHÔNG trả danh sách trang/);
});

test("khung prompt thật: bắt tìm Google, trích nguyên văn, ghi kỳ số liệu", () => {
  const p = buildPrompt(fs.readFileSync(new URL("../../../docs/prompt-gemini-nghien-cuu.md", import.meta.url), "utf8"), "lãi suất");
  assert.match(p, /Google Search/);
  assert.match(p, /nguyên văn/i);
  assert.match(p, /Kỳ số liệu/);
});
