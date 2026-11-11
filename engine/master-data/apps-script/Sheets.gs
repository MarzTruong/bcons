// Master_Data: phần đọc/ghi Google Sheets. Cần Logic.gs trong cùng dự án (dùng KHACH_COLS, cell_, normalizePhone_, parseLandingRow_, mergeCustomer_).
// Script gắn với Sheet Master_Data: master = getActiveSpreadsheet(); Sheet landing mở theo ID ghi ở tab CauHinh.
// Không bao giờ ghi tên/SĐT ra Logger, NhatKy, Telegram.

/** Tab và dòng tiêu đề. Dùng getter để không phụ thuộc thứ tự nạp file (KHACH_COLS ở Logic.gs). */
var TAB_HEADERS_ = {
  get KhachHang() { return KHACH_COLS.slice(); },
  NhapCRM: ['HoTen', 'SDT', 'DuAnQuanTam', 'TrangThaiCRM', 'DaGop'],
  Loi: ['Thời gian', 'Nguồn', 'Dòng', 'Lý do'],
  TuChoi: ['SDT', 'LyDo', 'NgayGhi', 'LoaiYeuCau', 'DaDongYLai'],
  NhatKy: ['Thời gian', 'Nguồn', 'Số dòng đọc', 'Khách mới', 'Gộp trùng', 'Lỗi', 'Ghi chú'],
  CauHinh: ['maDuAn', 'landingSheetId', 'masterSheetId']
};
/** Cột phải là văn bản: SDT (không mất số 0 đầu) và HoTen (tên như '0123' hay '12345' không thành số). */
var TEXT_COLS_ = ['SDT', 'HoTen'];
/** Tab có cột SĐT/HoTen phải định dạng văn bản, nếu không Google Sheets bỏ số 0 đầu. */
var TAB_SDT_TEXT_ = ['KhachHang', 'NhapCRM', 'TuChoi'];

/** Tạo tab còn thiếu (kèm tiêu đề) và đặt cột SĐT/HoTen là văn bản. Tab đã có chỉ được định dạng lại nếu nằm trong `touch` (giữ số lần gọi ghi nhỏ ở mỗi lần chạy 15 phút); không truyền `touch` thì định dạng mọi tab. dryRun: không làm gì, người gọi coi tab thiếu là rỗng. */
function ensureTabs_(ss, dryRun, touch) {
  if (dryRun) return;
  Object.keys(TAB_HEADERS_).forEach(function (name) {
    var headers = TAB_HEADERS_[name];
    var sh = ss.getSheetByName(name);
    var fresh = !sh;
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    else if (name === 'TuChoi' || name === 'KhachHang') suaTieuDeTuChoi_(sh, headers);
    if (TAB_SDT_TEXT_.indexOf(name) >= 0 && (fresh || !touch || touch.indexOf(name) >= 0)) {
      var actual = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return hdr_(h); });
      TEXT_COLS_.forEach(function (col) {
        var i = actual.indexOf(col);
        if (i >= 0) sh.getRange(1, i + 1, Math.max(sh.getMaxRows(), 2), 1).setNumberFormat('@');
      });
    }
  });
}

/** Sửa dòng tiêu đề tab cũ (TuChoi 3 cột; KhachHang 17 cột chưa có DongYDuAn, NgayRutLai): thêm các tiêu đề còn thiếu ở CUỐI dòng tiêu đề (so NFC + cắt khoảng trắng). Chỉ ghi ô tiêu đề, không đụng dữ liệu; đủ rồi thì không ghi gì. */
function suaTieuDeTuChoi_(sh, headers) {
  var have = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return hdr_(h); });
  var missing = headers.filter(function (h) { return have.indexOf(h) < 0; });
  if (!missing.length) return;
  // Thêm SAU cột cuối của tab (kể cả ô tiêu đề trống ở cuối), không bao giờ đè lên ô có sẵn.
  sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
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
  // Cột bên phải ghi TRƯỚC (NgayRutLai, DongYDuAn trước DongYNhanTin): chết giữa chừng thì không bao giờ có 'Đã rút lại' mà thiếu ngày rút lại
  // (lượt sau sẽ đóng dấu bằng NgayCapNhat cũ và để đồng ý mới hơn sống lại).
  runs.sort(function (a, b) { return b.col - a.col; });
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
/** Khi xóa (TuChoi loại Xóa): các cột chứa dữ liệu cá nhân và đồng ý bị xóa ở KhachHang (GhiChu xử lý riêng: thay bằng dấu 'Rút lại'). MaKhach được giữ. */
var PURGE_CLEAR_ = ['SDT', 'HoTen', 'NhuCau', 'CanXem', 'DongYBangChung', 'DongYDuAn', 'NguonChiTiet', 'PTTT', 'NguoiChamSoc'];
var RUT_LAI_ = 'Rút lại';
var DA_RUT_ = 'Đã rút lại';
var TUCHOI_SAI_ = 'SĐT trong TuChoi không hợp lệ';
var LOAI_LA_ = 'Loại yêu cầu lạ: ghi Rút lại hoặc Xóa';
var DONGY_LA_ = 'Giá trị DongYNhanTin lạ: gõ đúng Không để rút lại, hoặc xóa ô';

