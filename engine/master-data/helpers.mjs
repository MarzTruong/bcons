// Nạp các file .gs (JavaScript thường) vào một vm context để test gọi như ctx.fn(...).
import fs from "node:fs";
import vm from "node:vm";

export function loadGs(paths) {
  const ctx = {};
  vm.createContext(ctx);
  for (const p of paths) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: p });
  return ctx;
}

// Mảng/đối tượng tạo trong .gs thuộc "thế giới" (realm) khác của Node nên assert.deepEqual báo lỗi khó hiểu.
// Bọc kết quả bằng plain(...) trước khi so sánh: plain(ctx.fn(x)).
export const plain = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
