function ComparableCard({ item, onClick, compact }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        display: "grid",
        gridTemplateColumns: compact ? "100px 1fr auto" : "140px 1fr auto",
        borderRadius: 8,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 140ms var(--ease-out)",
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.borderColor = "var(--ink-3)")}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.borderColor = "var(--rule)")}
    >
      <div className={`photo-placeholder photo-${item.photo_idx || 1}`}>PHOTO</div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Eyebrow>
          {item.district} · cách {item.distance_m} m
        </Eyebrow>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            color: "var(--ink)",
            marginTop: 4,
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 16,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--ink-3)",
            flexWrap: "wrap",
          }}
        >
          <span>{item.area_m2} m²</span>
          <span>{item.bedrooms} PN</span>
          <span>{item.toilets} WC</span>
          {item.ward && <span>{item.ward}</span>}
        </div>
      </div>

      <div
        style={{
          padding: "16px 22px",
          textAlign: "right",
          borderLeft: "1px solid var(--rule-soft)",
          minWidth: 140,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1, color: "var(--ink)" }}>
          {window.fmtTy(item.price_trieu, { unit: false })} <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>tỷ</em>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
          {item.price_per_m2.toString().replace(".", ",")} tr/m²
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
          Bán {item.sold_days_ago} ngày trước
        </div>
      </div>
    </div>
  );
}

window.ComparableCard = ComparableCard;
