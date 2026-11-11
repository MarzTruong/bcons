// Dựng phiếu tính (PNG + PDF) cho một căn: npm run phieu -- <mã căn> <PTTT> [lai=9.5] [nam=20] [ten=Minh] [pdf]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { takeProjectFlag } from "./project.mjs";
import { timCan } from "../../landing/phieu/can.mjs";
import { taoPhieu } from "../../landing/phieu/du-lieu.mjs";
import { MAU, dungHtml, themQr, renderPhieu } from "../../landing/phieu/render.mjs";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out", "phieu");
const CU_PHAP = "Cú pháp: /phieu <mã căn> <PTTT> [lai=9.5] [nam=20] [ten=Tên] [pdf]  (vd. /phieu A18-09 03 pdf)";
const chuanPttt = (s) => String(s).replace(/\D/g, "").padStart(2, "0");

/** Tách ten="Nguyễn Văn A" hoặc ten=Minh; trả [ten, phần còn lại]. */
function tachTen(text) {
  let ten;
  const rest = text.replace(/\bten=(?:"([^"]*)"|(\S+))/i, (_, a, b) => ((ten = a ?? b), ""));
  return [ten, rest];
}

/** Đọc lệnh dạng gõ tay hoặc dạng bấm được /phieu_<mã>_<PTTT>_<lãi>_<năm> → {ma, pttt, lai?, nam?, ten?, pdf}. */
export function parseLenhPhieu(text) {
  const [ten, rest] = tachTen(String(text).trim());
  const tokens = rest.split(/\s+/).filter(Boolean);
  const pdf = tokens.some((t) => /^pdf$/i.test(t));
  const out = { pdf };
  let args = tokens.filter((t) => !/^pdf$/i.test(t));
  const dau = args[0]?.match(/^\/phieu(?:@\w+)?(?:_(\w+))?$/i);
  if (dau) {
    args = args.slice(1);
    if (dau[1]) {
      const p = dau[1].split("_");
      if (p.length < 4) throw new Error(CU_PHAP);
      const nam = p.pop(), lai = p.pop(), pttt = p.pop();
      const ma = p.join("-").replace(/p/g, ".").toUpperCase();
      Object.assign(out, { ma, pttt: chuanPttt(pttt), lai: Number(lai.replace("p", ".")), nam: Number(nam) });
      if (!(out.lai > 0) || !(out.nam > 0)) throw new Error(CU_PHAP);
    }
  }
  if (!out.ma) {
    const kv = {};
    const pos = [];
    for (const t of args) {
      const m = t.match(/^(lai|nam)=([\d.,]+)$/i);
      if (m) kv[m[1].toLowerCase()] = Number(m[2].replace(",", "."));
      else if (!/^pttt$/i.test(t)) pos.push(t);
    }
    if (pos.length < 2) throw new Error(CU_PHAP);
    Object.assign(out, { ma: pos[0].toUpperCase(), pttt: chuanPttt(pos[1]), ...kv });
  }
  if (ten) out.ten = ten;
  const { ma, pttt, lai, nam, ten: t2, pdf: pd } = out;
  return { ma, pttt, ...(lai !== undefined && { lai }), ...(nam !== undefined && { nam }), ...(t2 && { ten: t2 }), pdf: pd };
}

/** Lập phiếu. deps (để test): timCan, render. Trả {png, pdf?, cao, canhBao?, phieu}. */
export async function chayPhieu({ ma, pttt, lai, nam, ten, pdf = false, projDir }, deps = {}) {
  const tim = deps.timCan ?? timCan;
  const render = deps.render ?? renderPhieu;
  const can = await tim(projDir, ma);
  if (!can) throw new Error(`Không thấy căn ${ma} (Master File hoặc căn mẫu của landing).`);
  let phieu = taoPhieu({ projDir, can, pttt, lai, nam, khach: { ten } });
  phieu = await themQr(phieu);
  const html = dungHtml(fs.readFileSync(MAU, "utf8"), phieu);
  const tenFile = `${can.ma}-${phieu.pttt.ma}`.replace(/[^A-Za-z0-9.-]/g, "_");
  const kq = await render({ html, outDir: OUT, tenFile, pdf });
  return { ...kq, phieu };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { projDir, rest } = takeProjectFlag(process.argv.slice(2));
    const r = await chayPhieu({ ...parseLenhPhieu(rest.join(" ")), projDir });
    console.log(r.png);
    if (r.pdf) console.log(r.pdf);
    if (r.canhBao) console.warn(r.canhBao);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
