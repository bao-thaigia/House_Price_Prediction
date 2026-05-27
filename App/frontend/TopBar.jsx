function TopBar({ crumb, title, actions }) {
  return (
    <header className="topbar">
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
        {crumb && <span className="crumb">{crumb}</span>}
        {title && (
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.01em", lineHeight: 1.15, whiteSpace: "nowrap" }}>
            {title}
          </span>
        )}
      </div>
      <div className="actions">{actions}</div>
    </header>
  );
}

window.TopBar = TopBar;
