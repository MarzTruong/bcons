// Dời repo sang cấu trúc engine/ + du-an/<mã>/ (kế hoạch 01).
// Chạy ở gốc repo:
//   node engine/automation/doi-thu-muc.mjs           # chạy thử: chỉ in bảng, không dời gì
//   node engine/automation/doi-thu-muc.mjs --chay    # dời thật
// Không gọi git. Trên máy anh: git pull trước (git tự dời file có trong git), rồi chạy script
// để dời phần chỉ có trên máy (.env, out/, node_modules/, data/, anh/...). Chạy lại nhiều lần không hỏng.
// Không bao giờ ghi đè: đích đã có thì bỏ qua và báo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MA = "bcons-central-park";
const DA = `du-an/${MA}`;
const ROOT_PROMPTS = new Set(["huong_dan_su_dung_prompt_remotion_bcons.md", "prompt_cao_du_lieu_bds_bcons_central_park.md"]);

const exists = (p) => fs.existsSync(p);
const isDir = (p) => exists(p) && fs.statSync(p).isDirectory();
const children = (p) => (isDir(p) ? fs.readdirSync(p).sort() : []);

/** Danh sách cặp { from, to } (đường dẫn tương đối gốc repo, dấu "/"). */
export function buildPairs(root) {
  const R = (p) => path.join(root, p);
  const pairs = [];
  const add = (from, to) => pairs.push({ from, to });

  // Spec + timestamps → mỗi video một thư mục
  for (const f of children(R("remotion-video/specs"))) {
    const ts = f.match(/^(.+)\.timestamps\.json$/);
    if (ts) add(`remotion-video/specs/${f}`, `${DA}/video/${ts[1]}/timestamps.json`);
    else if (f.endsWith(".json")) add(`remotion-video/specs/${f}`, `${DA}/video/${f.slice(0, -5)}/spec.json`);
    else add(`remotion-video/specs/${f}`, `${DA}/video/${f}`);
  }
  // public/ của Remotion → thư mục dự án
  for (const f of children(R("remotion-video/public"))) {
    if (f === "audio") {
      for (const n of children(R("remotion-video/public/audio"))) add(`remotion-video/public/audio/${n}`, `${DA}/video/${n}/audio`);
    } else add(`remotion-video/public/${f}`, `${DA}/assets/${f}`);
  }
  // Phần còn lại của remotion-video/ → engine/remotion/
  for (const f of children(R("remotion-video"))) {
    if (f !== "specs" && f !== "public") add(`remotion-video/${f}`, `engine/remotion/${f}`);
  }
  // Kịch bản, storyboard
  for (const f of children(R("docs/video"))) {
    const sb = f.match(/^(.+)-storyboard\.md$/);
    if (f === "flycam.md") add(`docs/video/${f}`, `${DA}/assets/flycam.md`);
    else if (f === "geo-nguon.md") add(`docs/video/${f}`, `${DA}/assets/geo/NGUON.md`);
    else if (sb) add(`docs/video/${f}`, `${DA}/video/${sb[1]}/storyboard.md`);
    else if (f.endsWith(".md")) add(`docs/video/${f}`, `${DA}/video/${f.slice(0, -3)}/kich-ban.md`);
    else add(`docs/video/${f}`, `${DA}/video/${f}`);
  }
  for (const f of children(R("map"))) add(`map/${f}`, `${DA}/assets/geo/osm-xuat/${f}`);
  for (const f of children(R("Gemini Deep Research"))) add(`Gemini Deep Research/${f}`, `${DA}/nguon/gemini/${f}`);
  if (exists(R("docs/bcons-central-park.md"))) add("docs/bcons-central-park.md", `${DA}/thong-tin.md`);
  for (const f of children(R("docs/content"))) {
    if (f === "doi-chieu-nguon-gia-tri-du-an.md") add(`docs/content/${f}`, `${DA}/nguon/doi-chieu-gia-tri-du-an.md`);
    else add(`docs/content/${f}`, `${DA}/content/${f}`);
  }
  for (const f of children(R("tools"))) add(`tools/${f}`, `engine/automation/${f}`);
  // Chỉ có trên máy anh (gitignored)
  for (const f of children(R("data"))) if (f !== MA) add(`data/${f}`, `data/${MA}/${f}`);
  for (const f of children(R("anh"))) if (f !== MA) add(`anh/${f}`, `anh/${MA}/${f}`);
  for (const f of children(root)) if (ROOT_PROMPTS.has(f)) add(f, f); // giữ nguyên chỗ, chỉ để không bị quên
  return pairs.filter((p) => p.from !== p.to);
}

