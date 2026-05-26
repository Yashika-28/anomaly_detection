"""
ML Pipeline for Anomaly Detection
===================================
Provides:
  - build_feature_vector(session)  → numpy array
  - load_models()                  → loads all model artifacts from disk
  - ml_score(session)              → {"threat_score": float, "verdict": str, "color": str}
  - train_models(db_path)          → trains + saves models from DB data + synthetic augmentation

Feature Design Philosophy:
  - Per-session stable features (os, resolution, country, hour, day, attempts):
      Used to detect unusual login context.
  - Global bot-detection signals (avg_keystroke_delay, mouse_velocity, tab_switch_count):
      These are population-level indicators — bots always have extreme values regardless of user.
      They are NOT used to build per-user baselines; they're treated as global anomaly signals.
  - Network/process signals (bytes_sent, has_hacker_tools):
      Exfiltration and hacker tool detection.
"""

import os
import sys
import sqlite3
import math
import warnings
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [ML] %(message)s")
log = logging.getLogger("ml_pipeline")

# ─── PATHS ────────────────────────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR  = os.path.join(BACKEND_DIR, "models")
AI_MODEL_DIR = os.path.join(os.path.dirname(BACKEND_DIR), "..", "AI_model")
AI_MODEL_DIR = os.path.normpath(AI_MODEL_DIR)

MODEL_IF_PATH       = os.path.join(MODELS_DIR, "if_pipeline.pkl")
MODEL_AE_PATH       = os.path.join(MODELS_DIR, "behavior_deep_ae.h5")
MODEL_AE_SCALER     = os.path.join(MODELS_DIR, "behavior_deep_scaler.pkl")
MODEL_AE_THRESHOLD  = os.path.join(MODELS_DIR, "behavior_deep_threshold.pkl")
MODEL_ENC_PATH      = os.path.join(MODELS_DIR, "feature_encoders.pkl")

os.makedirs(MODELS_DIR, exist_ok=True)

# ─── FEATURE SCHEMA ───────────────────────────────────────────────────────────
#
# Categorical columns → OrdinalEncoder (per column)
CAT_COLS = ["os", "resolution", "country"]

# Global bot signals — standardised but NOT per-user:
#   bots always have delay < 0.02s, velocity > 3000, tab_switches ≈ 0
BOT_SIGNAL_COLS = ["avg_keystroke_delay", "mouse_velocity", "tab_switch_count"]

# Numeric columns — standardised globally
NUM_COLS = [
    "hour_of_day", "day_of_week", "attempts",
    "bytes_sent_log",       # log1p to squash exfil spikes
    "bytes_received_log",
    "is_unknown_location",
    "has_hacker_tools",
] + BOT_SIGNAL_COLS

ALL_FEATURE_COLS = CAT_COLS + NUM_COLS

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def _parse_os(os_str: str) -> str:
    s = (os_str or "Unknown").lower()
    if "windows"  in s: return "Windows"
    if "macos"    in s or "mac" in s: return "macOS"
    if "ubuntu"   in s: return "Ubuntu"
    if "kali"     in s: return "Kali Linux"
    if "linux"    in s: return "Linux"
    return "Unknown"


def _parse_resolution(res_str: str) -> str:
    known = {"1920x1080", "2560x1440", "1366x768", "2880x1800",
             "3840x2160", "1280x800", "800x600", "1024x768"}
    return res_str if res_str in known else "Other"


def _country_from_lat_lon(lat, lon) -> str:
    """
    Very coarse country bucket from lat/lon.
    Only used when country is not directly available in session.
    """
    if lat is None or lon is None:
        return "Unknown"
    # Rough continent bounding boxes
    if 6 < lat < 37 and 68 < lon < 98:   return "India"
    if 25 < lat < 49 and -125 < lon < -67: return "US"
    if 47 < lat < 55 and 6 < lon < 15:   return "Germany"
    if 50 < lat < 61 and -8 < lon < 2:   return "UK"
    if 1 < lat < 2 and 103 < lon < 104:  return "Singapore"
    if 35 < lat < 55 and 73 < lon < 135: return "China"
    if 41 < lat < 82 and 19 < lon < 180: return "Russia"
    return "Other"


