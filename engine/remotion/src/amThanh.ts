// Chỉ import kiểu (để chạy test bằng Node không cần bundler); LEAD/FPS lấy từ kết quả buildTiming.
import type { SceneTiming } from "./timing";

/** Mức nhạc nền (0..1). Nhạc luôn nằm dưới giọng đọc. */
export const MUSIC = {
  duoiGiong: 0.1,
  khoangLang: 0.22,
  /** Khung chuyển mượt giữa hai mức. */
  ramp: 10,
  moDau: 20,
  ketThuc: 45,
} as const;

type Timing = { SCENE_DATA: SceneTiming[]; SCENE_STARTS: number[]; TOTAL_FRAMES: number; LEAD: number; FPS: number };

/** Khoảng (theo khung, tuyệt đối) có giọng đọc của từng cảnh. */
const voiceSpans = (t: Timing) =>
  t.SCENE_DATA.map((s, i) => [t.SCENE_STARTS[i] + t.LEAD, t.SCENE_STARTS[i] + t.LEAD + s.audioFrames] as const);

/** Âm lượng nhạc ở khung `frame`: hạ khi có lời, lên nhẹ ở khoảng lặng, mở/kết nhỏ dần. Hàm thuần, test được. */
export const musicVolume = (frame: number, t: Timing): number => {
  let dist = Infinity;
  for (const [a, b] of voiceSpans(t)) {
    if (frame >= a && frame <= b) {
      dist = 0;
      break;
    }
    dist = Math.min(dist, frame < a ? a - frame : frame - b);
  }
  const k = Math.min(1, dist / MUSIC.ramp);
  let v = MUSIC.duoiGiong + (MUSIC.khoangLang - MUSIC.duoiGiong) * k;
  const fadeIn = Math.min(1, frame / MUSIC.moDau);
  const fadeOut = Math.min(1, Math.max(0, (t.TOTAL_FRAMES - 1 - frame) / MUSIC.ketThuc));
  v *= Math.min(fadeIn, fadeOut);
  return Math.max(0, v);
};

export type SfxName = "vut" | "tach" | "don";
export type SfxEvent = { name: SfxName; frame: number };
export const SFX_VOLUME: Record<SfxName, number> = { vut: 0.35, tach: 0.3, don: 0.3 };

type SpecLike = { scenes: { cues: Record<string, string> }[] };

/** Thời điểm hiệu ứng: "vút" khi sang cảnh mới, "tách" khi số/ý hiện (mỗi cue), "dồn" ~1 giây trước cảnh cuối. */
export const sfxEvents = (spec: SpecLike, t: Timing): SfxEvent[] => {
  const out: SfxEvent[] = [];
  const seen = new Set<string>();
  const add = (name: SfxName, frame: number) => {
    const f = Math.max(0, Math.round(frame));
    const k = `${name}@${f}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ name, frame: f });
    }
  };
  spec.scenes.forEach((scene, i) => {
    const start = t.SCENE_STARTS[i];
    if (i > 0) add("vut", start);
    for (const text of new Set(Object.values(scene.cues))) {
      const w = t.SCENE_DATA[i].words.find((x) => x.text === text);
      // cue không có trong lời đọc: cổng kiểm spec đã báo, ở đây bỏ qua
      if (w) add("tach", start + t.LEAD + Math.round(w.start * t.FPS));
    }
  });
  const last = t.SCENE_STARTS.length - 1;
  if (last > 0) add("don", t.SCENE_STARTS[last] - 30);
  return out.sort((a, b) => a.frame - b.frame);
};
