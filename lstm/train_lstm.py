"""
Rapid Alert Nexus — LSTM Disaster Classifier
============================================
Trains a two-layer LSTM that predicts both:
  1. Is this text a disaster? (binary)
  2. Which incident type?  (7-class: fire, flood, earthquake, rescue, medical, infrastructure, storm)

Run:
    python train_lstm.py

Outputs saved to ./model/:
    tokenizer.pkl   – fitted Keras tokenizer
    lstm_model.h5   – trained Keras model
    label_enc.pkl   – LabelEncoder for incident types
    training_history.png
"""

import os, re, pickle, string, json
import numpy as np
import matplotlib
matplotlib.use("Agg")           # headless – no display needed
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.utils import to_categorical

# ── Config ────────────────────────────────────────────────────────────────────
MAX_VOCAB   = 15_000
MAX_LEN     = 60
EMBED_DIM   = 128
LSTM1_UNITS = 128
LSTM2_UNITS = 64
DROPOUT     = 0.3
BATCH_SIZE  = 32
EPOCHS      = 50          # EarlyStopping will stop early
PATIENCE    = 5
MODEL_DIR   = os.path.join(os.path.dirname(__file__), "model")
os.makedirs(MODEL_DIR, exist_ok=True)

INCIDENT_TYPES = ["fire", "flood", "earthquake", "rescue", "medical", "infrastructure", "storm"]

# ── Autocorrect dictionary (from your notebook) ───────────────────────────────
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

# ── Text cleaning (mirrors your notebook + simulation-data.ts) ────────────────
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

# ── Synthetic training data ───────────────────────────────────────────────────
# Each entry: (text, incident_type, is_disaster:0/1)
# Generated to match the exact incident types and keywords in simulation-data.ts

