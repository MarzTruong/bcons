/**
 * Giỏ hàng cho công cụ bán hàng Bcons (đọc sheet GiaTongHop của Master File, đã chuyển thành Google Sheet).
 * Cài đặt (anh làm một lần, xem docs/huong-dan-cong-cu-ban-hang.md):
 *   1. Mở Google Sheet Master File > Tiện ích mở rộng > Apps Script, dán file này.
 *   2. Cài đặt dự án > Thuộc tính tập lệnh > thêm KHOA = một chuỗi bí mật dài (đổi khóa là các thiết bị cũ ngưng tải dữ liệu mới).
 *   3. Triển khai > Ứng dụng web: Thực thi bằng "Tôi", Ai có quyền truy cập "Bất kỳ ai". Lấy link /exec.
 * Chỉ trả dữ liệu khi gọi đúng ?khoa=<KHOA>. Không trả cột khách hàng, hoa hồng hay cột nội bộ nào ngoài các cột dưới đây.
 * Logic dò cột giống engine/landing/phieu/can.mjs (timCotMaster); test: engine/banhang/apps-script.test.mjs.
 */
var SHEET_GIA = "GiaTongHop";
var THAP = "B"; // công cụ này chỉ dùng tháp B; Sheet có thể chứa thêm tháp A và shophouse (không trả ra)

function doGet(e) {
  var khoa = PropertiesService.getScriptProperties().getProperty("KHOA");
  var dua = e && e.parameter ? e.parameter.khoa : "";
  if (!khoa || dua !== khoa) return json_({ loi: "khoa" });
  try {
    return json_(docGioHang_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_GIA).getDataRange().getValues()));
  } catch (err) {
    return json_({ loi: "may-chu" });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function fold_(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Vị trí các cột trong dòng tiêu đề (null nếu không phải bảng giá). Cột "PTTT 02 / 03" là một cột giá dùng chung. */
function timCot_(header) {
  var out = { gia: {} };
  for (var i = 0; i < header.length; i++) {
    var t = fold_(header[i]);
    if (out.ma === undefined && /^ma can$/.test(t)) out.ma = i;
    else if (/^loai can$/.test(t)) out.loai = i;
    else if (/^block$/.test(t)) { if (out.block === undefined) out.block = i; }
    else if (/^tang$/.test(t)) out.tang = i;
    else if (/^dt tim tuong/.test(t)) out.tim = i;
    else if (/^dt thong thuy/.test(t)) out.thongThuy = i;
    else if (/^huong view/.test(t)) out.huong = i;
    else if (/^tinh trang tren gio hang chung/.test(t)) out.tinhTrang = i;
    else if (/^gia chua vat/.test(t)) {
      var m = t.match(/pttt\s*(\d{1,2}(?:\s*\/\s*\d{1,2})*)/);
      if (m) {
        var ds = m[1].split("/");
        for (var j = 0; j < ds.length; j++) {
          var k = ("0" + ds[j].trim()).slice(-2);
          if (out.gia[k] === undefined) out.gia[k] = i;
        }
      }
    }
  }
  return out.ma !== undefined && Object.keys(out.gia).length ? out : null;
}

/** values: mảng 2 chiều của sheet. Trả { capNhat, phienBan, thap, can: [...] } đúng hợp đồng giohang.json. */
function docGioHang_(values) {
  var cot = null, hang = -1;
  for (var r = 0; r < Math.min(values.length, 15) && !cot; r++) {
    cot = timCot_(values[r]);
    hang = r;
  }
  if (!cot) throw new Error("Không thấy bảng giá");
  var can = [];
  for (var i = hang + 1; i < values.length; i++) {
    var v = values[i];
    var ma = String(v[cot.ma] == null ? "" : v[cot.ma]).trim().toUpperCase();
    var m = /^([A-Z])(\d+)\.(\d+)-(\d+)$/.exec(ma);
    if (!m || m[1] !== THAP) continue;
    if (cot.loai !== undefined && /^shophouse$/i.test(String(v[cot.loai] || "").trim())) continue;
    var gia = {};
    for (var k in cot.gia) if (Number(v[cot.gia[k]]) > 0) gia[k] = Number(v[cot.gia[k]]);
    can.push({
      ma: m[1] + m[2] + "." + m[3] + "-" + ("0" + m[4]).slice(-2),
      thap: m[1],
      block: m[1] + m[2],
      tang: Number(m[3]),
      viTri: Number(m[4]),
      loai: cot.loai !== undefined ? String(v[cot.loai] || "") : "",
      huong: cot.huong !== undefined && v[cot.huong] ? String(v[cot.huong]) : null,
      dtTimTuong: Number(v[cot.tim]) || 0,
      dtThongThuy: Number(v[cot.thongThuy]) || null,
      giaChuaVat: gia,
      tinhTrang: cot.tinhTrang !== undefined && v[cot.tinhTrang] ? String(v[cot.tinhTrang]) : "",
    });
  }
  return { capNhat: new Date().toISOString(), phienBan: 1, thap: "B", can: can };
}
