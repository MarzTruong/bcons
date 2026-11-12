// Kiểm CẢ CHUỖI như khách thật: landing (trình duyệt) → form gửi → Apps Script (Code.gs) → tin Telegram → link phiếu → trang phiếu dựng số.
// Mọi tổ hợp loại căn × PTTT của cả hai dự án; số trên phiếu phải đúng bằng số khách thấy khi gửi form.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildLanding } from "./build.mjs";
import { parseLenhPhieu } from "../remotion/scripts/phieu.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let chromium = null;
try {
  chromium = createRequire(path.join(ROOT, "engine", "remotion", "package.json"))("playwright").chromium;
} catch {
  /* máy không có playwright: bỏ qua phần trình duyệt */
}
const co = chromium ? {} : { skip: "không có playwright" };

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".json": "application/json", ".css": "text/css", ".pdf": "application/pdf", ".jpg": "image/jpeg", ".png": "image/png" };
function phucVu(dir) {
  const sv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] ?? "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => sv.listen(0, "127.0.0.1", () => r({ sv, base: `http://127.0.0.1:${sv.address().port}` })));
}

const gs = {};
vm.createContext(gs);
vm.runInContext(fs.readFileSync(path.join(ROOT, "engine", "landing", "apps-script", "Code.gs"), "utf8"), gs);
const out = fs.mkdtempSync(path.join(os.tmpdir(), "chuoi-"));

/** Gửi form như khách (đã chọn sẵn trên trang), trả body POST mà trang gửi tới Apps Script. */
async function guiForm(page, formUrl) {
  let body = null;
  await page.route(formUrl, async (route) => { body = route.request().postData(); await route.fulfill({ status: 200, body: "{}" }); });
  await page.fill("#ten", "Nguyễn Văn Thử");
  await page.fill("#sdt", "0901234567");
  await page.check("#dongY");
  await page.clock.fastForward(4000);
  await page.click(page.locator("#send").count ? "#send" : "button[type=submit]");
  await page.waitForFunction(() => true);
  for (let i = 0; i < 50 && !body; i++) await page.waitForTimeout(100);
  await page.unroute(formUrl);
  assert.ok(body, "form phải gửi được tới Apps Script");
  return JSON.parse(body);
}

/** Từ payload: qua Code.gs → tin Telegram → link phiếu → mở trang phiếu → trả phiếu đã dựng. */
async function quaChuoi(browser, base, payload, site) {
  const v = gs.validateLead_(payload);
  assert.equal(v.ok, true, `Apps Script từ chối: ${v.error}`);
  assert.equal(v.spam, undefined);
  const tin = gs.formatTelegram_(v.lead);
  const m = tin.match(/<a href="(https:\/\/[^"]+\/phieu\.html\?[^"]+)">/);
  if (m) m[1] = m[1].replaceAll("&amp;", "&");
  assert.ok(m, `tin Telegram phải có link phiếu:\n${tin}`);
  assert.ok(m[1].startsWith(site + "/phieu.html?"), `link phiếu trỏ sai trang: ${m[1]}`);
  const p = await browser.newPage({ viewport: { width: 390, height: 800 }, acceptDownloads: true });
  const loi = [];
  p.on("pageerror", (e) => loi.push(e.message));
  await p.goto(base + "/phieu.html?" + m[1].split("?")[1]);
  await p.waitForFunction(() => document.documentElement.dataset.ready === "1", null, { timeout: 8000 });
  const phieu = await p.evaluate(() => window.__phieu);
  assert.ok(phieu, `trang phiếu không dựng được: ${await p.innerText("#app")}`);
  assert.ok(await p.$eval("#luu-anh", (e) => !e.hidden), "nút Lưu ảnh phải hiện");
  assert.equal(loi.length, 0, loi.join("|"));
  await p.close();
  return { phieu, tin, lead: v.lead };
}

const lead0 = (payload) => gs.validateLead_(payload).lead;

function doiChieu(payload, phieu, lead) {
  assert.equal(phieu.pttt.ma, payload.pttt.slice(-2), "PTTT");
  assert.equal(phieu.gia.chuaVat, payload.giaChuaVat, "giá chưa VAT");
  assert.equal(phieu.gia.coVat, payload.giaCoVat, "giá có VAT");
  assert.equal(phieu.gia.phiBaoTri, payload.phiBaoTri, "phí bảo trì");
  assert.equal(phieu.tong.tuCoTruocBanGiao, payload.tuCo, "tự có");
  assert.equal(phieu.tong.khoanVay, payload.vay, "khoản vay");
  if (payload.vay > 0) {
    assert.ok(phieu.vay, "có vay thì phiếu phải có phần vay");
    assert.ok(Math.abs(phieu.vay.traGopThang - payload.traGop) <= 1, `trả góp ${phieu.vay.traGopThang} vs ${payload.traGop}`);
    assert.equal(phieu.vay.lai, payload.lai);
    assert.equal(phieu.vay.namVay, payload.nam);
  } else {
    assert.equal(phieu.vay, null);
  }
  assert.ok(!JSON.stringify(phieu).match(/0901234567|Nguyễn Văn Thử/), "phiếu không mang SĐT/tên khách");
  assert.equal(lead.duAn, payload.duAn);
}

