// Master_Data: phần đọc/ghi Google Sheets. Cần Logic.gs trong cùng dự án (dùng KHACH_COLS, cell_, normalizePhone_, parseLandingRow_, mergeCustomer_).
// Script gắn với Sheet Master_Data: master = getActiveSpreadsheet(); Sheet landing mở theo ID ghi ở tab CauHinh.
// Không bao giờ ghi tên/SĐT ra Logger, NhatKy, Telegram.

/** Tab và dòng tiêu đề. Dùng getter để không phụ thuộc thứ tự nạp file (KHACH_COLS ở Logic.gs). */
var TAB_HEADERS_ = {
  get KhachHang() { return KHACH_COLS.slice(); },
  NhapCRM: ['HoTen', 'SDT', 'DuAnQuanTam', 'TrangThaiCRM', 'DaGop'],
  Loi: ['Thời gian', 'Nguồn', 'Dòng', 'Lý do'],
  get ChuaPhanDuAn() { return KHACH_COLS.concat(['GanDuAn']); },
  TuChoi: ['SDT', 'LyDo', 'NgayGhi'],
  NhatKy: ['Thời gian', 'Nguồn', 'Số dòng đọc', 'Khách mới', 'Gộp trùng', 'Lỗi', 'Ghi chú'],
  CauHinh: ['maDuAn', 'landingSheetId', 'masterSheetId']
};
/** Cột phải là văn bản: SDT (không mất số 0 đầu) và HoTen (tên như '0123' hay '12345' không thành số). */
var TEXT_COLS_ = ['SDT', 'HoTen'];
/** Tab có cột SĐT/HoTen phải định dạng văn bản, nếu không Google Sheets bỏ số 0 đầu. */
var TAB_SDT_TEXT_ = ['KhachHang', 'NhapCRM', 'TuChoi', 'ChuaPhanDuAn'];

/** Tạo tab còn thiếu (kèm tiêu đề) và đặt cột SĐT/HoTen là văn bản. Tab đã có chỉ được định dạng lại nếu nằm trong `touch` (giữ số lần gọi ghi nhỏ ở mỗi lần chạy 15 phút); không truyền `touch` thì định dạng mọi tab. dryRun: không làm gì, người gọi coi tab thiếu là rỗng. */
function ensureTabs_(ss, dryRun, touch) {
  if (dryRun) return;
  Object.keys(TAB_HEADERS_).forEach(function (name) {
    var headers = TAB_HEADERS_[name];
    var sh = ss.getSheetByName(name);
    var fresh = !sh;
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (TAB_SDT_TEXT_.indexOf(name) >= 0 && (fresh || !touch || touch.indexOf(name) >= 0)) {
      var actual = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return String(h).trim(); });
      TEXT_COLS_.forEach(function (col) {
        var i = actual.indexOf(col);
        if (i >= 0) sh.getRange(1, i + 1, Math.max(sh.getMaxRows(), 2), 1).setNumberFormat('@');
      });
    }
  });
}

/** Mã khách kế tiếp: số lớn nhất dạng KH-<số> + 1, đệm 6 chữ số. Bỏ qua giá trị lạ. */
function nextMaKhach_(maList) {
  var max = 0;
  (maList || []).forEach(function (m) {
    var x = /^KH-(\d+)$/.exec(String(m == null ? '' : m).trim());
    if (x) max = Math.max(max, parseInt(x[1], 10));
  });
  var n = String(max + 1);
  while (n.length < 6) n = '0' + n;
  return 'KH-' + n;
}

function rowBlank_(row) {
  return row.every(function (v) { return String(v == null ? '' : v).trim() === ''; });
}

/** Danh sách landingSheetId khác nhau, theo thứ tự trong CauHinh; ô trống bị bỏ. */
function landingIds_(cfg) {
  var vals = cfg.getLastRow() >= 1 ? cfg.getDataRange().getValues() : [];
  var i = vals.length ? vals[0].map(function (h) { return String(h).trim(); }).indexOf('landingSheetId') : -1;
  if (i < 0) throw new Error('Tab CauHinh thiếu cột landingSheetId.');
  var ids = [];
  for (var r = 1; r < vals.length; r++) {
    var id = String(vals[r][i] == null ? '' : vals[r][i]).trim();
    if (id && ids.indexOf(id) < 0) ids.push(id);
  }
  return ids;
}

