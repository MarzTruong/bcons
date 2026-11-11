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
      var actual = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return hdr_(h); });
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

/** Tiêu đề cột để so sánh: NFC + cắt khoảng trắng (Unikey/điện thoại có thể gõ chữ có dấu dạng tổ hợp NFD). */
function hdr_(h) {
  return String(h == null ? '' : h).normalize('NFC').trim();
}

function rowBlank_(row) {
  return row.every(function (v) { return String(v == null ? '' : v).trim() === ''; });
}

/** Danh sách landingSheetId khác nhau, theo thứ tự trong CauHinh; ô trống bị bỏ. */
function landingIds_(cfg) {
  var vals = cfg.getLastRow() >= 1 ? cfg.getDataRange().getValues() : [];
  var i = vals.length ? vals[0].map(function (h) { return hdr_(h); }).indexOf('landingSheetId') : -1;
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
  var headers = data[0].map(function (h) { return hdr_(h); });
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

/** Chữ ghi vào ô KhachHang: DongYBangChung/DongYDuAn dùng cellDai_ (không cắt giữa đoạn bằng chứng), cột khác dùng cell_. */
function khachCell_(col, v) {
  if (col === 'DongYBangChung') return cellDai_(v, ' || ');
  if (col === 'DongYDuAn') return cellDai_(v, ';');
  return cell_(v);
}

/** Đặt giá trị khách vào dòng (giữ nguyên cột lạ anh thêm); chữ qua cell_ để chặn công thức. */
function khachRow_(kh, base, obj) {
  var row = base ? base.slice() : [];
  while (row.length < kh.headers.length) row.push('');
  KHACH_COLS.forEach(function (c) {
    if (kh.idx[c] >= 0) row[kh.idx[c]] = c === 'MaKhach' ? String(obj[c] || '') : khachCell_(c, obj[c]);
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
      cur[ci] = c === 'MaKhach' ? String(merged[c]) : khachCell_(c, merged[c]);
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


/** Chạy fn dưới khóa script. opts.lockHeld: người gọi (chayTatCa_) đã giữ khóa suốt cả lần chạy, nên không xin lại (khóa không cho vào lại, xin lại sẽ chờ hết giờ). */
function withLock_(opts, fn) {
  if (opts && opts.lockHeld) return fn();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** Gộp khách từ các Sheet landing vào KhachHang. Trả {doc, moi, trung, loi}. dryRun: tính số, không ghi gì. */
function gopLanding_(opts) {
  opts = opts || {};
  var dryRun = !!opts.dryRun;
  var nowIso = (opts.now || new Date()).toISOString();
  return withLock_(opts, function () { return gopLandingLocked_(dryRun, nowIso); });
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
    var headers = values[0].map(function (h) { return hdr_(h); });
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
  return withLock_(opts, function () { return gopNhapCRMLocked_(dryRun, nowIso); });
}

function gopNhapCRMLocked_(dryRun, nowIso) {
  var master = SpreadsheetApp.getActiveSpreadsheet();
  var out = { doc: 0, moi: 0, trung: 0, loi: 0 };
  var crm = master.getSheetByName('NhapCRM');
  if (!crm || crm.getLastRow() < 1) return out; // chưa có tab: không có gì để gộp (dryRun không tạo tab)
  var values = crm.getDataRange().getValues();
  var headers = values[0].map(function (h) { return hdr_(h); });
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

/** Cột hệ thống ở tab KhachTuMaster của Master_<mã>: A..L. Cột M để trống, từ N trở đi là của anh và KHÔNG BAO GIỜ bị ghi. */
var KHACH_TU_MASTER_COLS = ['MaKhach', 'SDT', 'HoTen', 'NgayCapNhat', 'NguonGoc', 'DuAnQuanTam', 'NhuCau', 'CanXem', 'PTTT', 'DongYNhanTin', 'TrangThaiCRM', 'TrangThaiChamSoc'];
/** Trong A..L, hai cột anh cũng gõ tay: chỉ điền khi ô đích đang trống, không bao giờ ghi đè. */
var KHACH_TU_MASTER_FILL_ONLY_ = ['TrangThaiCRM', 'TrangThaiChamSoc'];
/** Khi rút lại: các cột chứa dữ liệu cá nhân bị xóa ở KhachHang (GhiChu xử lý riêng: thay bằng dấu 'Rút lại'). */
var PURGE_CLEAR_ = ['SDT', 'HoTen', 'NhuCau', 'CanXem', 'DongYBangChung', 'NguonChiTiet', 'PTTT', 'NguoiChamSoc'];
var RUT_LAI_ = 'Rút lại';
/** ChuaPhanDuAn: các cột anh có thể gõ tay (ngoài GanDuAn, vốn không thuộc cột hệ thống): chỉ điền khi trống, không bao giờ ghi đè. */
var CHUA_FILL_ONLY_ = ['TrangThaiCRM', 'TrangThaiChamSoc', 'NguoiChamSoc', 'GhiChu'];
var TUCHOI_SAI_ = 'SĐT trong TuChoi không hợp lệ';
var DONGY_LA_ = 'Giá trị DongYNhanTin cần anh kiểm: ghi đúng Không để rút lại';

/** Phân bổ KhachHang sang Master_<mã> (KhachTuMaster) và ChuaPhanDuAn; xử lý rút lại (fail closed).
 *  Trả {dayVao: {mã: số khách thêm hoặc đổi}, chua: số dòng ChuaPhanDuAn thêm hoặc đổi, chan: số dòng khách vừa bị rút lại,
 *  lyDo: {tuchoi, khong}, masterLoi: [mã dự án Master chưa xóa được / không mở được]}.
 *  Tính hết trong bộ nhớ (kể cả quyết định cho mọi khách) rồi mới ghi; lỗi ở bước tính thì không ghi gì. dryRun: không ghi gì.
 *  Master không mở được: có người rút lại thì vẫn xóa ở các Master mở được, KhachHang giữ nguyên (chạy lại sau), không phân bổ gì;
 *  không có ai rút lại thì ném lỗi trước mọi lần ghi. */
function phanBo_(opts) {
  opts = opts || {};
  var dryRun = !!opts.dryRun;
  var nowIso = (opts.now || new Date()).toISOString();
  return withLock_(opts, function () { return phanBoLocked_(dryRun, nowIso); });
}

/** Dự án có masterSheetId: [{code, id}], bỏ dòng thiếu maDuAn/masterSheetId và mã trùng. */
function projectsFromCfg_(cfg) {
  var vals = cfg.getLastRow() >= 1 ? cfg.getDataRange().getValues() : [];
  var hd = vals.length ? vals[0].map(function (h) { return hdr_(h); }) : [];
  var iCode = hd.indexOf('maDuAn'), iId = hd.indexOf('masterSheetId');
  if (iCode < 0 || iId < 0) throw new Error('Tab CauHinh thiếu cột maDuAn hoặc masterSheetId.');
  var out = [];
  for (var r = 1; r < vals.length; r++) {
    var code = s_(vals[r][iCode]), id = s_(vals[r][iId]);
    if (!code || !id) continue;
    if (out.some(function (p) { return p.code === code; })) continue;
    out.push({ code: code, id: id });
  }
  return out;
}

/** SĐT trong tab TuChoi (cột SDT), chỉ ô không rỗng. Thiếu tab = rỗng. */
function readTuChoi_(master) {
  return readTuChoiRows_(master).map(function (x) { return x.v; });
}

/** Như readTuChoi_ nhưng kèm số dòng thật trong tab: [{row, v}]. */
function readTuChoiRows_(master) {
  var sh = master.getSheetByName('TuChoi');
  var vals = sh && sh.getLastRow() >= 1 ? sh.getDataRange().getValues() : [];
  if (!vals.length) return [];
  var i = vals[0].map(function (h) { return hdr_(h); }).indexOf('SDT');
  if (i < 0) throw new Error('Tab TuChoi thiếu cột SDT.');
  var out = [];
  for (var r = 1; r < vals.length; r++) {
    var v = s_(vals[r][i]);
    if (v) out.push({ row: r + 1, v: v });
  }
  return out;
}

/** Đọc một tab đích thành cấu trúc giống readKhach_ để dùng lại flushKhach_. cols = các cột hệ thống (theo thứ tự); width > 0: chỉ đọc cột A..width. */
function loadDest_(ss, name, cols, width, label) {
  var sh = ss.getSheetByName(name);
  var P = { ss: ss, name: name, sheet: sh, created: !sh, headerEmpty: false, label: label };
  var data;
  if (sh && sh.getLastRow() >= 1) {
    data = width ? sh.getRange(1, 1, sh.getLastRow(), width).getValues() : sh.getDataRange().getValues();
    data = data.map(function (r) { return r.slice(); });
  } else {
    if (sh) P.headerEmpty = true;
    data = [cols.slice()];
  }
  P.data = data;
  P.headers = data[0].map(function (h) { return hdr_(h); });
  if (!P.created && !P.headerEmpty && width) {
    for (var k = 0; k < width; k++) {
      if (P.headers[k] !== hdr_(cols[k])) throw new Error('Tab ' + name + ' (' + label + ') có tiêu đề cột ' + (k + 1) + ' sai, cần "' + cols[k] + '".');
    }
  }
  P.idx = {};
  KHACH_COLS.forEach(function (c) { P.idx[c] = P.headers.indexOf(c); });
  if (P.idx.MaKhach < 0 || P.idx.SDT < 0) throw new Error('Tab ' + name + ' (' + label + ') thiếu cột MaKhach hoặc SDT.');
  P.iGan = P.headers.indexOf('GanDuAn');
  P.sys = cols;
  P.fillOnly = [];
  return P;
}

function indexByMa_(P) {
  P.byMa = {};
  for (var r = 1; r < P.data.length; r++) {
    var ma = s_(P.data[r][P.idx.MaKhach]);
    if (ma && !(ma in P.byMa)) P.byMa[ma] = r;
  }
}

/** Bỏ (trong bộ nhớ) các dòng của khách rút lại: khớp MaKhach hoặc SĐT. */
function planPurge_(P, purgeMa, purgePhone) {
  var keep = [P.data[0]];
  for (var r = 1; r < P.data.length; r++) {
    var row = P.data[r];
    var ma = s_(row[P.idx.MaKhach]);
    var ph = normalizePhone_(row[P.idx.SDT]);
    if (!((ma && purgeMa[ma]) || (ph && purgePhone[ph]))) keep.push(row);
  }
  P.data = keep;
}

/** Thêm hoặc cập nhật một khách vào đích (chỉ các cột hệ thống đang có; P.fillOnly chỉ điền ô trống). Trả true nếu có thêm/đổi. */
function upsertDest_(P, obj, phone) {
  var at = P.byMa[s_(obj.MaKhach)];
  var changed = false;
  var vals = {};
  P.sys.forEach(function (c) { vals[c] = c === 'SDT' ? phone : obj[c]; });
  var write = function (c) { return c === 'MaKhach' ? String(vals[c]) : cell_(vals[c]); };
  if (at !== undefined) {
    var cur = P.data[at];
    P.sys.forEach(function (c) {
      var ci = P.idx[c];
      if (ci < 0 || c === 'MaKhach') return;
      var cv = s_(cur[ci]);
      if (P.fillOnly.indexOf(c) >= 0 && cv !== '') return;
      if (cv === s_(vals[c]) || cv === s_(write(c))) return;
      while (cur.length <= ci) cur.push('');
      cur[ci] = write(c);
      changed = true;
      if (at < P.origLen) (P.dirty[at] = P.dirty[at] || {})[ci] = true;
    });
    return changed;
  }
  var row = [];
  while (row.length < P.headers.length) row.push('');
  P.sys.forEach(function (c) { if (P.idx[c] >= 0) row[P.idx[c]] = write(c); });
  P.data.push(row);
  P.byMa[s_(obj.MaKhach)] = P.data.length - 1;
  return true;
}

/** Số dòng thật (từ dưới lên) của tab đích mà match(maKhach, sdtChuanHoa) đúng, đọc MỚI từ Sheet. */
function scanRows_(P, match) {
  var n = P.sheet.getLastRow() - 1;
  if (n < 1) return [];
  var maCol = P.sheet.getRange(2, P.idx.MaKhach + 1, n, 1).getValues();
  var sdtCol = P.sheet.getRange(2, P.idx.SDT + 1, n, 1).getValues();
  var rows = [];
  for (var i = 0; i < n; i++) {
    if (match(s_(maCol[i][0]), normalizePhone_(sdtCol[i][0]))) rows.push(i + 2);
  }
  return rows.sort(function (a, b) { return b - a; });
}

/** Xóa mọi dòng khớp match, từ dưới lên. Ngay trước mỗi lần xóa đọc lại ô MaKhach/SDT của dòng đó: không còn khớp (hàng đã dịch)
 *  thì quét lại từ đầu thay vì xóa nhầm. Trả true khi quét cuối không còn dòng nào; false nếu hết lượt thử (lần chạy sau thử lại). */
function deleteMatching_(P, match) {
  for (var round = 0; round < 5; round++) {
    var rows = scanRows_(P, match);
    if (!rows.length) return true;
    for (var k = 0; k < rows.length; k++) {
      var row = rows[k];
      var ma = s_(P.sheet.getRange(row, P.idx.MaKhach + 1, 1, 1).getValues()[0][0]);
      var ph = normalizePhone_(P.sheet.getRange(row, P.idx.SDT + 1, 1, 1).getValues()[0][0]);
      if (!match(ma, ph)) break; // hàng đã dịch: quét lại
      P.sheet.deleteRow(row);
    }
  }
  return scanRows_(P, match).length === 0;
}

/** Ghi SĐT rút lại (qua cột DongYNhanTin) vào TuChoi, SĐT là văn bản. */
function appendTuChoi_(master, phones, nowIso) {
  var sh = master.getSheetByName('TuChoi');
  var start = sh.getLastRow() + 1;
  ensureRows_(sh, start + phones.length - 1);
  sh.getRange(start, 1, phones.length, 1).setNumberFormat('@');
  sh.getRange(start, 1, phones.length, 3).setValues(phones.map(function (p) { return [p, RUT_LAI_ + ' (cột)', nowIso]; }));
}

function phanBoLocked_(dryRun, nowIso) {
  var master = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = master.getSheetByName('CauHinh');
  if (!cfg) throw new Error('Thiếu tab CauHinh trong Master_Data.');
  var projects = projectsFromCfg_(cfg);
  var codes = projects.map(function (p) { return p.code; });
  var tuChoiRows = readTuChoiRows_(master);
  var tuChoi = tuChoiRows.map(function (x) { return x.v; });
  var tcLoi = []; // SĐT gõ sai trong TuChoi: báo ở tab Loi (chỉ số dòng), không chặn việc khác
  tuChoiRows.forEach(function (x) { if (!normalizePhone_(x.v)) tcLoi.push([nowIso, RUT_LAI_, x.row, TUCHOI_SAI_]); });
  var tuChoiSet = {};
  tuChoi.forEach(function (v) { var p = normalizePhone_(v); if (p) tuChoiSet[p] = true; });
  var tcSheet = master.getSheetByName('TuChoi');
  if (tcSheet && tcSheet.getLastRow() >= 1 && hdr_(tcSheet.getRange(1, 1, 1, 1).getValues()[0][0]) !== 'SDT') throw new Error('Tab TuChoi: cột SDT phải ở cột A.');
  var kh = readKhach_(master);
  var st = newKhachState_(kh);
  var chuaP = loadDest_(master, 'ChuaPhanDuAn', KHACH_COLS, 0, 'Master_Data');
  chuaP.fillOnly = CHUA_FILL_ONLY_; // anh gõ tay ở đây: chỉ điền khi ô trống
  // Mở và kiểm các Master_<mã>; cái hỏng được ghi nhận (xử lý ở dưới), không làm dừng ngay.
  var byId = {};
  var dests = [];
  var failedId = {};
  projects.forEach(function (p) {
    if (p.id in byId || p.id in failedId) return;
    try {
      byId[p.id] = loadDest_(SpreadsheetApp.openById(p.id), 'KhachTuMaster', KHACH_TU_MASTER_COLS, KHACH_TU_MASTER_COLS.length, p.code);
      byId[p.id].fillOnly = KHACH_TU_MASTER_FILL_ONLY_;
      dests.push(byId[p.id]);
    } catch (e) {
      failedId[p.id] = true;
    }
  });
  var failedCodes = projects.filter(function (p) { return failedId[p.id]; }).map(function (p) { return p.code; });
  var out = { dayVao: {}, chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: tcLoi.length };
  codes.forEach(function (c) { out.dayVao[c] = 0; });
  var chuaGan = {};
  indexByMa_(chuaP);
  Object.keys(chuaP.byMa).forEach(function (ma) {
    if (chuaP.iGan >= 0) chuaGan[ma] = s_(chuaP.data[chuaP.byMa[ma]][chuaP.iGan]);
  });

  // Bước 1: quyết định cho mọi dòng khách (chưa ghi gì; decideDestinations_ ném lỗi thì dừng cả lần chạy).
  var items = [];
  var daLa = [];
  for (var r = 1; r < kh.data.length; r++) {
    var row = kh.data[r];
    if (rowBlank_(row)) continue;
    var obj = khachObj_(kh, row);
    var phone = normalizePhone_(obj.SDT);
    var kieu = dongYKieu_(obj.DongYNhanTin);
    var optOut = kieu === 'khong';
    if (kieu === 'la') {
      daLa.push([nowIso, RUT_LAI_, r + 1, DONGY_LA_]);
      obj.DongYNhanTin = 'Chưa rõ'; // chỉ trong bộ nhớ (không ghi đè chữ của anh ở KhachHang)
    }
    var leftover = PURGE_CLEAR_.some(function (c) { return s_(obj[c]) !== ''; }) || (s_(obj.GhiChu) !== '' && s_(obj.GhiChu) !== RUT_LAI_);
    if (!phone && !(optOut && leftover)) continue; // đã rút lại từ trước (đã sạch), hoặc không có SĐT: không động tới
    items.push({ r: r, obj: obj, ma: s_(obj.MaKhach), phone: phone, d: decideDestinations_(obj, tuChoi, codes) });
  }
  // Rút lại là theo SĐT: mọi dòng cùng SĐT với một dòng rút lại đều bị coi là rút lại.
  var purgePhone = {}, purgeMa = {};
  items.forEach(function (it) {
    if (it.d.chan && it.phone && !purgePhone[it.phone]) purgePhone[it.phone] = it.d.lyDo;
  });
  items.forEach(function (it) {
    if (!it.d.chan && it.phone && purgePhone[it.phone]) it.d = { chan: true, chua: false, dich: [], lyDo: purgePhone[it.phone] };
  });
  var purgeItems = items.filter(function (it) { return it.d.chan; });
  purgeItems.forEach(function (it) {
    if (it.ma) purgeMa[it.ma] = true;
    out.chan++;
    out.lyDo[it.d.lyDo === 'tuchoi' ? 'tuchoi' : 'khong']++;
  });
  if (purgeItems.length && kh.idx.DongYNhanTin < 0) throw new Error('Tab KhachHang thiếu cột DongYNhanTin, không ghi nhận được việc rút lại.');
  var suppress = Object.keys(purgePhone).filter(function (p) { return !tuChoiSet[p]; });
  if (failedCodes.length && !purgeItems.length) throw new Error('Không mở được hoặc tiêu đề sai ở tab KhachTuMaster của dự án: ' + failedCodes.join(', ') + '.');

  var allocs = [], chuaList = [], nonChua = {};
  if (!failedCodes.length) {
    items.forEach(function (it) {
      if (it.d.chan || !it.ma) return;
      var d = it.d;
      if (chuaGan[it.ma]) {
        var valid = codesOnly_(chuaGan[it.ma]).split(';').filter(function (c) {
          return c && codes.some(function (k) { return k.trim().toLowerCase() === c; });
        }).join(';');
        if (valid) {
          var merged = unionList_(it.obj.DuAnQuanTam, valid);
          if (merged !== codesOnly_(it.obj.DuAnQuanTam)) {
            markCell_(kh, st, it.r, 'DuAnQuanTam', merged);
            it.obj.DuAnQuanTam = merged;
            d = decideDestinations_(it.obj, tuChoi, codes);
          }
        }
      }
      if (d.chan) return; // không xảy ra (SĐT đã qua bộ lọc rút lại), giữ cho chắc
      if (d.chua) chuaList.push({ obj: it.obj, phone: it.phone });
      else {
        nonChua[it.ma] = true;
        allocs.push({ obj: it.obj, phone: it.phone, dich: d.dich });
      }
    });
  }
  purgeItems.forEach(function (it) {
    markCell_(kh, st, it.r, 'DongYNhanTin', 'Không');
    PURGE_CLEAR_.forEach(function (c) { markCell_(kh, st, it.r, c, ''); });
    markCell_(kh, st, it.r, 'NgayCapNhat', nowIso);
    if (kh.idx.GhiChu >= 0) markCell_(kh, st, it.r, 'GhiChu', RUT_LAI_);
  });

  // Bước 2: dựng thay đổi cho từng đích trong bộ nhớ.
  dests.concat([chuaP]).forEach(function (P) {
    planPurge_(P, purgeMa, purgePhone);
    P.origLen = P.data.length;
    P.dirty = {};
    indexByMa_(P);
  });
  allocs.forEach(function (a) {
    var seen = {};
    a.dich.forEach(function (code) {
      var p = projects.filter(function (x) { return x.code === code; })[0];
      if (!p || seen[p.id + code]) return;
      seen[p.id + code] = true;
      if (upsertDest_(byId[p.id], a.obj, a.phone)) out.dayVao[code]++;
    });
  });
  chuaList.forEach(function (c) {
    if (upsertDest_(chuaP, c.obj, c.phone)) out.chua++;
  });
  var anyAlloc = Object.keys(nonChua).length > 0;
  out.masterLoi = failedCodes.slice();
  if (dryRun) return out;

  // Bước 3: ghi. Ghi SĐT vào TuChoi trước, xóa dữ liệu rút lại tiếp, rồi mới xóa dữ liệu cá nhân ở KhachHang
  // (chết giữa chừng thì KhachHang còn SĐT, lần sau làm lại). Còn Master hỏng/xóa chưa hết thì KhachHang giữ nguyên.
  ensureTabs_(master, false, []); // chỉ tab mới tạo được định dạng; tab cũ giữ nguyên (không đổi gì thì không ghi gì)
  flushLoi_(master, tcLoi.concat(daLa)); // cảnh báo không chặn việc khác
  chuaP.sheet = master.getSheetByName('ChuaPhanDuAn');
  if (suppress.length) appendTuChoi_(master, suppress, nowIso);
  var matchPurge = function (ma, ph) { return !!((ma && purgeMa[ma]) || (ph && purgePhone[ph])); };
  var loi = [];
  failedCodes.forEach(function (c) { loi.push([nowIso, RUT_LAI_, 0, 'Không mở được Master ' + c]); });
  if (purgeItems.length) {
    dests.forEach(function (P) {
      if (P.sheet && !deleteMatching_(P, matchPurge)) {
        out.masterLoi.push(P.label);
        loi.push([nowIso, RUT_LAI_, 0, 'Không xóa được dòng ở Master ' + P.label]);
      }
    });
    if (chuaP.sheet && !deleteMatching_(chuaP, matchPurge)) {
      out.masterLoi.push('ChuaPhanDuAn');
      loi.push([nowIso, RUT_LAI_, 0, 'Không xóa được dòng ở ChuaPhanDuAn']);
    }
  }
  if (loi.length) {
    flushLoi_(master, loi);
    return out;
  }
  if (kh.sheet) flushKhach_(kh, st);
  dests.forEach(function (P) {
    if (!P.sheet) {
      P.sheet = P.ss.insertSheet('KhachTuMaster');
      P.sheet.getRange(1, 1, 1, KHACH_TU_MASTER_COLS.length + 2).setValues([KHACH_TU_MASTER_COLS.concat(['', 'Ghi chú của anh'])]);
    } else if (P.headerEmpty) {
      P.sheet.getRange(1, 1, 1, KHACH_TU_MASTER_COLS.length).setValues([KHACH_TU_MASTER_COLS]);
    }
    flushKhach_(P, { origLen: P.origLen, dirty: P.dirty });
  });
  flushKhach_(chuaP, { origLen: chuaP.origLen, dirty: chuaP.dirty });
  if (anyAlloc && chuaP.sheet) deleteMatching_(chuaP, function (ma) { return !!(ma && nonChua[ma]); });
  return out;
}

/** Đặt giá trị một ô của KhachHang trong bộ nhớ và đánh dấu để ghi (chỉ khi đổi). */
function markCell_(kh, st, r, col, value) {
  var ci = kh.idx[col];
  if (ci < 0) return;
  var row = kh.data[r];
  while (row.length <= ci) row.push('');
  if (s_(row[ci]) === s_(value)) return;
  row[ci] = value;
  (st.dirty[r] = st.dirty[r] || {})[ci] = true;
}


// ======================= Nhật ký, báo Telegram, lịch chạy, menu =======================
// Múi giờ dự án: appsscript.json (cùng thư mục) phải có timeZone 'Asia/Ho_Chi_Minh'; ở Cài đặt dự án bật hiển thị tệp kê khai rồi dán nội dung vào.
// Tin Telegram, NhatKy, hộp thoại và Logger chỉ chứa số đếm và mã loại lỗi, không bao giờ tên/SĐT, không nguyên văn thông báo lỗi.

var BAO_LOI_LAP_MS_ = 6 * 3600 * 1000; // cùng một loại lỗi chỉ báo lại sau 6 giờ (lịch 15 phút sẽ không spam)
var BAO_LOI_SACH_MS_ = 3600 * 1000; // lỗi phải vắng ít nhất 1 giờ thì cờ chống lặp mới được xóa (chống lỗi chập chờn)
var LOI_DONG_NGUONG_ = 5; // từ ngần này dòng khách lỗi (landing + CRM) trong một lần chạy thì báo Telegram
var CHAY_TOI_DA_MS_ = 270000; // Apps Script giới hạn 6 phút mỗi lần chạy; quá 4,5 phút thì không bắt đầu bước tiếp
var BAO_LOI_KEY_ = 'MD_BAO_LOI_CUOI'; // 'khóa|ms' của tin báo lỗi gửi thành công gần nhất
var BAO_LOI_SACH_KEY_ = 'MD_BAO_LOI_SACH_TU'; // ms của lần chạy sạch đầu tiên sau lỗi
var NHIP_KEY_ = 'MD_NHIP_NGAY'; // ngày VN của dòng "nhịp" gần nhất trong NhatKy
var CHAY_CUOI_KEY_ = 'MD_CHAY_CUOI'; // ms của lần chạy gần nhất (không tính chạy thử, lần bị bỏ qua)
var NHIP_GHI_CHU_ = 'nhịp: đang chạy, không có gì mới';
var VN_OFFSET_MS_ = 7 * 3600 * 1000; // Asia/Ho_Chi_Minh = UTC+7, không có giờ mùa hè

/** Phân loại lỗi thành mã cố định (không bao giờ đưa nguyên văn thông báo vào NhatKy/Telegram vì có thể chứa ID Sheet). Thứ tự kiểm quan trọng. */
function errorClass_(err) {
  var msg = err && err.message != null ? String(err.message) : String(err == null ? '' : err);
  if (/\block\b|Lock timeout|khóa/i.test(msg)) return 'LOI_KHOA';
  if (/Authorization is required|do not have permission to call/i.test(msg)) return 'LOI_QUYEN';
  if (/timed out|Exceeded maximum execution time/i.test(msg)) return 'LOI_HET_GIO';
  if (/too many times|quota|Service invoked/i.test(msg)) return 'LOI_HAN_MUC';
  if (/Range not found/i.test(msg)) return 'LOI_TAB';
  if (/tiêu đề sai|tiêu đề cột/.test(msg)) return 'LOI_TAB';
  if (/Không mở được|openById|Unexpected error|failed while accessing|permission|quyền|Requested entity|not found/i.test(msg)) return 'LOI_DOC_SHEET';
  if (/(^|[^a-z])tab([^a-z]|$)|cột/i.test(msg)) return 'LOI_TAB';
  return 'LOI_KHAC';
}

/** Gửi một tin Telegram (token, chat id ở Script Properties, giống Code.gs). Trả true CHỈ khi Telegram trả đúng 200 (muteHttpExceptions nên 401/429/5xx không ném). Thiếu thuộc tính thì bỏ qua; mọi lỗi gửi đều nuốt, không bao giờ ném, không ghi token ra đâu. */
function sendTelegram_(text) {
  try {
    var props = PropertiesService.getScriptProperties();
    var token = String(props.getProperty('TELEGRAM_BOT_TOKEN') || '').trim();
    var chat = String(props.getProperty('TELEGRAM_CHAT_ID') || '').trim();
    if (!token || !chat) return false;
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 4000) })
    });
    return !!res && res.getResponseCode() === 200;
  } catch (e) {
    return false;
  }
}

/** Báo lỗi: chỉ loại lỗi và số dòng. Cùng `khoa` (mặc định = loai; LOI_MASTER dùng khóa theo loại, không theo danh sách mã) trong 6 giờ chỉ báo một lần.
 *  Cờ chống lặp chỉ đặt khi Telegram nhận (200), nên gửi hỏng thì lần lỗi sau thử lại. now cho test. */
function baoLoi_(loai, soDong, now, khoa) {
  var ms = (now || new Date()).getTime();
  khoa = khoa || loai;
  try {
    var props = PropertiesService.getScriptProperties();
    var last = String(props.getProperty(BAO_LOI_KEY_) || '');
    var cut = last.lastIndexOf('|');
    if (cut > 0 && last.slice(0, cut) === String(khoa)) {
      var delta = ms - Number(last.slice(cut + 1));
      if (delta >= 0 && delta < BAO_LOI_LAP_MS_) return false;
    }
    if (!sendTelegram_('⚠️ Master_Data: ' + loai + ' (' + (soDong || 0) + ' dòng). Xem tab NhatKy.')) return false;
    props.setProperty(BAO_LOI_KEY_, khoa + '|' + ms);
    return true;
  } catch (e) {
    return false;
  }
}

/** Lần chạy sạch: bắt đầu đếm thời gian vắng lỗi; đủ 1 giờ mới xóa cờ chống lặp (lỗi chập chờn không được báo lại). */
function ghiNhanSach_(ms) {
  try {
    var props = PropertiesService.getScriptProperties();
    if (!props.getProperty(BAO_LOI_KEY_)) return;
    var tu = Number(props.getProperty(BAO_LOI_SACH_KEY_));
    if (!(tu > 0) || ms < tu) {
      props.setProperty(BAO_LOI_SACH_KEY_, String(ms));
    } else if (ms - tu >= BAO_LOI_SACH_MS_) {
      props.deleteProperty(BAO_LOI_KEY_);
      props.deleteProperty(BAO_LOI_SACH_KEY_);
    }
  } catch (e) { /* bỏ qua */ }
}

/** Có lỗi: đặt lại mốc "sạch từ". */
function ghiNhanLoi_() {
  try { PropertiesService.getScriptProperties().deleteProperty(BAO_LOI_SACH_KEY_); } catch (e) { /* bỏ qua */ }
}

/** Thêm MỘT dòng vào NhatKy: [giờ ISO, nguồn, số dòng đọc, khách mới, gộp trùng, lỗi, ghi chú]. entry: {now, nguon, doc, moi, trung, loi, ghiChu}. Chỉ số, không tên/SĐT. */
function ghiNhatKy_(ss, entry) {
  var sh = ss.getSheetByName('NhatKy');
  if (!sh || sh.getLastRow() === 0) {
    ensureTabs_(ss, false, []);
    sh = ss.getSheetByName('NhatKy');
  }
  var at = sh.getLastRow() + 1;
  ensureRows_(sh, at);
  sh.getRange(at, 1, 1, 7).setValues([[(entry.now || new Date()).toISOString(), entry.nguon, entry.doc || 0, entry.moi || 0, entry.trung || 0, entry.loi || 0, entry.ghiChu || '']]);
}

/** Mã dự án an toàn để đưa vào tin Telegram: chỉ mã đúng dạng (chữ thường, số, gạch ngang), còn lại thành 'mã lạ' (không để tên người gõ nhầm ở CauHinh lọt ra). ChuaPhanDuAn là tên tab nội bộ. */
function maDuAnAnToan_(list) {
  return (list || []).map(function (c) {
    c = String(c);
    return c === 'ChuaPhanDuAn' || /^[a-z][a-z0-9-]{2,39}$/.test(c) ? c : 'mã lạ';
  }).join(', ');
}

/** Ghi thông báo lỗi gốc vào nhật ký thực thi riêng của Apps Script (console.error) để tìm nguyên nhân thật; chuỗi giống SĐT (9 chữ số trở lên, kể cả có dấu cách/chấm) bị che. Không bao giờ ném. NhatKy/Telegram vẫn chỉ có mã loại lỗi. */
function logLoiGoc_(e) {
  try {
    if (typeof console === 'undefined' || !console || typeof console.error !== 'function') return;
    var m = e && e.message ? String(e.message) : String(e);
    console.error(m.replace(/\+?\d(?:[ .]*\d){8,}/g, '[SĐT]'));
  } catch (x) { /* bỏ qua */ }
}

/** Chạy cả ba bước (landing, NhapCRM, phân bổ). opts: {dryRun, now, source, clock}. Trả {landing, crm, phanBo, loi, skipped?}.
 *  Giữ khóa script một lần suốt lần chạy (tryLock 1 giây); lần chạy chồng thoát lặng lẽ với skipped:true. Ba bước nhận lockHeld nên không xin khóa lại (không bế tắc).
 *  Lỗi ở bước nào thì dừng, ghi một dòng NhatKy với mã lỗi, báo Telegram một tin, trả mã ở loi (không ném, để trigger không tự thử lại dồn dập).
 *  Quá 270 giây giữa các bước thì dừng sạch (LOI_HET_GIO), không bắt đầu bước tiếp (Apps Script giết ở 6 phút).
 *  dryRun: không ghi NhatKy, không Telegram, không ghi gì. clock: hàm trả ms (tiêm để test, mặc định đồng hồ thật). */
function chayTatCa_(opts) {
  opts = opts || {};
  var dryRun = !!opts.dryRun;
  var now = opts.now || new Date();
  var nguon = dryRun ? 'Chạy thử' : (opts.source || 'Tự động');
  var clock = opts.clock || function () { return new Date().getTime(); };
  var batDau = clock();
  var res = { landing: undefined, crm: undefined, phanBo: undefined, loi: '' };
  var lock = LockService.getScriptLock();
  var held = false;
  try {
    held = lock.tryLock(1000);
    if (!held) {
      res.skipped = true;
      return res;
    }
    var o = { dryRun: dryRun, now: now, lockHeld: true };
    var steps = [['landing', gopLanding_], ['crm', gopNhapCRM_], ['phanBo', phanBo_]];
    for (var i = 0; i < steps.length; i++) {
      if (i > 0 && clock() - batDau > CHAY_TOI_DA_MS_) {
        res.loi = 'LOI_HET_GIO';
        break;
      }
      res[steps[i][0]] = steps[i][1](o);
    }
    if (!res.loi && res.phanBo.masterLoi && res.phanBo.masterLoi.length) res.loi = 'LOI_MASTER';
  } catch (e) {
    res.loi = errorClass_(e);
    logLoiGoc_(e);
  }
  try {
    if (held && !dryRun) ghiVaBao_(res, nguon, now, clock() - batDau);
  } catch (e2) {
    res.loi = errorClass_(e2);
    logLoiGoc_(e2);
    ghiNhanLoi_();
    baoLoi_(res.loi, 0, now);
  } finally {
    if (held) {
      try { lock.releaseLock(); } catch (e3) { /* bỏ qua */ }
    }
  }
  return res;
}

/** Lần chạy "rảnh": không lỗi và mọi số đếm bằng 0 (kể cả khách chuyển vào dự án). */
function chayRanh_(res) {
  if (res.loi) return false;
  var L = res.landing, C = res.crm, P = res.phanBo;
  if (!L || !C || !P) return false;
  var vao = 0;
  Object.keys(P.dayVao || {}).forEach(function (k) { vao += P.dayVao[k]; });
  return [L.doc, L.moi, L.trung, L.loi, C.doc, C.moi, C.trung, C.loi, P.chan, P.lyDo.tuchoi, P.lyDo.khong, P.chua, vao, P.tuChoiLoi].every(function (n) { return !n; });
}

/** Ghi NhatKy và báo Telegram cho một lần chạy (không dryRun). Lần chạy rảnh không ghi, trừ một dòng "nhịp" mỗi ngày VN. Ném lỗi nếu ghi NhatKy hỏng; người gọi xử lý. */
function ghiVaBao_(res, nguon, now, ms) {
  var props = PropertiesService.getScriptProperties();
  var L = res.landing || { doc: 0, moi: 0, trung: 0, loi: 0 };
  var C = res.crm || { doc: 0, moi: 0, trung: 0, loi: 0 };
  var P = res.phanBo || { chua: 0, chan: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], dayVao: {} };
  var masterLoi = P.masterLoi || [];
  var vao = 0;
  Object.keys(P.dayVao || {}).forEach(function (k) { vao += P.dayVao[k]; });
  var loiSo = L.loi + C.loi + (P.tuChoiLoi || 0) + masterLoi.length + (res.loi && res.loi !== 'LOI_MASTER' ? 1 : 0);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (chayRanh_(res)) {
    var homNay = ngayVN_(now);
    if (String(props.getProperty(NHIP_KEY_) || '') !== homNay) {
      ghiNhatKy_(ss, { now: now, nguon: nguon, doc: 0, moi: 0, trung: 0, loi: 0, ghiChu: NHIP_GHI_CHU_ });
      props.setProperty(NHIP_KEY_, homNay);
    }
  } else {
    var ghiChu = 'chua=' + P.chua + ' chan=' + P.chan + ' tuchoi=' + P.lyDo.tuchoi + ' khong=' + P.lyDo.khong + ' vao=' + vao + ' ms=' + Math.max(0, Math.round(ms || 0));
    if (res.loi) ghiChu += ' ' + res.loi;
    ghiNhatKy_(ss, { now: now, nguon: nguon, doc: L.doc + C.doc, moi: L.moi + C.moi, trung: L.trung + C.trung, loi: loiSo, ghiChu: ghiChu });
  }
  props.setProperty(CHAY_CUOI_KEY_, String(now.getTime()));
  var loiDong = L.loi + C.loi >= LOI_DONG_NGUONG_; // nhiều dòng khách hỏng cùng một lần: báo một tin (cùng khóa chống lặp 6 giờ)
  if (!res.loi && !loiDong) ghiNhanSach_(now.getTime());
  else {
    ghiNhanLoi_();
    if (!res.loi) baoLoi_('LOI_DONG', L.loi + C.loi, now);
    else if (res.loi === 'LOI_MASTER') baoLoi_('LOI_MASTER ' + maDuAnAnToan_(masterLoi), masterLoi.length, now, 'LOI_MASTER');
    else baoLoi_(res.loi, loiSo, now);
  }
}

