# Bcons Video Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến video Remotion cố định thành hệ thống spec + mẫu cảnh có schema, có cổng chặn nguồn/duyệt, và lệnh `/bcons-video [chủ đề]`.

**Architecture:** Schema zod trong `src/spec.ts` là nguồn chuẩn. Mỗi video là `specs/<name>.json` (+ `<name>.timestamps.json`, `public/audio/<name>/`). Một composition `BconsCentralPark` nhận spec qua `--props` và `calculateMetadata`. Script kiểm tra nguồn và trạng thái `approved` chặn tạo giọng/render.

**Tech Stack:** Remotion 4.0.540, React 19, TypeScript 5.9, zod (phiên bản theo tài liệu Remotion 4.0.540), Node 24 (`node --test`), ElevenLabs.

**Spec:** `docs/superpowers/specs/2026-11-04-bcons-video-pipeline-design.md`

## Global Constraints
- Làm trong `remotion-video/`, nhánh `claude/trusting-feynman-1b00ns`. Không tạo PR. Không commit giữa chừng: CLAUDE.md quy định commit/push ở lệnh "Off".
- Không gọi ElevenLabs trong toàn bộ kế hoạch này (video cũ dùng lại mp3 hiện có; spec thử là `draft`).
- Không commit `.env`, `data/`, `*.xlsx`, `*.mp4`. Không số điện thoại/tên cá nhân ở cảnh cuối.
- Giữ composition id `BconsCentralPark`, 1080x1920, 30fps, giọng/model/seed trong `generate-voice.mjs`.
- Cú pháp lời bình `hiển-thị{đọc}` và `parseMarkup` giữ nguyên.
- `npm run lint` (`eslint src && tsc`) phải qua sau mỗi task chạm `src/`.
- Số trong spec mẫu `draft` phải ghi rõ "SỐ MẪU, KHÔNG ĐĂNG".

## Review Focus
1. Spec có `sourceId` không có trong bảng nguồn → check báo lỗi, tên id sai được nêu rõ.
2. Spec `draft` chạy `generate-voice`/`render:drive` → thoát mã khác 0, không gọi mạng.
3. Tên spec không tồn tại hoặc chứa `..` → báo lỗi rõ, không ghi file ngoài thư mục.
4. `cues` trỏ chữ không có trong timestamp → lỗi nêu cảnh và chữ (như `cueFrame` hiện tại).
5. Video cũ sau refactor phải ra khung hình giống hệt bản mốc.

## File Structure
- Create `remotion-video/src/spec.ts`: zod schema + kiểu `VideoSpec`, `loadSpec` logic thuần (không phụ thuộc React).
- Create `remotion-video/scripts/spec-tools.mjs`: `checkSources`, `assertApproved`, `resolveSpecPath` (dùng chung cho script).
- Create `remotion-video/scripts/check-spec.mjs`: CLI `node scripts/check-spec.mjs <name>`.
- Create `remotion-video/src/templates/{StatHero,RouteMap,DataCards,ProjectClose,CompareBars}.tsx`: mỗi mẫu một file.
- Modify `remotion-video/src/{BconsVideo.tsx,Root.tsx,timing.ts}`; `scripts/{generate-voice.mjs,render-drive.mjs}`; `package.json`.
- Create `remotion-video/specs/dong-nai-ha-tang.json`, `.timestamps.json`, `specs/mau-lai-suat.json`; `docs/video/dong-nai-ha-tang.md`, `docs/video/mau-lai-suat.md`.
- Delete `scripts/scenes.mjs`, `src/audio-timestamps.json` sau khi chuyển (Task 3).
- Create `.claude/commands/bcons-video.md`, `docs/prompt-gemini-nghien-cuu.md`; modify `docs/quy-trinh-video.md`, `CLAUDE.md`, `NOTES.md`.
- Tests: `remotion-video/tests/*.test.mjs` (`node --test tests/`).

