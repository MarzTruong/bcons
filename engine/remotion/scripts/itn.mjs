// Chuẩn hóa số trên màn hình (Inverse Text Normalization, ITN) cho phụ đề và chữ hiện.
// Quy tắc: docs/quy-tac-so-phu-de.md. Lời ĐỌC giữ nguyên (không phải tạo giọng lại); chỉ đổi chữ HIỆN.
import { parseMarkup } from "./spec-tools.mjs";

const DIGIT = { không: 0, một: 1, mốt: 1, hai: 2, ba: 3, bốn: 4, tư: 4, năm: 5, lăm: 5, nhăm: 5, sáu: 6, bảy: 7, tám: 8, chín: 9 };
const SCALE = { nghìn: 1e3, ngàn: 1e3, triệu: 1e6, tỷ: 1e9 };
const NUMWORD = new Set([...Object.keys(DIGIT), "mười", "mươi", "trăm", "linh", "lẻ", "phẩy", ...Object.keys(SCALE)]);
const PUNCT = /[,.;:!?…]+$/;
const strip = (w) => w.replace(PUNCT, "").toLowerCase();

function parseInt_(words) {
  let total = 0;
  let group = 0;
  let pending = 0;
  let any = false;
  for (const w of words) {
    if (w in DIGIT) {
      pending = DIGIT[w];
      any = true;
    } else if (w === "mười") {
      group += 10 + 0;
      pending = 0;
      any = true;
    } else if (w === "mươi") {
      group += pending * 10;
      pending = 0;
    } else if (w === "trăm") {
      group += pending * 100;
      pending = 0;
    } else if (w === "linh" || w === "lẻ") {
      // số 0 hàng chục
    } else if (w in SCALE) {
      total += (group + pending || 1) * SCALE[w];
      group = 0;
      pending = 0;
    } else return null;
  }
  return any ? total + group + pending : null;
}

/** "chín ngàn ba trăm sáu mươi ba" → 9363; "bốn phẩy bốn" → 4.4; không phải số → null. */
export function viToNumber(text) {
  const words = String(text).trim().toLowerCase().split(/\s+/).map(strip).filter(Boolean);
  if (!words.length || !words.every((w) => NUMWORD.has(w))) return null;
  const i = words.indexOf("phẩy");
  if (i < 0) return parseInt_(words);
  const a = parseInt_(words.slice(0, i));
  const b = parseInt_(words.slice(i + 1));
  if (a == null || b == null) return null;
  return Number(`${a}.${b}`);
}

/** Số kiểu Việt Nam: 9.363; 99,26; năm (2026) không có dấu chấm. */
export function formatViNumber(n, { nam = false } = {}) {
  const [i, d] = String(n).split(".");
  const int = nam ? i : i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return d ? `${int},${d}` : int;
}

const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV" };
const isPlain = (t) => t.show === t.say;
const hasDigit = (s) => /\d/.test(s);

/** Các đoạn số viết chữ liên tiếp trong token thường: [start, end) chỉ số token. Bỏ "năm" đứng đầu (dễ là "năm" = year). */
function numberRuns(tokens) {
  const runs = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    const w = strip(t.show);
    const startsOk = isPlain(t) && NUMWORD.has(w) && w !== "năm" && w !== "phẩy" && !(w in SCALE) && w !== "linh" && w !== "lẻ";
    if (!startsOk) {
      i++;
      continue;
    }
    let j = i;
    while (j < tokens.length && isPlain(tokens[j]) && NUMWORD.has(strip(tokens[j].show))) {
      if (PUNCT.test(tokens[j].show)) {
        j++;
        break;
      }
      j++;
    }
    // "năm" cuối đoạn mà trước đó không phải mươi/trăm/linh/phẩy: là "năm" (year), bỏ ra
    while (j - 1 > i && strip(tokens[j - 1].show) === "năm" && !["mươi", "trăm", "linh", "lẻ", "phẩy", "mười"].includes(strip(tokens[j - 2].show))) j--;
    // đơn vị lớn (tỷ, ngàn) đi sau số: giữ chữ, không gộp
    while (j - 1 > i && strip(tokens[j - 1].show) in SCALE) j--;
    const words = tokens.slice(i, j).map((x) => x.show);
    const v = viToNumber(words.join(" "));
    const big = v != null && (v >= 10 || words.length >= 2);
    if (big) runs.push([i, j, v]);
    i = Math.max(j, i + 1);
  }
  return runs;
}

