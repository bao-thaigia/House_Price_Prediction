"""
API server cho hệ thống định giá nhà.
Chạy: uvicorn app:app --reload --port 8000

Yêu cầu:
    pip install fastapi uvicorn joblib numpy pandas scikit-learn lightgbm
"""

import re
import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

# ─── Load artifacts ────────────────────────────────────────────────────────────

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_PATH = os.path.join(BASE_DIR, "data", "processed_v8", "preprocessing_artifacts.pkl")
MODEL_PATH     = os.path.join(BASE_DIR, "models_v8", "lightgbm.pkl")
FEATURE_PATH   = os.path.join(BASE_DIR, "models_v8", "feature_cols.pkl")

artifacts    = joblib.load(ARTIFACTS_PATH)
model        = joblib.load(MODEL_PATH)
FEATURE_COLS = joblib.load(FEATURE_PATH)

TFIDF        = artifacts["tfidf"]
SVD          = artifacts["svd"]
N_LSA        = artifacts["n_lsa"]           # 30
ENCODERS     = artifacts["encoders"]        # dict: ward_te, district_te, loc_type_te, scaler, scale_cols ...
SCALE_COLS   = artifacts["scale_cols"]
CITY_CENTERS = artifacts["gps_city_centers"]  # {'hcm': (lat,lon), 'hn':..., 'dn':..., 'bd':...}

# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Định Giá Nhà AI", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # production: thay bằng domain FE cụ thể
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Input schema ──────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    # Bắt buộc
    area_m2:       float  = Field(..., gt=0, description="Diện tích m²")
    district:      str    = Field(..., description="Quận/huyện, vd: 'Quận 1'")
    city:          str    = Field(..., description="Thành phố, vd: 'Hồ Chí Minh'")
    category_name: str    = Field(..., description="'Nhà ở' | 'Căn hộ/Chung cư' | 'Đất' | 'Văn phòng, Mặt bằng kinh doanh'")

    # Khuyến khích có (ảnh hưởng LSA features)
    title:         str    = Field("", description="Tiêu đề tin rao")
    description:   str    = Field("", description="Mô tả chi tiết")

    # Tuỳ chọn
    so_phong_ngu:  float  = Field(2.0, ge=0, description="Số phòng ngủ")
    so_phong_vs:   float  = Field(1.0, ge=0, description="Số phòng vệ sinh")
    ward:          str    = Field("",  description="Phường/xã")
    latitude:      Optional[float] = Field(None, description="Vĩ độ GPS")
    longitude:     Optional[float] = Field(None, description="Kinh độ GPS")

# ─── Helpers ───────────────────────────────────────────────────────────────────

PRICE_PATTERN = r'\d+[\.,]?\d*\s*(tỷ|triệu|tr\.?|ty|billion)'
PHONE_PATTERN = r'\*+|\b\d{9,11}\b'
KEEP_PATTERN  = r'[^a-zàáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]'

def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(PRICE_PATTERN, ' ', text)
    text = re.sub(PHONE_PATTERN, ' ', text)
    text = re.sub(KEEP_PATTERN,  ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlam = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlam / 2) ** 2
    return float(2 * R * np.arcsin(np.sqrt(a)))

CAT_MAP = {
    'Nhà ở':                             'nha_o',
    'Căn hộ/Chung cư':                   'can_ho',
    'Đất':                               'dat_nen',
    'Văn phòng, Mặt bằng kinh doanh':    'van_phong',
}

KEYWORDS = {
    'kw_mat_tien':    r'mặt tiền|mặt phố',
    'kw_hem_xe_hoi':  r'hẻm xe hơi|hẻm ô tô',
    'kw_full_nt':     r'full nội thất|đầy đủ nội thất',
    'kw_so_hong':     r'sổ hồng|sổ đỏ|đã có sổ',
    'kw_view_song':   r'view sông|nhìn sông',
    'kw_view_ho':     r'view hồ|nhìn hồ',
    'kw_penthouse':   r'penthouse',
    'kw_biet_thu':    r'biệt thự|villa',
    'kw_chinh_chu':   r'chính chủ',
    'kw_can_ban_gap': r'cần bán gấp|bán gấp',
}

def _te_lookup(info: dict, key, dist_fallback_key=None) -> float:
    """Generic target-encoding lookup với fallback về global_mean."""
    if key in info["map"]:
        return info["map"][key]
    if dist_fallback_key and dist_fallback_key in info.get("dist_fallback", {}):
        return info["dist_fallback"][dist_fallback_key]
    return info["global_mean"]

# ─── Inference pipeline ────────────────────────────────────────────────────────

