// Công cụ dùng chung cho script: đường dẫn spec, kiểm tra nguồn, cổng duyệt, parse lời bình.
import fs from "node:fs";
import path from "node:path";
import { parseSpec } from "../src/spec.ts";
import { projectDir, readActiveProject, videoPaths } from "./project.mjs";

/** Thư mục dự án đang bán (config.json). */
export const activeProjDir = () => projectDir(readActiveProject());

/** du-an/<mã>/video/<name>/spec.json; chỉ nhận tên a-z0-9-, tránh ghi file ra ngoài thư mục dự án. */
export function resolveSpecPath(name, projDir = activeProjDir()) {
  return videoPaths(name, projDir).spec;
}

/** Đọc các hàng của bảng dưới tiêu đề "## Bảng nguồn": { id, link }. Dừng ở tiêu đề kế tiếp (mọi cấp). */
export function readSourceRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Bảng nguồn\s*$/i.test(l.trim()));
  if (start < 0) return [];
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line)) break;
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    const id = cells[0] ?? "";
    if (!id || /^-+$/.test(id) || id.toLowerCase() === "id") continue;
    rows.push({ id, link: cells[4] ?? "" });
  }
  return rows;
}

export const readSourceIds = (markdown) => readSourceRows(markdown).map((r) => r.id);

/** Gom mọi trường sourceId trong spec. */
export function collectSourceIds(spec) {
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "sourceId" && typeof x === "string") out.push(x);
        else walk(x);
      }
    }
  };
  walk(spec);
  return [...new Set(out)];
}

export function checkSources(spec, markdown) {
  const known = new Set(readSourceIds(markdown));
  const missing = collectSourceIds(spec).filter((id) => !known.has(id));
  return { ok: missing.length === 0, missing };
}

/** Mọi id đang dùng phải có link http(s) trong bảng nguồn (quy tắc 2 của CLAUDE.md). */
export function checkSourceLinks(spec, markdown) {
  const rows = new Map(readSourceRows(markdown).map((r) => [r.id, r.link]));
  const unlinked = collectSourceIds(spec).filter((id) => rows.has(id) && !/^https?:\/\//i.test(rows.get(id)));
  return { ok: unlinked.length === 0, unlinked };
}

/** Các khóa cue mỗi mẫu cảnh dùng. */
function cueKeysOf(scene) {
  const p = scene.props;
  switch (scene.template) {
    case "stat-hero":
      return ["value"];
    case "route-map":
      return [p.highwayCueKey, p.triangleCueKey, p.infoCueKey];
    case "data-cards":
      return p.cards.map((c) => c.cueKey);
    case "compare-bars":
      return p.bars.map((b) => b.cueKey);
    case "geo-map":
      return [
        ...[...p.points, ...p.lines, ...p.areas, ...(p.info ? [p.info] : [])].map((x) => x.cueKey),
        ...p.areas.flatMap((a) => [...(a.pulses ?? []).map((x) => x.cueKey), ...(a.dimAt ? [a.dimAt.cueKey] : [])]),
        ...(p.moves ?? []).map((x) => x.cueKey),
        ...(p.callouts ?? []).flatMap((x) => [x.cueKey, x.hideAt?.cueKey]),
        ...(p.cards ?? []).map((x) => x.cueKey),
        ...[p.dim, p.image, p.message].filter(Boolean).map((x) => x.cueKey),
      ].filter(Boolean);
    default:
      return [];
  }
}

/** Kiểm tĩnh cue: khóa tồn tại trong cues, và chữ cue trùng một chữ hiển thị trong markup (kể cả dấu câu). */
export function checkCues(spec) {
  const errors = [];
  for (const scene of spec.scenes) {
    const shows = new Set(parseMarkup(scene.markup).map((t) => t.show));
    for (const key of new Set(cueKeysOf(scene))) {
      if (!(key in scene.cues)) errors.push(`Cảnh ${scene.id}: thiếu cues["${key}"]`);
    }
    for (const [key, text] of Object.entries(scene.cues)) {
      if (!shows.has(text)) {
        errors.push(`Cảnh ${scene.id}: cues["${key}"] = "${text}" không có trong lời bình (so cả dấu câu)`);
      }
    }
  }
  return errors;
}

/** Timestamp phải khớp spec hiện tại; lệch nghĩa là đã sửa lời bình mà chưa tạo lại giọng. */
export function checkTimestamps(spec, timestamps) {
  const errors = [];
  const ts = timestamps.scenes ?? [];
  if (ts.length !== spec.scenes.length) {
    errors.push(`Lệch số cảnh: spec ${spec.scenes.length}, timestamp ${ts.length}. Tạo lại giọng bằng generate-voice.`);
    return errors;
  }
  spec.scenes.forEach((scene, i) => {
    if (ts[i].id !== scene.id) {
      errors.push(`Cảnh ${i + 1}: id spec "${scene.id}" khác id timestamp "${ts[i].id}".`);
      return;
    }
    const speech = parseMarkup(scene.markup).filter((t) => t.say).map((t) => t.say).join(" ");
    if (ts[i].speech !== speech) {
      errors.push(`Cảnh ${scene.id}: lời bình đã đổi so với giọng đã tạo. Chạy lại generate-voice (hỏi anh trước, tốn credit).`);
    }
  });
  return errors;
}

export function assertApproved(spec) {
  if (spec.status !== "approved") {
    throw new Error(
      `Spec ${spec.name} còn ở trạng thái ${spec.status}. Chỉ chạy khi anh đã duyệt và status = "approved".`,
    );
  }
}

/** "show{say}" | "word" -> [{show, say}] */
export function parseMarkup(markup) {
  const re = /(\S+?)\{([^}]*)\}|(\S+)/g;
  const out = [];
  let m;
  while ((m = re.exec(markup))) {
    out.push(m[3] ? { show: m[3], say: m[3] } : { show: m[1], say: m[2] });
  }
  return out;
}

