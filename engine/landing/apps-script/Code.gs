/**
 * Nhận đăng ký từ landing page Bcons → ghi tab "Landing" trong Sheet CRM → báo Telegram cho anh.
 * Cài: mở Sheet "Bcons - Khach quan tam Messenger" → Tiện ích mở rộng → Apps Script → dán toàn bộ file này.
 * Project Settings → Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (giống engine/remotion/.env).
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → chép link .../exec vào landing.json (formUrl).
 * Xem docs/huong-dan-landing.md. Không dán token vào file này.
 */
var SHEET_TAB = 'Landing';
var HEADERS = ['Thời gian', 'Họ tên', 'SĐT', 'Nhu cầu', 'Căn xem', 'Loại căn', 'PTTT', 'Giá chưa VAT', 'Tự có đến nhận nhà', 'Vay', 'Trả góp/tháng (giả định)', 'Lãi giả định %', 'Kỳ hạn năm', 'Nguồn', 'Đồng ý nhận tin', 'Trạng thái chăm sóc', 'Ghi chú', 'Dự án', 'Đã gộp'];
var NHU_CAU = ['Mua để ở', 'Mua cho thuê', 'Tìm hiểu thêm'];
var LOAI = ['Studio', '1PN-1WC', '2PN-1WC', '2PN-2WC', '3PN-2WC'];
var DU_AN_TEN = { 'bcons-central-park': { ten: 'Bcons Central Park', diaChi: '236 Phan Trung, Biên Hòa' }, 'bcons-newsky': { ten: 'Bcons Newsky', diaChi: 'Quốc lộ 13, phường Lái Thiêu, TP.HCM' } };
/** Tên và địa chỉ hiển thị trong tin báo; mã lạ hoặc thiếu (payload cũ) thì coi là Central Park như trước. */
/** Mã căn mẫu theo thứ tự trên landing (trang không chứa mã căn: chỉ gửi số thứ tự, đây là nơi tra). Phải khớp du-an/<mã>/landing/landing.json → canMau (test kiểm). */
var CAN_MAU = { 'bcons-central-park': ["A21-26", "A15-12", "E6-09", "A18-09", "A15-07"] };
var SITE = { 'bcons-central-park': 'https://bcons-central-park-bienhoa.pages.dev', 'bcons-newsky': 'https://bcons-newsky-binhduong.pages.dev' };
function duAnInfo_(l) { return DU_AN_TEN[l.duAn] || DU_AN_TEN['bcons-central-park']; }
var CONSENT_VERSION = 'v1-2026-11-06';
var MAX_LEADS_10M = 20; // quá số này trong 10 phút: vẫn ghi Sheet nhưng tạm dừng báo Telegram (chống nhồi tin)
var MIN_FILL_MS = 3000; // điền form nhanh hơn 3 giây: coi là máy tự động

/** Chuẩn hóa SĐT Việt Nam: 0xxxxxxxxx. Sai dạng → ''. */
function normalizePhone_(s) {
  var d = String(s || '').replace(/[\s.()\-]/g, '');
  if (/^\+?84\d{9,10}$/.test(d)) d = '0' + d.replace(/^\+?84/, '');
  return /^0\d{9,10}$/.test(d) ? d : '';
}

