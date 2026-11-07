// Nghiên cứu số liệu bằng Gemini có tìm Google (gói trả phí, anh chọn 07/11/2026).
// Chạy trên máy anh (key trong .env): npm run gemini -- "<chủ đề>" [--khoang "30 ngày qua"]   — bot: /gemini <chủ đề>
// Kết quả lưu du-an/<mã>/nguon/gemini/<ngày>-<chủ-đề>.md. Gemini chỉ thu thập; Claude mở từng link kiểm số ở cổng 1.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, takeProjectFlag } from "./project.mjs";

/**
 * Chọn model 07/11/2026 (anh: ưu tiên chất lượng thông tin, chi phí hợp lý): Gemini 3.1 Pro.
 * Mỗi lần nghiên cứu khoảng 2K token vào + 4–6K token ra → vài cent; tìm Google: 5.000 lượt/tháng miễn phí rồi 14 USD/1.000.
 * Flash rẻ hơn ~4 lần nhưng tổng hợp và lọc nguồn kém hơn; với vài lần/tuần thì Pro đáng tiền hơn.
 * Model bị Google ngừng (404) thì tự thử model kế tiếp. Ghi đè bằng GEMINI_MODEL trong .env.
 */
export const MODELS = ["gemini-3.1-pro-preview", "gemini-3-pro-preview", "gemini-2.5-pro"];
export const DEFAULT_MODEL = MODELS[0];
export const TEMPLATE_PATH = path.join(REPO_ROOT, "docs", "prompt-gemini-nghien-cuu.md");

/** Lấy khung prompt trong khối ``` của docs/prompt-gemini-nghien-cuu.md, điền chủ đề và khoảng thời gian. */
export function buildPrompt(template, topic, khoang = "30 ngày qua") {
  const m = template.match(/```[a-z]*\n([\s\S]*?)```/);
  const body = (m ? m[1] : template).trim();
  return body.replace(/\[KHOẢNG THỜI GIAN[^\]]*\]/g, khoang).replace(/\[CHỦ ĐỀ[^\]]*\]/g, topic);
}

export function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function nghienCuu({ topic, key, outDir, template = fs.readFileSync(TEMPLATE_PATH, "utf8"), khoang, model, models = model ? [model] : MODELS, fetchFn = fetch, today = new Date().toISOString().slice(0, 10) }) {
  if (!key) throw new Error("Thiếu GEMINI_API_KEY trong engine/remotion/.env");
  if (!topic?.trim()) throw new Error('Thiếu chủ đề. Ví dụ: /gemini lãi suất vay mua nhà tháng 11');
  const prompt = buildPrompt(template, topic.trim(), khoang);
  let res;
  let used;
  for (const m of models) {
    res = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }),
    });
    used = m;
    if (res.ok || res.status !== 404) break; // 404 = model không còn: thử model kế
  }
  if (!res.ok) throw new Error(`Gemini lỗi ${res.status} (${used}): ${(await res.text?.())?.slice(0, 300) ?? ""}`);
  const data = await res.json();
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini không trả nội dung (có thể bị chặn hoặc hết hạn mức).");
  const seen = new Set();
  const sources = [];
  for (const c of cand?.groundingMetadata?.groundingChunks ?? []) {
    const uri = c.web?.uri;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ uri, title: c.web.title ?? uri });
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${today}-${slugify(topic)}.md`);
  const md = [
    `# Gemini: ${topic.trim()} (${today})`,
    "",
    `> Model ${used}, có tìm Google. **Số liệu CHƯA KIỂM**: Claude phải mở link gốc đối chiếu từng con số (cổng 1 của /bcons-video) trước khi dùng.`,
    "",
    text,
    "",
    "## Trang Google mà Gemini đã đọc",
    ...(sources.length
      ? sources.map((s) => `- [${s.title}](${s.uri})`)
      : ["- ⚠️ Gemini KHÔNG trả danh sách trang đã tìm: có thể lần này không tìm Google mà viết từ trí nhớ, link trong bảng có thể sai/cũ. Bắt buộc mở từng link kiểm trước khi dùng."]),
    "",
  ].join("\n");
  fs.writeFileSync(file, md);
  return { file, text, sources, model: used };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
  const i = rest.indexOf("--khoang");
  const khoang = i >= 0 ? rest[i + 1] : undefined;
  const topic = rest.filter((_, j) => i < 0 || (j !== i && j !== i + 1)).join(" ");
  nghienCuu({
    topic,
    khoang,
    key: (process.env.GEMINI_API_KEY ?? "").trim(),
    model: (process.env.GEMINI_MODEL ?? "").trim() || undefined,
    outDir: path.join(projDir, "nguon", "gemini"),
  })
    .then((r) => {
      console.log(`Đã lưu ${path.relative(REPO_ROOT, r.file)} (${r.model}, ${r.sources.length} trang nguồn).`);
      if (!r.sources.length) console.log("⚠️ Gemini không báo đã tìm Google: link có thể sai hoặc cũ, phải kiểm từng link.");
      console.log(r.text.slice(0, 1500));
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
