# Kế hoạch 01: Cấu trúc thư mục theo dự án

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dời repo sang cấu trúc `engine/` (code dùng chung) + `du-an/<mã>/` (nội dung từng dự án), mỗi video một thư mục, mà video render ra **giống hệt** trước khi dời.

**Architecture:** Một module `engine/remotion/scripts/project.mjs` là nơi duy nhất biết đường dẫn dự án/video; mọi script và lệnh đọc qua nó. Thư mục `public` của Remotion trỏ vào `du-an/<mã>/`, nên đường dẫn tĩnh trong spec đổi từ `geo/...`, `images/...`, `audio/<tên>/...` sang `assets/geo/...`, `assets/images/...`, `video/<tên>/audio/...`. Việc dời làm bằng script có bảng ánh xạ, chạy thử trước, dùng `git mv` cho file có trong git và `fs.rename` cho file chỉ có trên máy anh.

**Tech Stack:** Node ≥ 22.18 (`node --test`, type stripping), Remotion 4.0.540, git.

**Spec:** `docs/superpowers/specs/2026-11-05-bcons-automation-pipeline-design.md` (mục 5.3, 5.4)

## Global Constraints
- Mã dự án: `bcons-central-park`. Mã và tên video chỉ nhận `^[a-z0-9-]+$`.
- `config.json` ở gốc: `{ "duAnDangBan": "bcons-central-park" }`.
- Lệnh cũ vẫn chạy với tên video như trước: `npm run render:drive -- <tên>`, `npm run voice -- <tên>`, `npm run lint`, `npm test`. Thêm cờ tùy chọn `--du-an <mã>`; không có cờ thì lấy `config.json`.
- Cổng chặn giữ nguyên hành vi: spec `draft`, thiếu `sourceId` trong bảng nguồn, thiếu link, cue sai, file địa lý thiếu → từ chối, chạy **trước** khi đọc API key.
- Composition `BconsCentralPark`, 30fps, 1080x1920 không đổi.
- Không commit `.env`, `data/`, `anh/`, `*.xlsx`, `*.mp4`, `out/`, `node_modules/`.
- Commit dời file là một commit riêng, chỉ chứa việc dời + sửa đường dẫn (để `git log --follow` còn lịch sử).

## Bảng ánh xạ (nguồn chuẩn cho Task 2)
| Cũ | Mới |
|---|---|
| `remotion-video/` (trừ 3 dòng dưới) | `engine/remotion/` |
| `remotion-video/specs/<tên>.json` | `du-an/bcons-central-park/video/<tên>/spec.json` |
| `remotion-video/specs/<tên>.timestamps.json` | `.../video/<tên>/timestamps.json` |
| `remotion-video/public/audio/<tên>/` | `.../video/<tên>/audio/` |
| `remotion-video/public/geo/` | `du-an/bcons-central-park/assets/geo/` |
| `remotion-video/public/images/` | `.../assets/images/` |
| `docs/video/<tên>.md` | `.../video/<tên>/kich-ban.md` |
| `docs/video/<tên>-storyboard.md` | `.../video/<tên>/storyboard.md` |
| `docs/video/dot-2.md` | `.../video/dot-2/kich-ban.md` (chưa có spec) |
| `docs/video/flycam.md` | `.../assets/flycam.md` |
| `docs/video/geo-nguon.md` | `.../assets/geo/NGUON.md` |
| `map/` | `.../assets/geo/osm-xuat/` |
| `Gemini Deep Research/` | `.../nguon/gemini/` |
| `docs/bcons-central-park.md` | `.../thong-tin.md` |
| `docs/content/doi-chieu-nguon-gia-tri-du-an.md` | `.../nguon/doi-chieu-gia-tri-du-an.md` |
| `docs/content/*` (còn lại) | `.../content/` |
| `tools/draw_boundary.py` | `engine/automation/draw_boundary.py` |
| **Chỉ trên máy anh (không có trong git):** | |
| `remotion-video/.env`, `out/`, `audio-test/`, `node_modules/` | `engine/remotion/` cùng tên |
| `remotion-video/public/raw-tuan.mp4` | `.../assets/raw-tuan.mp4` |
| `data/*` | `data/bcons-central-park/` |
| `anh/*` | `anh/bcons-central-park/` |