def build_feature_vector(session: dict, encoders: dict | None = None, scaler=None) -> np.ndarray:
    """
    Converts a raw session dict (as stored in DB or passed from the evaluate endpoint)
    into a numpy feature vector.

    Parameters
    ----------
    session  : dict  — raw session data
    encoders : dict  — fitted OrdinalEncoders keyed by column name (or None for raw values)
    scaler   : sklearn StandardScaler (or None)
    """
    # ── Timestamp features ──
    ts_str = session.get("timestamp") or datetime.now().isoformat()
    try:
        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except Exception:
        ts = datetime.now()
    hour_of_day = ts.hour
    day_of_week = ts.weekday()

    # ── Categorical ──
    os_bucket  = _parse_os(session.get("os", ""))
    resolution = _parse_resolution(session.get("resolution", ""))
    country    = session.get("country") or _country_from_lat_lon(
        session.get("lat"), session.get("lon")
    )

    # ── Numerics ──
    attempts            = float(session.get("attempts", 1) or 1)
    bytes_sent          = float(session.get("bytes_sent", 0) or 0)
    bytes_received      = float(session.get("bytes_received", 0) or 0)
    bytes_sent_log      = math.log1p(bytes_sent)
    bytes_received_log  = math.log1p(bytes_received)
    is_unknown_location = float(session.get("is_unknown_location", 0) or 0)
    has_hacker_tools    = float(session.get("has_hacker_tools", 0) or 0)

    # ── Global bot-detection signals ──
    avg_keystroke_delay = float(session.get("avg_keystroke_delay", 0.18) or 0.18)
    mouse_velocity      = float(session.get("mouse_velocity", 450) or 450)
    tab_switch_count    = float(session.get("tab_switch_count", 3) or 3)

    # ── Encode categoricals ──
    def encode_cat(col, val):
        if encoders and col in encoders:
            try:
                enc = encoders[col]
                return float(enc.transform([[val]])[0][0])
            except Exception:
                return -1.0
        return 0.0  # raw fallback (all same → useless but safe)

    cat_vals = [
        encode_cat("os",         os_bucket),
        encode_cat("resolution", resolution),
        encode_cat("country",    country),
    ]

    num_vals = [
        hour_of_day,
        day_of_week,
        attempts,
        bytes_sent_log,
        bytes_received_log,
        is_unknown_location,
        has_hacker_tools,
        avg_keystroke_delay,
        mouse_velocity,
        tab_switch_count,
    ]

    vec = np.array(cat_vals + num_vals, dtype=np.float64)

    if scaler is not None:
        vec = scaler.transform(vec.reshape(1, -1))[0]

    return vec


# ─── MODEL LOADING ────────────────────────────────────────────────────────────
_models_cache = {}

def load_models() -> bool:
    """
    Loads all model artifacts from disk into a module-level cache.
    Returns True if ALL models loaded, False otherwise (triggers rule-based fallback).
    """
    global _models_cache

    required = [MODEL_IF_PATH, MODEL_AE_SCALER, MODEL_AE_THRESHOLD, MODEL_ENC_PATH]
    if not all(os.path.exists(p) for p in required):
        log.warning("One or more model files missing — falling back to rule-based scoring.")
        return False

    try:
        _models_cache["if_pipeline"]   = joblib.load(MODEL_IF_PATH)
        _models_cache["ae_scaler"]     = joblib.load(MODEL_AE_SCALER)
        _models_cache["ae_threshold"]  = joblib.load(MODEL_AE_THRESHOLD)
        _models_cache["encoders"]      = joblib.load(MODEL_ENC_PATH)

        # Autoencoder — try keras / tf.keras
        if os.path.exists(MODEL_AE_PATH):
            try:
                from tensorflow.keras.models import load_model  # type: ignore
                _models_cache["autoencoder"] = load_model(MODEL_AE_PATH)
                log.info("Autoencoder (Keras) loaded successfully.")
            except Exception as e:
                log.warning(f"Keras autoencoder load failed: {e} — will use IF only.")
                _models_cache["autoencoder"] = None
        else:
            _models_cache["autoencoder"] = None

        log.info("All ML models loaded successfully.")
        return True

    except Exception as e:
        log.error(f"Model load error: {e}")
        _models_cache = {}
        return False


