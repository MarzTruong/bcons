// Giao diện landing Bcons Newsky (thiết kế AGY) + công cụ tính dùng lõi calc.js của engine.

// Mobile nav toggle
const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');
burgerBtn.addEventListener('click', () => mainNav.classList.toggle('mobile-open'));
mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('mobile-open')));

// Vertical stack tabs
const STACK_DATA = {
  ham: {
    title: '2 Tầng hầm (B1 – B2)',
    img: 'assets/sky-angle.jpg',
    items: [
      'Hai tầng hầm liên thông toàn khối công trình, phục vụ đỗ xe ô tô và xe máy cho cư dân.',
      'Hệ thống kỹ thuật công trình và kiểm soát ra vào tách luồng giao thông với khối thương mại phía trên.'
    ]
  },
  de: {
    title: 'Khối đế 3 tầng (Tầng 1 – 3)',
    img: 'assets/hero-podium.jpg',
    items: [
      '29 căn thương mại dịch vụ (shophouse) bố trí dọc mặt tiền thuận tiện kinh doanh và dịch vụ cư dân.',
      'Tiện ích thiết yếu tích hợp tại khối đế: nhà trẻ, phòng sinh hoạt cộng đồng, phòng gym và bể bơi ngoài trời.',
      'Mật độ xây dựng khối đế 42,49% trên tổng khu đất 19.779,5 m².'
    ]
  },
  thap: {
    title: 'Tầng căn hộ (Tầng 4 – 29)',
    img: 'assets/overview-aerial.jpg',
    items: [
      'Gồm 2 tháp A & B cao 29 tầng nổi, chiều cao tối đa 99,9 m, mật độ xây dựng khối tháp 31,27%.',
      'Tháp A trang bị 18 thang máy, Tháp B trang bị 12 thang máy phục vụ di chuyển nhanh vào giờ cao điểm.',
      'Tổng 1.536 căn hộ từ 2PN–1WC đến 3PN–3WC; riêng Tháp B đang mở giới thiệu 200 căn (47,25 – 94,70 m² tim tường).'
    ]
  }
};
const stackDetail = document.getElementById('stackDetail');
const stackImg = document.getElementById('stackImg');
function renderStack(key) {
  const d = STACK_DATA[key];
  stackDetail.innerHTML = `<h3>${d.title}</h3><ul class="stack-list">${d.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  stackImg.src = d.img;
}
renderStack('ham');
document.getElementById('stackTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-stack]');
  if (!btn) return;
  document.querySelectorAll('#stackTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderStack(btn.dataset.stack);
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCap = document.getElementById('lbCap');
function openLightbox(src, cap) {
  lbImg.src = src;
  lbCap.textContent = cap || '';
  lightbox.classList.add('open');
}
document.getElementById('lbClose').addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('open'); });

document.getElementById('amenGrid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-lb]');
  if (card) openLightbox(card.dataset.lb, card.dataset.cap);
});

// Floor plans (Block B)
const FLOORS = {
  '2': { title: 'Mặt bằng tầng 2 – Block B', img: 'assets/mbt-b-2.jpg' },
  '3': { title: 'Mặt bằng tầng 3 – Block B (Khối đế & tiện ích)', img: 'assets/mbt-b-3.jpg' },
  '4': { title: 'Mặt bằng tầng 4 – Block B', img: 'assets/mbt-b-4.jpg' },
  '5-9': { title: 'Mặt bằng tầng 5 – 9 – Block B', img: 'assets/mbt-b-5-9.jpg' },
  '12-29': { title: 'Mặt bằng tầng 12–18 & 21–29 – Block B', img: 'assets/mbt-b-12-29.jpg' },
  '20': { title: 'Mặt bằng tầng 20 – Block B', img: 'assets/mbt-b-20.jpg' }
};
const floorTitle = document.getElementById('floorTitle');
const floorImg = document.getElementById('floorImg');
document.getElementById('floorTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-floor]');
  if (!btn) return;
  document.querySelectorAll('#floorTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const f = FLOORS[btn.dataset.floor];
  floorTitle.textContent = f.title;
  floorImg.src = f.img;
  floorImg.alt = f.title;
});
document.getElementById('floorImgBox').addEventListener('click', () => openLightbox(floorImg.src, floorTitle.textContent));
document.getElementById('floorZoomBtn').addEventListener('click', () => openLightbox(floorImg.src, floorTitle.textContent));

// Unit samples
const UNITS = {
  a1: {
    name: 'Căn hộ mẫu A1 (2PN – 1WC)',
    desc: 'Thiết kế tối ưu công năng cho gia đình trẻ, khu vực bếp – bàn ăn – phòng khách liên thông và logia riêng.',
    img: 'assets/unit-a1.jpg',
    meta: [
      ['Diện tích tim tường', '47,37 m²'],
      ['Diện tích thông thủy', '42,18 m²'],
      ['Khung giá PTTT 09 (chưa VAT)', '2,56 – 2,70 tỷ'],
      ['Số căn nhóm 2PN-1WC Tháp B', '8 căn']
    ],
    photos: [
      ['assets/int-a2-living.jpg', 'Nội thất phòng khách mẫu căn 2PN (Hình ảnh minh họa)'],
      ['assets/int-a2-bed.jpg', 'Nội thất phòng ngủ mẫu căn 2PN (Hình ảnh minh họa)'],
      ['assets/int-b1-wide.jpg', 'Không gian bếp – phòng ăn (Hình ảnh minh họa)']
    ]
  },
  b1: {
    name: 'Căn hộ mẫu B1 (2PN – 2WC)',
    desc: 'Mẫu căn 2 phòng ngủ 2 nhà vệ sinh chủ lực tại Tháp B, cân bằng giữa không gian sinh hoạt chung và sự riêng tư của phòng ngủ master.',
    img: 'assets/unit-b1.jpg',
    meta: [
      ['Diện tích tim tường', '65,54 m²'],
      ['Diện tích thông thủy', '59,45 m²'],
      ['Khung giá PTTT 09 (chưa VAT)', '2,75 – 3,50 tỷ'],
      ['Số căn nhóm 2PN-2WC Tháp B', '60 căn']
    ],
    photos: [
      ['assets/int-b1-living.jpg', 'Phòng khách & bàn ăn căn mẫu B1 (Hình ảnh minh họa)'],
      ['assets/int-b1-wide.jpg', 'Tổng thể không gian căn mẫu B1 (Hình ảnh minh họa)'],
      ['assets/int-a2-bed.jpg', 'Phòng ngủ căn mẫu 2PN (Hình ảnh minh họa)']
    ]
  },
  b7: {
    name: 'Căn hộ mẫu B7 (3PN – 2WC)',
    desc: 'Căn 3 phòng ngủ thiết kế vuông vức, cả 3 phòng ngủ đều đón sáng tự nhiên, phù hợp gia đình nhiều thế hệ.',
    img: 'assets/unit-b7.jpg',
    meta: [
      ['Diện tích tim tường', '77,83 m²'],
      ['Diện tích thông thủy', '70,36 m²'],
      ['Khung giá PTTT 09 (chưa VAT)', '3,87 – 4,72 tỷ'],
      ['Số căn nhóm 3PN-2WC Tháp B', '122 căn']
    ],
    photos: [
      ['assets/int-b7-living.jpg', 'Phòng khách căn mẫu B7 (Hình ảnh minh họa)'],
      ['assets/int-b7-kitchen.jpg', 'Khu bếp & quầy bar căn mẫu B7 (Hình ảnh minh họa)'],
      ['assets/int-b1-living.jpg', 'Khu vực bàn ăn căn mẫu (Hình ảnh minh họa)']
    ]
  },
  b8: {
    name: 'Căn hộ mẫu B8 (3PN – 2WC · Căn góc)',
    desc: 'Vị trí căn góc thoáng hai mặt trên mặt bằng Tháp B, mở rộng tầm nhìn và tăng khả năng đối lưu không khí tự nhiên.',
    img: 'assets/unit-b8.jpg',
    meta: [
      ['Diện tích tim tường', '80,47 m²'],
      ['Diện tích thông thủy', '72,09 m²'],
      ['Khung giá PTTT 09 (chưa VAT)', '3,87 – 4,72 tỷ'],
      ['Số căn nhóm 3PN-2WC Tháp B', '122 căn']
    ],
    photos: [
      ['assets/int-b7-living.jpg', 'Không gian phòng khách 3PN (Hình ảnh minh họa)'],
      ['assets/int-b7-kitchen.jpg', 'Không gian bếp căn 3PN (Hình ảnh minh họa)'],
      ['assets/int-a2-bed.jpg', 'Phòng ngủ chính (Hình ảnh minh họa)']
    ]
  },
  c2: {
    name: 'Căn hộ mẫu C2 (3PN – 3WC · Góc Tháp B)',
    desc: 'Dòng căn hộ diện tích lớn nhất đang mở bán tại Tháp B với 3 phòng ngủ và 3 phòng vệ sinh riêng biệt.',
    img: 'assets/unit-c2.jpg',
    meta: [
      ['Diện tích tim tường', '94,70 m²'],
      ['Diện tích thông thủy', '85,89 m²'],
      ['Khung giá PTTT 09 (chưa VAT)', '4,28 – 4,59 tỷ'],
      ['Số căn nhóm 3PN-3WC Tháp B', '10 căn']
    ],
    photos: [
      ['assets/int-b7-living.jpg', 'Phòng khách rộng căn 3PN (Hình ảnh minh họa)'],
      ['assets/int-b1-wide.jpg', 'Khu vực tiếp khách & bàn ăn (Hình ảnh minh họa)'],
      ['assets/int-b7-kitchen.jpg', 'Không gian bếp hiện đại (Hình ảnh minh họa)']
    ]
  }
};
const unitImg = document.getElementById('unitImg');
const unitName = document.getElementById('unitName');
const unitDesc = document.getElementById('unitDesc');
const unitMeta = document.getElementById('unitMeta');
const intStrip = document.getElementById('intStrip');
function renderUnit(k) {
  const u = UNITS[k];
  unitImg.src = u.img;
  unitImg.alt = u.name;
  unitName.textContent = u.name;
  unitDesc.textContent = u.desc;
  unitMeta.innerHTML = u.meta.map(m => `<div><span>${m[0]}</span><b>${m[1]}</b></div>`).join('');
  intStrip.innerHTML = u.photos.map(p => `
    <figure class="fig" data-lb="${p[0]}" data-cap="${p[1]}">
      <img src="${p[0]}" alt="${p[1]}" loading="lazy">
      <span class="illus-tag">Hình ảnh minh họa</span>
    </figure>
  `).join('');
}
renderUnit('a1');
document.getElementById('unitTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-unit]');
  if (!btn) return;
  document.querySelectorAll('#unitTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderUnit(btn.dataset.unit);
});
document.getElementById('unitImgBox').addEventListener('click', () => openLightbox(unitImg.src, unitName.textContent));
intStrip.addEventListener('click', (e) => {
  const f = e.target.closest('[data-lb]');
  if (f) openLightbox(f.dataset.lb, f.dataset.cap);
});


// ===== Công cụ tính: lõi calc.js (cùng bản có test của engine), lịch đợt từ nguon/pttt-cdt.json =====
import { calcWith, pmt } from "./calc.js";

const T0 = Date.now();
const D = JSON.parse(document.getElementById("data").textContent);
const $ = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat("vi-VN");
const fmtTy = (v) => (v / 1e9).toFixed(2).replace(".", ",") + " tỷ";
const UNIT_RANGES = D.loaiCan;
const PHONE = /^(?:\+?84|0)\d{9,10}$/;
let activePlan = D.macDinh;

function calcPlan(key, P09) {
  const plan = D.plans[key];
  const P = Math.round(P09 * (1 - plan.chietKhau));
  return calcWith(plan, P);
}

function renderCalc() {
  const P09 = Number($("priceRange").value) * 1e6;
  $("basePriceLbl").textContent = fmtTy(P09);
  const plan = D.plans[activePlan];
  $("planTag").textContent = plan.tag;
  const res = calcPlan(activePlan, P09);
  const rate = Math.min(30, Math.max(0, parseFloat($("calcRate").value) || 0));
  const years = Math.min(35, Math.max(1, parseInt($("calcYears").value, 10) || 20));
  const monthly = pmt(res.loan, rate, years);
  $("calcKpi").innerHTML = `
    <div class="kpi highlight"><span>Giá căn hộ có VAT</span><b>${nf.format(res.G)} đồng (${fmtTy(res.G)})</b></div>
    <div class="kpi"><span>Tự có trước khi nhận nhà</span><b>${nf.format(res.ownBefore)} đ</b></div>
    <div class="kpi"><span>Ngân hàng giải ngân</span><b>${res.loan > 0 ? nf.format(res.loan) + " đ" : "Không vay"}</b></div>
    <div class="kpi"><span>Đóng khi bàn giao (gồm phí bảo trì 2%)</span><b>${nf.format(res.handover + res.fee)} đ</b></div>
    <div class="kpi"><span>Ước tính trả góp (${rate}% / ${years} năm)</span><b>${res.loan > 0 ? nf.format(Math.round(monthly)) + " đ/tháng" : "—"}</b></div>`;
  $("calcRows").innerHTML = res.rows.map((r, i) => `
    <tr class="${r.k === "loan" ? "bank" : ""}">
      <td>Đợt ${i + 1}</td>
      <td>${r.l}<br><small style="color:var(--mute);font-weight:400;">${r.w}</small></td>
      <td class="r">${r.p}%</td>
      <td class="r">${nf.format(r.amt)}</td>
    </tr>`).join("") + `
    <tr><td>Bảo trì</td><td>Phí bảo trì 2% giá chưa VAT (đóng khi nhận thông báo bàn giao)</td><td class="r">2%</td><td class="r">${nf.format(res.fee)}</td></tr>`;
  $("formSummary").textContent = `Đang chọn: ${UNIT_RANGES[$("calcType").value].label} (giá gốc ~${fmtTy(P09)}) · ${plan.name}`;
  return { res, rate, years, monthly, P09 };
}

$("calcType").addEventListener("change", () => {
  const cfg = UNIT_RANGES[$("calcType").value];
  $("priceRange").min = cfg.min;
  $("priceRange").max = cfg.max;
  $("priceRange").value = cfg.def;
  renderCalc();
});
$("priceRange").addEventListener("input", renderCalc);
$("calcRate").addEventListener("input", renderCalc);
$("calcYears").addEventListener("input", renderCalc);
$("planChips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-plan]");
  if (!btn || !D.plans[btn.dataset.plan]) return;
  activePlan = btn.dataset.plan;
  document.querySelectorAll("#planChips .chip").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  renderCalc();
});
renderCalc();

// ===== Form: gửi về Apps Script (cùng giao thức landing Central Park) =====
function source() {
  const q = new URLSearchParams(location.search);
  // Mã theo dõi gắn trên link: ?utm_source=tiktok&utm_campaign=ten-bai -> "tiktok.ten-bai" (cột Nguồn trong Sheet và tin Telegram).
  const sach = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28);
  const nguon = sach(q.get("utm_source") || q.get("nguon"));
  if (nguon) {
    const chienDich = sach(q.get("utm_campaign"));
    return chienDich ? `${nguon}.${chienDich}` : nguon;
  }
  const tuWeb = document.referrer ? new URL(document.referrer).hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "") : "";
  return tuWeb || "truc-tiep";
}
const leadForm = $("leadForm");
const formErr = $("formErr");
const formOk = $("formOk");
leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formErr.textContent = "";
  formOk.hidden = true;
  const ten = $("ten").value.trim();
  const sdt = $("sdt").value.replace(/[\s.()-]/g, "");
  if (!$("dongY").checked) return void (formErr.textContent = "Anh/chị vui lòng đánh dấu vào ô đồng ý nhận thông tin tư vấn trước khi gửi.");
  if (ten.length < 2) return void (formErr.textContent = "Anh/chị vui lòng nhập họ tên.");
  if (!PHONE.test(sdt)) return void (formErr.textContent = "Số điện thoại/Zalo chưa đúng (vd. 09xx xxx xxx).");
  if (!D.formUrl) return void (formErr.textContent = "Trang đang chạy thử, chưa nhận đăng ký.");
  const { res, rate, years, monthly } = renderCalc();
  const payload = {
    duAn: "bcons-newsky", ten, sdt, nhuCau: $("nhuCau").value, hp_x7: $("hp_x7").value, dongY: true, t: Date.now() - T0,
    canLoai: "Không rõ", canMoTa: UNIT_RANGES[$("calcType").value].label, dt: 0, pttt: D.plans[activePlan].name,
    giaChuaVat: res.P, giaCoVat: res.G, phiBaoTri: res.fee, tuCo: res.ownBefore, vay: res.loan, traGop: Math.round(monthly), lai: rate, nam: years,
    nguon: source(), trang: location.origin + location.pathname,
  };
  $("send").disabled = true;
  // Máy chủ coi gửi dưới 3 giây kể từ lúc mở trang là máy tự động: chờ đủ rồi mới gửi.
  const cho = 3200 - (Date.now() - T0);
  if (cho > 0) await new Promise((r) => setTimeout(r, cho));
  payload.t = Date.now() - T0;
  try {
    await fetch(D.formUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    formOk.hidden = false;
    formOk.textContent = `Đã nhận thông tin của ${ten}. Tuấn Trương (Bcons PS) sẽ liên hệ qua số ${sdt} sớm nhất.`;
    leadForm.reset();
  } catch {
    formErr.textContent = "Chưa gửi được, anh/chị thử lại hoặc nhắn Zalo giúp em.";
  } finally {
    $("send").disabled = false;
  }
});
