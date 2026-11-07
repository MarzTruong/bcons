// Hàm thuần cho generate-voice.mjs (test được, không gọi mạng).

/** "canh1" | "1,3" | "scene2" → ["scene1", ...]; không có → null (tạo tất cả). */
export function parseCanh(arg) {
  if (!arg) return null;
  return String(arg)
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((x) => {
      const n = x.match(/(\d+)/)?.[1];
      return n ? `scene${Number(n)}` : x;
    });
}

/** Ghép cảnh vừa tạo vào timestamps cũ theo thứ tự cảnh của spec. Thiếu cảnh nào thì báo (phải tạo cả video trước). */
export function mergeScenes(oldTs, fresh, order) {
  const byId = new Map((oldTs?.scenes ?? []).map((s) => [s.id, s]));
  for (const s of fresh) byId.set(s.id, s);
  return order.map((id) => {
    const s = byId.get(id);
    if (!s) throw new Error(`Chưa có giọng ${id}: tạo cả video trước (/giong <video>), rồi mới tạo lại từng cảnh.`);
    return s;
  });
}

/** Lời cảnh trước/sau gửi kèm (previous_text/next_text) để ElevenLabs giữ giọng liền mạch giữa các cảnh. */
export function neighborText(speeches, i) {
  return { previous_text: speeches[i - 1], next_text: speeches[i + 1] };
}
