// Công cụ bán hàng (bản AGY đã tích hợp): build sạch, không giá thật, quy tắc cứng, và chạy thật trong Chromium:
// số tiền hiện ra = lõi tài chính, đổi PTTT, căn đã cọc/LOCK, vay tùy chọn, ảnh xuất, nút Cập nhật, mất mạng.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildBanHang } from "./build.mjs";
import { loadCdt, planFromJson } from "../landing/plans-json.mjs";
import { phuongAn } from "./tai-chinh.mjs";
import { parseMa } from "./giohang.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROJ = path.join(ROOT, "du-an", "bcons-newsky");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "bh-"));
const dir = buildBanHang(PROJ, out);
const doc = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const cdt = loadCdt(PROJ);
const plans = Object.fromEntries(["09", "08", "10"].map((k) => [k, planFromJson(cdt, k)]));

// ---------- giỏ hàng thử: cấu trúc thật (Block B1 12 vị trí, B2 thiếu 02/04/08 như giỏ hàng thật), giá mô phỏng ----------
const LOAI = {
  B1: { 1: ["3PN-2WC", 77.81, "TN - ĐN"], 2: ["2PN-2WC", 55.15, "Tây Nam"], 3: ["2PN-2WC", 55.15, "Tây Nam"], 4: ["3PN-2WC", 74.82, "TN - TB"], 5: ["3PN-2WC", 74.68, "TB - ĐB"], 6: ["2PN-2WC", 55.13, "Đông Bắc"], 7: ["3PN-2WC", 77.83, "TB - ĐB"], 8: ["2PN-2WC", 55.17, "Đông Bắc"], 9: ["2PN-2WC", 54.76, "Đông Bắc"], 10: ["3PN-2WC", 74.86, "Đông Bắc"], 11: ["3PN-2WC", 74.86, "Tây Nam"], 12: ["2PN-2WC", 55.05, "Tây Nam"] },
  B2: { 1: ["2PN-2WC", 55.05, "Tây Nam"], 3: ["3PN-2WC", 74.86, "Đông Bắc"], 5: ["2PN-2WC", 55.17, "Đông Bắc"], 6: ["3PN-2WC", 77.83, "ĐB - ĐN"], 7: ["2PN-2WC", 55.13, "Đông Bắc"], 9: ["3PN-3WC", 94.7, "ĐB - ĐN"], 10: ["3PN-2WC", 80.47, "TN - ĐN"], 11: ["2PN-1WC", 47.37, "Tây Nam"], 12: ["2PN-1WC", 47.25, "Tây Nam"], 13: ["2PN-2WC", 65.54, "Tây Nam"], 14: ["2PN-2WC", 65.69, "Tây Nam"], 15: ["3PN-2WC", 77.83, "TN - TB"] },
};
const TINH_TRANG = { "B1.5-03": "ĐÃ CỌC", "B1.8-01": "ĐÃ CỌC", "B1.6-01": "CĐT LOCK", "B2.5-05": "ĐÃ CỌC" };
function giohang(doi = {}) {
  const can = [];
  for (const [block, vts] of Object.entries(LOAI)) {
    for (let tang = 3; tang <= 12; tang++) {
      for (const [vt, [loai, dt, huong]] of Object.entries(vts)) {
        const ma = `${block}.${tang}-${String(vt).padStart(2, "0")}`;
        const p09 = Math.round((dt * 52e6 + tang * 6e6 + Number(vt) * 1e6) / 1000) * 1000;
        can.push({ ma, thap: "B", block, tang, viTri: Number(vt), loai, huong, dtTimTuong: dt, dtThongThuy: +(dt - 5).toFixed(2),
          giaChuaVat: { "09": p09, "08": Math.round(p09 * 0.9435), "10": Math.round(p09 * 0.9785) }, tinhTrang: TINH_TRANG[ma] ?? "Trống", ...(doi[ma] ?? {}) });
      }
    }
  }
  return { capNhat: "2026-11-13T08:30:00+07:00", phienBan: 1, thap: "B", can };
}
const fmtTy = (v) => (Math.abs(v) / 1e9).toFixed(2).replace(".", ",") + " tỷ";
const fmtTrieu = (v) => Math.round(Math.abs(v) / 1e6) + " triệu";
const fmtTrieu1 = (v) => (Math.abs(v) / 1e6).toFixed(1).replace(".", ",") + " triệu";

