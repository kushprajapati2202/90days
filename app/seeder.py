import os
import csv
import re
from datetime import datetime, timezone
import logging
from app.database import get_db, init_indexes
from app.exercise_media import get_exercise_media

logger = logging.getLogger("workout_app")

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "workout_plan.csv")

STRETCH_ROUTINES = {
    "push_a": {
        "warmup": [
            {"name": "Easy Treadmill / Incline Walk", "reps_or_time": "3–5 min", "focus": "Core temperature & heart rate elevation", "completed": False},
            {"name": "Horizontal & Overhead Arm Swings", "reps_or_time": "2×15 reps", "focus": "Chest & anterior shoulder dynamic mobility", "completed": False},
            {"name": "Scapular Push-ups / Wall Slides", "reps_or_time": "2×12 reps", "focus": "Serratus anterior & rotator cuff activation", "completed": False},
            {"name": "Band Pull-Aparts / Light Rotations", "reps_or_time": "2×15 reps", "focus": "Rear deltoid & rotator cuff warmup", "completed": False},
            {"name": "Wrist Mobility & Circle Stretches", "reps_or_time": "30 sec", "focus": "Wrist extension for bench & DB press support", "completed": False}
        ],
        "cooldown": [
            {"name": "Slow Cool-Down Walk & Diaphragm Breathing", "reps_or_time": "3 min", "focus": "Heart rate recovery & CNS downregulation", "completed": False},
            {"name": "Doorway Pectoral & Front Delt Stretch", "reps_or_time": "2×30 sec each side", "focus": "Pec major, pec minor & anterior deltoid", "completed": False},
            {"name": "Overhead Triceps & Lat Stretch", "reps_or_time": "2×30 sec each arm", "focus": "Triceps long head & lats elongation", "completed": False},
            {"name": "Cross-Body Shoulder Stretch", "reps_or_time": "2×30 sec each arm", "focus": "Posterior deltoid & upper back release", "completed": False},
            {"name": "Child's Pose with Floor Arm Reach", "reps_or_time": "45–60 sec", "focus": "Spine decompression & chest release", "completed": False}
        ]
    },
    "pull_a": {
        "warmup": [
            {"name": "Cross Trainer / Rower Easy Pace", "reps_or_time": "3–5 min", "focus": "Back & full body blood flow", "completed": False},
            {"name": "Cat-Cow Spinal Flexion & Extension", "reps_or_time": "10 slow cycles", "focus": "Spinal fluid circulation & erector mobility", "completed": False},
            {"name": "Thoracic Rotations (Thread the Needle)", "reps_or_time": "8 reps each side", "focus": "Thoracic spine rotation & rib mobility", "completed": False},
            {"name": "Dead Hang from Pull-up Bar", "reps_or_time": "20–30 sec", "focus": "Spine decompression, grip & shoulder joint opening", "completed": False},
            {"name": "Band Pull-Aparts & Light Face Pulls", "reps_or_time": "2×15 reps", "focus": "Rhomboids, lower traps & external rotators", "completed": False}
        ],
        "cooldown": [
            {"name": "Slow Cooldown Walk", "reps_or_time": "3 min", "focus": "Gradual lactic acid clearance", "completed": False},
            {"name": "Rack / Pole Lat Stretch", "reps_or_time": "2×30 sec each side", "focus": "Latissimus dorsi & teres major release", "completed": False},
            {"name": "Cross-Arm Upper Back Rhomboid Stretch", "reps_or_time": "30 sec", "focus": "Middle trapezius & rhomboids", "completed": False},
            {"name": "Wall Bicep & Chest Stretch", "reps_or_time": "30 sec each arm", "focus": "Biceps brachii & anterior shoulder release", "completed": False},
            {"name": "Seated Forward Fold / Hamstring Hang", "reps_or_time": "45 sec", "focus": "Posterior chain & lower back stretch", "completed": False}
        ]
    },
    "legs_a": {
        "warmup": [
            {"name": "Stationary Bike or Brisk Treadmill Walk", "reps_or_time": "4–5 min", "focus": "Synovial fluid secretion in knees & hips", "completed": False},
            {"name": "Leg Swings (Front-to-Back & Side-to-Side)", "reps_or_time": "12 reps each leg", "focus": "Hamstrings, hip flexors & adductors dynamic range", "completed": False},
            {"name": "Deep Goblet Squat Hold + Ankle Rock", "reps_or_time": "45 sec", "focus": "Dorsiflexion, adductor opening & hip mobility", "completed": False},
            {"name": "Hip 90/90 Internal & External Switches", "reps_or_time": "8 reps each side", "focus": "Hip joint capsule rotation & glute activation", "completed": False},
            {"name": "Glute Bridges (Bodyweight)", "reps_or_time": "2×12 reps", "focus": "Gluteus maximus activation before squats/RDLs", "completed": False}
        ],
        "cooldown": [
            {"name": "Slow Flat Walk", "reps_or_time": "3–5 min", "focus": "Blood return from lower extremities", "completed": False},
            {"name": "Standing / Kneeling Quad Stretch", "reps_or_time": "2×30 sec each leg", "focus": "Rectus femoris & quadriceps group", "completed": False},
            {"name": "Kneeling Low Lunge Hip Flexor Stretch", "reps_or_time": "2×30 sec each side", "focus": "Psoas & iliacus (crucial for lower back relief)", "completed": False},
            {"name": "Seated Single-Leg Hamstring Stretch", "reps_or_time": "30 sec each leg", "focus": "Biceps femoris & semitendinosus", "completed": False},
            {"name": "Wall Standing Calf Stretch", "reps_or_time": "30 sec each leg", "focus": "Gastrocnemius & Achilles tendon", "completed": False},
            {"name": "Figure-4 / Pigeon Glute Stretch", "reps_or_time": "40 sec each side", "focus": "Gluteus medius, minimus & piriformis", "completed": False}
        ]
    },
    "push_b": {
        "warmup": [
            {"name": "Easy Treadmill or Incline Walk", "reps_or_time": "3–5 min", "focus": "Elevate body temperature", "completed": False},
            {"name": "Band Shoulder Dislocations / Over-and-Backs", "reps_or_time": "12–15 reps", "focus": "Shoulder girdle & chest dynamic opening", "completed": False},
            {"name": "Arm Circles (Small to Large)", "reps_or_time": "20 sec forwards + 20 sec backwards", "focus": "Deltoid activation & synovial fluid flow", "completed": False},
            {"name": "Scapular Wall Slides", "reps_or_time": "2×10 reps", "focus": "Serratus & lower trap firing for overhead press", "completed": False},
            {"name": "Light Band Lateral Raise Warmup", "reps_or_time": "15 reps", "focus": "Lateral deltoid pre-activation", "completed": False}
        ],
        "cooldown": [
            {"name": "Slow Cooldown Walk & Deep Breathing", "reps_or_time": "3 min", "focus": "Pulse deceleration", "completed": False},
            {"name": "Cross-Body Posterior Deltoid Stretch", "reps_or_time": "2×30 sec each arm", "focus": "Rear deltoid & infraspinatus", "completed": False},
            {"name": "Behind-the-Back Clasp Chest Opener", "reps_or_time": "30 sec", "focus": "Pectoralis & anterior deltoid release", "completed": False},
            {"name": "Overhead Triceps Extension Stretch", "reps_or_time": "30 sec each arm", "focus": "Triceps long head elongation", "completed": False},
            {"name": "Child's Pose with Lateral Side Reach", "reps_or_time": "45 sec", "focus": "Lats, shoulders & ribcage relaxation", "completed": False}
        ]
    },
    "pull_b": {
        "warmup": [
            {"name": "Cross Trainer or Light Rower", "reps_or_time": "3–5 min", "focus": "Full upper body warm-up", "completed": False},
            {"name": "Dead Hang from Pull-up Bar", "reps_or_time": "30 sec", "focus": "Spine decompression & shoulder mobility", "completed": False},
            {"name": "Cat-Cow Spine Warmup", "reps_or_time": "10 reps", "focus": "Spinal articulation & core prep", "completed": False},
            {"name": "Thoracic Open Books (Lying on side)", "reps_or_time": "8 reps each side", "focus": "Thoracic rotation & chest opening", "completed": False},
            {"name": "Forearm & Wrist Flexion/Extension Rotations", "reps_or_time": "30 sec", "focus": "Grip & forearm prep for curls & rows", "completed": False}
        ],
        "cooldown": [
            {"name": "Slow Relaxed Walk", "reps_or_time": "3 min", "focus": "Cooldown & gentle recovery", "completed": False},
            {"name": "Single-Arm Rack Lat Stretch", "reps_or_time": "2×30 sec each side", "focus": "Latissimus dorsi & rib cage", "completed": False},
            {"name": "Doorframe Biceps & Anterior Shoulder Stretch", "reps_or_time": "30 sec each side", "focus": "Biceps brachii & brachialis", "completed": False},
            {"name": "Upper Trapezius & Levator Scapulae Neck Release", "reps_or_time": "20 sec each side", "focus": "Neck & upper trap tension release", "completed": False},
            {"name": "Seated Hamstring & Erector Forward Reach", "reps_or_time": "45 sec", "focus": "Lower back & hamstrings decompression", "completed": False}
        ]
    },
    "legs_b": {
        "warmup": [
            {"name": "Treadmill Brisk Walk or Stepper Easy Pace", "reps_or_time": "5 min", "focus": "Core temperature, calves & glutes activation", "completed": False},
            {"name": "Walking Knee Hugs to Chest", "reps_or_time": "10 reps each leg", "focus": "Glute & hamstring dynamic range", "completed": False},
            {"name": "Lateral Cossack Lunges / Groin Mobility", "reps_or_time": "8 reps each side", "focus": "Adductors, hips & ankle mobility", "completed": False},
            {"name": "World's Greatest Stretch (Lunge + Reach)", "reps_or_time": "5 reps each side", "focus": "Hip flexors, thoracic spine & hamstrings", "completed": False},
            {"name": "Bodyweight Squats & Calf Raises", "reps_or_time": "12 reps", "focus": "Knee tracking & ankle prep for leg press", "completed": False}
        ],
        "cooldown": [
            {"name": "Slow Treadmill Walk with Deep Breathing", "reps_or_time": "3–5 min", "focus": "Clears metabolic waste & lowers blood pressure", "completed": False},
            {"name": "Standing Quad & Hip Flexor Stretch", "reps_or_time": "30 sec each leg", "focus": "Quadriceps & hip flexors", "completed": False},
            {"name": "Seated Butterfly Adductor Stretch", "reps_or_time": "45–60 sec", "focus": "Inner thighs & groin relaxation", "completed": False},
            {"name": "Lying Hamstring Stretch with Strap/Hands", "reps_or_time": "30 sec each leg", "focus": "Hamstring length restoration", "completed": False},
            {"name": "Downward Dog Calf & Achilles Stretch", "reps_or_time": "30–45 sec", "focus": "Calves, Achilles & posterior chain", "completed": False},
            {"name": "Supine Glute / Spinal Twist Stretch", "reps_or_time": "30 sec each side", "focus": "Lower back & glutes release", "completed": False}
        ]
    },
    "recovery": {
        "warmup": [
            {"name": "Gentle Relaxed Walk (Outdoors or Treadmill)", "reps_or_time": "5–10 min", "focus": "Gentle lymph circulation & joint lubrication", "completed": False},
            {"name": "Standing Gentle Neck Rolls & Shoulder Shrugs", "reps_or_time": "10 reps each", "focus": "Cervical spine & trap relaxation", "completed": False},
            {"name": "Standing Side Bends with Overhead Reach", "reps_or_time": "8 reps each side", "focus": "Quadratus lumborum & intercostals", "completed": False}
        ],
        "cooldown": [
            {"name": "Cat-Cow Gentle Spinal Waves", "reps_or_time": "10 slow cycles", "focus": "Full spine restoration", "completed": False},
            {"name": "Extended Child's Pose with Deep Breathing", "reps_or_time": "60 sec", "focus": "Back, hips & mental calm", "completed": False},
            {"name": "Kneeling Hip Flexor & Psoas Stretch", "reps_or_time": "45 sec each side", "focus": "Hip flexor restoration from sitting/training", "completed": False},
            {"name": "Pigeon Pose or Reclined Figure-4", "reps_or_time": "45–60 sec each side", "focus": "Deep piriformis & glute release", "completed": False},
            {"name": "Seated Butterfly Stretch", "reps_or_time": "60 sec", "focus": "Pelvic floor & adductor relaxation", "completed": False},
            {"name": "Supine Lying Hamstring & Lower Back Stretch", "reps_or_time": "45 sec each leg", "focus": "Hamstring recovery", "completed": False},
            {"name": "Lying Spinal Twist", "reps_or_time": "45 sec each side", "focus": "Spine rotation & abdominal release", "completed": False},
            {"name": "Savasana / Box Breathing (4s In, 4s Hold, 4s Out, 4s Hold)", "reps_or_time": "2–3 min", "focus": "Parasympathetic nervous system recovery", "completed": False}
        ]
    }
}