def models_ready() -> bool:
    return bool(_models_cache) and "if_pipeline" in _models_cache


# ─── INFERENCE ────────────────────────────────────────────────────────────────
def ml_score(session: dict) -> dict:
    """
    Score a session using trained ML models.

    Returns
    -------
    dict with keys: threat_score (float 0-1), verdict (str), color (str)
    """
    if not models_ready():
        return None  # caller falls back to rule-based

    encoders = _models_cache["encoders"]
    ae_scaler = _models_cache["ae_scaler"]

    # ── Isolation Forest score ──
    try:
        raw_vec = build_feature_vector(session, encoders=encoders, scaler=None)
        # IF pipeline has its own scaler internally
        if_pipeline = _models_cache["if_pipeline"]
        # Raw IF decision function: more negative → more anomalous
        if_decision = float(if_pipeline.decision_function(raw_vec.reshape(1, -1))[0])
        # Normalise to [0,1]: clamp decision to [-0.5, 0.5] range, then flip
        if_score = float(np.clip(0.5 - if_decision, 0.0, 1.0))
    except Exception as e:
        log.warning(f"IF scoring failed: {e}")
        if_score = 0.5

    # ── Autoencoder reconstruction score ──
    ae_score = 0.5  # neutral default
    if _models_cache.get("autoencoder") is not None:
        try:
            # AE uses only the numeric bot-signal + network columns
            ae_features = [
                "avg_keystroke_delay", "mouse_velocity", "tab_switch_count",
                "bytes_sent_log", "bytes_received_log",
                "is_unknown_location", "has_hacker_tools", "attempts"
            ]
            # Build a mini dict for AE features
            s = dict(session)
            s["bytes_sent_log"]     = math.log1p(float(s.get("bytes_sent", 0) or 0))
            s["bytes_received_log"] = math.log1p(float(s.get("bytes_received", 0) or 0))
            s["is_unknown_location"] = float(s.get("is_unknown_location", 0) or 0)
            s["has_hacker_tools"]    = float(s.get("has_hacker_tools", 0) or 0)
            s["avg_keystroke_delay"] = float(s.get("avg_keystroke_delay", 0.18) or 0.18)
            s["mouse_velocity"]      = float(s.get("mouse_velocity", 450) or 450)
            s["tab_switch_count"]    = float(s.get("tab_switch_count", 3) or 3)
            s["attempts"]            = float(s.get("attempts", 1) or 1)

            ae_input_raw = np.array([[s[f] for f in ae_features]], dtype=np.float64)
            ae_input_scaled = ae_scaler.transform(ae_input_raw)

            recon = _models_cache["autoencoder"].predict(ae_input_scaled, verbose=0)
            mse   = float(np.mean(np.power(ae_input_scaled - recon, 2)))
            threshold = float(_models_cache["ae_threshold"])

            # Map mse relative to threshold: mse/threshold → then sigmoid-like squeeze
            ratio = mse / (threshold + 1e-9)
            ae_score = float(np.clip(ratio / (1.0 + ratio), 0.0, 1.0))
        except Exception as e:
            log.warning(f"Autoencoder scoring failed: {e}")
            ae_score = if_score  # fall back to IF score

    # ── Ensemble ──
    # Give slightly more weight to IF (more stable), AE catches subtle drift
    threat_score = round(0.55 * if_score + 0.45 * ae_score, 3)
    threat_score = float(np.clip(threat_score, 0.0, 1.0))

    if threat_score < 0.40:
        verdict = "SAFE"
        color   = "#16a34a"
    elif threat_score < 0.70:
        verdict = "WARNING (MFA Recommended)"
        color   = "#f59e0b"
    else:
        verdict = "CRITICAL (Block)"
        color   = "#dc2626"

    return {"threat_score": threat_score, "verdict": verdict, "color": color}


# ─── TRAINING ─────────────────────────────────────────────────────────────────
def _load_db_sessions(db_path: str) -> pd.DataFrame:
    """Export the sessions table from the SQLite DB into a DataFrame."""
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query("SELECT * FROM sessions", conn)
        conn.close()
        log.info(f"Loaded {len(df)} sessions from DB.")
        return df
    except Exception as e:
        log.warning(f"Could not load DB sessions: {e}")
        return pd.DataFrame()


