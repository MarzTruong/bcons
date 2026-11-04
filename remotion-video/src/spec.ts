// Schema của spec video: nguồn chuẩn cho tên biến mọi mẫu cảnh.
// Chỉ dùng cú pháp TS xóa được để Node có thể import trực tiếp khi chạy test/script.
import { z } from "zod";

const sourceId = z.string().min(1);
const cueKey = z.string().min(1);

export const StatHeroProps = z.object({
  badge: z.string(),
  titleLines: z.array(z.string()).min(1).max(4),
  cardLabel: z.string(),
  prefix: z.string().optional(),
  value: z.number(),
  decimals: z.number().int().min(0).max(3),
  unit: z.string(),
  sourceId,
});

export const RouteNode = z.object({
  key: z.string().min(1),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  color: z.enum(["white", "gold", "red"]),
  big: z.boolean().optional(),
  labelDx: z.number().optional(),
  labelDy: z.number().optional(),
  anchor: z.enum(["start", "end", "middle"]).optional(),
  /** Số frame sau mốc highwayCueKey mà nút xuất hiện. */
  delay: z.number(),
});

export const RouteMapProps = z.object({
  kicker: z.string(),
  title: z.string(),
  nodes: z.array(RouteNode).min(2),
  /** Đường cao tốc: M from C c1, c2, via S s2, to (tọa độ điều khiển Bezier). */
  highway: z.object({
    fromKey: z.string(),
    viaKey: z.string(),
    toKey: z.string(),
    c1: z.tuple([z.number(), z.number()]),
    c2: z.tuple([z.number(), z.number()]),
    s2: z.tuple([z.number(), z.number()]),
  }),
  /** Ba khóa nút tạo tam giác nét đứt. */
  triangle: z.tuple([z.string(), z.string(), z.string()]),
  highwayCueKey: cueKey,
  triangleCueKey: cueKey,
  infoCueKey: cueKey,
  infoTitle: z.string(),
  infoText: z.string(),
  note: z.string(),
  sourceId,
});

export const DataCard = z.object({
  tag: z.string(),
  big: z.string(),
  sub: z.string(),
  cueKey,
  /** Số frame lệch so với mốc cue (âm = xuất hiện sớm hơn lời đọc). */
  offset: z.number(),
  sourceId,
});

export const DataCardsProps = z.object({
  kicker: z.string(),
  title: z.string(),
  cards: z.array(DataCard).min(2).max(3),
});

export const Bar = z.object({
  label: z.string(),
  value: z.number(),
  cueKey,
  sourceId,
});

export const CompareBarsProps = z.object({
  kicker: z.string(),
  title: z.string(),
  unit: z.string(),
  bars: z.array(Bar).min(2).max(4),
});

const GeoColor = z.enum(["white", "gold", "red", "teal"]);
const lngLat = z.tuple([z.number(), z.number()]);
const GeoKind = z.enum(["official", "illustrative"]);

/** Lớp địa lý "official" phải có nguồn; lớp "illustrative" (minh họa) luôn bị gắn nhãn minh họa trên màn hình. */
const officialNeedsSource = (v: { kind: string; sourceId?: string }, ctx: z.RefinementCtx) => {
  if (v.kind === "official" && !v.sourceId) {
    ctx.addIssue({ code: "custom", path: ["sourceId"], message: "lớp official cần sourceId" });
  }
};

export const GeoPoint = z.object({
  key: z.string().min(1),
  label: z.string(),
  /** File GeoJSON trong public/ (vd. geo/diem-moc.geojson) chứa điểm có properties.key = featureKey. */
  file: z.string(),
  featureKey: z.string(),
  color: GeoColor,
  big: z.boolean().optional(),
  labelDx: z.number().optional(),
  labelDy: z.number().optional(),
  anchor: z.enum(["start", "end", "middle"]).optional(),
  cueKey,
  /** Số frame lệch so với mốc cue. */
  offset: z.number(),
  sourceId,
});

export const GeoLine = z
  .object({
    key: z.string().min(1),
    file: z.string(),
    kind: GeoKind,
    color: GeoColor,
    width: z.number().optional(),
    cueKey,
    /** Số frame để tuyến vẽ xong. */
    drawFrames: z.number().int().min(1),
    sourceId: z.string().min(1).optional(),
  })
  .superRefine(officialNeedsSource);

export const GeoArea = z
  .object({
    key: z.string().min(1),
    file: z.string(),
    kind: GeoKind,
    label: z.string(),
    cueKey,
    sourceId: z.string().min(1).optional(),
  })
  .superRefine(officialNeedsSource);

export const GeoMapProps = z.object({
  kicker: z.string(),
  title: z.string(),
  mapStyle: z.string().startsWith("mapbox://styles/"),
  camera: z.object({ center: lngLat, zoom: z.number() }),
  points: z.array(GeoPoint),
  lines: z.array(GeoLine),
  areas: z.array(GeoArea),
  /** Thẻ thông tin tùy chọn, hiện khi từ cues[cueKey] được đọc. */
  info: z.object({ title: z.string(), text: z.string(), cueKey, sourceId }).optional(),
  note: z.string(),
});

export const ProjectCloseProps = z.object({
  message: z.string(),
});

const sceneBase = {
  id: z.string().min(1),
  markup: z.string().min(1),
  cues: z.record(z.string(), z.string()),
};

export const SceneSchema = z.discriminatedUnion("template", [
  z.object({ ...sceneBase, template: z.literal("stat-hero"), props: StatHeroProps }),
  z.object({ ...sceneBase, template: z.literal("route-map"), props: RouteMapProps }),
  z.object({ ...sceneBase, template: z.literal("data-cards"), props: DataCardsProps }),
  z.object({ ...sceneBase, template: z.literal("compare-bars"), props: CompareBarsProps }),
  z.object({ ...sceneBase, template: z.literal("geo-map"), props: GeoMapProps }),
  z.object({ ...sceneBase, template: z.literal("project-close"), props: ProjectCloseProps }),
]);

/** Phong cách hình ảnh: classic = bản gốc (nền tối, xanh ngọc + vàng). */
export const STYLE_NAMES = ["classic", "sang", "navy", "xanh"] as const;
export type StyleName = (typeof STYLE_NAMES)[number];

/** Phong cách chuyển động: classic = bản gốc (hiện mờ, lưới nền chạy). */
export const MOTION_NAMES = ["classic", "truot", "nay", "mo"] as const;
export type MotionName = (typeof MOTION_NAMES)[number];

export const VideoSpecSchema = z.object({
  style: z.enum(STYLE_NAMES).optional(),
  motion: z.enum(MOTION_NAMES).optional(),
  name: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(["draft", "approved"]),
  scenes: z.array(SceneSchema).min(1),
});

export type VideoSpec = z.infer<typeof VideoSpecSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type SceneOf<T extends Scene["template"]> = Extract<Scene, { template: T }>;

/** Parse spec; lỗi nêu đường dẫn trường sai (vd. scenes.0.props.cards.0.sourceId). */
export function parseSpec(json: unknown): VideoSpec {
  const r = VideoSpecSchema.safeParse(json);
  if (r.success) return r.data;
  const msg = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Spec không hợp lệ:\n${msg}`);
}
