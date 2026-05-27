/* Định Giá — primitives.
   Each component is intentionally small. They lean on app.css classes
   for styling rather than encoding the look in JS. */

const { useEffect, useRef } = React;

// ---------- Icon (Lucide via window.lucide) ----------
function Icon({ name, size = 20, strokeWidth = 1.5, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide && window.lucide.icons && window.lucide.icons[name]) {
      const svg = window.lucide.icons[name].toSvg({
        width: size,
        height: size,
        "stroke-width": strokeWidth,
      });
      ref.current.innerHTML = svg;
    }
  }, [name, size, strokeWidth]);
  return <span ref={ref} style={{ display: "inline-flex", lineHeight: 0, ...style }} />;
}

// ---------- Button ----------
function Button({ children, variant = "primary", size, block, icon, iconRight, onClick, disabled, type = "button" }) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "sm" && "btn-sm",
    size === "lg" && "btn-lg",
    block && "btn-block",
  ].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={16} />}
    </button>
  );
}

// ---------- Field / Input ----------
function Field({ label, hint, error, suffix, children }) {
  return (
    <div className={"field" + (error ? " error" : "")}>
      {label && <span className="field-label">{label}</span>}
      <div className="input-wrap">
        {children}
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
      {(error || hint) && <span className="hint">{error || hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value ?? ""}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange && onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.id || o.value || o} value={o.id || o.value || o}>
          {o.label || o.name || o}
        </option>
      ))}
    </select>
  );
}

// ---------- Chip ----------
function Chip({ children, active, variant, onClick }) {
  const cls = ["chip", active && "active", variant === "accent" && "accent", variant === "jade" && "jade"].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} onClick={onClick}>
      {variant && variant !== "default" && <span className="dot" />}
      {children}
    </button>
  );
}

// ---------- Eyebrow ----------
function Eyebrow({ children, noRule }) {
  return <div className={"eyebrow" + (noRule ? " no-rule" : "")}>{children}</div>;
}

// ---------- Tabs ----------
function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button
          key={it.id}
          className={"tab" + (value === it.id ? " active" : "")}
          onClick={() => onChange && onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// Export to window for cross-script access
Object.assign(window, { Icon, Button, Field, Input, Textarea, Select, Chip, Eyebrow, Tabs });
