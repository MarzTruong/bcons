// Đọc và kiểm caption.md (bài Facebook + caption TikTok) theo quy tắc cứng trong CLAUDE.md.
// Định dạng: frontmatter (status, duyetLuc, noiDungSha256, videoSha256, kenh) rồi "## Facebook", "## TikTok".
import crypto from "node:crypto";

const FRONT_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const KEYS = ["status", "duyetLuc", "noiDungSha256", "videoSha256"];
const TIKTOK_MAX = 2200;

function splitFront(raw) {
  const text = raw.replace(/^\uFEFF/, ""); // bỏ BOM (Notepad trên Windows hay thêm)
  const m = text.match(FRONT_RE);
  return m ? { front: m[1], body: text.slice(m[0].length), offset: m[0].split("\n").length - 1 } : { front: "", body: text, offset: 0 };
}

function unquote(v) {
  return v.replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
}

/** Đọc caption: meta, phần Facebook, phần TikTok, body (sau frontmatter). */
export function parseCaption(text) {
  const { front, body } = splitFront(text);
  const meta = { status: "", duyetLuc: "", noiDungSha256: "", videoSha256: "", kenh: [] };
  for (const line of front.split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    if (m[1] === "kenh") {
      meta.kenh = unquote(m[2]).replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    } else if (KEYS.includes(m[1])) meta[m[1]] = unquote(m[2]);
  }
  const section = (name) => {
    const re = new RegExp(`^##\\s+${name}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "mi");
    const m = body.match(re);
    return m ? m[1].replace(/\r\n/g, "\n").trim() : null;
  };
  return { meta, facebook: section("Facebook"), tiktok: section("TikTok"), body };
}

function normalizeBody(body) {
  return body.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trim();
}

/** sha256 của phần nội dung (không tính frontmatter), không phụ thuộc kiểu xuống dòng. */
export function bodyHash(text) {
  return crypto.createHash("sha256").update(normalizeBody(splitFront(text).body)).digest("hex");
}

/** Bỏ dấu, chữ thường: so cụm từ không phụ thuộc cách gõ. */
function fold(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

const BANNED = [
  "cam kết lợi nhuận",
  "lợi nhuận chắc chắn",
  "chắc chắn tăng giá",
  "đảm bảo tăng giá",
  "x2 tài sản",
  "sắp hết hàng",
  "căn cuối cùng",
  "cam kết sinh lời",
  "đảm bảo sinh lời",
  "sinh lời chắc chắn",
];
// SĐT: 0xxx hoặc (+)84xxx, 9–11 chữ số, ngăn bởi cách/chấm/gạch; dấu ngoặc bỏ trước khi so.
const PHONE_RE = /(?<![\d.,])(?:\+?84|0)(?:[\s.-]?\d){8,10}(?!\d)/g;
// Giá (so trên chữ đã bỏ dấu): 2,06 tỷ / 2 tỉ / 300 triệu / 300tr
const PRICE_RE = /\d[\d.,]*\s*(ty|ti|trieu|tr)\b/;
// Ngữ cảnh giá căn hộ (không áp cho giá đấu giá đất, vốn đầu tư)
const APT_RE = /\bcan\b|gia (ban|tu|chi tu)|so huu/;

/** Danh sách lỗi (tiếng Việt). Rỗng = qua. */
export function checkCaption(text) {
  const errs = [];
  const { meta, facebook, tiktok } = parseCaption(text);
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const lineOf = (i) => `dòng ${i + 1}`;
  const kenh = meta.kenh.length ? meta.kenh : ["facebook", "tiktok"];
  if (kenh.includes("facebook") && !facebook) errs.push('Thiếu phần "## Facebook"');
  if (kenh.includes("tiktok") && !tiktok) errs.push('Thiếu phần "## TikTok"');
  if (tiktok && tiktok.length > TIKTOK_MAX) errs.push(`Caption TikTok dài ${tiktok.length} ký tự, tối đa 2.200`);
  if (meta.status === "approved" && !meta.duyetLuc) errs.push("status approved nhưng thiếu duyetLuc");

  // FB và TikTok đăng riêng nên mỗi phần phải tự ghi VAT + phí bảo trì khi nhắc giá căn.
  const vatOk = (sec) => !!sec && /\bvat\b/.test(fold(sec)) && /bao tri/.test(fold(sec));
  const vatBySection = { facebook: vatOk(facebook), tiktok: vatOk(tiktok), "": false };
  let sec = "";
  const start = splitFront(text).offset;
  lines.forEach((line, i) => {
    if (i < start) return; // bỏ qua frontmatter
    const h = line.match(/^##\s+(facebook|tiktok)\s*$/i);
    if (h) {
      sec = h[1].toLowerCase();
      return;
    }
    for (const m of line.replace(/[()]/g, "").matchAll(PHONE_RE)) errs.push(`${lineOf(i)}: có số điện thoại "${m[0].trim()}" (không đưa SĐT vào bài)`);
    const f = fold(line);
    for (const b of BANNED) if (f.includes(fold(b))) errs.push(`${lineOf(i)}: cụm "${b}" (không hứa lợi nhuận/tăng giá, không nói sắp hết)`);
    if (/loi nhuan\s*\d/.test(f)) errs.push(`${lineOf(i)}: nêu số lợi nhuận (không hứa lợi nhuận)`);
    if (PRICE_RE.test(f) && APT_RE.test(f) && !vatBySection[sec]) {
      errs.push(`${lineOf(i)}: nhắc giá căn nhưng phần ${sec === "tiktok" ? "TikTok" : "Facebook"} chưa ghi rõ VAT và phí bảo trì 2%`);
    }
  });
  return errs;
}

/** Trả caption mới với frontmatter đã cập nhật theo patch; nội dung giữ nguyên. */
export function writeMeta(text, patch) {
  const { body } = splitFront(text);
  const meta = { ...parseCaption(text).meta, ...patch };
  const front = [
    `status: ${meta.status || "draft"}`,
    `duyetLuc: "${meta.duyetLuc ?? ""}"`,
    `noiDungSha256: "${meta.noiDungSha256 ?? ""}"`,
    `videoSha256: "${meta.videoSha256 ?? ""}"`,
    `kenh: [${(meta.kenh.length ? meta.kenh : ["facebook", "tiktok"]).join(", ")}]`,
  ].join("\n");
  return `---\n${front}\n---\n${body}`;
}