/** Đọc tab KhachHang vào bộ nhớ. Tab thiếu (dryRun) = rỗng. */
function readKhach_(master) {
  var sh = master.getSheetByName('KhachHang');
  var data = sh && sh.getLastRow() >= 1 ? sh.getDataRange().getValues().map(function (r) { return r.slice(); }) : [TAB_HEADERS_.KhachHang];
  var headers = data[0].map(function (h) { return String(h).trim(); });
  var idx = {};
  KHACH_COLS.forEach(function (c) { idx[c] = headers.indexOf(c); });
  if (idx.MaKhach < 0 || idx.SDT < 0) throw new Error('Tab KhachHang thiếu cột MaKhach hoặc SDT.');
  var byPhone = {};
  var maList = [];
  for (var r = 1; r < data.length; r++) {
    if (rowBlank_(data[r])) continue;
    var p = normalizePhone_(data[r][idx.SDT]);
    if (p && !(p in byPhone)) byPhone[p] = r;
    maList.push(data[r][idx.MaKhach]);
  }
  return { sheet: sh, data: data, headers: headers, idx: idx, byPhone: byPhone, maList: maList };
}

function khachObj_(kh, row) {
  var o = {};
  KHACH_COLS.forEach(function (c) { o[c] = kh.idx[c] < 0 || kh.idx[c] >= row.length ? '' : row[kh.idx[c]]; });
  return o;
}

/** Đặt giá trị khách vào dòng (giữ nguyên cột lạ anh thêm); chữ qua cell_ để chặn công thức. */
function khachRow_(kh, base, obj) {
  var row = base ? base.slice() : [];
  while (row.length < kh.headers.length) row.push('');
  KHACH_COLS.forEach(function (c) {
    if (kh.idx[c] >= 0) row[kh.idx[c]] = c === 'MaKhach' ? String(obj[c] || '') : cell_(obj[c]);
  });
  return row;
}

/** Sheets thật ném lỗi khi ghi vượt số dòng của lưới (mặc định 1000): mở rộng trước khi ghi tới dòng `needed`. */
function ensureRows_(sheet, needed) {
  var max = sheet.getMaxRows();
  if (needed > max) sheet.insertRowsAfter(max, needed - max);
}

/** Trạng thái gộp trong bộ nhớ: dòng có chỉ số >= origLen là khách mới của lần chạy này; dirty = chỉ số dòng cũ -> {chỉ số cột: true}. */
function newKhachState_(kh) {
  return { origLen: kh.data.length, dirty: {} };
}

/** Gộp một bản ghi vào KhachHang trong bộ nhớ (khớp theo SĐT chuẩn hóa). Trả MaKhach; cộng out.moi hoặc out.trung. Chưa ghi gì. */
function upsertKhach_(kh, rec, nowIso, st, out) {
  var at = kh.byPhone[rec.SDT];
  if (at !== undefined) {
    var merged = mergeCustomer_(khachObj_(kh, kh.data[at]), rec, nowIso);
    if (!String(merged.MaKhach || '').trim()) {
      merged.MaKhach = nextMaKhach_(kh.maList);
      kh.maList.push(merged.MaKhach);
    }
    var cur = kh.data[at];
    while (cur.length < kh.headers.length) cur.push('');
    KHACH_COLS.forEach(function (c) {
      var ci = kh.idx[c];
      if (ci < 0) return;
      if (s_(cur[ci]) === s_(merged[c])) return;
      cur[ci] = c === 'MaKhach' ? String(merged[c]) : cell_(merged[c]);
      if (at < st.origLen) (st.dirty[at] = st.dirty[at] || {})[ci] = true;
    });
    out.trung++;
    return merged.MaKhach;
  }
  rec.MaKhach = nextMaKhach_(kh.maList);
  rec.NgayTao = rec.NgayTao || nowIso;
  rec.NgayCapNhat = nowIso;
  kh.data.push(khachRow_(kh, null, rec));
  kh.byPhone[rec.SDT] = kh.data.length - 1;
  kh.maList.push(rec.MaKhach);
  out.moi++;
  return rec.MaKhach;
}

/** Số lần ghi tối đa cho ô khách cũ đổi (mỗi đoạn dòng liền nhau của một cột là một lần); vượt thì ghi một khối liền. */
var MAX_RUN_WRITES_ = 8;

/** Ghi KhachHang theo lô. (a) khách mới: một lần ghi vào vùng ngay sau dữ liệu, SĐT và HoTen đặt định dạng văn bản trước.
 *  (b) khách cũ: chỉ các ô đổi, gom các dòng liền nhau của cùng một cột; nếu quá nhiều đoạn thì ghi MỘT khối liền
 *  phủ các dòng và cột đã đụng (chỉ trong KHACH_COLS) (cột anh thêm bên phải không bị ghi). */
