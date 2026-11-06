// Kiểm và duyệt caption, duyệt video (gắn dấu vân tay sha256 của mp4 anh đã xem).
// Chạy trong engine/remotion:
//   npm run check:caption -- <tên>|--all [--du-an <mã>] [--bai <thư mục bài công ty>]
//   npm run duyet:caption -- <tên> [--du-an <mã>] [--bai <thư mục>]
//   npm run duyet:video -- <tên> [file.mp4] [--du-an <mã>]
// Chỉ anh duyệt (hoặc em chạy khi anh nói rõ "duyệt").
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bodyHash, checkCaption, parseCaption, writeMeta } from "./caption.mjs";
import { listVideos, takeProjectFlag, videoPaths } from "./project.mjs";

/** Giờ Việt Nam dạng 2026-11-07T09:30:00+07:00. */
export function nowVN(d = new Date()) {
  return new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 19) + "+07:00";
}

export function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** Đã đủ duyệt để gửi/đăng chưa. mp4Path = null cho bài không có video. */
export function approvalState(captionText, mp4Path) {
  const { meta } = parseCaption(captionText);
  if (meta.status !== "approved") return { ok: false, reason: "caption chưa duyệt" };
  if (meta.noiDungSha256 !== bodyHash(captionText)) return { ok: false, reason: "caption đổi sau khi duyệt" };
  if (mp4Path) {
    if (!meta.videoSha256) return { ok: false, reason: "video chưa duyệt" };
    if (!fs.existsSync(mp4Path) || sha256File(mp4Path) !== meta.videoSha256) {
      return { ok: false, reason: "video đã render lại sau khi duyệt" };
    }
  }
  return { ok: true, reason: "" };
}

/** Duyệt caption: phải không có lỗi; ghi status, duyetLuc, noiDungSha256; xóa duyệt video cũ. */
export function duyetCaption(captionPath, now = new Date()) {
  const text = fs.readFileSync(captionPath, "utf8");
  const errs = checkCaption(text);
  if (errs.length) throw new Error(`Chưa duyệt được, caption còn lỗi:\n- ${errs.join("\n- ")}`);
  fs.writeFileSync(
    captionPath,
    writeMeta(text, { status: "approved", duyetLuc: nowVN(now), noiDungSha256: bodyHash(text), videoSha256: "" }),
  );
}

/** Duyệt video: caption phải đã duyệt và chưa đổi; ghi sha256 của mp4. */
export function duyetVideo(captionPath, mp4Path) {
  const text = fs.readFileSync(captionPath, "utf8");
  const st = approvalState(text, null);
  if (!st.ok) throw new Error(`Anh chưa duyệt caption (${st.reason}). Chạy duyet:caption trước.`);
  if (!fs.existsSync(mp4Path)) throw new Error(`Không thấy video ${mp4Path}. Render trước (npm run render:drive).`);
  fs.writeFileSync(captionPath, writeMeta(text, { videoSha256: sha256File(mp4Path) }));
}

/** Đường dẫn caption: --bai <thư mục> (bài công ty) hoặc video/<tên>/caption.md. */
export function captionPathFor(name, projDir, baiDir) {
  return baiDir ? path.resolve(baiDir, "caption.md") : videoPaths(name, projDir).caption;
}

function takeBai(rest) {
  const i = rest.indexOf("--bai");
  if (i < 0) return { bai: null, rest };
  const bai = rest[i + 1];
  if (!bai) throw new Error("Thiếu đường dẫn sau --bai (vd. --bai ../../du-an/bcons-central-park/content/bai-cong-ty/<thư mục>)");
  return { bai, rest: [...rest.slice(0, i), ...rest.slice(i + 2)] };
}

function main(argv) {
  const [cmd, ...args] = argv;
  const { projDir, rest: r1 } = takeProjectFlag(args);
  const { bai, rest } = takeBai(r1);
  const name = rest[0];
  if (cmd === "check") {
    const names = name === "--all" ? listVideos(projDir).filter((n) => fs.existsSync(videoPaths(n, projDir).caption)) : [name];
    let failed = false;
    for (const n of bai ? ["(bài công ty)"] : names) {
      const file = captionPathFor(n, projDir, bai);
      if (!fs.existsSync(file)) {
        console.error(`LỖI ${n}: không có ${file}`);
        failed = true;
        continue;
      }
      const errs = checkCaption(fs.readFileSync(file, "utf8"));
      if (errs.length) {
        failed = true;
        console.error(`LỖI ${n}:\n  - ${errs.join("\n  - ")}`);
      } else console.log(`OK ${n} (${parseCaption(fs.readFileSync(file, "utf8")).meta.status || "draft"})`);
    }
    return failed ? 1 : 0;
  }
  if (cmd === "duyet-caption") {
    duyetCaption(captionPathFor(name, projDir, bai));
    console.log(`Đã duyệt caption ${bai ?? name}.`);
    return 0;
  }
  if (cmd === "duyet-video") {
    const mp4 = path.resolve("out", "video", rest[1] ?? `${name}.mp4`);
    duyetVideo(captionPathFor(name, projDir, null), mp4);
    console.log(`Đã duyệt video ${name} (${path.basename(mp4)}).`);
    return 0;
  }
  console.error("Lệnh: check | duyet-caption | duyet-video");
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
