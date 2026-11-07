// Chia phụ đề thành cụm vừa khung (hàm thuần, chỉ import kiểu để chạy test bằng Node).
import type { Word } from "./timing";

export const CAPTION = {
  /** Tối đa ~2 dòng ở cỡ chữ lớn nhất trong khung rộng 960px. */
  maxChars: 34,
  maxFont: 76,
  minFont: 58,
  /** Cụm cuối ngắn hơn số từ này thì gộp vào cụm trước. */
  minTail: 3,
} as const;

/** Đơn vị / chữ đi liền số: không ngắt dòng giữa số và chữ này. */
const UNIT = /^(ha|%|m²|m2|km|tỷ|tỉ|triệu|ngàn|nghìn|usd|đồng|năm|tháng|căn|tầng|giây|phút)[,.]?$/i;
const isNum = (s: string) => /\d/.test(s);

const len = (ws: Word[]) => ws.map((w) => w.text).join(" ").length;

/** Dấu câu tách riêng trong lời bình (vd. "9,8{chín phẩy tám}, ...") dính vào từ trước khi hiện phụ đề. */
export const mergePunct = (words: Word[]): Word[] => {
  const out: Word[] = [];
  for (const w of words) {
    const prev = out[out.length - 1];
    if (prev && /^[,.!?;:…]+$/.test(w.text)) out[out.length - 1] = { ...prev, text: prev.text + w.text };
    else out.push(w);
  }
  return out;
};

/** Gom từ thành cụm: ngắt ở dấu phẩy/chấm hoặc khi cụm sắp quá dài; không tách số khỏi đơn vị đi sau. */
export const groupWords = (words: Word[]): Word[][] => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const next = words[i + 1];
    if (cur.length && len([...cur, w]) > CAPTION.maxChars) {
      // không để đơn vị đứng đầu cụm mới mà số ở cụm trước
      const last = cur[cur.length - 1];
      if (UNIT.test(w.text) && isNum(last.text) && cur.length > 1) {
        groups.push(cur.slice(0, -1));
        cur = [last];
      } else {
        groups.push(cur);
        cur = [];
      }
    }
    cur.push(w);
    const keepWithNext = next && isNum(w.text) && UNIT.test(next.text);
    if (/[,.!?;:]$/.test(w.text) && !keepWithNext) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
  // cụm quá ngắn (1–2 từ): gộp vào cụm trước, không được thì cụm sau, miễn vẫn vừa khung
  const out: Word[][] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const prev = out[out.length - 1];
    const next = groups[i + 1];
    if (g.length < CAPTION.minTail && prev && len([...prev, ...g]) <= CAPTION.maxChars) prev.push(...g);
    else if (g.length < CAPTION.minTail && next && len([...g, ...next]) <= CAPTION.maxChars) next.unshift(...g);
    else out.push(g);
  }
  return out;
};

/** Cỡ chữ theo độ dài cụm: ngắn giữ 76px, dài thu dần để vừa 2 dòng, không dưới 58px. */
export const fontSizeFor = (text: string): number => {
  const n = text.length;
  if (n <= 24) return CAPTION.maxFont;
  const size = Math.round(CAPTION.maxFont * Math.sqrt(24 / n));
  return Math.max(CAPTION.minFont, Math.min(CAPTION.maxFont, size));
};
