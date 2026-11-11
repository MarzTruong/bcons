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
/** Tab có cột SĐT phải định dạng văn bản, nếu không Google Sheets bỏ số 0 đầu. */
var TAB_SDT_TEXT_ = ['KhachHang', 'NhapCRM', 'TuChoi', 'ChuaPhanDuAn'];

/** Tạo tab còn thiếu (kèm tiêu đề) và đặt cột SĐT là văn bản. dryRun: không làm gì, người gọi coi tab thiếu là rỗng. */
function ensureTabs_(ss, dryRun) {
  if (dryRun) return;
  Object.keys(TAB_HEADERS_).forEach(function (name) {
    var headers = TAB_HEADERS_[name];
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (TAB_SDT_TEXT_.indexOf(name) >= 0) {
      var actual = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(function (h) { return String(h).trim(); });
      var i = actual.indexOf('SDT');
      if (i >= 0) sh.getRange(1, i + 1, Math.max(sh.getMaxRows(), 2), 1).setNumberFormat('@');
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
  ensureTabs_(master, dryRun);
  var kh = readKhach_(master);
  var out = { doc: 0, moi: 0, trung: 0, loi: 0 };
  var origLen = kh.data.length; // dòng có chỉ số >= origLen là khách mới của lần chạy này
  var dirty = {}; // chỉ số dòng cũ -> {chỉ số cột: true}
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
      var rec = parsed.rec;
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
          if (at < origLen) (dirty[at] = dirty[at] || {})[ci] = true;
        });
        src.marks[r] = merged.MaKhach;
        out.trung++;
      } else {
        rec.MaKhach = nextMaKhach_(kh.maList);
        rec.NgayTao = rec.NgayTao || nowIso;
        rec.NgayCapNhat = nowIso;
        kh.data.push(khachRow_(kh, null, rec));
        kh.byPhone[rec.SDT] = kh.data.length - 1;
        kh.maList.push(rec.MaKhach);
        src.marks[r] = rec.MaKhach;
        out.moi++;
      }
    }
  });
  if (dryRun) return out;

  // Bước 2: ghi theo lô. Thứ tự: KhachHang trước, đánh dấu 'Đã gộp' sau cùng
  // (chết giữa chừng thì lần sau khớp theo SĐT, không nhân đôi).
  // (a) khách mới: một lần ghi vào vùng ngay sau dữ liệu, SĐT đặt định dạng văn bản trước.
  var newRows = kh.data.slice(origLen);
  if (newRows.length) {
    var width = 0;
    KHACH_COLS.forEach(function (c) { if (kh.idx[c] + 1 > width) width = kh.idx[c] + 1; });
    var block = newRows.map(function (rw) { return rw.slice(0, width); });
    kh.sheet.getRange(origLen + 1, kh.idx.SDT + 1, block.length, 1).setNumberFormat('@');
    kh.sheet.getRange(origLen + 1, 1, block.length, width).setValues(block);
  }
  // (b) khách cũ: chỉ các ô đổi, gom các dòng liền nhau của cùng một cột.
  var perCol = {};
  Object.keys(dirty).forEach(function (rk) {
    Object.keys(dirty[rk]).forEach(function (ck) { (perCol[ck] = perCol[ck] || []).push(Number(rk)); });
  });
  Object.keys(perCol).forEach(function (ck) {
    var rows = perCol[ck].sort(function (a, b) { return a - b; });
    var start = 0;
    for (var k = 1; k <= rows.length; k++) {
      if (k < rows.length && rows[k] === rows[k - 1] + 1) continue;
      var block2 = rows.slice(start, k).map(function (ri) { return [kh.data[ri][Number(ck)]]; });
      kh.sheet.getRange(rows[start] + 1, Number(ck) + 1, block2.length, 1).setValues(block2);
      start = k;
    }
  });
  // (c) dòng lỗi: một lần ghi.
  if (loiRows.length) {
    var loiSheet = master.getSheetByName('Loi');
    loiSheet.getRange(loiSheet.getLastRow() + 1, 1, loiRows.length, 4).setValues(loiRows);
  }
  // (d) đánh dấu 'Đã gộp': mỗi Sheet landing một lần ghi cả đoạn cột, ô không đổi ghi lại đúng giá trị cũ.
  sources.forEach(function (src) {
    if (!Object.keys(src.marks).length) return;
    var col = [];
    for (var r = 1; r < src.values.length; r++) {
      col.push([r in src.marks ? src.marks[r] : (src.values[r][src.iGop] == null ? '' : src.values[r][src.iGop])]);
    }
    src.sheet.getRange(2, src.iGop + 1, col.length, 1).setValues(col);
  });
  return out;
}
