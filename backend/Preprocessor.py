import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler


FEATURE_COLS = [
    "cgpa",
    "submission_hour",
    "time_to_fill_sec",
    "resume_similarity_score",
    "is_duplicate_email",
    "is_duplicate_phone",
    "apps_from_same_ip_1hr",
    "email_domain_type_enc",
    "device_type_enc",
]


def preprocess(df: pd.DataFrame, fit: bool = True, encoders: dict = None, scaler=None):
    df = df.copy()

    df["is_duplicate_email"] = df["is_duplicate_email"].astype(str).str.lower().map({"true": 1, "false": 0}).fillna(0).astype(int)
    df["is_duplicate_phone"] = df["is_duplicate_phone"].astype(str).str.lower().map({"true": 1, "false": 0}).fillna(0).astype(int)

    if fit:
        encoders  = {}
        le_domain = LabelEncoder()
        le_device = LabelEncoder()
        df["email_domain_type_enc"] = le_domain.fit_transform(df["email_domain_type"].astype(str))
        df["device_type_enc"]       = le_device.fit_transform(df["device_type"].astype(str))
        encoders["email_domain_type"] = le_domain
        encoders["device_type"]       = le_device

        scaler   = StandardScaler()
        X        = df[FEATURE_COLS].values
        X_scaled = scaler.fit_transform(X)
    else:
        df["email_domain_type_enc"] = encoders["email_domain_type"].transform(df["email_domain_type"].astype(str))
        df["device_type_enc"]       = encoders["device_type"].transform(df["device_type"].astype(str))
        X        = df[FEATURE_COLS].values
        X_scaled = scaler.transform(X)

    return X_scaled, encoders, scaler, df


def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    return df