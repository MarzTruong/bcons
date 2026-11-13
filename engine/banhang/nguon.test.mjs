// Nguồn dữ liệu: liên kết cài đặt, tải mạng, lưu trong máy, mất mạng, sai khóa, dữ liệu hỏng, nút Cập nhật bấm lúc mất mạng.
import test from "node:test";
import assert from "node:assert/strict";
import { taoNguon, giaiMaCaiDat, giohangHopLe, luuCaiDat, KHOA_CAI_DAT, KHOA_GIO_HANG } from "./web/nguon.mjs";

const URL_GAS = "https://script.google.com/macros/s/AKfycbxTEST/exec";
const b64url = (o) => Buffer.from(JSON.stringify(o), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const lienKet = (o = { u: URL_GAS, k: "khoa-bi-mat-123" }) => `#cai-dat=${b64url(o)}`;
const GH = (n = 2, capNhat = "2026-11-13T08:00:00+07:00") => ({ capNhat, phienBan: 1, can: Array.from({ length: n }, (_, i) => ({ ma: `B1.5-0${i + 1}`, giaChuaVat: { "09": 2.5e9 } })) });

function moiTruong({ hash = "", luu = {}, tra = () => ({ ok: true, json: async () => GH() }) } = {}) {
  const goi = [];
  const kho = { ...luu };
  const lich = [];
  return {
    goi, kho, lich,
    env: {
      localStorage: { getItem: (k) => (k in kho ? kho[k] : null), setItem: (k, v) => { kho[k] = v; } },
      fetch: async (u, o) => { goi.push({ u, o }); return tra(u); },
      location: { hash, pathname: "/", search: "" },
      history: { replaceState: (_s, _t, url) => lich.push(url) },
      navigator: {},
    },
  };
}

test("giải mã liên kết cài đặt (có tiếng Việt), từ chối link không phải Apps Script hoặc thiếu khóa", () => {
  assert.deepEqual(giaiMaCaiDat(lienKet({ u: URL_GAS, k: "Khóa-ạ" })), { u: URL_GAS, k: "Khóa-ạ" });
  assert.equal(giaiMaCaiDat(lienKet({ u: "https://evil.example/x", k: "a" })), null);
  assert.equal(giaiMaCaiDat(lienKet({ u: URL_GAS, k: "" })), null);
  assert.equal(giaiMaCaiDat("#cai-dat=@@@"), null);
  assert.equal(giaiMaCaiDat(""), null);
});

test("mở liên kết cài đặt: lưu khóa trong máy và xóa khóa khỏi thanh địa chỉ", async () => {
  const m = moiTruong({ hash: lienKet() });
  const n = taoNguon(m.env);
  assert.deepEqual(m.lich, ["/"]);
  assert.equal(JSON.parse(m.kho[KHOA_CAI_DAT]).k, "khoa-bi-mat-123");
  const d = await n.layGioHang();
  assert.equal(d.can.length, 2);
  assert.equal(m.goi.length, 1);
  assert.equal(m.goi[0].u, `${URL_GAS}?khoa=khoa-bi-mat-123`);
  assert.equal(m.goi[0].o.cache, "no-store");
  assert.equal(JSON.parse(m.kho[KHOA_GIO_HANG]).can.length, 2); // đã lưu để dùng offline
});

test("khóa có ký tự đặc biệt được mã hóa trong URL (không vỡ truy vấn)", async () => {
  const m = moiTruong({ hash: lienKet({ u: URL_GAS, k: "a&b=c d" }) });
  await taoNguon(m.env).layGioHang();
  assert.ok(m.goi[0].u.endsWith("?khoa=a%26b%3Dc%20d"));
});

test("mất mạng sau khi đã có dữ liệu: dùng bản lưu lần trước và báo offline", async () => {
  const m1 = moiTruong({ hash: lienKet() });
  await taoNguon(m1.env).layGioHang();
  const m2 = moiTruong({ luu: m1.kho, tra: () => { throw new TypeError("Failed to fetch"); } });
  const n = taoNguon(m2.env);
  const d = await n.layGioHang();
  assert.equal(d.can.length, 2);
  assert.deepEqual(n.trangThai(), { offline: true, tuCache: true, demo: false });
});

test("máy chủ lỗi 500 hoặc dữ liệu trống: giữ bản lưu cũ, không ghi đè bằng dữ liệu rỗng", async () => {
  const m1 = moiTruong({ hash: lienKet() });
  await taoNguon(m1.env).layGioHang();
  const truoc = m1.kho[KHOA_GIO_HANG];
  for (const tra of [() => ({ ok: false, status: 500, json: async () => ({}) }), () => ({ ok: true, json: async () => ({ capNhat: "x", can: [] }) }), () => ({ ok: true, json: async () => ({ can: [{ khongCoMa: 1 }] }) })]) {
    const m = moiTruong({ luu: { ...m1.kho }, tra });
    const n = taoNguon(m.env);
    const d = await n.layGioHang();
    assert.equal(d.can.length, 2);
    assert.equal(m.kho[KHOA_GIO_HANG], truoc);
    assert.equal(n.trangThai().offline, true);
  }
});

test("sai khóa (đã đổi khóa): báo rõ, KHÔNG dùng dữ liệu cũ để khỏi bán theo giá cũ", async () => {
  const m1 = moiTruong({ hash: lienKet() });
  await taoNguon(m1.env).layGioHang();
  const m2 = moiTruong({ luu: m1.kho, tra: () => ({ ok: true, json: async () => ({ loi: "khoa" }) }) });
  await assert.rejects(taoNguon(m2.env).layGioHang(), /Sai khóa/);
});

test("chưa cài đặt trên thiết bị: nói anh mở liên kết cài đặt", async () => {
  const m = moiTruong();
  await assert.rejects(taoNguon(m.env).layGioHang(), /liên kết cài đặt/);
  assert.equal(m.goi.length, 0);
});

test("lần đầu mà mất mạng (chưa có bản lưu): báo lỗi, không trả dữ liệu rỗng", async () => {
  const m = moiTruong({ hash: lienKet(), tra: () => { throw new TypeError("Failed to fetch"); } });
  await assert.rejects(taoNguon(m.env).layGioHang(), /Failed to fetch/);
});

test("bản lưu bị hỏng (JSON lỗi) thì bỏ qua, không làm hỏng ứng dụng", async () => {
  const m = moiTruong({ luu: { [KHOA_CAI_DAT]: JSON.stringify({ u: URL_GAS, k: "k" }), [KHOA_GIO_HANG]: "{không phải json" }, tra: () => { throw new TypeError("offline"); } });
  await assert.rejects(taoNguon(m.env).layGioHang(), /offline/);
});

test("nút Cập nhật: có mạng thì lấy bản mới; mất mạng thì ném lỗi để giao diện giữ dữ liệu đang xem", async () => {
  let n2 = 2;
  let matMang = false;
  const m = moiTruong({ hash: lienKet(), tra: () => { if (matMang) throw new TypeError("Failed to fetch"); return { ok: true, json: async () => GH(n2) }; } });
  const n = taoNguon(m.env);
  assert.equal((await n.layGioHang()).can.length, 2);
  n2 = 3;
  assert.equal((await n.capNhat()).can.length, 3);
  assert.equal(JSON.parse(m.kho[KHOA_GIO_HANG]).can.length, 3);
  matMang = true;
  await assert.rejects(n.capNhat());
  assert.equal(n.trangThai().offline, true);
});

test("#demo dùng giỏ hàng mẫu, không đụng khóa", async () => {
  const m = moiTruong({ hash: "#demo", tra: () => ({ ok: true, json: async () => GH(5) }) });
  const n = taoNguon(m.env);
  assert.equal((await n.layGioHang()).can.length, 5);
  assert.equal(m.goi[0].u, "giohang-mau.json");
  assert.equal(n.trangThai().demo, true);
});

test("giohangHopLe", () => {
  assert.equal(giohangHopLe(GH()), true);
  for (const x of [null, {}, { can: [] }, { can: [null] }, { can: [{ ma: 1 }] }]) assert.equal(giohangHopLe(x), false);
});

test("nhập tay link + khóa trên thiết bị: chặn link lạ, khóa quá ngắn; lưu đúng thì tải được dữ liệu", async () => {
  const m = moiTruong();
  assert.equal(luuCaiDat(m.env.localStorage, "https://evil.example/exec", "khoa-dai-du-dung").ok, false);
  assert.equal(luuCaiDat(m.env.localStorage, URL_GAS, "ngan").ok, false);
  assert.equal(KHOA_CAI_DAT in m.kho, false);
  assert.equal(luuCaiDat(m.env.localStorage, ` ${URL_GAS} `, " khoa-dai-du-dung ").ok, true);
  const d = await taoNguon(m.env).layGioHang();
  assert.equal(d.can.length, 2);
  assert.equal(m.goi[0].u, `${URL_GAS}?khoa=khoa-dai-du-dung`);
});

test("Apps Script báo may-chu (tab đổi tên): thông báo chỉ rõ tên tab GiaTongHop, không để nguyên mã lỗi", async () => {
  const m = moiTruong({ hash: lienKet(), tra: () => ({ ok: true, json: async () => ({ loi: "may-chu" }) }) });
  await assert.rejects(taoNguon(m.env).layGioHang(), /tab phải tên đúng GiaTongHop/);
});