const speechOf = (tokens) => tokens.filter((t) => t.say).map((t) => t.say).join(" ");

/** Khoảng ký tự [a, b] trong lời đọc của từng token có đọc (token chỉ hiển thị: null). */
const sayRanges = (tokens) => {
  let cursor = 0;
  return tokens.map((t) => {
    if (!t.say) return null;
    const r = [cursor, cursor + t.say.length - 1];
    cursor = r[1] + 2;
    return r;
  });
};

/**
 * Đổi chữ hiển thị trong timestamps (vd. "90 phần trăm" → "90%") khi LỜI ĐỌC KHÔNG ĐỔI: dùng lại mốc giọng cũ,
 * không gọi ElevenLabs. Trả { ok, words } hoặc { ok: false, reason }.
 */
export function relabelWords(newMarkup, oldMarkup, oldWords) {
  const oldT = parseMarkup(oldMarkup);
  const newT = parseMarkup(newMarkup);
  if (speechOf(oldT) !== speechOf(newT)) return { ok: false, reason: "Lời đọc đã đổi: phải tạo giọng lại (tốn credit)." };
  if (oldT.length !== oldWords.length) return { ok: false, reason: "timestamps không khớp lời bình cũ." };
  const oldR = sayRanges(oldT);
  const at = (ch, edge) => {
    const k = oldR.findIndex((r) => r && ch >= r[0] && ch <= r[1]);
    return oldWords[k][edge];
  };
  const words = newT.map((t, k) => {
    const r = sayRanges(newT)[k];
    return r ? { text: t.show, start: at(r[0], "start"), end: at(r[1], "end") } : { text: t.show, start: null, end: null };
  });
  words.forEach((w, k) => {
    if (w.start === null) {
      const next = words.slice(k + 1).find((x) => x.start !== null);
      w.start = w.end = next ? next.start : words[k - 1].end;
    }
  });
  return { ok: true, words };
}

/**
 * Mốc thời gian ƯỚC TÍNH khi chưa tạo giọng (để dựng storyboard có hình trước khi tốn credit).
 * Mỗi âm tiết ~0,23 giây, nghỉ 0,25 giây sau dấu phẩy và 0,45 giây sau dấu chấm. Có giọng thật thì thay bằng timestamps thật.
 */
