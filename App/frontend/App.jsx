/* Định Giá web app — top-level router + screen switcher.
   No real backend; everything is local React state. */

const { useState } = React;

/* Form shape mirrors the model's input schema exactly — see
   preprocessing_tfidf_v2.ipynb cell 2 ("schema mapping & filter").
   Fields with no model feature behind them have been removed. */
const DEFAULT_FORM = {
  /* Categorical — feeds bds__nha_o / bds__can_ho one-hot */
  property_type: "nha_o",

  /* Location — drives target encoding (district_te, ward_te, loc_type_te)
     + haversine distance features (dist_hcm_km … dist_nearest_center_km) */
  city: "hcm",
  district: "q7",
  ward: "tan_phong",

  /* Numeric — direct + interaction features */
  area_m2: "82",
  bedrooms: "3",            // → so_phong_ngu
  toilets: "2",             // → so_phong_vs

  /* Free text — TF-IDF (15k vocab, n-gram 1-2) → TruncatedSVD → 30 LSA
     components. Also fuels title_len, desc_len and the 10 kw_* regex flags. */
  title: "Nhà phố Phú Mỹ Hưng — hẻm xe hơi 8m, sổ hồng chính chủ",
  description:
    "Bán nhà phố khu Phú Mỹ Hưng, Quận 7. Hẻm xe hơi 8m thông thoáng, " +
    "vị trí gần trường học và siêu thị. Nhà mới sơn lại, đã có sổ hồng " +
    "riêng, full nội thất cao cấp. Diện tích 82m², 3 phòng ngủ, 2 toilet.",

  /* Manual override for the 10 keyword flags. `null` = auto-detect from
     title+description; `true`/`false` = user pinned. */
  keyword_overrides: {},
};

const TITLE_MAP = {
  home:        { crumb: "Công cụ", title: "Định giá nhà" },
  result:      { crumb: "Công cụ", title: "Kết quả định giá" },
  comparables: { crumb: "Công cụ", title: "So sánh khu vực" },
  saved:       { crumb: "Bộ sưu tập", title: "Căn đã lưu" },
  reports:     { crumb: "Khác",   title: "Báo cáo PDF" },
  trends:      { crumb: "Khác",   title: "Xu hướng giá" },
  settings:    { crumb: "Khác",   title: "Cài đặt" },
};

function PlaceholderScreen({ screen }) {
  return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <Eyebrow noRule>{TITLE_MAP[screen].crumb}</Eyebrow>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, margin: "12px 0", letterSpacing: "-0.02em" }}>
        {TITLE_MAP[screen].title}
      </h1>
      <p className="muted" style={{ fontSize: 15, maxWidth: 420, margin: "0 auto" }}>
        Màn này chưa được dựng trong UI kit này. Đó là một trong những "next step" để hoàn thiện product.
      </p>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("home");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [revealKey, setRevealKey] = useState(0);
  const [result, setResult] = useState(null);

  const navigate = (next) => {
    if (next === "result") setRevealKey((k) => k + 1);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleSubmit = async () => {
    try {
      const res = await window.predictPrice(form);
      setResult(res);
      navigate("result");
    } catch (err) {
      alert("Lỗi kết nối API: " + err.message);
    }
  };

  const topbarActions = (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Button variant="ghost" size="sm" icon="bell"></Button>
      <Button variant="dark" size="sm" icon="plus" onClick={() => navigate("home")}>
        Định giá mới
      </Button>
    </div>
  );

  let content;
  if (screen === "home") {
    content = <HomeScreen form={form} setForm={setForm} onSubmit={handleSubmit} />;
  } else if (screen === "result") {
    content = (
      <ResultScreen
        form={form}
        result={result}

        revealKey={revealKey}
        onNavigate={navigate}
        onNewValuation={() => navigate("home")}
      />
    );
  } else {
    content = <PlaceholderScreen screen={screen} />;
  }

  return (
    <div className="app">
      <Sidebar current={screen} onNavigate={navigate} />
      <div className="main">
        <TopBar
          crumb={TITLE_MAP[screen]?.crumb}
          title={TITLE_MAP[screen]?.title}
          actions={topbarActions}
        />
        <div className="content">{content}</div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
