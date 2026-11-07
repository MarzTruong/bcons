> **Trạng thái:** Đã xong 05/11/2026 (lịch sử, đường dẫn cũ).

# Bản đồ Mapbox cho video (mẫu cảnh `geo-map`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (anh đã chọn tự làm trong phiên). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Thêm mẫu cảnh `geo-map` dựng bản đồ Mapbox thật (thả điểm, vẽ tuyến, vẽ ranh giới) cho các cảnh có thông tin địa lý, có nguồn dữ liệu địa lý ghi rõ.

**Architecture:** Mapbox GL JS vẽ nền; điểm/tuyến/vùng là lớp GeoJSON do spec khai báo, tải từ file tĩnh `public/geo/*.geojson` (đã lưu cùng nguồn và ngày). Camera đứng yên theo từng cảnh; hoạt họa chỉ là `setData` tuyến cắt dần (Turf) và độ mờ vùng, theo `cues`. Token Mapbox đọc từ `.env`.

**Tech Stack:** Remotion 4.0.540, `mapbox-gl`, `@turf/turf`, zod 4, Node 24, `--gl=angle`.

**Spec:** `docs/superpowers/specs/2026-11-04-bcons-video-pipeline-design.md` (mục 5.1) và đề xuất bản đồ trong hội thoại 04/11/2026 (anh chọn Mapbox, có token).

## Global Constraints
- Token chỉ ở `remotion-video/.env` biến `MAPBOX_TOKEN_KEY` (anh đã có); không in token ra màn hình, không ghi vào spec/props/git/log. Biến cho bundle: `REMOTION_MAPBOX_TOKEN` (map từ `MAPBOX_TOKEN_KEY` bởi script, không sửa `.env` của anh).
- Mỗi tọa độ, tuyến, ranh giới có `sourceId` trong bảng nguồn + ghi nguồn/ngày/giấy phép trong `docs/video/geo-nguon.md`. Dữ liệu OpenStreetMap: ODbL, phải hiện chú thích "© Mapbox © OpenStreetMap" trên màn hình.
- Không vẽ ranh giới giả cho giống thật: vùng chưa có dữ liệu chính thức (khu thương mại tự do Long Thành) chỉ là vùng minh họa (`kind: "illustrative"`), nét đứt, ghi "Vùng minh họa, không đúng ranh giới".
- Video cũ `dong-nai-ha-tang` giữ nguyên làm mốc; bản dùng bản đồ là spec mới `dong-nai-ha-tang-map` (sao chép mp3 + timestamp, lời bình y hệt, không tốn credit).
- Không gọi ElevenLabs. Không commit giữa chừng (CLAUDE.md: commit ở lệnh "Off").
- Render bản đồ: `--gl=angle --concurrency=1`. Camera tĩnh; chỉ thêm camera động sau khi render thử không rung.

## Review Focus
1. Thiếu `REMOTION_MAPBOX_TOKEN` → lỗi tiếng Việt rõ, không crash khó hiểu; token không lọt vào file nào do ta ghi.
2. Chú thích nguồn bản đồ luôn hiện (cả khi cảnh chưa có điểm nào).
3. Tuyến/vùng tham chiếu file GeoJSON không có hoặc sai tọa độ `[lng, lat]` → lỗi nêu tên lớp.
4. Mạng/Mapbox lỗi lúc render → render thất bại rõ ràng, không ra video bản đồ trống.
5. `sourceId` của mọi lớp địa lý phải có trong bảng nguồn và có link.

## File Structure
- Create `remotion-video/scripts/env.mjs` (nạp `.env`, map token), `scripts/check-mapbox.mjs`, `scripts/fetch-geo.mjs`.
- Create `remotion-video/public/geo/*.geojson`, `docs/video/geo-nguon.md`.
- Modify `remotion-video/src/spec.ts` (+`GeoMapProps`), `scripts/spec-tools.mjs` (`cueKeysOf` + kiểm file geo), `src/BconsVideo.tsx`, `package.json`, `scripts/render-drive.mjs`.
- Create `remotion-video/src/templates/GeoMap.tsx`, `specs/dong-nai-ha-tang-map.json` (+`.timestamps.json`, `public/audio/dong-nai-ha-tang-map/`), `docs/video/dong-nai-ha-tang-map.md`.
- Tests: `tests/geo-spec.test.mjs`.