/** Lấy phần ngày (yyyy-mm-dd) theo giờ Việt Nam từ Date hoặc chuỗi ISO; không hiểu được thì ''. */
function ngayVN_(v) {
  var t = Object.prototype.toString.call(v) === '[object Date]' ? v.getTime() : (typeof v === 'string' && v.trim() ? Date.parse(v.trim()) : NaN);
  if (isNaN(t)) return '';
  return new Date(t + VN_OFFSET_MS_).toISOString().slice(0, 10);
}

/** Số dòng có dữ liệu (không tính dòng tiêu đề và dòng trống) của một tab; tab thiếu = 0. */
function demDong_(master, name) {
  var sh = master.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return 0;
  var vals = sh.getDataRange().getValues();
  var n = 0;
  for (var r = 1; r < vals.length; r++) if (!rowBlank_(vals[r])) n++;
  return n;
}

/** Tin tóm tắt hằng ngày: chỉ số đếm. Chỉ đọc, không ghi Sheet. Trả nội dung tin. opts.now cho test. */
function baoCaoNgay_(opts) {
  opts = opts || {};
  var now = opts.now || new Date();
  var homQua = new Date(now.getTime() + VN_OFFSET_MS_ - 86400000).toISOString().slice(0, 10);
  var master = SpreadsheetApp.getActiveSpreadsheet();
  var nguon = { Landing: 0, CRM: 0, Khac: 0 };
  var moi = 0;
  var kh = master.getSheetByName('KhachHang');
  if (kh && kh.getLastRow() >= 2) {
    var vals = kh.getDataRange().getValues();
    var headers = vals[0].map(function (h) { return hdr_(h); });
    var iTao = headers.indexOf('NgayTao');
    var iNguon = headers.indexOf('NguonGoc');
    for (var r = 1; r < vals.length && iTao >= 0; r++) {
      if (ngayVN_(vals[r][iTao]) !== homQua) continue;
      moi++;
      var g = iNguon >= 0 ? String(vals[r][iNguon] == null ? '' : vals[r][iNguon]).trim() : '';
      nguon[g === 'Landing' || g === 'CRM' ? g : 'Khac']++;
    }
  }
  var rutLai = 0;
  var tc = master.getSheetByName('TuChoi');
  if (tc && tc.getLastRow() >= 2) {
    var tv = tc.getDataRange().getValues();
    var iNgay = tv[0].map(function (h) { return hdr_(h); }).indexOf('NgayGhi');
    for (var k = 1; k < tv.length && iNgay >= 0; k++) if (ngayVN_(tv[k][iNgay]) === homQua) rutLai++;
  }
  var parts = [];
  if (nguon.Landing) parts.push('Landing ' + nguon.Landing);
  if (nguon.CRM) parts.push('CRM ' + nguon.CRM);
  if (nguon.Khac) parts.push('Khác ' + nguon.Khac);
  var text = '📊 Master_Data hôm qua: ' + moi + ' khách mới' + (parts.length ? ' (' + parts.join(', ') + ')' : '') +
    '. Chưa phân dự án: ' + demDong_(master, 'ChuaPhanDuAn') + '. Dòng lỗi: ' + demDong_(master, 'Loi') + '. Rút lại: ' + rutLai + '.';
  var cuoi = Number(PropertiesService.getScriptProperties().getProperty(CHAY_CUOI_KEY_));
  if (cuoi > 0) text += ' Lần chạy cuối: ' + Math.max(0, Math.floor((now.getTime() - cuoi) / 60000)) + ' phút trước.';
  sendTelegram_(text);
  return text;
}