RAW_DATA = [
    # ── FIRE ──
    ("massive fire broke out in residential building people trapped",         "fire", 1),
    ("fire engulfed factory workers evacuated",                               "fire", 1),
    ("building blaze reported fire brigade deployed",                         "fire", 1),
    ("wildfire spreading rapidly homes destroyed",                            "fire", 1),
    ("fire accident at chemical plant explosion heard",                       "fire", 1),
    ("gas leak followed by fire in market area",                              "fire", 1),
    ("fire in hospital patients evacuated urgently",                          "fire", 1),
    ("blaze at warehouse multiple fire engines responding",                   "fire", 1),
    ("flames engulf apartment complex rescue operations underway",            "fire", 1),
    ("fire outbreak near fuel depot high risk area",                          "fire", 1),
    ("forest fire out of control approaching village",                        "fire", 1),
    ("electrical fire in office building staff evacuated",                    "fire", 1),
    ("fire at slum area many families homeless",                              "fire", 1),
    ("school fire evacuated students safe",                                   "fire", 1),
    ("fier accident in delhi hospital urgent",                                "fire", 1),
    ("fire in mumbai market rescue needed",                                   "fire", 1),
    ("fir in banglore building help required",                                "fire", 1),

    # ── FLOOD ──
    ("massive flooding reported water levels rising fast",                    "flood", 1),
    ("flood warning issued for low lying areas evacuate immediately",         "flood", 1),
    ("heavy rains caused flooding roads submerged",                           "flood", 1),
    ("inundation in residential colony rescue boats deployed",                "flood", 1),
    ("river overflowing threatening nearby villages",                         "flood", 1),
    ("people stranded on rooftops due to rising floodwaters",                 "flood", 1),
    ("flash flood warning several areas cut off",                             "flood", 1),
    ("tsunami warning issued coastal areas asked to evacuate",                "flood", 1),
    ("dam overflow causing flooding downstream",                              "flood", 1),
    ("waterlogging severe streets flooded rescue operations on",              "flood", 1),
    ("flod in banglore help urgent",                                          "flood", 1),
    ("floo water rising in chennai please help",                              "flood", 1),
    ("flood in mumbai people trapped in houses send help",                    "flood", 1),
    ("severe flood in kolkata many families displaced",                       "flood", 1),
    ("flood warning hyderabad low areas evacuate now",                        "flood", 1),

    # ── EARTHQUAKE ──
    ("strong earthquake tremors felt buildings damaged",                      "earthquake", 1),
    ("earthquake magnitude 6 reported several injuries",                      "earthquake", 1),
    ("tremors shook the city buildings evacuated",                            "earthquake", 1),
    ("building collapse after earthquake many feared trapped",                "earthquake", 1),
    ("earthquake struck causing widespread destruction",                      "earthquake", 1),
    ("aftershocks continuing residents asked to stay outside",                "earthquake", 1),
    ("seismic activity reported structures damaged",                          "earthquake", 1),
    ("major quake hits region rescue operations started",                     "earthquake", 1),
    ("erthquake in delhii buildings shaking",                                 "earthquake", 1),
    ("earthqake tremors felt in jaipur serious damage",                       "earthquake", 1),
    ("earthquake casualties reported rescue underway",                        "earthquake", 1),
    ("collapse of building after earthquake people trapped",                  "earthquake", 1),

    # ── RESCUE ──
    ("people trapped in collapsed building rescue teams deployed",            "rescue", 1),
    ("urgent rescue needed stranded on rooftop",                              "rescue", 1),
    ("missing persons after landslide search and rescue ongoing",             "rescue", 1),
    ("rescue operation underway multiple people trapped",                     "rescue", 1),
    ("help needed people stuck in flood send rescue",                         "rescue", 1),
    ("landslide trapped vehicles on highway rescue needed",                   "rescue", 1),
    ("rescue teams working to free people from rubble",                       "rescue", 1),
    ("avalanche rescue operation in mountainous region",                      "rescue", 1),
    ("resuce needed trapped after building collapse",                         "rescue", 1),
    ("traped people need help urgent rescue",                                 "rescue", 1),

    # ── MEDICAL ──
    ("mass casualties reported at accident site ambulances deployed",         "medical", 1),
    ("multiple injuries in explosion medical emergency declared",             "medical", 1),
    ("fatalities reported in bus accident need ambulances",                   "medical", 1),
    ("hospital overwhelmed casualties from disaster",                         "medical", 1),
    ("medical emergency mass casualties fire accident",                       "medical", 1),
    ("injured persons need urgent medical attention",                         "medical", 1),
    ("ambulance needed immediately accident on highway",                      "medical", 1),
    ("multiple people hurt in stampede medical teams needed",                 "medical", 1),
    ("ambulnce required fire accident chennai",                               "medical", 1),
    ("emergncy medical help required mass casualty event",                    "medical", 1),

    # ── INFRASTRUCTURE ──
    ("power lines down roads blocked after storm",                            "infrastructure", 1),
    ("bridge collapse blocking national highway",                             "infrastructure", 1),
    ("major power outage affecting entire district",                          "infrastructure", 1),
    ("building collapse under construction workers trapped",                  "infrastructure", 1),
    ("road cave in vehicles stuck emergency response needed",                 "infrastructure", 1),
    ("telecom tower fell during storm communication disrupted",               "infrastructure", 1),
    ("gas pipeline burst evacuation in progress",                             "infrastructure", 1),
    ("railway track damaged train services suspended emergency",              "infrastructure", 1),
    ("water supply disrupted pipe burst major area affected",                 "infrastructure", 1),
    ("flyover crack found emergency evacuation nearby buildings",             "infrastructure", 1),

    # ── STORM ──
    ("severe cyclone approaching coastal area evacuate immediately",          "storm", 1),
    ("storm warning issued high winds and heavy rain expected",               "storm", 1),
    ("cyclone making landfall massive destruction reported",                  "storm", 1),
    ("thunderstorm caused widespread damage trees uprooted",                  "storm", 1),
    ("hailstorm damage to crops and vehicles",                                "storm", 1),
    ("strong winds uprooted trees blocked roads",                             "storm", 1),
    ("cyclone warning coastal districts on high alert evacuation",            "storm", 1),
    ("tornado touched down homes destroyed",                                  "storm", 1),
    ("cyclon warning approaching hydrabad evacuate now",                      "storm", 1),
    ("severe storm causing flooding and power cuts",                          "storm", 1),

    # ── NON-DISASTER (label as "other", is_disaster=0) ──
    ("just had the best coffee ever morning vibes",                           "other", 0),
    ("beautiful sunset today nature",                                         "other", 0),
    ("watching cricket match with friends so exciting",                       "other", 0),
    ("happy diwali to everyone celebration time",                             "other", 0),
    ("going to watch new movie tonight",                                      "other", 0),
    ("had a great lunch at my favourite restaurant",                          "other", 0),
    ("traffic is bad today running late for office",                          "other", 0),
    ("it is raining in bangalore today weather",                              "other", 0),
    ("exam results out feeling nervous",                                      "other", 0),
    ("birthday party was amazing last night",                                 "other", 0),
    ("weekend trip to goa planned",                                           "other", 0),
    ("shopping sale going on big discount",                                   "other", 0),
    ("baby pictures so adorable and cute",                                    "other", 0),
    ("good morning everyone have a great day",                                "other", 0),
    ("new phone launched checking specs",                                     "other", 0),
    ("music concert was fantastic last evening",                              "other", 0),
    ("festival celebration in full swing",                                    "other", 0),
    ("reading a good book this afternoon",                                    "other", 0),
    ("college exam tomorrow need to study",                                   "other", 0),
    ("love spending time with family on weekends",                            "other", 0),
    ("road slightly wet after light drizzle nothing serious",                 "other", 0),
    ("minor traffic jam due to vehicle breakdown",                            "other", 0),
    ("road work causing slight delay",                                        "other", 0),
    ("small power cut for maintenance restored quickly",                      "other", 0),
    ("light rain expected tomorrow check weather app",                        "other", 0),
]

