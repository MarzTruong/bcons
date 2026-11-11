// Nạp các file .gs (JavaScript thường) vào một vm context để test gọi như ctx.fn(...).
import fs from "node:fs";
import vm from "node:vm";

export function loadGs(paths) {
  const ctx = {};
  vm.createContext(ctx);
  for (const p of paths) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: p });
  return ctx;
}

// Mảng/đối tượng tạo trong .gs thuộc "thế giới" (realm) khác của Node nên assert.deepEqual báo lỗi khó hiểu.
// Bọc kết quả bằng plain(...) trước khi so sánh: plain(ctx.fn(x)).
export const plain = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

// ---- Sheet giả trong bộ nhớ (chỉ mô phỏng đúng phần API mà Sheets.gs dùng) ----
// spec: { masterId?, master: {Tab: [[...]]}, byId: {id: {Tab: [[...]]}}, props?: {KEY: 'giá trị'} }
// Quirk của Google Sheets được mô phỏng (theo TỪNG Ô): ô KHÔNG định dạng văn bản ('@') mà ghi
// chuỗi giống số ("0981234567") thì getValues trả về SỐ (mất số 0 đầu); chuỗi ISO ngày giờ thành Date;
// "TRUE"/"FALSE" thành boolean. Ô định dạng '@' giữ nguyên chuỗi.
// calls.writes ghi mỗi lần ghi kèm vùng (row, col, nr, nc) để test kiểm số lần gọi và ô nào bị đụng.
// Móc thử: hooks.onWrite(info) gọi trước mỗi lần ghi (ném lỗi để giả lập chết giữa chừng);
// hooks.waitLockError = true làm waitLock ném lỗi.
export function fakeSheets(spec = {}) {
  const calls = { fetch: [], lock: [], writes: [], openById: [] };
  const hooks = { onWrite: null, waitLockError: false };
  const looksNumeric = (v) => typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v);

  function makeSheet(owner, name, rows) {
    const sh = { name, data: structuredClone(rows || []), textCells: new Set() };
    const width = () => sh.data.reduce((m, r) => Math.max(m, r.length), 0);
    const coerce = (r0, c0, v) => {
      if (typeof v !== "string" || sh.textCells.has(r0 + "," + c0)) return v;
      if (looksNumeric(v)) return Number(v);
      if (/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v) && !isNaN(Date.parse(v))) return new Date(Date.parse(v));
      if (v === "TRUE") return true;
      if (v === "FALSE") return false;
      return v;
    };
    const fire = (method, row, col, values, nr, nc) => {
      calls.writes.push({ owner, sheet: name, method, row, col, nr, nc });
      if (hooks.onWrite) hooks.onWrite({ owner, sheet: name, method, row, col, values });
    };
    const lastRow = () => {
      let n = sh.data.length;
      while (n > 0 && sh.data[n - 1].every((v) => v === "" || v == null)) n--;
      return n;
    };
    const api = {
      getName: () => name,
      getLastRow: lastRow,
      getLastColumn: () => width(),
      getMaxRows: () => Math.max(1000, sh.data.length),
      getDataRange() {
        return { getValues: () => api.getRange(1, 1, Math.max(lastRow(), 0), width()).getValues() };
      },
      getRange(r, c, nr = 1, nc = 1) {
        return {
          getValues() {
            const out = [];
            for (let i = 0; i < nr; i++) {
              const row = sh.data[r - 1 + i] || [];
              const line = [];
              for (let j = 0; j < nc; j++) line.push(row[c - 1 + j] === undefined ? "" : row[c - 1 + j]);
              out.push(line);
            }
            return out;
          },
          setValues(vals) {
            if (vals.length !== nr || vals.some((v) => v.length !== nc)) throw new Error("setValues: sai kích thước vùng");
            fire("setValues", r, c, vals, nr, nc);
            for (let i = 0; i < nr; i++) {
              while (sh.data.length < r + i) sh.data.push([]);
              const row = sh.data[r - 1 + i];
              while (row.length < c - 1 + nc) row.push("");
              for (let j = 0; j < nc; j++) row[c - 1 + j] = coerce(r - 1 + i, c - 1 + j, vals[i][j]);
            }
          },
          setNumberFormat(fmt) {
            fire("setNumberFormat", r, c, fmt, nr, nc);
            for (let i = 0; i < nr; i++)
              for (let j = 0; j < nc; j++) {
                const k = r - 1 + i + "," + (c - 1 + j);
                fmt === "@" ? sh.textCells.add(k) : sh.textCells.delete(k);
              }
          },
        };
      },
      appendRow(arr) {
        fire("appendRow", lastRow() + 1, 1, [arr], 1, arr.length);
        sh.data.length = lastRow();
        const row = arr.map((v, j) => coerce(sh.data.length, j, v));
        sh.data.push(row);
      },
    };
    sh.api = api;
    return sh;
  }

  function makeSpreadsheet(owner, tabs) {
    const sheets = new Map();
    for (const [n, rows] of Object.entries(tabs || {})) sheets.set(n, makeSheet(owner, n, rows));
    return {
      owner,
      sheets,
      getSheetByName: (n) => (sheets.has(n) ? sheets.get(n).api : null),
      insertSheet(n) {
        if (sheets.has(n)) throw new Error("Tab đã có: " + n);
        calls.writes.push({ owner, sheet: n, method: "insertSheet" });
        if (hooks.onWrite) hooks.onWrite({ owner, sheet: n, method: "insertSheet" });
        const s = makeSheet(owner, n, []);
        sheets.set(n, s);
        return s.api;
      },
    };
  }

  const masterId = spec.masterId || "MASTER";
  const master = makeSpreadsheet(masterId, spec.master);
  const byId = {};
  for (const [id, tabs] of Object.entries(spec.byId || {})) byId[id] = makeSpreadsheet(id, tabs);
  const all = () => [master, ...Object.values(byId)];

  return {
    calls,
    hooks,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => master,
      openById(id) {
        calls.openById.push(id);
        if (id === masterId) return master;
        if (!byId[id]) throw new Error("Không mở được Sheet: " + id);
        return byId[id];
      },
    },
    LockService: {
      getScriptLock: () => ({
        waitLock(ms) {
          calls.lock.push("wait");
          if (hooks.waitLockError) throw new Error("Không lấy được khóa");
        },
        releaseLock() {
          calls.lock.push("release");
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k) => (spec.props && k in spec.props ? spec.props[k] : null) }),
    },
    UrlFetchApp: {
      fetch(url, options) {
        calls.fetch.push({ url, options });
        return { getResponseCode: () => 200 };
      },
    },
    /** Giá trị một tab (qua API giả, đúng như getValues trả). id=null là Master_Data. */
    values(id, tab) {
      const ss = id == null ? master : byId[id];
      const sh = ss.getSheetByName(tab);
      return sh ? plain(sh.getDataRange().getValues()) : null;
    },
    /** Ảnh chụp toàn bộ trạng thái (tên tab, ô, định dạng cột) để so sánh trước/sau. */
    snapshot() {
      return JSON.stringify(
        all().map((ss) => [ss.owner, [...ss.sheets.values()].map((s) => [s.name, s.data, [...s.textCells].sort()])]),
      );
    },
  };
}
