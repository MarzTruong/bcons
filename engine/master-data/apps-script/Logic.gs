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