// ---------- test tĩnh trên bản build ----------
test("build: đủ file, lõi dùng chung với test (cùng calc.mjs), không có giá thật hay dữ liệu khách", () => {
  for (const f of ["index.html", "app.js", "main.js", "nguon.mjs", "sw.js", "manifest.webmanifest", "plans.json", "lien-he.json", "core/calc.mjs", "core/giohang.mjs", "core/tai-chinh.mjs", "giohang-mau.json", "robots.txt", "_headers", "icon-192.png", "mat-bang/mbt-b-19.jpg"]) {
    assert.ok(fs.existsSync(path.join(dir, f)), `thiếu ${f}`);
  }
  assert.equal(doc("core/calc.mjs"), fs.readFileSync(path.join(ROOT, "engine/landing/calc.mjs"), "utf8"));
  assert.ok(!fs.existsSync(path.join(dir, "giohang.json")));
  assert.match(JSON.parse(doc("giohang-mau.json"))._ghiChu, /MẪU MÔ PHỎNG/i);
  // không có số 10 chữ số (giá đồng) trong mã/trang; plans chỉ có tỷ lệ
  for (const f of ["index.html", "app.js", "main.js", "nguon.mjs", "plans.json", "lien-he.json", "core/giohang.mjs", "core/tai-chinh.mjs", "sw.js"]) {
    assert.ok(!/(?<![\d.])\d{10,}(?![\d.])/.test(doc(f)), `${f} có số giống giá thật`);
  }
  assert.ok(!/xlsx|hoa hồng|HoaHong/i.test(doc("app.js") + doc("main.js") + doc("nguon.mjs")));
});

