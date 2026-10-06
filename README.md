# Student Credibility — AI Interview Accelerator
> **AI Product Engineer Intern Challenge — Assignment 3**  
> Built for [Student Credibility](https://studentcredibility.com) to solve the student candidate preparation problem through personalized AI role intelligence and adaptive multi-level interview simulations.

---

## 🌟 Overview & Problem Solved

A student applying for a job typically has a **Resume** and a **Job Description (JD)**, but faces 6 critical dilemmas:
1. **What the employer is actually looking for** &rarr; *Solved via Step 1: AI Role Extraction (required vs preferred skills, competencies, keywords)*
2. **How well their resume matches the role** &rarr; *Solved via Step 2: Fit Scoring, skill match breakdowns, and missing gaps*
3. **What questions they are likely to face** &rarr; *Solved via Step 3: Personalized 3-Level Interview Generation based directly on resume claims*
4. **How effectively they can answer those questions** &rarr; *Solved via Live Evaluation with STAR framework direction & actionable feedback*
5. **What their preparation gaps are** &rarr; *Solved via Priority 1–3 Preparation Roadmap with specific study checklists*
6. **Whether they are actually ready for the interview** &rarr; *Solved via Objective Interview Readiness Assessment (🔴 / 🟠 / 🟡 / 🟢)*

---

## 🚀 Key Features

### 1. Document Input & File Parsing
- Paste Job Description & Candidate Resume or upload files (`.pdf`, `.docx`, `.txt`).
- Automated text extraction using `pypdf`, `python-docx`, and UTF-8 decoders.
- Quick **Load Sample JD & Resume** button for testing.

### 2. Step 1 — Understand the Role
- AI parses Job Description into:
  - Role Title & Level
  - Key Responsibilities
  - Required Skills vs Preferred Skills
  - Technical Competencies & Behavioural Competencies
  - Experience Expectations
  - Important Keywords & Concepts
  - Key Qualifications

### 3. Step 2 — Understand the Candidate & Job Fit
- Evaluates candidate's background against the target role:
  - Candidate Key Skills
  - Relevant Experience, Projects, and Achievements
  - Strengths Against JD
  - Missing / Weak Skills
  - Potential Resume Claims to Probe in Interview
  - **Job Fit Score** with categorised matches:
    - **Strong Match**
    - **Partial Match**
    - **Missing / Weak**

### 4. Step 3 — Adaptive Multi-Level AI Interview Simulator
- **Level 1 — Screening Interview**: Resume verification, project overview, motivation, and role alignment.
- **Level 2 — Competency Interview**: In-depth technical problem solving, architectural decisions, and trade-offs.
- **Level 3 — Deep-Dive Interview**: Challenging real-world interviewer probing resume claims, asking "why" and "how", introducing realistic edge cases, and adapting to previous answers.
- **Dynamic Follow-up & Counter-Questions**: Reacts dynamically to weak, vague, or ambitious claims rather than following a static questionnaire.

### 5. Mandatory Voice AI Interview
- **Text-to-Speech (TTS)**: Web Speech Synthesis speaks interviewer questions aloud with playback controls.
- **Speech-to-Text (STT)**: Web Speech Recognition transcribes candidate answers in real time with visual audio waveform.

### 6. Video Interview Experience (Bonus / Highly Preferred)
- Live candidate webcam stream (`getUserMedia`) alongside the AI Interviewer virtual avatar.
- Toggle Camera (On/Off) and Microphone (Mute/Unmute).
- **Real-Time Communication Signals HUD**:
  - **Response Duration**: Live timer for each answer.
  - **Speaking Pace**: Real-time Words Per Minute (WPM) calculation with pacing indicators (Optimal: 120–160 WPM).
  - **Filler Word Detection**: Live counter detecting hesitation markers (*um*, *uh*, *like*, *you know*, *basically*, *actually*).
  - **Delivery Confidence**: Dynamic rating based on flow, vocabulary, and hesitation rate.

### 7. Step 4 — Interview Performance Report & Readiness Assessment
- **Overall Score**: Comprehensive weighted score (0–100).
- **Competency Scores Breakdown**:
  - Role Fit
  - Technical Knowledge
  - Problem Solving
  - Communication
  - Confidence
  - Depth of Understanding
  - Behavioural Fit
- **Communication & Behavioral Delivery Signals Summary**: Average WPM, total filler words, delivery confidence, and STAR method alignment.
- **Question-Level Actionable Feedback**:
  - Question Asked
  - Candidate Answer
  - Evaluation Assessment
  - What Was Good
  - What Could Be Better
  - Ideal STAR Direction
- **Interview Readiness Scale**:
  - 🔴 **Not Ready**: Significant preparation required.
  - 🟠 **Needs Preparation**: Important gaps remain.
  - 🟡 **Interview Ready**: Candidate can reasonably attempt the interview.
  - 🟢 **Strong Candidate**: Candidate demonstrates strong readiness.
- **Prioritized Preparation Roadmap**: Priority 1–3 focus areas with review checklists.
- **Print / Export PDF** and **Share Report** functionality.

---

## 🛠️ Architecture & Tech Stack

```
interview-accelerator/
├── backend/
│   ├── main.py              # FastAPI server (CORS, file uploads, REST endpoints)
│   ├── cohere_service.py    # LLM reasoning, NLP heuristics, adaptive logic & scoring
│   ├── doc_parser.py        # PDF & DOCX document parser
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.tsx          # React application (Dashboard, Analysis, Room, Report, Plan, History)
    │   ├── api.ts           # Type-safe API client with auto-fallback connection
    │   ├── index.css        # Vanilla CSS design system, Video HUD & Print stylesheets
    │   └── main.tsx         # Entry point
    ├── vite.config.ts       # Vite configuration with backend proxy
    └── package.json         # Dependencies & scripts
```

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS with custom modern design system.
- **Backend**: FastAPI, Uvicorn, Pydantic, Python 3.
- **AI & Evaluation**: Cohere Command R+ with robust NLP fallback heuristics.
- **Speech & Media**: Web Speech Recognition (STT), SpeechSynthesis (TTS), WebRTC `getUserMedia` for video stream.

---

## ⚙️ Running Locally

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will run on `http://127.0.0.1:8000`.  
API documentation is accessible at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start on `http://localhost:8443` (or the assigned Vite port).  
All `/api/*` calls are automatically proxied to `http://127.0.0.1:8000`.

---

## 🧠 AI & Evaluation Methodology

1. **Role Analysis**: Extracts core competencies, required technologies, and experience expectations from raw JD text.
2. **Candidate Gap Analysis**: Compares candidate resume entities against role requirements, computing an objective match ratio and identifying probing targets.
3. **Adaptive Question Generation**: Uses candidate resume projects, target level (1, 2, or 3), and previous interview turn context to formulate personalized, non-generic questions.
4. **Answer Evaluation**: Scores answers on technical precision, STAR methodology structure, and quantifiable metrics, generating actionable improvement suggestions.
5. **Speech & Communication Signals**: Computes real-time Words Per Minute (WPM), hesitation patterns, and filler-word density to evaluate communication clarity.