def _load_synthetic_data() -> pd.DataFrame:
    """Load the unified synthetic dataset (generated by data_generation.py)."""
    synthetic_path = os.path.join(AI_MODEL_DIR, "log_unified_sessions.csv")
    if not os.path.exists(synthetic_path):
        log.info("Synthetic CSV not found — generating now...")
        try:
            import subprocess, sys
            gen_script = os.path.join(AI_MODEL_DIR, "data_generation.py")
            subprocess.run([sys.executable, gen_script], check=True, cwd=AI_MODEL_DIR)
        except Exception as e:
            log.error(f"Synthetic data generation failed: {e}")
            return pd.DataFrame()
    df = pd.read_csv(synthetic_path)
    log.info(f"Loaded {len(df)} synthetic sessions.")
    return df


def _db_sessions_to_unified(df_db: pd.DataFrame) -> pd.DataFrame:
    """
    Map DB session columns to the unified feature schema.
    Derives `country` from lat/lon, `has_hacker_tools` from active_processes,
    `is_unknown_location` from risk_status, and timestamp features.
    """
    HACKER_TOOLS = {"tor", "wireshark", "nmap", "burp", "hydra",
                    "metasploit", "netcat", "mimikatz", "sqlmap"}

    rows = []
    for _, row in df_db.iterrows():
        # Timestamp
        ts_str = row.get("timestamp", datetime.now().isoformat())
        try:
            ts = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
        except Exception:
            ts = datetime.now()

        procs_str = str(row.get("active_processes", "") or "")
        procs_lower = {p.strip().lower() for p in procs_str.split(",")}
        has_hacker_tools = int(bool(HACKER_TOOLS & procs_lower))

        risk_str = str(row.get("risk_status", "") or "")
        is_unknown_location = int("UNKNOWN_LOCATION" in risk_str.upper())

        # Derive is_anomaly from risk_status (ground truth for DB rows)
        is_anomaly = int(
            any(kw in risk_str.upper() for kw in ["ANOMALY", "BRUTE_FORCE", "BOT", "CRITICAL"])
        )

        lat = row.get("lat")
        lon = row.get("lon")
        country = _country_from_lat_lon(lat, lon)

        rows.append({
            "session_id":           row.get("id", ""),
            "user_id":              row.get("username", "unknown"),
            "timestamp":            ts.isoformat(),
            "hour_of_day":          ts.hour,
            "day_of_week":          ts.weekday(),
            "country":              country,
            "os":                   _parse_os(row.get("os", "")),
            "resolution":           _parse_resolution(row.get("resolution", "")),
            "attempts":             float(row.get("attempts", 1) or 1),
            "is_unknown_location":  is_unknown_location,
            "avg_keystroke_delay":  float(row.get("avg_keystroke_delay", 0.18) or 0.18),
            "mouse_velocity":       float(row.get("mouse_velocity", 450) or 450),
            "tab_switch_count":     float(row.get("tab_switch_count", 3) or 3),
            "bytes_sent":           float(row.get("bytes_sent", 0) or 0),
            "bytes_received":       float(row.get("bytes_received", 0) or 0),
            "has_hacker_tools":     has_hacker_tools,
            "active_processes":     procs_str,
            "is_anomaly":           is_anomaly,
        })

    return pd.DataFrame(rows)


