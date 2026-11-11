// Master_Data: logic thuần (không gọi dịch vụ Google), test bằng Node qua helpers.mjs.

/** Chuẩn hóa SĐT Việt Nam: 0xxxxxxxxx. Sai dạng → ''.
 *  Khác Code.gs của landing: số 9 chữ số bắt đầu 3,5,7,8,9 được thêm 0,
 *  vì Google Sheets bỏ số 0 đầu khi đổi ô thành số. */
function normalizePhone_(s) {
  var d = String(s == null ? '' : s).replace(/[\s.()\-]/g, '');
  if (/^\+?84\d{9,10}$/.test(d)) d = '0' + d.replace(/^\+?84/, '');
  if (/^[35789]\d{8}$/.test(d)) d = '0' + d;
  return /^0\d{9,10}$/.test(d) ? d : '';
}

/** Thứ tự cột tab KhachHang (spec mục 5, không có HanGiu). */
var KHACH_COLS = ['MaKhach', 'SDT', 'HoTen', 'NgayTao', 'NgayCapNhat', 'NguonGoc', 'NguonChiTiet', 'DuAnQuanTam', 'NhuCau', 'CanXem', 'PTTT', 'DongYNhanTin', 'DongYBangChung', 'TrangThaiCRM', 'TrangThaiChamSoc', 'NguoiChamSoc', 'GhiChu'];

