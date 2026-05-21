# 📱 VeriLearn AI — Expo Mobile Application

This is the fully native mobile application port for **VeriLearn AI**, built using **Expo** and **React Native**! It matches the full functionality of the web app, allowing you to run and present the Socratic Viva proctoring system directly inside the **Expo Go** app on your real phone!

---

## 🚀 Mobile Features

1. **Dual Portal Layout**: Select between Student (🎓) and Teacher (👩‍🏫) roles.
2. **Dynamic Coursework Integration**: Syncs coursework and published assignment questions live with the Node.js backend.
3. **Strict Viva Proctoring Engine**: Implements the 90-second exam countdown timer, character length limits, and instant AI micro-evaluation overlays.
4. **Bilingual RTL Support**: Fully translated into English and beautiful Urdu RTL.
5. **Interactive IP Address Binding**: A dedicated IP address text box on the login screen lets you easily enter your computer's IP address so your phone can sync with the backend database instantly over Wi-Fi!

---

## 🛠️ How to Run on Your Mobile Phone

Follow these simple steps to load the app on your real phone:

### 🇬🇧 English Guide
1. **Connect to Same Wi-Fi**: Ensure your PC and mobile phone are connected to the **same Wi-Fi router**.
2. **Find Your PC's IP Address**:
   * Open **Command Prompt** (cmd) on Windows.
   * Type `ipconfig` and press Enter.
   * Locate the **IPv4 Address** under your active Wi-Fi adapter (e.g., `192.168.1.10`).
3. **Start the Mobile Server**:
   * Navigate to this directory in your terminal:
     ```bash
     cd frontend-mobile
     ```
   * Install the dependencies (ensure you have cleared some disk space first!):
     ```bash
     npm install --legacy-peer-deps
     ```
   * Launch Expo:
     ```bash
     npx expo start
     ```
4. **Scan and Load**:
   * Expo will display a large **QR Code** in your terminal.
   * Open the **Expo Go** app on your phone (download it from the App Store or Google Play Store).
   * **Scan the QR Code** from the terminal using Expo Go (or your phone's default camera app).
   * Enter your laptop's IP address (e.g. `192.168.1.10`) on the Login screen of the app, and you are ready to present!

---

### 🇵🇰 اردو گائیڈ (موبائل پر چلانے کا طریقہ)

1. **ایک ہی وائی فائی (Wi-Fi) سے منسلک کریں**: یقینی بنائیں کہ آپ کا کمپیوٹر اور موبائل فون **ایک ہی وائی فائی** نیٹ ورک سے جڑے ہوئے ہیں۔
2. **اپنے کمپیوٹر کا آئی پی (IP) معلوم کریں**:
   * اپنے کمپیوٹر پر **Command Prompt** کھولیں اور `ipconfig` ٹائپ کر کے انٹر دبائیں۔
   * اپنا **IPv4 Address** معلوم کریں (جیسے: `192.168.1.10`)۔
3. **موبائل سرور شروع کریں**:
   * اپنے ٹرمینل میں اس فولڈر میں جائیں:
     ```bash
     cd frontend-mobile
     ```
   * پیکیجز انسٹال کریں (پہلے کمپیوٹر کی ڈسک اسپیس خالی کرنا یقینی بنائیں!):
     ```bash
     npm install --legacy-peer-deps
     ```
   * ایکسپو (Expo) سرور شروع کریں:
     ```bash
     npx expo start
     ```
4. **اسکین اور لوڈ کریں**:
   * ایکسپو آپ کے ٹرمینل میں ایک بڑا **کیو آر (QR) کوڈ** ظاہر کرے گا۔
   * اپنے موبائل پر **Expo Go** نامی ایپ ڈاؤن لوڈ کر کے کھولیں۔
   * ایکسپو گو (Expo Go) یا موبائل کے عام کیمرے کے ذریعے ٹرمینل میں موجود کیو آر کوڈ اسکین کریں۔
   * موبائل لاگ ان اسکرین پر اپنے کمپیوٹر کا آئی پی ایڈریس درج کریں اور آپ کا ایپ کام کرنے کے لیے تیار ہے!