def train_models(db_path: str | None = None) -> bool:
    """
    Train the full ML pipeline and save artifacts to models/.

    Steps:
      1. Load synthetic data
      2. Load + convert DB sessions (if any)
      3. Merge, deduplicate, fit encoders + scaler
      4. Train Isolation Forest (on all data)
      5. Train Deep Autoencoder (on normal sessions only)
      6. Save all artifacts
    """
    from sklearn.preprocessing import OrdinalEncoder, StandardScaler
    from sklearn.ensemble import IsolationForest
    from sklearn.pipeline import Pipeline

    log.info("=== Starting ML model training ===")

    # ── 1. Load data ──
    df_synthetic = _load_synthetic_data()

    df_db_raw = pd.DataFrame()
    if db_path and os.path.exists(db_path):
        df_db_raw = _load_db_sessions(db_path)
        if len(df_db_raw) > 0:
            df_db_unified = _db_sessions_to_unified(df_db_raw)
            log.info(f"Converted {len(df_db_unified)} DB sessions to unified schema.")
        else:
            df_db_unified = pd.DataFrame()
    else:
        df_db_unified = pd.DataFrame()

    # ── 2. Merge ──
    frames = [f for f in [df_synthetic, df_db_unified] if len(f) > 0]
    if not frames:
        log.error("No training data available.")
        return False

    df = pd.concat(frames, ignore_index=True)
    df = df.drop_duplicates(subset=["session_id"])

    # Add derived features
    df["bytes_sent_log"]     = np.log1p(df["bytes_sent"].fillna(0))
    df["bytes_received_log"] = np.log1p(df["bytes_received"].fillna(0))

    # Fill any missing categoricals
    for col in CAT_COLS:
        df[col] = df[col].fillna("Unknown")

    normal_count  = (df["is_anomaly"] == 0).sum()
    anomaly_count = (df["is_anomaly"] == 1).sum()
    log.info(f"Training on {len(df):,} sessions: {normal_count:,} normal, {anomaly_count:,} anomalous")

    # ── 3. Fit OrdinalEncoders per categorical column ──
    encoders = {}
    for col in CAT_COLS:
        enc = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        enc.fit(df[[col]])
        encoders[col] = enc

    # Build full feature matrix
    cat_encoded = np.column_stack([
        encoders[col].transform(df[[col]])
        for col in CAT_COLS
    ])

    num_matrix = df[NUM_COLS].values.astype(np.float64)

    X = np.hstack([cat_encoded, num_matrix])
    y = df["is_anomaly"].values

    # ── 4. Global StandardScaler ──
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── 5. Train Isolation Forest ──
    contamination = max(0.01, min(0.5, float(anomaly_count / len(df))))
    log.info(f"IF contamination set to {contamination:.3f}")

    if_model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    if_model.fit(X_scaled)

    # Compute decision function range on training data for score calibration
    # (score_samples gives raw anomaly scores; decision_function is centred)
    dec_vals = if_model.decision_function(X_scaled)
    score_min = float(np.percentile(dec_vals, 1))   # 1st pct = most anomalous seen
    score_max = float(np.percentile(dec_vals, 99))  # 99th pct = most normal seen
    log.info(f"IF decision range: [{score_min:.4f}, {score_max:.4f}]")

    # Bundle encoder + scaler + IF + calibration range into a single object
    if_bundle = {
        "encoders":   encoders,
        "scaler":     scaler,
        "model":      if_model,
        "score_min":  score_min,
        "score_max":  score_max,
    }
    joblib.dump(if_bundle, MODEL_IF_PATH)
    log.info(f"Isolation Forest saved → {MODEL_IF_PATH}")

    # ── 6. Train Deep Autoencoder on NORMAL sessions only ──
    #    Bot signals are in the feature set; AE learns what "normal" looks like
    #    and will produce high reconstruction error for bots.
    AE_FEATURE_COLS = [
        "avg_keystroke_delay", "mouse_velocity", "tab_switch_count",
        "bytes_sent_log", "bytes_received_log",
        "is_unknown_location", "has_hacker_tools", "attempts",
    ]

    df_normal = df[df["is_anomaly"] == 0]
    X_ae_raw  = df_normal[AE_FEATURE_COLS].values.astype(np.float64)

    ae_scaler = StandardScaler()
    X_ae      = ae_scaler.fit_transform(X_ae_raw)

    try:
        import tensorflow as tf
        from tensorflow.keras.models import Model  # type: ignore
        from tensorflow.keras.layers import Input, Dense, Dropout, BatchNormalization  # type: ignore
        from tensorflow.keras.optimizers import Adam  # type: ignore
        from tensorflow.keras.callbacks import EarlyStopping  # type: ignore

        input_dim = X_ae.shape[1]
        inp = Input(shape=(input_dim,))
        x   = Dense(32, activation="relu")(inp)
        x   = BatchNormalization()(x)
        x   = Dropout(0.15)(x)
        x   = Dense(16, activation="relu")(x)
        btk = Dense(8, activation="relu")(x)    # bottleneck
        x   = Dense(16, activation="relu")(btk)
        x   = BatchNormalization()(x)
        x   = Dropout(0.15)(x)
        x   = Dense(32, activation="relu")(x)
        out = Dense(input_dim, activation="linear")(x)

        ae = Model(inputs=inp, outputs=out)
        ae.compile(optimizer=Adam(0.001), loss="mse")

        callbacks = [EarlyStopping(monitor="loss", patience=5, restore_best_weights=True)]
        ae.fit(X_ae, X_ae, epochs=80, batch_size=64, callbacks=callbacks, verbose=0)

        # Threshold from training set (95th percentile MSE on normal data)
        recon     = ae.predict(X_ae, verbose=0)
        mse       = np.mean(np.power(X_ae - recon, 2), axis=1)
        threshold = float(np.percentile(mse, 95))

        ae.save(MODEL_AE_PATH)
        joblib.dump(ae_scaler, MODEL_AE_SCALER)
        joblib.dump(threshold, MODEL_AE_THRESHOLD)
        log.info(f"Autoencoder saved → {MODEL_AE_PATH}  (threshold={threshold:.5f})")

    except ImportError:
        log.warning("TensorFlow not available — skipping autoencoder. IF only.")
        # Save neutral scaler + threshold so load_models() doesn't fail
        joblib.dump(StandardScaler().fit(X_ae), MODEL_AE_SCALER)
        joblib.dump(1e9, MODEL_AE_THRESHOLD)  # very high threshold → AE never fires

    # Save encoders separately (used by build_feature_vector)
    joblib.dump(encoders, MODEL_ENC_PATH)
    log.info(f"Feature encoders saved → {MODEL_ENC_PATH}")

    log.info("=== Training complete ===")
    return True