/** Gắn hành động cho từng cặp: move | merge | skip-exists | skip-missing. */
export function planMoves(root) {
  return buildPairs(root).map(({ from, to }) => {
    const src = path.join(root, from);
    const dst = path.join(root, to);
    let action;
    if (!exists(src)) action = "skip-missing";
    else if (!exists(dst)) action = "move";
    else if (isDir(src) && isDir(dst)) action = "merge";
    else action = "skip-exists";
    return { from, to, action };
  });
}

/** Dời src → dst; thư mục trùng thì gộp từng con; không ghi đè. Trả danh sách file bị bỏ qua vì đã có. */
function moveInto(src, dst, skipped, locked) {
  try {
    if (!exists(dst)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(src, dst);
      return;
    }
    if (isDir(src) && isDir(dst)) {
      for (const c of fs.readdirSync(src)) moveInto(path.join(src, c), path.join(dst, c), skipped, locked);
      if (fs.readdirSync(src).length === 0) fs.rmdirSync(src);
      return;
    }
    skipped.push(src);
  } catch (e) {
    // Windows hay khóa file (Defender, VS Code, cửa sổ terminal đang đứng trong thư mục): báo và đi tiếp.
    locked.push({ src, code: e.code ?? e.message });
  }
}

/** Viết lại đường dẫn tĩnh trong spec: "geo/..." và "images/..." ở khóa "file" → "assets/...". */
export function rewriteAssetPaths(node) {
  if (Array.isArray(node)) return node.map(rewriteAssetPaths);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = k === "file" && typeof v === "string" && /^(geo|images)\//.test(v) ? `assets/${v}` : rewriteAssetPaths(v);
    }
    return out;
  }
  return node;
}

function rewriteSpecs(root) {
  const videoRoot = path.join(root, DA, "video");
  let changed = 0;
  for (const n of children(videoRoot)) {
    const file = path.join(videoRoot, n, "spec.json");
    if (!exists(file)) continue;
    const before = fs.readFileSync(file, "utf8");
    const after = JSON.stringify(rewriteAssetPaths(JSON.parse(before)), null, 2) + "\n";
    if (after !== before && JSON.stringify(JSON.parse(after)) !== JSON.stringify(JSON.parse(before))) {
      fs.writeFileSync(file, after);
      changed++;
    }
  }
  return changed;
}

function removeEmptyDirs(root, rels) {
  for (const rel of rels) {
    const dir = path.join(root, rel);
    const prune = (d) => {
      if (!isDir(d)) return;
      for (const c of fs.readdirSync(d)) prune(path.join(d, c));
      if (fs.readdirSync(d).length === 0) fs.rmdirSync(d);
    };
    prune(dir);
  }
}

const LABEL = { move: "DỜI      ", merge: "GỘP      ", "skip-exists": "BỎ QUA (đích đã có) ", "skip-missing": "BỎ QUA (không có)   " };
const OLD_DIRS = ["remotion-video", "docs/video", "docs/content", "map", "Gemini Deep Research", "tools"];

/** Chạy: in bảng; nếu run=true thì dời, viết lại spec, xóa thư mục cũ đã rỗng. */
export function run(root, { chay = false, log = console.log } = {}) {
  const plan = planMoves(root);
  for (const p of plan) log(`${LABEL[p.action]} ${p.from}  →  ${p.to}`);
  if (!chay) {
    log(`\nChạy thử xong (${plan.filter((p) => p.action === "move" || p.action === "merge").length} mục sẽ dời). Thêm --chay để dời thật.`);
    return { plan, skipped: [] };
  }
  const skipped = [];
  const locked = [];
  for (const p of plan) if (p.action === "move" || p.action === "merge") moveInto(path.join(root, p.from), path.join(root, p.to), skipped, locked);
  const specs = rewriteSpecs(root);
  try {
    removeEmptyDirs(root, OLD_DIRS);
  } catch {
    // thư mục đang bị khóa: để anh tự xóa sau
  }
  for (const s of skipped) log(`BỎ QUA (đích đã có): ${path.relative(root, s)}`);
  for (const l of locked) {
    const nm = /node_modules/.test(l.src) ? " (không sao: chạy npm ci trong engine/remotion)" : "";
    log(`KHÔNG DỜI ĐƯỢC (đang bị khóa, ${l.code}): ${path.relative(root, l.src)}${nm}`);
  }
  if (locked.length) log("Đóng VS Code, Remotion Studio và cửa sổ terminal đang đứng trong thư mục đó, rồi chạy lại lệnh --chay.");
  const left = OLD_DIRS.filter((d) => exists(path.join(root, d)));
  log(`\nĐã dời. Viết lại ${specs} spec. ${left.length ? `Thư mục cũ còn sót (kiểm rồi tự xóa): ${left.join(", ")}` : "Không còn thư mục cũ."}`);
  return { plan, skipped, locked };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  run(process.cwd(), { chay: args.includes("--chay") && !args.includes("--dry-run") });
}