def get_stretches_for_day(day_type: str) -> tuple[list, list]:
    dt = day_type.lower()
    if "push a" in dt:
        key = "push_a"
    elif "pull a" in dt:
        key = "pull_a"
    elif "legs a" in dt:
        key = "legs_a"
    elif "push b" in dt:
        key = "push_b"
    elif "pull b" in dt:
        key = "pull_b"
    elif "legs b" in dt:
        key = "legs_b"
    else:
        key = "recovery"
    
    routine = STRETCH_ROUTINES[key]
    warmups = []
    for s in routine["warmup"]:
        s_copy = dict(s)
        med = get_exercise_media(s["name"])
        s_copy["media"] = med
        if med.get("gif_url"):
            s_copy["gif_url"] = med["gif_url"]
        warmups.append(s_copy)

    cooldowns = []
    for s in routine["cooldown"]:
        s_copy = dict(s)
        med = get_exercise_media(s["name"])
        s_copy["media"] = med
        if med.get("gif_url"):
            s_copy["gif_url"] = med["gif_url"]
        cooldowns.append(s_copy)

    return (warmups, cooldowns)

def parse_exercise_item(item_str: str) -> dict:
    item_str = item_str.strip()
    m = re.search(r'^(.*?)\s*(\d+[×xX]\s*[\d–\-]+(?:\s*(?:each|controlled))?)$', item_str)
    if m:
        ex_name = m.group(1).strip()
        target = m.group(2).strip()
    else:
        ex_name = item_str
        target = ""

    media = get_exercise_media(ex_name)
    doc = {
        "raw": item_str,
        "name": ex_name,
        "target": target,
        "media": media,
        "logged_sets": []
    }
    if media.get("gif_url"):
        doc["gif_url"] = media["gif_url"]
    return doc

