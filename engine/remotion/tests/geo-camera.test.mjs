import test from "node:test";
import assert from "node:assert/strict";
import { fitCam, projectLngLat, shiftCenter } from "../src/geoCamera.ts";

const W = 1080;
const H = 1920;
const coords = [[106.84, 10.96], [106.90, 10.96], [106.90, 10.90], [106.84, 10.90]];

test("fitCam: mọi điểm nằm trong vùng trống sau khi trừ lề", () => {
  const pad = { top: 800, bottom: 440, left: 90, right: 90 };
  const cam = fitCam(coords, pad, 16, W, H);
  for (const [lng, lat] of coords) {
    const [x, y] = projectLngLat(lng, lat, cam, W, H);
    assert.ok(x >= pad.left - 1 && x <= W - pad.right + 1, `x=${x}`);
    assert.ok(y >= pad.top - 1 && y <= H - pad.bottom + 1, `y=${y}`);
  }
});

test("fitCam: bị chặn bởi maxZoom với vùng nhỏ", () => {
  const cam = fitCam([[106.85, 10.92], [106.8501, 10.9201]], 100, 14.5, W, H);
  assert.equal(cam.zoom, 14.5);
});

test("shiftCenter: điểm hiện cao hơn tâm màn hình đúng dy px", () => {
  const pt = [106.844, 10.96];
  const zoom = 14.6;
  const center = shiftCenter(pt, zoom, 200);
  const [, y] = projectLngLat(pt[0], pt[1], { center, zoom }, W, H);
  assert.ok(Math.abs(y - (H / 2 - 200)) < 0.5, `y=${y}`);
});