---

### Task 1: Ảnh mốc của video hiện tại
**Files:** Create `remotion-video/out/baseline/*.png` (thư mục `out/` đã gitignore); Create `remotion-video/scripts/frame-hashes.mjs`.

**Interfaces:**
- Produces: `node scripts/frame-hashes.mjs <outDir>` in ra JSON `{ "<frame>": "<sha256>" }` của các PNG trong thư mục; frame mẫu cố định `[20, 110, 200, 420, 700, 1000, last]` với `last = TOTAL_FRAMES-1`. Dùng ở Task 4.

- [ ] **Step 1:** Trước khi sửa bất kỳ file nào, chạy `npx remotion still BconsCentralPark out/baseline/f<frame>.png --frame=<frame>` cho 7 frame trên (frame cuối lấy từ `TOTAL_FRAMES` hiện tại).
- [ ] **Step 2:** Viết `frame-hashes.mjs` (đọc thư mục, sha256 từng file, in JSON). Lưu kết quả mốc ra `out/baseline/hashes.json`.
- [ ] **Step 3:** Chạy lại lần hai cho 1 frame, xác nhận hash giống lần đầu (render có tất định). Nếu không, ghi lại và đổi phép so sánh sang ngưỡng sai khác điểm ảnh ở Task 4.

### Task 2: Schema spec
**Files:** Create `src/spec.ts`; Test `tests/spec.test.mjs`; Modify `package.json` (thêm zod).

**Interfaces:**
- Produces: `export const SceneSchema`, `export const VideoSpecSchema`, `export type VideoSpec`, `export function parseSpec(json: unknown): VideoSpec` (ném lỗi nêu đường dẫn trường sai).
- Dạng spec: `{ name: string, status: "draft"|"approved", scenes: Scene[] }`; `Scene = { id, template, markup, cues: Record<string,string>, props }` với `template` là một trong `stat-hero | route-map | data-cards | compare-bars | project-close`, `props` có kiểu riêng theo template (discriminated union). Mọi trường giá trị số mang `sourceId: string` (trừ `project-close`).
- `stat-hero.props`: `{ badge, titleLines: string[], cardLabel, prefix?, value: number, decimals: number, unit, sourceId }`.
- `route-map.props`: `{ kicker, title, nodes: {key,label,x,y,color:"white"|"gold"|"red",big?,labelDx?,labelDy?,anchor?}[], highway: {fromKey,viaKey,toKey}, infoTitle, infoText, note, sourceId }`.
- `data-cards.props`: `{ kicker, title, cards: {tag,big,sub,cueKey,sourceId}[] }` (2 đến 3 thẻ).
- `compare-bars.props`: `{ kicker, title, unit, bars: {label,value:number,cueKey,sourceId}[] }` (2 đến 4 cột).
- `project-close.props`: `{ message: string }` (tên dự án/địa chỉ cố định trong mẫu).

- [ ] **Step 1:** Cài zod đúng phiên bản tài liệu Remotion 4.0.540 yêu cầu (`@remotion/zod-types` nếu tài liệu đòi); ghi phiên bản đã chọn vào commit note của Off.
- [ ] **Step 2: Viết test (fail trước)** trong `tests/spec.test.mjs`: (a) spec hợp lệ tối thiểu parse thành công; (b) `template: "foo"` ném lỗi; (c) `data-cards` thiếu `sourceId` ở một thẻ ném lỗi nêu `scenes.0.props.cards.0.sourceId`; (d) `status: "ok"` ném lỗi; (e) `data-cards` 4 thẻ ném lỗi. Chạy `node --test tests/spec.test.mjs`, kỳ vọng FAIL (chưa có `spec.ts`).
- [ ] **Step 3:** Cài `src/spec.ts` theo Interfaces (chỉ cú pháp TS xóa được, để Node 24 import trực tiếp; thêm `allowImportingTsExtensions` nếu `tsc` đòi).
- [ ] **Step 4:** Chạy test, kỳ vọng PASS; chạy `npm run lint`, kỳ vọng không lỗi.

