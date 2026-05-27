function PriceCallout({ priceTrieu, ciLow, ciHigh, perM2, yoy, date = "24 thg 5 2026", revealKey }) {
  return (
    <div
      style={{
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        padding: "32px 36px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 32,
        alignItems: "end",
        borderRadius: 8,
      }}
    >
      <div>
        <Eyebrow>Định giá AI · {date}</Eyebrow>
        <div key={revealKey} className="big-price reveal" style={{ marginTop: 12 }}>
          {window.fmtTy(priceTrieu, { unit: false })} <em>tỷ</em>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-3)",
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span>Khoảng tin cậy 80%</span>
          <span style={{ color: "var(--ink)" }}>
            {window.fmtTy(ciLow, { unit: false })} – {window.fmtTy(ciHigh)}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", borderLeft: "1px solid var(--rule-soft)", paddingLeft: 28 }}>
        <Eyebrow noRule>Giá / m²</Eyebrow>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 40,
            lineHeight: 1,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            marginTop: 8,
          }}
        >
          {perM2.toString().replace(".", ",")} <span style={{ fontSize: 22, color: "var(--ink-3)" }}>tr</span>
        </div>
        {yoy != null && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: yoy >= 0 ? "var(--jade)" : "var(--terracotta)",
              marginTop: 6,
              whiteSpace: "nowrap",
            }}
          >
            {yoy >= 0 ? "+" : "−"} {Math.abs(yoy).toString().replace(".", ",")}% YoY khu vực
          </div>
        )}
      </div>
    </div>
  );
}

window.PriceCallout = PriceCallout;
