import wordsJson from "../tuan-words.json";
import segmentsJson from "./segments.json";

export const FPS = 30;
export const RAW_VIDEO = "raw-tuan.mp4";

export type Segment = {
  /** Clip logic (1-9) mà phân đoạn này thuộc về; dùng để canh đồ họa. */
  clip: number;
  /** Frame bắt đầu/kết thúc trong video gốc. */
  srcFrom: number;
  srcTo: number;
  /** Frame bắt đầu trên timeline đã dựng. */
  from: number;
  frames: number;
};

/** Phân đoạn cắt từ video gốc (giây) nằm trong segments.json, đã loại vấp/lặp/từ thừa. */
export const SEGMENTS: Segment[] = (
  segmentsJson as Array<{ clip: number; from: number; to: number }>
).reduce<Segment[]>((acc, s) => {
  const srcFrom = Math.round(s.from * FPS);
  const srcTo = Math.round(s.to * FPS);
  const prev = acc[acc.length - 1];
  acc.push({
    clip: s.clip,
    srcFrom,
    srcTo,
    from: prev ? prev.from + prev.frames : 0,
    frames: srcTo - srcFrom,
  });
  return acc;
}, []);

export const TOTAL_FRAMES = SEGMENTS.reduce((a, s) => a + s.frames, 0);

/** Frame bắt đầu / kết thúc của clip logic thứ n (1-based) trên timeline đã dựng. */
export const clipStart = (n: number) => SEGMENTS.find((s) => s.clip === n)!.from;
export const clipEnd = (n: number) => {
  const last = [...SEGMENTS].reverse().find((s) => s.clip === n)!;
  return last.from + last.frames;
};

export type RawWord = { t: string; s: number; e: number };
export const WORDS = wordsJson as RawWord[];

const norm = (s: string) => s.toLowerCase().replace(/[.,?!]/g, "");

/** Frame (timeline đã dựng) khi cụm từ `phrase` bắt đầu được nói; `nth` bắt đầu từ 0. */
export const cue = (phrase: string, nth = 0): number => {
  const keys = phrase.toLowerCase().split(" ");
  let seen = 0;
  for (let i = 0; i < WORDS.length; i++) {
    if (keys.every((k, j) => WORDS[i + j] && norm(WORDS[i + j].t) === k)) {
      if (seen === nth) return Math.round(WORDS[i].s * FPS);
      seen++;
    }
  }
  throw new Error(`Không tìm thấy cụm "${phrase}" (lần ${nth}) trong transcript`);
};