### Task 3: Công cụ kiểm tra nguồn và cổng duyệt
**Files:** Create `scripts/spec-tools.mjs`, `scripts/check-spec.mjs`; Test `tests/spec-tools.test.mjs`; Modify `package.json` (script `check:spec`, và `lint` chạy thêm kiểm tra mọi spec).

**Interfaces:**
- Produces: `resolveSpecPath(name: string): string` (chỉ nhận `^[a-z0-9-]+$`, ngược lại ném lỗi); `readSourceIds(markdown: string): string[]` (đọc bảng nguồn Markdown trong `docs/video/<name>.md`: cột đầu là id, nằm dưới tiêu đề `## Bảng nguồn`); `collectSourceIds(spec: VideoSpec): string[]`; `checkSources(spec, mdText): { ok: boolean, missing: string[] }`; `assertApproved(spec): void` (ném lỗi "Spec <name> còn ở trạng thái draft" nếu không `approved`).

- [ ] **Step 1: Test (fail trước):** `resolveSpecPath("../x")` ném lỗi; `resolveSpecPath("dong-nai-ha-tang")` kết thúc bằng `specs/dong-nai-ha-tang.json`; `checkSources` trả `missing: ["s9"]` khi spec dùng `s9` mà bảng chỉ có `s1`,`s2`; `assertApproved` ném lỗi với `draft`, không ném với `approved`.
- [ ] **Step 2:** Cài các hàm trên trong `spec-tools.mjs`; `check-spec.mjs <name>` đọc spec + `docs/video/<name>.md`, in danh sách id thiếu, thoát mã 1 nếu thiếu. Quy ước: hàng bảng nguồn thiếu link chỉ cảnh báo, không lỗi.
- [ ] **Step 3:** `npm run lint` chạy thêm `node scripts/check-spec.mjs` cho mọi file trong `specs/` có `.json` không phải `.timestamps.json`.
- [ ] **Step 4:** Chạy `node --test tests/`, kỳ vọng PASS.

### Task 4: Mẫu cảnh và composition nhận spec (video cũ giống hệt)
**Files:** Create `src/templates/*.tsx` (4 mẫu có sẵn, chưa gồm CompareBars), `specs/dong-nai-ha-tang.json`, `specs/dong-nai-ha-tang.timestamps.json`, `docs/video/dong-nai-ha-tang.md`, `public/audio/dong-nai-ha-tang/scene{1-4}.mp3`; Modify `src/BconsVideo.tsx`, `src/Root.tsx`, `src/timing.ts`; Delete `scripts/scenes.mjs` (sau Task 5), `src/audio-timestamps.json`, `public/audio/scene*.mp3`.

**Interfaces:**
- Consumes: `VideoSpec` (Task 2).
- Produces: `calculateMetadata` trả `durationInFrames` từ timestamp của spec; `timing.ts` xuất `buildTiming(timestamps): { SCENE_DATA, SCENE_STARTS, TOTAL_FRAMES }` và `cueFrame(sceneData, sceneIndex, text)`; mỗi mẫu là `React.FC<{ props, cue: (key: string) => number, frames: number }>` với `cue(key)` trả frame tương đối theo `cues[key]` của cảnh.

