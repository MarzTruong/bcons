// Giao diện công cụ bán hàng (thiết kế AGY, tích hợp Claude 13/11/2026).
// Mọi công thức đi qua lõi: giohang.mjs (xếp hạng, mặt bằng, thẻ căn) và tai-chinh.mjs (số tiền, dùng calc.mjs).
// Dữ liệu vào qua khoiDong({ giohang, plans, lienHe, nguon }); không có giá nào nằm trong file này.
import { parseMa, trangThai, canHienThi, danhDauGiaRe, cungViTri, matBangTang, theCan } from "./core/giohang.mjs";
import { phuongAn, giaCoVat } from "./core/tai-chinh.mjs";

// UI Controller
export async function khoiDong({ giohang, plans: PLANS, lienHe = {}, nguon = null }) {
  let rawGioHang = giohang;

  let currentBlock = "ALL"; // "ALL" | "B1" | "B2"
  let currentTang = 4;
  let currentPttt = "09";
  let selectedMa = "B2.4-12";
  let compareList = [];
  let loanOverride = "auto"; // "auto" | "0.7" | "0.5" | "0"

  const DEFAULT_AGENT = { name: lienHe.ten || "Tuấn Trương", phone: lienHe.sdtHienThi || "0938.32.31.39", team: "Bcons PS Land" };
  let agentInfo = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bcons_agent_info") || "null");
      return saved && saved.name ? { ...DEFAULT_AGENT, ...saved } : { ...DEFAULT_AGENT };
    } catch { return { ...DEFAULT_AGENT }; }
  })();

  const nf = new Intl.NumberFormat("vi-VN");
  const fmtTy = (v) => ((Math.abs(Number(v) || 0)) / 1e9).toFixed(2).replace(".", ",") + " tỷ";
  const fmtTrieu = (v) => {
    const absV = Math.abs(Number(v) || 0);
    if (absV >= 1e9) return fmtTy(absV);
    return Math.round(absV / 1e6) + " triệu";
  };
  const fmtTrieu1 = (v) => ((Math.abs(Number(v) || 0)) / 1e6).toFixed(1).replace(".", ",") + " triệu";
  const fmtDong = (v) => nf.format(Math.round(Math.abs(Number(v) || 0))) + " đ";

  // Compact 3-tier staggered geometry (~25% shorter cards for crisp square-ish proportions, viewBox 1845x705)
  const B1_GEOM = {
    // Bậc 1 - Dãy trên cùng (y=58, h=145 -> 203)
    7:  { x: 330, y: 58,  w: 125, h: 145, label: "07", loaiDefault: "3PN-2WC", dt: 77.83, balc: "top", orient: "Đông Bắc", cat: "#A855F7", corner: true },
    8:  { x: 461, y: 58,  w: 96,  h: 145, label: "08", loaiDefault: "2PN-2WC", dt: 55.17, balc: "top", orient: "Đông Bắc", cat: "#EC4899" },
    9:  { x: 563, y: 58,  w: 96,  h: 145, label: "09", loaiDefault: "2PN-2WC", dt: 54.76, balc: "top", orient: "Đông Bắc", cat: "#EC4899" },
    10: { x: 665, y: 58,  w: 120, h: 145, label: "10", loaiDefault: "3PN-2WC", dt: 74.86, balc: "top", orient: "Đông Bắc", cat: "#F97316" },

    // Bậc 2 - Cụm giữa (y=254, h=145 -> 399)
    5:  { x: 55,  y: 254, w: 120, h: 145, label: "05", loaiDefault: "3PN-2WC", dt: 74.68, balc: "top", orient: "TB - ĐB", cat: "#06B6D4", corner: true },
    6:  { x: 181, y: 254, w: 103, h: 145, label: "06", loaiDefault: "2PN-2WC", dt: 55.13, balc: "top", orient: "Đông Bắc", cat: "#EC4899" },
    12: { x: 571, y: 254, w: 94,  h: 145, label: "12", loaiDefault: "2PN-2WC", dt: 55.05, balc: "bottom", orient: "Tây Nam", cat: "#EC4899" },
    11: { x: 671, y: 254, w: 114, h: 145, label: "11", loaiDefault: "3PN-2WC", dt: 74.86, balc: "bottom", orient: "Tây Nam", cat: "#F97316" },

    // Bậc 3 - Dãy đáy trái (y=462, h=152 -> 614)
    4:  { x: 55,  y: 462, w: 132, h: 152, label: "04", loaiDefault: "3PN-2WC", dt: 74.82, balc: "bottom", orient: "TN - TB", cat: "#06B6D4", corner: true },
    3:  { x: 193, y: 462, w: 105, h: 152, label: "03", loaiDefault: "2PN-2WC", dt: 55.15, balc: "bottom", orient: "Tây Nam", cat: "#EC4899" },
    2:  { x: 304, y: 462, w: 105, h: 152, label: "02", loaiDefault: "2PN-2WC", dt: 55.15, balc: "bottom", orient: "Tây Nam", cat: "#EC4899" },
    1:  { x: 415, y: 462, w: 135, h: 152, label: "01", loaiDefault: "3PN-2WC", dt: 77.81, balc: "bottom", orient: "Tây Nam", cat: "#A855F7", corner: true },
  };

  const B2_GEOM = {
    // Bậc 1 - Dãy trên cùng B2 (y=58, h=145 -> 203)
    3:  { x: 801,  y: 58,  w: 120, h: 145, label: "03", loaiDefault: "3PN-2WC", dt: 74.86, balc: "top", orient: "Đông Bắc", cat: "#F97316" },
    4:  { x: 927,  y: 58,  w: 96,  h: 145, label: "04", loaiDefault: "2PN-2WC", dt: 54.76, balc: "top", orient: "Đông Bắc", cat: "#EC4899" },
    5:  { x: 1029, y: 58,  w: 96,  h: 145, label: "05", loaiDefault: "2PN-2WC", dt: 55.17, balc: "top", orient: "Đông Bắc", cat: "#EC4899" },
    6:  { x: 1131, y: 58,  w: 125, h: 145, label: "06", loaiDefault: "3PN-2WC", dt: 77.83, balc: "top", orient: "Đông Bắc", cat: "#A855F7", corner: true },

    // Bậc 2 - Cụm giữa B2 (y=254, h=145 -> 399)
    2:  { x: 801,  y: 254, w: 114, h: 145, label: "02", loaiDefault: "3PN-2WC", dt: 74.86, balc: "bottom", orient: "Tây Nam", cat: "#F97316" },
    1:  { x: 921,  y: 254, w: 94,  h: 145, label: "01", loaiDefault: "2PN-2WC", dt: 55.05, balc: "bottom", orient: "Tây Nam", cat: "#EC4899" },

    // Cánh phải B2 giật cấp thấp xuống (y=278, h=142 -> 420)
    7:  { x: 1266, y: 278, w: 100, h: 142, label: "07", loaiDefault: "2PN-2WC", dt: 55.13, balc: "top", orient: "Đông Bắc", cat: "#EC4899" },
    8:  { x: 1372, y: 278, w: 100, h: 142, label: "08", loaiDefault: "2PN-2WC", dt: 55.17, balc: "top", orient: "Đông Bắc", cat: "#EC4899" },
    9:  { x: 1478, y: 278, w: 170, h: 142, label: "09", loaiDefault: "3PN-3WC", dt: 94.70, balc: "top", orient: "ĐB - ĐN", cat: "#22C55E", corner: true },

    // Bậc 3 - Hàng đáy dưới cùng bên phải B2 (y=462, h=152 -> 614)
    15: { x: 1070, y: 462, w: 125, h: 152, label: "15", loaiDefault: "3PN-2WC", dt: 77.83, balc: "bottom", orient: "Tây Nam", cat: "#A855F7", corner: true },
    14: { x: 1201, y: 462, w: 112, h: 152, label: "14", loaiDefault: "2PN-2WC", dt: 65.69, balc: "bottom", orient: "Tây Nam", cat: "#22C55E" },
    13: { x: 1319, y: 462, w: 112, h: 152, label: "13", loaiDefault: "2PN-2WC", dt: 65.54, balc: "bottom", orient: "Tây Nam", cat: "#22C55E" },
    12: { x: 1437, y: 462, w: 94,  h: 152, label: "12", loaiDefault: "2PN-1WC", dt: 47.25, balc: "bottom", orient: "Tây Nam", cat: "#F59E0B" },
    11: { x: 1537, y: 462, w: 94,  h: 152, label: "11", loaiDefault: "2PN-1WC", dt: 47.37, balc: "bottom", orient: "Tây Nam", cat: "#F59E0B" },
    10: { x: 1637, y: 462, w: 145, h: 152, label: "10", loaiDefault: "3PN-2WC", dt: 80.47, balc: "bottom", orient: "TN - ĐN", cat: "#3B82F6", corner: true },
  };

  // Floor 2 continuous numbering (CĂN HỘ 01..22 + 2 SHCĐ zones)
  const TANG2_UNITS = [
    { ma: "CH-07", x: 330,  y: 58,  w: 125, h: 145, label: "CH 07", tt: 80.96, ll: 73.58, cat: "#D946EF", orient: "Đông Bắc", corner: true },
    { ma: "CH-08", x: 461,  y: 58,  w: 96,  h: 145, label: "CH 08", tt: 56.69, ll: 51.33, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-09", x: 563,  y: 58,  w: 96,  h: 145, label: "CH 09", tt: 55.52, ll: 50.23, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-10", x: 665,  y: 58,  w: 120, h: 145, label: "CH 10", tt: 73.49, ll: 66.52, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-05", x: 55,   y: 254, w: 120, h: 145, label: "CH 05", tt: 78.19, ll: 71.07, cat: "#D946EF", orient: "TB - ĐB", corner: true },
    { ma: "CH-06", x: 181,  y: 254, w: 103, h: 145, label: "CH 06", tt: 58.13, ll: 52.38, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-04", x: 55,   y: 462, w: 132, h: 152, label: "CH 04", tt: 71.55, ll: 63.45, cat: "#D946EF", orient: "TN - TB", corner: true },
    { ma: "CH-03", x: 193,  y: 462, w: 105, h: 152, label: "CH 03", tt: 54.08, ll: 48.43, cat: "#D946EF", orient: "Tây Nam" },
    { ma: "CH-02", x: 304,  y: 462, w: 105, h: 152, label: "CH 02", tt: 54.08, ll: 48.37, cat: "#D946EF", orient: "Tây Nam" },
    { ma: "CH-01", x: 415,  y: 462, w: 135, h: 152, label: "CH 01", tt: 77.83, ll: 70.45, cat: "#D946EF", orient: "Tây Nam", corner: true },
    // B2 side on Floor 2
    { ma: "CH-11", x: 801,  y: 58,  w: 120, h: 145, label: "CH 11", tt: 73.49, ll: 66.51, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-12", x: 927,  y: 58,  w: 96,  h: 145, label: "CH 12", tt: 55.52, ll: 50.23, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-13", x: 1029, y: 58,  w: 96,  h: 145, label: "CH 13", tt: 56.69, ll: 51.32, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-14", x: 1131, y: 58,  w: 125, h: 145, label: "CH 14", tt: 80.97, ll: 73.45, cat: "#D946EF", orient: "Đông Bắc", corner: true },
    { ma: "CH-15", x: 1266, y: 278, w: 100, h: 142, label: "CH 15", tt: 58.82, ll: 50.92, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-16", x: 1372, y: 278, w: 100, h: 142, label: "CH 16", tt: 55.56, ll: 49.12, cat: "#D946EF", orient: "Đông Bắc" },
    { ma: "CH-17", x: 1478, y: 278, w: 170, h: 142, label: "CH 17", tt: 104.09, ll: 94.17, cat: "#D946EF", orient: "ĐB - ĐN", corner: true },
    { ma: "CH-22", x: 1070, y: 462, w: 135, h: 152, label: "CH 22", tt: 77.83, ll: 70.40, cat: "#D946EF", orient: "Tây Nam", corner: true },
    { ma: "CH-21", x: 1211, y: 462, w: 125, h: 152, label: "CH 21", tt: 54.99, ll: 49.07, cat: "#D946EF", orient: "Tây Nam" },
    { ma: "CH-20", x: 1342, y: 462, w: 135, h: 152, label: "CH 20", tt: 80.09, ll: 71.32, cat: "#D946EF", orient: "Tây Nam" },
    { ma: "CH-19", x: 1483, y: 462, w: 150, h: 152, label: "CH 19", tt: 92.44, ll: 83.11, cat: "#D946EF", orient: "Tây Nam" },
    { ma: "CH-18", x: 1639, y: 462, w: 143, h: 152, label: "CH 18", tt: 81.24, ll: 71.86, cat: "#D946EF", orient: "TN - ĐN", corner: true },
  ];

  // Sân vườn (SV) areas on Floor 3 & Floor 4
  const TANG3_SV = {
    "B1-08": 2.46, "B1-09": 2.36, "B1-10": 17.75,
    "B2-03": 17.75, "B2-04": 2.36, "B2-05": 2.43, "B2-06": 2.54,
    "B2-07": 2.56, "B2-08": 2.46, "B2-09": 9.14, "B2-14": 3.76, "B2-13": 3.76,
  };
  const TANG4_SV = { "B1-05": 20.35, "B1-06": 2.56 };

  function getGeom(block, viTri) {
    return block === "B1" ? B1_GEOM[viTri] : B2_GEOM[viTri];
  }

  function matchesHuong(huongStr, qHuong) {
    if (!qHuong || qHuong === "all") return true;
    const h = (huongStr || "").toUpperCase();
    if (qHuong === "Bắc") return h.includes("BẮC") || h.includes("ĐB") || h.includes("TB");
    if (qHuong === "Nam") return h.includes("NAM") || h.includes("TN") || h.includes("ĐN");
    if (qHuong === "Đông") return h.includes("ĐÔNG") || h.includes("ĐB") || h.includes("ĐN");
    if (qHuong === "Tây") return h.includes("TÂY") || h.includes("TB") || h.includes("TN");
    return h.includes(qHuong.toUpperCase());
  }

  // Theme Management
  let isDarkMode = localStorage.getItem("bcons_theme") === "dark";
  function applyTheme(dark, redraw = false) {
    isDarkMode = dark;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("bcons_theme", dark ? "dark" : "light");
    const iconEl = document.getElementById("themeIcon");
    const textEl = document.getElementById("themeText");
    if (iconEl && textEl) {
      iconEl.textContent = dark ? "☀️" : "🌙";
      textEl.textContent = dark ? "Ban ngày" : "Ban đêm";
    }
    if (redraw) renderArchitecturalSvg();
  }
  applyTheme(isDarkMode, false);

  document.getElementById("btnThemeToggle")?.addEventListener("click", () => {
    applyTheme(!isDarkMode, true);
    showToast(isDarkMode ? "Đã bật chế độ Ban đêm (CAD Blueprint)" : "Đã bật chế độ Ban ngày");
  });

  // Determine Floor Layout Group
  function getLayoutInfo(tang) {
    if (tang === 2) return { type: "tang2", name: "Tầng 2 (22 Căn Hộ / Shophouse & 2 Khu SHCĐ)" };
    if (tang === 3) return { type: "tang3", name: "Tầng 3 (Hồ Bơi, Phòng Gym & Căn Sân Vườn - B1: 9 căn, B2: 15 căn)" };
    if (tang === 4) return { type: "tang4", name: "Tầng 4 (Sân Vườn Cảnh Quan B1-05/06 - Đủ 27 căn)" };
    if (tang >= 5 && tang <= 9) return { type: "tang5_9", name: "Tầng Điển Hình (5–9 · Đủ 27 căn)" };
    if (tang === 10) return { type: "tang10", name: "Tầng 10 (Điển Hình · Đủ 27 căn)" };
    if (tang === 11) return { type: "tang11", name: "Tầng 11 (Điển Hình · Đủ 27 căn)" };
    if (tang === 19) return { type: "tang19", name: "Tầng 19 (Sân Vườn Trên Cao thay B1-05, 06 · 25 căn)" };
    if (tang === 20) return { type: "tang20", name: "Tầng 20 (Thông Tầng / Mái Thu Nhỏ · 25 căn)" };
    return { type: "tang12_29", name: `Tầng Điển Hình (${tang} · Đủ 27 căn)` };
  }

  // Render Crisp Architectural Vector Floorplan (SVG) with Multi-Floor Layout Support & CAD Compass
  function renderArchitecturalSvg() {
    const container = document.getElementById("svgContainer");
    if (!container) return;

    const layout = getLayoutInfo(currentTang);
    const layoutEl = document.getElementById("layoutName");
    if (layoutEl) layoutEl.textContent = layout.name;

    const canB1 = matBangTang(rawGioHang.can, "B1", currentTang, { pttt: currentPttt });
    const canB2 = matBangTang(rawGioHang.can, "B2", currentTang, { pttt: currentPttt });
    const mapB1 = new Map(canB1.map(c => [c.viTri, c]));
    const mapB2 = new Map(canB2.map(c => [c.viTri, c]));

    // Query active filter matching
    const qLoai = document.getElementById("qfSelectLoai")?.value || "all";
    const qHuong = document.getElementById("qfSelectHuong")?.value || "all";
    const qScope = document.getElementById("qfSelectScope")?.value || "all";

    // Best champion across Tháp B (or active scope)
    const ch2PN = getCheapestUnit({ loai: "2PN", scope: currentBlock === "ALL" ? "all" : currentBlock });
    const ch3PN = getCheapestUnit({ loai: "3PN", scope: currentBlock === "ALL" ? "all" : currentBlock });
    const chTang = getCheapestUnit({ loai: "all", scope: "tang" });

    const boardEl = document.getElementById("archBoard");
    if (boardEl) boardEl.classList.toggle("single-block", currentBlock === "B1" || currentBlock === "B2");

    // Dynamic viewBox & compass placement per block view (tightened margins for larger unit cards)
    const leftEdge = layout.type === "tang4" ? 6 : 42;
    let vb = `${leftEdge} 2 ${1794 - leftEdge} 696`;
    let compassX = 1715, compassY = 125;
    let legendX = 435;
    if (currentBlock === "B1") {
      vb = `${leftEdge} 2 ${804 - leftEdge} 696`;
      compassX = 838;
      legendX = 48;
    } else if (currentBlock === "B2") {
      vb = "792 2 1002 696";
      compassX = 1715;
      legendX = 830;
    }

    const renderCoreBox = (x, y, label) => `
      <g class="arch-core-unit" transform="translate(${x}, ${y})">
        <rect width="235" height="145" fill="var(--card-sub)" stroke="var(--svg-wall)" stroke-width="1.6" rx="5" />
        <!-- Thang bộ trái -->
        <rect x="6" y="7" width="42" height="131" fill="var(--card)" stroke="var(--svg-wall)" stroke-width="1.2" rx="3" />
        <text x="27" y="21" font-family="'Be Vietnam Pro', system-ui" font-size="7.5" font-weight="800" fill="var(--svg-wall)" text-anchor="middle">BỘ 1</text>
        ${Array.from({length: 9}, (_, i) => `<line x1="12" y1="${29 + i * 11}" x2="42" y2="${29 + i * 11}" stroke="var(--line)" stroke-width="1" />`).join("")}
        <!-- Sảnh 4 thang máy giữa -->
        <rect x="54" y="7" width="127" height="131" fill="var(--card)" stroke="var(--svg-wall)" stroke-width="1.4" rx="3" />
        <text x="117.5" y="21" font-family="'Be Vietnam Pro', system-ui" font-size="8.5" font-weight="800" fill="var(--navy)" text-anchor="middle">${label}</text>
        ${[0, 1].map(row => [0, 1].map(col => {
          const ex = 62 + col * 58;
          const ey = 28 + row * 54;
          const idx = row * 2 + col + 1;
          return `
            <rect x="${ex}" y="${ey}" width="52" height="46" fill="var(--card-sub)" stroke="var(--svg-wall)" stroke-width="1.1" rx="2" />
            <line x1="${ex}" y1="${ey}" x2="${ex + 52}" y2="${ey + 46}" stroke="var(--line)" stroke-width="0.9"/>
            <line x1="${ex + 52}" y1="${ey}" x2="${ex}" y2="${ey + 46}" stroke="var(--line)" stroke-width="0.9"/>
            <text x="${ex + 26}" y="${ey + 27}" font-family="'Be Vietnam Pro', system-ui" font-size="8.5" font-weight="800" fill="var(--svg-wall)" text-anchor="middle">TM${idx}</text>
          `;
        }).join("")).join("")}
        <!-- Thang bộ phải -->
        <rect x="187" y="7" width="42" height="131" fill="var(--card)" stroke="var(--svg-wall)" stroke-width="1.2" rx="3" />
        <text x="208" y="21" font-family="'Be Vietnam Pro', system-ui" font-size="7.5" font-weight="800" fill="var(--svg-wall)" text-anchor="middle">BỘ 2</text>
        ${Array.from({length: 9}, (_, i) => `<line x1="193" y1="${29 + i * 11}" x2="223" y2="${29 + i * 11}" stroke="var(--line)" stroke-width="1" />`).join("")}
      </g>
    `;

    let s = `<svg viewBox="${vb}" class="architectural-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hatch-sold" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--sold)" stroke-width="1.2" />
        </pattern>
        <pattern id="arch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--svg-grid)" stroke-width="0.8"/>
        </pattern>
        <pattern id="pool-water" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#0284C7"/>
          <path d="M 0 8 Q 4 4, 8 8 T 16 8" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
        </pattern>
        <pattern id="garden-hatch" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#D1FAE5"/>
          <circle cx="6" cy="6" r="2.5" fill="#10B981"/>
        </pattern>
        <filter id="gold-glow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="var(--gold)" flood-opacity="0.9"/>
        </filter>
        <filter id="box-shadow" x="-5%" y="-5%" width="115%" height="115%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.12"/>
        </filter>
      </defs>

      <!-- Background Blueprint Pattern -->
      <rect x="-100" y="0" width="2100" height="720" fill="var(--svg-bg)" />
      <rect x="-100" y="0" width="2100" height="720" fill="url(#arch-grid)" />

      <!-- Block Headers -->
      <text x="415" y="30" font-family="'Be Vietnam Pro', system-ui" font-size="14" font-weight="800" fill="var(--navy)" text-anchor="middle" letter-spacing="1.5">BLOCK B1 (${layout.type === 'tang3' ? '9' : (layout.type === 'tang19' || layout.type === 'tang20' ? '10' : (layout.type === 'tang2' ? '10' : '12'))} CĂN)</text>
      <text x="1310" y="30" font-family="'Be Vietnam Pro', system-ui" font-size="14" font-weight="800" fill="var(--navy)" text-anchor="middle" letter-spacing="1.5">BLOCK B2 (${layout.type === 'tang2' ? '12' : '15'} CĂN)</text>

      <!-- 2-Tier Stepped Corridor System -->
      <g class="arch-corridor">
        <!-- Hành lang nhánh TRÊN (Cao) -->
        <rect x="290" y="210" width="972" height="38" fill="var(--svg-corridor)" stroke="var(--svg-corridor-border)" stroke-width="1.4" rx="3" />
        <text x="793" y="233" font-family="'Be Vietnam Pro', system-ui" font-size="10.5" font-weight="700" fill="var(--mute)" text-anchor="middle" letter-spacing="2.5">HÀNH LANG CHÍNH (NHÁNH TRÊN)</text>

        <!-- Nhánh rẽ dọc bên trái Lõi thang B1 -->
        <rect x="290" y="246" width="34" height="176" fill="var(--svg-corridor)" stroke="var(--svg-corridor-border)" stroke-width="1.2" />
        <!-- Hành lang đáy trái B1 -->
        <rect x="55" y="420" width="510" height="36" fill="var(--svg-corridor)" stroke="var(--svg-corridor-border)" stroke-width="1.4" rx="3" />
        <text x="310" y="442" font-family="'Be Vietnam Pro', system-ui" font-size="10" font-weight="700" fill="var(--mute)" text-anchor="middle" letter-spacing="2">HÀNH LANG CÁNH TRÁI B1</text>

        <!-- Hành lang nhánh DƯỚI (Giật cấp thấp hơn ở bên phải B2) -->
        <rect x="1070" y="424" width="712" height="34" fill="var(--svg-corridor)" stroke="var(--svg-corridor-border)" stroke-width="1.4" rx="3" />
        <text x="1450" y="445" font-family="'Be Vietnam Pro', system-ui" font-size="10" font-weight="700" fill="var(--mute)" text-anchor="middle" letter-spacing="2">HÀNH LANG PHỤ B2 (NHÁNH DƯỚI)</text>
      </g>

      <!-- 2 Elevator & Stair Cores nestled inside the wings -->
      ${renderCoreBox(330, 254, "LÕI THANG B1")}
      ${renderCoreBox(1021, 254, "LÕI THANG B2")}

      <!-- Center Split Line at Top (Never overlaps corridor text) -->
      <line x1="793" y1="36" x2="793" y2="410" stroke="var(--gold-border)" stroke-width="2" stroke-dasharray="6 4" />
      <rect x="733" y="12" width="120" height="22" rx="4" fill="var(--gold)" />
      <text x="793" y="27" font-family="'Be Vietnam Pro', system-ui" font-size="9.5" font-weight="800" fill="#0F172A" text-anchor="middle">BLOCK B1 | B2</text>

      <!-- Specialized Architectural Zones depending on Floor Layout -->
      ${renderSpecialFloorZones(layout.type)}

      <!-- Units -->
      <g class="arch-units">
    `;

    const drawUnit = (block, viTri, geom, unit, customOpts = {}) => {
      const ma = customOpts.ma || (unit ? unit.ma : `${block}.${currentTang}-${String(viTri).padStart(2, '0')}`);
      const loai = customOpts.loai || (unit ? unit.loai : geom.loaiDefault);
      const huongText = customOpts.orient || unit?.huong || geom.orient;
      const isSelected = ma === selectedMa;
      const isAvailable = !customOpts.isRefOnly && !!unit && unit.trangThai === "trong";
      const isOutOfStock = !customOpts.isRefOnly && !unit;
      const isDaBan = !customOpts.isRefOnly && unit && unit.trangThai === "daBan";

      const isChamp2PN = !customOpts.isRefOnly && ch2PN && unit && unit.ma === ch2PN.ma;
      const isChamp3PN = !customOpts.isRefOnly && ch3PN && unit && unit.ma === ch3PN.ma;
      const isChampTang = !customOpts.isRefOnly && chTang && unit && unit.ma === chTang.ma && !isChamp2PN && !isChamp3PN;

      let matches = true;
      if (!customOpts.isRefOnly) {
        if (qLoai !== "all" && !loai.toLowerCase().includes(qLoai.toLowerCase())) matches = false;
        if (qHuong !== "all" && !matchesHuong(huongText, qHuong)) matches = false;
        if (qScope === "B1" && block !== "B1") matches = false;
        if (qScope === "B2" && block !== "B2") matches = false;
      }

      const unitFilterStyle = matches ? (isOutOfStock ? "opacity: 0.65;" : "opacity: 1;") : "opacity: 0.25; filter: grayscale(60%);";
      let priceText = customOpts.isRefOnly
        ? `LL ${customOpts.ll} m²`
        : (isOutOfStock ? "ĐÃ BÁN / KHÓA" : (isDaBan ? "ĐÃ CỌC" : (unit.giaChuaVat?.[currentPttt] ? fmtTy(unit.giaChuaVat[currentPttt]) : "—")));

      let fillColor = "var(--svg-unit-bg)";
      let strokeColor = geom.cat || "var(--svg-wall)";
      let strokeWidth = "1.8";
      let filterAttr = 'filter="url(#box-shadow)"';

      if (isDaBan || isOutOfStock) {
        fillColor = "url(#hatch-sold)";
        strokeColor = geom.cat ? geom.cat : "var(--sold)";
        strokeWidth = "1.4";
        filterAttr = "";
      } else if (isSelected) {
        fillColor = "var(--gold-soft)";
        strokeColor = "var(--gold)";
        strokeWidth = "3.5";
        filterAttr = 'filter="url(#gold-glow)"';
      } else if (isChamp2PN || isChamp3PN) {
        fillColor = "var(--gold-soft)";
        strokeColor = "var(--gold-border)";
        strokeWidth = "2.5";
      }

      const midX = geom.x + geom.w / 2;
      const catColor = geom.cat || "var(--navy)";

      // Sân vườn SV badge (Tầng 3 & Tầng 4) & Corner icon
      const svKey = `${block}-${String(viTri).padStart(2, '0')}`;
      const svArea = layout.type === "tang3" ? TANG3_SV[svKey] : (layout.type === "tang4" ? TANG4_SV[svKey] : null);
      const isCorner = (block === "B1" && [4, 5, 7, 10, 11].includes(viTri)) || (block === "B2" && [2, 3, 6, 9, 10].includes(viTri));

      const labelY = geom.y + 8;
      const pillLabel = customOpts.label || `${block}.${geom.label}`;
      const rawDt = customOpts.isRefOnly ? Number(customOpts.tt) : Number(unit ? unit.dtTimTuong : geom.dt);
      const areaText = customOpts.isRefOnly
        ? `TT ${rawDt.toFixed(1)}m²`
        : `${rawDt.toFixed(1)}m²`;
      const compactLoai = loai.replace("-1WC", "").replace("-2WC", "").replace("-3WC", "");

      // Căn đã cọc không mang giá trong dữ liệu của ô (không để lộ giá căn đã bán)
      const giaChuaVatNum = isAvailable ? (unit?.giaChuaVat?.[currentPttt] || 0) : 0;
      const giaVatNum = isAvailable ? (unit?.giaVat?.[currentPttt] || (giaChuaVatNum > 0 ? giaCoVat(giaChuaVatNum) : 0)) : 0;
      const clipId = `clip-${ma.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

      return `
        <g class="unit-vector ${isSelected ? 'active' : ''} ${(isDaBan || isOutOfStock) ? 'sold' : ''}" 
           data-ma="${ma}" data-vt="${viTri || 0}" data-loai="${loai}" data-avail="${isAvailable ? '1' : '0'}"
           data-dt="${areaText}" data-huong="${huongText}" data-giacv="${giaChuaVatNum}" data-giavat="${giaVatNum}" data-sv="${svArea || ''}"
           style="${unitFilterStyle}">
          <defs><clipPath id="${clipId}"><rect x="${geom.x}" y="${geom.y}" width="${geom.w}" height="${geom.h}" rx="6"/></clipPath></defs>
          <rect x="${geom.x}" y="${geom.y}" width="${geom.w}" height="${geom.h}" 
                fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="6" ${filterAttr}/>
          <g clip-path="url(#${clipId})">
          <!-- Top color-coded category bar -->
          <rect x="${geom.x + 1}" y="${geom.y + 1}" width="${geom.w - 2}" height="4.5" fill="${catColor}" rx="3" opacity="0.9"/>

          <!-- Line 1: Code pill + SV/Corner icons + Champion badge -->
          <g transform="translate(${geom.x + 5}, ${labelY})">
            <rect width="46" height="19" rx="4" fill="${catColor}" />
            <text x="23" y="13" font-family="'Be Vietnam Pro', system-ui" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">${pillLabel}</text>
            ${svArea ? `<text x="49" y="13" font-size="10.5" title="Có sân vườn">🌱</text>` : (isCorner ? `<text x="49" y="13" font-size="10" title="Căn góc">📐</text>` : '')}
          </g>
          ${isChamp2PN ? `
            <g transform="translate(${geom.x + geom.w - (geom.w < 105 ? 38 : 50)}, ${labelY})">
              <rect width="${geom.w < 105 ? 34 : 46}" height="19" rx="4" fill="var(--gold)" />
              <text x="${geom.w < 105 ? 17 : 23}" y="13" font-family="'Be Vietnam Pro', system-ui" font-size="7.5" font-weight="800" fill="#052F57" text-anchor="middle">${geom.w < 105 ? '★ RẺ' : '★ RẺ 2PN'}</text>
            </g>
          ` : (isChamp3PN ? `
            <g transform="translate(${geom.x + geom.w - 50}, ${labelY})">
              <rect width="46" height="19" rx="4" fill="var(--gold)" />
              <text x="23" y="13" font-family="'Be Vietnam Pro', system-ui" font-size="7.5" font-weight="800" fill="#052F57" text-anchor="middle">★ RẺ 3PN</text>
            </g>
          ` : (isChampTang ? `
            <g transform="translate(${geom.x + geom.w - (geom.w < 105 ? 36 : 46)}, ${labelY})">
              <rect width="${geom.w < 105 ? 32 : 42}" height="19" rx="4" fill="var(--green)" />
              <text x="${geom.w < 105 ? 16 : 21}" y="13" font-family="'Be Vietnam Pro', system-ui" font-size="7.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">${geom.w < 105 ? 'RẺ' : 'RẺ TẦNG'}</text>
            </g>
          ` : ''))}

          <!-- Line 2: Type & Area (compact, never overflows) -->
          <text x="${midX}" y="${geom.y + 49}" font-family="'Be Vietnam Pro', system-ui" font-size="${geom.w < 105 ? '10' : '11'}" font-weight="700" fill="var(--svg-unit-text)" text-anchor="middle">${compactLoai} • ${areaText}</text>

          <!-- Line 3: Prominent Price Pill -->
          <g transform="translate(${geom.x + 5}, ${geom.y + 60})">
            <rect width="${geom.w - 10}" height="27" rx="4" 
                  fill="${isSelected ? 'var(--navy)' : ((isDaBan || isOutOfStock) ? 'var(--card-sub)' : 'var(--svg-price-bg)')}" 
                  stroke="var(--line)" stroke-width="1"/>
            <text x="${(geom.w - 10) / 2}" y="18.5" 
                  font-family="'Be Vietnam Pro', system-ui" font-size="${isOutOfStock ? '9' : '13.5'}" font-weight="800" 
                  fill="${isSelected ? 'var(--gold)' : ((isDaBan || isOutOfStock) ? 'var(--sold)' : 'var(--svg-price-ink)')}" text-anchor="middle">${priceText}</text>
          </g>

          ${svArea ? `
            <g transform="translate(${geom.x + 6}, ${geom.y + geom.h - 23})">
              <rect width="${geom.w - 12}" height="17" rx="3" fill="#059669" />
              <text x="${(geom.w - 12) / 2}" y="12" font-family="'Be Vietnam Pro', system-ui" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+ SV ${svArea} m²</text>
            </g>
          ` : `
            <text x="${midX}" y="${geom.y + geom.h - 9}" font-family="'Be Vietnam Pro', system-ui" font-size="9.5" font-weight="600" fill="var(--mute)" text-anchor="middle">${huongText}</text>
          `}
          </g>
        </g>
      `;
    };

    if (layout.type === "tang2") {
      for (const u of TANG2_UNITS) {
        const blk = u.x < 793 ? "B1" : "B2";
        if (currentBlock !== "ALL" && blk !== currentBlock) continue;
        s += drawUnit(blk, 0, u, null, { isRefOnly: true, ma: u.ma, label: u.label, loai: "Tầng 2", tt: u.tt, ll: u.ll, orient: u.orient });
      }
    } else {
      if (currentBlock === "ALL" || currentBlock === "B1") {
        for (let viTri = 1; viTri <= 12; viTri++) {
          if (layout.type === "tang3" && (viTri === 5 || viTri === 6 || viTri === 7)) continue;
          if ((layout.type === "tang19" || layout.type === "tang20") && (viTri === 5 || viTri === 6)) continue;
          const geom = B1_GEOM[viTri];
          if (geom) s += drawUnit("B1", viTri, geom, mapB1.get(viTri));
        }
      }
      if (currentBlock === "ALL" || currentBlock === "B2") {
        for (let viTri = 1; viTri <= 15; viTri++) {
          const geom = B2_GEOM[viTri];
          if (geom) s += drawUnit("B2", viTri, geom, mapB2.get(viTri));
        }
      }
    }

    s += `
      </g>

      <!-- Accurate CAD Compass Rose (Needle rotated -45° to True North) -->
      <g class="arch-compass" transform="translate(${compassX}, ${compassY})">
        <circle r="44" fill="var(--card)" stroke="var(--line)" stroke-width="1.5" filter="url(#box-shadow)" />
        <circle r="38" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 3" />
        <g transform="rotate(-45)">
          <polygon points="0,-33 6,-6 0,-10 -6,-6" fill="var(--navy)" />
          <polygon points="0,-33 0,-10 -6,-6" fill="var(--navy-deep)" />
          <polygon points="0,33 6,6 0,10 -6,6" fill="var(--line)" />
          <polygon points="33,0 6,6 10,0 6,-6" fill="var(--line)" />
          <polygon points="-33,0 -6,6 -10,0 -6,-6" fill="var(--line)" />
          <circle cx="0" cy="-33" r="8" fill="var(--gold)" />
          <text x="0" y="-29.5" font-family="'Be Vietnam Pro', system-ui" font-size="10" font-weight="800" fill="#052F57" text-anchor="middle">B</text>
          <text x="0" y="44" font-family="'Be Vietnam Pro', system-ui" font-size="8.5" font-weight="700" fill="var(--mute)" text-anchor="middle">N</text>
          <text x="44" y="3.5" font-family="'Be Vietnam Pro', system-ui" font-size="8.5" font-weight="700" fill="var(--mute)" text-anchor="middle">Đ</text>
          <text x="-44" y="3.5" font-family="'Be Vietnam Pro', system-ui" font-size="8.5" font-weight="700" fill="var(--mute)" text-anchor="middle">T</text>
        </g>
        <text x="0" y="58" font-family="'Be Vietnam Pro', system-ui" font-size="8.5" font-weight="700" fill="var(--mute)" text-anchor="middle">HƯỚNG BẮC (CAD)</text>
      </g>

      <!-- Legend (12px readable) -->
      <g class="arch-legend" transform="translate(${legendX}, 682)">
        <rect x="0" y="-18" width="960" height="28" rx="6" fill="var(--card)" stroke="var(--line)" stroke-width="1"/>
        <circle cx="16" cy="-4" r="5" fill="var(--navy)"/>
        <text x="26" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="12" font-weight="700" fill="var(--ink)">Còn trống</text>
        <circle cx="102" cy="-4" r="5" fill="var(--gold)"/>
        <text x="112" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="12" font-weight="700" fill="var(--gold-border)">★ Rẻ nhất</text>
        <rect x="184" y="-9" width="10" height="10" fill="url(#hatch-sold)" stroke="var(--sold)" stroke-width="1"/>
        <text x="199" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="12" font-weight="600" fill="var(--sold)">Đã bán</text>
        <circle cx="262" cy="-4" r="4.5" fill="#A855F7"/><text x="271" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--ink)">3PN 77.8m²</text>
        <circle cx="358" cy="-4" r="4.5" fill="#EC4899"/><text x="367" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--ink)">2PN ~55m²</text>
        <circle cx="448" cy="-4" r="4.5" fill="#F97316"/><text x="457" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--ink)">3PN B6</text>
        <circle cx="518" cy="-4" r="4.5" fill="#06B6D4"/><text x="527" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--ink)">3PN B1</text>
        <circle cx="588" cy="-4" r="4.5" fill="#22C55E"/><text x="597" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--ink)">B2 65-94m²</text>
        <circle cx="684" cy="-4" r="4.5" fill="#F59E0B"/><text x="693" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--ink)">2PN 47m²</text>
        <circle cx="768" cy="-4" r="4.5" fill="#3B82F6"/><text x="777" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--ink)">3PN 80.5m²</text>
        <text x="866" y="0" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="600" fill="var(--mute)">🌱 Sân vườn · 📐 Góc</text>
      </g>
    </svg>`;

    container.innerHTML = s;

    // Floating Hover Tooltip (Desktop >= 1024px with fine pointer ONLY) + Click events on SVG units
    const tooltip = document.getElementById("svgTooltip");
    if (tooltip) tooltip.classList.remove("show");
    const canHoverTooltip = window.innerWidth >= 1024 && window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    container.querySelectorAll(".unit-vector").forEach(el => {
      el.addEventListener("click", () => {
        if (tooltip) tooltip.classList.remove("show");
        const ma = el.dataset.ma;
        const avail = el.dataset.avail === "1";
        if (!avail) {
          showToast(layout.type === "tang2"
            ? `Căn ${ma} (Tầng 2) là mặt bằng tham khảo CĐT.`
            : `Căn ${ma} hiện không còn trong giỏ hàng (đã bán hoặc chưa mở bán).`);
          return;
        }
        if (ma) {
          selectCan(ma);
          if (window.innerWidth < 1024 && typeof openMobileDrawer === "function") {
            openMobileDrawer();
          }
        }
      });
      if (tooltip && canHoverTooltip) {
        el.addEventListener("mouseenter", () => {
          if (document.querySelector(".modal-overlay.open") || document.getElementById("rightPane")?.classList.contains("drawer-open")) return;
          const ma = el.dataset.ma;
          const loai = el.dataset.loai;
          const dt = el.dataset.dt;
          const huong = el.dataset.huong;
          const giacv = Number(el.dataset.giacv || 0);
          const giavat = Number(el.dataset.giavat || 0) || (giacv > 0 ? giaCoVat(giacv) : 0);
          const sv = el.dataset.sv;
          const avail = el.dataset.avail === "1";
          tooltip.innerHTML = `
            <div class="tt-head"><span>Căn ${ma}</span><span class="tt-badge">${avail ? "Còn trống" : "Đã bán / Tham khảo"}</span></div>
            <div><b>${loai}</b> · DT ${dt}${sv ? ` (+SV ${sv}m²)` : ""}</div>
            <div>Hướng: ${huong}</div>
            ${giacv > 0 ? `<div style="margin-top:3px;">Chưa VAT: <b>${fmtTy(giacv)}</b> · Có VAT: <b>${fmtTy(giavat)}</b></div>` : ""}
          `;
          tooltip.classList.add("show");
        });
        el.addEventListener("mousemove", (e) => {
          const pad = 14;
          let tx = Math.max(10, e.clientX + pad);
          let ty = Math.max(10, e.clientY + pad);
          if (tx + 245 > window.innerWidth) tx = Math.max(10, e.clientX - 245);
          if (ty + 115 > window.innerHeight) ty = Math.max(10, e.clientY - 115);
          tooltip.style.left = tx + "px";
          tooltip.style.top = ty + "px";
        });
        el.addEventListener("mouseleave", () => {
          tooltip.classList.remove("show");
        });
      }
    });
  }

  // Render specific layout features for special floors (F2 SHCD, F3 Pool/Gym, F4 Garden, F19 Sky Garden, F20 Void)
  function renderSpecialFloorZones(layoutType) {
    if (layoutType === "tang2") {
      return `
        <!-- Floor 2: 2 Sinh Hoạt Cộng Đồng zones in the center -->
        <g class="special-zone shcd-f2">
          <rect x="571" y="254" width="180" height="145" fill="#1E40AF" fill-opacity="0.18" stroke="#3B82F6" stroke-width="1.8" rx="6" />
          <text x="661" y="322" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="800" fill="#60A5FA" text-anchor="middle">SINH HOẠT</text>
          <text x="661" y="338" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="800" fill="#60A5FA" text-anchor="middle">CỘNG ĐỒNG</text>

          <rect x="835" y="254" width="180" height="145" fill="#1E40AF" fill-opacity="0.18" stroke="#3B82F6" stroke-width="1.8" rx="6" />
          <text x="925" y="322" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="800" fill="#60A5FA" text-anchor="middle">SINH HOẠT</text>
          <text x="925" y="338" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="800" fill="#60A5FA" text-anchor="middle">CỘNG ĐỒNG</text>
        </g>
      `;
    }
    if (layoutType === "tang3") {
      return `
        <!-- Floor 3: Infinity Swimming Pool & Gym replacing B1-05, B1-06, B1-07 -->
        <g class="special-zone pool-gym">
          <rect x="55" y="58" width="265" height="145" fill="url(#pool-water)" stroke="#0284C7" stroke-width="2" rx="6" />
          <rect x="65" y="66" width="245" height="129" fill="none" stroke="#BAE6FD" stroke-width="1.5" stroke-dasharray="4 3" rx="4" />
          <text x="187" y="135" font-family="'Be Vietnam Pro', system-ui" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">HỒ BƠI TRÀN</text>
          <rect x="55" y="212" width="230" height="187" fill="var(--card-sub)" stroke="var(--svg-wall)" stroke-width="1.8" rx="6" />
          <rect x="330" y="58" width="125" height="145" fill="var(--card-sub)" stroke="var(--svg-wall)" stroke-width="1.8" rx="6" />
          <text x="170" y="308" font-family="'Be Vietnam Pro', system-ui" font-size="12.5" font-weight="800" fill="var(--navy)" text-anchor="middle">PHÒNG GYM &amp; YOGA</text>
          <text x="392" y="135" font-family="'Be Vietnam Pro', system-ui" font-size="11.5" font-weight="800" fill="var(--navy)" text-anchor="middle">PHÒNG GYM</text>
        </g>
      `;
    }
    if (layoutType === "tang4") {
      return `
        <!-- Floor 4: Cảnh quan sân vườn bên trái B1-05 -->
        <g class="special-zone sky-garden">
          <rect x="10" y="254" width="40" height="145" fill="url(#garden-hatch)" stroke="#059669" stroke-width="1.8" rx="4" />
          <text x="30" y="326" font-family="'Be Vietnam Pro', system-ui" font-size="8.5" font-weight="800" fill="#065F46" text-anchor="middle" transform="rotate(-90 30 326)">CẢNH QUAN SÂN VƯỜN</text>
        </g>
      `;
    }
    if (layoutType === "tang19") {
      return `
        <!-- Floor 19: Sky Garden Lounge replacing B1-05 & B1-06 -->
        <g class="special-zone sky-terrace">
          <rect x="55" y="254" width="229" height="145" fill="url(#garden-hatch)" stroke="#10B981" stroke-width="1.8" rx="6" />
          <text x="169" y="322" font-family="'Be Vietnam Pro', system-ui" font-size="12" font-weight="800" fill="#065F46" text-anchor="middle">KHU SÂN VƯỜN TRÊN CAO</text>
          <text x="169" y="340" font-family="'Be Vietnam Pro', system-ui" font-size="10" font-weight="600" fill="#047857" text-anchor="middle">Sky Garden Tầng 19</text>
        </g>
      `;
    }
    if (layoutType === "tang20") {
      return `
        <!-- Floor 20: Void / Mái thu nhỏ replacing B1-05 & B1-06 -->
        <g class="special-zone sky-void">
          <rect x="55" y="254" width="229" height="145" fill="var(--svg-corridor)" fill-opacity="0.45" stroke="var(--line)" stroke-width="1.3" stroke-dasharray="6 4" rx="6" />
          <text x="169" y="322" font-family="'Be Vietnam Pro', system-ui" font-size="11" font-weight="700" fill="var(--mute)" text-anchor="middle">THÔNG TẦNG / MÁI THU NHỎ</text>
          <text x="169" y="340" font-family="'Be Vietnam Pro', system-ui" font-size="9.5" font-weight="600" fill="var(--mute)" text-anchor="middle">(Khuyết B1-05, B1-06)</text>
        </g>
      `;
    }
    return "";
  }

  // Dynamic Query Engine across Tháp B (Block B1 + Block B2)
  function getCheapestUnit({ loai = "all", huong = "all", scope = "all" } = {}) {
    let pool = rawGioHang.can.filter(c => trangThai(c.tinhTrang) === "trong" && c.giaChuaVat?.[currentPttt]);
    
    // Filter Scope
    if (scope === "B1" || scope === "B2") {
      pool = pool.filter(c => (c.block || parseMa(c.ma)?.block) === scope);
    } else if (scope === "tang") {
      pool = pool.filter(c => (c.tang || parseMa(c.ma)?.tang) === currentTang);
    } else if (scope === "thap") {
      pool = pool.filter(c => { const t = c.tang || parseMa(c.ma)?.tang; return t >= 3 && t <= 9; });
    } else if (scope === "trung") {
      pool = pool.filter(c => { const t = c.tang || parseMa(c.ma)?.tang; return t >= 10 && t <= 18; });
    } else if (scope === "cao") {
      pool = pool.filter(c => { const t = c.tang || parseMa(c.ma)?.tang; return t >= 19; });
    }

    // Filter Type
    if (loai !== "all") {
      pool = pool.filter(c => c.loai.toLowerCase().includes(loai.toLowerCase()));
    }

    // Filter Orientation (using real orientation from MasterFile + fallback to geometry)
    if (huong !== "all") {
      pool = pool.filter(c => {
        const p = parseMa(c.ma);
        const hStr = c.huong || (p ? getGeom(p.block, p.viTri)?.orient : "");
        return matchesHuong(hStr, huong);
      });
    }

    if (!pool.length) return null;
    pool.sort((a, b) => a.giaChuaVat[currentPttt] - b.giaChuaVat[currentPttt]);
    return pool[0];
  }

  // Update Finder Result Box whenever query controls change
  function updateFinderQuery() {
    const qLoai = document.getElementById("qfSelectLoai")?.value || "all";
    const qHuong = document.getElementById("qfSelectHuong")?.value || "all";
    const qScope = document.getElementById("qfSelectScope")?.value || "all";

    const resetBtn = document.getElementById("btnResetFilter");
    if (resetBtn) {
      const hasFilter = qLoai !== "all" || qHuong !== "all" || qScope !== "all";
      resetBtn.classList.toggle("visible", hasFilter);
    }

    const ch = getCheapestUnit({ loai: qLoai, huong: qHuong, scope: qScope });
    const maEl = document.getElementById("qfResultMa");
    const priceEl = document.getElementById("qfResultPrice");
    const jumpBtn = document.getElementById("btnJumpCheapest");

    if (ch) {
      if (maEl) maEl.textContent = ch.ma;
      if (priceEl) priceEl.textContent = fmtTy(ch.giaChuaVat[currentPttt]);
      if (jumpBtn) {
        jumpBtn.disabled = false;
        jumpBtn.dataset.targetMa = ch.ma;
      }
    } else {
      if (maEl) maEl.textContent = "Không có";
      if (priceEl) priceEl.textContent = "—";
      if (jumpBtn) {
        jumpBtn.disabled = true;
        jumpBtn.dataset.targetMa = "";
      }
    }

    renderArchitecturalSvg();
  }

  // Generate Quick Chips Row dynamically from data (grouped with dividers)
  function renderQuickChips() {
    const row = document.getElementById("quickChipsRow");
    if (!row) return;
    const activeScope = currentBlock === "ALL" ? "all" : currentBlock;

    const groupTypes = [
      { label: "🔥 2PN Rẻ nhất", loai: "2PN", huong: "all", scope: activeScope, isHot: true },
      { label: "👑 3PN Rẻ nhất", loai: "3PN", huong: "all", scope: activeScope, isHot: true },
      { label: "2PN-1WC", loai: "2PN-1WC", huong: "all", scope: activeScope },
      { label: "2PN-2WC", loai: "2PN-2WC", huong: "all", scope: activeScope },
      { label: "3PN-2WC", loai: "3PN-2WC", huong: "all", scope: activeScope },
      { label: "3PN-3WC", loai: "3PN-3WC", huong: "all", scope: activeScope },
    ];
    const groupOrient = [
      { label: "🧭 Hướng Nam mát", loai: "all", huong: "Nam", scope: activeScope },
      { label: "🧭 Hướng Bắc", loai: "all", huong: "Bắc", scope: activeScope },
      { label: "⚡ Rẻ nhất tầng", loai: "all", huong: "all", scope: "tang" },
    ];

    const renderChip = (q) => {
      const ch = getCheapestUnit(q);
      const priceTxt = ch ? fmtTy(ch.giaChuaVat[currentPttt]) : "—";
      const targetMa = ch ? ch.ma : "";
      return `
        <button type="button" class="qf-chip ${q.isHot ? 'is-hot' : ''}" data-ma="${targetMa}" data-loai="${q.loai}" data-huong="${q.huong}" data-scope="${q.scope}">
          <span>${q.label}:</span>
          <span class="chip-price">${priceTxt}</span>
        </button>
      `;
    };

    row.innerHTML = groupTypes.map(renderChip).join("") + `<span class="qf-divider"></span>` + groupOrient.map(renderChip).join("");

    row.querySelectorAll(".qf-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        row.querySelectorAll(".qf-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");

        const sLoai = document.getElementById("qfSelectLoai");
        const sHuong = document.getElementById("qfSelectHuong");
        const sScope = document.getElementById("qfSelectScope");
        if (sLoai) sLoai.value = chip.dataset.loai || "all";
        if (sHuong) sHuong.value = chip.dataset.huong || "all";
        if (sScope && ["all", "B1", "B2", "tang"].includes(chip.dataset.scope)) {
          sScope.value = chip.dataset.scope;
        }

        const targetMa = chip.dataset.ma;
        if (targetMa) {
          selectCan(targetMa);
          showToast(`Đã chọn căn ${targetMa} (${chip.querySelector("span").textContent.replace(":", "")})`);
        } else {
          updateFinderQuery();
          showToast("Không tìm thấy căn còn trống phù hợp tiêu chí.");
        }
      });
    });
  }

  // Wire up Finder Selectors
  ["qfSelectLoai", "qfSelectHuong", "qfSelectScope"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => {
      document.querySelectorAll(".qf-chip").forEach(c => c.classList.remove("active"));
      updateFinderQuery();
    });
  });

  document.getElementById("btnJumpCheapest")?.addEventListener("click", () => {
    const targetMa = document.getElementById("btnJumpCheapest")?.dataset.targetMa;
    if (targetMa) {
      selectCan(targetMa);
      showToast(`Đã chọn ngay: ${targetMa}`);
    }
  });

  function renderCungViTri(ma) {
    const list = cungViTri(rawGioHang.can, ma);
    const p = parseMa(ma);
    const titleEl = document.getElementById("cungVtTitle") || document.getElementById("stripTitle");
    if (titleEl && p) {
      titleEl.textContent = `CĂN CÙNG VỊ TRÍ ${String(p.viTri).padStart(2, '0')} (BLOCK ${p.block})`;
    }

    const curUnit = rawGioHang.can.find(x => x.ma === selectedMa);
    const curPrice = curUnit?.giaChuaVat?.[currentPttt] || 0;

    const re = danhDauGiaRe(rawGioHang.can, { pttt: currentPttt });
    const grid = document.getElementById("cungVtGrid") || document.getElementById("stripGrid");
    if (!grid) return;

    const htmlCards = list.map(c => {
      const isSel = c.ma === selectedMa;
      const isDaBan = c.trangThai === "daBan";
      const isReBlock = re[c.ma]?.reNhatBlock;
      const isReTang = re[c.ma]?.reNhatTang;
      const unitPrice = c.giaChuaVat?.[currentPttt] || 0;
      const cost = isDaBan ? "ĐÃ BÁN" : (unitPrice ? fmtTy(unitPrice) : "—");
      const badge = isReBlock ? '<span class="vt-badge badge-re-block">RẺ BLOCK</span>' : (isReTang ? '<span class="vt-badge badge-re-tang">RẺ TẦNG</span>' : '');

      let diffHtml = "";
      if (!isSel && !isDaBan && unitPrice > 0 && curPrice > 0) {
        const diffTr = Math.round((unitPrice - curPrice) / 1e6);
        if (diffTr !== 0) {
          const sign = diffTr > 0 ? "+" : "";
          const cls = diffTr < 0 ? "cheaper" : "";
          diffHtml = `<div class="vt-diff ${cls}">(${sign}${diffTr}tr)</div>`;
        }
      }

      return `<div class="vt-card strip-pill ${isSel ? 'active' : ''} ${isDaBan ? 'daban' : ''}" data-ma="${c.ma}" data-tang="${c.tang}">
        <div class="vt-head"><span>Tầng ${String(c.tang).padStart(2, '0')}</span><span>${c.ma}</span></div>
        <div class="vt-price p-cost">${cost}</div>
        ${diffHtml}
        ${badge}
      </div>`;
    }).join("");

    grid.innerHTML = htmlCards;
    const drawerGrid = document.getElementById("drawerCungVtGrid");
    if (drawerGrid) drawerGrid.innerHTML = htmlCards;

    [grid, drawerGrid].filter(Boolean).forEach(containerEl => {
      containerEl.querySelectorAll(".vt-card, .strip-pill").forEach(el => {
        el.addEventListener("click", () => {
          const targetMa = el.dataset.ma;
          const targetTang = Number(el.dataset.tang);
          if (targetTang && targetTang !== currentTang) {
            currentTang = targetTang;
            updateTangUI();
          }
          selectCan(targetMa);
        });
      });
    });
  }

  function renderDetailCard(ma) {
    const c = theCan(rawGioHang.can, ma, { pttt: currentPttt });
    if (!c) return;

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt("canMa", c.ma);
    setTxt("canLoai", `${c.loai} · ${c.dtTimTuong} m² tim tường (${c.dtThongThuy || '—'} m² thông thủy)`);
    setTxt("mbCanMa", c.ma);
    const mbGia = c.trangThai === "trong" && c.gia?.[currentPttt]?.chuaVat
      ? `${fmtTy(c.gia[currentPttt].chuaVat)} · ${c.loai}`
      : (c.trangThai === "daBan" ? "ĐÃ BÁN" : "CHƯA RÕ");
    setTxt("mbCanGia", mbGia);

    const stEl = document.getElementById("canStatus");
    if (stEl) {
      stEl.textContent = c.trangThai === "trong" ? "CÒN TRỐNG" : (c.trangThai === "daBan" ? "ĐÃ BÁN" : "CHƯA RÕ TÌNH TRẠNG");
      stEl.className = "status-tag " + c.trangThai;
    }

    // Rank Banner Update
    const rankBadge = document.getElementById("rankBadge");
    const rankDesc = document.getElementById("rankDesc");
    if (rankBadge && rankDesc) {
      if (c.reNhatBlock) {
        rankBadge.textContent = `🏆 CĂN ${c.loai.split('-')[0]} RẺ NHẤT TOÀN BLOCK ${c.block}`;
        rankDesc.textContent = `Hạng 1 về giá trong dòng ${c.loai} Block ${c.block}.`;
      } else if (c.reNhatTang) {
        rankBadge.textContent = `⭐ CĂN RẺ NHẤT TRÊN TẦNG ${c.tang}`;
        rankDesc.textContent = `Giá thấp nhất tầng ${c.tang} cho dòng ${c.loai}.`;
      } else {
        const rankTangTxt = c.hangTang ? `Hạng ${c.hangTang} trên tầng ${c.tang}` : '';
        const rankBlockTxt = c.hangBlock ? `hạng ${c.hangBlock} toàn block` : '';
        rankBadge.textContent = `VỊ TRÍ ${String(c.viTri).padStart(2, '0')} · TẦNG ${c.tang}`;
        rankDesc.textContent = [rankTangTxt, rankBlockTxt].filter(Boolean).join(' · ');
      }
    }

    if (c.trangThai !== "trong" || !c.gia) {
      setTxt("giaChuaVat", c.trangThai === "daBan" ? "ĐÃ BÁN" : "CHƯA RÕ");
      setTxt("giaCoVat", "—");
      setTxt("tuCo", "—");
      setTxt("khoanVay", "—");
      setTxt("banGiao", "—");
      setTxt("traGop", "—");
      const sb = document.getElementById("schedBody") || document.getElementById("schedList");
      if (sb) sb.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#999;">${c.trangThai === 'daBan' ? 'Căn đã cọc / đã bán.' : 'Chưa rõ tình trạng trong giỏ hàng (kiểm cột tình trạng trong Sheet).'} Không lập phiếu tính.</td></tr>`;
      return;
    }

    const plan = PLANS[currentPttt];
    const calcRes = phuongAn(plan, c.gia[currentPttt].chuaVat, { vay: loanOverride });
    const effectiveLoan = calcRes.khoanVay;
    const effectiveOwn = calcRes.tuCo;
    const monthly = calcRes.traGopThang;

    setTxt("giaChuaVat", fmtTy(calcRes.P));
    setTxt("giaCoVat", fmtTy(calcRes.G));
    setTxt("tuCo", fmtTrieu(effectiveOwn));
    setTxt("khoanVay", effectiveLoan > 0 ? fmtTy(effectiveLoan) : "Không vay");
    setTxt("banGiao", fmtTrieu(calcRes.handover + calcRes.fee));
    setTxt("traGop", effectiveLoan > 0 ? `~${fmtTrieu1(monthly)}/tháng` : "Không vay");

    // Schedule
    const schedBody = document.getElementById("schedBody");
    if (schedBody) {
      schedBody.innerHTML = calcRes.rows.map((r, i) => `
        <tr class="${r.bank ? 'bank' : ''}">
          <td>Đợt ${i + 1}</td>
          <td>${r.l}<br><small style="color:var(--mute)">${r.w}</small></td>
          <td class="r">${r.p}%</td>
          <td class="r">${fmtDong(r.amt)}</td>
        </tr>
      `).join("") + `
        <tr><td>Bảo trì</td><td>Phí bảo trì 2% (khi bàn giao)</td><td class="r">2%</td><td class="r">${fmtDong(calcRes.fee)}</td></tr>
      `;
    }
  }

  function selectCan(ma) {
    selectedMa = ma;
    const p = parseMa(ma);
    if (p && p.tang !== currentTang) {
      currentTang = p.tang;
      updateTangUI();
    }
    renderArchitecturalSvg();
    renderCungViTri(ma);
    renderDetailCard(ma);
  }

  function renderTangPills() {
    const container = document.getElementById("tangPills");
    if (!container) return;
    const floorStats = new Map();
    for (const c of rawGioHang.can) {
      if (trangThai(c.tinhTrang) !== "trong") continue;
      const blk = c.block || parseMa(c.ma)?.block;
      if (currentBlock !== "ALL" && blk !== currentBlock) continue;
      const t = c.tang || parseMa(c.ma)?.tang;
      const price = c.giaChuaVat?.[currentPttt] || 0;
      if (!floorStats.has(t)) floorStats.set(t, { count: 0, minPrice: Infinity });
      const st = floorStats.get(t);
      st.count++;
      if (price > 0 && price < st.minPrice) st.minPrice = price;
    }

    let html = "";
    for (let t = 2; t <= 29; t++) {
      const st = floorStats.get(t);
      const hasUnit = !!st && st.count > 0;
      const suffix = t === 2 ? " (SHCĐ)" : (t === 19 ? " (Vườn)" : "");
      const tip = t === 2
        ? "Tầng 2 (SHCĐ): Mặt bằng tham khảo CĐT"
        : (hasUnit ? `Tầng ${t}: ${st.count} căn trống - Giá từ ${fmtTy(st.minPrice)}` : `Tầng ${t}: Không có căn trống trong GHC`);
      html += `<button class="tang-btn ${t === currentTang ? 'active' : ''}" data-tang="${t}" type="button" style="${(hasUnit || t === 2) ? '' : 'opacity:0.55;'}" title="${tip}">T${t}${suffix}${hasUnit ? '•' : ''}</button>`;
    }
    container.innerHTML = html;
    container.querySelectorAll(".tang-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentTang = Number(btn.dataset.tang);
        updateTangUI();
        const ch = getCheapestUnit({ loai: "all", scope: "tang" });
        if (ch) selectCan(ch.ma);
        else renderArchitecturalSvg();
      });
    });
  }

  function updateTangUI() {
    renderTangPills();
    updateFinderQuery();
    renderQuickChips();
  }

  // Block tabs events
  document.querySelectorAll("#blockTabs .block-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#blockTabs .block-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentBlock = btn.dataset.block || "ALL";
      updateTangUI();
      renderArchitecturalSvg();
    });
  });

  // Reset filter button
  document.getElementById("btnResetFilter")?.addEventListener("click", () => {
    ["qfSelectLoai", "qfSelectHuong", "qfSelectScope"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "all";
    });
    document.querySelectorAll(".qf-chip").forEach(c => c.classList.remove("active"));
    updateFinderQuery();
    showToast("Đã xóa bộ lọc tìm kiếm.");
  });

  // Quick Loan Ratio Toggle
  document.querySelectorAll("#loanPills .loan-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#loanPills .loan-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loanOverride = btn.dataset.loan || "auto";
      renderDetailCard(selectedMa);
    });
  });

  // Sales Agent Branding Badge & Modal
  function syncAgentHeader() {
    const nEl = document.getElementById("agentNameHdr");
    const pEl = document.getElementById("agentPhoneHdr");
    if (nEl) nEl.textContent = agentInfo.name;
    if (pEl) pEl.textContent = agentInfo.phone;
    const inN = document.getElementById("inpAgentName");
    const inP = document.getElementById("inpAgentPhone");
    const inT = document.getElementById("inpAgentTeam");
    if (inN) inN.value = agentInfo.name;
    if (inP) inP.value = agentInfo.phone;
    if (inT) inT.value = agentInfo.team;
  }
  syncAgentHeader();

  document.getElementById("btnEditAgent")?.addEventListener("click", () => {
    syncAgentHeader();
    document.getElementById("agentModal")?.classList.add("open");
  });
  document.getElementById("btnCloseAgent")?.addEventListener("click", () => {
    document.getElementById("agentModal")?.classList.remove("open");
  });
  document.getElementById("btnSaveAgent")?.addEventListener("click", () => {
    const n = document.getElementById("inpAgentName")?.value.trim() || "Trương Tuấn";
    const p = document.getElementById("inpAgentPhone")?.value.trim() || DEFAULT_AGENT.phone;
    const t = document.getElementById("inpAgentTeam")?.value.trim() || "Bcons PS Land";
    agentInfo = { name: n, phone: p, team: t };
    try { localStorage.setItem("bcons_agent_info", JSON.stringify(agentInfo)); } catch (e) {}
    syncAgentHeader();
    document.getElementById("agentModal")?.classList.remove("open");
    showToast("Đã cập nhật thông tin Chuyên viên tư vấn!");
  });

  // Original CĐT Floorplan Zoom/Pan Lightbox
  function getOrigPlanFile(tang) {
    if (tang === 2) return "mat-bang/mbt-b-2.jpg";
    if (tang === 3) return "mat-bang/mbt-b-3.jpg";
    if (tang === 4) return "mat-bang/mbt-b-4.jpg";
    if (tang >= 5 && tang <= 9) return "mat-bang/mbt-b-5-9.jpg";
    if (tang === 10) return "mat-bang/mbt-b-10.jpg";
    if (tang === 11) return "mat-bang/mbt-b-11.jpg";
    if (tang === 19) return "mat-bang/mbt-b-19.jpg";
    if (tang === 20) return "mat-bang/mbt-b-20.jpg";
    return "mat-bang/mbt-b-12-29.jpg";
  }

  let lbScale = 1, lbX = 0, lbY = 0, lbDragging = false, lbStartX = 0, lbStartY = 0;
  function applyLbTransform() {
    const img = document.getElementById("origPlanImg");
    if (img) img.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  }
  document.getElementById("btnOrigPlan")?.addEventListener("click", () => {
    const modal = document.getElementById("origPlanModal");
    const img = document.getElementById("origPlanImg");
    const title = document.getElementById("origPlanTitle");
    if (!modal || !img) return;
    lbScale = 1; lbX = 0; lbY = 0;
    applyLbTransform();
    img.src = getOrigPlanFile(currentTang);
    if (title) title.textContent = `Mặt Bằng Gốc CĐT — ${getLayoutInfo(currentTang).name}`;
    modal.classList.add("open");
  });
  document.getElementById("btnCloseOrigPlan")?.addEventListener("click", () => {
    document.getElementById("origPlanModal")?.classList.remove("open");
  });
  document.getElementById("btnZoomIn")?.addEventListener("click", () => {
    lbScale = Math.min(4, lbScale + 0.35);
    applyLbTransform();
  });
  document.getElementById("btnZoomOut")?.addEventListener("click", () => {
    lbScale = Math.max(0.6, lbScale - 0.35);
    applyLbTransform();
  });
  document.getElementById("btnZoomReset")?.addEventListener("click", () => {
    lbScale = 1; lbX = 0; lbY = 0;
    applyLbTransform();
  });
  const lbStage = document.getElementById("lightboxStage");
  if (lbStage) {
    lbStage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      lbScale = Math.min(4, Math.max(0.6, lbScale + delta));
      applyLbTransform();
    }, { passive: false });
    lbStage.addEventListener("mousedown", (e) => {
      lbDragging = true;
      lbStartX = e.clientX - lbX;
      lbStartY = e.clientY - lbY;
    });
    window.addEventListener("mousemove", (e) => {
      if (!lbDragging) return;
      lbX = e.clientX - lbStartX;
      lbY = e.clientY - lbStartY;
      applyLbTransform();
    });
    window.addEventListener("mouseup", () => { lbDragging = false; });
  }

  // Copy Sales Pitch to Clipboard (Upgraded Zalo Template)
  document.getElementById("btnCopyPitch")?.addEventListener("click", () => {
    const c = theCan(rawGioHang.can, selectedMa, { pttt: currentPttt });
    if (!c || c.trangThai !== "trong") return;
    const plan = PLANS[currentPttt];
    const calcRes = phuongAn(plan, c.gia[currentPttt].chuaVat, { vay: loanOverride });
    const effectiveLoan = calcRes.khoanVay;
    const effectiveOwn = calcRes.tuCo;
    const monthly = calcRes.traGopThang;

    const pitch = `🏡 BCONS NEWSKY | PHIẾU TƯ VẤN CĂN HỘ ${c.ma}
━━━━━━━━━━━━━━━━━━━━
📐 Thông số: ${c.loai} · ${c.dtTimTuong}m² (TT) / ${c.dtThongThuy || '—'}m² (LL)
🧭 Hướng: ${c.huong || 'Đang cập nhật'} · Block ${c.block} · Tầng ${c.tang}
💳 Chính sách: ${plan.name}

💰 TỔNG GIÁ TRỊ:
• Giá chưa VAT: ${fmtTy(calcRes.P)}
• Giá đã gồm VAT 10%: ${fmtTy(calcRes.G)}

📊 DÒNG TIỀN DỰ KIẾN:
• Vốn tự có đợt đầu: ${fmtTrieu(effectiveOwn)}
• Ngân hàng hỗ trợ vay: ${effectiveLoan > 0 ? fmtTy(effectiveLoan) + (calcRes.coTranLai ? ' (lãi trần 6,9%/năm)' : '') : 'Không vay'}
• Trả góp dự kiến sau ân hạn: ${effectiveLoan > 0 ? '~' + fmtTrieu1(monthly) + '/tháng' : 'Không vay'}
• Nhận nhà Quý II/2028: ${fmtTrieu(calcRes.handover + calcRes.fee)} (đã gồm 2% BT)
━━━━━━━━━━━━━━━━━━━━
👤 Chuyên viên tư vấn: ${agentInfo.name} (${agentInfo.team})
📞 Hotline/Zalo: ${agentInfo.phone}`;

    navigator.clipboard.writeText(pitch).then(() => {
      showToast("Đã copy kịch bản tư vấn Zalo!");
    }).catch(() => {
      alert(pitch);
    });
  });

  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2500);
  }

  // PTTT selector events
  document.querySelectorAll("[data-pttt]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-pttt]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentPttt = btn.dataset.pttt;
      updateFinderQuery();
      renderQuickChips();
      renderArchitecturalSvg();
      renderCungViTri(selectedMa);
      renderDetailCard(selectedMa);
    });
  });

  // Nhãn "Dữ liệu cập nhật lúc ..." và trạng thái offline (nguồn dữ liệu do nguon.js cấp)
  function capNhatNhanDongBo() {
    const el = document.getElementById("syncStatus");
    if (!el) return;
    const t = rawGioHang.capNhat ? new Date(rawGioHang.capNhat) : null;
    const gio = t && !isNaN(t) ? `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")} ${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}` : "—";
    const off = nguon && nguon.trangThai && nguon.trangThai().offline;
    el.textContent = `Dữ liệu cập nhật lúc ${gio}${off ? " · đang offline" : ""}`;
  }
  function veLaiTatCa() {
    updateFinderQuery();
    renderQuickChips();
    renderArchitecturalSvg();
    renderCungViTri(selectedMa);
    renderDetailCard(selectedMa);
  }
  document.getElementById("btnRefresh")?.addEventListener("click", async () => {
    if (!nguon) { veLaiTatCa(); return; }
    showToast("Đang cập nhật giỏ hàng...");
    try {
      const moi = await nguon.capNhat();
      rawGioHang = moi;
      if (!theCan(rawGioHang.can, selectedMa)) {
        const re = getCheapestUnit({ loai: "all", scope: "all" });
        if (re) selectedMa = re.ma;
      }
      veLaiTatCa();
      capNhatNhanDongBo();
      showToast("Đã cập nhật giỏ hàng.");
    } catch (e) {
      capNhatNhanDongBo();
      showToast("Chưa cập nhật được (mất mạng hoặc sai khóa). Đang dùng dữ liệu đã lưu.");
    }
  });

  // Mã QR của dự án (mở landing); nạp trước để ảnh xuất vẽ ngay được. Không có QR thì không vẽ khối QR.
  let qrImg = null;
  if (lienHe.qrSvg) {
    qrImg = new Image();
    qrImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(lienHe.qrSvg);
  }
  function veQr(ctx, x, y, size) {
    if (!qrImg || !qrImg.complete || !qrImg.naturalWidth) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, size, size);
    ctx.drawImage(qrImg, x + 3, y + 3, size - 6, size - 6);
  }

  // Quote PNG Generator (Canvas)
  let lastQuoteBlob = null;
  let lastQuoteFilename = "Phieu-Gia-Bcons-Newsky.png";

  function openQuoteWithCanvas(canvas, filename) {
    lastQuoteFilename = filename;
    const wrap = document.getElementById("quotePreviewWrap");
    if (wrap) {
      wrap.innerHTML = "";
      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
      img.alt = filename;
      wrap.appendChild(img);
    }
    canvas.toBlob((blob) => { lastQuoteBlob = blob; }, "image/png");
    document.getElementById("quoteModal")?.classList.add("open");
  }

  function buildUnitQuoteCanvas(c) {
    const plan = PLANS[currentPttt];
    const calcRes = phuongAn(plan, c.gia[currentPttt].chuaVat, { vay: loanOverride });
    const effectiveLoan = calcRes.khoanVay;
    const effectiveOwn = calcRes.tuCo;
    const monthly = calcRes.traGopThang;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1380;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, 1080, 1380);

    // Top Navy Banner
    ctx.fillStyle = "#0F2942";
    ctx.fillRect(0, 0, 1080, 185);
    ctx.fillStyle = "#D4AF37";
    ctx.fillRect(0, 181, 1080, 4);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 18px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText("BCONS NEWSKY · PHIẾU TÍNH GIÁ CHI TIẾT", 44, 48);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 44px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`Căn hộ ${c.ma}`, 44, 104);

    ctx.fillStyle = "#CBD5E1";
    ctx.font = "600 20px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`${c.loai} · ${c.dtTimTuong}m² TT (${c.dtThongThuy || '—'}m² LL) · Hướng ${c.huong || '—'}`, 44, 140);
    ctx.fillText(`Chính sách: ${plan.name}`, 44, 168);

    // Mini Floorplan Highlight Box on Top Right
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.strokeStyle = "rgba(212,175,55,0.45)";
    ctx.lineWidth = 1.5;
    ctx.fillRect(770, 22, 266, 140);
    ctx.strokeRect(770, 22, 266, 140);
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "bold 12px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`VỊ TRÍ TRÊN MẶT BẰNG TẦNG ${c.tang}`, 784, 43);

    const scaleX = 240 / 1845;
    const scaleY = 100 / 640;
    const offX = 782;
    const offY = 52;
    for (let vt = 1; vt <= 12; vt++) {
      const g = B1_GEOM[vt];
      if (!g) continue;
      const isSel = c.block === "B1" && c.viTri === vt;
      ctx.fillStyle = isSel ? "#D4AF37" : "rgba(255,255,255,0.22)";
      ctx.fillRect(offX + g.x * scaleX, offY + g.y * scaleY, Math.max(5, g.w * scaleX - 1), Math.max(8, g.h * scaleY - 1));
    }
    for (let vt = 1; vt <= 15; vt++) {
      const g = B2_GEOM[vt];
      if (!g) continue;
      const isSel = c.block === "B2" && c.viTri === vt;
      ctx.fillStyle = isSel ? "#D4AF37" : "rgba(255,255,255,0.22)";
      ctx.fillRect(offX + g.x * scaleX, offY + g.y * scaleY, Math.max(5, g.w * scaleX - 1), Math.max(8, g.h * scaleY - 1));
    }

    // 6 KPI Cards (2 rows x 3 cols)
    const kpis = [
      { lbl: "GIÁ GỐC (CHƯA VAT)", val: fmtTy(calcRes.P), sub: plan.chietKhau > 0 ? `Đã trừ CK ${(plan.chietKhau * 100).toFixed(2).replace(/\.?0+$/, "").replace(".", ",")}%` : "", hi: false },
      { lbl: "GIÁ BÁN (GỒM VAT 10%)", val: fmtTy(calcRes.G), sub: "Giá trị HĐMB", hi: true },
      { lbl: "VỐN TỰ CÓ ĐỢT ĐẦU", val: fmtTrieu(effectiveOwn), sub: "Chuẩn bị trước nhận nhà", hi: false },
      { lbl: "NGÂN HÀNG GIẢI NGÂN", val: effectiveLoan > 0 ? fmtTy(effectiveLoan) : "Không vay", sub: calcRes.coTranLai ? "Lãi trần 6,9%/năm" : (loanOverride !== "auto" ? "Vay tùy chọn" : ""), hi: false },
      { lbl: "ƯỚC TÍNH TRẢ GÓP / THÁNG", val: effectiveLoan > 0 ? `~${fmtTrieu1(monthly)}/tháng` : "Không vay", sub: "Gốc + lãi dự kiến sau ân hạn", hi: false },
      { lbl: "NHẬN NHÀ (QUÝ II/2028)", val: fmtTrieu(calcRes.handover + calcRes.fee), sub: "Đã gồm 2% phí bảo trì", hi: false },
    ];
    kpis.forEach((k, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 44 + col * 336;
      const y = 212 + row * 124;
      ctx.fillStyle = k.hi ? "#FEF3C7" : "#FFFFFF";
      ctx.strokeStyle = k.hi ? "#D4AF37" : "#CBD5E1";
      ctx.lineWidth = k.hi ? 2.5 : 1.5;
      ctx.fillRect(x, y, 318, 108);
      ctx.strokeRect(x, y, 318, 108);

      ctx.fillStyle = "#64748B";
      ctx.font = "bold 13px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText(k.lbl, x + 18, y + 28);

      ctx.fillStyle = k.hi ? "#92400E" : "#0F2942";
      ctx.font = "800 28px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText(k.val, x + 18, y + 66);

      ctx.fillStyle = "#64748B";
      ctx.font = "500 13px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText(k.sub, x + 18, y + 92);
    });

    // Schedule Table
    let ty = 485;
    ctx.fillStyle = "#0F2942";
    ctx.font = "800 20px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText("LỊCH THANH TOÁN CHI TIẾT", 44, ty);
    ty += 18;

    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(44, ty, 992, 42);
    ctx.fillStyle = "#0F2942";
    ctx.font = "bold 15px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText("ĐỢT", 62, ty + 27);
    ctx.fillText("TIẾN ĐỘ THANH TOÁN", 160, ty + 27);
    ctx.fillText("TỶ LỆ", 730, ty + 27);
    ctx.fillText("SỐ TIỀN (VNĐ)", 860, ty + 27);
    ty += 42;

    const rowsAll = calcRes.rows.map((r, i) => ({
      dot: `Đợt ${i + 1}`,
      desc: `${r.l} (${r.w})`,
      pct: `${r.p}%`,
      amt: fmtDong(r.amt),
      bank: r.bank
    }));
    rowsAll.push({
      dot: "Bảo trì",
      desc: "Phí bảo trì 2% (khi bàn giao)",
      pct: "2%",
      amt: fmtDong(calcRes.fee),
      bank: false
    });

    rowsAll.forEach((r, idx) => {
      const rh = 62;
      ctx.fillStyle = r.bank ? "#EFF6FF" : (idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC");
      ctx.fillRect(44, ty, 992, rh);
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;
      ctx.strokeRect(44, ty, 992, rh);

      ctx.fillStyle = "#0F2942";
      ctx.font = "bold 16px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText(r.dot, 62, ty + 37);

      ctx.fillStyle = "#1E293B";
      ctx.font = "600 15px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText(r.desc.slice(0, 56), 160, ty + 37);

      ctx.fillStyle = "#0F2942";
      ctx.font = "bold 16px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText(r.pct, 730, ty + 37);
      ctx.fillText(r.amt, 860, ty + 37);
      ty += rh;
    });

    // Framed Agent Footer (3 lines + Hotline/Zalo)
    const fy = 1222;
    ctx.fillStyle = "#0F2942";
    ctx.fillRect(44, fy, 992, 118);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(44, fy, 992, 118);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 14px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText("CHUYÊN VIÊN TƯ VẤN TRỰC TIẾP", 70, fy + 28);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 23px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`${agentInfo.name} (${agentInfo.team})`, 70, fy + 62);

    ctx.fillStyle = "#FDE047";
    ctx.font = "800 22px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`📞 Hotline / Zalo: ${agentInfo.phone}`, 70, fy + 98);
    veQr(ctx, 44 + 992 - 98, fy + 15, 88);

    return canvas;
  }

  function buildCompareCanvas(items) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 790;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, 1080, 790);
    ctx.fillStyle = "#0F2942";
    ctx.fillRect(0, 0, 1080, 110);
    ctx.fillStyle = "#D4AF37";
    ctx.fillRect(0, 106, 1080, 4);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 16px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText("BCONS NEWSKY · BẢNG SO SÁNH CĂN HỘ", 40, 40);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 30px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`So sánh ${items.length} căn (${PLANS[currentPttt].name})`, 40, 82);

    const colW = Math.floor((1000 - 220) / items.length);
    const headers = ["TIÊU CHÍ", ...items.map(c => c.ma)];
    let y = 135;
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(40, y, 1000, 46);
    ctx.fillStyle = "#0F2942";
    ctx.font = "800 17px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(headers[0], 54, y + 29);
    items.forEach((c, i) => ctx.fillText(c.ma, 260 + i * colW + 14, y + 29));
    y += 46;

    const plan = PLANS[currentPttt];
    const calcs = items.map(c => c.gia ? phuongAn(plan, c.gia[currentPttt].chuaVat, { vay: loanOverride }) : null);
    const rows = [
      ["Loại & Diện tích", ...items.map(c => `${c.loai} (${c.dtTimTuong}m²)`)],
      ["Hướng ban công", ...items.map(c => c.huong || "—")],
      ["Giá chưa VAT", ...calcs.map(r => r ? fmtTy(r.P) : "ĐÃ BÁN")],
      ["Giá gồm VAT 10%", ...calcs.map(r => r ? fmtTy(r.G) : "ĐÃ BÁN")],
      ["Vốn tự có đợt đầu", ...calcs.map(r => r ? fmtTrieu(r.tuCo) : "—")],
      ["Khoản vay NH", ...calcs.map(r => r ? (r.khoanVay > 0 ? fmtTy(r.khoanVay) : "Không vay") : "—")],
      ["Trả góp/tháng", ...calcs.map(r => r && r.khoanVay > 0 ? `~${fmtTrieu1(r.traGopThang).replace(/-/g, "")}/th` : "—")],
      ["Nhận nhà (+2% BT)", ...calcs.map(r => r ? fmtTrieu(r.handover + r.fee) : "—")],
    ];

    rows.forEach((row, rIdx) => {
      ctx.fillStyle = rIdx % 2 === 0 ? "#FFFFFF" : "#F1F5F9";
      ctx.fillRect(40, y, 1000, 56);
      ctx.strokeStyle = "#CBD5E1";
      ctx.strokeRect(40, y, 1000, 56);
      ctx.fillStyle = "#475569";
      ctx.font = "bold 15px 'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillText(row[0], 54, y + 34);
      ctx.fillStyle = "#0F2942";
      ctx.font = "700 16px 'Be Vietnam Pro', system-ui, sans-serif";
      for (let i = 1; i < row.length; i++) {
        ctx.fillText(String(row[i]).slice(0, 26), 260 + (i - 1) * colW + 14, y + 34);
      }
      y += 56;
    });

    const fy = 640;
    ctx.fillStyle = "#0F2942";
    ctx.fillRect(40, fy, 1000, 116);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(40, fy, 1000, 116);
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 14px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText("CHUYÊN VIÊN TƯ VẤN TRỰC TIẾP", 64, fy + 28);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 22px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`${agentInfo.name} (${agentInfo.team})`, 64, fy + 62);
    ctx.fillStyle = "#FDE047";
    ctx.font = "800 21px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillText(`📞 Hotline / Zalo: ${agentInfo.phone}`, 64, fy + 96);
    veQr(ctx, 40 + 1000 - 96, fy + 15, 86);

    return canvas;
  }

  // Compare & Export
  const btnCompare = document.getElementById("btnCompare");
  if (btnCompare) {
    btnCompare.addEventListener("click", () => {
      if (!compareList.includes(selectedMa)) compareList.push(selectedMa);
      btnCompare.textContent = `+ Thêm So Sánh (${compareList.length})`;
      if (compareList.length >= 2) openCompareModal();
      else showToast(`Đã thêm ${selectedMa} vào danh sách so sánh. Chọn thêm 1 căn nữa để đối chiếu!`);
    });
  }

  function openCompareModal() {
    const modal = document.getElementById("compareModal");
    const body = document.getElementById("compareBody");
    if (!modal || !body) return;
    document.getElementById("svgTooltip")?.classList.remove("show");
    document.body.style.overflow = "hidden";
    modal.classList.add("open");
    const items = compareList.map(m => theCan(rawGioHang.can, m, { pttt: currentPttt })).filter(Boolean);
    const plan = PLANS[currentPttt];
    const calcs = items.map(c => c.gia ? phuongAn(plan, c.gia[currentPttt].chuaVat, { vay: loanOverride }) : null);

    const minP = Math.min(...calcs.map(r => r ? r.P : Infinity));
    const minG = Math.min(...calcs.map(r => r ? r.G : Infinity));
    const minOwn = Math.min(...calcs.map(r => r ? r.tuCo : Infinity));
    const maxDt = Math.max(...items.map(c => Number(c.dtTimTuong) || 0));

    body.innerHTML = `
      <table class="compare-table">
        <thead>
          <tr>
            <th>Tiêu chí</th>
            ${items.map(c => `<th>${c.ma}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Diện tích</td>
            ${items.map(c => `<td class="${Number(c.dtTimTuong) === maxDt ? 'best-val' : ''}">${c.loai} · ${c.dtTimTuong} m²</td>`).join("")}
          </tr>
          <tr>
            <td>Hướng view</td>
            ${items.map(c => `<td>${c.huong || '—'}</td>`).join("")}
          </tr>
          <tr>
            <td>Giá chưa VAT</td>
            ${calcs.map(r => `<td class="${r && r.P === minP ? 'best-val' : ''}">${r ? fmtTy(r.P) : 'ĐÃ BÁN'}</td>`).join("")}
          </tr>
          <tr>
            <td>Giá có VAT</td>
            ${calcs.map(r => `<td class="${r && r.G === minG ? 'best-val' : ''}">${r ? fmtTy(r.G) : 'ĐÃ BÁN'}</td>`).join("")}
          </tr>
          <tr>
            <td>Vốn tự có</td>
            ${calcs.map(r => `<td class="${r && r.tuCo === minOwn ? 'best-val' : ''}">${r ? fmtTrieu(r.tuCo) : '—'}</td>`).join("")}
          </tr>
          <tr>
            <td>Khoản vay NH</td>
            ${calcs.map(r => `<td>${r ? (r.khoanVay > 0 ? fmtTy(r.khoanVay) : 'Không vay') : '—'}</td>`).join("")}
          </tr>
          <tr>
            <td>Trả góp/tháng</td>
            ${calcs.map(r => `<td>${r && r.khoanVay > 0 ? '~' + fmtTrieu1(r.traGopThang).replace(/-/g, '') + '/th' : '—'}</td>`).join("")}
          </tr>
          <tr>
            <td>Nhận nhà (+2% BT)</td>
            ${calcs.map(r => `<td>${r ? fmtTrieu(r.handover + r.fee) : '—'}</td>`).join("")}
          </tr>
        </tbody>
      </table>
      <div class="compare-actions-grid">
        <button id="btnClearComp" class="btn-compare-clear">Xóa danh sách</button>
        <button id="btnExportCompareImg" class="btn-compare-export">🖼️ Xuất Ảnh Zalo</button>
      </div>
    `;
    document.getElementById("btnClearComp")?.addEventListener("click", () => {
      compareList = [];
      btnCompare.textContent = `+ Thêm So Sánh (0)`;
      modal.classList.remove("open");
      document.body.style.overflow = "";
    });
    document.getElementById("btnExportCompareImg")?.addEventListener("click", () => {
      modal.classList.remove("open");
      const cvs = buildCompareCanvas(items);
      openQuoteWithCanvas(cvs, `So-Sanh-${items.map(i => i.ma).join("-")}.png`);
    });
  }

  document.getElementById("btnCloseCompare")?.addEventListener("click", () => {
    document.getElementById("compareModal")?.classList.remove("open");
    document.body.style.overflow = "";
  });

  document.getElementById("btnExport")?.addEventListener("click", () => {
    const c = theCan(rawGioHang.can, selectedMa, { pttt: currentPttt });
    if (!c || c.trangThai !== "trong" || !c.gia) {
      showToast("Căn này hiện không thể xuất phiếu tính giá.");
      return;
    }
    const cvs = buildUnitQuoteCanvas(c);
    openQuoteWithCanvas(cvs, `Phieu-Gia-${c.ma}.png`);
  });

  document.getElementById("btnCloseQuote")?.addEventListener("click", () => {
    document.getElementById("quoteModal")?.classList.remove("open");
    if (!document.getElementById("rightPane")?.classList.contains("drawer-open")) {
      document.body.style.overflow = "";
    }
  });
  document.getElementById("btnCopyQuoteImg")?.addEventListener("click", async () => {
    if (!lastQuoteBlob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": lastQuoteBlob })]);
      showToast("Đã copy ảnh phiếu giá vào Clipboard! Anh có thể Ctrl+V gửi thẳng Zalo.");
    } catch (err) {
      showToast("Trình duyệt không hỗ trợ copy ảnh trực tiếp — hãy bấm Tải ảnh PNG nhé anh.");
    }
  });
  document.getElementById("btnDownloadQuoteImg")?.addEventListener("click", () => {
    const img = document.querySelector("#quotePreviewWrap img");
    if (!img) return;
    const a = document.createElement("a");
    a.href = img.src;
    a.download = lastQuoteFilename;
    a.click();
    showToast(`Đã tải xuống ${lastQuoteFilename}`);
  });

  // Keyboard Navigation (ArrowLeft/Right: switch units on floor; ArrowUp/Down: switch floors)
  window.addEventListener("keydown", (e) => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (document.querySelector(".modal.open")) return;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextTang = e.key === "ArrowUp" ? Math.min(29, currentTang + 1) : Math.max(2, currentTang - 1);
      if (nextTang !== currentTang) {
        currentTang = nextTang;
        updateTangUI();
        const curP = parseMa(selectedMa);
        const sameVt = curP ? rawGioHang.can.find(x => x.tang === currentTang && x.block === curP.block && x.viTri === curP.viTri && trangThai(x.tinhTrang) === "trong") : null;
        const ch = sameVt || getCheapestUnit({ loai: "all", scope: "tang" });
        if (ch) selectCan(ch.ma);
        else renderArchitecturalSvg();
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const floorUnits = rawGioHang.can
        .filter(c => (c.tang || parseMa(c.ma)?.tang) === currentTang && trangThai(c.tinhTrang) === "trong" && (currentBlock === "ALL" || (c.block || parseMa(c.ma)?.block) === currentBlock))
        .sort((a, b) => a.ma.localeCompare(b.ma));
      if (!floorUnits.length) return;
      const idx = floorUnits.findIndex(c => c.ma === selectedMa);
      const nextIdx = e.key === "ArrowRight"
        ? (idx + 1) % floorUnits.length
        : (idx - 1 + floorUnits.length) % floorUnits.length;
      selectCan(floorUnits[nextIdx].ma);
    }
  });

  // Mobile Bottom Sheet Drawer & Floor Expansion
  function openMobileDrawer() {
    document.getElementById("svgTooltip")?.classList.remove("show");
    document.getElementById("rightPane")?.classList.add("drawer-open");
    document.getElementById("mobileDrawerBackdrop")?.classList.add("open");
    document.getElementById("mobileBottomBar")?.classList.add("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeMobileDrawer() {
    document.getElementById("rightPane")?.classList.remove("drawer-open");
    document.getElementById("mobileDrawerBackdrop")?.classList.remove("open");
    document.getElementById("mobileBottomBar")?.classList.remove("hidden");
    document.body.style.overflow = "";
  }
  document.getElementById("btnOpenMobileDrawer")?.addEventListener("click", openMobileDrawer);
  document.getElementById("btnCloseMobileDrawer")?.addEventListener("click", closeMobileDrawer);
  document.getElementById("mobileDrawerBackdrop")?.addEventListener("click", closeMobileDrawer);

  // Swipe-down gesture on mobile drawer header to close
  (function initDrawerSwipe() {
    const header = document.getElementById("mobileDrawerHeader");
    if (!header) return;
    let startY = 0;
    header.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length === 1) startY = e.touches[0].clientY;
    }, { passive: true });
    header.addEventListener("touchend", (e) => {
      if (!startY || !e.changedTouches || !e.changedTouches.length) return;
      const deltaY = e.changedTouches[0].clientY - startY;
      startY = 0;
      if (deltaY > 50) closeMobileDrawer();
    }, { passive: true });
  })();

  document.getElementById("btnToggleFloors")?.addEventListener("click", (e) => {
    const pills = document.getElementById("tangPills");
    if (!pills) return;
    const expanded = pills.classList.toggle("expanded");
    e.currentTarget.textContent = expanded ? "Thu gọn tầng ▴" : "Mở rộng tất cả tầng ▾";
  });

  // Initial Boot
  if (!theCan(rawGioHang.can, selectedMa)) {
    const re = getCheapestUnit({ loai: "all", scope: "all" });
    selectedMa = re ? re.ma : (rawGioHang.can[0]?.ma || selectedMa);
    currentTang = parseMa(selectedMa)?.tang ?? currentTang;
  }
  updateTangUI();
  selectCan(selectedMa);
  capNhatNhanDongBo();
}
