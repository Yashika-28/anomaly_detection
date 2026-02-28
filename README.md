<div align="center">

# 🛡️ Neurometric Shield

### _Beyond Passwords. True Zero-Trust Security._

An enterprise-grade **User & Entity Behavior Analytics (UEBA)** platform powered by unsupervised machine learning. We don't just verify logins — we continuously monitor _how_ you behave post-authentication.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-neurometric--shield.vercel.app-0ea5e9?style=for-the-badge&logoColor=white)](https://neurometric-shield.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-Keras-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](https://github.com/Yashika-28/anomaly_detection/pulls)
[![WebSocket](https://img.shields.io/badge/Real--Time-WebSocket-8B5CF6?style=flat-square&logo=socketdotio&logoColor=white)]()
[![Framer Motion](https://img.shields.io/badge/Animations-Framer_Motion-FF0055?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)

---

</div>

## 🎯 Overview

**Neurometric Shield** is a full-stack cybersecurity platform that deploys an ensemble of **three unsupervised ML models** to continuously evaluate user behavior in real-time. Unlike traditional authentication systems that only check credentials at login, our system captures keystroke dynamics, mouse movement velocity, network telemetry, and device fingerprints — streaming everything over WebSockets to a live SOC (Security Operations Center) dashboard.

> 🧠 **Core Philosophy**: Authentication isn't a single event. We are watching _everything_.

---

## ✨ Key Features

| Feature | Description |
|:---|:---|
| 🔐 **Continuous UEBA** | Post-login behavioral monitoring using biometric and network telemetry |
| 🤖 **AI Ensemble** | Three specialized unsupervised ML models working in harmony |
| ⚡ **Real-Time Streaming** | WebSocket-based live data pipeline from client → backend → SOC |
| 🖥️ **SOC Dashboard** | Security Operations Center with live threat hunting and session monitoring |
| 🎮 **Attack Simulator** | Interactive prototype to inject anomalous login parameters and test AI detection |
| 🌗 **Dark / Light Mode** | Fully themed UI with smooth transitions |
| 🎨 **Premium UI** | Neural network particle backgrounds, animated code streams, and glassmorphism design |
| 📍 **Geolocation Tracking** | Location-based anomaly detection (impossible travel) |
| 🔒 **reCAPTCHA Integration** | Anti-bot verification at authentication layer |

---

## 🧠 The AI Ensemble

Our three-model architecture covers **Contextual Identity**, **HCI Biometrics**, and **Endpoint Telemetry** — leaving no blind spots.

<table>
<tr>
<td align="center" width="33%">

### 🔵 One-Class SVM
**Contextual Identity**

Establishes strict boundaries of normative login behavior (IP, OS, Geolocation) and flags outliers. Prevents impossible travel and device spoofing attacks.

`login_ocsvm_pipeline.pkl`

</td>
<td align="center" width="33%">

### 🟣 Deep Autoencoder
**HCI Biometrics**

Compresses keystroke dynamics and mouse velocity into a latent space. Flags hijacked sessions when reconstruction error spikes above threshold.

`behavior_deep_ae.h5`

</td>
<td align="center" width="33%">

### 🟢 Gaussian Mixture Model
**Endpoint Telemetry**

Maps probability distributions of network packets to detect insider threats deviating from typical usage clusters.

`network_gmm_pipeline.pkl`

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                          │
│  Captures: Keystrokes, Mouse Velocity, Tab Switches, Device OS   │
└──────────────┬──────────────────────────────────────┬────────────┘
               │  WSS (Live Telemetry Stream)         │  HTTPS POST
               ▼                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                    │
│                                                                  │
│   ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│   │  One-Class   │  │      Deep        │  │     Gaussian     │   │
│   │    SVM       │  │   Autoencoder    │  │   Mixture Model  │   │
│   └──────┬───────┘  └───────┬──────────┘  └───────┬──────────┘   │
│          └──────────────────┼──────────────────────┘              │
│                             ▼                                    │
│                    ┌─────────────────┐                            │
│                    │  Action Engine  │                            │
│                    │ ALLOW │ MFA │ BLOCK                          │
│                    └────────┬────────┘                            │
└─────────────────────────────┼────────────────────────────────────┘
                              │  WSS (Broadcast)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SOC DASHBOARD (Next.js)                       │
│              Live Threat Hunting & Session Monitoring             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
anomaly_detection/
├── 📁 AI_model/                    # Machine Learning Pipeline
│   ├── data_generation.py          # Synthetic dataset generator (500 users)
│   ├── model_train.py              # Model training scripts
│   ├── train_test3.py              # Ensemble training & evaluation
│   ├── train_test4.py              # Advanced training pipeline
│   ├── 📁 models/                  # Trained model artifacts
│   │   ├── login_ocsvm_pipeline.pkl
│   │   ├── behavior_deep_ae.h5
│   │   ├── behavior_deep_scaler.pkl
│   │   ├── behavior_deep_threshold.pkl
│   │   ├── network_gmm_pipeline.pkl
│   │   └── network_gmm_threshold.pkl
│   ├── log_login_500users.csv      # Login telemetry dataset
│   ├── log_behavior_500users.csv   # Behavioral biometrics dataset
│   └── log_network_500users.csv    # Network traffic dataset
│
├── 📁 web_app/
│   ├── 📁 backend/
│   │   └── main.py                 # FastAPI server + WebSocket handlers
│   └── 📁 Frontend/               # Next.js 16 Application
│       ├── 📁 app/
│       │   ├── page.tsx            # Landing page (hero, pipeline, team)
│       │   ├── prototype/page.tsx  # Attack simulator portal
│       │   └── dashboard/page.tsx  # SOC dashboard
│       ├── package.json
│       └── tsconfig.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![npm](https://img.shields.io/badge/npm-9+-CB3837?style=flat-square&logo=npm&logoColor=white)

### 1. Clone the Repository

```bash
git clone https://github.com/Yashika-28/anomaly_detection.git
cd anomaly_detection
```

### 2. Start the Backend

```bash
cd web_app/backend
pip install fastapi uvicorn websockets pydantic
python main.py
```

> The API server will start on `http://localhost:8000`

### 3. Start the Frontend

```bash
cd web_app/Frontend
npm install
npm run dev
```

> The frontend will be available at `http://localhost:3000`

### 4. Train Models _(Optional)_

```bash
cd AI_model
pip install -r requirements.txt
python model_train.py
```

---

## 🖥️ Pages & Features

<details>
<summary><b>🏠 Landing Page</b></summary>

- Interactive neural network particle canvas background
- Animated code stream overlays
- AI Ensemble accordion with live SVG model visualizations (OCSVM decision boundary, Autoencoder network, GMM density curves)  
- Animated data pipeline with flowing light effect
- Interactive hacker face with eye-tracking
- Team section with avatars
- Full light/dark theme toggle

</details>

<details>
<summary><b>🎮 Prototype Simulator</b></summary>

- Select mock user profiles with different behavioral baselines
- Inject custom parameters: IP address, OS, geolocation, keystroke speed, mouse velocity
- reCAPTCHA verification step
- Real-time AI evaluation with risk scoring
- Results streamed live to SOC Dashboard via WebSocket

</details>

<details>
<summary><b>📊 SOC Dashboard</b></summary>

- Live WebSocket feed of all login attempts and sessions
- Real-time threat status indicators (Safe / Monitoring / Anomaly)
- Session telemetry details: keystrokes, mouse velocity, network bytes, protocol
- Login attempt counters and timestamps
- Filterable event log

</details>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Backend** | FastAPI, Uvicorn, Python |
| **Real-Time** | WebSocket (WSS) |
| **ML Models** | scikit-learn (OCSVM, GMM), TensorFlow/Keras (Autoencoder) |
| **Data** | Pandas, NumPy, SciPy |
| **Auth** | Google reCAPTCHA v2 |
| **Deployment** | Vercel |

</div>

---

## 🔄 Data Pipeline

```
 📱 Client Browser          🔌 WebSocket           🧪 AI Models            🛡️ SOC
 ┌─────────────┐     WSS    ┌────────────┐  ML     ┌────────────┐  WSS    ┌────────────┐
 │  Keystroke   │───────────▶│  FastAPI    │────────▶│  Ensemble  │────────▶│  Dashboard │
 │  Mouse       │            │  Server    │         │  OCSVM     │         │  Live Feed │
 │  Network     │            │            │         │  AE        │         │  Alerts    │
 │  Device      │            │  Port:8000 │         │  GMM       │         │  Graphs    │
 └─────────────┘             └────────────┘         └────────────┘         └────────────┘
```

---

## 👥 Team

| Name | Role |
|:---|:---|
| **Akshi Malik** | Lead ML Engineer |
| **Anamika Chahal** | Frontend Architect |
| **Priyanshi** | Security Analyst |
| **Archit** | Backend Developer |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with 🧠 AI & ❤️ by the Neurometric Shield Team**

[![GitHub](https://img.shields.io/badge/GitHub-Yashika--28-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Yashika-28/anomaly_detection)
[![Live](https://img.shields.io/badge/🌐_Visit-neurometric--shield.vercel.app-0ea5e9?style=for-the-badge)](https://neurometric-shield.vercel.app/)

</div>