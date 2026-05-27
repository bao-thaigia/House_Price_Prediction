/* Sample data fixtures for the Định Giá web app prototype.
   Schema follows the backend notebooks (preprocessing_tfidf_v2 + train_model_tfidf_v2).

   Model: LightGBM trained on processed_v8 (Chợ Tốt scrape, dedup theo list_id)
   - 40.896 rows after dedup, filtered to bds_type ∈ {nha_o, can_ho}, price ≤ 40 tỷ
   - Features: area_m2, so_phong_ngu, so_phong_vs, latitude, longitude,
     dist_{hcm,hn,dn,bd}_km, dist_nearest_center_km, log_area, area_per_room,
     district_te, ward_te, loc_type_te, 30 LSA components, 10 kw_* flags,
     title_len, desc_len, bds__nha_o, bds__can_ho
   - Validation: R² = 0,735 · RMSLE = 0,398
*/

window.DG_MODEL = {
  name: "lightgbm-v8",
  family: "LightGBM",
  trained_on: "processed_v8 (Chợ Tốt, dedup list_id)",
  n_train: 40896,
  r2_val: 0.735,
  rmsle_val: 0.398,
  mape_val: 18.4,        // %
  price_cap_ty: 40,
  supported_types: ["nha_o", "can_ho"],
  cities: ["hcm", "hn", "dn", "bd"],
};