def seed_database(force_reset: bool = False) -> dict:
    """Parse CSV and seed MongoDB Atlas database with full stretching, exercises, and cooldown routines."""
    init_indexes()
    db = get_db()
    
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Workout CSV not found at {CSV_PATH}")

    with open(CSV_PATH, encoding="utf-8") as f:
        rows = list(csv.reader(f))

    # 1. Parse Profile
    profile_row_1 = rows[1][0] if len(rows) > 1 else ""
    profile_row_2 = rows[2][0] if len(rows) > 2 else ""

    profile_doc = {
        "_id": "user_profile",
        "title": "90-DAY FAT-LOSS + STRENGTH WORKOUT PLAN",
        "user_name": "Kush Prajapati",
        "age": 26,
        "height_cm": 180,
        "start_weight_kg": 92.5,
        "target_weight_kg": 82.0,
        "gym_timing": "8:00 PM – 10:00 PM",
        "structure": "6 training days + 1 recovery day",
        "philosophy": "Sweat is not the goal—consistent effort, safe form and recovery are.",
        "intensity_guide": profile_row_2.replace("Intensity guide: ", "").strip() if profile_row_2 else (
            "Most strength sets RPE 7–8 (finish with 2–3 good reps left); cardio RPE 5–7 (can speak in short sentences). "
            "Do not chase exhaustion. Stop for chest pain, dizziness, unusual breathlessness or sharp pain."
        ),
        "start_date": "2026-10-31",
        "total_days": 90,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    if force_reset or db.profile.count_documents({"_id": "user_profile"}) == 0:
        db.profile.update_one({"_id": "user_profile"}, {"$set": profile_doc}, upsert=True)
    else:
        db.profile.update_one(
            {"_id": "user_profile"},
            {"$set": {
                "title": profile_doc["title"],
                "philosophy": profile_doc["philosophy"],
                "intensity_guide": profile_doc["intensity_guide"],
                "structure": profile_doc["structure"]
            }}
        )

    # 2. Parse Coaching Notes (rows 96 to 104)
    coaching_notes = []
    for r in rows[96:]:
        text = r[0].strip() if len(r) > 0 and r[0] else ""
        if text and not text.startswith("IMPORTANT COACHING NOTES"):
            m = re.match(r'^(\d+)\)\s*(.*)$', text)
            if m:
                coaching_notes.append({
                    "rule_number": int(m.group(1)),
                    "text": m.group(2).strip()
                })
            else:
                coaching_notes.append({
                    "rule_number": len(coaching_notes) + 1,
                    "text": text
                })

    if force_reset or db.coaching_notes.count_documents({}) == 0:
        db.coaching_notes.delete_many({})
        if coaching_notes:
            db.coaching_notes.insert_many([
                {"_id": f"note_{n['rule_number']}", **n} for n in coaching_notes
            ])

    # 3. Parse 90 Days (rows 5 to 94)
    days_data = []
    for r in rows[5:95]:
        if not r or not r[0].strip():
            continue
        day_cell = r[0].strip()
        m_day = re.search(r'Day\s*(\d+)', day_cell)
        if not m_day:
            continue
        day_num = int(m_day.group(1))

        m_date = re.search(r'\(([^)]+)\)', day_cell)
        date_str = m_date.group(1).strip() if m_date else ""

        week_num = int(r[1].strip()) if len(r) > 1 and r[1].strip().isdigit() else 1

        day_type_raw = r[2].strip() if len(r) > 2 else ""
        lines = [l.strip() for l in day_type_raw.split("\n") if l.strip()]
        day_type = lines[0] if len(lines) > 0 else ""

        if len(lines) > 1 and "Phase" in lines[1]:
            phase = lines[1]
        elif week_num <= 4:
            phase = "Phase 1 – Foundation"
        elif week_num <= 9:
            phase = "Phase 2 – Progress"
        else:
            phase = "Phase 3 – Consolidate"

        strength_raw = r[3].strip() if len(r) > 3 else ""
        is_deload = any("DELOAD" in l for l in lines) or ("DELOAD" in strength_raw)

        # Parse individual exercises
        parsed_exercises = []
        if strength_raw and not strength_raw.lower().startswith("no strength training"):
            clean_str = re.sub(r'^DELOAD:\s*[^.]+\.\s*', '', strength_raw)
            for part in clean_str.split(";"):
                part = part.strip()
                if part:
                    parsed_exercises.append(parse_exercise_item(part))

        bodyweight = r[4].strip() if len(r) > 4 else ""
        cardio = r[5].strip() if len(r) > 5 else ""
        warmup = r[6].strip() if len(r) > 6 else ""
        duration = r[7].strip() if len(r) > 7 else ""
        effort = r[8].strip() if len(r) > 8 else ""
        daily_steps = r[9].strip() if len(r) > 9 else ""

        # Generate targeted dynamic warm-up and cool-down stretch routines
        warmup_stretches, cooldown_stretches = get_stretches_for_day(day_type)

        day_doc = {
            "day_number": day_num,
            "date_display": date_str,
            "week_number": week_num,
            "phase": phase,
            "day_type": day_type,
            "is_deload": is_deload,
            "strength_workout": strength_raw,
            "parsed_exercises": parsed_exercises,
            "warmup_stretches": warmup_stretches,
            "cooldown_stretches": cooldown_stretches,
            "bodyweight_conditioning": bodyweight,
            "cardio": cardio,
            "warmup_cooldown": warmup,
            "target_duration": duration,
            "effort_target": effort,
            "daily_steps_target": daily_steps,
            "completed": False,
            "completed_at": None,
            "actual_weight_kg": None,
            "actual_steps": None,
            "actual_duration_min": None,
            "rpe_rating": None,
            "user_notes": ""
        }
        days_data.append(day_doc)

    inserted_count = 0
    updated_count = 0

    if force_reset:
        db.workout_days.delete_many({})
        if days_data:
            db.workout_days.insert_many(days_data)
            inserted_count = len(days_data)
    else:
        for day in days_data:
            existing = db.workout_days.find_one({"day_number": day["day_number"]})
            if existing is None:
                db.workout_days.insert_one(day)
                inserted_count += 1
            else:
                # Update plan specifications and enrich with exercise media
                update_fields = {
                    "date_display": day["date_display"],
                    "week_number": day["week_number"],
                    "phase": day["phase"],
                    "day_type": day["day_type"],
                    "is_deload": day["is_deload"],
                    "strength_workout": day["strength_workout"],
                    "parsed_exercises": day["parsed_exercises"],
                    "warmup_stretches": day["warmup_stretches"],
                    "cooldown_stretches": day["cooldown_stretches"],
                    "bodyweight_conditioning": day["bodyweight_conditioning"],
                    "cardio": day["cardio"],
                    "warmup_cooldown": day["warmup_cooldown"],
                    "target_duration": day["target_duration"],
                    "effort_target": day["effort_target"],
                    "daily_steps_target": day["daily_steps_target"]
                }
                # Preserve existing logged_sets if any
                if existing and "parsed_exercises" in existing:
                    old_ex_map = {ex["name"]: ex.get("logged_sets", []) for ex in existing["parsed_exercises"]}
                    for new_ex in update_fields["parsed_exercises"]:
                        if new_ex["name"] in old_ex_map:
                            new_ex["logged_sets"] = old_ex_map[new_ex["name"]]
                db.workout_days.update_one(
                    {"day_number": day["day_number"]},
                    {"$set": update_fields}
                )
                updated_count += 1

    # Initialize initial weight log
    if db.weight_logs.count_documents({}) == 0:
        db.weight_logs.insert_one({
            "day_number": 1,
            "date_display": "31 Oct",
            "weight_kg": 92.5,
            "notes": "Starting baseline weight",
            "recorded_at": "2026-10-31T08:00:00"
        })

    logger.info(f"Seeding finished. Total days: {len(days_data)}, Inserted: {inserted_count}, Updated: {updated_count}")
    return {
        "status": "success",
        "total_days": len(days_data),
        "inserted": inserted_count,
        "updated": updated_count,
        "coaching_notes": len(coaching_notes)
    }

if __name__ == "__main__":
    result = seed_database(force_reset=True)
    print("Seed result with full warmups and cooldowns:", result)