export function estimateTimestamps(spec) {
  const SYL = 0.23;
  const scenes = spec.scenes.map((scene) => {
    const tokens = parseMarkup(scene.markup);
    let t = 0.1;
    const words = tokens.map((tok) => {
      if (!tok.say) return { text: tok.show, start: null, end: null };
      const start = t;
      const end = start + tok.say.split(/\s+/).filter(Boolean).length * SYL;
      t = end + 0.04 + (/[.!?]$/.test(tok.say) ? 0.45 : /[,;:]$/.test(tok.say) ? 0.25 : 0);
      return { text: tok.show, start: +start.toFixed(2), end: +end.toFixed(2) };
    });
    words.forEach((w, k) => {
      if (w.start === null) {
        const next = words.slice(k + 1).find((x) => x.start !== null);
        w.start = w.end = next ? next.start : words[k - 1]?.end ?? 0;
      }
    });
    return { id: scene.id, durationSec: +(t + 0.2).toFixed(2), speech: speechOf(tokens), words };
  });
  return { uocTinh: true, scenes };
}

/** Chữ HIỆN trên màn hình phải dùng ký hiệu, không viết chữ đọc (anh yêu cầu 06/11/2026). */
const SPELLED = [
  [/^phần$/i, "phần trăm", "%"],
  [/^đô$/i, "đô la", "USD"],
  [/^héc-?ta/i, "héc-ta", "ha"],
  [/^mét$/i, "mét vuông", "m²"],
  [/^ki-?lô-?mét/i, "ki-lô-mét", "km"],
];
export function checkShownSymbols(spec) {
  const errs = [];
  for (const scene of spec.scenes) {
    const shown = parseMarkup(scene.markup).map((t) => t.show);
    shown.forEach((w, i) => {
      for (const [re, word, sym] of SPELLED) {
        const next = (shown[i + 1] ?? "").toLowerCase();
        const hit = word === "phần trăm" ? re.test(w) && next.startsWith("trăm") : word === "đô la" ? re.test(w) && next.startsWith("la") : word === "mét vuông" ? re.test(w) && next.startsWith("vuông") : re.test(w);
        if (hit) errs.push(`Cảnh ${scene.id}: chữ hiện "${word}" → viết "${sym}" và để chữ đọc trong {…}, vd. 90%{chín mươi phần trăm}`);
      }
    });
  }
  return errs;
}

/**
 * Cổng chặn dùng trước khi tạo giọng hoặc render: spec phải hợp lệ, `approved`,
 * và mọi sourceId có trong bảng nguồn. Chạy TRƯỚC khi đọc API key hay gọi mạng.
 */
/** Gắn watermark mặc định (project.json → watermark) khi spec không tự khai báo, và tên + địa chỉ dự án cho cảnh cuối
 * (project.json → ten, diaChiVideo hoặc diaChi). Không sửa spec gốc. */
export function applyWatermark(spec, projectConfig) {
  let out = spec;
  if (!spec.watermark && projectConfig?.watermark) out = { ...out, watermark: projectConfig.watermark };
  if (!spec.duAn && projectConfig?.ten) out = { ...out, duAn: { ten: projectConfig.ten, diaChi: projectConfig.diaChiVideo ?? projectConfig.diaChi ?? "" } };
  return out;
}