/** Phân bổ KhachHang sang Master_<mã> (KhachTuMaster) theo DuAnQuanTam, bất kể đồng ý; xử lý rút lại, đồng ý lại và xóa (fail closed).
 *  Trả {dayVao: {mã: số khách thêm hoặc đổi}, rutLai: số khách MỚI được ghi nhận 'Đã rút lại' lần này (hồ sơ giữ nguyên, vẫn được phân bổ với trạng thái 'Đã rút lại'),
 *  dongYLai: số khách MỚI được mở lại (điền DaDongYLai ở TuChoi), xoa: số dòng khách vừa bị xóa dữ liệu (TuChoi loại Xóa),
 *  lyDo: {tuchoi, khong}, masterLoi: [mã dự án Master chưa xóa/cập nhật được], tuChoiLoi: số dòng TuChoi lỗi,
 *  chuaCoDuAn: số dòng KhachHang có SĐT/MaKhach (không phải dấu đã xóa) mà DuAnQuanTam không có mã hợp lệ (chỉ đếm),
 *  maDuAnLa: số khách có SĐT, mã đúng dạng nhưng không mã nào có trong CauHinh (gõ nhầm tên dự án), khachLoi: số dòng KhachHang MỚI ghi Loi vì DongYNhanTin có giá trị lạ (khách đó không được nhắn)}.
 *  Cột DongYNhanTin của Master_<mã> tính theo dự án của sheet đó: 'Có' nếu coTheNhan_, 'Đã rút lại' nếu khách đã rút lại, còn lại 'Chưa rõ'.
 *  Tính hết trong bộ nhớ (kể cả quyết định cho mọi khách) rồi mới ghi; lỗi ở bước tính thì không ghi gì. dryRun: không ghi gì.
 *  Master không mở được: có rút lại/xóa thì vẫn đánh dấu ở KhachHang trước, cập nhật/xóa ở các Master mở được, ghi masterLoi + Loi, không phân bổ gì thêm
 *  (KhachHang giữ dữ liệu cá nhân của người bị xóa tới khi mọi Master xóa xong); chỉ phân bổ thuần (không có việc rút lại/xóa) thì ném lỗi trước mọi lần ghi. */
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

/** Toàn bộ giá trị tab TuChoi (dòng đầu là tiêu đề) cho tuChoiMap_, kèm cột NgayGhi và danh sách dòng cần đóng dấu ngày.
 *  la = số dòng có LoaiYeuCau lạ (có chữ nhưng không phải Xóa/Rút lại), để báo ở tab Loi.
 *  Dòng có SĐT hợp lệ mà NgayGhi trống hoặc không đọc được -> cần đóng dấu (Sheets.gs ghi now ở lần chạy thật đầu tiên). */
function readTuChoiFull_(master, nowIso) {
  var sh = master.getSheetByName('TuChoi');
  var vals = sh && sh.getLastRow() >= 1 ? sh.getDataRange().getValues() : [];
  var hd = vals.length ? vals[0].map(function (h) { return hdr_(h); }) : [];
  var iSdt = hd.indexOf('SDT'), iNgay = hd.indexOf('NgayGhi'), iLoai = hd.indexOf('LoaiYeuCau');
  var stamp = [], la = [], tuongLai = [];
  for (var r = 1; r < vals.length; r++) {
    var v = iSdt < 0 ? '' : s_(vals[r][iSdt]);
    if (!v || !normalizePhone_(v)) continue;
    if (iNgay >= 0 && ngayGhiTuongLai_(vals[r][iNgay], nowIso)) tuongLai.push(r + 1); // ngày tương lai xa: coi như chưa biết, KHÔNG ghi đè, báo Loi một lần
    else if (iNgay < 0 || !ngayGhiNorm_(vals[r][iNgay])) stamp.push(r + 1);
    if (iLoai >= 0 && loaiLa_(vals[r][iLoai])) la.push(r + 1);
  }
  return { vals: vals, stamp: stamp, la: la, tuongLai: tuongLai };
}

/** Đóng dấu NgayGhi = nowIso cho các dòng TuChoi chưa có ngày hợp lệ: một lần ghi cả cột (ô đã có ngày ghi lại đúng giá trị cũ). Gọi SAU ensureTabs_ (đã đủ tiêu đề). */
function dongDauNgayGhi_(master, rows, nowIso) {
  if (!rows.length) return;
  var sh = master.getSheetByName('TuChoi');
  if (!sh) return;
  var hd = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return hdr_(h); });
  var col = hd.indexOf('NgayGhi');
  if (col < 0) return; // không có cột: ngày vẫn là "chưa biết" (chặn tất cả), thử lại lần sau
  var n = sh.getLastRow() - 1;
  var cur = sh.getRange(2, col + 1, n, 1).getValues();
  rows.forEach(function (row) { if (row - 2 < n) cur[row - 2][0] = nowIso; });
  sh.getRange(2, col + 1, n, 1).setValues(cur);
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

/** Thêm hoặc cập nhật một khách vào đích (chỉ các cột hệ thống đang có; P.fillOnly chỉ điền ô trống). Trả true nếu có thêm/đổi.
 *  status: trạng thái đồng ý theo dự án của sheet đích (ghi vào cột DongYNhanTin thay cho giá trị chung ở KhachHang). */
function upsertDest_(P, obj, phone, status) {
  var at = P.byMa[s_(obj.MaKhach)];
  var changed = false;
  var vals = {};
  P.sys.forEach(function (c) { vals[c] = c === 'SDT' ? phone : c === 'DongYNhanTin' && status !== undefined ? status : obj[c]; });
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

/** Bằng chứng đồng ý MỚI NHẤT (ISO) của hàng rec mới hơn nghiêm ngặt mốc limit, chỉ đoạn '<mã>: Có (...)' hợp lệ có mã trong DongYDuAn (cùng quy tắc coDongYMoiHon_); '' nếu không có. */
function dongYMoiNhat_(rec, limit, nowIso) {
  var listed = codesOnly_(rec.DongYDuAn).split(';');
  var best = '';
  doanConHieuLuc_(segmentsOf_(rec.DongYBangChung, nowIso), limit).forEach(function (g) {
    if (listed.indexOf(g.ma) >= 0 && g.iso > best) best = g.iso;
  });
  return best;
}

/** Dòng TuChoi loại 'Rút lại' có ngày đã biết, DaDongYLai còn trống, và khách của SĐT đó có bằng chứng mới hơn ngày ghi:
 *  [{row (số dòng thật), phone, iso (ngày bằng chứng)}]. Chỉ tính, không ghi. */
function dongYLaiTuChoi_(tcFull, items, nowIso) {
  var vals = tcFull.vals;
  var hd = vals.length ? vals[0].map(function (h) { return hdr_(h); }) : [];
  var iSdt = hd.indexOf('SDT'), iNgay = hd.indexOf('NgayGhi'), iLoai = hd.indexOf('LoaiYeuCau'), iDa = hd.indexOf('DaDongYLai');
  var out = [];
  for (var r = 1; r < vals.length; r++) {
    var phone = iSdt < 0 ? '' : normalizePhone_(s_(vals[r][iSdt]));
    if (!phone) continue;
    if (iLoai >= 0 && loaiYeuCau_(vals[r][iLoai]) !== RUT_LAI_) continue;
    var ngay = iNgay < 0 || ngayGhiTuongLai_(vals[r][iNgay], nowIso) ? '' : ngayGhiNorm_(vals[r][iNgay]);
    if (!ngay || (iDa >= 0 && s_(vals[r][iDa]) !== '')) continue;
    var best = '';
    items.forEach(function (it) {
      if (it.phone !== phone || it.d.xoa) return;
      var e = dongYMoiNhat_(it.obj, ngay, nowIso);
      if (e > best) best = e;
    });
    if (best) out.push({ row: r + 1, phone: phone, iso: best });
  }
  return out;
}

/** Ghi DaDongYLai (ngày bằng chứng đồng ý lại) cho các dòng TuChoi (chỉ dòng DaDongYLai còn trống, do dongYLaiTuChoi_ lọc): một lần ghi cả cột, không xóa dòng nào. Gọi SAU ensureTabs_ (đã đủ tiêu đề). */
function ghiDaDongYLai_(master, list) {
  if (!list.length) return;
  var sh = master.getSheetByName('TuChoi');
  if (!sh) return;
  var hd = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return hdr_(h); });
  var col = hd.indexOf('DaDongYLai');
  if (col < 0) return;
  var n = sh.getLastRow() - 1;
  var cur = sh.getRange(2, col + 1, n, 1).getValues();
  list.forEach(function (x) { if (x.row - 2 < n) cur[x.row - 2][0] = x.iso; }); // dongYLaiTuChoi_ chỉ đưa dòng có DaDongYLai còn trống
  sh.getRange(2, col + 1, n, 1).setValues(cur);
}

