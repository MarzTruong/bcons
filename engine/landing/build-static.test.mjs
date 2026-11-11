// Landing dựng sẵn (Bcons Newsky, thiết kế AGY): nhúng lịch đợt từ nguon/pttt-cdt.json, đủ ảnh, form đúng giao thức.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildLanding } from "./build.mjs";
import { calcWith } from "./calc.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROJ = path.join(ROOT, "du-an", "bcons-newsky");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "ls-"));
const dir = buildLanding(PROJ, out, { draft: true });
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const client = fs.readFileSync(path.join(dir, "client.js"), "utf8");

test("nhúng đúng lịch đợt 08/09/10 từ pttt-cdt.json; tính bằng lõi calc cho đúng số căn B1.3-01", () => {
  const data = JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(Object.keys(data.plans).sort(), ["08", "09", "10"]);
  assert.equal(data.plans["08"].rows.length, 12);
  assert.equal(data.plans["09"].rows.length, 7);
  assert.equal(data.plans["10"].rows.length, 9);
  // PTTT 10: mốc thời gian đủ (anh dặn từ biên bản kiểm AGY), không còn "Theo thông báo PTTT 10"
  assert.ok(data.plans["10"].rows.every((r) => r.w && !/Theo thông báo PTTT/.test(r.w)));
  const r = calcWith(data.plans["09"], 4060690141);
  assert.equal(r.handover, 1136993239);
  assert.equal(r.loan, 2233379578);
  const p10 = data.plans["10"];
  const r10 = calcWith(p10, Math.round(4060690141 * (1 - p10.chietKhau)));
  assert.ok(Math.abs(r10.handover - 1112547882) <= 3, String(r10.handover));
});

test("không còn bản đồ Google nhúng, câu tiện ích xung quanh, nhãn 'sau chiết khấu'", () => {
  assert.ok(!/maps\.google\.com\/maps\?[^"]*output=embed/.test(html), "không nhúng Google Maps");
  assert.match(html, /<iframe class="map-embed"[^>]*src="https:\/\/www\.openstreetmap\.org\/export\/embed\.html/);
  assert.ok(!/Tiện ích hiện hữu xung quanh/.test(html));
  assert.ok(!/sau chiết khấu/.test(html + client));
  assert.ok(/Giá căn hộ có VAT/.test(client));
});

test("mọi ảnh trang dùng đều có trong bản dựng", () => {
  const refs = [...new Set([...(html + client).matchAll(/assets\/[A-Za-z0-9._-]+/g)].map((m) => m[0]))];
  assert.ok(refs.length >= 25);
  for (const f of refs) assert.ok(fs.existsSync(path.join(dir, f)), `thiếu ${f}`);
});

test("form: gửi thật về formUrl, chờ đủ 3,2 giây, tính thời gian sau lúc chờ, ô đồng ý không tick sẵn", () => {
  assert.match(client, /fetch\(D\.formUrl/);
  assert.match(client, /3200 - \(Date\.now\(\) - T0\)/);
  assert.ok(client.indexOf("payload.t = Date.now() - T0") > client.indexOf("3200 -"), "t đo sau khi chờ");
  assert.ok(!/id="dongY"[^>]*checked/.test(html));
  assert.ok(!/Đã ghi nhận yêu cầu/.test(client), "không báo thành công giả");
});

test("client.js là module hợp lệ và dùng calc.js của engine", () => {
  const f = path.join(out, "check.mjs");
  fs.writeFileSync(f, client);
  execFileSync(process.execPath, ["--check", f]);
  assert.match(client, /from "\.\/calc\.js"/);
  assert.ok(fs.existsSync(path.join(dir, "calc.js")));
});

test("thiếu formUrl thì không đăng được (chỉ bản nháp được xuất)", () => {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), "np-"));
  fs.cpSync(PROJ, tam, { recursive: true, filter: (f) => !f.includes(`${path.sep}assets`) && !f.includes(`${path.sep}video`) });
  const f = path.join(tam, "landing", "landing.json");
  fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, "utf8")), formUrl: "" }));
  assert.throws(() => buildLanding(tam, out), /formUrl/);
  assert.ok(buildLanding(tam, out, { draft: true }));
});

test("bản đăng thật có formUrl Apps Script và trang gửi kèm duAn", () => {
  const d = buildLanding(PROJ, out);
  assert.match(fs.readFileSync(path.join(d, "index.html"), "utf8"), /https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec/);
  assert.match(client, /duAn: D\.duAn|duAn: "bcons-newsky"/);
});

test("anh chỉ lỗi 11/11: bản đồ nhúng, thẳng hàng 2 ô lãi/kỳ hạn, cột 'Bảo trì' không xuống dòng, thẻ pháp lý có PDF, thẻ quà tặng có ảnh", () => {
  assert.match(html, /\.calc-panel \.form-row \{ align-items: end; \}/);
  assert.match(html, /\.sched-table td:first-child \{\s*white-space: nowrap;/);
  assert.equal([...html.matchAll(/class="promo-media"/g)].length, 3);
  assert.equal([...html.matchAll(/<img src="assets\/promo-[a-z]+\.jpg"/g)].length, 3);
  const pdfs = [...html.matchAll(/href="(tai-lieu\/[^"]+\.pdf)"/g)].map((m) => m[1]);
  assert.ok(pdfs.length >= 3, "ít nhất 3 văn bản pháp lý có file");
  for (const f of pdfs) assert.ok(fs.existsSync(path.join(dir, f)), `thiếu ${f}`);
  assert.ok(!/Tiện ích hiện hữu xung quanh/.test(html));
});
