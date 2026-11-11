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
  const hooks = { onWrite: null, onRead: null, waitLockError: false, lockBusy: false, triggerFail: null, fetchError: false, fetchCode: 200 };
  const props = { ...(spec.props || {}) };
  let lockHeld = false;
  const ui = { menus: [], alerts: [] };
  const triggers = [];
  let triggerSeq = 0;
  const looksNumeric = (v) => typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v);

  function makeSheet(owner, name, rows) {
    const sh = { name, data: structuredClone(rows || []), textCells: new Set(), maxRows: Math.max(1000, (rows || []).length) };
    const bounds = (r, nr) => {
      if (r < 1 || r + nr - 1 > sh.maxRows) throw new Error("The coordinates or dimensions of the range are invalid: coordinates outside the dimensions of the sheet");
    };
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
      getMaxRows: () => sh.maxRows,
      insertRowsAfter(after, n) {
        fire("insertRowsAfter", after, 1, n, n, 1);
        if (after < 1 || after > sh.maxRows || n < 1) throw new Error("insertRowsAfter: tham số sai");
        sh.maxRows += n;
      },
      deleteRow(n) {
        fire("deleteRow", n, 1, null, 1, 1);
        if (n < 1 || n > sh.maxRows) throw new Error("deleteRow: dòng ngoài lưới");
        if (n <= sh.data.length) sh.data.splice(n - 1, 1);
        const moved = new Set();
        for (const k of sh.textCells) {
          const [r0, c0] = k.split(",").map(Number);
          if (r0 + 1 === n) continue;
          moved.add(r0 + 1 > n ? r0 - 1 + "," + c0 : k);
        }
        sh.textCells = moved;
      },
      getDataRange() {
        return { getValues: () => api.getRange(1, 1, Math.max(lastRow(), 0), width()).getValues() };
      },
      getRange(r, c, nr = 1, nc = 1) {
        return {
          getValues() {
            if (hooks.onRead) hooks.onRead({ owner, sheet: name, row: r, col: c, nr, nc });
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
            bounds(r, nr);
            fire("setValues", r, c, vals, nr, nc);
            for (let i = 0; i < nr; i++) {
              while (sh.data.length < r + i) sh.data.push([]);
              const row = sh.data[r - 1 + i];
              while (row.length < c - 1 + nc) row.push("");
              for (let j = 0; j < nc; j++) row[c - 1 + j] = coerce(r - 1 + i, c - 1 + j, vals[i][j]);
            }
          },
          setNumberFormat(fmt) {
            bounds(r, nr);
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
        bounds(lastRow() + 1, 1);
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
      getUi: () => ({
        createMenu(name) {
          const m = { name, items: [] };
          const b = {
            addItem(label, fn) {
              m.items.push([label, fn]);
              return b;
            },
            addToUi() {
              ui.menus.push(m);
            },
          };
          return b;
        },
        alert: (msg) => ui.alerts.push(String(msg)),
      }),
      openById(id) {
        calls.openById.push(id);
        if (id === masterId) return master;
        if (!byId[id]) throw new Error("Không mở được Sheet: " + id);
        return byId[id];
      },
    },
    LockService: {
      // Khóa script thật: một khóa duy nhất, không cho vào lại. tryLock/waitLock thất bại khi đang bị giữ.
      getScriptLock: () => ({
        waitLock(ms) {
          calls.lock.push("wait");
          if (hooks.waitLockError || hooks.lockBusy || lockHeld) throw new Error("Không lấy được khóa");
          lockHeld = true;
        },
        tryLock(ms) {
          calls.lock.push("tryLock");
          if (hooks.lockBusy || lockHeld) return false;
          lockHeld = true;
          return true;
        },
        releaseLock() {
          calls.lock.push("release");
          lockHeld = false;
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in props ? props[k] : null),
        setProperty: (k, v) => {
          props[k] = String(v);
        },
        deleteProperty: (k) => {
          delete props[k];
        },
      }),
    },
    UrlFetchApp: {
      fetch(url, options) {
        calls.fetch.push({ url, options });
        if (hooks.fetchError) throw new Error("Telegram không trả lời");
        return { getResponseCode: () => hooks.fetchCode };
      },
    },
    // Trigger giả: chỉ nhận cách gọi mà Apps Script thật có (everyMinutes chỉ 1/5/10/15/30; atHour 0..23).
    triggers,
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger(t) {
        const i = triggers.indexOf(t);
        if (i >= 0) triggers.splice(i, 1);
      },
      newTrigger(fn) {
        const t = { id: ++triggerSeq, fn, kind: null, every: null, hour: null, getHandlerFunction: () => fn };
        const builder = {
          timeBased: () => ({
            everyMinutes(n) {
              if (![1, 5, 10, 15, 30].includes(n)) throw new Error("everyMinutes chỉ nhận 1, 5, 10, 15, 30");
              t.kind = "minutes";
              t.every = n;
              return builder;
            },
            atHour(h) {
              if (!(h >= 0 && h <= 23)) throw new Error("atHour 0..23");
              t.hour = h;
              return {
                everyDays(n) {
                  t.kind = "days";
                  t.every = n;
                  return builder;
                },
              };
            },
          }),
          create() {
            if (hooks.triggerFail === fn) throw new Error("Không tạo được trigger");
            triggers.push(t);
            return t;
          },
        };
        return builder;
      },
    },
    ui,
    /** Thuộc tính script hiện tại (để test kiểm cờ chống báo lặp). */
    props,
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
