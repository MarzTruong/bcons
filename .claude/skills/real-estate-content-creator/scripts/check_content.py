#!/usr/bin/env python3
"""Kiểm tra nhanh một file nội dung trước khi đưa anh duyệt.

Dùng: python check_content.py <file.md> [--video]
Thoát mã 1 nếu có lỗi (ERROR), 0 nếu chỉ có cảnh báo hoặc sạch.
Đây là lưới an toàn, không thay cho việc đọc lại: kiểm tra từ hype, số điện thoại
trong video, lãi trần 6,9% gắn sai PTTT, giá thiếu ghi chú VAT, thiếu bảng nguồn.
"""
import re
import sys

HYPE = [
    "siêu phẩm", "chấn động", "1-0-2", "có 102", "độc nhất vô nhị", "đầu tư là thắng", "thắng chắc",
    "lãi chắc", "x2 tài sản", "cháy hàng", "bùng nổ", "hot nhất", "rẻ nhất thị trường",
    "cơ hội vàng", "ngàn năm có một", "không mua là tiếc", "điểm trũng", "đón sóng",
    "dòng vốn dịch chuyển mạnh", "tiết kiệm 60%", "không lo lãi suất", "cam kết sinh lời",
    "chắc chắn tăng", "sốt giá", "sắp hết", "chỉ còn vài căn",
]
UNSOURCED_EXAMPLES = ["85 triệu/m", "49,9 triệu", "6,2%"]
PHONE = re.compile(r"0\d{2,3}[\s.]?\d{2,3}[\s.]?\d{2,3}[\s.]?\d{2,3}")


def content_part(text):
    """The '## Nội dung' section if present (so tables/checklists don't trigger), else all."""
    m = re.search(r"^## Nội dung\s*$(.*?)(?=^## )", text, re.S | re.M)
    return m.group(1) if m else text


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    video = "--video" in sys.argv
    text = open(path, encoding="utf-8").read()
    body = content_part(text)
    low = body.lower()
    errors, warns = [], []

    for w in HYPE:
        if w in low:
            errors.append(f"Từ hype/cấm: '{w}'")
    for w in UNSOURCED_EXAMPLES:
        if w in body:
            warns.append(f"Số trùng ví dụ không nguồn của prompt cũ: '{w}' — kiểm tra nguồn")

    phones = PHONE.findall(body)
    if video and phones:
        errors.append(f"Video có số điện thoại: {phones} (quyết định 04/11/2026: không số trong video)")
    if video and "tuấn" in low:
        errors.append("Video nhắc tên cá nhân 'Tuấn'")
    if not video and "0938.32.31.39" not in body:
        warns.append("Bài đăng chưa có dòng liên hệ 'Tuấn - 0938.32.31.39'")

    for m in re.finditer(r"6[,.]9\s*%", body):
        window = body[max(0, m.start() - 250): m.end() + 250]
        if re.search(r"(PTTT|phương thức(?: thanh toán)?(?: số)?)\s*0?5\b", window, re.I) and not re.search(
                r"(PTTT|phương thức(?: thanh toán)?(?: số)?)\s*0?[34]\b", window, re.I):
            errors.append("6,9% xuất hiện gần PTTT 05 — trần 6,9% chỉ có ở PTTT 03/04")

    if re.search(r"\d[\d,.]*\s*(tỷ|triệu\s*/\s*m)", body) and "vat" not in low:
        errors.append("Có giá nhưng không ghi chú VAT (chưa VAT / có VAT)")
    if re.search(r"\d[\d,.]*\s*tỷ", body) and "bảo trì" not in low:
        warns.append("Có giá nhưng không nhắc phí bảo trì 2%")

    if "## Bảng nguồn" not in text:
        errors.append("Thiếu mục '## Bảng nguồn'")
    if body.count("!") >= 4:
        warns.append(f"Nhiều dấu chấm than ({body.count('!')}) — giọng dễ thành quảng cáo")

    for e in errors:
        print("ERROR:", e)
    for w in warns:
        print("WARN: ", w)
    if not errors and not warns:
        print("OK: không thấy vấn đề tự động. Vẫn cần anh đọc duyệt.")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