/** Lỗi chuẩn hóa số trong chữ hiện (lint). */
export function checkSpelledNumbers(spec) {
  const errs = [];
  for (const scene of spec.scenes) {
    const tokens = parseMarkup(scene.markup);
    for (const [i, j, v] of numberRuns(tokens)) {
      const words = tokens.slice(i, j).map((x) => x.show).join(" ");
      errs.push(`Cảnh ${scene.id}: "${words}" → viết số ${formatViNumber(v)} (vd. ${formatViNumber(v)}{${words.replace(PUNCT, "")}})`);
    }
    tokens.forEach((t, k) => {
      const a = tokens[k + 1];
      const b = tokens[k + 2];
      if (hasDigit(t.show) && a && b && isPlain(a) && isPlain(b) && strip(a.show) === "một" && strip(b.show) === "năm") {
        errs.push(`Cảnh ${scene.id}: "${t.show} một năm" → viết "${t.show.replace(PUNCT, "")}/năm"`);
      }
      if (isPlain(t) && strip(t.show) === "quý" && a && /^[1-4][,.]?$/.test(a.show)) {
        errs.push(`Cảnh ${scene.id}: "quý ${a.show}" → viết số La Mã "quý ${ROMAN[a.show[0]]}"`);
      }
    });
  }
  return errs;
}

const render = (t) => t.raw ?? (isPlain(t) ? t.show : `${t.show}{${t.say}}`);

/** Tự sửa markup theo quy tắc ITN, giữ nguyên lời đọc. */
export function fixMarkup(markup) {
  // Giữ nguyên dạng gốc của token không đổi (vd. "Park{Park}"), để lời đọc giống hệt.
  const raws = markup.match(/(\S+?)\{([^}]*)\}|(\S+)/g) ?? [];
  let tokens = parseMarkup(markup).map((t, i) => ({ ...t, raw: raws[i] }));
  // 1) số viết chữ → chữ số
  for (const [i, j, v] of numberRuns(tokens).reverse()) {
    const run = tokens.slice(i, j);
    const words = run.map((x) => x.say).join(" ");
    const p = (run.at(-1).show.match(PUNCT) ?? [""])[0];
    tokens.splice(i, j - i, { show: `${formatViNumber(v)}${p}`, say: words });
  }
  // 2) "X% một năm" → "X%/năm"
  for (let k = tokens.length - 3; k >= 0; k--) {
    const [t, a, b] = [tokens[k], tokens[k + 1], tokens[k + 2]];
    if (hasDigit(t.show) && isPlain(a) && isPlain(b) && strip(a.show) === "một" && strip(b.show) === "năm") {
      const p = (b.show.match(PUNCT) ?? [""])[0];
      tokens.splice(k, 3, { show: `${t.show.replace(PUNCT, "")}/năm${p}`, say: `${t.say} ${a.say} ${b.say}` });
    }
  }
  // 3) "quý 2" → "quý II"
  tokens.forEach((t, k) => {
    const a = tokens[k + 1];
    if (isPlain(t) && strip(t.show) === "quý" && a && /^[1-4][,.]?$/.test(a.show)) {
      tokens[k + 1] = { show: ROMAN[a.show[0]] + a.show.slice(1), say: a.say };
    }
  });
  // token gốc nối lại đúng như cũ: dấu câu đứng riêng sau token có {…} thì dính liền (vd. "2,1{hai phẩy một}.")
  return tokens.reduce((acc, t, i) => {
    const x = render(t);
    const prev = tokens[i - 1];
    const glue = prev && t.raw && /^[,.;:!?…]+$/.test(t.raw) && /\}$/.test(render(prev));
    return i === 0 ? x : glue ? acc + x : `${acc} ${x}`;
  }, "");
}