/** Cài lịch tự chạy (an toàn khi chạy nhiều lần): tạo trigger MỚI trước, rồi mới xóa cái cũ trùng hàm, nên tạo lỗi thì lịch cũ còn nguyên. Mỗi 15 phút gộp; tin tóm tắt chạy khoảng 8-9 giờ mỗi ngày (Apps Script tự chọn phút ngẫu nhiên trong giờ). Trigger khác giữ nguyên. */
function caiLich_() {
  var mine = ['chayTatCaTuDong', 'baoCaoNgayTuDong'];
  var cu = ScriptApp.getProjectTriggers().filter(function (t) { return mine.indexOf(t.getHandlerFunction()) >= 0; });
  var moi = [];
  try {
    moi.push(ScriptApp.newTrigger('chayTatCaTuDong').timeBased().everyMinutes(15).create());
    moi.push(ScriptApp.newTrigger('baoCaoNgayTuDong').timeBased().atHour(8).everyDays(1).create());
  } catch (e) {
    moi.forEach(function (t) { try { ScriptApp.deleteTrigger(t); } catch (e2) { /* bỏ qua */ } });
    throw e;
  }
  cu.forEach(function (t) { ScriptApp.deleteTrigger(t); });
}

// ---- Điểm vào của trigger và menu (tên không có "_" để chọn được ở menu/trigger) ----
function chayTatCaTuDong() { return chayTatCa_({ dryRun: false, source: 'Tự động' }); }