test("noindex ở mọi tầng: meta, header, robots", () => {
  assert.match(doc("index.html"), /<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.match(doc("_headers"), /X-Robots-Tag: noindex/);
  assert.match(doc("robots.txt"), /Disallow: \//);
});

test("giao diện không tự viết công thức: không có calcWith/pmt/danhDauGiaRe riêng, chỉ nhập từ lõi", () => {
  const app = doc("app.js");
  assert.match(app, /from "\.\/core\/giohang\.mjs"/);
  assert.match(app, /from "\.\/core\/tai-chinh\.mjs"/);
  assert.ok(!/function (calcWith|pmt|danhDauGiaRe|matBangTang|theCan|parseMa)\b/.test(app));
  assert.ok(!/\bcalcWith\(|\bpmt\(/.test(app));
  assert.ok(!/const (VAT|FEE) =/.test(app));
});

test("quy tắc cứng trong chữ của giao diện: không 'sắp hết', không hứa lợi nhuận/tăng giá, không SĐT chữ trên ảnh xuất, trần 6,9% theo PTTT", () => {
  const txt = doc("index.html") + doc("app.js");
  for (const re of [/sắp hết/i, /cam kết/i, /lợi nhuận/i, /sinh lời/i, /tăng giá/i, /chắc chắn/i, /đón gió/i, /Tự có đợt đầu nhẹ nhất/, /theo bảng giá (CĐT|chủ đầu tư)/i]) {
    assert.ok(!re.test(txt), `còn câu cấm: ${re}`);
  }
  assert.ok(!/LS trần 6,9%/.test(txt), "trần 6,9% không được ghi cứng cho mọi PTTT");
  assert.ok(!/fillText\([^)]*agentInfo\.phone/.test(doc("app.js")), "ảnh xuất cho khách không ghi SĐT chữ");
  assert.ok(!/Đã trừ CK PTTT/.test(txt), "chiết khấu chỉ hiện khi PTTT có chiết khấu");
});

test("nhãn PTTT trên nút khớp pttt-cdt.json (08 trừ 5,65%, 10 trừ 2,15%, trần 6,9% chỉ 09)", () => {
  const html = doc("index.html");
  const pc = (x) => (x * 100).toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
  assert.match(html, new RegExp(`data-pttt="08"[^>]*>PTTT 08 \\(-${pc(cdt.pttt["08"].chietKhau)}%\\)`));
  assert.match(html, new RegExp(`data-pttt="10"[^>]*>PTTT 10 \\(-${pc(cdt.pttt["10"].chietKhau)}%\\)`));
  assert.match(html, /data-pttt="09"[^>]*>PTTT 09 \(Trần 6,9%\)/);
  assert.equal(cdt.pttt["09"].tranLai, 6.9);
  assert.equal(cdt.pttt["10"].tranLai, null);
  assert.equal(cdt.pttt["08"].tranLai, null);
});

test("plans.json = lịch đợt CĐT (pttt-cdt.json) đúng từng dòng; lien-he.json có tên và QR, không có số khác", () => {
  assert.deepEqual(JSON.parse(doc("plans.json")), plans);
  const lh = JSON.parse(doc("lien-he.json"));
  const proj = JSON.parse(fs.readFileSync(path.join(PROJ, "project.json"), "utf8"));
  assert.equal(lh.ten, proj.lienHe.ten);
  assert.equal(lh.sdtHienThi, proj.lienHe.sdtHienThi);
  assert.match(lh.qrSvg, /^<svg /);
});

test("service worker: tải trước toàn bộ mã, phiên bản đổi khi mã đổi, không lưu cuộc gọi Apps Script", () => {
  const sw = doc("sw.js");
  const taiTruoc = JSON.parse(/const TAI_TRUOC = (\[.*?\]);/s.exec(sw)[1]);
  for (const f of ["./", "index.html", "app.js", "main.js", "nguon.mjs", "core/calc.mjs", "core/giohang.mjs", "core/tai-chinh.mjs", "plans.json", "lien-he.json", "manifest.webmanifest"]) assert.ok(taiTruoc.includes(f), `thiếu ${f} trong tải trước`);
  assert.ok(!taiTruoc.some((f) => /script\.google\.com/.test(f)));
  assert.match(sw, /if \(!cungNguon && !font\) return;/); // chỉ cùng nguồn + font, Apps Script đi thẳng ra mạng
  const dir2 = buildBanHang(PROJ, fs.mkdtempSync(path.join(os.tmpdir(), "bh2-")));
  assert.equal(fs.readFileSync(path.join(dir2, "sw.js"), "utf8"), sw); // build lặp lại cho cùng kết quả
});

test("hướng view đi qua lõi vào thẻ căn (lỗi cũ: thẻ luôn 'Đang cập nhật')", async () => {
  const { theCan } = await import("./giohang.mjs");
  assert.equal(theCan(giohang().can, "B1.5-01").huong, "TN - ĐN");
});

test("mặt bằng: ô vẽ của AGY khớp mặt bằng CĐT (loại căn, diện tích tim tường) cho từng vị trí B1/B2; mọi căn trong giỏ hàng có ô để bấm", () => {
  const app = doc("app.js");
  const doc1 = (ten) => {
    const khoi = new RegExp(`const ${ten} = \\{([\\s\\S]*?)\\n  \\};`).exec(app)[1];
    const o = {};
    for (const m of khoi.matchAll(/^\s*(\d+):\s*\{[^}]*?loaiDefault: "([^"]+)", dt: ([\d.]+)/gm)) o[Number(m[1])] = [m[2], Number(m[3])];
    return o;
  };
  const hinh = { B1: doc1("B1_GEOM"), B2: doc1("B2_GEOM") };
  assert.equal(Object.keys(hinh.B1).length, 12);
  assert.equal(Object.keys(hinh.B2).length, 15); // đủ 15 vị trí B2: 01..15
  // Bảng CĐT (mặt bằng tầng 10/11/19 của chủ đầu tư): loại căn và DT tim tường; B2 02/04/08 chưa có trong giỏ hàng nhưng vẫn có ô.
  const CDT = { B2: { 2: ["3PN-2WC", 74.86], 4: ["2PN-2WC", 54.76], 8: ["2PN-2WC", 55.17] } };
  for (const block of ["B1", "B2"]) {
    const bang = { ...Object.fromEntries(Object.entries(LOAI[block]).map(([vt, [l, d]]) => [vt, [l, d]])), ...(CDT[block] ?? {}) };
    for (const [vt, [loai, dt]] of Object.entries(bang)) {
      assert.ok(hinh[block][vt], `${block}-${vt} thiếu ô vẽ`);
      assert.deepEqual(hinh[block][vt], [loai, dt], `${block}-${vt}: ô vẽ lệch mặt bằng CĐT`);
    }
    for (const vt of Object.keys(hinh[block])) assert.ok(bang[vt], `${block}-${vt}: có ô nhưng không có căn nào theo mặt bằng CĐT`);
  }
  for (const c of giohang().can) assert.ok(hinh[c.block][c.viTri], `${c.ma} không có ô để bấm`);
});

// ---------- chạy thật trong Chromium ----------
let chromium = null;
try { chromium = createRequire(import.meta.url)("playwright").chromium; } catch { /* môi trường không có Playwright: bỏ qua phần chạy thật */ }
const coTrinhDuyet = Boolean(chromium) && fs.existsSync(process.env.REMOTION_BROWSER || "/opt/pw-browsers") ;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webmanifest": "application/manifest+json" };
let server, base, browser;
before(async () => {
  if (!coTrinhDuyet) return;
  server = http.createServer((q, r) => {
    let p = decodeURIComponent(new URL(q.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end(); }
    r.setHeader("content-type", MIME[path.extname(f)] || "text/plain");
    r.end(fs.readFileSync(f));
  }).listen(0);
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

const URL_GAS = "https://script.google.com/macros/s/AKfycbxTEST/exec";
const lienKet = (k = "khoa-test") => `#cai-dat=${Buffer.from(JSON.stringify({ u: URL_GAS, k }), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;

async function mo(gh, { hash } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const pg = await ctx.newPage();
  const loi = [];
  pg.on("pageerror", (e) => loi.push(e.message));
  const chu = [];
  await pg.addInitScript(() => {
    window.__chu = [];
    window.__anh = 0;
    const ft = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, ...a) { window.__chu.push(String(t)); return ft.call(this, t, ...a); };
    const di = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...a) { window.__anh++; return di.apply(this, a); };
    window.__clip = [];
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t) => { window.__clip.push(t); } }, configurable: true });
  });
  let phat = gh;
  const gas = { goi: 0, mat: false };
  await ctx.route(URL_GAS + "*", async (route) => {
    gas.goi++;
    if (gas.mat) return route.abort("internetdisconnected");
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(typeof phat === "function" ? phat() : phat) });
  });
  await ctx.route("**/fonts.*", (r) => r.abort());
  await pg.goto(base + (hash ?? lienKet()));
  await pg.waitForSelector("#canMa", { timeout: 8000 });
  return { ctx, pg, loi, gas, doi: (g) => { phat = g; } };
}
const chonTang = async (pg, tang) => { await pg.click(`.tang-btn[data-tang="${tang}"]`); };
const chonCan = async (pg, ma) => {
  await chonTang(pg, parseMa(ma).tang);
  await pg.evaluate((m) => document.querySelector(`.unit-vector[data-ma="${m}"]`)?.dispatchEvent(new MouseEvent("click", { bubbles: true })), ma);
};
const doc1 = (pg, id) => pg.textContent(`#${id}`).then((s) => s.trim());

test("E2E: mở bằng liên kết cài đặt, khóa bị xóa khỏi thanh địa chỉ, số tiền mọi PTTT khớp lõi (nhiều căn), không lỗi script", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const gh = giohang();
  const { ctx, pg, loi, gas } = await mo(gh);
  assert.ok(!pg.url().includes("cai-dat"), "khóa phải được xóa khỏi URL");
  assert.equal(gas.goi, 1);
  for (const ma of ["B1.5-01", "B2.4-12", "B2.9-09", "B1.12-10", "B2.11-15", "B2.7-06", "B1.10-04"]) {
    const c = gh.can.find((x) => x.ma === ma);
    if (!c || c.tinhTrang !== "Trống") continue;
    await chonCan(pg, ma);
    for (const k of ["09", "08", "10"]) {
      await pg.click(`.pttt-btn[data-pttt="${k}"]`);
      const pa = phuongAn(plans[k], c.giaChuaVat[k]);
      assert.equal(await doc1(pg, "canMa"), ma);
      assert.equal(await doc1(pg, "giaChuaVat"), fmtTy(pa.P), `${ma} PTTT ${k} giá chưa VAT`);
      assert.equal(await doc1(pg, "giaCoVat"), fmtTy(pa.G), `${ma} PTTT ${k} giá có VAT`);
      assert.equal(await doc1(pg, "tuCo"), fmtTrieu(pa.tuCo), `${ma} PTTT ${k} tự có`);
      assert.equal(await doc1(pg, "khoanVay"), pa.khoanVay > 0 ? fmtTy(pa.khoanVay) : "Không vay");
      assert.equal(await doc1(pg, "banGiao"), fmtTrieu(pa.nhanNha));
      assert.equal(await doc1(pg, "traGop"), pa.khoanVay > 0 ? `~${fmtTrieu1(pa.traGopThang)}/tháng` : "Không vay");
      const dong = await pg.$$eval("#schedBody tr", (trs) => trs.length);
      assert.equal(dong, plans[k].rows.length + 1, "mỗi đợt một dòng + phí bảo trì");
    }
  }
  assert.deepEqual(loi, []);
  await ctx.close();
});

test("E2E: vay tùy chọn 70%/50%/Không vay dùng lõi (tự có không lọt đợt sổ hồng); trả góp lãi 9,5%/20 năm", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const gh = giohang();
  const { ctx, pg } = await mo(gh);
  const c = gh.can.find((x) => x.ma === "B1.7-04");
  await chonCan(pg, c.ma);
  await pg.click('.pttt-btn[data-pttt="09"]');
  for (const t of [0.7, 0.5, 0]) {
    await pg.click(`.loan-pill[data-loan="${t}"]`);
    const pa = phuongAn(plans["09"], c.giaChuaVat["09"], { vay: t });
    assert.equal(await doc1(pg, "tuCo"), fmtTrieu(pa.tuCo), `vay ${t}`);
    assert.equal(await doc1(pg, "khoanVay"), pa.khoanVay > 0 ? fmtTy(pa.khoanVay) : "Không vay");
    assert.ok(pa.tuCo + pa.khoanVay + pa.handover + pa.so - pa.G <= 2);
  }
  await ctx.close();
});

test("E2E: căn đã cọc hiện 'ĐÃ BÁN', không giá, không tư vấn; căn CĐT LOCK không hiện ở đâu cả", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const gh = giohang();
  const { ctx, pg } = await mo(gh);
  // tầng 5: B1.5-03 đã cọc
  await chonCan(pg, "B1.5-01");
  const svg = await pg.$eval('.unit-vector[data-ma="B1.5-03"]', (el) => ({ ban: el.classList.contains("sold"), avail: el.dataset.avail, gia: el.dataset.giacv }));
  assert.equal(svg.ban, true);
  assert.equal(svg.avail, "0");
  assert.ok(!svg.gia || svg.gia === "0" || svg.gia === "", "căn đã cọc không mang giá");
  const vt = await pg.$$eval('#cungVtGrid .vt-card[data-ma="B1.5-03"]', (e) => e.length);
  const thH8 = await pg.$eval('#cungVtGrid .vt-card[data-ma="B1.8-01"]', (el) => ({ ban: el.classList.contains("daban"), text: el.textContent }));
  assert.equal(thH8.ban, true);
  assert.match(thH8.text, /ĐÃ BÁN/);
  assert.ok(!/tỷ/.test(thH8.text), "căn đã bán không hiện giá");
  assert.ok(vt >= 0);
  // LOCK: B1.6-01 không có trong danh sách cùng vị trí, không có trong SVG tầng 6
  const lockTrongDs = await pg.$$eval('#cungVtGrid .vt-card[data-ma="B1.6-01"]', (e) => e.length);
  assert.equal(lockTrongDs, 0, "CĐT LOCK không hiện trong danh sách cùng vị trí");
  await chonTang(pg, 6);
  const lockTrongSvg = await pg.$$eval('.unit-vector[data-ma="B1.6-01"]', (els) => els.map((e) => ({ avail: e.dataset.avail, gia: e.dataset.giacv })));
  for (const e of lockTrongSvg) assert.ok(e.avail === "0" && (!e.gia || e.gia === "0"), "nếu có ô thì không có giá và không chọn được");
  assert.ok(!(await pg.content()).includes("CĐT LOCK"));
  await ctx.close();
});

test("E2E: Zalo + ảnh xuất cho khách: trần 6,9% chỉ PTTT 09 theo lịch CĐT; chiết khấu chỉ PTTT 08/10; không SĐT chữ; có QR", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const gh = giohang();
  const { ctx, pg } = await mo(gh);
  await chonCan(pg, "B2.7-06");
  const ket = {};
  for (const k of ["09", "10", "08"]) {
    await pg.click(`.pttt-btn[data-pttt="${k}"]`);
    await pg.click('.loan-pill[data-loan="auto"]');
    await pg.evaluate(() => { window.__clip.length = 0; window.__chu.length = 0; window.__anh = 0; });
    await pg.click("#btnCopyPitch");
    ket[k] = { pitch: await pg.evaluate(() => window.__clip.join("\n")) };
    await pg.click("#btnExport");
    await pg.waitForSelector("#quotePreviewWrap img");
    ket[k].chu = (await pg.evaluate(() => window.__chu)).join(" | ");
    ket[k].anh = await pg.evaluate(() => window.__anh);
    await pg.click("#btnCloseQuote");
  }
  assert.match(ket["09"].pitch, /lãi trần 6,9%\/năm/);
  assert.ok(!/6,9/.test(ket["10"].pitch + ket["08"].pitch), "PTTT 10 và 08 không có trần 6,9%");
  assert.match(ket["09"].chu, /Lãi trần 6,9%\/năm/);
  assert.ok(!/6,9/.test(ket["10"].chu + ket["08"].chu));
  assert.match(ket["08"].chu, /Đã trừ CK 5,65%/);
  assert.match(ket["10"].chu, /Đã trừ CK 2,15%/);
  assert.ok(!/Đã trừ CK/.test(ket["09"].chu), "PTTT 09 không chiết khấu thì không ghi CK");
  const proj = JSON.parse(fs.readFileSync(path.join(PROJ, "project.json"), "utf8"));
  for (const k of ["09", "10", "08"]) {
    assert.ok(!/0938|Hotline|Zalo:|\b0\d{9}\b/.test(ket[k].chu), `ảnh xuất PTTT ${k} có SĐT chữ`);
    assert.ok(ket[k].chu.includes(proj.lienHe.ten), "tên chuyên viên (project.json lienHe.ten) có trên ảnh");
    assert.equal(ket[k].anh >= 1, true, "QR được vẽ lên ảnh");
    assert.ok(!/sắp hết|cam kết|lợi nhuận|tăng giá/i.test(ket[k].chu + ket[k].pitch));
  }
  await ctx.close();
});

test("E2E: chuyên viên sửa tên/SĐT rồi mở lại vẫn còn (lỗi cũ: lưu và đọc khác khóa)", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const gh = giohang();
  const { ctx, pg } = await mo(gh);
  await pg.click("#btnEditAgent");
  await pg.fill("#inpAgentName", "Nguyễn Thử");
  await pg.fill("#inpAgentPhone", "0900.111.222");
  const luu = await pg.$("#btnSaveAgent, #btnAgentSave, #agentModal button.primary, #agentModal button[type=submit]");
  if (luu) await luu.click(); else await pg.keyboard.press("Enter");
  await pg.reload();
  await pg.waitForSelector("#canMa");
  assert.match(await pg.textContent("#agentNameHdr"), /Nguyễn Thử/);
  await ctx.close();
});

test("E2E: nút Làm mới lấy giỏ hàng mới thật (căn vừa cọc thành 'ĐÃ BÁN'); mất mạng thì giữ dữ liệu đang xem và báo; mở lại offline dùng bản lưu", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const gh = giohang();
  const { ctx, pg, gas, doi } = await mo(gh);
  await chonCan(pg, "B1.9-02");
  assert.equal(await doc1(pg, "canStatus"), "CÒN TRỐNG");
  assert.match(await doc1(pg, "syncStatus"), /Dữ liệu cập nhật lúc .*13\/11/);
  // CĐT/anh đổi Sheet: B1.9-02 vừa có người cọc, giá B1.9-03 đổi
  doi(giohang({ "B1.9-02": { tinhTrang: "ĐÃ CỌC" }, "B1.9-03": { giaChuaVat: { "09": 3_333_000_000, "08": 3_144_000_000, "10": 3_261_000_000 } }, }));
  await pg.click("#btnRefresh");
  await pg.waitForFunction(() => document.querySelector("#canStatus").textContent.trim() === "ĐÃ BÁN", null, { timeout: 5000 });
  assert.equal(await doc1(pg, "giaChuaVat"), "ĐÃ BÁN");
  await chonCan(pg, "B1.9-03");
  await pg.click('.pttt-btn[data-pttt="09"]');
  assert.equal(await doc1(pg, "giaChuaVat"), fmtTy(3_333_000_000));
  // mất mạng: bấm Làm mới không làm hỏng màn hình, báo offline
  gas.mat = true;
  await pg.click("#btnRefresh");
  await pg.waitForFunction(() => /offline/.test(document.querySelector("#syncStatus").textContent), null, { timeout: 5000 });
  assert.equal(await doc1(pg, "giaChuaVat"), fmtTy(3_333_000_000));
  // mở lại khi vẫn mất mạng: dùng bản đã lưu lần cập nhật gần nhất
  await pg.goto(base);
  await pg.waitForSelector("#canMa");
  assert.match(await doc1(pg, "syncStatus"), /offline/);
  await chonCan(pg, "B1.9-03");
  await pg.click('.pttt-btn[data-pttt="09"]');
  assert.equal(await doc1(pg, "giaChuaVat"), fmtTy(3_333_000_000));
  await ctx.close();
});

test("E2E: chưa cài đặt thì báo mở liên kết cài đặt (không trang trắng); sai khóa thì báo rõ", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await ctx.route("**/fonts.*", (r) => r.abort());
  await pg.goto(base);
  await pg.waitForFunction(() => getComputedStyle(document.getElementById("loiDuLieu")).display !== "none");
  assert.match(await pg.textContent("#loiDuLieu"), /liên kết cài đặt/);
  await ctx.route(URL_GAS + "*", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ loi: "khoa" }) }));
  await pg.goto(base + lienKet("khoa-cu"));
  await pg.reload(); // đổi # trên cùng trang không tải lại; mở liên kết mới trên máy thật là một lần mở mới
  await pg.waitForFunction(() => /Sai khóa/.test(document.getElementById("loiDuLieu").textContent));
  // nhập khóa mới ngay trên máy: mở lại và vào được
  await ctx.unroute(URL_GAS + "*");
  await ctx.route(URL_GAS + "*", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(giohang()) }));
  await pg.fill('#formCaiDat input[name="link"]', URL_GAS);
  await pg.fill('#formCaiDat input[name="khoa"]', "khoa-moi-dai-du");
  await pg.click('#formCaiDat button[type="submit"]');
  await pg.waitForSelector("#canMa");
  await ctx.close();
});

test("E2E: #demo mở được bằng giỏ hàng mẫu (không cần khóa) và không lỗi script", { skip: !coTrinhDuyet && "không có Chromium" }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  const pg = await ctx.newPage();
  const loi = [];
  pg.on("pageerror", (e) => loi.push(e.message));
  await ctx.route("**/fonts.*", (r) => r.abort());
  await pg.goto(base + "#demo");
  await pg.waitForSelector("#canMa");
  assert.ok(parseMa(await doc1(pg, "canMa")));
  assert.deepEqual(loi, []);
  await ctx.close();
});
