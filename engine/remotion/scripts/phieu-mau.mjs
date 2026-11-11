// Dựng bộ phiếu kiểm UX vào out/phieu-mau/ (6 tình huống) và in chiều cao từng ảnh. Dùng sau khi đổi template.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectDir } from "./project.mjs";
import { timCan } from "../../landing/phieu/can.mjs";
import { taoPhieu } from "../../landing/phieu/du-lieu.mjs";
import { MAU, dungHtml, themQr, renderPhieu } from "../../landing/phieu/render.mjs";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out", "phieu-mau");
// Căn B1.3-01 của Newsky (giá chưa VAT thật từ Master File) để chạy được cả khi máy không có Master File.
const B101 = { ma: "B1.3-01", loai: "2PN-2WC", thap: "B1", tang: 3, dtTimTuong: 62.5, giaChuaVat: { "08": 3831261156, "09": 4060690141, "10": 3973385292 }, tinhTrang: "Trống" };

export const KICH_BAN = [
  { ten: "01-central-park-pttt03", du: "bcons-central-park", ma: "A18-09", pttt: "03" },
  { ten: "02-newsky-pttt08-12-dot", du: "bcons-newsky", can: B101, pttt: "08" },
  { ten: "03-newsky-pttt10", du: "bcons-newsky", can: B101, pttt: "10" },
  { ten: "04-central-park-pttt01-khong-vay", du: "bcons-central-park", ma: "A18-09", pttt: "01" },
  { ten: "05-ten-khach-rat-dai", du: "bcons-central-park", ma: "A18-09", pttt: "03", khach: { ten: "Nguyễn Thị Phương Anh Thư Trần Lê Hoàng Gia Bảo" } },
  { ten: "06-khong-ten", du: "bcons-central-park", ma: "A18-09", pttt: "03", khach: {} },
];

export async function chayMau({ ma: _ } = {}) {
  const template = fs.readFileSync(MAU, "utf8");
  const kq = [];
  for (const k of KICH_BAN) {
    const projDir = projectDir(k.du);
    const can = k.can ?? (await timCan(projDir, k.ma)) ?? (await timCan(projDir, "A21-26"));
    const phieu = await themQr(taoPhieu({ projDir, can, pttt: k.pttt, khach: k.khach ?? { ten: "Minh" } }));
    const r = await renderPhieu({ html: dungHtml(template, phieu), outDir: OUT, tenFile: k.ten, pdf: true });
    kq.push({ ten: k.ten, can: can.ma, ...r });
  }
  return kq;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const r of await chayMau()) console.log(`${r.ten} (${r.can}): cao ${r.cao}px${r.canhBao ? " ⚠ " + r.canhBao : ""}\n  ${r.png}`);
}
