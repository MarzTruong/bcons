// Màu theo "số báo" cho hai phong cách đổi màu theo từng video (thuần, không React: test được bằng node).
// tapchi: bìa tạp chí 5 màu; bangls: bảng lãi suất 3 màu. Màu chọn theo số video (spec.so) để video liền nhau khác màu.

export type TapChiIssue = {
  name: string;
  /** Nền bìa. */ ground: string;
  /** Chữ trên bìa. */ ink: string;
  /** Màu nhấn cho số. */ hi: string;
  /** Nền trang ruột và chữ trên đó. */ page: string;
  pageInk: string;
  /** Viền chữ phụ đề. */ stroke: string;
};

export const TAPCHI: TapChiIssue[] = [
  { name: "son", ground: "#b5291f", ink: "#fff4e6", hi: "#ffc94d", page: "#5e120c", pageInk: "#fff4e6", stroke: "#3d0b07" },
  { name: "coban", ground: "#1c3faa", ink: "#fff4e6", hi: "#ffb59e", page: "#0f2463", pageInk: "#fff4e6", stroke: "#091640" },
  { name: "nghe", ground: "#e3a21a", ink: "#1a120b", hi: "#8f1d14", page: "#1a120b", pageInk: "#f3c14b", stroke: "#1a120b" },
  { name: "man", ground: "#5b2346", ink: "#fff4e6", hi: "#f6b26b", page: "#33122a", pageInk: "#fff4e6", stroke: "#22091b" },
  { name: "ngoc", ground: "#0c6a6c", ink: "#fff4e6", hi: "#ffd19a", page: "#063f41", pageInk: "#fff4e6", stroke: "#032829" },
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
