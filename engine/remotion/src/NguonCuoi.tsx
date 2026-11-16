import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fontFamily } from "./theme";
import { useDuAn } from "./duAn";
import { FPS_MO_DAU, nguonCuoiState } from "./moDau";
import type { VideoSpec } from "./spec";

const TEAL = "#7ee0c3";
const INK = "#06121f";

/**
 * Khung nguồn cuối video (AGY, anh duyệt 16/11/2026): 2,5 giây không lời, chèn trước cảnh cuối.
 * Chỉ hiện tên nguồn và ngày (tối đa 3 dòng); `sourceId` chỉ để `check:spec` đối chiếu bảng nguồn.
 * Bố cục, màu, cỡ chữ giữ nguyên bản AGY; vùng an toàn 3:4, né cột nút phải và góc QR.
 */
export const NguonCuoi: React.FC<{ nguon: NonNullable<VideoSpec["nguonCuoi"]> }> = ({ nguon }) => {
  const frame = useCurrentFrame();
  const duAn = useDuAn();
  const s = nguonCuoiState(frame / FPS_MO_DAU);
  return (
    <AbsoluteFill style={{ fontFamily, background: INK }}>
      <AbsoluteFill style={{ padding: "278px 140px 420px 72px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, color: "#b7c8da" }}>
          <span style={{ width: 34, height: 8, background: TEAL }} />
          <span>{duAn.ten}</span>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: s.opacity,
            transform: `translateY(${s.shift.toFixed(1)}px)`,
          }}
        >
          <div style={{ borderLeft: `12px solid ${TEAL}`, paddingLeft: 34 }}>
            <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, color: "#fff", marginBottom: 34 }}>Nguồn số liệu</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {nguon.slice(0, 3).map((n, i, arr) => (
                <div
                  key={`${n.sourceId}-${n.ngay}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 24,
                    padding: "24px 0",
                    borderTop: "1px solid rgba(255,255,255,0.14)",
                    borderBottom: i === arr.length - 1 ? "1px solid rgba(255,255,255,0.14)" : undefined,
                  }}
                >
                  <div style={{ fontSize: 42, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>{n.ten}</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: TEAL, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {n.ngay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 1620, left: 72, right: 140, height: 6, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${s.track}%`, background: TEAL }} />
      </div>
    </AbsoluteFill>
  );
};
