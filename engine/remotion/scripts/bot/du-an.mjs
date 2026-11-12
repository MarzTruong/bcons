// Dự án bot đang làm việc: anh chọn trong Telegram (/duan), bot nhớ qua các lần mở lại. config.json chỉ là mặc định lần đầu.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../project.mjs";

const NAME_RE = /^[a-z0-9-]+$/;

/** Mã ngắn gắn vào nút bấm để nút của dự án khác (tin cũ) không chạy nhầm. */
export const pidOf = (ma) => crypto.createHash("sha1").update(ma).digest("hex").slice(0, 6);

/** { list() → [{ ma, ten, dir }], get(), set(ma) }. `file`: nơi nhớ lựa chọn (Drive bot/ hoặc out/tam). */
export function taoDuAn({ root = REPO_ROOT, file }) {
  const list = () => {
    const base = path.join(root, "du-an");
    if (!fs.existsSync(base)) return [];
    return fs
      .readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory() && NAME_RE.test(d.name) && fs.existsSync(path.join(base, d.name, "project.json")))
      .map((d) => {
        let ten = d.name;
        let maNgan = "";
        try {
          const cfg = JSON.parse(fs.readFileSync(path.join(base, d.name, "project.json"), "utf8"));
          ten = cfg.ten || d.name;
          maNgan = cfg.maNgan || "";
        } catch {
          // project.json hỏng: vẫn hiện bằng mã
        }
        return { ma: d.name, ten, maNgan, dir: path.join(base, d.name) };
      })
      .sort((a, b) => a.ma.localeCompare(b.ma));
  };
  const docJson = (f, key) => {
    try {
      return JSON.parse(fs.readFileSync(f, "utf8"))[key];
    } catch {
      return undefined;
    }
  };
  const get = () => {
    const ds = list();
    const tim = (ma) => ds.find((x) => x.ma === ma);
    return tim(docJson(file, "ma")) ?? tim(docJson(path.join(root, "config.json"), "duAnDangBan")) ?? ds[0] ?? null;
  };
  const set = (ma) => {
    const hit = list().find((x) => x.ma === ma);
    if (!hit) throw new Error(`Không thấy dự án "${ma}"`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ ma }));
    return hit;
  };
  /** "newsky" → bcons-newsky nếu chỉ khớp một dự án. */
  const tim = (chu) => {
    const a = String(chu ?? "").trim().toLowerCase();
    if (!a) return null;
    const ds = list();
    const hit = ds.filter((x) => x.ma === a);
    const gan = hit.length ? hit : ds.filter((x) => x.ma.includes(a));
    return gan.length === 1 ? gan[0] : null;
  };
  return { list, get, set, tim };
}
