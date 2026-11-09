// Tên và địa chỉ dự án cho cảnh cuối: lấy từ du-an/<mã>/project.json (gắn vào spec lúc render bởi applyWatermark),
// không viết cứng trong engine để dự án khác dùng chung mẫu cảnh.
import { createContext, useContext } from "react";

export type DuAn = { ten: string; diaChi: string };
export const DuAnContext = createContext<DuAn>({ ten: "", diaChi: "" });
export const useDuAn = () => useContext(DuAnContext);

/** "Bcons Central Park" → ["Bcons", "Central Park"]: chữ đầu thường, phần sau tô màu nhấn. */
export const tachTen = (ten: string): [string, string] => {
  const i = ten.indexOf(" ");
  return i < 0 ? [ten, ""] : [ten.slice(0, i), ten.slice(i + 1)];
};
