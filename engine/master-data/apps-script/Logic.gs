// Master_Data: logic thuần (không gọi dịch vụ Google), test bằng Node qua helpers.mjs.

/** Chuẩn hóa SĐT Việt Nam: 0xxxxxxxxx. Sai dạng → ''.
 *  Khác Code.gs của landing: số 9 chữ số bắt đầu 3,5,7,8,9 được thêm 0,
 *  vì Google Sheets bỏ số 0 đầu khi đổi ô thành số. */
function normalizePhone_(s) {
  var d = String(s == null ? '' : s).replace(/^(\s*\+?\s*84\s*)\(0\)/, '$1').replace(/[\s.()\-]/g, '');
  if (/^\+?84\d{9,10}$/.test(d)) d = '0' + d.replace(/^\+?84/, '');
  if (/^[35789]\d{8}$/.test(d)) d = '0' + d;
  return /^0\d{9,10}$/.test(d) ? d : '';
}

/** Thứ tự cột tab KhachHang (spec mục 5, không có HanGiu). 17 cột đầu giữ nguyên vị trí; DongYDuAn, NgayRutLai thêm ở cuối.
 *  DongYNhanTin = trạng thái chung: 'Có' | 'Chưa rõ' | 'Đã rút lại'. DongYDuAn = mã dự án đã đồng ý, ngăn ';'.
 *  DongYBangChung = mỗi dự án một đoạn '<mã>: <bằng chứng>', ngăn ' || '. NgayRutLai = ISO hoặc rỗng. */
var KHACH_COLS = ['MaKhach', 'SDT', 'HoTen', 'NgayTao', 'NgayCapNhat', 'NguonGoc', 'NguonChiTiet', 'DuAnQuanTam', 'NhuCau', 'CanXem', 'PTTT', 'DongYNhanTin', 'DongYBangChung', 'TrangThaiCRM', 'TrangThaiChamSoc', 'NguoiChamSoc', 'GhiChu', 'DongYDuAn', 'NgayRutLai'];

/** Độ dài tối đa một đoạn bằng chứng lưu ở DongYBangChung ('<mã>: Có (...)'). */
var EVIDENCE_SEG_MAX_ = 200;

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

/** Chữ dài đưa vào Sheet (DongYBangChung, DongYDuAn): giữ chặn công thức như cell_ nhưng KHÔNG cắt ở 500 ký tự
 *  (cắt giữa đoạn làm hỏng bằng chứng). Giới hạn ô Sheets 50000: quá 45000 thì bỏ NGUYÊN các đoạn đầu (cũ nhất), không cắt giữa đoạn;
 *  sep = dấu ngăn đoạn (mặc định ' || '; DongYDuAn dùng ';'). Còn một đoạn mà vẫn quá dài -> ''. */
function cellDai_(v, sep) {
  sep = sep || ' || ';
  var s = v == null ? '' : String(v);
  if (s.length > 45000) {
    var parts = s.split(sep);
    while (parts.length > 0 && parts.join(sep).length > 45000) parts.shift();
    s = parts.join(sep);
  }
  return /^[=+\-@]/.test(s) ? "'" + s : s;
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
  // Đồng ý chỉ tính cho đúng dự án của dòng; không có dự án hoặc bằng chứng hỏng thì 'Chưa rõ' (khách vẫn được lưu).
  var maDongY = duAn.split(';')[0]; // ô Dự án nhiều mã: chỉ gắn đồng ý cho mã đầu (bảo thủ)
  // ' || ' là dấu ngăn các đoạn bằng chứng; bằng chứng chứa nó (vd. URL trang do client gửi) là không hợp lệ.
  var coDongY = coBangChung && dongYRaw.indexOf(' || ') < 0 && maDongY !== '';
  // Mỗi đoạn lưu '<mã>: <bằng chứng>' tối đa 200 ký tự: cắt phần trang (cuối) cho vừa, giữ đúng khuôn. Phần đầu (ngày, phiên bản) tự nó đã quá dài -> không hợp lệ.
  if (coDongY) {
    var mm = /^(Có \(\d{4}-\d{2}-\d{2}T[\d:.]+Z, mẫu \S+, )([^\n\r]*)\)$/.exec(dongYRaw);
    var room = EVIDENCE_SEG_MAX_ - (maDongY.length + 2) - mm[1].length - 1;
    if (room < 0) coDongY = false;
    else dongY = mm[1] + mm[2].slice(0, room) + ')';
  }
  rec.DongYNhanTin = coDongY ? 'Có' : 'Chưa rõ';
  rec.DongYDuAn = coDongY ? maDongY : '';
  rec.DongYBangChung = coDongY ? maDongY + ': ' + dongY : '';
  return { ok: true, rec: rec };
}

