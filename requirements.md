# 📦 VeriLearn AI — Dependency Directory, Folder Structure & Setup Guide

This document contains a complete list of dependencies, the structured workspace map, a setup and run guide, and the step-by-step resolution for testing **Mobile Screen Sharing** over local Wi-Fi.

---

## 📂 1. Clean Folder Structure Visualization

```markdown
umt-hackathon-app/
├── backend/                        # Node.js + Express Backend Server
│   ├── db/
│   │   └── schema.sql              # SQLite database schema
│   ├── mock-data/                  # Mocked assignments & results
│   ├── trained_model.js            # Key concepts, Socratic models & grading
│   ├── server.js                   # REST Endpoints & WebSocket Server
│   ├── package.json                # Backend requirements & scripts
│   └── .env                        # Port & API keys configuration
│
├── frontend-react/                 # Responsive React Web Client (Vite)
│   ├── src/
│   │   ├── components/             # Reusable UI widgets & Navbar
│   │   ├── context/                # ThemeContext & LanguageContext
│   │   ├── screens/
│   │   │   ├── LoginScreen.jsx     # Premium credentials screen
│   │   │   ├── StudentDashboard.jsx# Student active coursework & grades
│   │   │   ├── TeacherDashboard.jsx# Live monitor, telemetry & map portal
│   │   │   ├── VivaSession.jsx     # Ticking 90s exam room with speech input
│   │   │   └── ScreenShare.jsx     # WebRTC video-audio peer stream
│   │   ├── App.jsx                 # Routing configuration
│   │   ├── index.css               # Premium CSS glassmorphism system
│   │   └── main.jsx                # Render entrypoint
│   ├── package.json                # Web frontend dependencies
│   └── vite.config.js              # Vite server, HTTPS, & QR code configs
│
├── frontend-mobile/                # Native Mobile Expo Project (React Native)
│   ├── App.js                      # Dual portal flow, strict exam & Socratic viva
│   ├── app.json                    # Expo bundle identifiers & settings
│   ├── package.json                # Expo Go package definitions
│   └── README.md                   # Mobile start instructions
│
└── README.md                       # Main presentation readme
```

---

## 🛠️ 2. Dependencies & Package Requirements

### A. Backend Dependencies (`backend/package.json`)
* **`express`** (`^4.21.2`): Standard Node routing engine.
* **`cors`** (`^2.8.5`): Enforces secure cross-origin queries between ports `5173` and `3001`.
* **`dotenv`** (`^16.4.7`): Inject environment keys seamlessly.
* **`ws`** (`^8.18.0`): Handles real-time active exam monitoring and stream events.
* **`sqlite3`** (`^5.1.7`): SQLite database engine.
* **`@google/generative-ai`** (`^0.22.0`): Primary AI API wrapper for Socratic question parsing.

### B. Frontend React Dependencies (`frontend-react/package.json`)
* **`react`** (`^19.2.6`) & **`react-dom`** (`^19.2.6`): High performance frontend.
* **`react-router-dom`** (`^7.15.1`): Fluid dual-portal routers.
* **`socket.io-client`** (`^4.8.3`): Handles signaling handshakes.
* **`@vitejs/plugin-basic-ssl`** (`^1.2.0`): Generates automatic self-signed local SSL certificates.
* **`vite-plugin-qrcode`** (`^0.4.1`): Generates beautiful console QR codes for mobile scanning.

### C. Mobile Expo Dependencies (`frontend-mobile/package.json`)
* **`expo`** (`~51.0.0`): Mobile packaging ecosystem.
* **`react-native`** (`0.74.5`): Native widgets renderer.
* **`expo-status-bar`** (`~1.12.1`): Matches mobile navigation bars.

---

## 🚀 3. Installation & Run Guide

### Step 1: Run the Backend Database Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the modules:
   ```bash
   npm install
   ```
3. Run in terminal:
   ```bash
   node server.js
   ```

### Step 2: Run the Frontend Web Client (HTTPS Mode)
1. Navigate to the frontend directory:
   ```bash
   cd frontend-react
   ```
2. Install with legacy dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🔒 4. How We Unlocked Mobile Screen Sharing (HTTPS Solution)

### 🚨 The Problem
Modern mobile browsers (iOS Safari, Android Chrome) block screen sharing (`navigator.mediaDevices.getDisplayMedia`) on standard IP addresses (e.g. `http://192.168.1.10:5173`) because they classify unsecured HTTP connections as **Insecure Contexts**.

### 🌟 The Complete Solution
We have installed and configured `@vitejs/plugin-basic-ssl` in **Vite**. Now, Vite hosts the application over a local **HTTPS secure connection**:
1. Run `npm run dev` in your terminal.
2. A secure network URL will be generated: `https://<YOUR-IP>:5173/`.
3. Scan the **QR Code** directly from the terminal or the chat window.
4. Your mobile browser will prompt: **"Your connection is not private / warning."**
5. **Simply click "Advanced" and select "Proceed / Continue to site"** (this is completely safe for local development).
6. **BOOM!** The browser accepts the secure HTTPS connection, and **Screen Sharing and Microphone access will work flawlessly on your real mobile phone!**
