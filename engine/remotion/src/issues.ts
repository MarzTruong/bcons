// Màu theo "số báo" cho hai phong cách đổi màu theo từng video (thuần, không React: test được bằng node).
// tapchi: bìa tạp chí 5 màu; bangls: bảng lãi suất 3 màu. Màu chọn theo số video (spec.so) để video liền nhau khác màu.

export type TapChiIssue = {
  name: string;
  /** Nền bìa. */ ground: string;
  /** Chữ trên bìa. */ ink: string;
  /** Màu nhấn cho số. */ hi: string;
  /** Nền trang ruột và chữ trên đó: cùng nền bìa (anh 07/11/2026: trang tối khó đọc). */ page: string;
  pageInk: string;
  /** Viền chữ phụ đề. */ stroke: string;
};

export const TAPCHI: TapChiIssue[] = [
  { name: "son", ground: "#b5291f", ink: "#fff4e6", hi: "#ffc94d", page: "#b5291f", pageInk: "#fff4e6", stroke: "#3d0b07" },
  { name: "coban", ground: "#1c3faa", ink: "#fff4e6", hi: "#ffb59e", page: "#1c3faa", pageInk: "#fff4e6", stroke: "#091640" },
  { name: "nghe", ground: "#e3a21a", ink: "#1a120b", hi: "#8f1d14", page: "#e3a21a", pageInk: "#1a120b", stroke: "#e3a21a" },
  { name: "man", ground: "#5b2346", ink: "#fff4e6", hi: "#f6b26b", page: "#5b2346", pageInk: "#fff4e6", stroke: "#22091b" },
  { name: "ngoc", ground: "#0c6a6c", ink: "#fff4e6", hi: "#ffd19a", page: "#0c6a6c", pageInk: "#fff4e6", stroke: "#032829" },
];

export type BangIssue = {
  name: string;
  /** Khung bảng. */ frame: string;
  /** Nền bảng. */ board: string;
  /** Ô chữ số. */ tile: string;
  /** Chữ số đèn LED. */ digit: string;
  /** Chữ nhãn. */ label: string;
};

export const BANG: BangIssue[] = [
  { name: "navy", frame: "#0f2d63", board: "#0a1730", tile: "#070d1a", digit: "#ffb23f", label: "#e9eef8" },
  { name: "do", frame: "#7e1722", board: "#2a0a0f", tile: "#140507", digit: "#ffd36b", label: "#fbedea" },
  { name: "chi", frame: "#3a4049", board: "#16191e", tile: "#0b0d10", digit: "#6fe3ff", label: "#eef1f4" },
];

export function issueOf(style: "tapchi", so: number | undefined): TapChiIssue;
export function issueOf(style: "bangls", so: number | undefined): BangIssue;
export function issueOf(style: "tapchi" | "bangls", so: number | undefined): TapChiIssue | BangIssue {
  const list = style === "tapchi" ? TAPCHI : BANG;
  return list[(so ?? 0) % list.length];
}

/** Bảng lật (split-flap): ô thứ i bắt đầu lật ở start + 2i, lật qua vài chữ số 8 frame rồi dừng đúng ký tự. */
export function flapChar(target: string, frame: number, start: number, i: number): string {
  const t0 = start + 2 * i;
  if (frame < t0) return " ";
  if (!/\d/.test(target)) return target;
  if (frame >= t0 + 8) return target;
  return String((Number(target) + 3 + (frame - t0) * 7 + i) % 10);
}

// Bộ "moi" (anh chọn 07/11/2026, ưng cả 3 mẫu): A ảnh dự án, B bản tin sáng, C khối màu đậm.
export type MoiKind = "anh" | "bantin" | "khoimau";
export type MoiLook = {
  kind: MoiKind;
  /** Nền. */ bg: string;
  /** Chữ chính. */ text: string;
  /** Chữ phụ. */ muted: string;
  /** Màu nhấn cho số. */ accent: string;
  /** Nền thẻ (B: thẻ trắng; C: khối tối; A: không dùng). */ card: string;
  /** Khối màu lớn (C: vàng; A/B: = bg). */ block: string;
  /** Chữ trên khối màu. */ onBlock: string;
  /** Phụ đề: bong = chữ trắng đổ bóng (trên ảnh), phang = chữ đậm không viền, nhan = nhãn dán có nền. */
  cap: "bong" | "phang" | "nhan";
};

export const MOI: Record<MoiKind, MoiLook> = {
  anh: { kind: "anh", bg: "#06121f", text: "#ffffff", muted: "#d7e2ee", accent: "#7ee0c3", card: "#0d2238", block: "#06121f", onBlock: "#ffffff", cap: "bong" },
  bantin: { kind: "bantin", bg: "#f3f5f8", text: "#0b1f3a", muted: "#53627a", accent: "#e8562a", card: "#ffffff", block: "#f3f5f8", onBlock: "#0b1f3a", cap: "phang" },
  khoimau: { kind: "khoimau", bg: "#111111", text: "#ffffff", muted: "#d9d9d9", accent: "#ffe14d", card: "#222222", block: "#ffe14d", onBlock: "#111111", cap: "nhan" },
};

const MOI_XOAY: MoiKind[] = ["khoimau", "anh", "bantin"];

/** style "moi" xoay theo số video (video liền nhau khác kiểu); "anh"/"bantin"/"khoimau" chọn thẳng. */
export function moiOf(style: string, so: number | undefined): MoiLook {
  if (style in MOI) return MOI[style as MoiKind];
  return MOI[MOI_XOAY[(so ?? 0) % 3]];
}

/** Màu riêng cho bản đồ bộ "moi" (nền vệ tinh tối, không theo màu nền trang): bốn màu điểm/tuyến khác nhau,
 * chữ nhãn trắng viền đen để đọc được trên ảnh vệ tinh ở cả kiểu bản tin (chữ trang màu tối). */
export function moiMapColors(m: { accent: string }) {
  return { white: "#ffffff", gold: m.accent, red: "#ff4d6d", teal: "#4fc3f7", label: "#ffffff", stroke: "#000000" };
}
