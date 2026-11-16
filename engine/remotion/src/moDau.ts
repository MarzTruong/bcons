// Tính toán thuần cho khung mở đầu (hook) và cảnh danh sách có đếm: bản AGY kiểu 1 (anh chọn 15/11/2026) chuyển sang frame.
// Tách khỏi React để test; mốc thời gian và hệ số giữ đúng bản demo AGY.
export const FPS_MO_DAU = 30;
export const HOOK_SEC = 3.0;
export const HOOK_FRAMES = HOOK_SEC * FPS_MO_DAU;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export type HookState = {
  bgScale: number;
  numScale: number;
  /** Từ thứ i của dòng hook cuối đã sáng màu nhấn chưa. */
  wordsOn: boolean[];
  /** Độ dài gạch nhấn (% bề rộng khối chữ). */
  underline: number;
  subOpacity: number;
  subShift: number;
  /** Thanh nhịp 0–100 (%). */
  beat: number;
  blockShift: number;
  blockOpacity: number;
  /** Cả khung mờ dần ở 2,45–3,0 s để lộ cảnh 1 bên dưới. */
  overlayOpacity: number;
};

/** Trạng thái khung hook tại giây `t` (0–3 s). `nWords` = số từ của dòng hook cuối. */
export function hookState(t: number, nWords: number): HookState {
  const c = Math.max(0, Math.min(HOOK_SEC, t));
  const punch =
    c <= 0.1 ? 0 : c < 0.5 ? easeOutCubic((c - 0.1) / 0.4) : 1 - easeOutCubic(clamp01((c - 0.5) / 0.35));
  const subP = clamp01((c - 0.15) / 0.75);
  const outro = easeOutCubic(clamp01((c - 2.45) / 0.55));
  return {
    bgScale: 1 + 0.034 * c,
    numScale: 1 + 0.085 * punch,
    wordsOn: Array.from({ length: nWords }, (_, i) => c >= 0.22 + i * 0.2),
    underline: easeOutCubic(clamp01((c - 0.25) / 0.75)) * 68,
    subOpacity: c <= 0.05 ? 0 : 0.15 + 0.85 * subP,
    subShift: (1 - easeOutCubic(subP)) * 26,
    beat: (c / HOOK_SEC) * 100,
    blockShift: 0 - outro * 44,
    blockOpacity: 1 - outro * 0.85,
    overlayOpacity: 1 - outro,
  };
}

export type RowPhase = "hidden" | "active" | "done" | "summary";
export type DanhSachState = {
  rows: { phase: RowPhase; enter: number }[];
  /** Số mục đã xem ("Đã xem n/N"). */
  seen: number;
  summary: boolean;
  /** Băng tổng kết hiện dần 0–1. */
  bannerP: number;
};

/** Trạng thái cảnh danh sách tại frame `f` (tương đối trong cảnh). `reveals[i]` = frame mục i hiện, `summaryAt` = frame gom tổng kết. */
export function danhSachState(f: number, reveals: number[], summaryAt: number, n: number): DanhSachState {
  const summary = f >= summaryAt;
  let active = -1;
  reveals.forEach((r, i) => {
    if (f >= r && i < n) active = i;
  });
  const rows = Array.from({ length: n }, (_, i) => {
    const enter = f < reveals[i] ? 0 : easeOutCubic(clamp01((f - reveals[i]) / (0.35 * FPS_MO_DAU)));
    let phase: RowPhase;
    if (summary) phase = "summary";
    else if (f < reveals[i]) phase = "hidden";
    else if (i < active) phase = "done";
    else phase = "active";
    return { phase, enter };
  });
  return { rows, seen: summary ? n : active + 1, summary, bannerP: clamp01((f - summaryAt) / (0.16 * FPS_MO_DAU)) };
}

export const NGUON_CUOI_SEC = 2.5;
export const NGUON_CUOI_FRAMES = NGUON_CUOI_SEC * FPS_MO_DAU;

export type NguonCuoiState = { opacity: number; shift: number; track: number };

/** Khung nguồn cuối video (AGY): rõ nét trong 0,25 s đầu, mờ nhẹ ở 2,2–2,5 s; `track` = thanh thời gian 0–100 (%). */
export function nguonCuoiState(t: number): NguonCuoiState {
  const c = Math.max(0, Math.min(NGUON_CUOI_SEC, t));
  const inP = easeOutCubic(clamp01(c / 0.25));
  const outP = easeOutCubic(clamp01((c - 2.2) / 0.3));
  return { opacity: inP * (1 - outP * 0.7), shift: (1 - inP) * 14 - outP * 14, track: (c / NGUON_CUOI_SEC) * 100 };
}
