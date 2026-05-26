# 🛡️ Neurometric Shield: Continuous Zero-Trust UEBA Platform

Neurometric Shield is an enterprise-grade **User and Entity Behavior Analytics (UEBA)** platform that shifts authentication from a single one-shot login event to a continuous, behavioral-based zero-trust process. 

By capturing real-time human-computer interaction (HCI) telemetry and contextual identifiers in the browser, Neurometric Shield employs unsupervised Machine Learning (Isolation Forest) to continuously calculate session anomaly scores. Threats are intercepted dynamically: safe users experience frictionless access, borderline anomalies are stepped up with email-based Multi-Factor Authentication (MFA), and overt hostile activity (e.g. automated bots, known hacking tools, data exfiltration) is blocked instantly.

---

## 🏗️ Architecture & Real-Time Data Flow

```
                  ┌──────────────────────────────────────────────┐
                  │               CLIENT (Next.js)               │
                  │   Captures: Keystrokes, Mouse speed,         │
                  │   Tab switches, Bytes sent, Client OS/Res.   │
                  └──────────────┬────────────────────────┬──────┘
                                 │                        │
       Live WSS Telemetry Stream │                        │ HTTPS POST (/api/evaluate)
                                 ▼                        ▼
                  ┌──────────────────────────────────────────────┐
                  │          BACKEND SERVICE (FastAPI)           │
                  │                                              │
                  │   ┌──────────────────────────────────────┐   │
                  │   │        SQLite Database Layer         │   │
                  │   │   Tracks users, sessions, geo-trust  │   │
                  │   └──────────────────┬───────────────────┘   │
                  │                      ▼                       │
                  │   ┌──────────────────────────────────────┐   │
                  │   │     Unsupervised ML Model (IF)       │   │
                  │   │   Computes calibrated threat score   │   │
                  │   └──────────────────┬───────────────────┘   │
                  │                      ▼                       │
                  │   ┌──────────────────────────────────────┐   │
                  │   │     Hybrid Action & Policy Engine    │   │
                  │   │   ALLOW  │  MFA (Email OTP)  │  BLOCK    │   │
                  │   └──────────────────┬───────────────────┘   │
                  └──────────────────────┼───────────────────────┘
                                         │ WSS SOC Broadcast
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             SOC CONTROL CENTER               │
                  │    Real-time Threat Hunting Dashboard        │
                  └──────────────────────────────────────────────┘
```

---

## 🌟 Key Features

* **Continuous HCI Biometrics**: Captures micro-behavior patterns, including inter-key delays (keystroke dynamics), mouse velocity tracking (in pixels/second), and browser tab-switching count.
* **Contextual Identity Analysis**: Evaluates OS signatures, screen resolution, geo-location proximity (verifying against a 200km radius trusted baseline), IP addresses, and hour/day temporal variables.
* **Unsupervised Machine Learning**: Utilizes an **Isolation Forest** model trained across 47,804 behavioral profiles. The model adapts to normal human distributions without requiring hardcoded static thresholds.
* **Hybrid Action Policy Engine**:
  * **$\text{Threat Score} \ge 0.75$**: CRITICAL ANOMALY $\rightarrow$ Block session.
  * **$\text{Threat Score} \ge 0.40$**: WARNING $\rightarrow$ Stepped-up MFA challenge (styled HTML OTP email).
  * **$\text{Threat Score} < 0.40$**: SAFE $\rightarrow$ Seamless authentication.
* **Predictable Brute-Force Override**: Implements a rule-based fail-safe where $\ge 4$ incorrect login attempts bypasses ML scoring and triggers immediate MFA. This prevents ML score spikes from blocking legitimate users who simply forgot their passwords.
* **Interactive Threat Simulator**: A mock user selection, IP spoofing, process injection, and biometric velocity manipulator to simulate attacks.
* **SOC Dashboard**: A live command center streaming telemetry metrics, threat events, geography tracking maps, and an administrative **Model Retraining Engine** to train models on live database entries.

---

## 📂 Project Structure

```
anomaly_detection/
├── 📁 AI_model/                      # Offline ML Pipeline & Modeling
│   ├── data_generation.py            # Generates unified 47,804-session dataset
│   ├── log_unified_sessions.csv      # Unified training dataset
│   ├── model_train.py                # Pipeline trainer
│   └── test.py                       # Attack simulation test script
│
├── 📁 web_app/
│   ├── 📁 backend/                   # FastAPI Backend Server
│   │   ├── main.py                   # WebSocket, REST API, & Policy engine
│   │   ├── ml_pipeline.py            # Feature encoders, Calibrated IF inference, Retrainer
│   │   ├── db_manager.py             # SQLite ORM (Users, Sessions, Trusted locations)
│   │   ├── email_template.py         # Styled HTML templates for OTP & alerts
│   │   ├── requirements.txt          # Python dependency list
│   │   ├── anomaly_detection.db      # Persistent database file (auto-generated)
│   │   └── 📁 models/                # Production model binaries (.pkl)
│   │
│   └── 📁 Frontend/                  # Next.js Frontend Portal
│       ├── 📁 app/
│       │   ├── page.tsx              # Zero-Trust Landing Page
│       │   ├── prototype/page.tsx    # Interactive Login Simulator & Attack Injector
│       │   └── dashboard/page.tsx    # Security Operations Center (SOC) Console
│       ├── package.json              # Next.js dependencies
│       └── tsconfig.json             # TypeScript settings
```

