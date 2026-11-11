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
  var coBangChung = /^Có \(\d{4}-\d{2}-\d{2}T[\d:.]+Z, mẫu \S+, [^\n\r]*\)$/.test(dongYRaw);
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