function baoCaoNgayTuDong() {
  try {
    return baoCaoNgay_();
  } catch (e) {
    baoLoi_(errorClass_(e), 0);
  }
}

/** Câu chữ hộp thoại: chỉ số đếm và mã lỗi. */
function tomTatChay_(res, dryRun) {
  if (res.skipped) return 'Một lần chạy khác đang chạy. Chờ ít phút rồi bấm lại.';
  var L = res.landing, C = res.crm, P = res.phanBo;
  var lines = [(dryRun ? 'Chạy thử (không ghi gì)' : 'Đã gộp')];
  if (L) lines.push('Landing: đọc ' + L.doc + ', mới ' + L.moi + ', trùng ' + L.trung + ', lỗi ' + L.loi + '.');
  if (C) lines.push('CRM: đọc ' + C.doc + ', mới ' + C.moi + ', trùng ' + C.trung + ', lỗi ' + C.loi + '.');
  if (P) {
    var vao = 0;
    Object.keys(P.dayVao || {}).forEach(function (k) { vao += P.dayVao[k]; });
    lines.push('Phân bổ: vào dự án ' + vao + ', chưa phân ' + P.chua + ', rút lại ' + P.chan + ', Master lỗi ' + (P.masterLoi || []).length + '.');
  }
  if (res.loi) lines.push('Lỗi: ' + res.loi + '.');
  return lines.join('\n');
}

function gopNgay() {
  SpreadsheetApp.getUi().alert(tomTatChay_(chayTatCa_({ dryRun: false, source: 'Gộp ngay' }), false));
}

function chayThu() {
  SpreadsheetApp.getUi().alert(tomTatChay_(chayTatCa_({ dryRun: true, source: 'Chạy thử' }), true));
}

function caiLichTuDong() {
  caiLich_();
  SpreadsheetApp.getUi().alert('Đã cài lịch: gộp mỗi 15 phút, tin tóm tắt khoảng 8-9 giờ mỗi ngày.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Master_Data')
    .addItem('Gộp ngay', 'gopNgay')
    .addItem('Chạy thử (không ghi)', 'chayThu')
    .addItem('Cài lịch tự động', 'caiLichTuDong')
    .addToUi();
}
