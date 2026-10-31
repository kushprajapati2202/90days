# 90-Day Fat-Loss + Strength Workout Application ⚡

A modern, full-stack fitness application engineered to turn the 90-day transformation plan into an interactive gym tracker. All workout days, exercises, user profile, coaching principles, and weight tracking are stored in **MongoDB Atlas**.

---

## 🚀 Key Features

- **MongoDB Atlas Integration**: All 90 days, profile metrics, workout exercises, coaching notes, and weight history are persisted in real time.
- **90-Day Transformation Roadmap**:
  - **Phase 1: Foundation (Weeks 1–4, Days 1–28)**: Base mechanics, safe cardio habit, recovery rhythm. (Deload Week 4).
  - **Phase 2: Progress (Weeks 5–9, Days 29–60)**: Progressive overload, 8k–9k steps, metabolic conditioning. (Deload Week 8).
  - **Phase 3: Consolidate (Weeks 10–13, Days 61–90)**: Peak strength and conditioning, 8k–10k steps. (Deload Week 12).
- **Interactive Workout Day View & Set Logger**:
  - Prescribed strength exercises with set × rep ranges (e.g. Bench press 3×8–10, Squats, Romanian Deadlifts, Lat Pulldowns).
  - Interactive table to log weight (kg) and reps set-by-set with completion checkboxes.
  - Mandatory warm-up mobility routine and cool-down walk checklist.
  - Bodyweight / conditioning and cardio protocol guidance.
- **Built-in Gym Rest Interval Timer**:
  - 30s, 60s, 90s, 120s rest interval presets with audio alert and visual countdown.
  - Floating, minimizable timer widget accessible during workouts.
- **Weight Loss Trajectory Tracker & Analytics**:
  - Visual chart comparing actual logged bodyweight against the ideal linear path from **92.5 kg down to 82.0 kg** (-10.5 kg target).
  - Interactive quick weigh-in logger.
- **Complete 64-Exercise Library (`/exercises.html`)**:
  - Unified directory of all 64 gym movements: Chest, Shoulders, Back, Arms, Legs & Glutes, Core & Conditioning, Dynamic Warm-Up Drills, Cardio Protocols, and Post-Workout Cool-Down Stretches.
  - Side-by-side Start & Peak Contraction demonstration photos for every movement.
  - Live real-time search and filter tabs by muscle group and equipment.
  - One-click access to certified YouTube HD video tutorials and posture execution cues.
- **8 Important Coaching Rules**:
  - Accessible modal containing all guidance: fatigue prevention, progressive overload increments, RPE reserves (RPE 7–8 strength, RPE 5–7 cardio), knee/joint modifications, hydration, and nutrition timing for 8–10 PM workouts.
- **Fast Filter & Search**:
  - Search by exercise name or cardio type.
  - Filter by Phase, Week (1–13), Deload days, Recovery days, or Completion status.
- **One-Click Data Backup & Export**:
  - Export all MongoDB Atlas plan data as JSON.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, PyMongo, Pydantic, Python-dotenv
- **Database**: MongoDB Atlas (`workout90_db` cluster)
- **Frontend**: Responsive Single-Page Application (HTML5, TailwindCSS, Lucide Icons, Chart.js, Vanilla ES6 JS)

---

## 🏃 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment (`.env`)
The database connection string is already configured in `.env`:
```env
MONGODB_URI=mongodb+srv://kushprajapati2202_db_user:VnImiBqq9umjV6Vasd@cluster0.wcna3yz.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=workout90_db
PORT=8000
HOST=0.0.0.0
```

### 3. Run the Application
```bash
python run.py
```
Open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check MongoDB Atlas connectivity & document counts |
| `GET` | `/api/profile` | Retrieve athlete profile and targets |
| `PUT` | `/api/profile` | Update athlete metrics |
| `GET` | `/api/coaching-notes` | Retrieve 8 coaching guidelines |
| `GET` | `/api/days` | Get workout days (supports `week`, `phase`, `completed`, `is_deload`, `search`) |
| `GET` | `/api/days/{day_number}` | Get full details for a single day |
| `PATCH` | `/api/days/{day_number}` | Update workout day (log weights, reps, steps, notes, status) |
| `POST` | `/api/days/{day_number}/toggle` | Quick toggle completion status |
| `GET` | `/api/stats` | Overall completion %, streaks, phase breakdowns, weight progress |
| `GET` | `/api/weight-history` | Weight logs & ideal trajectory curve |
| `POST` | `/api/weight-log` | Log a weight entry directly |
| `GET` | `/api/export` | Download full database backup as JSON |

