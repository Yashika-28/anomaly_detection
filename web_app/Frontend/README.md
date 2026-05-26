# 🖥️ Neurometric Shield: Frontend Client Portals

This directory contains the Next.js 16 (React 19 & TypeScript 5) web application for **Neurometric Shield**. It hosts the user landing pages, administrative SOC dashboards, and the interactive threat simulator.

> [!TIP]
> For the complete system architecture, ML Isolation Forest math, database layout, and full testing scenarios, please refer to the primary [Root README.md](../../README.md).

---

## 📂 Frontend App Router Structure

```
Frontend/
├── 📁 app/
│   ├── page.tsx            # Zero-Trust Landing Page (visual intro & core concepts)
│   ├── 📁 prototype/
│   │   └── page.tsx        # Interactive Login Portal & Attack Simulator
│   ├── 📁 dashboard/
│   │   └── page.tsx        # SOC Threat Hunting Console & live maps
│   ├── 📁 api/
│   │   └── 📁 db/
│   │       └── route.ts    # REST proxy router to FastAPI backend service
│   └── layout.tsx          # Global providers (theme and framing animation layouts)
```

---

## ⚙️ How it Works & Telemetry Flow

The frontend performs two core jobs:

1. **Client-Side Telemetry Collection**:
   * Uses browser event listeners to track biometric hardware interactions: keystroke latency profiles, mouse speed vectors, and window tab-switching limits.
   * Collects hardware/system variables: screen resolution classes and platform OS flags.
   * Resolves client IP geo-location attributes asynchronously.

2. **WebSocket & REST Telemetry Streaming**:
   * Pipes live typing and navigation events to the backend WebSocket stream (`ws://localhost:8000/ws/tracking`).
   * REST calls are proxied through `/api/db` to `http://localhost:8000/api/db` to query and mutate database records securely.

---

## 🚀 Running the Frontend locally

1. Ensure the backend FastAPI server is running on `http://localhost:8000`.
2. Install the node packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the web portals:
   * **Landing Page**: `http://localhost:3000`
   * **Simulation Portal**: `http://localhost:3000/prototype`
   * **SOC Control Center**: `http://localhost:3000/dashboard`

> [!NOTE]
> **Mock Email Banners**: When logging in or resetting passwords with mock email domains, the frontend will automatically display custom warning banners directing you to find the verification codes in the backend terminal logs.
