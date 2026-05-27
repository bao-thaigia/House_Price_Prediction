/* Result — what the LightGBM v8 model returned.

   The numbers shown here are illustrative (no live backend), but the
   shape and feature names mirror the actual model:
   - point estimate from LightGBM in log-price space → expm1()
   - confidence interval derived from RMSLE_val (≈ 0,398) of log_price
   - attribution = SHAP-style per-feature contribution, grouped to the
     real feature columns from preprocessing_tfidf_v2.ipynb */

function ResultScreen({ form, result, onNavigate, onNewValuation, revealKey }) {
  const D = window.DG_DATA;
  const M = window.DG_MODEL;
  const district = D.districts.find((d) => d.id === form.district) || D.districts.find((d) => d.id === "q7");
  const ptype = D.property_types.find((p) => p.id === form.property_type) || D.property_types[0];
  const city = D.cities.find((c) => c.id === form.city) || D.cities[0];
  const ward = (D.wards[form.district] || []).find((w) => w.id === form.ward);

  // Mock prediction — point estimate anchored around 4.2 tỷ for defaults.
  // In production: model.predict(features) → expm1(log_pred).
  const priceTrieu = result ? result.price_trieu        : 4200;

  // 80% CI derived from RMSLE_val ≈ 0,398 in log-price space.
  // log_price ± 1.28 · RMSLE → expm1 of each side → roughly ±9% on price.
  const ciLow      = result ? Math.round(result.ci_low_trieu)  : Math.round(priceTrieu * 0.905);
  const ciHigh     = result ? Math.round(result.ci_high_trieu) : Math.round(priceTrieu * 1.095);

  const area = +form.area_m2 || 82;
  const perM2 = area > 0 ? +(priceTrieu / area).toFixed(1) : 51.2;

  // Distance to the city center used by the model (dist_<city>_km feature)
  const distKm = window.haversineKm(district.lat, district.lng, city.lat, city.lng);

  return (
    <div data-screen-label="02 Kết quả">
      {/* Property summary strip */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 32 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Eyebrow>Kết quả định giá · {new Date().toLocaleDateString("vi-VN")}</Eyebrow>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 40,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              margin: "10px 0 0",
              maxWidth: 720,
            }}
          >
            {ptype.label} {area} m² tại <em>{district.name}{ward ? ` — ${ward.name}` : ""}</em>
          </h1>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Chip>{form.bedrooms || 3} phòng ngủ</Chip>
            <Chip>{form.toilets || 2} vệ sinh</Chip>
            <Chip>{city.label}</Chip>
            <Chip>Cách trung tâm <span className="t-num">{distKm.toFixed(1).replace(".", ",")}</span> km</Chip>
          </div>
        </div>
      </div>

      {/* The big number */}
      <PriceCallout
        priceTrieu={priceTrieu}
        ciLow={ciLow}
        ciHigh={ciHigh}
        perM2={perM2}
        revealKey={revealKey}
      />
    </div>
  );
}

window.ResultScreen = ResultScreen;