/** Bằng chứng đồng ý đúng khuôn Code.gs ghi (dùng chung cho parseLandingRow_, bangChungHopLe_ và ngayDongY_). */
function hasConsentEvidence_(s) {
  return /^Có \(\d{4}-\d{2}-\d{2}T[\d:.]+Z, mẫu \S+, [^\n\r]*\)$/.test(String(s == null ? '' : s));
}

/** Ngày (ISO) của lần đồng ý, lấy từ 'Có (<ISO>, mẫu ...)'. Sai khuôn hoặc không phải chuỗi -> ''. */
function ngayDongY_(evidence) {
  if (typeof evidence !== 'string' || !hasConsentEvidence_(evidence)) return '';
  return isoOrEmpty_(/^Có \((\d{4}-\d{2}-\d{2}T[\d:.]+Z), /.exec(evidence)[1]);
}

/** Bằng chứng hợp lệ ở dạng cũ (không mã) hoặc dạng mới: các đoạn '<mã>: <bằng chứng>' ngăn ' || ', đoạn nào cũng đúng khuôn. */
function bangChungHopLe_(e) {
  e = String(e == null ? '' : e);
  if (hasConsentEvidence_(e)) return e.indexOf(' || ') < 0;
  var parts = e.split(' || ');
  for (var i = 0; i < parts.length; i++) {
    var m = /^([a-z][a-z0-9-]{2,39}): ([\s\S]*)$/.exec(parts[i]);
    if (!m || !hasConsentEvidence_(m[2])) return false;
  }
  return true;
}

/** Có được nhắn về dự án maDuAn không: mã nằm trong DongYDuAn (khớp nguyên mã, không phân biệt hoa thường) và chưa rút lại. */
function coTheNhan_(rec, maDuAn) {
  if (!rec || typeof maDuAn !== 'string') return false;
  var ma = maDuAn.trim().toLowerCase();
  if (!ma) return false;
  if (s_(rec.DongYNhanTin) !== 'Có') return false; // fail closed: chỉ đúng 'Có' mới nhắn được
  var list = String(rec.DongYDuAn == null ? '' : rec.DongYDuAn).toLowerCase().split(';');
  for (var i = 0; i < list.length; i++) if (list[i].trim() === ma) return true;
  return false;
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

/** Tách DongYBangChung thành các đoạn có mã: [{ma, ev, iso}] theo thứ tự xuất hiện, mỗi mã giữ bằng chứng MỚI nhất (bằng nhau giữ bản đứng trước).
 *  Cả ô phải hợp lệ (bangChungHopLe_), một đoạn hỏng thì bỏ cả ô (fail closed). Bằng chứng cũ không mã không thuộc dự án nào nên không có mặt ở đây. */
function segmentsOf_(bangChung, nowIso) {
  var out = [];
  var cutoff = nowIso === undefined ? Infinity : Date.parse(s_(nowIso)) + 5 * 60000; // nowIso hỏng -> NaN -> không đoạn nào qua (fail closed)
  var e = s_(bangChung);
  if (!e || !bangChungHopLe_(e) || hasConsentEvidence_(e)) return out;
  e.split(' || ').forEach(function (part) {
    var m = /^([a-z][a-z0-9-]{2,39}): ([\s\S]*)$/.exec(part);
    var iso = ngayDongY_(m[2]);
    if (!iso || !(Date.parse(iso) <= cutoff)) return; // bằng chứng ghi ngày ở tương lai (> now + 5 phút) là sheet sửa tay: bỏ
    for (var i = 0; i < out.length; i++) {
      if (out[i].ma === m[1]) {
        if (iso > out[i].iso) out[i] = { ma: m[1], ev: m[2], iso: iso };
        return;
      }
    }
    out.push({ ma: m[1], ev: m[2], iso: iso });
  });
  return out;
}

/** Mốc rút lại để so sánh: '' = chưa rút; ISO hợp lệ; ô có chữ nhưng không đọc được -> mốc xa nhất (fail closed, không bằng chứng nào mới hơn). */
function rutLaiLimit_(v) {
  var s = s_(v);
  if (!s) return '';
  return isoOrEmpty_(s) || '9999-12-31T23:59:59.999Z';
}

/** Các đoạn bằng chứng được tính đồng ý: mới hơn NgayRutLai (không có NgayRutLai thì tất cả). Bằng nhau KHÔNG tính. */
function doanConHieuLuc_(segs, ngayRutLai) {
  var lim = rutLaiLimit_(ngayRutLai);
  return segs.filter(function (g) { return !lim || g.iso > lim; });
}

/** Trạng thái đồng ý chung: 'Có' khi có ít nhất một dự án vừa nằm trong dongYDuAn vừa có bằng chứng hợp lệ mới hơn ngayRutLai;
 *  'Đã rút lại' khi có ngayRutLai mà không còn đồng ý nào như vậy; còn lại 'Chưa rõ'. Bằng chứng cũ không mã không tính. */
function trangThaiDongY_(dongYDuAn, bangChung, ngayRutLai) {
  var listed = codesOnly_(dongYDuAn).split(';');
  var ok = doanConHieuLuc_(segmentsOf_(bangChung), ngayRutLai).some(function (g) { return listed.indexOf(g.ma) >= 0; });
  if (ok) return 'Có';
  return s_(ngayRutLai) ? 'Đã rút lại' : 'Chưa rõ';
}

/** Hợp nhất hai bản ghi khách trùng SĐT (spec mục 6, mục 16). Trả đối tượng mới, không sửa đầu vào.
 *  Đồng ý theo từng dự án: DongYBangChung gộp theo mã (mỗi mã giữ bằng chứng mới nhất, cũ trước mới sau; đoạn cũ hơn ngày rút lại vẫn giữ làm lịch sử);
 *  DongYDuAn SUY RA từ các đoạn mới hơn NgayRutLai (không bao giờ từ ô gõ tay); NgayRutLai không bị xóa khi điền lại form.
 *  Chữ đầu vào phải đã qua cell_; Sheets.gs phải áp cell_ khi ghi ra Sheet. */
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

  // Bằng chứng: existing trước, rồi incoming; mỗi mã giữ bản mới nhất (bằng nhau giữ bản cũ); bằng chứng ở tương lai (> now + 5 phút) bị bỏ.
  var merged = segmentsOf_(ex.DongYBangChung, nowIso);
  segmentsOf_(inc.DongYBangChung, nowIso).forEach(function (g) {
    for (var i = 0; i < merged.length; i++) {
      if (merged[i].ma === g.ma) {
        if (g.iso > merged[i].iso) merged[i] = g;
        return;
      }
    }
    merged.push(g);
  });
  out.DongYBangChung = merged.map(function (g) { return g.ma + ': ' + g.ev; }).join(' || ');
  // Không có đoạn nào gắn mã: giữ nguyên bằng chứng cũ không mã (nếu có) chỉ để làm lịch sử, nó không cấp đồng ý cho dự án nào.
  if (!out.DongYBangChung) {
    [s_(ex.DongYBangChung), s_(inc.DongYBangChung)].some(function (e) {
      if (e && hasConsentEvidence_(e) && e.indexOf(' || ') < 0) { out.DongYBangChung = e; return true; }
      return false;
    });
  }
  var newest = '';
  merged.forEach(function (g) { if (g.iso > newest) newest = g.iso; });

  // Ngày rút lại = LỚN NHẤT trong các ngày hợp lệ của hai phía; phía nào có chữ không đọc được thì giữ chữ đó (mốc vô hạn, fail closed).
  var dates = [s_(ex.NgayRutLai), s_(inc.NgayRutLai)];
  var rut = '';
  var garbage = '';
  dates.forEach(function (d) {
    if (!d) return;
    var iso = isoOrEmpty_(d);
    if (!iso) { if (!garbage) garbage = d; return; }
    if (iso > rut) rut = iso;
  });
  if (garbage) {
    rut = garbage;
  } else {
    // 'Không' gõ tay: luôn là lần rút MỚI (xem dưới). 'Không rõ' và chữ lạ không phải rút lại.
    var kieu = [foldText_(ex.DongYNhanTin), foldText_(inc.DongYNhanTin)];
    if (kieu.indexOf('khong') >= 0) {
      // 'Không' là chữ CHỈ anh gõ (hệ thống luôn ghi 'Đã rút lại'), nên mỗi lần thấy là một lần rút MỚI: mốc = max(ngày hợp lệ hiện có, now, bằng chứng mới nhất).
      // Chạy lại không đẩy ngày vì ô đã được ghi lại thành 'Đã rút lại'.
      if (!rut || rut < nowIso) rut = nowIso;
      if (newest > rut) rut = newest;
    } else if (!rut && kieu.indexOf('darutlai') >= 0) {
      // Trạng thái 'Đã rút lại' mà chưa có ngày: lần chạm hàng gần nhất (NgayCapNhat của existing) để bằng chứng mới đến cùng lượt gộp không bị chặn nhầm.
      rut = isoOrEmpty_(s_(ex.NgayCapNhat)) || nowIso;
    }
  }
  out.NgayRutLai = rut;
  out.DongYDuAn = doanConHieuLuc_(merged, rut).map(function (g) { return g.ma; }).join(';');
  out.DongYNhanTin = trangThaiDongY_(out.DongYDuAn, out.DongYBangChung, rut);
  out.NgayCapNhat = nowIso;
  return out;
}

/** Gấp chữ về dạng so sánh: bỏ dấu, đ→d, chữ thường, chỉ giữ a-z (bỏ khoảng trắng, dấu câu, ký tự vô hình). */
function foldText_(v) {
  return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z]/g, '');
}