Giữ nguyên: `docs/quy-trinh-video.md`, `docs/prompt-gemini-nghien-cuu.md`, `docs/superpowers/` (lịch sử thiết kế, không sửa đường dẫn trong file cũ), `.claude/`.

## Review Focus
1. Máy anh sau `git pull`: `remotion-video/` còn sót `.env`, `out/`, `node_modules/` → script dời phải nhận ra và dời; chạy lần 2 không làm gì và không báo lỗi.
2. Đích đã tồn tại (vd. anh đã tự tạo `engine/remotion/.env`) → script **không ghi đè**, báo dòng đó và tiếp tục các dòng khác.
3. Tên thư mục có dấu/khoảng trắng (`Gemini Deep Research/`, `map/KCN Biên Hòa 1.geojson`) → dời đúng trên Windows và Linux.
4. `--du-an` trỏ tới mã không có thư mục → báo rõ "không thấy du-an/<mã>", không render nhầm dự án mặc định.
5. Remotion Studio (`npm run dev`) mở được và thấy ảnh/bản đồ/âm thanh, không chỉ lệnh render.

---

### Task 1: Module đường dẫn dự án

**Files:**
- Create: `remotion-video/scripts/project.mjs` (sẽ theo thư mục sang `engine/remotion/scripts/` ở Task 2)
- Test: `remotion-video/tests/project.test.mjs`

**Interfaces:**
- Produces:
  - `REPO_ROOT: string`: thư mục gần nhất, tính ngược lên từ vị trí file, có chứa `CLAUDE.md` (đúng cả trước và sau khi dời).
  - `readActiveProject(root = REPO_ROOT): string`: đọc `config.json` → `duAnDangBan`.
  - `projectDir(ma: string, root = REPO_ROOT): string`: `<root>/du-an/<ma>`, ném lỗi `không thấy du-an/<ma>` nếu không tồn tại.
  - `videoPaths(name: string, projDir: string): { dir, spec, timestamps, sources, storyboard, caption, audioDir }`: lần lượt `video/<name>/`, `spec.json`, `timestamps.json`, `kich-ban.md`, `storyboard.md`, `caption.md`, `audio/`.
  - `listVideos(projDir: string): string[]`: tên các thư mục trong `video/` có `spec.json`, sắp xếp.
  - `takeProjectFlag(argv: string[], root = REPO_ROOT): { ma: string, projDir: string, rest: string[] }`: bóc `--du-an <mã>` khỏi argv; không có thì `readActiveProject`.

- [ ] **Step 1: Viết test hỏng** (dựng repo giả trong `fs.mkdtempSync`)
  - `readActiveProject` trả `"bcons-central-park"` từ `config.json` giả.
  - `readActiveProject` ném lỗi khi `config.json` thiếu hoặc mã sai dạng (`"../x"`).
  - `projectDir("khong-co", root)` ném lỗi chứa `không thấy du-an/khong-co`.
  - `videoPaths("lai-suat", dir).sources` kết thúc bằng `video/lai-suat/kich-ban.md`; `audioDir` kết thúc bằng `video/lai-suat/audio`.
  - `videoPaths("../x", dir)` ném lỗi.
  - `listVideos` bỏ qua `video/dot-2/` (không có `spec.json`).
  - `takeProjectFlag(["ten", "--du-an", "du-an-b"], root)` → `ma = "du-an-b"`, `rest = ["ten"]`; không cờ → mã từ `config.json`.
- [ ] **Step 2:** `cd remotion-video && node --test tests/project.test.mjs` → FAIL (module chưa có).
- [ ] **Step 3:** Viết `project.mjs` theo Interfaces (dùng lại quy tắc tên của `resolveSpecPath` trong `spec-tools.mjs`).
- [ ] **Step 4:** Chạy lại → PASS; `npm test` toàn bộ vẫn PASS.
- [ ] **Step 5:** Commit `feat: add project path module`.