window.DG_DATA = {
  /* The model only predicts on two BDS types — dat_nen + van_phong + khac
     are excluded at training time. We surface only the two it supports. */
  property_types: [
    { id: "nha_o",  label: "Nhà ở",            note: "Nhà phố, nhà riêng, biệt thự" },
    { id: "can_ho", label: "Căn hộ / Chung cư", note: "Chung cư, penthouse, duplex" },
  ],

  cities: [
    { id: "hcm", label: "TP. Hồ Chí Minh", lat: 10.7769, lng: 106.7009 },
    { id: "hn",  label: "Hà Nội",          lat: 21.0285, lng: 105.8048 },
    { id: "dn",  label: "Đà Nẵng",         lat: 16.0544, lng: 108.2022 },
    { id: "bd",  label: "Bình Dương",      lat: 11.1535, lng: 106.6543 },
  ],

  /* District table — each row carries city + GPS centroid so the haversine
     features (dist_hcm_km … dist_nearest_center_km) can be computed
     client-side without geocoding. avg_per_m2 is the train-set target
     encoding (district_te) expressed in triệu VND/m² for display. */
  districts: [
    { id: "q1",   city: "hcm", name: "Quận 1",       lat: 10.7758, lng: 106.7008, avg_per_m2: 178.4, yoy:  6.1, n_listings: 1842 },
    { id: "q3",   city: "hcm", name: "Quận 3",       lat: 10.7836, lng: 106.6889, avg_per_m2: 162.7, yoy:  4.4, n_listings: 1204 },
    { id: "q4",   city: "hcm", name: "Quận 4",       lat: 10.7574, lng: 106.7044, avg_per_m2: 132.5, yoy:  5.8, n_listings:  742 },
    { id: "q5",   city: "hcm", name: "Quận 5",       lat: 10.7540, lng: 106.6634, avg_per_m2: 148.0, yoy:  2.9, n_listings:  912 },
    { id: "q7",   city: "hcm", name: "Quận 7",       lat: 10.7340, lng: 106.7215, avg_per_m2: 112.6, yoy: -1.4, n_listings: 2310 },
    { id: "q10",  city: "hcm", name: "Quận 10",      lat: 10.7740, lng: 106.6680, avg_per_m2: 138.2, yoy:  3.2, n_listings: 1056 },
    { id: "bt",   city: "hcm", name: "Bình Thạnh",   lat: 10.8108, lng: 106.7090, avg_per_m2: 124.8, yoy:  5.0, n_listings: 2104 },
    { id: "td",   city: "hcm", name: "Thủ Đức",      lat: 10.8497, lng: 106.7714, avg_per_m2:  82.4, yoy:  9.8, n_listings: 3186 },
    { id: "go",   city: "hcm", name: "Gò Vấp",       lat: 10.8390, lng: 106.6710, avg_per_m2:  88.6, yoy:  2.1, n_listings: 1672 },
    { id: "tb",   city: "hcm", name: "Tân Bình",     lat: 10.8014, lng: 106.6529, avg_per_m2: 116.4, yoy:  4.7, n_listings: 1408 },
    { id: "pn",   city: "hcm", name: "Phú Nhuận",    lat: 10.7944, lng: 106.6800, avg_per_m2: 142.3, yoy:  3.9, n_listings:  908 },
    /* Hà Nội — top districts by listing count */
    { id: "hn_bdinh",  city: "hn", name: "Ba Đình",     lat: 21.0344, lng: 105.8120, avg_per_m2: 168.2, yoy:  5.2, n_listings: 1124 },
    { id: "hn_hbtrung",city: "hn", name: "Hai Bà Trưng",lat: 21.0078, lng: 105.8500, avg_per_m2: 142.8, yoy:  4.6, n_listings: 1380 },
    { id: "hn_caugiay",city: "hn", name: "Cầu Giấy",    lat: 21.0307, lng: 105.7920, avg_per_m2: 138.5, yoy:  6.8, n_listings: 1742 },
    { id: "hn_dda",    city: "hn", name: "Đống Đa",     lat: 21.0122, lng: 105.8290, avg_per_m2: 152.4, yoy:  4.1, n_listings: 1284 },
    { id: "hn_hdong",  city: "hn", name: "Hà Đông",     lat: 20.9714, lng: 105.7790, avg_per_m2:  68.4, yoy:  8.9, n_listings: 2104 },
  ],

  /* Wards keyed by district. Only HCM Q7 + Bình Thạnh wired up as samples —
     in production this would be served from a /wards?district= endpoint
     that returns the train-set ward_te map. */
  wards: {
    q7: [
      { id: "tan_phong",  name: "Tân Phong",  te_offset: +0.18, n: 412 },
      { id: "tan_phu",    name: "Tân Phú",    te_offset: +0.04, n: 286 },
      { id: "tan_thuandong", name: "Tân Thuận Đông", te_offset: -0.07, n: 340 },
      { id: "tan_kieng",  name: "Tân Kiểng",  te_offset: -0.02, n: 218 },
      { id: "phu_my",     name: "Phú Mỹ",     te_offset: +0.09, n: 192 },
      { id: "phu_thuan",  name: "Phú Thuận",  te_offset: -0.04, n: 264 },
    ],
    q1: [
      { id: "benghe",     name: "Bến Nghé",   te_offset: +0.24, n: 184 },
      { id: "bethanh",    name: "Bến Thành",  te_offset: +0.21, n: 156 },
      { id: "datkao",     name: "Đa Kao",     te_offset: +0.18, n: 162 },
      { id: "tan_dinh",   name: "Tân Định",   te_offset: +0.12, n: 198 },
    ],
    bt: [
      { id: "21",         name: "Phường 21",  te_offset: +0.06, n: 188 },
      { id: "22",         name: "Phường 22",  te_offset: +0.04, n: 142 },
      { id: "25",         name: "Phường 25",  te_offset: +0.11, n: 234 },
      { id: "26",         name: "Phường 26",  te_offset: +0.08, n: 196 },
    ],
  },

  /* The 10 binary keyword flags (kw_*) the preprocessing pipeline derives
     from title+description with regex. We surface them as toggleable
     chips so the user can override the auto-detection. */
  keywords: [
    { id: "mat_tien",    label: "Mặt tiền",         regex: "mặt tiền|mặt phố",            impact: "+" },
    { id: "hem_xe_hoi",  label: "Hẻm xe hơi",       regex: "hẻm xe hơi|hẻm ô tô",        impact: "+" },
    { id: "full_nt",     label: "Full nội thất",    regex: "full nội thất|đầy đủ nội thất", impact: "+" },
    { id: "so_hong",     label: "Sổ hồng / sổ đỏ",  regex: "sổ hồng|sổ đỏ|đã có sổ",     impact: "+" },
    { id: "view_song",   label: "View sông",        regex: "view sông|nhìn sông",         impact: "+" },
    { id: "view_ho",     label: "View hồ",          regex: "view hồ|nhìn hồ",             impact: "+" },
    { id: "penthouse",   label: "Penthouse",        regex: "penthouse",                    impact: "+" },
    { id: "biet_thu",    label: "Biệt thự / villa", regex: "biệt thự|villa",              impact: "+" },
    { id: "chinh_chu",   label: "Chính chủ",        regex: "chính chủ",                    impact: "0" },
    { id: "can_ban_gap", label: "Cần bán gấp",      regex: "cần bán gấp|bán gấp",         impact: "−" },
  ],

  /* Comparable listings near "Quận 7, Phú Mỹ Hưng" — mirrors the actual
     Chợ Tốt record shape (list_id, title, area_m2, rooms, toilets,
     district, ward, price_vnd). */
  comparables: [
    { id: "c1", list_id: "118392031", district: "Quận 7", ward: "Tân Phong",  distance_m: 320, title: "Nhà phố Phú Mỹ Hưng, hẻm xe hơi, sổ hồng riêng", area_m2: 84, bedrooms: 3, toilets: 3, price_trieu: 4100, price_per_m2: 48.8, sold_days_ago: 14, photo_idx: 1, kw: ["hem_xe_hoi", "so_hong"] },
    { id: "c2", list_id: "118401874", district: "Quận 7", ward: "Tân Phong",  distance_m: 480, title: "Nhà phố hẻm 8m, full nội thất, chính chủ",       area_m2: 78, bedrooms: 3, toilets: 2, price_trieu: 4380, price_per_m2: 56.2, sold_days_ago: 26, photo_idx: 2, kw: ["hem_xe_hoi", "full_nt", "chinh_chu"] },
    { id: "c3", list_id: "118415620", district: "Quận 7", ward: "Tân Phú",    distance_m: 610, title: "Nhà phố Khu Hưng Phước, đã có sổ",               area_m2: 90, bedrooms: 4, toilets: 3, price_trieu: 4250, price_per_m2: 47.2, sold_days_ago:  9, photo_idx: 3, kw: ["so_hong"] },
    { id: "c4", list_id: "118420981", district: "Quận 7", ward: "Tân Kiểng",  distance_m: 720, title: "Nhà phố hẻm cụt, cần bán gấp",                   area_m2: 80, bedrooms: 3, toilets: 2, price_trieu: 3900, price_per_m2: 48.8, sold_days_ago: 38, photo_idx: 4, kw: ["can_ban_gap"] },
    { id: "c5", list_id: "118433102", district: "Quận 7", ward: "Tân Phong",  distance_m: 850, title: "Nhà phố 4 tầng mới xây, mặt tiền đường 12m",     area_m2: 82, bedrooms: 4, toilets: 3, price_trieu: 4420, price_per_m2: 53.9, sold_days_ago: 21, photo_idx: 5, kw: ["mat_tien"] },
    { id: "c6", list_id: "118447265", district: "Quận 7", ward: "Phú Thuận",  distance_m: 920, title: "Nhà phố hẻm 6m, sổ hồng",                        area_m2: 76, bedrooms: 3, toilets: 2, price_trieu: 3780, price_per_m2: 49.7, sold_days_ago: 45, photo_idx: 6, kw: ["so_hong"] },
  ],

  /* Feature attribution shown on the result screen. Each entry maps a
     model feature (or group) to its SHAP-like contribution in log-price
     space, converted to triệu VND for display. Names mirror the feature
     columns from the preprocessing notebook. */
  attribution: [
    { feature: "Vị trí · Q.7, Tân Phong",  detail: "district_te + ward_te",       impact_trieu:  +540, sign: "+" },
    { feature: "Diện tích · 82 m²",        detail: "log_area + area_per_room",    impact_trieu:  +320, sign: "+" },
    { feature: "Mô tả · sổ hồng + hẻm xe hơi", detail: "kw_so_hong + kw_hem_xe_hoi + LSA", impact_trieu: +210, sign: "+" },
    { feature: "Cách CBD · 6,8 km",        detail: "dist_hcm_km",                 impact_trieu:  -140, sign: "−" },
    { feature: "3 phòng ngủ",              detail: "so_phong_ngu + area_per_room", impact_trieu:  -90,  sign: "−" },
    { feature: "Tin đăng dài, có ảnh",     detail: "title_len + desc_len + LSA",  impact_trieu:  +60,  sign: "+" },
  ],

  /* Pre-saved valuations shown on the Đã lưu screen */
  saved: [
    { id: "s1", title: "Nhà phố Quận 7 — Tân Phong",       property_type: "nha_o",  district: "Quận 7",     ward: "Tân Phong", area_m2: 82, bedrooms: 3, toilets: 2, price_trieu: 4200, ci_low_trieu: 3800, ci_high_trieu: 4600, created_days_ago:  2, photo_idx: 1 },
    { id: "s2", title: "Căn hộ Bình Thạnh — D'Edge",       property_type: "can_ho", district: "Bình Thạnh", ward: "Phường 22", area_m2: 64, bedrooms: 2, toilets: 2, price_trieu: 5800, ci_low_trieu: 5400, ci_high_trieu: 6200, created_days_ago:  9, photo_idx: 2 },
    { id: "s3", title: "Nhà phố Quận 10 — Cao Thắng",      property_type: "nha_o",  district: "Quận 10",    ward: "Phường 4",  area_m2: 56, bedrooms: 3, toilets: 3, price_trieu: 8400, ci_low_trieu: 7900, ci_high_trieu: 8900, created_days_ago: 24, photo_idx: 3 },
  ],
};