/** Đặt một ô KhachHang qua khachCell_ (DongYBangChung/DongYDuAn không bị cắt ở 500, vẫn chặn công thức). */
function markKhach_(kh, st, r, col, value) {
  return markCell_(kh, st, r, col, khachCell_(col, value));
}

/** Ghi các tab đích đã dựng: bỏ qua đích có xóa dở (P.bad: dữ liệu bộ nhớ không còn khớp Sheet); đích chưa có tab thì tạo (allowCreate). */
function flushDests_(dests, allowCreate) {
  dests.forEach(function (P) {
    if (P.bad) return;
    if (!P.sheet) {
      if (!allowCreate) return;
      P.sheet = P.ss.insertSheet('KhachTuMaster');
      P.sheet.getRange(1, 1, 1, KHACH_TU_MASTER_COLS.length + 2).setValues([KHACH_TU_MASTER_COLS.concat(['', 'Ghi chú của anh'])]);
    } else if (P.headerEmpty) {
      P.sheet.getRange(1, 1, 1, KHACH_TU_MASTER_COLS.length).setValues([KHACH_TU_MASTER_COLS]);
    }
    flushKhach_(P, { origLen: P.origLen, dirty: P.dirty });
  });
}

var TUCHOI_TUONGLAI_ = 'NgayGhi ở tương lai';
var MASTER_THU_TU_ = { 'Đã rút lại': 0, 'Chưa rõ': 1, 'Có': 2 };

/** Trạng thái đồng ý của khách với dự án `code`, tính từ bản ghi KHẨN (canon): 'Đã rút lại' nếu đã rút lại (cả khách), 'Có' nếu coTheNhan_, còn lại 'Chưa rõ'. */
function trangThaiMaster_(it, code) {
  if (it.d.rutLai || it.obj.DongYNhanTin === DA_RUT_) return DA_RUT_;
  if (it.kieu === 'la') return 'Chưa rõ'; // giá trị lạ ở KhachHang: không nhắn
  return coTheNhan_(it.obj, code) ? 'Có' : 'Chưa rõ';
}

/** Mã dự án mà mỗi dòng lỗi TuChoi đã được báo ở tab Loi: {'lyDo|dòng': true}. Chỉ nguồn 'Rút lại'. */
function loiTuChoiDaBao_(master) {
  var loi = master.getSheetByName('Loi');
  var out = {};
  (loi && loi.getLastRow() >= 2 ? loi.getRange(2, 1, loi.getLastRow() - 1, 4).getValues() : []).forEach(function (x) {
    if (s_(x[1]) === RUT_LAI_) out[s_(x[3]) + '|' + s_(x[2])] = true;
  });
  return out;
}

