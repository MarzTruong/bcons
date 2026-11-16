// Xem trước lời đọc trước khi tạo giọng (tốn credit). Hàm thuần: lấy đúng chuỗi sẽ gửi ElevenLabs, đưa cảnh báo chỗ dễ lỗi.
// Anh yêu cầu 16/11/2026 sau khi giọng video 2 cảnh 3 bị lặp "hai hai" hai lượt liền.
// Giới hạn: máy đọc có thể tự lặp dù chữ đúng; phần này chỉ bắt lỗi từ chữ và nhắc lại những cụm ĐÃ TỪNG lỗi thật.
import { parseMarkup } from "./spec-tools.mjs";

/** Cụm đã từng bị đọc lặp/sai thật (thêm dòng mới mỗi lần gặp lỗi giọng): báo trước để đổi câu, khỏi tốn credit thử lại. */
export const CUM_DA_TUNG_LOI = [
  { cum: "tiền đóng rải từng đợt", ghiChu: "video 2 cảnh 3 bị đọc lặp 'hai hai' ở 1–2 giây đầu, tạo lại một lần vẫn lặp (16/11/2026)" },
];

const MAX_AM_TIET_CAU = 22;

const chuan = (s) => s.toLowerCase().replace(/[.,;:!?…"'()“”]/g, " ").replace(/\s+/g, " ").trim();

/** Chữ đọc của từng cảnh, đúng phần trong ngoặc {} (số đã viết thành chữ) như generate-voice.mjs gửi đi. */
export function loiDocCacCanh(spec) {
  return spec.scenes.map((s) => ({
    id: s.id,
    speech: parseMarkup(s.markup)
      .filter((t) => t.say)
      .map((t) => t.say)
      .join(" "),
  }));
}

/** Danh sách cảnh báo (chuỗi) cho một đoạn lời đọc. Rỗng = không thấy chỗ dễ lặp. */
export function canhBaoLoiDoc(speech) {
  const out = [];
  // Lặp trong cùng một câu (dấu phẩy không tách). Hỏi rồi đáp ("... không? Không.") là chủ ý, không báo.
  for (const cau of speech.split(/[.!?…]+/)) {
    const tu = chuan(cau).split(" ").filter(Boolean);
    for (let i = 1; i < tu.length; i++) {
      if (tu[i] === tu[i - 1]) out.push(`Từ lặp liền nhau "${tu[i]} ${tu[i]}": máy dễ đọc dính hoặc lặp, nên đổi câu`);
    }
  }
  for (const c of speech.split(/[.!?…]+/)) {
    const n = c.trim().split(/\s+/).filter(Boolean).length;
    if (n > MAX_AM_TIET_CAU) out.push(`Câu dài ${n} âm tiết (quá ${MAX_AM_TIET_CAU}), máy dễ hụt hơi: "${c.trim().slice(0, 40)}…"`);
  }
  const bang = chuan(speech);
  for (const { cum, ghiChu } of CUM_DA_TUNG_LOI) {
    if (bang.includes(cum)) out.push(`Cụm "${cum}" đã từng gặp lỗi khi đọc (${ghiChu})`);
  }
  return out;
}

/** Tin Telegram: lời đọc từng cảnh kèm cảnh báo. `ids` (tuỳ chọn) chỉ xem vài cảnh. */
export function xemTruocLoiDoc(spec, ids = null) {
  const dong = [];
  let coCanhBao = false;
  for (const c of loiDocCacCanh(spec)) {
    if (ids && !ids.includes(c.id)) continue;
    const so = c.id.replace(/\D/g, "") || c.id;
    dong.push(`Cảnh ${so}: ${c.speech}`);
    for (const w of canhBaoLoiDoc(c.speech)) {
      dong.push(`⚠️ ${w}`);
      coCanhBao = true;
    }
  }
  if (!coCanhBao) dong.push("Không thấy chỗ dễ lặp trong chữ. (Máy vẫn có thể tự đọc lặp; nghe thử là chắc nhất.)");
  return dong.join("\n").slice(0, 3500);
}

/** Cảnh báo đủ nặng để chặn việc tạo giọng (từ lặp, cụm đã từng lỗi). Câu dài chỉ là nhắc, không chặn. */
export const laCanhBaoChan = (w) => /^Từ lặp/.test(w) || /^Cụm /.test(w);

/** Các cảnh báo chặn của những cảnh sắp tạo giọng ("Cảnh n: ..."); rỗng = cho tạo. */
export function canhBaoChanCuaVideo(spec, ids = null) {
  const out = [];
  for (const c of loiDocCacCanh(spec)) {
    if (ids && !ids.includes(c.id)) continue;
    for (const w of canhBaoLoiDoc(c.speech)) if (laCanhBaoChan(w)) out.push(`Cảnh ${c.id.replace(/\D/g, "") || c.id}: ${w}`);
  }
  return out;
}
