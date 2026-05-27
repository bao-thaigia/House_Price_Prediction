# Định Giá — Frontend handoff

Self-contained click-through prototype of the Định Giá valuation app.
Drop this folder anywhere — open `index.html` in a browser and it runs.

```
frontend/
├── index.html              ← entry point
├── tokens.css              ← design tokens (colors, type, spacing…)
├── app.css                 ← layout + component CSS
├── data.js                 ← fixture data + helpers (REPLACE for real API)
├── assets/
│   ├── logo.svg
│   └── logo-wordmark.svg
├── App.jsx                 ← top-level router
├── Sidebar.jsx, TopBar.jsx
├── HomeScreen.jsx          ← valuation form
├── ResultScreen.jsx        ← prediction + attribution
├── ComparablesScreen.jsx
├── SavedScreen.jsx
├── PriceCallout.jsx
├── ComparableCard.jsx
├── AttributionBar.jsx
└── Primitives.jsx          ← Button / Input / Field / Chip / Eyebrow / Textarea / Tabs / Icon
```

---

## Form schema → model features

The form in `HomeScreen.jsx` is wired 1:1 to the features in
`preprocessing_tfidf_v2.ipynb` and `train_model_tfidf_v2.ipynb`. Send
this JSON to your `/predict` endpoint:

```ts
type PredictRequest = {
  // Categorical → one-hot (model only predicts bds__nha_o ∪ bds__can_ho)
  property_type: "nha_o" | "can_ho";

  // Location → target encoding (district_te, ward_te, loc_type_te)
  //          + haversine distance to 4 city centers
  city:     "hcm" | "hn" | "dn" | "bd";
  district: string;        // id matching the train-set district list
  ward:     string | null; // null → fallback to district_te

  // Numeric
  area_m2:  number;        // 0 < x < 10000
  bedrooms: number;        // so_phong_ngu
  toilets:  number;        // so_phong_vs

  // Free text → TF-IDF (15k vocab, n-gram 1-2) → TruncatedSVD → 30 LSA dims
  // Also drives title_len, desc_len, and the 10 kw_* regex flags
  title:       string;
  description: string;

  // Optional manual override for the 10 keyword flags. Omit / null
  // values mean "use the regex auto-detection from title+description".
  keyword_overrides?: Partial<Record<
    | "mat_tien" | "hem_xe_hoi" | "full_nt" | "so_hong"
    | "view_song" | "view_ho"  | "penthouse" | "biet_thu"
    | "chinh_chu" | "can_ban_gap",
    boolean
  >>;
};
```

Expected response:

```ts
type PredictResponse = {
  price_vnd:      number;          // expm1(log_pred)
  ci_low_vnd:     number;          // 80% CI lower bound
  ci_high_vnd:    number;          // 80% CI upper bound
  price_per_m2:   number;          // tr / m²

  attribution: Array<{
    feature:      string;          // human label, e.g. "Vị trí · Q.7, Tân Phong"
    detail:       string;          // technical name, e.g. "district_te + ward_te"
    impact_vnd:   number;          // signed contribution, in VND
  }>;

  model: {
    name:     string;              // "lightgbm-v8"
    r2_val:   number;
    rmsle_val: number;
    n_train:  number;
  };

  comparables: Array<ChoTotListing>;   // top-N nearest sold listings
};
```

---

## Where to plug in your backend

1. **Replace `data.js`** — strip the `window.DG_DATA` fixtures, keep the
   helpers (`fmtTy`, `fmtRangeTy`, `fmtNum`, `fmtKm`, `haversineKm`,
   `detectKeywords`), and add an API client:

   ```js
   window.api = {
     async predict(form)   { return (await fetch("/api/predict",  { method: "POST", body: JSON.stringify(form) })).json(); },
     async listDistricts() { return (await fetch("/api/districts")).json(); },
     async listWards(d)    { return (await fetch("/api/wards?district=" + d)).json(); },
     async comparables(q)  { return (await fetch("/api/comparables?" + new URLSearchParams(q))).json(); },
   };
   ```

2. **In `App.jsx`** — replace the synchronous `setScreen("result")` with
   an async call:

   ```jsx
   const handleSubmit = async () => {
     const prediction = await window.api.predict(form);
     setPrediction(prediction);
     navigate("result");
   };
   ```

   And pass `prediction` into `<ResultScreen prediction={...} />` so the
   numbers come from the model instead of the hardcoded `4200`.

3. **In `ResultScreen.jsx`** — remove the placeholder constants
   (`priceTrieu = 4200`, `ciLow`, `ciHigh`, `D.attribution`) and read
   from `props.prediction` instead.

4. **In `HomeScreen.jsx`** — populate `D.cities` / `D.districts` /
   `D.wards` from `/api/districts` + `/api/wards`. Keep `D.keywords`
   client-side (it's a tiny static lookup; matches the 10 regex flags
   in the preprocessing pipeline).

---

## Notes on the design system

- Pure B&W with one restrained burgundy (`#6B1414`) for errors only.
- Two type families: **Noto Serif Display** (display) + **Be Vietnam Pro**
  (UI body) — both have full Vietnamese diacritic coverage. JetBrains
  Mono for tabular numerics.
- Sharp corners (≤8px), hairline borders, generous section padding.
- Lucide icons at 1.5px stroke, `currentColor` only.
- No emoji, no decorative unicode glyphs.

See `tokens.css` for every CSS variable — that's the single source of
truth for color, type scale, spacing, radii, shadows, motion.

---

## Before production

The current setup loads Babel + React from unpkg and compiles JSX in
the browser. Fine for handoff, slow for production. Replace with:

- **Vite** or **Next.js** for the build pipeline
- A real font loader (`fonts.googleapis.com` is fine; self-host woff2
  if you need offline)
- Lucide as an npm package, tree-shaken (`import { Home } from "lucide-react"`)
- Type the form schema in TypeScript

The component shapes are stable — only the bootstrap layer changes.