export function prepareRun(name, { projDir = activeProjDir() } = {}) {
  const vp = videoPaths(name, projDir);
  const specPath = vp.spec;
  if (!fs.existsSync(specPath)) throw new Error(`Không thấy spec "${name}" (${specPath})`);
  const spec = parseSpec(JSON.parse(fs.readFileSync(specPath, "utf8")));
  if (spec.name !== name) throw new Error(`spec.name "${spec.name}" khác tên file "${name}"`);
  assertApproved(spec);
  const cueErrors = checkCues(spec);
  if (cueErrors.length) throw new Error(`Lỗi cue:\n${cueErrors.join("\n")}`);
  const geoErrors = checkGeoFiles(spec, projDir);
  if (geoErrors.length) throw new Error(`Lỗi dữ liệu địa lý:\n${geoErrors.join("\n")}`);
  const mdPath = vp.sources;
  const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : "";
  const { ok, missing } = checkSources(spec, md);
  if (!ok) throw new Error(`sourceId không có trong bảng nguồn ${mdPath}: ${missing.join(", ")}`);
  const links = checkSourceLinks(spec, md);
  if (!links.ok) {
    throw new Error(`Nguồn chưa có link http(s) trong ${mdPath} (cột Link): ${links.unlinked.join(", ")}`);
  }
  return { spec, specPath, timestampsPath: vp.timestamps, projDir };
}

const VN_BBOX = { lng: [102, 110], lat: [8, 24] };

function* coordsOf(geometry) {
  if (!geometry) return;
  if (geometry.type === "GeometryCollection") {
    for (const g of geometry.geometries) yield* coordsOf(g);
    return;
  }
  const walk = function* (c) {
    if (typeof c[0] === "number") yield c;
    else for (const x of c) yield* walk(x);
  };
  yield* walk(geometry.coordinates);
}

function* featuresOf(json) {
  if (json.type === "FeatureCollection") yield* json.features;
  else if (json.type === "Feature") yield json;
}

/** Mọi file GeoJSON của cảnh geo-map phải tồn tại, tọa độ [kinh độ, vĩ độ] trong Việt Nam, featureKey của điểm có thật. */
export function checkGeoFiles(spec, publicDir /* = thư mục dự án */) {
  const errors = [];
  for (const scene of spec.scenes) {
    // Ảnh chèn phải có file thật, không phải ảnh giữ chỗ.
    const img = scene.props?.image;
    if (img?.file) {
      const where = `Cảnh ${scene.id}, ảnh ${img.file}`;
      if (!fs.existsSync(path.join(publicDir, img.file))) errors.push(`${where}: không thấy file`);
      else if (/placeholder/i.test(path.basename(img.file))) errors.push(`${where}: là ảnh giữ chỗ. Thay bằng ảnh phối cảnh thật của chủ đầu tư.`);
    }
    if (scene.template !== "geo-map") continue;
    const p = scene.props;
    const layers = [
      ...p.points.map((x) => ({ ...x, type: "điểm" })),
      ...p.lines.map((x) => ({ ...x, type: "tuyến" })),
      ...p.areas.map((x) => ({ ...x, type: "vùng" })),
    ];
    for (const layer of layers) {
      const file = path.join(publicDir, layer.file);
      const where = `Cảnh ${scene.id}, ${layer.type} "${layer.key}" (${layer.file})`;
      if (!fs.existsSync(file)) {
        errors.push(`${where}: không thấy file`);
        continue;
      }
      let json;
      try {
        json = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        errors.push(`${where}: không phải JSON hợp lệ`);
        continue;
      }
      const feats = [...featuresOf(json)];
      if (!feats.length) errors.push(`${where}: không có feature GeoJSON`);
      for (const f of feats) {
        for (const [lng, lat] of coordsOf(f.geometry)) {
          if (lng < VN_BBOX.lng[0] || lng > VN_BBOX.lng[1] || lat < VN_BBOX.lat[0] || lat > VN_BBOX.lat[1]) {
            errors.push(`${where}: tọa độ [${lng}, ${lat}] ngoài Việt Nam; thứ tự phải là [kinh độ, vĩ độ]`);
            break;
          }
        }
      }
      const provisional = feats.find((f) => f.properties?.provisional);
      if (provisional) {
        errors.push(`${where}: dữ liệu TẠM (provisional: ${provisional.properties.provisional}). Thay bằng tọa độ/ranh thật trước khi render đủ.`);
      }
      if (layer.type === "điểm" && !feats.some((f) => f.properties?.key === layer.featureKey)) {
        errors.push(`${where}: không có feature với properties.key = "${layer.featureKey}" (featureKey)`);
      }
    }
  }
  return errors;
}