### Task 2: Script dời thư mục + chạy dời trong repo

**Files:**
- Create: `engine/automation/doi-thu-muc.mjs` (đặt ở vị trí mới ngay từ đầu), `engine/automation/doi-thu-muc.test.mjs`
- Create: `config.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces:
  - `MAPPING: Array<{ from: string, to: string, kind: "git" | "local" }>`: bảng ánh xạ ở trên, sinh từ danh sách file thật (glob theo tên video).
  - `planMoves(root: string): Array<{ from, to, action: "move" | "skip-missing" | "skip-exists" }>`
  - `rewriteAssetPaths(spec: object): object`: mọi chuỗi ở khóa `file` bắt đầu bằng `geo/` hoặc `images/` được thêm tiền tố `assets/`; không đụng chuỗi khác.
  - CLI: `node engine/automation/doi-thu-muc.mjs` (mặc định chạy thử, in bảng) | `--chay` (thực hiện: `git mv` cho file có trong git, `fs.renameSync` cho file chỉ có trên máy; sau đó viết lại `file` trong mọi `spec.json`).

- [ ] **Step 1: Viết test hỏng** (repo giả trong thư mục tạm, có `git init`)
  - `planMoves` trên repo giả có `remotion-video/specs/a.json` → có dòng tới `du-an/bcons-central-park/video/a/spec.json`.
  - Đích đã tồn tại → `skip-exists`; nguồn không có → `skip-missing`.
  - Chạy `--chay` hai lần: lần 2 toàn `skip-missing`/không lỗi.
  - Tên có dấu và khoảng trắng (`map/KCN Biên Hòa 1.geojson`) dời đúng.
  - `rewriteAssetPaths({scenes:[{props:{image:{file:"images/a.jpg"}, layers:[{file:"geo/b.geojson"}]}}], name:"geo/x"})` → `assets/images/a.jpg`, `assets/geo/b.geojson`, còn `name` giữ `"geo/x"`.
- [ ] **Step 2:** `node --test engine/automation/doi-thu-muc.test.mjs` → FAIL.
- [ ] **Step 3:** Viết script. Mỗi dòng in: `DỜI | BỎ QUA (đã có) | BỎ QUA (không có)  cũ → mới`.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5: Lấy khung chuẩn trước khi dời.** Từ `remotion-video/`: render still khung 0, 90, 300, 600 của `dong-nai-ha-tang` vào `out/tam/hash-truoc/`, rồi `node scripts/frame-hashes.mjs out/tam/hash-truoc > ../hash-truoc.json` (file tạm, không commit).
- [ ] **Step 6:** Chạy thử `node engine/automation/doi-thu-muc.mjs`, kiểm bảng in ra khớp bảng ánh xạ; rồi `--chay`.
- [ ] **Step 7:** Tạo `config.json`; sửa `.gitignore`: `engine/remotion/node_modules/`, `engine/remotion/out/`, `engine/remotion/audio-test/`, giữ `data/`, `/anh/`, `*.mp4`, `*.xlsx`, `.env`.
- [ ] **Step 8:** `git status` chỉ thấy rename + `config.json` + `.gitignore` + spec.json đổi `file`. Chưa commit (Task 3 sửa code cho chạy được rồi commit chung để không có commit hỏng).

### Task 3: Nối code Remotion vào cấu trúc mới

**Files:**
- Modify: `engine/remotion/scripts/spec-tools.mjs` (bỏ `SPECS_DIR`, `DOCS_VIDEO_DIR`; `resolveSpecPath` dùng `videoPaths`)
- Modify: `engine/remotion/scripts/check-spec.mjs`, `generate-voice.mjs`, `render-drive.mjs`, `build-geo.mjs`, `geo-fetch.mjs` (đọc `assets/geo/osm-xuat/` thay `map/`), `geo-derive.mjs`, `voice-variants.mjs`
- Modify: `engine/remotion/remotion.config.ts`: `Config.setPublicDir(projectDir(readActiveProject()))`
- Modify: `engine/remotion/src/BconsVideo.tsx:186`: `staticFile(\`video/${spec.name}/audio/${d.id}.mp3\`)`
- Modify: `engine/remotion/src/Root.tsx:7-8`: import spec/timestamps mặc định từ `../../../du-an/bcons-central-park/video/dong-nai-ha-tang/`
- Modify: `engine/remotion/src/tuan/data.ts`: `RAW_VIDEO = "assets/raw-tuan.mp4"`
- Modify: `engine/remotion/tests/gates.test.mjs`, `spec-tools.test.mjs`, `geo-spec.test.mjs` theo cấu trúc mới

**Interfaces:**
- Consumes: Task 1 (`takeProjectFlag`, `videoPaths`, `listVideos`, `projectDir`).
- Produces: `prepareRun(name: string, { projDir: string }): { spec, specPath, timestampsPath, projDir }`, mọi lỗi giữ nguyên câu chữ, chỉ đổi đường dẫn trong thông báo. `checkGeoFiles(spec, projDir)`.

- [ ] **Step 1: Sửa test hỏng trước:** `gates.test.mjs` dựng `du-an/x/video/demo/{spec.json,kich-ban.md}` và gọi `prepareRun("demo", { projDir })`; các ca chặn cũ (draft, thiếu sourceId, thiếu link) vẫn ném đúng lỗi. Thêm ca: `geo-spec` với file `assets/geo/p.geojson`.
- [ ] **Step 2:** `cd engine/remotion && npm test` → FAIL ở các test vừa sửa.
- [ ] **Step 3:** Sửa các file trong danh sách. `render-drive.mjs` truyền thêm `--public-dir=<projDir>` cho `remotion render`; `out/video/<tên>.mp4` giữ nguyên chỗ (chia `out/<mã>/` để sau, YAGNI).
- [ ] **Step 4:** `npm test` PASS; `npm run lint` PASS (gồm `check-spec --all` duyệt `listVideos`).
- [ ] **Step 5: So khung.** Render lại 4 khung như Task 2 Step 5 vào `out/tam/hash-sau/`, băm, `diff` với `hash-truoc.json` → không khác.
- [ ] **Step 6:** `npm run dev` mở Studio, chọn `BconsCentralPark`: khung có ảnh phối cảnh và nghe được audio (Review Focus 5). Trong cloud không có Mapbox token thì chỉ kiểm video không có bản đồ và ghi rõ trong báo cáo.
- [ ] **Step 7:** `npm run render:drive -- dong-nai-ha-tang --du-an khong-co` → báo `không thấy du-an/khong-co`, không render.
- [ ] **Step 8:** Commit chung Task 2+3: `refactor: move to engine/ + du-an/<project>/ layout`.

### Task 4: Khung dự án mẫu + cấu hình dự án

**Files:**
- Create: `du-an/bcons-central-park/project.json`, `du-an/_mau/project.json`, `du-an/_mau/thong-tin.md`, `du-an/_mau/README.md`, `du-an/_mau/{video,assets/geo,assets/images,nguon,content,landing,bao-cao}/.gitkeep`
- Create: `du-an/bcons-central-park/{landing,bao-cao}/.gitkeep`
- Test: thêm vào `engine/remotion/tests/project.test.mjs`

**Interfaces:**
- Produces: `readProjectConfig(projDir): ProjectConfig`, kiểm các khóa bắt buộc: `ma`, `ten`, `diaChi`, `toaDo: [lng, lat]`, `chuDauTu`, `donViPhanPhoi`, `soCan: { o, thuongMai }`, `thongTin` (đường dẫn tương đối), `tuKhoaNghienCuu: string[]`, `tenKenh: { facebook, tiktok }`.

- [ ] **Step 1:** Test hỏng: `readProjectConfig` của `bcons-central-park` trả `soCan.o === 2820`, `soCan.thuongMai === 113`; thiếu `ten` → ném lỗi nêu tên khóa; `du-an/_mau/project.json` có đủ khóa (giá trị rỗng).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Điền `project.json` của Bcons Central Park **chỉ từ `thong-tin.md`** (địa chỉ 236 Phan Trung, Tam Hiệp; tọa độ đang dùng trong `assets/geo/diem-moc.geojson`; tên fanpage "Căn hộ Phan Trung – Bcons Central Park Biên Hòa"; tên TikTok chưa có thì để `""`). `_mau/README.md`: 5 bước tạo dự án mới (chép `_mau`, đổi tên thư mục, điền `project.json` + `thong-tin.md`, đổi `config.json`, chạy `npm run lint`).
- [ ] **Step 4:** PASS. Commit `feat: project config and new-project template`.

### Task 5: Cập nhật tài liệu, lệnh và hướng dẫn cho máy anh

**Files:**
- Modify: `CLAUDE.md`, `NOTES.md` (đường dẫn), `docs/quy-trinh-video.md`, `.claude/commands/bcons-video.md` (nhận `[mã dự án]` tùy chọn, ghi file vào `du-an/<mã>/video/<tên>/`), `.claude/skills/real-estate-content-creator/SKILL.md` và `references/*.md` (đường dẫn `docs/bcons-central-park.md` → `du-an/bcons-central-park/thong-tin.md`), `engine/remotion/README.md`
- Create: `du-an/bcons-central-park/NOTES.md` (chuyển các mục riêng dự án từ `NOTES.md` gốc; gốc giữ việc chung: hệ thống, công cụ, quyết định)
- Create: `docs/huong-dan-doi-thu-muc-may-anh.md`

- [ ] **Step 1:** `grep -rn "remotion-video/\|docs/video/\|docs/bcons-central-park\|docs/content/\|specs/<\|public/audio\|public/geo" CLAUDE.md NOTES.md docs/*.md .claude engine du-an` → danh sách cần sửa (bỏ qua `docs/superpowers/`).
- [ ] **Step 2:** Sửa từng chỗ. Sau khi sửa, lệnh grep ở Step 1 không còn kết quả ngoài các ghi chép lịch sử có ghi rõ "(đường dẫn cũ)".
- [ ] **Step 3:** Hướng dẫn máy anh (PowerShell), đúng thứ tự: đóng Studio → `git pull` → `node engine/automation/doi-thu-muc.mjs` (xem bảng) → `node engine/automation/doi-thu-muc.mjs --chay` → `cd engine/remotion; npm ci` nếu `node_modules` không dời được → `npm test` → `npm run render:drive -- dong-nai-ha-tang` thử. Kèm cách sửa `DRIVE_VIDEO_DIR` nếu cần và việc xóa thư mục `remotion-video/` rỗng còn sót.
- [ ] **Step 4:** `npm test && npm run lint` trong `engine/remotion` vẫn PASS. Commit `docs: update paths for project layout`, push lên nhánh hiện tại.

---

## Các kế hoạch tiếp theo (viết khi tới lượt, mỗi cái một file)
- **02 Lịch nội dung + đăng bài:** Sheet "Lịch nội dung" (mục 5.1), `caption.md` trong mỗi video, bước ghi caption trong `/bcons-video`, lệnh `npm run send:telegram -- <tên>`, quy trình FB qua Meta Business Suite + TikTok qua Metricool.
- **03 Landing + CRM:** công cụ tính dòng tiền rút gọn cho 5 loại căn mẫu, form có ô đồng ý, Apps Script → Sheet CRM → Telegram, deploy Cloudflare Pages. Chờ anh chốt bên đứng tên dữ liệu.
- **04 Báo cáo tuần:** skill `social-analytics` đọc file xuất, ghi số vào Lịch nội dung, viết `du-an/<mã>/bao-cao/<ngày>.md`, cập nhật `content-strategy.md`.