---

### Task 1: Token và công cụ môi trường
**Files:** Create `scripts/env.mjs`, `scripts/check-mapbox.mjs`; Modify `package.json`, `scripts/render-drive.mjs`; Test `tests/env.test.mjs`.

**Interfaces:**
- Produces: `loadMapboxEnv(): string` trong `env.mjs` — nạp `.env`, đặt `process.env.REMOTION_MAPBOX_TOKEN = MAPBOX_TOKEN_KEY` và trả token; ném `Error("Thiếu MAPBOX_TOKEN_KEY trong remotion-video/.env")` nếu thiếu (không in giá trị). `npm run check:mapbox` gọi API styles của Mapbox, in `OK (200)` hoặc mã lỗi, không in token. Script `with-env` (`node scripts/with-env.mjs <lệnh...>`) nạp env rồi chạy lệnh; `dev`/`still` dùng nó.
- [ ] Test (fail trước): `loadMapboxEnv` với env tạm thiếu khóa ném lỗi chứa "MAPBOX_TOKEN_KEY" và không chứa giá trị khác; có khóa thì đặt `REMOTION_MAPBOX_TOKEN`.
- [ ] Cài `env.mjs`, `check-mapbox.mjs`, `with-env.mjs`; render-drive gọi `loadMapboxEnv()` khi spec có cảnh `geo-map`.
- [ ] Chạy `npm run check:mapbox` → `OK (200)`; `npm test` pass.

### Task 2: Dữ liệu địa lý có nguồn
**Files:** Create `scripts/fetch-geo.mjs`, `public/geo/*.geojson`, `docs/video/geo-nguon.md`.

**Interfaces:** Produces các file GeoJSON (`[lng, lat]`): `cao-toc-ben-luc-long-thanh.geojson` (LineString), `diem-moc.geojson` (Point: Bến Lức, Cảng Phước An, Sân bay Long Thành, Bcons Central Park 236 Phan Trung), `ranh-bien-hoa.geojson` (Polygon hành chính), `vung-minh-hoa-ktmtd.geojson` (Polygon minh họa, `properties.kind = "illustrative"`).
- [ ] `fetch-geo.mjs`: tải từ OpenStreetMap (Overpass, có `User-Agent`, thử lại lùi dần) và Mapbox Geocoding cho điểm; ghi file + `properties.source`, `properties.fetchedAt`; ngày lấy và giấy phép ghi vào `geo-nguon.md`.
- [ ] Kiểm: mọi tọa độ nằm trong vùng 10.2–11.1°N, 106.2–107.3°E; tuyến cao tốc nối Bến Lức → Long Thành liền mạch; điểm Bcons Central Park nằm trong ranh Biên Hòa.
- [ ] Ghi bảng nguồn địa lý (id, mô tả, ngày lấy, nguồn, link) trong `geo-nguon.md`; nếu Overpass bận, ghi rõ phần chưa lấy được, không tự bịa tọa độ.

### Task 3: Schema `geo-map` và kiểm tra
**Files:** Modify `src/spec.ts`, `scripts/spec-tools.mjs`; Test `tests/geo-spec.test.mjs`.