/** Ô bắt đầu bằng = + - @ bị Sheets hiểu là công thức: thêm dấu ' để giữ nguyên chữ. */
function cell_(v) {
  var s = (v == null ? '' : String(v)).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Chữ tự do: bỏ ký tự điều khiển và xuống dòng, cắt độ dài. */
function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function num_(v, lo, hi) {
  var n = Number(v);
  return isFinite(n) && n >= lo && n <= hi ? n : 0;
}

/**
 * Kiểm và làm sạch đăng ký (ai cũng gửi thẳng được tới link /exec, nên không tin dữ liệu nào).
 * Trả { ok, lead, error, spam }; lead là bản đã làm sạch, chỉ dùng lead từ đây trở đi.
 */
/** Mã căn: từ canMa nếu gửi đúng dạng, không thì tra số thứ tự canStt trong CAN_MAU của dự án. */
function canMaTu_(p) {
  var m = String(p.canMa || '').toUpperCase();
  if (/^[A-Z0-9.\-]{3,14}$/.test(m)) return m;
  var ds = CAN_MAU[p.duAn];
  var i = typeof p.canStt === 'number' ? p.canStt : NaN;
  return ds && isFinite(i) && i >= 0 && i < ds.length && Math.floor(i) === i ? ds[i] : '';
}

function validateLead_(p) {
  if (!p || typeof p !== 'object') return { ok: false, error: 'Dữ liệu trống' };
  if (p.hp_x7) return { ok: false, spam: true, error: 'spam' };
  if (!(Number(p.t) >= MIN_FILL_MS)) return { ok: false, spam: true, error: 'spam' };
  if (p.dongY !== true) return { ok: false, error: 'Chưa đồng ý nhận tin' };
  var ten = clean_(p.ten, 80);
  if (ten.length < 2) return { ok: false, error: 'Họ tên không hợp lệ' };
  var phone = normalizePhone_(p.sdt);
  if (!phone) return { ok: false, error: 'SĐT không hợp lệ' };
  var lead = {
    ten: ten,
    phone: phone,
    nhuCau: NHU_CAU.indexOf(p.nhuCau) >= 0 ? p.nhuCau : 'Không rõ',
    canLoai: LOAI.indexOf(p.canLoai) >= 0 ? p.canLoai : 'Không rõ',
    canMoTa: clean_(p.canMoTa, 80),
    dt: num_(p.dt, 20, 200),
    canMa: canMaTu_(p),
    pttt: /^PTTT (0[1-9]|10)$/.test(p.pttt) ? p.pttt : 'Không rõ',
    giaChuaVat: num_(p.giaChuaVat, 1e9, 2e10),
    giaCoVat: num_(p.giaCoVat, 1e9, 2.2e10),
    phiBaoTri: num_(p.phiBaoTri, 1e7, 5e8),
    tuCo: num_(p.tuCo, 0, 2.2e10),
    vay: num_(p.vay, 0, 2.2e10),
    traGop: num_(p.traGop, 0, 5e8),
    lai: num_(p.lai, 0, 30),
    nam: num_(p.nam, 0, 35),
    nguon: String(p.nguon || '').replace(/[^\w.\-]/g, '').slice(0, 60) || 'khong-ro',
    trang: clean_(p.trang, 200),
    duAn: typeof p.duAn === 'string' && /^[a-z][a-z0-9-]{2,39}$/.test(p.duAn) ? p.duAn : 'khong-ro',
  };
  return { ok: true, phone: phone, lead: lead };
}

/** Tab Landing tạo trước khi có cột 'Dự án'/'Đã gộp' chỉ có 17 cột tiêu đề: cần ghi lại hàng tiêu đề (17 cột đầu không đổi). */
function needsHeaderRepair_(lastColumn) {
  return Number(lastColumn) < HEADERS.length;
}

function money_(n) {
  n = Number(n) || 0;
  return n >= 1e9 ? (n / 1e9).toFixed(2).replace('.', ',') + ' tỷ' : Math.round(n / 1e6) + ' triệu';
}
function trieu_(n) {
  return (Number(n) / 1e6).toFixed(1).replace('.', ',') + ' triệu';
}

/** Tin báo khách mới gửi anh (l = lead đã làm sạch). */
/** Lệnh bấm được cho bot: /phieu_<mã: '-'→'_', '.'→'p'>_<PTTT 2 chữ số>_<lãi: '.'→'p'>_<năm>. Telegram chỉ nhận chữ, số, gạch dưới. Không có mã/PTTT/lãi hoặc mã có chữ P thì không tạo. */
/** Liên kết xem phiếu dựng ngay trong trình duyệt (hướng A, chạy khi máy anh tắt). Chỉ trỏ về trang của đúng dự án; không chứa tên, SĐT. */
function phieuLink_(l) {
  var site = SITE[l.duAn];
  var m = /^PTTT (\d\d)$/.exec(l.pttt || '');
  if (!site || !m || !(l.giaChuaVat > 0)) return '';
  var q = ['k=' + m[1], 'g=' + Math.round(l.giaChuaVat)];
  if (l.lai) q.push('l=' + l.lai);
  if (l.nam) q.push('n=' + l.nam);
  if (l.canMa) q.push('m=' + encodeURIComponent(l.canMa));
  var loai = l.canLoai && l.canLoai !== 'Không rõ' ? l.canLoai : l.canMoTa;
  if (loai) q.push('c=' + encodeURIComponent(loai));
  var tt = /^tháp (.+), tầng (\d+)$/.exec(l.canMoTa || '');
  if (tt) { q.push('th=' + encodeURIComponent(tt[1])); q.push('tg=' + tt[2]); }
  if (l.dt > 0) q.push('d=' + l.dt);
  return site + '/phieu.html?' + q.join('&');
}

function lenhPhieu_(l) {
  if (!l.canMa || /P/.test(l.canMa) || !/^PTTT \d\d$/.test(l.pttt) || !l.lai || !l.nam) return '';
  var ma = l.canMa.replace(/-/g, '_').replace(/\./g, 'p');
  return '/phieu_' + ma + '_' + l.pttt.slice(-2) + '_' + String(l.lai).replace('.', 'p') + '_' + l.nam;
}

/** Thoát <, >, & để chữ của khách (tên, nguồn...) không làm hỏng định dạng HTML của tin Telegram. */
function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Tin báo khách mới gửi anh, định dạng HTML của Telegram (đậm, nghiêng, link) và icon cho dễ đọc nhanh. */
function formatTelegram_(l) {
  var link = phieuLink_(l);
  var lenh = lenhPhieu_(l);
  var xem = [l.canLoai && l.canLoai !== 'Không rõ' ? l.canLoai : '', l.dt > 0 ? l.dt + ' m²' : '', l.canMoTa].filter(function (x) { return x; }).map(esc_).join(' · ');
  return [
    '🔥 <b>KHÁCH MỚI</b> · ' + esc_(duAnInfo_(l).ten),
    '━━━━━━━━━━━━━━',
    '👤 <b>' + esc_(l.ten) + '</b>',
    '📞 <b>' + esc_(l.phone) + '</b> (gọi hoặc Zalo cùng số)',
    '🎯 ' + esc_(l.nhuCau),
    '',
    '🏠 <b>Đang xem</b>',
    xem + ' · ' + esc_(l.pttt),
    '💰 Giá ' + money_(l.giaChuaVat) + ' chưa VAT · ' + money_(l.giaCoVat) + ' có VAT',
    '💵 Tự có đến nhận nhà: <b>' + money_(l.tuCo) + '</b>',
    l.vay ? '🏦 Vay ' + money_(l.vay) + ' · trả góp ~' + trieu_(l.traGop) + '/tháng <i>(giả định ' + l.lai + '%/' + l.nam + ' năm)</i>' : '🏦 Không vay',
    '📍 Nguồn: ' + esc_(l.nguon),
    '',
    link ? '🧾 <a href="' + esc_(link) + '">Xem phiếu tính, lưu ảnh gửi khách</a>' : '',
    lenh ? '🤖 Hoặc dựng bằng bot: ' + lenh : '',
    '✅ Đã tick đồng ý nhận tin · kiểm tra căn còn bán trước khi báo giá',
    '⬇️ Tin Zalo soạn sẵn ở tin kế tiếp',
  ].filter(function (x, i, a) { return x !== '' || (i > 0 && a[i - 1] !== ''); }).join('\n');
}

/** Tin Zalo soạn sẵn đặt trong khung <pre>: chạm vào khung là chép cả đoạn, dán vào Zalo gửi khách. */
function formatZaloTelegram_(l) {
  return '💬 <b>Tin Zalo soạn sẵn</b> (chạm vào khung để chép)\n<pre>' + esc_(formatZalo_(l)) + '</pre>';
}

/** Tin Zalo soạn sẵn để anh chép gửi khách: giá cả 2 kiểu, các đợt đã gồm VAT, phí bảo trì riêng, ghi rõ ước tính. */
function formatZalo_(l) {
  var s = 'Chào anh/chị ' + l.ten + ', em là tư vấn viên dự án ' + duAnInfo_(l).ten + ' (' + duAnInfo_(l).diaChi + '). ' +
    'Em gửi anh/chị bảng tính căn ' + l.canLoai + ' ' + l.dt + 'm² theo ' + l.pttt + ': ' +
    'giá ' + money_(l.giaChuaVat) + ' chưa VAT, ' + money_(l.giaCoVat) + ' đã gồm VAT 10%. ' +
    'Tiền tự có đến lúc nhận nhà khoảng ' + money_(l.tuCo);
  if (l.vay) s += ', vay ngân hàng khoảng ' + money_(l.vay) + ', trả góp ước tính khoảng ' + trieu_(l.traGop) + '/tháng (giả định lãi ' + l.lai + '%/năm, ' + l.nam + ' năm)';
  s += '. Các đợt thanh toán đã gồm VAT; phí bảo trì 2% (khoảng ' + money_(l.phiBaoTri) + ') đóng khi nhận nhà. ' +
    'Số liệu là ước tính để tham khảo, em sẽ xác nhận căn còn bán và số chính xác khi anh/chị cần. Anh/chị tiện nghe máy lúc nào để em tư vấn kỹ hơn ạ?';
  return s;
}

function rowFor_(l, now) {
  return [now, cell_(l.ten), "'" + l.phone, cell_(l.nhuCau), cell_(l.canMoTa), cell_(l.canLoai), cell_(l.pttt), l.giaChuaVat || '', l.tuCo, l.vay, Math.round(l.traGop), l.lai, l.nam, cell_(l.nguon),
    'Có (' + now.toISOString() + ', mẫu ' + CONSENT_VERSION + ', ' + cell_(l.trang) + ')', 'Mới', '', l.duAn || 'khong-ro', ''];
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sendTelegram_(text) {
  var props = PropertiesService.getScriptProperties();
  var token = (props.getProperty('TELEGRAM_BOT_TOKEN') || '').trim();
  var chat = (props.getProperty('TELEGRAM_CHAT_ID') || '').trim();
  if (!token || !chat) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true }),
  });
}

