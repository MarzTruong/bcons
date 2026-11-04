# Short-form video script (30-60s, 9:16)

## Before writing, decide (state it in one line at the top)
- **Style**: `Talking head` (Tuấn on camera, real footage as B-roll) or `Faceless` (AI voice + B-roll/motion graphics). If unspecified, offer the talking-head version and note what changes for faceless.
- **Length**: 30, 45 or 60s. Default 45s.
- **Persona + goal**: who is watching and what they should think/do after.

## Pacing
Spoken Vietnamese runs ~3,5-4 âm tiết/giây. Budget: 30s ≈ 100-120 âm tiết, 45s ≈ 150-170, 60s ≈ 200-230 of VO. Change the visual every 2-4 seconds. Put the payoff (the number/answer) before the 70% mark, so viewers who drop off still got value.

Structure that works: Hook (0-3s) → Context/stakes (3-8s) → The math or the facts, 2-4 beats → Honest trade-off → Takeaway → CTA (last 3-5s).

## Deliverable layout

```markdown
**Phong cách:** Talking head | **Thời lượng:** 45s | **Người xem:** <persona> | **Mục tiêu:** <…>

### 3 hook
1. [Tài chính] "<câu hook>" — Hình: <…>
2. [Sự thật thị trường] "<câu hook>" — Hình: <…>
3. [Hình ảnh/vị trí] "<câu hook>" — Hình: <…>
Em đề xuất hook <n> vì <một câu>.

### Kịch bản (dùng hook <n>)
| Thời gian | Hình / B-roll | Chữ trên màn hình | Lời (VO) |
|---|---|---|---|
| 0:00-0:03 | … | … | … |
| … | | | |

### Caption + hashtag
<2-3 dòng, có câu hỏi kéo comment, không số điện thoại> #BconsCentralPark #BiênHòa …

### Gợi ý hình cho AI (nếu faceless)
- Kling/HeyGen prompts in English, only for illustrative scenes; mark them "minh họa". Prefer official renders/flycam from the project Drive for anything that depicts the actual project — never generate fake images of the real building, units or construction progress.
```

## VO rules (it will be read by a person or ElevenLabs)

- Write numbers the way they should be spoken: "hai phẩy không sáu tỷ" or "hơn hai tỷ", "sáu phẩy chín phần trăm một năm", "năm mươi mét vuông". Keep the digit form in the on-screen-text column.
- No abbreviations in VO: "phương thức thanh toán số bốn" not "PTTT 04"; "chủ đầu tư" not "CĐT"; "phòng ngủ" not "PN"; "Bee-cons" pronunciation note once if needed.
- Words must match the math exactly. If the table says 401,9 triệu against 400 triệu, the VO says "thiếu chút xíu" or "gần đủ", not "vừa khít". Viewers check, and one loose word undoes the trust the numbers built.
- Sentences ≤ ~20 âm tiết, so a TTS voice doesn't run out of breath and captions stay on one or two lines.
- Southern vocabulary and particles, but nothing a TTS voice will mangle (avoid "z" spellings like "zậy", teen code).
- On-screen text: ≤ 8 words per card, the key number big. Put "chưa VAT" and the source+date in small text whenever a price or market stat appears.
- Ending: CTA without phone/name, then project card (name, address). Add "Thông tin tham khảo, chi tiết theo chính sách CĐT tại thời điểm …" as small text if prices/policies were mentioned.

## Talking head vs faceless
- Talking head: VO column is what Tuấn says to camera; B-roll column says when to cut away. Add short delivery notes in brackets, e.g. "[nhìn thẳng camera, chậm lại]".
- Faceless: every row needs a concrete visual (flycam clip, map animation, number card, nhà mẫu shot). Number cards are the backbone; don't rely on generic stock city shots.

## When the video will go into Remotion
Mention at the end: "Nếu anh muốn dựng bằng Remotion, chạy `/bcons-video <chủ đề>` — kịch bản này dùng làm đầu vào cho cổng 2." Don't write the spec JSON here.
