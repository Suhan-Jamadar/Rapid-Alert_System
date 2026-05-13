# Rapid Alert Nexus — LSTM Module

Runs as a **separate Python microservice** on port **5001**.  
The Express backend on port 4000 calls it automatically for every alert.

---

## Folder structure

```
lstm/
├── train_lstm.py      ← run once to train and save the model
├── api_server.py      ← Flask REST API, run in its own terminal
├── requirements.txt   ← Python dependencies
└── model/             ← created automatically after training
    ├── lstm_model.keras
    ├── tokenizer.pkl
    ├── label_enc.pkl
    ├── meta.json
    └── training_history.png
```

---

## Step 1 — Set up Python environment

Open **Terminal 1** (do this once):

```bash
cd Rapid-Alert-Nexus/lstm

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 2 — Train the LSTM model

Still in **Terminal 1**, virtual env active:

```bash
python train_lstm.py
```

What you will see:
- Model summary (Embedding → LSTM(128) → LSTM(64) → dual output)
- Training progress per epoch
- EarlyStopping stops when val accuracy plateaus
- Final classification report for both binary and 7-class outputs
- Sanity-check predictions printed at the end
- `model/training_history.png` saved (accuracy + loss curves)

Training takes **~1–2 minutes** on CPU.

---

## Step 3 — Start the LSTM API server

Open **Terminal 2** (keep it running while using the app):

```bash
cd Rapid-Alert-Nexus/lstm

# Activate the same virtual env
# Windows:
venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

python api_server.py
```

You will see:
```
=======================================================
  Rapid Alert Nexus — LSTM API Server
=======================================================
  ✅  Model loaded  |  Classes: ['earthquake', 'fire', 'flood', ...]
  🚀  API running on http://localhost:5001
=======================================================
```

---

## Step 4 — Start the rest of the app (as usual)

**Terminal 3** — Express backend:
```bash
cd Rapid-Alert-Nexus/backend
npm start
```
When it connects to the LSTM server you will see:
```
🧠  LSTM API connected on :5001
```

**Terminal 4** — React frontend:
```bash
cd Rapid-Alert-Nexus
npm run dev
```

---

## API endpoints

### `GET /health`
```json
{ "status": "ok", "model_loaded": true, "classes": ["earthquake","fire","flood",...] }
```

### `POST /predict`
```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "massive fire broke out in Mumbai building people trapped"}'
```
Response:
```json
{
  "text": "massive fire broke out in Mumbai building people trapped",
  "incident_type": "fire",
  "confidence": 94,
  "is_disaster": true,
  "disaster_prob": 0.97,
  "priority": "HIGH",
  "all_probs": { "fire": 0.94, "flood": 0.02, ... }
}
```

### `POST /predict/batch`
```bash
curl -X POST http://localhost:5001/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"texts": ["flood in Pune", "going to watch movie"]}'
```

### `GET /classes`
Returns the 8 classes the model knows:
`earthquake, fire, flood, infrastructure, medical, other, rescue, storm`

---

## How it integrates with the app

1. **Frontend** submits a manual report or image description → Express POST `/api/alerts`  
2. **Express backend** calls `POST http://localhost:5001/predict` with the alert description  
3. LSTM response is attached to the alert as `alert.lstm = { incidentType, confidence, isDisaster, priority }`  
4. Alert is saved to DB and broadcast via Socket.IO — the LSTM result travels with it  
5. Frontend receives the enriched alert (LSTM data visible in processing logs)

If the LSTM server is **not running**, the app works exactly as before — alerts are classified by the keyword engine. No crash, no error shown to users.

---

## Re-train with your own data

If you have a `tweets.csv` with `text` and `target` columns (like your notebook), you can extend `train_lstm.py`:

```python
# At the top of train_lstm.py, after RAW_DATA definition:
import pandas as pd
df = pd.read_csv("path/to/tweets.csv")
for _, row in df.iterrows():
    RAW_DATA.append((str(row["text"]), "other" if row["target"] == 0 else "rescue", int(row["target"])))
```

Then re-run `python train_lstm.py`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: tensorflow` | Run `pip install -r requirements.txt` with venv active |
| `OSError: model not found` | Run `python train_lstm.py` first |
| Port 5001 in use | Change port in `api_server.py` line `app.run(port=5001)` and `LSTM_API` in `server.js` |
| LSTM not connecting | Check Terminal 2 is running; Express will retry every 30s |