function phanBoLocked_(dryRun, nowIso) {
  var master = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = master.getSheetByName('CauHinh');
  if (!cfg) throw new Error('Thiếu tab CauHinh trong Master_Data.');
  var khSheet0 = master.getSheetByName('KhachHang');
  if (!dryRun && khSheet0 && khSheet0.getLastRow() >= 1) suaTieuDeTuChoi_(khSheet0, TAB_HEADERS_.KhachHang); // tab KhachHang cũ 17 cột: thêm DongYDuAn, NgayRutLai (chỉ ô tiêu đề)
  var projects = projectsFromCfg_(cfg);
  var codes = projects.map(function (p) { return p.code; });
  var tuChoiRows = readTuChoiRows_(master);
  var tcFull = readTuChoiFull_(master, nowIso);
  var tuChoi = tuChoiMap_(tcFull.vals, nowIso); // {SĐT: [{loai, ngayGhi}]}; ngayGhi '' = chưa biết (chặn tất cả)
  // Dòng lỗi TuChoi (SĐT sai, loại lạ, ngày tương lai): MỘT dòng Loi cho mỗi dòng TuChoi, không lặp ở lần chạy sau (tuChoiLoi chỉ đếm dòng mới ghi).
  var daBao = null; // đọc tab Loi khi cần (lười): các dòng lỗi đã báo
  var layDaBao = function () { if (!daBao) daBao = loiTuChoiDaBao_(master); return daBao; };
  var tcLoi = [];
  var baoTuChoi = function (row, lyDo) {
    if (layDaBao()[lyDo + '|' + row]) return;
    daBao[lyDo + '|' + row] = true;
    tcLoi.push([nowIso, RUT_LAI_, row, lyDo]);
  };
  tuChoiRows.forEach(function (x) { if (!normalizePhone_(x.v)) baoTuChoi(x.row, TUCHOI_SAI_); });
  tcFull.la.forEach(function (row) { baoTuChoi(row, LOAI_LA_); }); // LoaiYeuCau lạ: vẫn là Rút lại (an toàn)
  tcFull.tuongLai.forEach(function (row) { baoTuChoi(row, TUCHOI_TUONGLAI_); });
  var tcSheet = master.getSheetByName('TuChoi');
  if (tcSheet && tcSheet.getLastRow() >= 1 && hdr_(tcSheet.getRange(1, 1, 1, 1).getValues()[0][0]) !== 'SDT') throw new Error('Tab TuChoi: cột SDT phải ở cột A.');
  var kh = readKhach_(master);
  var st = newKhachState_(kh);
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
      failedId[p.id] = /tiêu đề|thiếu cột/.test(String(e && e.message)) ? 'tab' : 'mo';
    }
  });
  var failedProjects = projects.filter(function (p) { return failedId[p.id]; });
  var failedCodes = failedProjects.map(function (p) { return p.code; });
  var out = { dayVao: {}, rutLai: 0, dongYLai: 0, xoa: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], tuChoiLoi: tcLoi.length, chuaCoDuAn: 0, maDuAnLa: 0, khachLoi: 0 };
  codes.forEach(function (c) { out.dayVao[c] = 0; });

  // Bước 1: quyết định cho mọi dòng khách (chưa ghi gì; decideDestinations_ ném lỗi thì dừng cả lần chạy).
  // Mỗi dòng có SĐT được tính lại thành bản ghi KHẨN bằng mergeCustomer_ CHỈ từ dòng KhachHang (không tin ô DongYNhanTin/DongYDuAn thô):
  // NgayRutLai được nâng lên tới ngày mọi dòng TuChoi đã biết (dòng chưa biết ngày = now, ổn định ngay trong lượt này) rồi mới suy ra đồng ý.
  var items = [];
  var khLoi = []; // dòng KhachHang có DongYNhanTin lạ, chưa báo ở Loi
  var stampPhones = {};
  tcFull.stamp.forEach(function (rowNo) {
    var iSdt = tcFull.vals[0].map(function (h) { return hdr_(h); }).indexOf('SDT');
    var p = iSdt < 0 ? '' : normalizePhone_(s_(tcFull.vals[rowNo - 1][iSdt]));
    if (p) stampPhones[p] = true;
  });
  for (var r = 1; r < kh.data.length; r++) {
    var row = kh.data[r];
    if (rowBlank_(row)) continue;
    var obj = khachObj_(kh, row);
    var phone = normalizePhone_(obj.SDT);
    var kieu = dongYKieu_(obj.DongYNhanTin);
    var optOut = kieu === 'khong';
    var daXoa = !phone && optOut && s_(obj.GhiChu) === RUT_LAI_; // dấu hồ sơ đã xóa dữ liệu: không đếm là "chưa có mã dự án"
    if ((phone || s_(obj.MaKhach)) && !daXoa && codesOnly_(obj.DuAnQuanTam) === '') out.chuaCoDuAn++;
    if (kieu === 'la') {
      // Giá trị anh gõ mà hệ thống không nhận ra: KHÔNG ghi đè chữ, khách không được nhắn (Master 'Chưa rõ'), ghi Loi một lần cho dòng này.
      obj.DongYNhanTin = 'Chưa rõ'; // chỉ trong bộ nhớ
      if (!layDaBao()[DONGY_LA_ + '|' + (r + 1)]) {
        daBao[DONGY_LA_ + '|' + (r + 1)] = true;
        khLoi.push([nowIso, RUT_LAI_, r + 1, DONGY_LA_]);
      }
    }
    // Làm nốt một lần xóa dở: CHỈ khi dòng không SĐT mang đúng dấu mà chính phanBo_ ghi lúc xóa (DongYNhanTin 'Đã rút lại' + GhiChu 'Rút lại') và còn dữ liệu cá nhân.
    // Dòng không SĐT anh tự đánh dấu 'Không' (GhiChu của anh) không bao giờ bị xóa: không động tới.
    var leftover = PURGE_CLEAR_.some(function (c) { return s_(obj[c]) !== ''; });
    var resume = !phone && optOut && s_(obj.GhiChu) === RUT_LAI_ && leftover;
    if (!phone && !resume) continue;
    var canon = obj, decRec = obj;
    if (phone) {
      var wTc = '';
      var curRut = s_(obj.NgayRutLai);
      var curRutIso = isoOrEmpty_(curRut);
      (Object.prototype.hasOwnProperty.call(tuChoi, phone) ? tuChoi[phone] : []).forEach(function (e) {
        // Dòng chưa biết ngày sẽ được đóng dấu now: tính ngay từ lượt này. Dòng ngày tương lai (không đóng dấu): giữ mốc đang có (hoặc now nếu chưa có), không đẩy mỗi lượt.
        var d = e.ngayGhi || (stampPhones[phone] ? nowIso : (curRutIso || nowIso));
        if (d > wTc) wTc = d;
      });
      var o1 = Object.assign({}, obj);
      if (wTc && (curRut === '' || (curRutIso && curRutIso < wTc))) o1.NgayRutLai = wTc; // ô rác thì giữ nguyên (mốc vô hạn); không bao giờ hạ ngày
      var m = mergeCustomer_(o1, {}, nowIso);
      canon = Object.assign({}, obj, { DongYNhanTin: m.DongYNhanTin, DongYDuAn: m.DongYDuAn, NgayRutLai: m.NgayRutLai });
      // Quyết định xóa/rút lại xét TỪNG DÒNG TuChoi với đồng ý hợp lệ của khách (suy từ bằng chứng, KHÔNG tin ô thô) nhưng CHƯA nâng mốc theo TuChoi:
      // nếu không, một dòng Rút lại mới hơn sẽ làm "đồng ý đã mở dòng Xóa cũ" chết oan và dòng Xóa cũ quay lại có hiệu lực.
      var mLow = mergeCustomer_(obj, {}, nowIso);
      decRec = Object.assign({}, obj, { DongYNhanTin: mLow.DongYNhanTin, DongYDuAn: mLow.DongYDuAn, NgayRutLai: mLow.NgayRutLai });
    }
    var dec = decideDestinations_(decRec, tuChoi, codes, nowIso);
    // Dòng của khách có TuChoi nhưng được đồng ý mới hơn mở ra (không xóa, không rút lại): không bị cuốn theo các dòng cùng SĐT.
    var lifted = !!phone && Object.prototype.hasOwnProperty.call(tuChoi, phone) && !dec.xoa && !dec.rutLai;
    if (resume) dec = { xoa: true, rutLai: false, dich: [], lyDo: 'khong' };
    if (kieu === 'la') canon = Object.assign({}, canon, { DongYNhanTin: canon.DongYNhanTin === DA_RUT_ ? DA_RUT_ : 'Chưa rõ' });
    items.push({ r: r, obj: canon, ma: s_(obj.MaKhach), phone: phone, d: dec, lifted: lifted, kieu: kieu, changed: false });
  }
  // Xóa và rút lại đều theo SĐT: mọi dòng cùng SĐT với một dòng bị xóa đều bị xóa; cùng SĐT với một dòng rút lại thì cũng rút lại (Xóa thắng).
  // Ngoại lệ: dòng đã được đồng ý mới hơn mở ra (lifted) không bị cuốn theo; SĐT của nó không dùng để xóa bản sao ở Master (chỉ khớp MaKhach của dòng bị xóa).
  var purgePhone = {}, purgeMa = {}, rutPhone = {}, liftedPhone = {};
  items.forEach(function (it) {
    if (it.d.xoa && it.phone && !purgePhone[it.phone]) purgePhone[it.phone] = it.d.lyDo;
    if (it.d.rutLai && it.phone) rutPhone[it.phone] = true;
    if (it.lifted) liftedPhone[it.phone] = true;
  });
  Object.keys(liftedPhone).forEach(function (p) { delete purgePhone[p]; });
  items.forEach(function (it) {
    if (it.d.xoa || !it.phone || it.lifted) return;
    if (purgePhone[it.phone]) it.d = { xoa: true, rutLai: false, dich: [], lyDo: purgePhone[it.phone] };
    else if (rutPhone[it.phone] && !it.d.rutLai) it.d = { xoa: false, rutLai: true, dich: it.d.dich, lyDo: 'rutlai' };
  });
  out.khachLoi = khLoi.length;
  items.forEach(function (it) {
    if (!it.d.xoa && it.phone && !it.d.dich.length && codesOnly_(it.obj.DuAnQuanTam) !== '') out.maDuAnLa++;
  });
  var purgeItems = items.filter(function (it) { return it.d.xoa; });
  purgeItems.forEach(function (it) {
    if (it.ma) purgeMa[it.ma] = true;
    out.xoa++;
    out.lyDo[it.d.lyDo === 'xoa' ? 'tuchoi' : 'khong']++;
  });
  if (purgeItems.length && kh.idx.DongYNhanTin < 0) throw new Error('Tab KhachHang thiếu cột DongYNhanTin, không ghi nhận được việc rút lại.');

  // Đã rút lại thì chắc chắn 'Đã rút lại' + có NgayRutLai (hồ sơ GIỮ NGUYÊN). Ghi các ô đồng ý đã sửa của KhachHang (DongYNhanTin, DongYDuAn, NgayRutLai) trong stMark,
  // cùng lần ghi với dấu xóa, trước mọi thao tác khác.
  var stMark = newKhachState_(kh);
  var rutItems = items.filter(function (it) { return it.d.rutLai; });
  rutItems.forEach(function (it) {
    if (it.obj.DongYNhanTin !== DA_RUT_) { it.obj.DongYNhanTin = DA_RUT_; it.obj.DongYDuAn = ''; } // rút lại do TuChoi chưa biết ngày/cùng SĐT: chặn tất cả
    if (s_(it.obj.NgayRutLai) === '') it.obj.NgayRutLai = nowIso;
  });
  items.forEach(function (it) {
    if (it.d.xoa || !it.phone) return;
    ['DongYNhanTin', 'DongYDuAn', 'NgayRutLai'].forEach(function (c) {
      if (c === 'DongYNhanTin' && it.kieu === 'la' && it.obj.DongYNhanTin !== DA_RUT_) return; // chữ lạ của anh giữ nguyên (trừ khi đã rút lại thật)
      var changed = markKhach_(kh, stMark, it.r, c, it.obj[c]);
      if (changed && c === 'DongYNhanTin' && it.obj.DongYNhanTin === DA_RUT_) it.changed = true;
    });
  });
  var lai = dongYLaiTuChoi_(tcFull, items, nowIso);
  var laiPhones = {};
  lai.forEach(function (x) { laiPhones[x.phone] = true; });
  out.dongYLai = Object.keys(laiPhones).length;

  // Bước 2: dựng thay đổi cho từng đích trong bộ nhớ.
  dests.forEach(function (P) {
    planPurge_(P, purgeMa, purgePhone);
    P.origLen = P.data.length;
    P.dirty = {};
    indexByMa_(P);
  });
  // Phân bổ theo DuAnQuanTam (không phụ thuộc đồng ý; đồng ý chỉ đổi ô trạng thái). Có Master hỏng thì không phân bổ gì.
  var allocPairs = {};
  var allocs = [];
  if (!failedCodes.length) {
    items.forEach(function (it) {
      if (it.d.xoa || !it.ma || !it.d.dich.length) return;
      var seen = {};
      it.d.dich.forEach(function (code) {
        var p = projects.filter(function (x) { return x.code === code; })[0];
        if (!p || seen[p.id + code]) return;
        seen[p.id + code] = true;
        allocPairs[byId[p.id].label + '|' + it.ma] = true;
        allocs.push({ it: it, code: code, P: byId[p.id] });
      });
    });
  }
  // Quét trạng thái của MỌI dòng sẵn có ở các Master mở được, khớp theo MaKhach HOẶC SĐT chuẩn hóa (dòng cũ khác MaKhach cùng SĐT cũng bị),
  // kể cả dự án khách không còn quan tâm hay khi không phân bổ được: trạng thái luôn tính lại, không bao giờ giữ 'Có' cũ. Khớp nhiều khách thì lấy mức hạn chế nhất.
  var byMaItem = {}, byPhoneItems = {};
  items.forEach(function (it) {
    if (it.d.xoa) return;
    if (it.ma && !byMaItem[it.ma]) byMaItem[it.ma] = it;
    if (it.phone) (byPhoneItems[it.phone] = byPhoneItems[it.phone] || []).push(it);
  });
  var ha = 0;
  dests.forEach(function (P) {
    var ci = P.idx.DongYNhanTin;
    if (ci < 0) return;
    for (var rr = 1; rr < P.data.length; rr++) {
      var ma = s_(P.data[rr][P.idx.MaKhach]);
      var ph = normalizePhone_(P.data[rr][P.idx.SDT]);
      var own = ma ? byMaItem[ma] : undefined;
      if (own && allocPairs[P.label + '|' + ma]) continue; // upsertDest_ ghi trạng thái
      var cands = own ? [own] : [];
      (ph && byPhoneItems[ph] ? byPhoneItems[ph] : []).forEach(function (x) { if (x !== own) cands.push(x); });
      if (!cands.length) continue;
      var want = DA_RUT_;
      var best = 3;
      cands.forEach(function (x) {
        var t = trangThaiMaster_(x, P.label);
        if (MASTER_THU_TU_[t] < best) { best = MASTER_THU_TU_[t]; want = t; }
      });
      if (s_(P.data[rr][ci]) === want) continue;
      if (s_(P.data[rr][ci]) === 'Có') ha++; // hạ 'Có' xuống: việc thu hẹp quyền nhắn, không được hoãn vì Master khác hỏng
      while (P.data[rr].length <= ci) P.data[rr].push('');
      P.data[rr][ci] = want;
      if (rr < P.origLen) (P.dirty[rr] = P.dirty[rr] || {})[ci] = true;
      if (want === DA_RUT_) cands.forEach(function (x) { if (trangThaiMaster_(x, P.label) === DA_RUT_) x.changed = true; });
    }
  });
  allocs.forEach(function (a) {
    var trangThai = trangThaiMaster_(a.it, a.code);
    var at = a.P.byMa[a.it.ma];
    if (at !== undefined && trangThai === DA_RUT_ && s_(a.P.data[at][a.P.idx.DongYNhanTin]) !== DA_RUT_) a.it.changed = true;
    if (upsertDest_(a.P, a.it.obj, a.it.phone, trangThai)) out.dayVao[a.code]++;
  });
  var rutKeys = {};
  rutItems.forEach(function (it) { if (it.changed) rutKeys[it.phone || it.ma] = true; });
  out.rutLai = Object.keys(rutKeys).length; // khách MỚI được ghi nhận rút lại ở lần chạy này
  // Master hỏng mà không có việc rút lại/xóa/hạ quyền nhắn MỚI nào cần làm: ném lỗi trước mọi lần ghi (phân bổ thuần không được làm nửa vời).
  if (failedCodes.length && !purgeItems.length && !out.rutLai && !ha) {
    var moFail = failedProjects.filter(function (p) { return failedId[p.id] === 'mo'; }).map(function (p) { return p.code; });
    if (moFail.length) throw new Error('Master ' + moFail.join(', ') + ' không mở được (tab KhachTuMaster).');
    throw new Error('Không mở được hoặc tiêu đề sai ở tab KhachTuMaster của dự án: ' + failedCodes.join(', ') + '.');
  }
  out.masterLoi = failedCodes.slice();
  if (dryRun) return out;

  // Bước 3: ghi. Dấu rút lại/xóa ở KhachHang trước, rồi (rút lại) trạng thái ở Master ngay sau; xóa thì xóa bản sao ở Master rồi mới xóa dữ liệu cá nhân ở KhachHang
  // (chết giữa chừng thì KhachHang còn SĐT, lần sau làm lại). Còn Master hỏng/xóa chưa hết thì KhachHang giữ nguyên dữ liệu cá nhân.
  ensureTabs_(master, false, []); // chỉ tab mới tạo được định dạng; tab cũ giữ nguyên (không đổi gì thì không ghi gì)
  flushLoi_(master, tcLoi.concat(khLoi)); // cảnh báo không chặn việc khác
  dongDauNgayGhi_(master, tcFull.stamp, nowIso); // dòng TuChoi chưa có ngày: hệ thống đóng dấu now (NgayRutLai đã tính bằng đúng ngày này)
  // Dấu TRƯỚC khi xóa dữ liệu cá nhân (chết giữa chừng thì không có dữ liệu nào mà thiếu dấu): 'Đã rút lại' + GhiChu 'Rút lại'; cùng lần ghi này có cả trạng thái rút lại hiện rõ.
  purgeItems.forEach(function (it) {
    markKhach_(kh, stMark, it.r, 'DongYNhanTin', DA_RUT_);
    if (kh.idx.GhiChu >= 0) markCell_(kh, stMark, it.r, 'GhiChu', RUT_LAI_);
  });
  if (kh.sheet) flushKhach_(kh, stMark);
  ghiDaDongYLai_(master, lai); // sau khi KhachHang đã đúng; chết giữa chừng thì lần sau ghi lại (ô còn trống)
  var matchPurge = function (ma, ph) { return !!((ma && purgeMa[ma]) || (ph && purgePhone[ph])); };
  var loi = [];
  failedCodes.forEach(function (c) { loi.push([nowIso, RUT_LAI_, 0, 'Không mở được Master ' + c]); });
  if (purgeItems.length) {
    dests.forEach(function (P) {
      if (P.sheet && !deleteMatching_(P, matchPurge)) {
        P.bad = true;
        out.masterLoi.push(P.label);
        loi.push([nowIso, RUT_LAI_, 0, 'Không xóa được dòng ở Master ' + P.label]);
      }
    });
  }
  if (loi.length) {
    flushLoi_(master, loi);
    flushDests_(dests, !failedCodes.length); // cập nhật trạng thái ở các Master mở được; KhachHang giữ dữ liệu cá nhân (xóa dở)
    return out;
  }
  purgeItems.forEach(function (it) {
    PURGE_CLEAR_.forEach(function (c) { markKhach_(kh, st, it.r, c, ''); });
    markCell_(kh, st, it.r, 'NgayCapNhat', nowIso);
  });
  if (kh.sheet) flushKhach_(kh, st); // không có xóa thì không có ô nào để ghi: trạng thái Master (rút lại/đồng ý lại) ghi NGAY sau dấu ở KhachHang
  flushDests_(dests, true);
  return out;
}