/** Phân loại giá trị DongYNhanTin: 'khong' = đúng chữ Không (mọi cách gõ: hoa/thường, có/không dấu, NFC/NFD, dấu chấm, ký tự vô hình) -> rút lại;
 *  'la' = bắt đầu bằng "không" nhưng không đúng ('Không rõ', 'Không biết') -> không rút lại, cần anh kiểm; còn lại ''. */
function dongYKieu_(v) {
  var f = foldText_(v);
  if (f === 'khong' || f === 'darutlai') return 'khong'; // 'Đã rút lại' (trạng thái mới) cũng chặn
  return f.indexOf('khong') === 0 ? 'la' : '';
}

/** Gom SĐT từ chối thành mảng đã chuẩn hóa. Dạng lạ → ném lỗi (không được lặng lẽ bỏ qua). */
function tuChoiPhones_(tuChoi) {
  var out = [];
  function add(v) {
    if (typeof v !== 'string' && typeof v !== 'number') return;
    var p = normalizePhone_(v);
    if (p) out.push(p);
  }
  if (tuChoi == null) return out;
  if (typeof tuChoi === 'string') {
    tuChoi.split(/[\s,;]+/).forEach(add);
  } else if (typeof tuChoi !== 'object') {
    throw new Error('tuChoi: dạng không hỗ trợ');
  } else if (Object.prototype.toString.call(tuChoi) === '[object Map]') {
    tuChoi.forEach(function (val, key) { add(key); });
  } else if (typeof tuChoi.forEach === 'function') {
    tuChoi.forEach(function (v) { add(v); });
  } else {
    Object.keys(tuChoi).forEach(add);
  }
  return out;
}

