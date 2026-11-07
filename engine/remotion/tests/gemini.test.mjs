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
  assert.ok(calls[0].url.includes(`/models/${DEFAULT_MODEL}:streamGenerateContent`));
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

test("nghienCuu: gọi bản stream (SSE) để proxy không cắt khi Gemini tìm lâu; ghép chữ + nguồn từ nhiều mẩu; đổi link chuyển hướng Google về link gốc", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gem-"));
  const R = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AAA";
  const ev = (o) => `data: ${JSON.stringify(o)}\r\n\r\n`;
  const sse =
    ev({ candidates: [{ content: { parts: [{ text: "Lãi 9–12% " }] } }] }) +
    ev({ candidates: [{ content: { parts: [{ text: `([VnExpress](${R}))` }] }, groundingMetadata: { groundingChunks: [{ web: { uri: R, title: "vnexpress.net" } }] } }] });
  const urls = [];
  const fetchFn = async (url, opt = {}) => {
    urls.push(url);
    if (url === R) return { status: 302, headers: { get: (h) => (h.toLowerCase() === "location" ? "https://vnexpress.net/bai-that-123.html" : null) } };
    return { ok: true, text: async () => sse };
  };
  const r = await nghienCuu({ topic: "a", key: "k", outDir: dir, template: TEMPLATE, fetchFn });
  assert.match(urls[0], /:streamGenerateContent\?alt=sse$/);
  assert.equal(r.text, "Lãi 9–12% ([VnExpress](https://vnexpress.net/bai-that-123.html))");
  assert.deepEqual(r.sources, [{ uri: "https://vnexpress.net/bai-that-123.html", title: "vnexpress.net" }]);
  assert.ok(!fs.readFileSync(r.file, "utf8").includes("vertexaisearch"));
});

test("nghienCuu: không đổi được link chuyển hướng (mạng chặn) thì giữ link cũ, không lỗi", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gem-"));
  const R = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/BBB";
  const sse = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "x" }] }, groundingMetadata: { groundingChunks: [{ web: { uri: R, title: "t" } }] } }] })}\n\n`;
  const fetchFn = async (url) => {
    if (url === R) throw new Error("blocked");
    return { ok: true, text: async () => sse };
  };
  const r = await nghienCuu({ topic: "a", key: "k", outDir: dir, template: TEMPLATE, fetchFn });
  assert.equal(r.sources[0].uri, R);
});

test("nghienCuu: bật gửi tóm tắt suy nghĩ (giữ kết nối qua proxy) nhưng KHÔNG ghi phần suy nghĩ vào báo cáo", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gem-"));
  let body;
  const ev = (o) => `data: ${JSON.stringify(o)}\n\n`;
  const sse = ev({ candidates: [{ content: { parts: [{ text: "Đang nghĩ...", thought: true }] } }] }) + ev({ candidates: [{ content: { parts: [{ text: "Kết quả" }] }, groundingMetadata: { groundingChunks: [{ web: { uri: "https://a.vn/x", title: "a" } }] } }] });
  const fetchFn = async (_u, opt) => ((body = JSON.parse(opt.body)), { ok: true, text: async () => sse });
  const r = await nghienCuu({ topic: "a", key: "k", outDir: dir, template: TEMPLATE, fetchFn });
  assert.equal(body.generationConfig.thinkingConfig.includeThoughts, true);
  assert.equal(r.text, "Kết quả");
});

test("doiLinkBang: link Gemini tự viết trong bảng → thay bằng link nguồn thật cùng báo (giống tên bài nhất); không có thì gắn ⚠️", async () => {
  const { doiLinkBang } = await import("../scripts/gemini.mjs");
  const sources = [
    { uri: "https://cafef.vn/noi-room-tin-dung-bat-dong-san-them-du-dia-phat-trien-188261014121508775.chn" },
    { uri: "https://cafef.vn/can-canh-vanh-dai-3-tphcm-doan-qua-dong-nai-188261029.chn" },
    { uri: "https://baoxaydung.vn/nut-giao-tan-hiep-noi-hai-cao-toc-192261031.htm" },
  ];
  const t = [
    "[Link](https://cafef.vn/noi-room-tin-dung-bat-dong-san-them-du-dia-phat-trien-20261014123800.chn)",
    "[Link](https://www.baoxaydung.com.vn/nut-giao-tan-hiep-noi-hai-cao-toc-385077.html)",
    "[Link](https://vnexpress.net/bai-bia-123.html)",
    "[ok](https://cafef.vn/can-canh-vanh-dai-3-tphcm-doan-qua-dong-nai-188261029.chn)",
  ].join("\n");
  const out = doiLinkBang(t, sources).split("\n");
  assert.equal(out[0], `[Link](${sources[0].uri})`);
  assert.equal(out[1], `[Link](${sources[2].uri})`);
  assert.equal(out[2], "[Link ⚠️ link Gemini tự viết, không có trong trang đã đọc](https://vnexpress.net/bai-bia-123.html)");
  assert.equal(out[3], `[ok](${sources[1].uri})`);
});
