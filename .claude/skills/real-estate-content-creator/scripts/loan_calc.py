#!/usr/bin/env python3
"""Tính dòng tiền mua căn hộ: tiền tự có theo đợt, khoản vay, trả góp.

Các giai đoạn của khoản vay (tính từ lúc giải ngân):
  1. --support-months: CĐT hỗ trợ lãi + ân hạn gốc -> người mua trả 0 đ/tháng.
  2. --cap-months:     lãi trần --cap-rate (CĐT trả phần chênh). Mặc định chỉ trả lãi;
                       thêm --cap-with-principal nếu giai đoạn này đã trả gốc.
  3. Phần còn lại của --years: trả góp với lãi --rate.
Phương pháp mặc định: dư nợ giảm dần, gốc chia đều (cách phổ biến của ngân hàng VN).
--method annuity: trả đều mỗi tháng (gốc + lãi bằng nhau).

Mọi tham số không có trong tài liệu CĐT (lãi sau hỗ trợ, số năm vay...) là GIẢ ĐỊNH:
ghi rõ "(giả định)" khi đưa vào nội dung.

Ví dụ:
  python loan_calc.py --price 2.32e9 --loan-pct 50 --rate 13 --years 20 --support-months 24
  python loan_calc.py --price 3.1e9 --own-tranches "5,5,5,5,5,25,5" --loan-pct 50 \
      --cap-rate 6.9 --cap-months 24 --rate 12 --years 25 --extra-pct 2
"""
import argparse
import json
import sys


def vnd(x: float) -> str:
    return f"{round(x):,}".replace(",", ".") + " đ"


def short(x: float) -> str:
    if abs(x) >= 1e9:
        return f"{x / 1e9:.2f}".replace(".", ",") + " tỷ"
    return f"{x / 1e6:.1f}".replace(".", ",") + " triệu"