/** Loại yêu cầu từ ô LoaiYeuCau: đúng 'Xóa' (sau gấp chữ: hoa/thường, dấu, khoảng trắng) -> 'Xóa'; trống hoặc lạ -> 'Rút lại'. */
function loaiYeuCau_(v) {
  return foldText_(v) === 'xoa' ? 'Xóa' : 'Rút lại';
}

/** Ô LoaiYeuCau có chữ nhưng không phải 'Xóa' hay 'Rút lại' (sau gấp chữ)? Vẫn được ghi nhận là 'Rút lại' (an toàn), nhưng Sheets.gs báo ở tab Loi. */
function loaiLa_(v) {
  var f = foldText_(v);
  return s_(v) !== '' && f !== 'xoa' && f !== 'rutlai';
}

/** NgayGhi -> ISO hoặc '' (chưa biết). Sheets trả ngày gõ tay là 0 giờ địa phương (Asia/Ho_Chi_Minh = UTC+7, tức T17:00:00.000Z của hôm trước):
 *  coi là CUỐI ngày Việt Nam đó (+24 giờ) để đồng ý cùng ngày, sớm hơn trong ngày, không mở lại được. Cũng nhận 'YYYY-MM-DD' và 'DD/MM/YYYY' (cuối ngày VN).
 *  Dấu thời điểm hệ thống ghi (nowIso, không đúng 0 giờ VN) giữ nguyên. */