- [ ] **Step 1:** Tạo spec `dong-nai-ha-tang` từ code hiện tại: chép nguyên văn `markup` 4 cảnh từ `scenes.mjs`; `cues` giữ đúng chữ đang dùng (`2,4`, `cao`, `ngày`, `kết`, `quy`, `thu`, `đào`); các chuỗi, số, tọa độ nút, màu lấy y hệt từ `BconsVideo.tsx`. `status: "approved"`.
- [ ] **Step 2:** Chuyển `audio-timestamps.json` thành `specs/dong-nai-ha-tang.timestamps.json` và mp3 vào `public/audio/dong-nai-ha-tang/` (dùng `git mv`).
- [ ] **Step 3:** Tạo `docs/video/dong-nai-ha-tang.md` có `## Bảng nguồn` với id cho từng số (FDI 2,4 tỷ USD; 01/10/2026; 8.200 ha; 16 tỷ USD; 150.000; 50.000). Cột link ghi "chưa có link (video cũ)". Không bịa link; hỏi anh bổ sung nguồn gốc.
- [ ] **Step 4:** Tách `Scene1..4` thành 4 file mẫu dùng props; hằng số cứng chuyển vào spec; nút bản đồ vẽ từ `nodes`, đường cao tốc từ `highway`. Giữ nguyên mọi thông số hoạt họa.
- [ ] **Step 5:** `Root.tsx`: `<Composition ... schema={...} defaultProps={spec dong-nai-ha-tang} calculateMetadata>`; `BconsVideo` nhận `{ spec, timestamps }`; âm thanh lấy `audio/${spec.name}/${id}.mp3`.
- [ ] **Step 6: Verification:** `npm run lint` pass. Render lại 7 frame vào `out/after/`, chạy `frame-hashes.mjs` cho cả hai thư mục, kỳ vọng hash giống nhau. Nếu khác ở chỗ chỉ do mã hóa, so sai khác điểm ảnh bằng 0 trên vùng khác biệt; nếu khác thật, sửa mẫu cho tới khi giống.

### Task 5: generate-voice và render-drive theo spec + cổng chặn
**Files:** Modify `scripts/generate-voice.mjs`, `scripts/render-drive.mjs`, `package.json`; Test `tests/gates.test.mjs`.

**Interfaces:**
- Consumes: `resolveSpecPath`, `assertApproved`, `checkSources` (Task 3), `parseMarkup` (chuyển vào `spec-tools.mjs` hoặc `spec.ts`, không còn ở `scenes.mjs`).
- Produces: `node --env-file=.env scripts/generate-voice.mjs <name> [--model=<id>]`; `npm run render:drive -- <name> [file.mp4]`. Cả hai gọi `assertApproved` và `checkSources` **trước khi** đọc `ELEVENLABS_API_KEY` hoặc chạy render. Hàm `prepareRun(name): { spec, specPath }` trong `spec-tools.mjs` gom các kiểm tra này.

- [ ] **Step 1: Test (fail trước):** với spec `draft` tạm trong thư mục tạm, `prepareRun` ném lỗi chứa "draft" và không có lời gọi `fetch` (stub `globalThis.fetch` đếm lệnh gọi = 0); với `sourceId` thiếu, ném lỗi chứa id thiếu.
- [ ] **Step 2:** Cài `prepareRun`; sửa `generate-voice.mjs` đọc `markup` từ spec, ghi mp3 vào `public/audio/<name>/` và timestamp vào `specs/<name>.timestamps.json`; sửa `render-drive.mjs` truyền `--props=specs/<name>.json` kèm timestamp, tên file mp4 mặc định `<name>.mp4`.
- [ ] **Step 3:** Xóa `scripts/scenes.mjs`; `voice-variants.mjs` (công cụ thử giọng cũ) sửa để đọc cảnh từ spec `dong-nai-ha-tang` hoặc xóa nếu không còn dùng, báo anh.
- [ ] **Step 4:** Chạy `node --test tests/` PASS; chạy `node --env-file=.env scripts/generate-voice.mjs mau-lai-suat` sau Task 6 để thấy bị chặn (không tốn credit).

### Task 6: Mẫu `compare-bars` và spec thử lãi suất
**Files:** Create `src/templates/CompareBars.tsx`, `specs/mau-lai-suat.json`, `docs/video/mau-lai-suat.md`; Modify `src/BconsVideo.tsx` (đăng ký mẫu).