/* ----------------------------------------------------------------
   Auto-detect keyword flags from free-text title+description.
   Mirrors the regex set in preprocessing_tfidf_v2.ipynb cell 9.
   ---------------------------------------------------------------- */
window.detectKeywords = function(text) {
  text = (text || "").toLowerCase();
  const hits = {};
  for (const kw of window.DG_DATA.keywords) {
    hits[kw.id] = new RegExp(kw.regex, "i").test(text);
  }
  return hits;
};

/* ----------------------------------------------------------------
   Haversine distance (km) — same formula as preprocessing cell 7.
   ---------------------------------------------------------------- */
window.haversineKm = function(lat1, lng1, lat2, lng2) {
  const R = 6371.0;
  const toRad = (d) => (d * Math.PI) / 180;
  const phi1 = toRad(lat1), phi2 = toRad(lat2);
  const dphi = toRad(lat2 - lat1), dlam = toRad(lng2 - lng1);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/* ----------------------------------------------------------------
   Helpers for formatting Vietnamese prices
   ---------------------------------------------------------------- */
window.fmtTy = function(trieu, opts) {
  opts = opts || {};
  if (trieu == null || isNaN(trieu)) return "—";
  if (trieu >= 1000) {
    const ty = trieu / 1000;
    return ty.toFixed(ty < 10 ? 1 : 0).replace(".", ",") + (opts.unit !== false ? " tỷ" : "");
  }
  return Math.round(trieu) + (opts.unit !== false ? " tr" : "");
};
window.fmtRangeTy = function(low, high) {
  return window.fmtTy(low, { unit: false }) + " – " + window.fmtTy(high);
};
window.fmtNum = function(n) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("vi-VN");
};
window.fmtKm = function(km) {
  if (km == null || isNaN(km)) return "—";
  return km.toFixed(1).replace(".", ",") + " km";
};