function ngayGhiNorm_(v) {
  var str = s_(v);
  var iso = isoOrEmpty_(str);
  if (iso) return /T17:00:00\.000Z$/.test(iso) ? new Date(Date.parse(iso) + 86400000).toISOString() : iso;
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str), y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else return '';
  var t = new Date(Date.UTC(y, mo - 1, d, 17));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? t.toISOString() : '';
}

/** Bản đồ TuChoi theo TỪNG DÒNG: {[SĐT chuẩn hóa]: [{loai: 'Rút lại'|'Xóa', ngayGhi: ISO hoặc ''}, ...]} theo thứ tự dòng.
 *  TuChoi chỉ thêm dòng, một SĐT có thể có nhiều dòng; mỗi dòng được xét riêng (decideDestinations_), không gộp loại/ngày theo SĐT.
 *  rows = mảng các dòng, có hoặc không dòng tiêu đề đầu (nhận ra bằng ô 'SDT'); cột theo TÊN (không tiêu đề: SDT, LyDo, NgayGhi, LoaiYeuCau).
 *  ngayGhi '' = chưa biết (trống hoặc rác): coi là "vừa rút lại, chặn mọi thứ", không bao giờ là "rất cũ".
 *  SĐT sai dạng bị bỏ (Sheets.gs báo ở tab Loi). Dạng đầu vào lạ -> ném lỗi (fail closed). */