function flushKhach_(kh, st) {
  var origLen = st.origLen;
  var width = 0;
  KHACH_COLS.forEach(function (c) {
    if (kh.idx[c] < 0) return;
    if (kh.idx[c] + 1 > width) width = kh.idx[c] + 1;
  });
  var newRows = kh.data.slice(origLen);
  if (newRows.length) {
    var block = newRows.map(function (rw) { return rw.slice(0, width); });
    ensureRows_(kh.sheet, origLen + block.length);
    kh.sheet.getRange(origLen + 1, kh.idx.SDT + 1, block.length, 1).setNumberFormat('@');
    if (kh.idx.HoTen >= 0) kh.sheet.getRange(origLen + 1, kh.idx.HoTen + 1, block.length, 1).setNumberFormat('@');
    kh.sheet.getRange(origLen + 1, 1, block.length, width).setValues(block);
  }
  var perCol = {};
  var minRow = 1e9, maxRow = -1, minCol = 1e9, maxCol = -1;
  Object.keys(st.dirty).forEach(function (rk) {
    Object.keys(st.dirty[rk]).forEach(function (ck) {
      (perCol[ck] = perCol[ck] || []).push(Number(rk));
      minCol = Math.min(minCol, Number(ck));
      maxCol = Math.max(maxCol, Number(ck));
    });
    minRow = Math.min(minRow, Number(rk));
    maxRow = Math.max(maxRow, Number(rk));
  });
  var runs = [];
  Object.keys(perCol).forEach(function (ck) {
    var rows = perCol[ck].sort(function (a, b) { return a - b; });
    var start = 0;
    for (var k = 1; k <= rows.length; k++) {
      if (k < rows.length && rows[k] === rows[k - 1] + 1) continue;
      runs.push({ col: Number(ck), rows: rows.slice(start, k) });
      start = k;
    }
  });
  if (runs.length > MAX_RUN_WRITES_) {
    var span = kh.data.slice(minRow, maxRow + 1).map(function (rw) { return rw.slice(minCol, maxCol + 1); });
    kh.sheet.getRange(minRow + 1, minCol + 1, span.length, maxCol - minCol + 1).setValues(span);
    return;
  }
  runs.forEach(function (run) {
    var vals = run.rows.map(function (ri) { return [kh.data[ri][run.col]]; });
    kh.sheet.getRange(run.rows[0] + 1, run.col + 1, vals.length, 1).setValues(vals);
  });
}

/** Dòng lỗi: một lần ghi vào tab Loi. */
function flushLoi_(master, loiRows) {
  if (!loiRows.length) return;
  var loiSheet = master.getSheetByName('Loi');
  ensureRows_(loiSheet, loiSheet.getLastRow() + loiRows.length);
  loiSheet.getRange(loiSheet.getLastRow() + 1, 1, loiRows.length, 4).setValues(loiRows);
}

/** Đánh dấu một cột (Đã gộp/DaGop). Lưu ý: dòng đã đánh dấu 'LOI' không bao giờ được thử lại trừ khi anh xóa dấu; cả cột được ghi lại từ ảnh chụp lúc bắt đầu lần chạy (ô anh sửa giữa chừng sẽ bị ghi đè, nên giữ khóa script suốt lần chạy).
 *   một lần ghi cả đoạn cột, ô không đổi ghi lại đúng giá trị cũ. values gồm cả dòng tiêu đề. */
function markColumn_(sheet, values, iCol, marks) {
  if (!Object.keys(marks).length) return;
  var col = [];
  for (var r = 1; r < values.length; r++) {
    col.push([r in marks ? marks[r] : (values[r][iCol] == null ? '' : values[r][iCol])]);
  }
  sheet.getRange(2, iCol + 1, col.length, 1).setValues(col);
}


/** Gộp khách từ các Sheet landing vào KhachHang. Trả {doc, moi, trung, loi}. dryRun: tính số, không ghi gì. */
function gopLanding_(opts) {
  opts = opts || {};
  var dryRun = !!opts.dryRun;
  var nowIso = (opts.now || new Date()).toISOString();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return gopLandingLocked_(dryRun, nowIso);
  } finally {
    lock.releaseLock();
  }
}