def schedule(principal, rate, months, method):
    """Return list of (payment, interest, principal_part) for each month."""
    r = rate / 100 / 12
    rows = []
    bal = principal
    if months <= 0:
        return rows
    if method == "annuity":
        pay = principal / months if r == 0 else principal * r / (1 - (1 + r) ** -months)
        for _ in range(months):
            i = bal * r
            p = pay - i
            bal -= p
            rows.append((pay, i, p))
    else:
        p = principal / months
        for _ in range(months):
            i = bal * r
            rows.append((p + i, i, p))
            bal -= p
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--price", type=float, required=True, help="Giá căn (đ, chưa VAT), vd 2.32e9")
    ap.add_argument("--loan-pct", type=float, default=0, help="%% giá trị căn vay ngân hàng")
    ap.add_argument("--rate", type=float, default=0, help="Lãi suất/năm sau các giai đoạn hỗ trợ (%%)")
    ap.add_argument("--years", type=float, default=20, help="Tổng thời hạn vay (năm), gồm cả giai đoạn hỗ trợ")
    ap.add_argument("--support-months", type=int, default=0, help="Số tháng CĐT hỗ trợ lãi + ân hạn gốc")
    ap.add_argument("--cap-rate", type=float, default=None, help="Lãi trần người mua trả (%%/năm)")
    ap.add_argument("--cap-months", type=int, default=0, help="Số tháng áp dụng lãi trần")
    ap.add_argument("--cap-with-principal", action="store_true", help="Giai đoạn lãi trần có trả gốc")
    ap.add_argument("--method", choices=["equal-principal", "annuity"], default="equal-principal")
    ap.add_argument("--own-tranches", default="", help="Các đợt tiền tự có, %% giá căn, vd '5,5,5,25,5'")
    ap.add_argument("--extra-pct", type=float, default=0, help="Chi phí thêm theo %% giá (vd 2 = phí bảo trì 2%%)")
    ap.add_argument("--json", action="store_true", help="In kết quả dạng JSON")
    a = ap.parse_args()

    out = {"price": a.price}
    tranches = [float(t) for t in a.own_tranches.split(",") if t.strip()]
    if tranches:
        cum = 0
        rows = []
        for i, t in enumerate(tranches, 1):
            amt = a.price * t / 100
            cum += amt
            rows.append({"dot": i, "pct": t, "amount": amt, "cumulative": cum})
        out["own_tranches"] = rows
        out["own_total"] = cum
        total_pct = sum(tranches) + a.loan_pct
        if abs(total_pct - 100) > 0.01:
            out["warning"] = f"Tổng % tự có + vay = {total_pct:g}%, không phải 100%"
    if a.extra_pct:
        out["extra_cost"] = a.price * a.extra_pct / 100

    loan = a.price * a.loan_pct / 100
    out["loan"] = loan
    if loan > 0:
        total_m = int(round(a.years * 12))
        cap_m = a.cap_months if a.cap_rate is not None else 0
        amort_m = total_m - a.support_months
        phases = []
        bal = loan
        paid_interest = 0.0
        if a.support_months:
            phases.append({"phase": "CĐT hỗ trợ lãi + ân hạn gốc", "months": a.support_months,
                           "monthly_first": 0, "monthly_last": 0})
        if cap_m:
            if a.cap_with_principal:
                rows = schedule(loan, a.cap_rate, amort_m, a.method)[:cap_m]
                bal = loan - sum(r[2] for r in rows)
                amort_m -= cap_m
            else:
                rows = [(loan * a.cap_rate / 100 / 12, loan * a.cap_rate / 100 / 12, 0)] * cap_m
                amort_m -= cap_m
            paid_interest += sum(r[1] for r in rows)
            phases.append({"phase": f"Lãi trần {str(a.cap_rate).replace('.', ',')}%/năm" + (" (có trả gốc)" if a.cap_with_principal else " (chỉ trả lãi)"),
                           "months": cap_m, "monthly_first": rows[0][0], "monthly_last": rows[-1][0]})
        if amort_m <= 0:
            sys.exit("Thời hạn vay quá ngắn so với các giai đoạn hỗ trợ.")
        rows = schedule(bal, a.rate, amort_m, a.method)
        paid_interest += sum(r[1] for r in rows)
        phases.append({"phase": f"Trả góp lãi {f'{a.rate:g}'.replace('.', ',')}%/năm ({'dư nợ giảm dần' if a.method == 'equal-principal' else 'trả đều'})",
                       "months": amort_m, "monthly_first": rows[0][0], "monthly_last": rows[-1][0],
                       "monthly_avg": sum(r[0] for r in rows) / len(rows)})
        out["phases"] = phases
        out["buyer_interest_total"] = paid_interest

    if a.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return

    print(f"Giá căn (chưa VAT): {vnd(a.price)} ({short(a.price)})")
    if tranches:
        print("\nTiền tự có theo đợt:")
        for r in out["own_tranches"]:
            print(f"  Đợt {r['dot']}: {r['pct']:g}% = {short(r['amount'])}  | cộng dồn {short(r['cumulative'])}")
        print(f"  Tổng tự có: {short(out['own_total'])}")
    if "warning" in out:
        print(f"  ⚠ {out['warning']}")
    if a.extra_pct:
        print(f"Chi phí thêm {a.extra_pct:g}%: {short(out['extra_cost'])} (chưa gồm VAT)")
    if loan > 0:
        print(f"\nKhoản vay {a.loan_pct:g}%: {vnd(loan)} ({short(loan)})")
        for p in out["phases"]:
            line = f"  - {p['phase']}: {p['months']} tháng, tháng đầu {short(p['monthly_first'])}"
            if p["monthly_last"] != p["monthly_first"]:
                line += f", tháng cuối {short(p['monthly_last'])}"
            if "monthly_avg" in p:
                line += f", trung bình {short(p['monthly_avg'])}"
            print(line)
        print(f"Tổng lãi người mua trả: {short(out['buyer_interest_total'])}")
    print("\nLưu ý: lãi sau hỗ trợ và thời hạn vay là giả định; giá chưa gồm VAT.")


if __name__ == "__main__":
    main()
