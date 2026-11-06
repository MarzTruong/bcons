/**
 * Nhận đăng ký từ landing page Bcons → ghi tab "Landing" trong Sheet CRM → báo Telegram cho anh.
 * Cài: mở Sheet "Bcons - Khach quan tam Messenger" → Tiện ích mở rộng → Apps Script → dán toàn bộ file này.
 * Project Settings → Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (giống engine/remotion/.env).
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → chép link .../exec vào landing.json (formUrl).
 * Xem docs/huong-dan-landing.md. Không dán token vào file này.
 */
var SHEET_TAB = 'Landing';
var HEADERS = ['Thời gian', 'Họ tên', 'SĐT', 'Nhu cầu', 'Căn xem', 'Loại căn', 'PTTT', 'Giá chưa VAT', 'Tự có đến nhận nhà', 'Vay', 'Trả góp/tháng (giả định)', 'Lãi giả định %', 'Kỳ hạn năm', 'Nguồn', 'Đồng ý nhận tin', 'Trạng thái chăm sóc', 'Ghi chú'];
var NHU_CAU = ['Mua để ở', 'Mua cho thuê', 'Tìm hiểu thêm'];
var LOAI = ['Studio', '1PN-1WC', '2PN-1WC', '2PN-2WC', '3PN-2WC'];
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
    pttt: /^PTTT 0[1-5]$/.test(p.pttt) ? p.pttt : 'Không rõ',
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
  };
  return { ok: true, phone: phone, lead: lead };
}

function money_(n) {
  n = Number(n) || 0;
  return n >= 1e9 ? (n / 1e9).toFixed(2).replace('.', ',') + ' tỷ' : Math.round(n / 1e6) + ' triệu';
}
function trieu_(n) {
  return (Number(n) / 1e6).toFixed(1).replace('.', ',') + ' triệu';
}

/** Tin báo khách mới gửi anh (l = lead đã làm sạch). */
function formatTelegram_(l) {
  return [
    '🔥 KHÁCH MỚI – landing Bcons Central Park',
    'Tên: ' + l.ten + ' · SĐT/Zalo: ' + l.phone,
    'Nhu cầu: ' + l.nhuCau,
    'Xem: ' + l.canLoai + ' ' + l.dt + 'm² (' + l.canMoTa + ') · ' + l.pttt,
    'Tự có đến nhận nhà: ' + money_(l.tuCo) + (l.vay ? ' · vay ' + money_(l.vay) + ' · trả góp ~' + trieu_(l.traGop) + '/tháng (giả định ' + l.lai + '%/' + l.nam + ' năm)' : ' · không vay'),
    'Nguồn: ' + l.nguon,
    'Đã tick đồng ý nhận tin. Kiểm tra căn còn bán trước khi báo giá. Tin Zalo soạn sẵn ở tin kế tiếp.',
  ].join('\n');
}

/** Tin Zalo soạn sẵn để anh chép gửi khách: giá cả 2 kiểu, các đợt đã gồm VAT, phí bảo trì riêng, ghi rõ ước tính. */
function formatZalo_(l) {
  var s = 'Chào anh/chị ' + l.ten + ', em là tư vấn viên dự án Bcons Central Park (236 Phan Trung, Biên Hòa). ' +
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
    'Có (' + now.toISOString() + ', mẫu ' + CONSENT_VERSION + ', ' + cell_(l.trang) + ')', 'Mới', ''];
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
    payload: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 4000) }),
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
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    var count;
    try {
      if (cache.get(key)) return json_({ ok: true, dup: true });
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName(SHEET_TAB) || ss.insertSheet(SHEET_TAB);
      if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
      sh.appendRow(rowFor_(v.lead, new Date()));
      cache.put(key, '1', 120); // chỉ đánh dấu sau khi đã ghi được
      count = Number(cache.get('leads_10m') || 0) + 1;
      cache.put('leads_10m', String(count), 600);
    } finally {
      lock.releaseLock();
    }
    if (count <= MAX_LEADS_10M) {
      sendTelegram_(formatTelegram_(v.lead));
      sendTelegram_(formatZalo_(v.lead));
    } else if (count === MAX_LEADS_10M + 1) {
      sendTelegram_('⚠️ Hơn ' + MAX_LEADS_10M + ' đăng ký trong 10 phút (có thể bị spam). Tạm dừng báo từng khách; vẫn ghi vào Sheet tab Landing, anh kiểm tra.');
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Chạy thử trong trình soạn Apps Script (nút Run): gửi 1 tin Telegram mẫu, không ghi Sheet. */
function thuTelegram() {
  sendTelegram_('✅ Apps Script landing Bcons đã nối Telegram.');
}
