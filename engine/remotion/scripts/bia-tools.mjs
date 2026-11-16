// Kiểm ảnh bìa: bia.json phải khớp video (số có trong video, ảnh có thật, tiêu đề ≤ 7 chữ) và khớp khung mở đầu (hook) để khung 0 là bìa.
import fs from "node:fs";
import path from "node:path";
import { BiaSchema } from "../src/bia.ts";
import { parseMarkup } from "./spec-tools.mjs";

export function readBia(file) {
  return BiaSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

const chuDeCuaBia = (c) => c ?? "du-an";

export function checkBia(bia, spec, projDir) {
  const errors = [];
  const words = bia.tieuDe.join(" ").split(/\s+/).filter(Boolean).length;
  if (words > 7) errors.push(`bia: tiêu đề ${words} chữ, tối đa 7 chữ`); // 6 chữ là mục tiêu; 7 cho phép vì anh chốt bìa Newsky 3 "Chủ đầu tư thuê lại 2 năm" (16/11/2026)
  const f = path.join(projDir, bia.anhNen);
  if (!fs.existsSync(f)) errors.push(`bia: ảnh ${bia.anhNen}: không thấy file`);
  else if (/placeholder/i.test(path.basename(bia.anhNen))) errors.push(`bia: ảnh ${bia.anhNen} là ảnh giữ chỗ`);
  // Số trên bìa phải đúng số trong video (lời bình, props các cảnh; hook không tính vì chính nó là bản sao của bìa).
  const text = [
    ...spec.scenes.flatMap((s) => parseMarkup(s.markup).map((t) => t.show)),
    JSON.stringify(spec.scenes.map((s) => s.props)),
  ].join(" ");
  for (const n of (bia.diemNhan ?? "").match(/\d[\d.,]*\d|\d/g) ?? []) {
    if (!text.includes(n)) errors.push(`bia: số "${n}" của diemNhan không có trong video`);
  }
  const h = spec.hook;
  if (h) {
    const khac = [];
    if (JSON.stringify(h.lines) !== JSON.stringify(bia.tieuDe)) khac.push("lines/tieuDe");
    if ((h.soNhan ?? "") !== (bia.diemNhan ?? "")) khac.push("soNhan/diemNhan");
    if ((h.donVi ?? "") !== (bia.ghiChuNhan ?? "")) khac.push("donVi/ghiChuNhan");
    if ((h.image?.file ?? "") !== bia.anhNen) khac.push("image.file/anhNen");
    if ((h.image?.label ?? "") !== bia.nhanAnh) khac.push("image.label/nhanAnh");
    if ((h.viTriAnh ?? "") !== (bia.viTriAnh ?? "")) khac.push("viTriAnh");
    if (chuDeCuaBia(h.chuDe) !== chuDeCuaBia(bia.chuDe)) khac.push("chuDe (chủ đề, quyết định màu)");
    if (khac.length) errors.push(`hook khác bia.json ở: ${khac.join(", ")} (khung 0 của video phải là bìa)`);
  }
  return errors;
}