function doPost(e) {
  try {
    var p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var v = validateLead_(p);
    if (v.spam) return json_({ ok: true });
    if (!v.ok) return json_({ ok: false, error: v.error });
    var cache = CacheService.getScriptCache();
    var key = 'lead_' + v.lead.duAn + '_' + v.phone; // chống trùng theo từng dự án: cùng số ở hai dự án vẫn báo cả hai
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    var count;
    try {
      if (cache.get(key)) return json_({ ok: true, dup: true });
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName(SHEET_TAB) || ss.insertSheet(SHEET_TAB);
      if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
      else if (needsHeaderRepair_(sh.getLastColumn())) sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]); // tab cũ 17 cột: bổ sung tiêu đề 'Dự án', 'Đã gộp'
      sh.appendRow(rowFor_(v.lead, new Date()));
      cache.put(key, '1', 120); // chỉ đánh dấu sau khi đã ghi được
      count = Number(cache.get('leads_10m') || 0) + 1;
      cache.put('leads_10m', String(count), 600);
    } finally {
      lock.releaseLock();
    }
    if (count <= MAX_LEADS_10M) {
      sendTelegram_(formatTelegram_(v.lead));
      sendTelegram_(formatZaloTelegram_(v.lead));
    } else if (count === MAX_LEADS_10M + 1) {
      sendTelegram_('⚠️ Hơn ' + MAX_LEADS_10M + ' đăng ký trong 10 phút (có thể bị spam). Tạm dừng báo từng khách; vẫn ghi vào Sheet tab Landing, anh kiểm tra.');
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Chạy thử trong trình soạn Apps Script: chọn "thuTelegram" ở ô chọn hàm rồi bấm Chạy. Gửi 1 tin mẫu, không ghi Sheet; lỗi ghi rõ trong Nhật ký thực thi. */
function thuTelegram() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chat = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token) return Logger.log('LỖI: thiếu thuộc tính TELEGRAM_BOT_TOKEN (Cài đặt dự án → Thuộc tính tập lệnh, gõ đúng tên, không dấu cách).');
  if (!chat) return Logger.log('LỖI: thiếu thuộc tính TELEGRAM_CHAT_ID.');
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token.trim() + '/sendMessage', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat.trim(), text: '✅ Apps Script landing Bcons đã nối Telegram.' }),
  });
  var body = JSON.parse(res.getContentText() || '{}');
  Logger.log(body.ok ? 'OK: Telegram đã nhận tin thử.' : 'LỖI Telegram: ' + (body.description || res.getResponseCode()) + ' (kiểm tra lại token và chat id, không có dấu cách thừa).');
}