# ─── OVERRIDDEN ml_score using bundled pipeline ───────────────────────────────
def ml_score(session: dict) -> dict | None:  # noqa: F811 — intentional override
    """
    Score a session using trained ML models.
    Returns None if models aren't loaded (caller uses rule-based fallback).
    """
    if not models_ready():
        return None

    bundle   = _models_cache["if_pipeline"]
    encoders = bundle["encoders"]
    scaler   = bundle["scaler"]
    if_model = bundle["model"]

    # ── Build feature vector ──
    try:
        # Categorical
        os_bucket  = _parse_os(session.get("os", ""))
        resolution = _parse_resolution(session.get("resolution", ""))
        country    = session.get("country") or _country_from_lat_lon(
            session.get("lat"), session.get("lon")
        )

        ts_str = session.get("timestamp") or datetime.now().isoformat()
        try:
            ts = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
        except Exception:
            ts = datetime.now()

        procs_str  = str(session.get("active_processes", "") or "")
        HACKER_SET = {"tor","wireshark","nmap","burp","hydra","metasploit","netcat","mimikatz","sqlmap"}
        procs_low  = {p.strip().lower() for p in procs_str.split(",")}
        has_hacker = float(bool(HACKER_SET & procs_low))

        bytes_sent          = float(session.get("bytes_sent", 0) or 0)
        bytes_received      = float(session.get("bytes_received", 0) or 0)
        is_unknown_location = float(session.get("is_unknown_location", 0) or 0)
        attempts            = float(session.get("attempts", 1) or 1)
        avg_ks_delay        = float(session.get("avg_keystroke_delay", 0.18) or 0.18)
        mouse_vel           = float(session.get("mouse_velocity", 450) or 450)
        tab_sw              = float(session.get("tab_switch_count", 3) or 3)

        def enc(col, val):
            try: return float(encoders[col].transform([[val]])[0][0])
            except: return -1.0

        cat_vals = [enc("os", os_bucket), enc("resolution", resolution), enc("country", country)]
        num_vals = [
            float(ts.hour), float(ts.weekday()), attempts,
            math.log1p(bytes_sent), math.log1p(bytes_received),
            is_unknown_location, has_hacker,
            avg_ks_delay, mouse_vel, tab_sw,
        ]

        vec = np.array(cat_vals + num_vals, dtype=np.float64).reshape(1, -1)
        vec_scaled = scaler.transform(vec)

        # Isolation Forest decision function
        if_decision = float(if_model.decision_function(vec_scaled)[0])

        # Calibrated score mapping using training data range.
        # decision_function: high positive = normal, negative = anomalous.
        # We linearly map [score_min, score_max] → [1.0, 0.0], then apply
        # a sigmoid sharpening so the boundary is crisp, not gradual.
        score_min = bundle.get("score_min", -0.2)
        score_max = bundle.get("score_max",  0.2)
        span = max(score_max - score_min, 1e-6)
        # linear: 0 at score_max (normal), 1 at score_min (most anomalous)
        linear = (score_max - if_decision) / span
        linear = float(np.clip(linear, 0.0, 1.0))
        # sigmoid sharpening: pushes values away from 0.5
        # f(x) = 1 / (1 + exp(-k*(x - 0.5)))  with k=8
        k = 8.0
        if_score = float(1.0 / (1.0 + np.exp(-k * (linear - 0.5))))
        if_score = float(np.clip(if_score, 0.0, 1.0))

    except Exception as e:
        log.warning(f"IF feature build failed: {e}")
        if_score = 0.5

    # ── Autoencoder score ──
    ae_score = if_score  # safe default
    if _models_cache.get("autoencoder") is not None:
        try:
            ae_scaler    = _models_cache["ae_scaler"]
            ae_threshold = _models_cache["ae_threshold"]

            ae_input_raw = np.array([[
                avg_ks_delay, mouse_vel, tab_sw,
                math.log1p(bytes_sent), math.log1p(bytes_received),
                is_unknown_location, has_hacker, attempts,
            ]], dtype=np.float64)
            ae_input = ae_scaler.transform(ae_input_raw)
            recon    = _models_cache["autoencoder"].predict(ae_input, verbose=0)
            mse      = float(np.mean(np.power(ae_input - recon, 2)))
            ratio    = mse / (float(ae_threshold) + 1e-9)
            ae_score = float(np.clip(ratio / (1.0 + ratio), 0.0, 1.0))
        except Exception as e:
            log.warning(f"AE scoring failed: {e}")

    # ── Ensemble ──
    threat_score = float(np.clip(0.55 * if_score + 0.45 * ae_score, 0.0, 1.0))
    threat_score = round(threat_score, 3)

    if threat_score < 0.40:
        verdict = "SAFE"
        color   = "#16a34a"
    elif threat_score < 0.70:
        verdict = "WARNING (MFA Recommended)"
        color   = "#f59e0b"
    else:
        verdict = "CRITICAL (Block)"
        color   = "#dc2626"

    return {"threat_score": threat_score, "verdict": verdict, "color": color}