# ── Augment data: duplicate real disasters 3x with slight variation ───────────
import random
random.seed(42)

AUGMENT_TEMPLATES = [
    "{} situation getting worse",
    "urgent {} please respond immediately",
    "breaking {} multiple people affected",
    "{} help needed right now",
    "critical {} emergency services deployed",
]

augmented = []
for text, label, is_dis in RAW_DATA:
    if is_dis == 1:
        for _ in range(2):
            tmpl = random.choice(AUGMENT_TEMPLATES)
            augmented.append((tmpl.format(text), label, 1))
RAW_DATA.extend(augmented)
random.shuffle(RAW_DATA)

texts_raw  = [clean(d[0]) for d in RAW_DATA]
labels_inc = [d[1] for d in RAW_DATA]      # 7-class + "other"
labels_bin = [d[2] for d in RAW_DATA]      # 0/1

print(f"Total samples: {len(texts_raw)}")

# ── Encode incident type labels ───────────────────────────────────────────────
label_enc = LabelEncoder()
y_inc = label_enc.fit_transform(labels_inc)
n_classes = len(label_enc.classes_)
print(f"Classes ({n_classes}): {list(label_enc.classes_)}")

# ── Tokenise ──────────────────────────────────────────────────────────────────
tokenizer = Tokenizer(num_words=MAX_VOCAB, oov_token="<OOV>")
tokenizer.fit_on_texts(texts_raw)
seqs = tokenizer.texts_to_sequences(texts_raw)
X = pad_sequences(seqs, maxlen=MAX_LEN, padding="post", truncating="post")

y_inc_cat = to_categorical(y_inc, num_classes=n_classes)
y_bin = np.array(labels_bin, dtype="float32")

# ── Train/val split ───────────────────────────────────────────────────────────
X_tr, X_val, yi_tr, yi_val, yb_tr, yb_val = train_test_split(
    X, y_inc_cat, y_bin, test_size=0.20, random_state=42, stratify=y_inc
)
print(f"Train: {len(X_tr)}  Val: {len(X_val)}")

# ── Build LSTM model (multi-output) ──────────────────────────────────────────
#   Input → Embedding → LSTM(128) → Dropout → LSTM(64) → Dropout
#   ├── Dense(7, softmax)   → incident type
#   └── Dense(1, sigmoid)   → is_disaster binary

inp = tf.keras.Input(shape=(MAX_LEN,), name="text_input")
emb = Embedding(MAX_VOCAB, EMBED_DIM, name="embedding")(inp)
l1  = LSTM(LSTM1_UNITS, return_sequences=True, name="lstm_1")(emb)
d1  = Dropout(DROPOUT, name="dropout_1")(l1)
l2  = LSTM(LSTM2_UNITS, return_sequences=False, name="lstm_2")(d1)
d2  = Dropout(DROPOUT, name="dropout_2")(l2)

out_type = Dense(n_classes, activation="softmax", name="incident_type")(d2)
out_bin  = Dense(1,         activation="sigmoid",  name="is_disaster")(d2)

