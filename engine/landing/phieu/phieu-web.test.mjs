// Phiếu dựng ngay trong trình duyệt từ liên kết (hướng A): phải cho đúng số như bản máy anh dựng (taoPhieu).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { taoPhieu } from "./du-lieu.mjs";
import { phieuTuLienKet } from "./phieu-web.mjs";
import { duLieuTrang } from "./du-lieu-trang.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CP = path.join(ROOT, "du-an", "bcons-central-park");
const NS = path.join(ROOT, "du-an", "bcons-newsky");
const ngay = new Date(2026, 10, 12);
const a1809 = { ma: "A18-09", loai: "2PN-2WC", thap: "Orchid (A)", tang: 18, dtTimTuong: 62.02, dtThongThuy: 56.91, giaChuaVat: { "01": 3721073155, "02": 4066746600, "03": 4066746600, "04": 3966904500, "05": 3966904500 } };

test("Central Park A18-09 PTTT 03 từ liên kết = phiếu máy dựng (từng số)", () => {
  const D = duLieuTrang(CP, ["01", "02", "03", "04", "05"]);
  const goc = taoPhieu({ projDir: CP, can: a1809, pttt: "03", lai: 9.5, nam: 20, ngay });
  const q = new URLSearchParams({ m: "A18-09", k: "03", g: String(a1809.giaChuaVat["03"]), l: "9.5", n: "20", c: "2PN-2WC", th: "Orchid (A)", tg: "18", d: "62.02", dt: "56.91" });
  const r = phieuTuLienKet("?" + q, D, ngay);
  assert.equal(r.ok, true, r.loi);
  assert.match(r.phieu.lienHe.qrSvg, /^<svg/, "QR dựng sẵn khi build trang");
  delete r.phieu.lienHe.qrSvg;
  assert.deepEqual(r.phieu, goc);
});

test("Newsky PTTT 10 không có mã căn (khung giá): vẫn dựng, can.ma rỗng, số khớp lõi tính", () => {
  const D = duLieuTrang(NS, ["09", "08", "10"]);
  const P = Math.round(4060690141 * (1 - 0.0215));
  const r = phieuTuLienKet(`?k=10&g=${P}&l=9.5&n=20&c=2PN%20%E2%80%93%202WC`, D, ngay);
  assert.equal(r.ok, true, r.loi);
  assert.equal(r.phieu.can.ma, null);
  assert.equal(r.phieu.can.loai, "2PN – 2WC");
  assert.equal(r.phieu.pttt.coTranLai, false);
  assert.ok(Math.abs(r.phieu.tong.banGiao - 1112547882) <= 3);
});

test("liên kết sai hoặc bị sửa: từ chối, không dựng phiếu giá vô lý", () => {
  const D = duLieuTrang(NS, ["09", "08", "10"]);
  for (const q of ["", "?k=99&g=3000000000", "?k=09", "?k=09&g=5", "?k=09&g=99999999999999", "?k=09&g=abc", "?k=09&g=3000000000&l=99", "?k=09&g=3000000000&n=0", "?k=09&g=3000000000&n=80"]) {
    assert.equal(phieuTuLienKet(q, D, ngay).ok, false, q);
  }
  assert.equal(phieuTuLienKet("?k=09&g=3000000000", D, ngay).ok, true, "thiếu lãi/năm thì dùng mặc định");
});

test("chữ trong liên kết bị cắt độ dài và không mang thẻ HTML thô vào dữ liệu phiếu", () => {
  const D = duLieuTrang(NS, ["09"]);
  const r = phieuTuLienKet("?k=09&g=3000000000&c=" + encodeURIComponent("<img src=x onerror=1>" + "a".repeat(200)) + "&t=" + encodeURIComponent("<b>" + "x".repeat(200)), D, ngay);
  assert.equal(r.ok, true);
  assert.ok(r.phieu.can.loai.length <= 40 && !/[<>]/.test(r.phieu.can.loai));
  assert.ok(!/[<>]/.test(r.phieu.khach.xungHo) && r.phieu.khach.xungHo.length <= 40);
});

test("dữ liệu trang không có SĐT, hoa hồng; có QR link và tên tư vấn viên", () => {
  const D = duLieuTrang(CP, ["01", "02", "03", "04", "05"]);
  const s = JSON.stringify(D);
  assert.ok(!/hoaHong|"sdt"|0938/.test(s));
  assert.ok(D.lienHe.ten);
});

test("Apps Script tạo link phiếu mà phieuTuLienKet đọc lại đúng (khách thật: Central Park và Newsky)", () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "engine", "landing", "apps-script", "Code.gs"), "utf8"), ctx);
  const ca = [
    ["bcons-central-park", { canMa: "A21-26", canLoai: "2PN-2WC", canMoTa: "tháp Orchid (A), tầng 18", dt: 62.02, pttt: "PTTT 03", giaChuaVat: 4066746600, lai: 9.5, nam: 20 }, CP, ["01", "02", "03", "04", "05"]],
    ["bcons-newsky", { canMa: "", canLoai: "Không rõ", canMoTa: "2PN – 2WC", dt: 0, pttt: "PTTT 10", giaChuaVat: 3973385292, lai: 9.5, nam: 20 }, NS, ["09", "08", "10"]],
  ];
  for (const [duAn, lead, proj, keys] of ca) {
    const l = { ...lead, duAn };
    const link = ctx.phieuLink_(l);
    assert.match(link, /^https:\/\/[a-z0-9.-]+\.pages\.dev\/phieu\.html\?/);
    const r = phieuTuLienKet(link.slice(link.indexOf("?")), duLieuTrang(proj, keys), ngay);
    assert.equal(r.ok, true, `${duAn}: ${r.loi}`);
    assert.equal(r.phieu.gia.chuaVat, l.giaChuaVat);
    assert.equal(r.phieu.pttt.ma, l.pttt.slice(-2));
  }
  assert.equal(ctx.phieuLink_({ duAn: "du-an-la", giaChuaVat: 1, pttt: "PTTT 03" }), "", "dự án lạ: không tạo link (tránh trỏ sang trang ngoài)");
  assert.equal(ctx.phieuLink_({ duAn: "bcons-newsky", giaChuaVat: 0, pttt: "PTTT 09" }), "", "thiếu giá: không tạo link");
});
