import test from "node:test";
import assert from "node:assert/strict";
import { auditViolations } from "./kiem-audit.mjs";

test("commit 'audit:' của Antigravity chỉ được thêm/sửa file trong kiem-toan/; commit khác không bị xét", () => {
  const commits = [
    { sha: "a1", subject: "audit: CISA 2026-11-09", files: ["kiem-toan/2026-11-09-cisa/bao-cao.md", "kiem-toan/2026-11-09-cisa/xac-nhan.md"] },
    { sha: "b2", subject: "audit: sửa luôn lỗi", files: ["kiem-toan/2026-11-16-x/bao-cao.md", "engine/remotion/src/theme.ts"] },
    { sha: "c3", subject: "Audit fixes wave 1-2: drop legacy tuan composition", files: ["engine/remotion/src/Root.tsx"] },
    { sha: "d4", subject: "Duyet 04-ha-tang-bien-hoa", files: ["du-an/bcons-central-park/video/04-ha-tang-bien-hoa/caption.md"] },
  ];
  assert.deepEqual(auditViolations(commits), [{ sha: "b2", files: ["engine/remotion/src/theme.ts"] }]);
});