**Interfaces:**
- Produces trong `spec.ts`: `GeoMapProps = { kicker, title, mapStyle: string ("mapbox://styles/mapbox/...") , camera: { center: [number, number], zoom: number }, points: {key,label,file,featureName,color:"white"|"gold"|"red",big?,cueKey,offset:number,sourceId}[], lines: {key,file,color,width?,cueKey,drawFrames:number,sourceId}[], areas: {key,file,kind:"official"|"illustrative",label,cueKey,sourceId}[], note: string }`; template mới `"geo-map"` trong `SceneSchema`.
- `checkCues` hiểu `geo-map` (mọi `cueKey` của points/lines/areas).
- Thêm `checkGeoFiles(spec, publicDir)`: mọi `file` tồn tại, là GeoJSON hợp lệ, tọa độ `[lng, lat]` trong biên Việt Nam; gọi trong `check-spec.mjs`.
- [ ] Test (fail trước): spec `geo-map` hợp lệ parse được; thiếu `sourceId` báo đúng đường dẫn; `areas` với `kind` lạ bị từ chối; `checkGeoFiles` bắt file thiếu và tọa độ đảo `[lat, lng]`; `checkCues` bắt `cueKey` thiếu của `geo-map`.
- [ ] Cài schema và các hàm; `npm test`, `npm run lint` pass.

### Task 4: Mẫu `GeoMap.tsx`
**Files:** Create `src/templates/GeoMap.tsx`; Modify `src/BconsVideo.tsx` (đăng ký mẫu).

**Interfaces:** Consumes `TemplateProps<"geo-map">` (`common.tsx`). Produces `GeoMap: React.FC<TemplateProps<"geo-map">>`.
- [ ] Theo `techniques/mapbox/TECHNIQUE.md`: `interactive:false`, `fadeDuration:0`, `preserveDrawingBuffer`, `delayRender`/`continueRender` quanh tải bản đồ và từng khung, khung 0 chuẩn bị trước `idle`; không gọi `map.remove()`.
- [ ] Lớp: điểm = circle + symbol (xuất hiện lúc `cue(cueKey)+offset`), tuyến = `lineSliceAlong` theo `drawFrames`, vùng `official` tô nhạt viền liền, vùng `illustrative` viền đứt + nhãn "Vùng minh họa, không đúng ranh giới". Chú thích "© Mapbox © OpenStreetMap" luôn hiện. Thiếu token → ném lỗi tiếng Việt.
- [ ] Verification: `npx remotion still` ở 3 khung (đầu, giữa, cuối cảnh) với `--gl=angle`, mở ảnh xem điểm/tuyến/ranh/chú thích đúng chỗ.

### Task 5: Spec `dong-nai-ha-tang-map`
**Files:** Create `specs/dong-nai-ha-tang-map.json`, `specs/dong-nai-ha-tang-map.timestamps.json`, `public/audio/dong-nai-ha-tang-map/*.mp3`, `docs/video/dong-nai-ha-tang-map.md`.
- [ ] Sao chép spec cũ; thay cảnh 2 (`route-map`) bằng `geo-map` (điểm Bến Lức, Cảng Phước An, Sân bay Long Thành, Bcons Central Park; tuyến cao tốc; ranh Biên Hòa); cảnh 3 giữ `data-cards` (có thể thêm bản đồ nhỏ ở bước sau nếu anh muốn). `cues` bám chữ trong `markup`, lời bình giữ nguyên. Sao chép mp3/timestamp, bảng nguồn (kế thừa link Facebook + dòng địa lý trỏ `geo-nguon.md`).
- [ ] `npm run lint`, `npm test` pass; render đủ video ra `out/` (không chép Drive), xem khung hình cảnh 2 và 1 đoạn ngắn kiểm rung.

### Task 6: Tài liệu và kiểm tra cuối
**Files:** Modify `.claude/commands/bcons-video.md`, `docs/quy-trinh-video.md`, `NOTES.md`.
- [ ] Thêm mẫu `geo-map`, `npm run check:mapbox`, quy tắc dữ liệu địa lý/minh họa/chú thích vào lệnh và quy trình; cập nhật NOTES (đã làm, chưa làm).
- [ ] `git status`: không có `.env`, token, `*.mp4`, `node_modules`. Chạy lại `npm run lint` và `npm test`, nêu kết quả thật.
