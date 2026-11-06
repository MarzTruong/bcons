/**
 * Nhận đăng ký từ landing page Bcons → ghi tab "Landing" trong Sheet CRM → báo Telegram cho anh.
 * Cài: mở Sheet "Bcons - Khach quan tam Messenger" → Tiện ích mở rộng → Apps Script → dán toàn bộ file này.
 * Project Settings → Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (giống engine/remotion/.env).
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → chép link .../exec vào landing.json (formUrl).
 * Xem docs/huong-dan-landing.md. Không dán token vào file này.
 */
var SHEET_TAB = 'Landing';
var HEADERS = ['Thời gian', 'Họ tên', 'SĐT', 'Nhu cầu', 'Mã căn', 'Loại căn', 'PTTT', 'Giá chưa VAT', 'Tự có đến nhận nhà', 'Vay', 'Trả góp/tháng (giả định)', 'Lãi giả định %', 'Kỳ hạn năm', 'Nguồn', 'Đồng ý nhận tin', 'Trạng thái chăm sóc', 'Ghi chú'];

/** Chuẩn hóa SĐT Việt Nam: 0xxxxxxxxx. Sai dạng → ''. */
function normalizePhone_(s) {
  var d = String(s || '').replace(/[\s.()\-]/g, '');
  if (/^\+?84\d{9,10}$/.test(d)) d = '0' + d.replace(/^\+?84/, '');
  return /^0\d{9,10}$/.test(d) ? d : '';
}

/** Ô bắt đầu bằng = + - @ bị Sheets hiểu là công thức: thêm dấu ' để giữ nguyên chữ. */
function cell_(v) {
  var s = v == null ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s.slice(0, 500);
}

/** Kiểm đăng ký. Trả { ok, phone, error, spam }. */
function validateLead_(p) {
  if (!p || typeof p !== 'object') return { ok: false, error: 'Dữ liệu trống' };
  if (p.website) return { ok: false, spam: true, error: 'spam' };
  if (p.dongY !== true) return { ok: false, error: 'Chưa đồng ý nhận tin' };
  var ten = String(p.ten || '').trim();
  if (ten.length < 2 || ten.length > 80) return { ok: false, error: 'Họ tên không hợp lệ' };
  var phone = normalizePhone_(p.sdt);
  if (!phone) return { ok: false, error: 'SĐT không hợp lệ' };
  return { ok: true, phone: phone };
}

function money_(n) {
  n = Number(n) || 0;
  return n >= 1e9 ? (n / 1e9).toFixed(2).replace('.', ',') + ' tỷ' : Math.round(n / 1e6) + ' triệu';
}

/** Tin báo khách mới gửi anh. */
function formatTelegram_(p, phone) {
  var lines = [
    '🔥 KHÁCH MỚI – landing Bcons Central Park',
    'Tên: ' + String(p.ten).trim() + ' · SĐT/Zalo: ' + phone,
    'Nhu cầu: ' + (p.nhuCau || '-'),
    'Xem: ' + (p.canLoai || '-') + ' ' + (p.dt || '') + 'm² (mã ' + (p.canMa || '-') + ') · ' + (p.pttt || '-'),
    'Tự có đến nhận nhà: ' + money_(p.tuCo) + (Number(p.vay) ? ' · vay ' + money_(p.vay) + ' · trả góp ~' + (Number(p.traGop) / 1e6).toFixed(1).replace('.', ',') + ' triệu/tháng (giả định ' + p.lai + '%/' + p.nam + ' năm)' : ' · không vay'),
    'Nguồn: ' + (p.nguon || '-'),
    'Đã tick đồng ý nhận tin. Gọi/nhắn sớm nhé. Tin Zalo soạn sẵn ở tin kế tiếp.',
  ];
  return lines.join('\n');
}

/** Tin Zalo soạn sẵn để anh chép gửi khách (không cam kết, ghi rõ ước tính). */
function formatZalo_(p) {
  var s = 'Chào anh/chị ' + String(p.ten).trim() + ', em là tư vấn viên dự án Bcons Central Park (236 Phan Trung, Biên Hòa). ' +
    'Em gửi anh/chị bảng tính căn ' + (p.canLoai || '') + ' ' + (p.dt || '') + 'm² theo ' + (p.pttt || '') + ': ' +
    'tiền tự có đến lúc nhận nhà khoảng ' + money_(p.tuCo);
  if (Number(p.vay)) s += ', vay ngân hàng khoảng ' + money_(p.vay) + ', trả góp ước tính khoảng ' + (Number(p.traGop) / 1e6).toFixed(1).replace('.', ',') + ' triệu/tháng (giả định lãi ' + p.lai + '%/năm, ' + p.nam + ' năm)';
  s += '. Giá chưa gồm VAT 10% và phí bảo trì 2%; số liệu là ước tính để tham khảo, em sẽ xác nhận căn còn bán và số chính xác khi anh/chị cần. Anh/chị tiện nghe máy lúc nào để em tư vấn kỹ hơn ạ?';
  return s;
}

function rowFor_(p, phone, now) {
  return [now, cell_(p.ten), cell_(phone), cell_(p.nhuCau), cell_(p.canMa), cell_(p.canLoai), cell_(p.pttt), Number(p.giaChuaVat) || '', Number(p.tuCo) || '', Number(p.vay) || 0, Number(p.traGop) || 0, Number(p.lai) || '', Number(p.nam) || '', cell_(p.nguon), 'Có (' + now.toISOString() + ')', 'Mới', ''];
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sendTelegram_(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chat = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chat) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text: text }),
  });
}

function doPost(e) {
  try {
    var p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var v = validateLead_(p);
    if (v.spam) return json_({ ok: true });
    if (!v.ok) return json_({ ok: false, error: v.error });
    var cache = CacheService.getScriptCache();
    var key = 'lead_' + v.phone;
    if (cache.get(key)) return json_({ ok: true, dup: true });
    cache.put(key, '1', 120);
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName(SHEET_TAB) || ss.insertSheet(SHEET_TAB);
      if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
      sh.appendRow(rowFor_(p, v.phone, new Date()));
    } finally {
      lock.releaseLock();
    }
    sendTelegram_(formatTelegram_(p, v.phone));
    sendTelegram_(formatZalo_(p));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Chạy thử trong trình soạn Apps Script (nút Run): gửi 1 tin Telegram mẫu, không ghi Sheet. */
function thuTelegram() {
  sendTelegram_('✅ Apps Script landing Bcons đã nối Telegram.');
}
