function AttributionBar({ items }) {
  // Find max abs impact to scale bars proportionally
  const max = Math.max(...items.map((it) => Math.abs(it.impact_trieu)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it) => {
        const pct = (Math.abs(it.impact_trieu) / max) * 45;
        const positive = it.impact_trieu > 0;
        return (
          <div
            key={it.feature}
            style={{
              display: "grid",
              gridTemplateColumns: "230px 1fr 100px",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-sans)", color: "var(--ink)", fontSize: 14, lineHeight: 1.25 }}>
                {it.feature}
              </div>
              {it.detail && (
                <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 2 }}>
                  {it.detail}
                </div>
              )}
            </div>
            <div
              style={{
                height: 14,
                background: "var(--paper-2)",
                position: "relative",
                border: "1px solid var(--rule-soft)",
              }}
            >
              {/* Positive bars are solid ink; negative bars are striped — direction +
                  fill pattern carry meaning in the absence of color. */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  background: positive
                    ? "var(--ink)"
                    : "repeating-linear-gradient(135deg, var(--ink) 0 4px, var(--paper) 4px 7px)",
                  left: positive ? "50%" : `${50 - pct}%`,
                  width: `${pct}%`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: -2,
                  bottom: -2,
                  width: 1.5,
                  background: "var(--ink)",
                }}
              />
            </div>
            <span
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                textAlign: "right",
                fontSize: 13,
                fontWeight: positive ? 400 : 600,
              }}
            >
              {positive ? "+" : "−"} {window.fmtTy(Math.abs(it.impact_trieu), { unit: false })} tr
            </span>
          </div>
        );
      })}
    </div>
  );
}

window.AttributionBar = AttributionBar;