test("Central Park: mọi căn mẫu × 5 PTTT đi hết chuỗi, số phiếu = số khách thấy; lệnh bot khớp", co, async () => {
  const d = buildLanding(path.join(ROOT, "du-an", "bcons-central-park"), out);
  const { sv, base } = await phucVu(d);
  const browser = await chromium.launch();
  try {
    const site = gs.SITE["bcons-central-park"];
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, "du-an", "bcons-central-park", "landing", "landing.json"), "utf8"));
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.clock.install();
    await page.goto(base + "/");
    const nCan = await page.locator("#cards .unit").count();
    assert.ok(nCan >= 5);
    let dem = 0;
    for (let i = 0; i < nCan; i++) {
      await page.locator("#cards .unit").nth(i).click();
      for (const k of ["01", "02", "03", "04", "05"]) {
        await page.locator(`#plans .chip[data-k="${k}"]`).click();
        const payload = await guiForm(page, data.formUrl);
        assert.equal(payload.canStt, i, "trang gửi số thứ tự căn");
        assert.ok(!JSON.stringify(payload).includes(data.canMau[i].ma), "trang không gửi/chứa mã căn");
        assert.equal(lead0(payload).canMa, data.canMau[i].ma, "Apps Script tra ra đúng mã căn");
        const { phieu, tin, lead } = await quaChuoi(browser, base, payload, site);
        doiChieu(payload, phieu, lead);
        assert.equal(phieu.can.ma, data.canMau[i].ma);
        // lệnh bấm được trong tin Telegram đọc lại đúng bằng bộ đọc lệnh của bot
        const lenh = tin.match(/(\/phieu_\S+)/)?.[1];
        assert.ok(lenh, "CP có mã căn nên phải có lệnh /phieu_");
        const a = parseLenhPhieu(lenh.toLowerCase());
        assert.deepEqual([a.ma, a.pttt, a.lai, a.nam], [data.canMau[i].ma, k, payload.lai, payload.nam]);
        dem++;
        await page.reload();
        await page.locator("#cards .unit").nth(i).click();
      }
    }
    assert.equal(dem, nCan * 5);
  } finally {
    await browser.close();
    sv.close();
  }
});

test("Newsky: mọi loại căn × PTTT 08/09/10 đi hết chuỗi, số phiếu = số khách thấy", co, async () => {
  const proj = path.join(ROOT, "du-an", "bcons-newsky");
  const d = buildLanding(proj, out);
  const { sv, base } = await phucVu(d);
  const browser = await chromium.launch();
  try {
    const site = gs.SITE["bcons-newsky"];
    const data = JSON.parse(fs.readFileSync(path.join(proj, "landing", "landing.json"), "utf8"));
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.clock.install();
    await page.goto(base + "/");
    for (const loai of Object.keys(data.loaiCan)) {
      for (const k of data.pttt) {
        await page.reload();
        await page.selectOption("#calcType", loai);
        await page.locator(`#planChips [data-plan="${k}"]`).click();
        const payload = await guiForm(page, data.formUrl);
        assert.equal(payload.duAn, "bcons-newsky");
        const { phieu, lead } = await quaChuoi(browser, base, payload, site);
        doiChieu(payload, phieu, lead);
        assert.equal(phieu.can.ma, null, "Newsky tính theo khung giá, không có mã căn");
        assert.equal(phieu.can.loai, data.loaiCan[loai].label);
      }
    }
  } finally {
    await browser.close();
    sv.close();
  }
});

test("mọi địa chỉ nối giữa các phần khớp nhau (không cần trình duyệt)", () => {
  const site = vm.runInContext("SITE", gs);
  const urls = new Set();
  for (const ma of ["bcons-central-park", "bcons-newsky"]) {
    const proj = JSON.parse(fs.readFileSync(path.join(ROOT, "du-an", ma, "project.json"), "utf8"));
    const land = JSON.parse(fs.readFileSync(path.join(ROOT, "du-an", ma, "landing", "landing.json"), "utf8"));
    assert.equal(new URL(proj.watermark.link).origin.toLowerCase(), site[ma], `${ma}: QR và SITE`);
    assert.match(land.formUrl, /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/, `${ma}: formUrl`);
    urls.add(land.formUrl);
    assert.ok(Object.keys(vm.runInContext("DU_AN_TEN", gs)).includes(ma), `${ma}: tên dự án trong Code.gs`);
  }
  const ca = JSON.parse(fs.readFileSync(path.join(ROOT, "du-an", "bcons-central-park", "landing", "landing.json"), "utf8")).canMau.map((u) => u.ma);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext("CAN_MAU", gs)["bcons-central-park"])), ca, "CAN_MAU trong Code.gs phải khớp thứ tự canMau trong landing.json");
  assert.equal(urls.size, 1, "hai landing phải gửi về cùng một Apps Script (script phân biệt theo duAn)");
});

test("mã theo dõi: ?utm_source + utm_campaign trên link thành cột Nguồn 'nguon.chiendich' ở cả hai landing; không có thì 'truc-tiep'", co, async () => {
  const cacDuAn = [["bcons-central-park", "#cards .unit"], ["bcons-newsky", "#calcType"]];
  const browser = await chromium.launch();
  try {
    for (const [ma] of cacDuAn) {
      const proj = path.join(ROOT, "du-an", ma);
      const d = buildLanding(proj, out);
      const { sv, base } = await phucVu(d);
      const data = JSON.parse(fs.readFileSync(path.join(proj, "landing", "landing.json"), "utf8"));
      for (const [query, mong] of [
        ["?utm_source=tiktok&utm_campaign=lai-vay", "tiktok.lai-vay"],
        ["?utm_source=Facebook&utm_campaign=Bài%20Hạ%20Tầng!", "facebook.bai-ha-tang"],
        ["?utm_source=qr", "qr"],
        ["", "truc-tiep"],
      ]) {
        const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
        await page.clock.install();
        await page.goto(base + "/" + query);
        const payload = await guiForm(page, data.formUrl);
        assert.equal(payload.nguon, mong, `${ma} ${query}`);
        assert.equal(gs.validateLead_(payload).lead.nguon, mong, "Apps Script giữ nguyên nguồn đã làm sạch");
        await page.close();
      }
      sv.close();
    }
  } finally {
    await browser.close();
  }
});
