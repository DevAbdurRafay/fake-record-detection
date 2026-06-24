import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans

try:
    from backend.Preprocessor import preprocess, load_dataset
except ModuleNotFoundError:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from Preprocessor import preprocess, load_dataset

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR    = os.path.dirname(CURRENT_DIR)

DATA_PATH = os.path.join(BASE_DIR, "internship_applications.csv")
MODEL_DIR = os.path.join(CURRENT_DIR, "models")


def train():
    print(f"Loading dataset from: {DATA_PATH}...")
    if not os.path.exists(DATA_PATH):
        print(f"❌ Error: '{DATA_PATH}' not found.")
        return

    df = load_dataset(DATA_PATH)

    print("Preprocessing...")
    X_scaled, encoders, scaler, df_processed = preprocess(df, fit=True)

    print("Training Isolation Forest...")
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination=0.15,
        random_state=42,
    )
    
    iso_forest.fit(X_scaled)

    print("Training KMeans...")
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans.fit(X_scaled)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(iso_forest, os.path.join(MODEL_DIR, "isolation_forest.pkl"))
    joblib.dump(kmeans,     os.path.join(MODEL_DIR, "kmeans.pkl"))
    joblib.dump(encoders,   os.path.join(MODEL_DIR, "encoders.pkl"))
    joblib.dump(scaler,     os.path.join(MODEL_DIR, "scaler.pkl"))

    iso_preds     = iso_forest.predict(X_scaled)
    cluster_labels = kmeans.labels_
    anomaly_count = (iso_preds == -1).sum()

    print(f"\n✅ Training complete.")
    print(f"Total records     : {len(df)}")
    print(f"IF Anomalies found: {anomaly_count} ({anomaly_count/len(df)*100:.1f}%)")
    print(f"KMeans clusters   : {np.unique(cluster_labels)}")
    print(f"Models saved to   : {MODEL_DIR}")


if __name__ == "__main__":
    train()