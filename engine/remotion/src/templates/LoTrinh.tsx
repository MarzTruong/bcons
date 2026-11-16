import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fontFamily } from "../theme";
import { useDuAn } from "../duAn";
import { chiaDoanThanh, dinhDangTr, hangHien, nhomHienLuc, tongLoTrinh, type Nhom } from "../loTrinh";
import type { TemplateProps } from "./common";

const INK = "#06121f";
const MAU: Record<Nhom, string> = { tuCo: "#7ee0c3", nganHang: "#ffe14d", nhanNha: "#ff9e44", soHong: "#7cc4ff" };
const NHAN: Record<Nhom, string> = { tuCo: "Tự có trước nhận nhà", nganHang: "Ngân hàng giải ngân", nhanNha: "Nhận nhà", soHong: "Sổ hồng" };

const ease = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

/**
 * Mẫu `lo-trinh` (AGY phương án 1, anh chọn 16/11/2026): thanh xếp chồng "căn này được trả bằng gì", hai số lớn (tự có, ngân hàng)
 * và trục thời gian dọc các mốc. Mọi tổng tính từ moc[]; mốc hiện theo cue của giọng. Màu và bố cục giữ nguyên bản AGY, không đổi theo `style`.
 * Cảnh không có phụ đề (chữ trên hình thay phụ đề).
 */
export const LoTrinh: React.FC<TemplateProps<"lo-trinh">> = ({ props, cue }) => {
  const frame = useCurrentFrame();
  const duAn = useDuAn();
  const moc = props.moc;
  const tong = tongLoTrinh(moc);
  const doan = chiaDoanThanh(moc);
  const hienNhom = nhomHienLuc(moc, cue);
  const nhomP = (n: Nhom) => (hienNhom[n] === undefined ? 0 : ease((frame - (hienNhom[n] as number)) / 13.5));
  const nganHangMoc = moc.find((m) => m.nhom === "nganHang");
  const tongQuan = props.phan === "tong-quan";

  const panel = (
    <div style={{ background: "#0c1f33", borderLeft: "10px solid #7ee0c3", borderRadius: "0 6px 6px 0", padding: "20px 24px", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 25, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>Căn này được trả bằng gì?</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#7ee0c3", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          Tổng (có VAT, phí bảo trì): {dinhDangTr(tong.tong)} tr
        </div>
      </div>
      <div style={{ height: 52, borderRadius: 6, overflow: "hidden", display: "flex", background: "#132c45", marginBottom: 14 }}>
        {doan.map((d) => (
          <div
            key={d.nhom}
            style={{
              width: `${d.phanTram.toFixed(2)}%`,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 23,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              overflow: "hidden",
              whiteSpace: "nowrap",
              background: MAU[d.nhom],
              color: INK,
              opacity: 0.18 + 0.82 * nhomP(d.nhom),
            }}
          >
            {d.phanTram >= 9 ? dinhDangTr(d.so) : ""}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 18px" }}>
        {doan.map((d) => (
          <div
            key={d.nhom}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 22, fontWeight: 600, color: "#d6e4f2", opacity: nhomP(d.nhom) > 0 ? 1 : 0.42 }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0, background: MAU[d.nhom] }} />
              <span>{NHAN[d.nhom]}</span>
            </span>
            <span style={{ fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{dinhDangTr(d.so)} tr</span>
          </div>
        ))}
      </div>
    </div>
  );

  const heroPair = (
    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
      <div style={{ flex: 1, background: "#0e243a", borderLeft: `8px solid ${MAU.tuCo}`, padding: "16px 20px", borderRadius: 6, opacity: 0.35 + 0.65 * nhomP("tuCo") }}>
        <div style={{ fontSize: 21, fontWeight: 600, color: "#b7c8da", marginBottom: 4 }}>
          {NHAN.tuCo} ({tong.soDotTuCo} đợt)
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 54, fontWeight: 800, lineHeight: 1, color: MAU.tuCo, fontVariantNumeric: "tabular-nums" }}>{dinhDangTr(tong.tuCo)}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#e6eff7" }}>triệu</span>
        </div>
      </div>
      <div style={{ flex: 1.28, background: "#142f4a", borderLeft: `8px solid ${MAU.nganHang}`, padding: "16px 20px", borderRadius: 6, opacity: 0.35 + 0.65 * nhomP("nganHang") }}>
        <div style={{ fontSize: 21, fontWeight: 600, color: "#b7c8da", marginBottom: 4 }}>
          {NHAN.nganHang}
          {nganHangMoc ? ` (${nganHangMoc.khi})` : ""}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: MAU.nganHang, fontVariantNumeric: "tabular-nums" }}>{dinhDangTr(tong.nganHang)}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#e6eff7" }}>triệu</span>
        </div>
      </div>
    </div>
  );

  const timeline = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
      {moc.map((m, i) => {
        const p = hangHien(m, frame, cue);
        const mau = MAU[m.nhom];
        const ngan = m.nhom === "nganHang";
        const nhan = m.nhom === "nhanNha";
        return (
          <div
            key={`${m.nhan}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "12px 16px",
              borderRadius: 6,
              background: ngan ? "#153452" : nhan ? "rgba(24,42,62,0.92)" : "rgba(14,34,54,0.78)",
              borderLeft: `6px solid ${ngan || nhan || m.nhom === "tuCo" ? mau : "#23425f"}`,
              opacity: p,
              transform: `translateX(${((1 - p) * -22).toFixed(1)}px)`,
            }}
          >
            <div style={{ width: 158, flexShrink: 0, fontSize: 22, fontWeight: 800, color: ngan || nhan ? mau : MAU.tuCo, lineHeight: 1.2 }}>{m.khi}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
                <div>
                  <span style={{ fontSize: 25, fontWeight: 700, color: "#fff" }}>{m.nhan}</span>
                  {m.ghiChu ? <span style={{ fontSize: 20, fontWeight: 500, color: "#9cb2c9", marginLeft: 8 }}>· {m.ghiChu}</span> : null}
                </div>
                <div style={{ fontSize: ngan ? 42 : nhan ? 34 : 32, fontWeight: 800, color: ngan ? MAU.nganHang : nhan ? MAU.nhanNha : MAU.tuCo, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {dinhDangTr(m.soTien)} tr
                </div>
              </div>
              <div style={{ width: "100%", height: 14, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: ngan ? MAU.nganHang : nhan ? MAU.nhanNha : MAU.tuCo, width: `${(Math.max(6, (m.soTien / tong.lonNhat) * 100) * p).toFixed(1)}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily, background: INK }}>
      <AbsoluteFill style={{ padding: "256px 140px 256px 72px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 700, color: "#b7c8da" }}>
            <span style={{ width: 12, height: 12, background: MAU.tuCo }} />
            <span>
              {duAn.ten} · {props.pttt}
            </span>
          </div>
          <div style={{ background: "#10263c", borderLeft: `5px solid ${MAU.nganHang}`, color: MAU.nganHang, padding: "8px 16px", fontSize: 24, fontWeight: 700, borderRadius: "0 4px 4px 0", whiteSpace: "nowrap" }}>
            Căn ví dụ: {props.canViDu}
          </div>
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 18, flexShrink: 0 }}>{props.title}</div>
        {tongQuan ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {panel}
            {heroPair}
          </div>
        ) : (
          <>
            {panel}
            {timeline}
          </>
        )}
        {props.ghiChuCuoi ? <div style={{ marginTop: 14, fontSize: 21, fontWeight: 500, lineHeight: 1.35, color: "#9cb2c9", flexShrink: 0 }}>{props.ghiChuCuoi}</div> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

