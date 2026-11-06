export const FPS = 30;
/** Khoảng lặng trước khi giọng đọc bắt đầu và sau khi kết thúc mỗi cảnh (frame). */
export const LEAD = 12;
export const TAIL = 24;

export type Word = { text: string; start: number; end: number };

/** Dạng file du-an/<mã>/video/<name>/timestamps.json do scripts/generate-voice.mjs ghi. */
export type Timestamps = {
  scenes: { id: string; durationSec: number; words: Word[] }[];
};

export type SceneTiming = {
  id: string;
  words: Word[];
  audioFrames: number;
  frames: number;
};

export const buildTiming = (ts: Timestamps) => {
  const SCENE_DATA: SceneTiming[] = ts.scenes.map((s) => ({
    id: s.id,
    words: s.words,
    audioFrames: Math.ceil(s.durationSec * FPS),
    // Thời lượng cảnh = lead + giọng đọc + tail, khớp 100% với file âm thanh.
    frames: LEAD + Math.ceil(s.durationSec * FPS) + TAIL,
  }));
  const SCENE_STARTS = SCENE_DATA.reduce<number[]>((acc, s, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + SCENE_DATA[i - 1].frames);
    return acc;
  }, []);
  const TOTAL_FRAMES = SCENE_DATA.reduce((a, s) => a + s.frames, 0);
  return { SCENE_DATA, SCENE_STARTS, TOTAL_FRAMES, LEAD, FPS };
};

/** Frame (tương đối trong cảnh) khi từ có chữ hiển thị `text` bắt đầu được đọc. */
export const cueFrame = (scene: SceneTiming, sceneNo: number, text: string): number => {
  const w = scene.words.find((x) => x.text === text);
  if (!w) throw new Error(`Không tìm thấy từ "${text}" trong cảnh ${sceneNo + 1}`);
  return LEAD + Math.round(w.start * FPS);
};
