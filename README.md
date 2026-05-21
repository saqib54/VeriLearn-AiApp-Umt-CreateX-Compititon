# 🛡️ VeriLearn AI — Academic Authenticity & Plagiarism Guard

> **Full-Stack AI-Powered Socratic Viva & Real-time Proctoring Platform**
> Developed for **UMT Hackathon**.

---

### 🌐 Live Cloud Production Links
* **🖥️ Live Web App URL:** [https://verilearn-frontend-388366922818.us-central1.run.app](https://verilearn-frontend-388366922818.us-central1.run.app)
* **🛡️ Live Backend API URL:** [https://verilearn-backend-388366922818.us-central1.run.app](https://verilearn-backend-388366922818.us-central1.run.app)

---

VeriLearn AI is a next-generation academic evaluation platform designed to eliminate AI cheating, copy-pasting, and rote-memorization (ratta). Instead of standard static quizzes or multiple-choice questions, VeriLearn uses Claude AI and dynamic Socratic questioning to evaluate a student's actual conceptual understanding of their submitted assignment in real-time.

---

## 🚀 Key Features

### 1. 🛡️ AI-Powered Authenticity Verification (اصلیت کی پہچان)
The platform doesn't just check for standard keyword matches. It analyzes semantic depth, vocabulary choice, and logic structures to verify if the student wrote the assignment themselves or copied it from AI/Internet tools.

### 2. 🧠 Dynamic Viva Questioning Engine
Our AI generates **5 customized conceptual questions** based on the specific content of the uploaded assignment. These questions focus on "Why" and "How" concepts rather than direct textbook definitions.
* **Code-Level Probing**: For programming submissions, the AI targets specific logic blocks, loops, or recursion handlers.
* **Logic Branching**: The engine dynamically adjusts question difficulty based on prior answers (Deep Probes for correct answers, Foundational questions for incorrect ones).

### 3. ⏱️ Strict Exam proctoring (Timer & Limits)
* **90-Second Countdown**: Each question has a strict 90-second countdown. If the timer expires, the answer is submitted automatically to prevent external lookups.
* **Length Validation**: Submissions require a minimum of **30 characters** to ensure deep, structured answers.
* **Tab-Switch Auditing**: The proctor logs unauthorized tab changes and generates integrity penalties.

### 4. 📊 Real-time Evaluation & Feedback Overlays
After every answer submission, the student receives an instant micro-evaluation overlay detailing:
* **Score (Out of 10)**
* **Correct Points** (What was explained perfectly)
* **Missed Points** (What core concepts were left out)

### 5. 🇵🇰 Bilingual Support (Urdu RTL & English)
The entire user interface translates with one click into beautiful RTL Urdu formatting, leveraging customized Noto Nastaliq typography.

### 6. 📍 Interactive Geolocation Maps
At exam initiation, the system records the student's real-time GPS coordinates. The teacher dashboard features an interactive **Dark Mode OpenStreetMap widget** mapping the student's exact physical exam location.

---

## 🛠️ System Architecture

* **Frontend**: React.js (Vite), fully responsive custom Vanilla CSS glassmorphic variables, socket-driven screen broadcasting.
* **Backend**: Node.js (Express), persistent coursework & reports database routes, socket channel handlers.
* **AI Engine**: Gemini-powered key extraction, question generator, and Socratic evaluation models.

---

## 💻 Installation & Setup

### 1. Backend Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Set up your `.env` configuration file:
   ```env
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Launch the persistent server:
   ```bash
   node server.js
   ```

### 2. Frontend React Client Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```

---

## 📱 How to Run and Present on Your Mobile Phone (Expo-Style QR Scanning)

To showcase this beautiful, fully responsive app on a real mobile device, we have integrated a **terminal QR code generator** just like **Expo Go**!

### 🇬🇧 English Guide
1. **Connect to Same Wi-Fi**: Ensure both your laptop and mobile phone are connected to the **same Wi-Fi router**.
2. **Launch the Frontend**:
   * Inside `frontend-react` folder, run:
     ```bash
     npm run dev
     ```
   * **The Magic Happens**: A beautiful, scan-ready **QR Code** will print directly inside your terminal/VS Code console!
3. **Scan and Open**:
   * Open the default **Camera** app on your iPhone or Android.
   * Point the camera at the terminal QR code.
   * Tap the pop-up link that appears.
   * **Boom!** VeriLearn AI will load instantly on your phone with high-performance mobile layouts active!
   * The client dynamically connects to the backend server at `http://<YOUR-IP>:3001`!

---

### 🇵🇰 اردو گائیڈ (ایکسپو اسٹائل کیو آر اسکیننگ)

1. **ایک ہی وائی فائی (Wi-Fi) سے منسلک کریں**: یقینی بنائیں کہ آپ کا لیپ ٹاپ اور آپ کا موبائل فون **ایک ہی وائی فائی** نیٹ ورک سے جڑے ہوئے ہیں۔
2. **فرنٹ اینڈ سرور چلائیں**:
   * `frontend-react` فولڈر میں جا کر یہ کمانڈ چلائیں:
     ```bash
     npm run dev
     ```
   * **جادو دیکھیں**: آپ کے ٹرمینل یا وی ایس کوڈ (VS Code) کنسول میں ایک خوبصورت، اسکین کے لیے تیار **کیو آر (QR) کوڈ** خود بخود پرنٹ ہو جائے گا!
3. **اسکین کریں اور کھولیں**:
   * اپنے موبائل فون کا **کیمرہ** کھولیں اور ٹرمینل میں موجود کیو آر کوڈ کے سامنے لائیں۔
   * کیمرے پر ظاہر ہونے والے پاپ اپ لنک پر کلک کریں۔
   * **مبارک ہو!** ویری لرن (VeriLearn) موبائل فرنٹ اینڈ بغیر کسی تاخیر کے فوری طور پر آپ کی موبائل اسکرین پر لوڈ ہو جائے گا!