def build_feature_vector(req: PredictRequest) -> np.ndarray:
    """
    Áp dụng đúng pipeline của preprocessing_tfidf_v2.ipynb cho 1 record.
    Trả về numpy array shape (1, len(FEATURE_COLS)).
    """
    row: dict = {}

    # ── 1. Raw fields ──────────────────────────────────────────────────────────
    row["area_m2"]       = float(req.area_m2)
    row["so_phong_ngu"]  = float(req.so_phong_ngu)
    row["so_phong_vs"]   = float(req.so_phong_vs)
    row["district"]      = req.district.strip()
    row["ward"]          = req.ward.strip()
    row["city"]          = req.city.strip()
    row["category_name"] = req.category_name.strip()
    row["title"]         = req.title
    row["description"]   = req.description

    # ── 2. GPS features ────────────────────────────────────────────────────────
    # Nếu FE không gửi GPS → dùng median theo quận từ encoders (nếu có),
    # fallback về trung tâm HCM.
    lat = req.latitude
    lon = req.longitude
    if lat is None or lon is None:
        # Fallback đơn giản: tâm HCM
        lat = lat or 10.7769
        lon = lon or 106.7009

    row["latitude"]  = lat
    row["longitude"] = lon

    dist_cols = {}
    for ck, (clat, clon) in CITY_CENTERS.items():
        dist_cols[f"dist_{ck}_km"] = haversine(lat, lon, clat, clon)
    row.update(dist_cols)
    row["dist_nearest_center_km"] = min(dist_cols.values())

    # ── 3. Text features ───────────────────────────────────────────────────────
    row["title_len"] = len(req.title)
    row["desc_len"]  = len(req.description)

    text_raw   = (req.title + " " + req.description).lower()
    text_clean = clean_text(req.title + " " + req.description)

    for kw, pattern in KEYWORDS.items():
        row[kw] = int(bool(re.search(pattern, text_raw)))

    # ── 4. BDS type one-hot ────────────────────────────────────────────────────
    bds_type = CAT_MAP.get(req.category_name, "khac")
    for v in ["nha_o", "can_ho", "dat_nen", "van_phong"]:
        row[f"bds__{v}"] = int(bds_type == v)

    # ── 5. Target encoding ─────────────────────────────────────────────────────
    dist = row["district"]
    ward = row["ward"]

    # district_te
    d_info = ENCODERS["district_te"]
    row["district_te"] = _te_lookup(d_info, dist)

    # ward_te  (smoothed toward district)
    w_info = ENCODERS["ward_te"]
    row["ward_te"] = _te_lookup(w_info, ward, dist_fallback_key=dist)

    # loc_type_te  (district × bds_type)
    lt_info = ENCODERS["loc_type_te"]
    row["loc_type_te"] = _te_lookup(lt_info, (dist, bds_type), dist_fallback_key=dist)

    # ── 6. Interaction + log features ─────────────────────────────────────────
    row["log_area"]       = float(np.log1p(row["area_m2"]))
    row["loc_area_inter"] = row["district_te"] * row["area_m2"]
    row["area_per_room"]  = row["area_m2"] / max(row["so_phong_ngu"], 1.0)

    # ── 7. TF-IDF → LSA (30 components) ───────────────────────────────────────
    X_tfidf = TFIDF.transform([text_clean])
    X_lsa   = SVD.transform(X_tfidf)[0]          # shape (30,)
    for i in range(N_LSA):
        row[f"lsa_{i}"] = float(X_lsa[i])

    # ── 8. Assemble DataFrame theo đúng FEATURE_COLS ──────────────────────────
    df = pd.DataFrame([row])

    # Đảm bảo đủ cột, fill 0 nếu thiếu
    for col in FEATURE_COLS:
        if col not in df.columns:
            df[col] = 0.0
    df = df[FEATURE_COLS].astype(float)

    # ── 9. Scale ───────────────────────────────────────────────────────────────
    scale_cols_present = [c for c in SCALE_COLS if c in df.columns]
    df[scale_cols_present] = ENCODERS["scaler"].transform(df[scale_cols_present])

    return df.values  # shape (1, n_features)

# ─── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": "lightgbm", "n_features": len(FEATURE_COLS)}


@app.post("/predict")
def predict(req: PredictRequest):
    try:
        X = build_feature_vector(req)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Lỗi preprocessing: {e}")

    try:
        log_price = float(model.predict(X)[0])
        price_vnd = float(np.expm1(log_price))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi model: {e}")

    # Khoảng tin cậy ±15% (xấp xỉ từ MAPE ~15% của LightGBM trên val)
    return {
        "price_vnd":   round(price_vnd),
        "price_low":   round(price_vnd * 0.85),
        "price_high":  round(price_vnd * 1.15),
        "price_billion": round(price_vnd / 1e9, 2),
        "log_price":   round(log_price, 4),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