function tuChoiMap_(rows) {
  var out = {};
  if (rows == null) return out;
  if (!Array.isArray(rows)) throw new Error('tuChoi: dạng không hỗ trợ');
  var ix = { sdt: 0, lydo: 1, ngayghi: 2, loaiyeucau: 3 };
  var start = 0;
  if (rows.length && Array.isArray(rows[0]) && rows[0].some(function (h) { return foldText_(h) === 'sdt'; })) {
    ix = { sdt: -1, lydo: -1, ngayghi: -1, loaiyeucau: -1 };
    rows[0].forEach(function (h, j) {
      var f = foldText_(h);
      if (f in ix && ix[f] < 0) ix[f] = j;
    });
    start = 1;
  }
  for (var r = start; r < rows.length; r++) {
    var row = rows[r];
    if (row == null) continue;
    if (!Array.isArray(row)) throw new Error('tuChoi: dạng không hỗ trợ');
    var at = function (k) { return ix[k] < 0 || ix[k] >= row.length ? '' : row[ix[k]]; };
    var p = normalizePhone_(typeof at('sdt') === 'number' ? at('sdt') : s_(at('sdt')));
    if (!p) continue;
    (out[p] = out[p] || []).push({ loai: loaiYeuCau_(at('loaiyeucau')), ngayGhi: ngayGhiNorm_(at('ngayghi')) });
  }
  return out;
}

/** Các mục TuChoi của một SĐT (mảng, có thể rỗng) từ mọi dạng tuChoi. Bản đồ {sdt: [mục] | mục} -> các mục đó (ngayGhi đã chuẩn hóa, không chuẩn hóa lần hai);
 *  dạng cũ (mảng/Set/Map/chuỗi/object giá trị khác) -> một mục 'Rút lại' chưa biết ngày (chặn, không mở lại được). Dạng lạ -> ném lỗi, kể cả khi khách không có SĐT. */
function mucTuChoi_(tuChoi, phone) {
  var out = [];
  var plainObj = tuChoi != null && typeof tuChoi === 'object' && Object.prototype.toString.call(tuChoi) === '[object Object]';
  if (plainObj) {
    var one = function (v) { return { loai: loaiYeuCau_(v && v.loai), ngayGhi: isoOrEmpty_(s_(v && v.ngayGhi)) }; };
    Object.keys(tuChoi).forEach(function (k) {
      var kp = normalizePhone_(k);
      var v = tuChoi[k];
      if (!kp || kp !== phone) return;
      if (Array.isArray(v)) v.forEach(function (e) { out.push(one(e)); });
      else if (v != null && typeof v === 'object') out.push(one(v));
      else out.push({ loai: 'Rút lại', ngayGhi: '' });
    });
    return out;
  }
  if (phone && tuChoiPhones_(tuChoi).indexOf(phone) >= 0) return [{ loai: 'Rút lại', ngayGhi: '' }];
  if (!phone) tuChoiPhones_(tuChoi); // vẫn kiểm dạng để báo lỗi sớm
  return out;
}

/** Hàng có bằng chứng đồng ý MỚI HƠN nghiêm ngặt mốc `limit` (ISO; '' = chưa biết -> không bao giờ)? Cùng quy tắc với mergeCustomer_:
 *  chỉ đoạn '<mã>: Có (...)' hợp lệ và mã nằm trong DongYDuAn; ngày ở tương lai (> now + 5 phút) bị bỏ; bằng nhau KHÔNG tính. */
function coDongYMoiHon_(rec, limit, nowIso) {
  var lim = isoOrEmpty_(limit);
  if (!lim) return false;
  var listed = codesOnly_(rec.DongYDuAn).split(';');
  return doanConHieuLuc_(segmentsOf_(rec.DongYBangChung, nowIso), lim).some(function (g) { return listed.indexOf(g.ma) >= 0; });
}

