# api.py (FastAPI)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib, numpy as np, re

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

artifacts = joblib.load("data/processed_v8/preprocessing_artifacts.pkl")
model     = joblib.load("models_v8/lightgbm.pkl")

@app.post("/predict")
def predict(data: dict):
    # 1. clean text
    # 2. tfidf → svd (lsa)
    # 3. gps haversine
    # 4. target encoding
    # 5. scale
    # 6. model.predict → expm1
    price = ...
    return {"price_vnd": price}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)