/** Đặt giá trị một ô của KhachHang trong bộ nhớ và đánh dấu để ghi (chỉ khi đổi). */
function markCell_(kh, st, r, col, value) {
  var ci = kh.idx[col];
  if (ci < 0) return false;
  var row = kh.data[r];
  while (row.length <= ci) row.push('');
  if (s_(row[ci]) === s_(value)) return false;
  row[ci] = value;
  (st.dirty[r] = st.dirty[r] || {})[ci] = true;
  return true;
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
  if (/^Master .+ không mở được/.test(msg)) return 'LOI_MASTER';
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

/** Mã dự án an toàn để đưa vào tin Telegram: chỉ mã đúng dạng (chữ thường, số, gạch ngang), còn lại thành 'mã lạ' (không để tên người gõ nhầm ở CauHinh lọt ra). */
function maDuAnAnToan_(list) {
  return (list || []).map(function (c) {
    c = String(c);
    return /^[a-z][a-z0-9-]{2,39}$/.test(c) ? c : 'mã lạ';
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
    if (res.loi === 'LOI_MASTER') { // phanBo_ ném 'Master <mã>, <mã> không mở được': chỉ lấy mã dự án (maDuAnAnToan_ lọc lại khi đưa vào tin)
      var mm = /^Master (.+?) không mở được/.exec(String(e && e.message));
      if (mm) res.masterLoiThrow = mm[1].split(', ');
    }
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
  return [L.doc, L.moi, L.trung, L.loi, C.doc, C.moi, C.trung, C.loi, P.xoa, P.rutLai, P.dongYLai, P.lyDo.tuchoi, P.lyDo.khong, vao, P.tuChoiLoi, P.khachLoi].every(function (n) { return !n; });
}

/** Ghi NhatKy và báo Telegram cho một lần chạy (không dryRun). Lần chạy rảnh không ghi, trừ một dòng "nhịp" mỗi ngày VN. Ném lỗi nếu ghi NhatKy hỏng; người gọi xử lý. */
function ghiVaBao_(res, nguon, now, ms) {
  var props = PropertiesService.getScriptProperties();
  var L = res.landing || { doc: 0, moi: 0, trung: 0, loi: 0 };
  var C = res.crm || { doc: 0, moi: 0, trung: 0, loi: 0 };
  var P = res.phanBo || { rutLai: 0, dongYLai: 0, xoa: 0, lyDo: { tuchoi: 0, khong: 0 }, masterLoi: [], dayVao: {}, tuChoiLoi: 0, khachLoi: 0 };
  var masterLoi = (P.masterLoi && P.masterLoi.length) ? P.masterLoi : (res.masterLoiThrow || []);
  var vao = 0;
  Object.keys(P.dayVao || {}).forEach(function (k) { vao += P.dayVao[k]; });
  var loiSo = L.loi + C.loi + (P.tuChoiLoi || 0) + (P.khachLoi || 0) + masterLoi.length + (res.loi && res.loi !== 'LOI_MASTER' ? 1 : 0);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (chayRanh_(res)) {
    var homNay = ngayVN_(now);
    if (String(props.getProperty(NHIP_KEY_) || '') !== homNay) {
      ghiNhatKy_(ss, { now: now, nguon: nguon, doc: 0, moi: 0, trung: 0, loi: 0, ghiChu: NHIP_GHI_CHU_ });
      props.setProperty(NHIP_KEY_, homNay);
    }
  } else {
    var ghiChu = 'rutlai=' + P.rutLai + ' dongylai=' + P.dongYLai + ' xoa=' + P.xoa + ' tuchoi=' + P.lyDo.tuchoi + ' khong=' + P.lyDo.khong + ' vao=' + vao + ' ms=' + Math.max(0, Math.round(ms || 0));
    if (res.loi) ghiChu += ' ' + res.loi;
    ghiNhatKy_(ss, { now: now, nguon: nguon, doc: L.doc + C.doc, moi: L.moi + C.moi, trung: L.trung + C.trung, loi: loiSo, ghiChu: ghiChu });
  }
  props.setProperty(CHAY_CUOI_KEY_, String(now.getTime()));
  var loiDong = L.loi + C.loi >= LOI_DONG_NGUONG_; // nhiều dòng khách hỏng cùng một lần: báo một tin (cùng khóa chống lặp 6 giờ)
  var loiTuChoi = P.tuChoiLoi || 0; // dòng TuChoi lỗi MỚI ghi ở Loi lần này: một yêu cầu rút lại gõ sai phải hiện ra
  var loiKhach = P.khachLoi || 0; // dòng KhachHang có DongYNhanTin lạ MỚI ghi ở Loi lần này (khách đó không được nhắn)
  if (!res.loi && !loiDong && !loiTuChoi && !loiKhach) ghiNhanSach_(now.getTime());
  else {
    ghiNhanLoi_();
    if (!res.loi) {
      if (loiDong) baoLoi_('LOI_DONG', L.loi + C.loi, now);
      if (loiTuChoi) baoLoi_('LOI_TUCHOI', loiTuChoi, now);
      if (loiKhach) baoLoi_('LOI_DONG_Y', loiKhach, now);
    }
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
  var maLa = 0; // khách có mã đúng dạng nhưng không mã nào có trong CauHinh
  var chuaCoMa = 0; // cùng định nghĩa với chuaCoDuAn của phanBo_: có SĐT hoặc MaKhach mà DuAnQuanTam không có mã hợp lệ
  var rutLai = 0; // khách có NgayRutLai rơi vào hôm qua
  var kh = master.getSheetByName('KhachHang');
  if (kh && kh.getLastRow() >= 2) {
    var vals = kh.getDataRange().getValues();
    var headers = vals[0].map(function (h) { return hdr_(h); });
    var iTao = headers.indexOf('NgayTao');
    var iNguon = headers.indexOf('NguonGoc');
    var iSdt = headers.indexOf('SDT');
    var iMa = headers.indexOf('MaKhach');
    var iDa = headers.indexOf('DuAnQuanTam');
    var iRut = headers.indexOf('NgayRutLai');
    var iDong = headers.indexOf('DongYNhanTin');
    var iGhi = headers.indexOf('GhiChu');
    var maCauHinh = {};
    var coCauHinh = false;
    try {
      var cfgSh = master.getSheetByName('CauHinh');
      if (cfgSh) { projectsFromCfg_(cfgSh).forEach(function (p) { maCauHinh[p.code] = true; }); coCauHinh = true; }
    } catch (e0) { /* không đọc được CauHinh: không đếm mã lạ */ }
    for (var r = 1; r < vals.length; r++) {
      if (iTao >= 0 && ngayVN_(vals[r][iTao]) === homQua) {
        moi++;
        var g = iNguon >= 0 ? String(vals[r][iNguon] == null ? '' : vals[r][iNguon]).trim() : '';
        nguon[g === 'Landing' || g === 'CRM' ? g : 'Khac']++;
      }
      var coSdt = iSdt >= 0 && normalizePhone_(vals[r][iSdt]);
      var coMa = iMa >= 0 && s_(vals[r][iMa]);
      var daXoa = !coSdt && iDong >= 0 && iGhi >= 0 && dongYKieu_(vals[r][iDong]) === 'khong' && s_(vals[r][iGhi]) === RUT_LAI_;
      var maHopLe = iDa < 0 ? '' : codesOnly_(vals[r][iDa]);
      if ((coSdt || coMa) && !daXoa && maHopLe === '') chuaCoMa++;
      if (coSdt && !daXoa && maHopLe !== '' && coCauHinh && !maHopLe.split(';').some(function (c) { return maCauHinh[c]; })) maLa++;
      if (iRut >= 0 && ngayVN_(vals[r][iRut]) === homQua) rutLai++;
    }
  }
  var dongYLai = 0; // dòng TuChoi có DaDongYLai rơi vào hôm qua
  var tc = master.getSheetByName('TuChoi');
  if (tc && tc.getLastRow() >= 2) {
    var tv = tc.getDataRange().getValues();
    var iLai = tv[0].map(function (h) { return hdr_(h); }).indexOf('DaDongYLai');
    for (var k = 1; k < tv.length && iLai >= 0; k++) if (ngayVN_(tv[k][iLai]) === homQua) dongYLai++;
  }
  var parts = [];
  if (nguon.Landing) parts.push('Landing ' + nguon.Landing);
  if (nguon.CRM) parts.push('CRM ' + nguon.CRM);
  if (nguon.Khac) parts.push('Khác ' + nguon.Khac);
  var text = '📊 Master_Data hôm qua: ' + moi + ' khách mới' + (parts.length ? ' (' + parts.join(', ') + ')' : '') +
    '. Chưa có mã dự án: ' + chuaCoMa + '. Mã dự án không có trong CauHinh: ' + maLa + '. Dòng lỗi: ' + demDong_(master, 'Loi') + '. Rút lại hôm qua: ' + rutLai + '. Điền lại hôm qua: ' + dongYLai + '.';
  var cuoi = Number(PropertiesService.getScriptProperties().getProperty(CHAY_CUOI_KEY_));
  if (cuoi > 0) text += ' Lần chạy cuối: ' + Math.max(0, Math.floor((now.getTime() - cuoi) / 60000)) + ' phút trước.';
  sendTelegram_(text);
  return text;
}

/** Cài lịch tự chạy (an toàn khi chạy nhiều lần): tạo trigger MỚI trước, rồi mới xóa cái cũ trùng hàm, nên tạo lỗi thì lịch cũ còn nguyên. Mỗi 15 phút gộp; tin tóm tắt chạy khoảng 8-9 giờ mỗi ngày (Apps Script tự chọn phút ngẫu nhiên trong giờ). Trigger khác giữ nguyên. */
function caiLich_() {
  if (!cauHinhHopLe_()) return false;
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
  return true;
}

/** CauHinh có ít nhất một dòng có maDuAn và (landingSheetId hoặc masterSheetId). Không có/không đọc được = false (không cài lịch chạy vào hư không). */
function cauHinhHopLe_() {
  try {
    var cfg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CauHinh');
    if (!cfg || cfg.getLastRow() < 2) return false;
    var vals = cfg.getDataRange().getValues();
    var hd = vals[0].map(function (h) { return hdr_(h); });
    var iC = hd.indexOf('maDuAn'), iL = hd.indexOf('landingSheetId'), iM = hd.indexOf('masterSheetId');
    if (iC < 0) return false;
    for (var r = 1; r < vals.length; r++) {
      if (s_(vals[r][iC]) && ((iL >= 0 && s_(vals[r][iL])) || (iM >= 0 && s_(vals[r][iM])))) return true;
    }
    return false;
  } catch (e) {
    return false;
  }
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
    lines.push('Phân bổ: vào dự án ' + vao + ', chưa có mã dự án ' + P.chuaCoDuAn + ', rút lại ' + P.rutLai + ', đồng ý lại ' + P.dongYLai + ', xóa ' + P.xoa + ', Master lỗi ' + (P.masterLoi || []).length + '.');
    lines.push('Dòng TuChoi lỗi: ' + (P.tuChoiLoi || 0) + '. Giá trị trạng thái lạ: ' + (P.khachLoi || 0) + '. Mã dự án không có trong CauHinh: ' + (P.maDuAnLa || 0) + '.');
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
  if (!caiLich_()) {
    SpreadsheetApp.getUi().alert('Chưa có CauHinh hợp lệ (tab CauHinh cần ít nhất một dòng có maDuAn và Sheet id). Chưa cài lịch.');
    return;
  }
  SpreadsheetApp.getUi().alert('Đã cài lịch: gộp mỗi 15 phút, tin tóm tắt khoảng 8-9 giờ mỗi ngày.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Master_Data')
    .addItem('Gộp ngay', 'gopNgay')
    .addItem('Chạy thử (không ghi)', 'chayThu')
    .addItem('Cài lịch tự động', 'caiLichTuDong')
    .addToUi();
}
