/* api.js — Bridge giữa form FE và FastAPI backend.
   Đặt file này vào frontend/ cùng chỗ với data.js.
   Sau đó thêm vào index.html:
     <script src="api.js"></script>   (sau data.js, trước App.jsx)
*/

const API_BASE = "http://localhost:8000";

/* ─── Mapping tables ────────────────────────────────────────────── */

const PROPERTY_TYPE_MAP = {
  nha_o:  "Nhà ở",
  can_ho: "Căn hộ/Chung cư",
};

/* Tra tên quận từ id (vd: "q1" → "Quận 1") */
function districtName(districtId) {
  const d = (window.DG_DATA.districts || []).find((x) => x.id === districtId);
  return d ? d.name : districtId;
}

/* Tra tên phường từ id trong quận (vd: "benghe" → "Bến Nghé") */
function wardName(districtId, wardId) {
  if (!wardId) return "";
  const list = (window.DG_DATA.wards || {})[districtId] || [];
  const w = list.find((x) => x.id === wardId);
  return w ? w.name : wardId;
}

/* Tra tên thành phố từ id (vd: "hcm" → "TP. Hồ Chí Minh") */
function cityName(cityId) {
  const c = (window.DG_DATA.cities || []).find((x) => x.id === cityId);
  return c ? c.label.replace("TP. ", "") : cityId;
}

/* Tra GPS từ district */
function districtGPS(districtId) {
  const d = (window.DG_DATA.districts || []).find((x) => x.id === districtId);
  return d ? { latitude: d.lat, longitude: d.lng } : {};
}

/* ─── Map form → request body ────────────────────────────────────── */

function formToPayload(form) {
  return {
    area_m2:       parseFloat(form.area_m2) || 0,
    so_phong_ngu:  parseFloat(form.bedrooms) || 2,
    so_phong_vs:   parseFloat(form.toilets)  || 1,
    category_name: PROPERTY_TYPE_MAP[form.property_type] || "Nhà ở",
    district:      districtName(form.district),
    ward:          wardName(form.district, form.ward),
    city:          cityName(form.city),
    title:         form.title       || "",
    description:   form.description || "",
    ...districtGPS(form.district),
  };
}

/* ─── Map response → result object dùng trong ResultScreen ──────── */

function responseToResult(data, form) {
  const price_trieu    = data.price_vnd   / 1_000_000;
  const low_trieu      = data.price_low   / 1_000_000;
  const high_trieu     = data.price_high  / 1_000_000;
  const districtData   = (window.DG_DATA.districts || []).find((x) => x.id === form.district) || {};

  return {
    /* Giá dự đoán */
    price_trieu,
    price_vnd:       data.price_vnd,
    ci_low_trieu:    low_trieu,
    ci_high_trieu:   high_trieu,
    price_billion:   data.price_billion,

    /* Thông tin căn nhà (echo lại để ResultScreen hiển thị) */
    property_type:   form.property_type,
    district:        districtName(form.district),
    ward:            wardName(form.district, form.ward),
    city:            cityName(form.city),
    area_m2:         parseFloat(form.area_m2),
    bedrooms:        parseFloat(form.bedrooms),
    toilets:         parseFloat(form.toilets),
    title:           form.title,
    description:     form.description,

    /* Giá/m² để hiển thị */
    price_per_m2_trieu: price_trieu / (parseFloat(form.area_m2) || 1),

    /* Comparables + attribution vẫn dùng static data từ data.js
       (có thể thêm endpoint /comparables sau) */
  };
}

/* ─── Hàm chính: gọi API ─────────────────────────────────────────── */

window.predictPrice = async function (form) {
  const payload = formToPayload(form);

  const res = await fetch(`${API_BASE}/predict`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return responseToResult(data, form);
};
