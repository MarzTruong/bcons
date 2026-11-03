// Lời bình 4 cảnh. Cú pháp: `chữ-hiển-thị{chữ-đọc}`.
// - Phần hiển thị (phụ đề) giữ số liệu/đơn vị như trên màn hình.
// - Phần {đọc} viết rõ bằng chữ để giọng đọc phát âm chuẩn; từ nào không có {} thì đọc đúng như hiển thị.
// - Token có {} rỗng (ví dụ `-{}`) chỉ hiển thị, không đọc.
export const SCENES = [
  {
    id: "scene1",
    markup:
      "Sau khi trở thành thành phố trực thuộc Trung ương, Đồng Nai ghi nhận sức hút đầu tư mạnh mẽ với gần 2,4{hai phẩy bốn} tỷ đô la Mỹ vốn FDI{F D I} trong 9{chín} tháng đầu năm.",
  },
  {
    id: "scene2",
    markup:
      "Mạng lưới giao thông liên vùng được mở rộng khi cao tốc Bến Lức -{} Long Thành chính thức khai thác toàn tuyến từ ngày 1{mùng một} tháng 10{mười} năm 2026,{hai nghìn không trăm hai mươi sáu,} kết nối sân bay Long Thành và cảng Phước An.",
  },
  {
    id: "scene3",
    markup:
      "Khu thương mại tự do Long Thành quy mô hơn 8.200{tám nghìn hai trăm} ha{héc ta} với tổng vốn 16{mười sáu} tỷ đô la Mỹ, dự kiến thu hút 150.000{một trăm năm mươi nghìn} lao động chất lượng cao và đào tạo 50.000{năm mươi nghìn} kỹ sư, chuyên gia công nghệ.",
  },
  {
    id: "scene4",
    markup:
      "Việc triển khai đồng bộ các hạng mục theo quy hoạch tại Bcons{Bee Cons} Central{Central} Park{Park} sẽ góp phần đáp ứng nhu cầu an cư và đón đầu làn sóng đô thị hóa tại Đồng Nai.",
  },
];

/** "show{say}" | "word" -> [{show, say}] */
export function parseMarkup(markup) {
  const re = /(\S+?)\{([^}]*)\}|(\S+)/g;
  const out = [];
  let m;
  while ((m = re.exec(markup))) {
    out.push(m[3] ? { show: m[3], say: m[3] } : { show: m[1], say: m[2] });
  }
  return out;
}
