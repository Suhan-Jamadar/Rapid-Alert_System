"""
Rapid Alert Nexus — LSTM Prediction API Server
===============================================
Runs on http://localhost:5001 (separate terminal from the Express backend on :4000)

Endpoints:
  GET  /health          → liveness check + model loaded status
  POST /predict         → predict incident type + is_disaster from text
  POST /predict/batch   → predict for a list of texts
  GET  /classes         → list of incident type classes the model knows

Start:
    python api_server.py

The Express backend calls http://localhost:5001/predict for every new alert.
"""

import os, re, pickle, string, json
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Lazy-load the model so imports don't crash if model not trained yet ────────
MODEL_DIR   = os.path.join(os.path.dirname(__file__), "model")
model       = None
tokenizer   = None
label_enc   = None
meta        = None

def load_model():
    global model, tokenizer, label_enc, meta
    import tensorflow as tf

    model_path = os.path.join(MODEL_DIR, "lstm_model.keras")
    tok_path   = os.path.join(MODEL_DIR, "tokenizer.pkl")
    enc_path   = os.path.join(MODEL_DIR, "label_enc.pkl")
    meta_path  = os.path.join(MODEL_DIR, "meta.json")

    if not all(os.path.exists(p) for p in [model_path, tok_path, enc_path, meta_path]):
        return False

    model     = tf.keras.models.load_model(model_path)
    with open(tok_path, "rb") as f:
        tokenizer = pickle.load(f)
    with open(enc_path, "rb") as f:
        label_enc = pickle.load(f)
    with open(meta_path) as f:
        meta = json.load(f)
    return True

# ── Same autocorrect + clean as train_lstm.py ─────────────────────────────────
CORRECTIONS = {
    "flod": "flood", "floo": "flood",
    "fir": "fire",   "fier": "fire",
    "erthquake": "earthquake", "earthqake": "earthquake",
    "cyclon": "cyclone", "explosin": "explosion",
    "accidnt": "accident", "resuce": "rescue",
    "traped": "trapped", "ambulnce": "ambulance",
    "emergncy": "emergency", "banglore": "bangalore",
    "bengaluruu": "bengaluru", "chenai": "chennai",
    "hydrabad": "hyderabad", "delhii": "delhi",
    "mumabi": "mumbai", "kolkatta": "kolkata", "punee": "pune",
}

def autocorrect(text):
    return " ".join(CORRECTIONS.get(w, w) for w in text.split())

def clean(text):
    text = str(text).lower()
    text = autocorrect(text)
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"@\w+|#\w+", "", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()
    return text

# Map project's incident types to what the model might have slightly differently
INCIDENT_PRIORITY_MAP = {
    "fire":           "HIGH",
    "flood":          "HIGH",
    "earthquake":     "CRITICAL",
    "rescue":         "MEDIUM",
    "medical":        "HIGH",
    "infrastructure": "MEDIUM",
    "storm":          "MEDIUM",
    "other":          "LOW",
}

def predict_one(text: str) -> dict:
    from tensorflow.keras.preprocessing.sequence import pad_sequences

    max_len = meta["max_len"]
    cleaned = clean(text)
    seq     = tokenizer.texts_to_sequences([cleaned])
    padded  = pad_sequences(seq, maxlen=max_len, padding="post")

    preds       = model.predict(padded, verbose=0)
    inc_probs   = preds["incident_type"][0]
    bin_prob    = float(preds["is_disaster"][0][0])

    inc_idx     = int(np.argmax(inc_probs))
    inc_label   = label_enc.classes_[inc_idx]
    inc_conf    = float(inc_probs[inc_idx])

    is_disaster = bin_prob > 0.5
    priority    = INCIDENT_PRIORITY_MAP.get(inc_label, "LOW") if is_disaster else "LOW"

    # Full probability distribution
    all_probs = {
        label_enc.classes_[i]: round(float(inc_probs[i]), 4)
        for i in range(len(label_enc.classes_))
    }

    return {
        "text":          text,
        "cleaned":       cleaned,
        "incident_type": inc_label,
        "confidence":    round(inc_conf * 100),          # 0-100 int for UI
        "is_disaster":   is_disaster,
        "disaster_prob": round(bin_prob, 4),
        "priority":      priority,
        "all_probs":     all_probs,
    }

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:4000",
                   "http://localhost:3000", "http://127.0.0.1:5173"])

@app.route("/health", methods=["GET"])
def health():
    loaded = model is not None
    return jsonify({
        "status":       "ok",
        "model_loaded": loaded,
        "classes":      list(label_enc.classes_) if label_enc else [],
    })

@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_lstm.py first."}), 503

    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Missing 'text' field"}), 400

    try:
        result = predict_one(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_lstm.py first."}), 503

    data  = request.get_json(silent=True) or {}
    texts = data.get("texts", [])
    if not texts or not isinstance(texts, list):
        return jsonify({"error": "Missing 'texts' array"}), 400

    results = [predict_one(t) for t in texts]
    return jsonify({"results": results, "count": len(results)})

@app.route("/classes", methods=["GET"])
def classes():
    if label_enc is None:
        return jsonify({"error": "Model not loaded"}), 503
    return jsonify({"classes": list(label_enc.classes_)})

# ── Startup ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  Rapid Alert Nexus — LSTM API Server")
    print("=" * 55)
    print(f"  Loading model from: {MODEL_DIR}")

    if load_model():
        print(f"  ✅  Model loaded  |  Classes: {list(label_enc.classes_)}")
    else:
        print("  ⚠️   Model not found.")
        print("  ➡   Run:  python train_lstm.py   first")
        print("  Server will start but /predict will return 503 until model is loaded.")

    print(f"\n  🚀  API running on http://localhost:5001")
    print("=" * 55)
    app.run(host="0.0.0.0", port=5001, debug=False)
