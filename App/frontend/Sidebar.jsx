function Sidebar({ current, onNavigate }) {
  const main = [
    { id: "home",        label: "Định giá mới",   icon: "calculator" },
    { id: "result",      label: "Kết quả gần nhất", icon: "trending-up" },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-row">
        <img src="assets/logo.svg" width="36" height="36" alt="Định Giá" />
        <span className="word">Định Giá</span>
      </div>

      <div className="nav-section">
        <span className="nav-eyebrow">Công cụ</span>
        {main.map((it) => (
          <button
            key={it.id}
            className={"nav-item" + (current === it.id ? " active" : "")}
            onClick={() => onNavigate(it.id)}
          >
            <Icon name={it.icon} size={18} />
            {it.label}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="avatar">L</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