---

## 🚀 Getting Started & Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/Yashika-28/anomaly_detection.git
cd anomaly_detection
```

### Step 2: Set Up the Backend
1. Navigate to the backend directory:
   ```bash
   cd web_app/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure Email Credentials (Optional)**:
   In `main.py`, under SMTP configurations, configure your Google App password if you want styled OTP and security alert emails dispatched to your inbox:
   ```python
   SENDER_EMAIL = "neurometric.alert@gmail.com"
   SENDER_PASSWORD = "your-app-password"
   ```
5. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   > [!NOTE]
   > On startup, the backend automatically initializes `anomaly_detection.db` and populates mock security analysts, historical session logs, and trusted workspaces if the DB is empty.

### Step 3: Set Up the Frontend
1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd web_app/Frontend
   ```
2. Install Node.js packages:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   > The user portal will be available at `http://localhost:3000`.

---

## 🧠 Machine Learning: Isolation Forest & Calibrated Scoring

Neurometric Shield utilizes an **unsupervised Isolation Forest** model as its primary classifier. Unlike supervised models that require clean labels of every future threat, Isolation Forest isolates anomalous observations by randomly partitioning features. 

### Feature Vector Composition
The model ingests 13 features from each session:
1. **Categoricals**: `OS` bucket, screen `Resolution` class, mapped `Country` (derived from client IP geo-location).
2. **Temporals**: `Hour of Day`, `Day of Week`.
3. **Biometrics**: `Average Keystroke Delay`, `Mouse Velocity`, `Tab Switch Count`.
4. **Network**: $\log(1 + x)$ scaled `Bytes Sent` and `Bytes Received`.
5. **Security Flags**: `Is Unknown Location` (bool), `Has Hacker Tools` (bool), `Login Attempts` (int).

### Calibrated Threat Score
To transform the raw Isolation Forest output (decision function) into an actionable threat score, the backend:
1. Performs linear min-max mapping: Mapped decision boundaries $min \rightarrow 1.0$ (most anomalous) and $max \rightarrow 0.0$ (normative baseline).
2. Applies a **Sigmoid Sharpening Function**:
   $$S(x) = \frac{1}{1 + e^{-k(x - 0.5)}} \quad \text{where } k=8$$
   This calibration stretches scores near the margins and creates a crisp, clear classification boundary to prevent false positives while securing borderline cases.

---

## 🧪 Simulation & Threat Demonstration Guide

Use the **Simulation Control Panel** on the right side of the **Simulator Portal** (`http://localhost:3000/prototype`) to inject different behaviors:

### Scenario 1: Normal Login (Allowed)
* **Goal**: Simulates a standard human login from a familiar setup.
* **Settings**: 
  * Select target user `akshi` or `priyanshi`.
  * Set **Login Attempts**: `1`.
  * Keystroke delay: `0.18s`, Mouse speed: `450 px/s`.
  * Processes: Normal Chrome/Slack stack.
* **Response**: Threat Score $\approx 0.02$. Status: `✅ SAFE — Human Authenticated`. Session connects immediately.

### Scenario 2: Hacker Attack (Blocked)
* **Goal**: Simulates an automated script logging in from a hacking box.
* **Settings**:
  * Set **IP Spoofing** to an offshore IP.
  * Mapped location to an unfamiliar region.
  * Select **Endpoint Processes**: `Tor Browser, Wireshark, Cmd.exe` or `Hydra, Burp Suite`.
  * Enable **Full Bot Override** (sets mouse velocity to 8,500 px/s and keystroke delay to 0.005s).
  * Data exfiltration size: `60MB`.
* **Response**: Threat Score $\ge 0.80$. Status: `🔴 CRITICAL — Bot Detected`. Connection is blocked.

### Scenario 3: Legitimate Forgot Password (MFA Challenge)
* **Goal**: Verifies that a normal user who inputs their password incorrectly 4 times is only sent an MFA code and not blocked.
* **Settings**:
  * Keep normal human biometrics (delay 0.18s, mouse velocity 450 px/s).
  * Set **Login Attempts** slider to `4`.
* **Response**: Threat Score $\approx 0.11$. Status: `⚠ WARNING — MFA Required`. The system generates a 6-digit OTP code, saves it temporarily, dispatches an OTP email, and opens the verification field.

---

## 📈 Administrative SOC Dashboard

Open the Security Operations Center (SOC) dashboard at `http://localhost:3000/dashboard`:
1. **Live Feed**: Watch telemetry packets stream live from user sessions.
2. **Geo-Location Map**: Visualize the geographical origin of active sessions (colored indicators show threat level).
3. **Model Management**: Click the **Retrain Models** button on the bottom menu. The FastAPI server will load live database session logs, augment data if sparse, fit a new Isolation Forest pipeline, calibrate min/max margins, and deploy it live without downtime.