/** Chữ đưa vào Sheet: cắt 500 ký tự, chặn công thức (giống cell_ của landing). */
function cell_(v) {
  var s = (v == null ? '' : String(v)).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Đọc một dòng Sheet landing thành bản ghi khách. Ánh xạ theo TÊN cột, không theo vị trí. */
/** Giữ lại các mã dự án đúng dạng (a-z, 0-9, gạch ngang; bắt đầu bằng chữ), bỏ 'khong-ro' và mọi thứ lạ; ngăn bằng ';'. */
function codesOnly_(v) {
  var out = [];
  String(v || '').toLowerCase().split(';').forEach(function (c) {
    c = c.trim();
    if (/^[a-z][a-z0-9-]{2,39}$/.test(c) && c !== 'khong-ro' && out.indexOf(c) < 0) out.push(c);
  });
  return out.join(';');
}

/** Chuỗi ISO hợp lệ (năm 4 chữ số) hoặc ''. Nhận chuỗi ngày/giờ đã đọc từ Sheet. */
function isoOrEmpty_(v) {
  var m = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(String(v || '')) ? Date.parse(v) : NaN;
  return isNaN(m) ? '' : new Date(m).toISOString();
}

function parseLandingRow_(headers, row) {
  var get = function (name) {
    var i = headers.indexOf(name);
    var v = i < 0 || i >= row.length ? '' : row[i];
    if (v == null) return '';
    if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? '' : v.toISOString();
    return String(v).trim();
  };
  var sdt = normalizePhone_(get('SĐT'));
  if (!sdt) return { ok: false, lyDo: 'SĐT không hợp lệ' };
  var rec = {};
  for (var k = 0; k < KHACH_COLS.length; k++) rec[KHACH_COLS[k]] = '';
  var can = [get('Căn xem'), get('Loại căn')].filter(function (x) { return x; }).join(' · ');
  var duAn = codesOnly_(get('Dự án'));
  var iDongY = headers.indexOf('Đồng ý nhận tin');
  var dongYRaw = iDongY < 0 || iDongY >= row.length || typeof row[iDongY] !== 'string' ? '' : row[iDongY];
  // Bằng chứng đồng ý phải đúng khuôn Code.gs ghi: Có (<ISO>, mẫu <phiên bản>, <trang>), không cắt khoảng trắng.
  var coBangChung = hasConsentEvidence_(dongYRaw);
  var dongY = dongYRaw;
  rec.SDT = sdt;
  rec.HoTen = cell_(get('Họ tên'));
  rec.NgayTao = isoOrEmpty_(get('Thời gian'));
  rec.NguonGoc = 'Landing';
  rec.NguonChiTiet = cell_(get('Nguồn'));
  rec.DuAnQuanTam = duAn;
  rec.NhuCau = cell_(get('Nhu cầu'));
  rec.CanXem = cell_(can);
  rec.PTTT = cell_(get('PTTT'));
  rec.DongYNhanTin = coBangChung ? 'Có' : 'Chưa rõ';
  rec.DongYBangChung = coBangChung ? dongY : '';
  return { ok: true, rec: rec };
}

/** Bằng chứng đồng ý đúng khuôn Code.gs ghi (dùng chung cho parseLandingRow_ và dongYThang_). */
function hasConsentEvidence_(s) {
  return /^Có \(\d{4}-\d{2}-\d{2}T[\d:.]+Z, mẫu \S+, [^\n\r]*\)$/.test(String(s == null ? '' : s));
}

/** Giá trị ô Sheets -> chuỗi: Date -> ISO (Date hỏng -> ''), null -> '', còn lại String().trim(). */
function s_(v) {
  if (v == null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? '' : v.toISOString();
  return String(v).trim();
}

/** Hợp hai danh sách mã dự án: lọc bằng codesOnly_ từng bên, thứ tự cũ trước, không trùng. */
function unionList_(a, b) {
  return codesOnly_(codesOnly_(a) + ';' + codesOnly_(b));
}
function mergeNguon_(a, b) {
  var toks = [];
  (s_(a) + '+' + s_(b)).split(/[;+]/).forEach(function (x) {
    x = x.trim();
    if (x && toks.indexOf(x) < 0) toks.push(x);
  });
  var order = ['Landing', 'CRM'];
  toks.sort(function (x, y) {
    var i = order.indexOf(x), j = order.indexOf(y);
    return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
  });
  return toks.join('+');
}

/** Đồng ý nhận tin: 'Không' thắng; 'Có' chỉ tính khi có bằng chứng đúng khuôn; còn lại 'Chưa rõ'. */
function dongYThang_(a, b) {
  var noEv = function (e) { return /^Có \(/.test(e) ? '' : e; };
  if (a.v === 'Không') return { v: 'Không', e: noEv(a.e) };
  if (b.v === 'Không') return { v: 'Không', e: noEv(b.e) };
  if (a.v === 'Có' && hasConsentEvidence_(a.e)) return a;
  if (b.v === 'Có' && hasConsentEvidence_(b.e)) return b;
  return { v: 'Chưa rõ', e: '' };
}

/** Hợp nhất hai bản ghi khách trùng SĐT (spec mục 6). Trả đối tượng mới, không sửa đầu vào.
 *  Chữ đầu vào phải đã qua cell_; Sheets.gs (Task 6-7) phải áp cell_ khi ghi ra Sheet. */
function mergeCustomer_(existing, incoming, nowIso) {
  var ex = existing || {}, inc = incoming || {};
  var out = {};
  for (var k = 0; k < KHACH_COLS.length; k++) {
    var c = KHACH_COLS[k];
    out[c] = s_(ex[c]) !== '' ? s_(ex[c]) : s_(inc[c]);
  }
  out.SDT = normalizePhone_(ex.SDT) || normalizePhone_(inc.SDT);
  out.DuAnQuanTam = unionList_(ex.DuAnQuanTam, inc.DuAnQuanTam);
  out.NguonGoc = mergeNguon_(ex.NguonGoc, inc.NguonGoc);
  var nt = dongYThang_({ v: s_(ex.DongYNhanTin), e: s_(ex.DongYBangChung) }, { v: s_(inc.DongYNhanTin), e: s_(inc.DongYBangChung) });
  out.DongYNhanTin = nt.v;
  out.DongYBangChung = nt.e;
  out.DongYNhanTin = out.DongYNhanTin === 'Có' || out.DongYNhanTin === 'Không' ? out.DongYNhanTin : 'Chưa rõ';
  out.NgayCapNhat = nowIso;
  return out;
}

/** Quyết định đích phân bổ của một khách (spec mục 7, 9).
 *  tuChoi: Set hoặc mảng SĐT (mọi dạng); projectCodes: mã dự án có tab Master_<mã>.
 *  chan: khách từ chối hoặc DongYNhanTin='Không' → không vào tab nào.
 *  'Chưa rõ' không bị chặn ở đây (chỉ không nhắn hàng loạt). Không sửa đầu vào. */
function decideDestinations_(rec, tuChoi, projectCodes) {
  rec = rec || {};
  var phone = normalizePhone_(rec.SDT);
  var blocked = false;
  if (phone && tuChoi && typeof tuChoi.forEach === 'function') {
    tuChoi.forEach(function (v) { if (normalizePhone_(v) === phone) blocked = true; });
  }
  if (blocked || String(rec.DongYNhanTin == null ? '' : rec.DongYNhanTin).trim() === 'Không') {
    return { chan: true, chua: false, dich: [] };
  }
  if (!phone) return { chan: false, chua: true, dich: [] };
  var known = (projectCodes || []).map(function (c) { return String(c).toLowerCase(); });
  var dich = [];
  codesOnly_(rec.DuAnQuanTam).split(';').forEach(function (c) {
    if (c && known.indexOf(c) >= 0 && dich.indexOf(c) < 0) dich.push(c);
  });
  return { chan: false, chua: dich.length === 0, dich: dich };
}
