import os
import io
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR    = os.path.dirname(CURRENT_DIR)

STATIC_DIR    = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
MODEL_DIR     = os.path.join(CURRENT_DIR, "models")

try:
    from backend.Preprocessor import preprocess, load_dataset, FEATURE_COLS
    from backend.alerts import evaluate_alerts
except ModuleNotFoundError:
    import sys
    sys.path.append(CURRENT_DIR)
    from Preprocessor import preprocess, load_dataset, FEATURE_COLS
    from alerts import evaluate_alerts

app = FastAPI(title="Internship Anomaly Detector")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)


def load_models():
    try:
        iso_forest = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.pkl"))
        kmeans     = joblib.load(os.path.join(MODEL_DIR, "kmeans.pkl"))
        encoders   = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))
        scaler     = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
        return iso_forest, kmeans, encoders, scaler
    except FileNotFoundError:
        return None, None, None, None


def format_submission_time(val) -> str:
    """
    Parses any submission_time format into a clean readable string.
    Handles: ISO strings, timestamps, date-only, datetime with T, space-separated.
    """
    if val is None or str(val).strip() in ("", "nan", "NaT", "None"):
        return "—"
    try:
        dt = pd.to_datetime(str(val), infer_datetime_format=True, errors="coerce")
        if pd.isnull(dt):
            return str(val)
        return dt.strftime("%d %b %Y, %I:%M %p")
    except Exception:
        return str(val)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse(request=request, name="dashboard.html")


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    iso_forest, kmeans, encoders, scaler = load_models()
    if iso_forest is None:
        raise HTTPException(
            status_code=503,
            detail="Models not found. Run train.py first to generate backend/models/."
        )

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {str(e)}")

    required_cols = [
        "application_id", "applicant_name", "email", "phone",
        "university", "department", "cgpa", "submission_time",
        "submission_hour", "ip_address", "device_type",
        "time_to_fill_sec", "resume_similarity_score",
        "is_duplicate_email", "is_duplicate_phone",
        "apps_from_same_ip_1hr", "email_domain_type",
    ]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

    try:
        X_scaled, _, _, df_proc = preprocess(df, fit=False, encoders=encoders, scaler=scaler)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Preprocessing failed: {str(e)}")

    if_preds  = iso_forest.predict(X_scaled)
    if_scores = iso_forest.decision_function(X_scaled)
    km_labels = kmeans.predict(X_scaled)

    results = []
    for i, row in df.iterrows():
        record = row.to_dict()
        alerts = evaluate_alerts(record)

        is_anomaly  = if_preds[i] == -1
        high_alerts = [a for a in alerts if a["severity"] == "high"]

        if is_anomaly and len(high_alerts) >= 2:
            prediction = "fake"
        elif is_anomaly or len(high_alerts) >= 1:
            prediction = "suspicious"
        else:
            prediction = "normal"

        results.append({
            "application_id":    record.get("application_id"),
            "applicant_name":    record.get("applicant_name"),
            "email":             record.get("email"),
            "university":        record.get("university"),
            "department":        record.get("department"),
            "cgpa":              record.get("cgpa"),
            "submission_time":   format_submission_time(record.get("submission_time")),
            "time_to_fill_sec":  record.get("time_to_fill_sec"),
            "email_domain_type": record.get("email_domain_type"),
            "anomaly_score":     round(float(if_scores[i]), 4),
            "cluster":           int(km_labels[i]),
            "prediction":        prediction,
            "alerts":            alerts,
            "ground_truth":      record.get("label", None),
        })

    total      = len(results)
    fake_count = sum(1 for r in results if r["prediction"] == "fake")
    susp_count = sum(1 for r in results if r["prediction"] == "suspicious")
    norm_count = sum(1 for r in results if r["prediction"] == "normal")

    return JSONResponse({
        "summary": {
            "total":      total,
            "fake":       fake_count,
            "suspicious": susp_count,
            "normal":     norm_count,
        },
        "results": results,
    })


@app.get("/api/health")
async def health():
    iso_forest, *_ = load_models()
    return {
        "status": "ok",
        "models_loaded": iso_forest is not None,
        "paths": {
            "base":      BASE_DIR,
            "static":    STATIC_DIR,
            "templates": TEMPLATES_DIR,
            "models":    MODEL_DIR,
        }
    }