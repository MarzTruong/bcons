// Kiểu phụ đề bộ "moi" theo nền cảnh: kiểu bản tin (phang, chữ tối không viền) đặt trên bản đồ vệ tinh thì
// không đọc được, nên đổi sang chữ trắng đổ bóng (bong) cho cảnh bản đồ (anh thấy ở video 8, 10/11/2026).
export const capCho = (cap: string | undefined, trenBanDo: boolean): { cap: string | undefined; chuTrang: boolean } =>
  trenBanDo && cap === "phang" ? { cap: "bong", chuTrang: true } : { cap, chuTrang: false };