/** Quyết định đích phân bổ của một khách (spec mục 7, 9, 16).
 *  tuChoi: bản đồ từ tuChoiMap_ (hoặc mọi dạng cũ: mảng/Set/Map/object/chuỗi SĐT, coi như 'Rút lại' chưa rõ ngày); projectCodes: mã dự án có tab Master_<mã>;
 *  nowIso (tùy chọn, mặc định bây giờ): để bỏ bằng chứng ghi ngày ở tương lai.
 *  Trả {xoa, rutLai, dich, lyDo}: lyDo = 'xoa' | 'rutlai' (TuChoi 'Rút lại') | 'khong' (cột DongYNhanTin gõ 'Không' hoặc 'Đã rút lại') | ''.
 *  xoa: mục 'Xóa' và không có đồng ý mới hơn NgayGhi (dich []). rutLai: mục 'Rút lại' hoặc trạng thái đã rút, không có đồng ý mới hơn; dich VẪN tính (hồ sơ được giữ).
 *  Đồng ý mới hơn NgayGhi mở cả hai. 'Không' gõ tay không bị bằng chứng cũ trong hàng mở ra. 'Không rõ' và chữ lạ không phải rút lại.
 *  Không có SĐT -> dich []. Khách DuAnQuanTam rỗng -> dich [] và không bị cờ nào (cứ ở KhachHang). Không sửa đầu vào. */
function decideDestinations_(rec, tuChoi, projectCodes, nowIso) {
  rec = rec || {};
  var now = nowIso === undefined ? new Date().toISOString() : nowIso;
  var phone = normalizePhone_(rec.SDT);
  var xoa = false, rutLai = false, lyDo = '';
  // Mỗi dòng TuChoi được xét riêng: CÒN HIỆU LỰC khi không có đồng ý nào mới hơn nghiêm ngặt NgayGhi của chính dòng đó. 'Xóa' còn hiệu lực thắng 'Rút lại'.
  var hieuLuc = mucTuChoi_(tuChoi, phone).filter(function (e) { return !coDongYMoiHon_(rec, e.ngayGhi, now); });
  if (hieuLuc.some(function (e) { return e.loai === 'Xóa'; })) { xoa = true; lyDo = 'xoa'; }
  else if (hieuLuc.length) { rutLai = true; lyDo = 'rutlai'; }
  if (!xoa && !rutLai) {
    var f = foldText_(rec.DongYNhanTin);
    if (f === 'khong') { rutLai = true; lyDo = 'khong'; }
    else if (f === 'darutlai' && !coDongYMoiHon_(rec, s_(rec.NgayRutLai), now)) { rutLai = true; lyDo = 'khong'; }
  }
  var dich = [];
  if (phone && !xoa) {
    var known = Array.isArray(projectCodes) ? projectCodes : [];
    var seen = [];
    codesOnly_(rec.DuAnQuanTam).split(';').forEach(function (c) {
      if (!c || seen.indexOf(c) >= 0) return;
      for (var i = 0; i < known.length; i++) {
        if (typeof known[i] === 'string' && known[i].trim().toLowerCase() === c) {
          seen.push(c);
          dich.push(known[i].trim());
          return;
        }
      }
    });
  }
  return { xoa: xoa, rutLai: rutLai, dich: dich, lyDo: lyDo };
}

/** Rút lại theo TuChoi còn hiệu lực của khách: {co: có dòng 'Rút lại' còn hiệu lực (và không có 'Xóa' còn hiệu lực), ngay: NgayGhi mới nhất trong các dòng đó, hoặc '' nếu có dòng chưa biết ngày (chưa đóng dấu)}. */
function rutLaiTuChoi_(rec, tuChoi, nowIso) {
  rec = rec || {};
  var now = nowIso === undefined ? new Date().toISOString() : nowIso;
  var hieuLuc = mucTuChoi_(tuChoi, normalizePhone_(rec.SDT)).filter(function (e) { return !coDongYMoiHon_(rec, e.ngayGhi, now); });
  if (!hieuLuc.length || hieuLuc.some(function (e) { return e.loai === 'Xóa'; })) return { co: false, ngay: '' };
  var ngay = '';
  if (!hieuLuc.some(function (e) { return e.ngayGhi === ''; })) hieuLuc.forEach(function (e) { if (e.ngayGhi > ngay) ngay = e.ngayGhi; });
  return { co: true, ngay: ngay };
}