**Interfaces:** Consumes mẫu theo Task 4. Produces: `CompareBars: React.FC<TemplateProps<"compare-bars">>`; cột tăng chiều cao theo `cue(bar.cueKey)`.

- [ ] **Step 1:** Cài `CompareBars` theo phong cách `DataCard`/`theme.ts` (cột tỉ lệ theo giá trị lớn nhất, nhãn và số hiển thị dấu phẩy Việt Nam).
- [ ] **Step 2:** Tạo `mau-lai-suat.json`: 4 cảnh (hook `stat-hero`, `compare-bars`, `data-cards`, `project-close`), `status: "draft"`, mọi số là "SỐ MẪU, KHÔNG ĐĂNG" và nằm trong bảng nguồn mẫu cùng tên.
- [ ] **Step 3: Verification:** dựng timestamp giả cục bộ cho spec thử (file thử chỉ nằm trong `out/`, không ghi vào `specs/`), chạy `npx remotion still` vài frame, mở xem bố cục; `npm run lint` pass; `generate-voice.mjs mau-lai-suat` thoát lỗi `draft`.

### Task 7: Lệnh `/bcons-video`, prompt Gemini, cập nhật tài liệu
**Files:** Create `.claude/commands/bcons-video.md`, `docs/prompt-gemini-nghien-cuu.md`; Modify `docs/quy-trinh-video.md`, `CLAUDE.md`, `NOTES.md`.

- [ ] **Step 1:** Viết `.claude/commands/bcons-video.md` (tiếng Việt, dùng `$ARGUMENTS`): 4 cổng theo mục 5.2 của spec; suy giai đoạn từ file trên đĩa; đề xuất slug ở cổng 1; chỉ đặt `status: "approved"` khi anh nói đã duyệt; cổng 3 hỏi anh đồng ý tốn credit rồi mới chạy `generate-voice.mjs <name>`; cổng 4 chạy `npm run lint` rồi `npm run render:drive -- <name>`; nhắc quy tắc CLAUDE.md (VAT/bảo trì 2%, 2.820 căn ở + 113 căn thương mại, CĐT LOCK, không cam kết lợi nhuận, cảnh cuối không số điện thoại).
- [ ] **Step 2:** Viết `docs/prompt-gemini-nghien-cuu.md` từ Bản 1: bỏ "~2.800 căn", "tiết kiệm 60%", CTA điện thoại, Trụ cột 4; giữ bảng 5 cột gốc và yêu cầu ngày + link gốc; có chỗ `[KHOẢNG THỜI GIAN]` và `[CHỦ ĐỀ]`.
- [ ] **Step 3:** Cập nhật `quy-trinh-video.md` (bỏ "sửa scenes.mjs", mô tả spec + cổng + lệnh), `CLAUDE.md` mục "Quy ước làm việc" (đổi chỗ nhắc `scripts/scenes.mjs` sang `specs/<name>.json` và lệnh tạo giọng mới), `NOTES.md` (việc đã làm/chưa làm: bổ sung link nguồn video cũ).
- [ ] **Step 4: Verification:** chạy thử `/bcons-video lãi suất vay mua nhà` trong phiên mới đến hết cổng 1 và cổng 2; xác nhận lệnh dừng ở mỗi cổng, không tạo giọng, không sửa `status` thành `approved`.

### Task 8: Kiểm tra cuối
- [ ] `npm run lint` và `node --test tests/` pass; `git status` không có `.env`, `data/`, `*.xlsx`, `*.mp4`, `node_modules`.
- [ ] Render đầy đủ `dong-nai-ha-tang` ra `out/` (không chép lên Drive) và xác nhận chạy hết, thời lượng bằng `TOTAL_FRAMES`.
- [ ] Báo anh: những gì đã chạy thật, chưa chạy (ElevenLabs, `/bcons-video` trọn vòng với số thật), và link nguồn video cũ còn thiếu.