model = tf.keras.Model(inputs=inp, outputs={"incident_type": out_type, "is_disaster": out_bin})

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss={
        "incident_type": "categorical_crossentropy",
        "is_disaster":   "binary_crossentropy",
    },
    loss_weights={"incident_type": 0.7, "is_disaster": 0.3},
    metrics={
        "incident_type": "accuracy",
        "is_disaster":   "accuracy",
    },
)
model.summary()

# ── Callbacks ─────────────────────────────────────────────────────────────────
es  = EarlyStopping(monitor="val_incident_type_accuracy", patience=PATIENCE,
                    restore_best_weights=True, mode="max", verbose=1)
ckpt = ModelCheckpoint(
    os.path.join(MODEL_DIR, "lstm_best.keras"),
    monitor="val_incident_type_accuracy", save_best_only=True, mode="max", verbose=0
)

# ── Train ─────────────────────────────────────────────────────────────────────
history = model.fit(
    X_tr,
    {"incident_type": yi_tr, "is_disaster": yb_tr},
    validation_data=(X_val, {"incident_type": yi_val, "is_disaster": yb_val}),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=[es, ckpt],
    verbose=1,
)

# ── Save artefacts ────────────────────────────────────────────────────────────
model.save(os.path.join(MODEL_DIR, "lstm_model.keras"))

with open(os.path.join(MODEL_DIR, "tokenizer.pkl"), "wb") as f:
    pickle.dump(tokenizer, f)
with open(os.path.join(MODEL_DIR, "label_enc.pkl"), "wb") as f:
    pickle.dump(label_enc, f)

# Save metadata so the API server knows config without re-importing train script
meta = {"max_len": MAX_LEN, "max_vocab": MAX_VOCAB, "classes": list(label_enc.classes_)}
with open(os.path.join(MODEL_DIR, "meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

print("\n✅  Model saved to ./model/")

# ── Evaluation ────────────────────────────────────────────────────────────────
preds       = model.predict(X_val, verbose=0)
y_type_pred = np.argmax(preds["incident_type"], axis=1)
y_type_true = np.argmax(yi_val, axis=1)
y_bin_pred  = (preds["is_disaster"].flatten() > 0.5).astype(int)

print("\n── Incident Type Classification Report ──")
print(classification_report(y_type_true, y_type_pred,
                             target_names=label_enc.classes_, zero_division=0))
print(f"Incident type accuracy : {accuracy_score(y_type_true, y_type_pred):.4f}")

print("\n── Binary Disaster Classification Report ──")
print(classification_report(yb_val.astype(int), y_bin_pred,
                             target_names=["non-disaster","disaster"], zero_division=0))
print(f"Binary accuracy        : {accuracy_score(yb_val.astype(int), y_bin_pred):.4f}")

# ── Training curves ───────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

# Accuracy
ax = axes[0]
ax.plot(history.history["incident_type_accuracy"],   label="Train", marker="o")
ax.plot(history.history["val_incident_type_accuracy"], label="Validation", marker="s", linestyle="--")
ax.set_title("Model Accuracy (Incident Type)")
ax.set_xlabel("Epoch")
ax.set_ylabel("Accuracy")
ax.legend()
ax.grid(True, alpha=0.3)

# Loss
ax = axes[1]
ax.plot(history.history["loss"],     label="Train Loss", marker="o")
ax.plot(history.history["val_loss"], label="Val Loss",   marker="s", linestyle="--")
ax.set_title("Model Loss")
ax.set_xlabel("Epoch")
ax.set_ylabel("Loss")
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(MODEL_DIR, "training_history.png"), dpi=150)
print("📊  Training curves saved → model/training_history.png")

# Quick sanity-check predictions
print("\n── Sanity Checks ──")
tests = [
    "flood in bangalore help urgent",
    "fire accident in delhi hospital",
    "earthquake tremors felt in jaipur",
    "going to watch movie tonight",
    "ambulance needed multiple casualties",
    "cyclone warning coastal area evacuate",
]
for t in tests:
    cleaned = clean(t)
    seq     = tokenizer.texts_to_sequences([cleaned])
    padded  = pad_sequences(seq, maxlen=MAX_LEN, padding="post")
    out     = model.predict(padded, verbose=0)
    inc_idx = np.argmax(out["incident_type"][0])
    inc_lbl = label_enc.classes_[inc_idx]
    conf    = float(out["incident_type"][0][inc_idx])
    is_dis  = float(out["is_disaster"][0][0])
    print(f"  '{t}' → {inc_lbl} ({conf:.0%}) | disaster={is_dis:.2f}")
