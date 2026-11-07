import test from "node:test";
import assert from "node:assert/strict";
import { enterStyle, transitionStyle, MOTIONS } from "../src/motion.ts";
import { STYLE_NAMES, MOTION_NAMES } from "../src/spec.ts";

// "classic" phải y hệt công thức gốc của các mẫu cảnh (video cũ không được đổi).
test("enter classic giữ đúng công thức gốc", () => {
  assert.deepEqual(enterStyle("classic", 0.3, "up", 60), { opacity: 0.3, transform: `translateY(${(1 - 0.3) * 60}px)` });
  assert.deepEqual(enterStyle("classic", 0.5, "right", 300), { opacity: 0.5, transform: `translateX(${(1 - 0.5) * 300}px)` });
  assert.deepEqual(enterStyle("classic", 0.5, "scale", 0), { opacity: 0.5, transform: `scale(${0.8 + 0.2 * 0.5})` });
});

test("enter slide: vào từ bên trái, riêng hướng right giữ nguyên", () => {
  assert.match(enterStyle("slide", 0, "up", 60).transform, /translateX\(-90px\)/);
  assert.equal(enterStyle("slide", 0.5, "right", 300).transform, "translateX(150px)");
});
test("enter pop: phóng to từ nhỏ, có xoay nhẹ", () => {
  const s = enterStyle("pop", 0, "up", 60);
  assert.match(s.transform, /scale\(0\.6\)/);
  assert.match(s.transform, /rotate\(/);
});
test("enter blur: xong là rõ nét", () => {
  assert.equal(enterStyle("blur", 1, "up", 60).filter, "blur(0px)");
  assert.equal(enterStyle("blur", 0, "up", 60).filter, "blur(14px)");
});

test("transition fade = công thức gốc (0,10,d-10,d)", () => {
  const d = 100;
  const orig = (f) => {
    if (f <= 10) return f / 10;
    if (f >= d - 10) return (d - f) / 10;
    return 1;
  };
  for (const f of [0, 5, 10, 50, 90, 95, 100]) {
    assert.equal(transitionStyle("fade", f, d).opacity, orig(f), `frame ${f}`);
  }
});
test("transition slide: vào từ phải, ra sang trái", () => {
  assert.equal(transitionStyle("slide", 0, 100).transform, "translateX(100%)");
  assert.equal(transitionStyle("slide", 50, 100).transform, "translateX(0%)");
  assert.equal(transitionStyle("slide", 100, 100).transform, "translateX(-100%)");
});
test("transition zoom: mờ và lớn lúc vào, mờ và nhỏ lúc ra", () => {
  const a = transitionStyle("zoom", 0, 100);
  assert.equal(a.opacity, 0);
  assert.match(a.transform, /scale\(1\.15\)/);
  assert.equal(transitionStyle("zoom", 50, 100).opacity, 1);
  assert.equal(transitionStyle("zoom", 100, 100).opacity, 0);
});
test("transition wipe: quét kín rồi mở hết", () => {
  assert.equal(transitionStyle("wipe", 0, 100).clipPath, "inset(0 100% 0 0%)");
  assert.equal(transitionStyle("wipe", 50, 100).clipPath, "inset(0 0% 0 0%)");
  assert.equal(transitionStyle("wipe", 100, 100).clipPath, "inset(0 0% 0 100%)");
});

test("mọi tên motion trong spec đều có định nghĩa", () => {
  for (const n of MOTION_NAMES) {
    assert.ok(MOTIONS[n].transitions.length >= 1, n);
  }
  assert.ok(STYLE_NAMES.length >= 4);
});

test("phong cách bản vẽ (anh chọn 07/11/2026): style banve + motion ve (nền lưới bản vẽ, nét vẽ dần)", async () => {
  assert.ok(STYLE_NAMES.includes("banve"));
  assert.ok(MOTION_NAMES.includes("ve"));
  assert.equal(MOTIONS.ve.background, "blueprint");
  const { penDraw } = await import("../src/templates/banveGeo.ts");
  assert.equal(penDraw(0, 10, 20, 500), 500, "chưa tới lúc vẽ: nét ẩn hết (dashoffset = độ dài)");
  assert.equal(penDraw(40, 10, 20, 500), 0, "vẽ xong: hiện đủ");
  const mid = penDraw(20, 10, 20, 500);
  assert.ok(mid > 0 && mid < 500);
});