# ─── STANDALONE TRAINING ENTRYPOINT ───────────────────────────────────────────
if __name__ == "__main__":
    db_path = os.path.join(BACKEND_DIR, "anomaly_detection.db")
    success = train_models(db_path=db_path if os.path.exists(db_path) else None)
    if success:
        # Quick smoke test
        print("\n── Smoke test ──")
        load_models()

        normal_session = {
            "os": "Windows 11", "resolution": "1920x1080",
            "lat": 28.6, "lon": 77.2,
            "hour_of_day": 10, "day_of_week": 1,
            "attempts": 1,
            "avg_keystroke_delay": 0.20,
            "mouse_velocity": 400,
            "tab_switch_count": 2,
            "bytes_sent": 5000,
            "bytes_received": 50000,
            "is_unknown_location": 0,
            "has_hacker_tools": 0,
            "active_processes": "Chrome, Outlook",
        }
        bot_session = {
            "os": "Kali Linux", "resolution": "800x600",
            "lat": 39.9, "lon": 116.4,  # Beijing
            "hour_of_day": 2, "day_of_week": 6,
            "attempts": 8,
            "avg_keystroke_delay": 0.003,
            "mouse_velocity": 8500,
            "tab_switch_count": 0,
            "bytes_sent": 200_000_000,
            "bytes_received": 500,
            "is_unknown_location": 1,
            "has_hacker_tools": 1,
            "active_processes": "Tor, nmap, Hydra",
        }

        r1 = ml_score(normal_session)
        r2 = ml_score(bot_session)
        print(f"Normal session  → {r1}")
        print(f"Bot session     → {r2}")