function gopLandingLocked_(dryRun, nowIso) {
  var master = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = master.getSheetByName('CauHinh');
  if (!cfg) throw new Error('Thiếu tab CauHinh trong Master_Data (cột maDuAn, landingSheetId, masterSheetId). Chạy ensureTabs_ hoặc tạo tab rồi điền ID Sheet landing.');
  var ids = landingIds_(cfg);
  if (!ids.length) throw new Error('Tab CauHinh chưa có landingSheetId nào.');
  // Đọc và kiểm hết các Sheet landing trước, để lỗi cấu hình không để lại tab nửa vời.
  var sources = [];
  ids.forEach(function (id) {
    var lsh = SpreadsheetApp.openById(id).getSheetByName('Landing');
    if (!lsh) throw new Error('Sheet landing ' + id + ' không có tab Landing.');
    var values = lsh.getLastRow() >= 1 ? lsh.getDataRange().getValues() : [];
    if (!values.length) return;
    var headers = values[0].map(function (h) { return String(h).trim(); });
    var iGop = headers.indexOf('Đã gộp');
    if (iGop < 0) throw new Error('Thiếu cột Đã gộp trong tab Landing ' + id + '.');
    sources.push({ sheet: lsh, values: values, headers: headers, iGop: iGop, marks: {} });
  });
  ensureTabs_(master, dryRun, ['KhachHang']);
  var kh = readKhach_(master);
  var out = { doc: 0, moi: 0, trung: 0, loi: 0 };
  var st = newKhachState_(kh);
  var loiRows = [];

  // Bước 1: tính hết trong bộ nhớ, chưa ghi gì.
  sources.forEach(function (src) {
    for (var r = 1; r < src.values.length; r++) {
      var row = src.values[r];
      if (rowBlank_(row)) continue;
      if (String(row[src.iGop] == null ? '' : row[src.iGop]).trim() !== '') continue;
      out.doc++;
      var parsed = parseLandingRow_(src.headers, row);
      if (!parsed.ok) {
        loiRows.push([nowIso, 'Landing', r + 1, parsed.lyDo]);
        src.marks[r] = 'LOI';
        out.loi++;
        continue;
      }
      src.marks[r] = upsertKhach_(kh, parsed.rec, nowIso, st, out);
    }
  });
  if (dryRun) return out;

  // Bước 2: ghi theo lô. Thứ tự: KhachHang trước, đánh dấu 'Đã gộp' sau cùng
  // (chết giữa chừng thì lần sau khớp theo SĐT, không nhân đôi).
  flushKhach_(kh, st);
  flushLoi_(master, loiRows);
  // (d) đánh dấu 'Đã gộp': mỗi Sheet landing một lần ghi cả đoạn cột, ô không đổi ghi lại đúng giá trị cũ.
  sources.forEach(function (src) {
    markColumn_(src.sheet, src.values, src.iGop, src.marks);
  });
  return out;
}

/** Gộp các dòng anh nhập tay ở tab NhapCRM vào KhachHang. Trả {doc, moi, trung, loi}. dryRun: tính số, không ghi gì. */
function gopNhapCRM_(opts) {
  opts = opts || {};
  var dryRun = !!opts.dryRun;
  var nowIso = (opts.now || new Date()).toISOString();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return gopNhapCRMLocked_(dryRun, nowIso);
  } finally {
    lock.releaseLock();
  }
}

function gopNhapCRMLocked_(dryRun, nowIso) {
  var master = SpreadsheetApp.getActiveSpreadsheet();
  var out = { doc: 0, moi: 0, trung: 0, loi: 0 };
  var crm = master.getSheetByName('NhapCRM');
  if (!crm || crm.getLastRow() < 1) return out; // chưa có tab: không có gì để gộp (dryRun không tạo tab)
  var values = crm.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var ix = {};
  TAB_HEADERS_.NhapCRM.forEach(function (c) { ix[c] = headers.indexOf(c); });
  TAB_HEADERS_.NhapCRM.forEach(function (c) {
    if (ix[c] < 0) throw new Error('Tab NhapCRM thiếu cột ' + c + '.');
  });
  var at = function (row, c) { return ix[c] < 0 || ix[c] >= row.length ? '' : row[ix[c]]; };
  ensureTabs_(master, dryRun, ['KhachHang', 'NhapCRM']);
  var kh = readKhach_(master);
  var st = newKhachState_(kh);
  var loiRows = [];
  var marks = {};
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (rowBlank_(row)) continue;
    if (s_(at(row, 'DaGop')) !== '') continue;
    out.doc++;
    var sdt = normalizePhone_(at(row, 'SDT'));
    if (!sdt) {
      loiRows.push([nowIso, 'CRM', r + 1, 'SĐT không hợp lệ']);
      marks[r] = 'LOI';
      out.loi++;
      continue;
    }
    var rec = {};
    KHACH_COLS.forEach(function (c) { rec[c] = ''; });
    rec.SDT = sdt;
    rec.HoTen = cell_(s_(at(row, 'HoTen')));
    rec.NguonGoc = 'CRM';
    rec.DuAnQuanTam = codesOnly_(s_(at(row, 'DuAnQuanTam')));
    rec.TrangThaiCRM = cell_(s_(at(row, 'TrangThaiCRM')));
    rec.DongYNhanTin = 'Chưa rõ';
    rec.NgayTao = nowIso;
    marks[r] = upsertKhach_(kh, rec, nowIso, st, out);
  }
  if (dryRun) return out;
  // Thứ tự ghi như gopLanding_: KhachHang, Loi, rồi đánh dấu DaGop sau cùng.
  flushKhach_(kh, st);
  flushLoi_(master, loiRows);
  markColumn_(crm, values, ix.DaGop, marks);
  return out;
}
