from datetime import datetime, timezone
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from app.database import get_db, check_connection
from app.models import DayUpdateModel, ProfileUpdateModel, WeightLogCreateModel
from app.seeder import seed_database
from app.exercise_media import EXERCISE_MEDIA_DATABASE, STRETCHES_AND_CARDIO_DATABASE, get_exercise_media

logger = logging.getLogger("workout_app")
router = APIRouter(prefix="/api")

def classify_exercise_group(ex: dict) -> str:
    cat = ex.get('category', '')
    if cat == 'Dynamic Warm-Up':
        return 'Warm-Up & Mobility'
    if cat == 'Cool-Down Static Stretch':
        return 'Cool-Down Stretches'
    if cat == 'Cardio Protocol':
        return 'Cardio'
    if cat in ['Bodyweight', 'Conditioning']:
        return 'Core & Conditioning'
        
    p = ' '.join(ex.get('primary_muscles', [])).lower()
    if any(k in p for k in ['chest', 'pectoral']):
        return 'Chest'
    if any(k in p for k in ['delt', 'shoulder']):
        return 'Shoulders'
    if any(k in p for k in ['lat', 'back', 'rhomboid', 'trapezius', 'erector']):
        return 'Back'
    if any(k in p for k in ['quad', 'hamstring', 'glute', 'calf', 'calves', 'leg', 'adductor']):
        return 'Legs & Glutes'
    if any(k in p for k in ['bicep', 'tricep', 'forearm', 'brachii', 'brachialis']):
        return 'Arms'
    return 'Strength Lifts'

@router.get("/health")
def get_health():
    """Health check including MongoDB Atlas connectivity."""
    status = check_connection()
    counts = {}
    if status.get("status") == "connected":
        try:
            db = get_db()
            counts = {
                "days": db.workout_days.count_documents({}),
                "completed_days": db.workout_days.count_documents({"completed": True}),
                "weight_logs": db.weight_logs.count_documents({}),
                "coaching_notes": db.coaching_notes.count_documents({})
            }
        except Exception as e:
            logger.warning(f"Error fetching counts for health check: {e}")
    return {
        **status,
        "counts": counts,
        "server_time": datetime.now(timezone.utc).isoformat()
    }

@router.get("/exercises/media")
def get_exercises_media(name: Optional[str] = None):
    """Get exercise demonstration photos, target muscles, form cues, and video link."""
    if name:
        return get_exercise_media(name)
    return EXERCISE_MEDIA_DATABASE

@router.get("/exercises")
def get_all_exercises(
    group: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """Return the complete unified library of all 64 gym exercises, warmups, conditioning, cardio and stretches."""
    unified = []
    seen_ids = set()

    for k, v in EXERCISE_MEDIA_DATABASE.items():
        ex_id = v.get('id', k)
        if ex_id in seen_ids:
            continue
        seen_ids.add(ex_id)
        item = dict(v)
        item['key'] = k
        item['body_group'] = classify_exercise_group(item)
        unified.append(item)

    for k, v in STRETCHES_AND_CARDIO_DATABASE.items():
        ex_id = v.get('id', k)
        if ex_id in seen_ids:
            continue
        seen_ids.add(ex_id)
        item = dict(v)
        item['key'] = k
        item['body_group'] = classify_exercise_group(item)
        unified.append(item)

    if group and group.lower() != 'all':
        unified = [e for e in unified if e.get('body_group', '').lower() == group.lower()]

    if category and category.lower() != 'all':
        unified = [e for e in unified if e.get('category', '').lower() == category.lower()]

    if search:
        s = search.lower().strip()
        unified = [
            e for e in unified if (
                s in e.get('display_name', '').lower() or
                s in e.get('equipment', '').lower() or
                s in e.get('category', '').lower() or
                s in e.get('body_group', '').lower() or
                any(s in m.lower() for m in e.get('primary_muscles', [])) or
                any(s in m.lower() for m in e.get('secondary_muscles', []))
            )
        ]

    unified.sort(key=lambda x: x.get('display_name', ''))
    return {
        "total": len(unified),
        "exercises": unified
    }

@router.get("/catalog")
def get_exercise_catalog(
    body_part: Optional[str] = None,
    equipment: Optional[str] = None,
    target: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """Query the 1,324-exercise ExerciseDB collection in MongoDB Atlas."""
    db = get_db()
    col = db["exercise_catalog"]
    
    query = {}
    if body_part and body_part.lower() != "all":
        query["body_part"] = {"$regex": f"^{body_part}$", "$options": "i"}
    if equipment and equipment.lower() != "all":
        query["equipment"] = {"$regex": equipment, "$options": "i"}
    if target and target.lower() != "all":
        query["target_muscle"] = {"$regex": target, "$options": "i"}
    if search:
        s = search.strip()
        query["$or"] = [
            {"name": {"$regex": s, "$options": "i"}},
            {"target_muscle": {"$regex": s, "$options": "i"}},
            {"equipment": {"$regex": s, "$options": "i"}},
            {"body_part": {"$regex": s, "$options": "i"}}
        ]
        
    total = col.count_documents(query)
    exercises = list(col.find(query, {"_id": 0}).skip(skip).limit(limit))
    return {
        "total": total,
        "limit": limit,
        "skip": skip,
        "exercises": exercises
    }

@router.get("/catalog/filters")
def get_catalog_filters():
    """Return distinct body parts, equipment, and target muscles for ExerciseDB."""
    db = get_db()
    col = db["exercise_catalog"]
    return {
        "body_parts": sorted(col.distinct("body_part")),
        "equipment": sorted(col.distinct("equipment")),
        "targets": sorted(col.distinct("target_muscle")),
        "total_exercises": col.count_documents({})
    }

@router.get("/catalog-876")
def get_catalog_876(
    category: Optional[str] = None,
    level: Optional[str] = None,
    equipment: Optional[str] = None,
    search: Optional[str] = None,
    muscle: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """Query the 876-exercise Free-Exercise-DB collection in MongoDB Atlas."""
    db = get_db()
    col = db["exercise_catalog_876"]
    
    query = {}
    if category and category.lower() != "all":
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    if level and level.lower() != "all":
        query["level"] = {"$regex": f"^{level}$", "$options": "i"}
    if equipment and equipment.lower() != "all":
        query["equipment"] = {"$regex": equipment, "$options": "i"}
    if muscle and muscle.lower() != "all":
        query["primary_muscles"] = {"$regex": muscle, "$options": "i"}
    if search:
        s = search.strip()
        query["$or"] = [
            {"name": {"$regex": s, "$options": "i"}},
            {"equipment": {"$regex": s, "$options": "i"}},
            {"category": {"$regex": s, "$options": "i"}},
            {"primary_muscles": {"$regex": s, "$options": "i"}}
        ]
        
    total = col.count_documents(query)
    exercises = list(col.find(query, {"_id": 0}).skip(skip).limit(limit))
    return {
        "total": total,
        "limit": limit,
        "skip": skip,
        "exercises": exercises
    }

@router.get("/catalog-876/filters")
def get_catalog_876_filters():
    """Return distinct categories, equipment, and levels for Free-Exercise-DB (876)."""
    db = get_db()
    col = db["exercise_catalog_876"]
    return {
        "categories": sorted(col.distinct("category")),
        "levels": sorted(col.distinct("level")),
        "equipment": sorted(col.distinct("equipment")),
        "total_exercises": col.count_documents({})
    }

@router.get("/profile")
def get_profile():
    """Get the user profile, goals, and intensity guide."""
    try:
        db = get_db()
        profile = db.profile.find_one({"_id": "user_profile"}, {"_id": 0})
        if not profile:
            seed_database()
            profile = db.profile.find_one({"_id": "user_profile"}, {"_id": 0})
        return profile
    except Exception as e:
        logger.error(f"Error loading profile from MongoDB: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"MongoDB connection failed: {str(e)}. If this is hosted on Vercel, please ensure 0.0.0.0/0 is whitelisted under Network Access in MongoDB Atlas."
        )

@router.put("/profile")
def update_profile(data: ProfileUpdateModel):
    """Update profile metrics and targets."""
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    db.profile.update_one({"_id": "user_profile"}, {"$set": update_data}, upsert=True)
    updated = db.profile.find_one({"_id": "user_profile"}, {"_id": 0})
    return {"status": "success", "profile": updated}

@router.get("/coaching-notes")
def get_coaching_notes():
    """Return the 8 coaching guidelines."""
    db = get_db()
    notes = list(db.coaching_notes.find({}, {"_id": 0}).sort("rule_number", 1))
    return {"notes": notes}

@router.get("/days")
def get_days(
    week: Optional[int] = Query(None, ge=1, le=13),
    phase: Optional[str] = None,
    completed: Optional[bool] = None,
    is_deload: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get workout days with flexible filtering."""
    db = get_db()
    query = {}
    if week is not None:
        query["week_number"] = week
    if phase:
        query["phase"] = {"$regex": phase, "$options": "i"}
    if completed is not None:
        query["completed"] = completed
    if is_deload is not None:
        query["is_deload"] = is_deload
    if search:
        query["$or"] = [
            {"day_type": {"$regex": search, "$options": "i"}},
            {"strength_workout": {"$regex": search, "$options": "i"}},
            {"cardio": {"$regex": search, "$options": "i"}},
            {"bodyweight_conditioning": {"$regex": search, "$options": "i"}},
            {"date_display": {"$regex": search, "$options": "i"}}
        ]

    try:
        days = list(db.workout_days.find(query, {"_id": 0}).sort("day_number", 1))
        if not days and not query:
            seed_database()
            days = list(db.workout_days.find({}, {"_id": 0}).sort("day_number", 1))
        return {"total": len(days), "days": days}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workout days from MongoDB: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"MongoDB connection failed: {str(e)}. If this is hosted on Vercel, please ensure 0.0.0.0/0 is whitelisted under Network Access in MongoDB Atlas."
        )

@router.get("/days/{day_number}")
def get_day(day_number: int):
    """Get single workout day details."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number}, {"_id": 0})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")
    return day

@router.patch("/days/{day_number}")
def update_day(day_number: int, data: DayUpdateModel):
    """Update workout day progress, weight, sets, steps, notes."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")

    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}

    # Handle completion timestamp
    if "completed" in update_fields:
        if update_fields["completed"] and not day.get("completed"):
            update_fields["completed_at"] = datetime.now(timezone.utc).isoformat()
        elif not update_fields["completed"]:
            update_fields["completed_at"] = None

    # Handle weight log synchronization
    if "actual_weight_kg" in update_fields and update_fields["actual_weight_kg"]:
        w = float(update_fields["actual_weight_kg"])
        db.weight_logs.update_one(
            {"day_number": day_number},
            {
                "$set": {
                    "day_number": day_number,
                    "date_display": day.get("date_display", ""),
                    "weight_kg": w,
                    "recorded_at": datetime.now(timezone.utc).isoformat(),
                    "notes": update_fields.get("user_notes", "") or f"Logged on Day {day_number}"
                }
            },
            upsert=True
        )

    db.workout_days.update_one({"day_number": day_number}, {"$set": update_fields})
    updated = db.workout_days.find_one({"day_number": day_number}, {"_id": 0})
    return {"status": "success", "day": updated}

@router.post("/days/{day_number}/toggle")
def toggle_day_completion(day_number: int):
    """Quick toggle day completion."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")

    new_status = not day.get("completed", False)
    update = {
        "completed": new_status,
        "completed_at": datetime.now(timezone.utc).isoformat() if new_status else None
    }
    db.workout_days.update_one({"day_number": day_number}, {"$set": update})
    return {
        "status": "success",
        "day_number": day_number,
        "completed": new_status,
        "completed_at": update["completed_at"]
    }

@router.get("/stats")
def get_stats():
    """Calculate overall 90-day progress, streak, weight tracking, phase breakdowns."""
    db = get_db()
    profile = db.profile.find_one({"_id": "user_profile"}, {"_id": 0}) or {}
    total_days = 90
    completed_days = db.workout_days.count_documents({"completed": True})

    # Streaks calculation
    days = list(db.workout_days.find({}, {"day_number": 1, "completed": 1, "actual_weight_kg": 1}).sort("day_number", 1))
    
    current_streak = 0
    max_streak = 0
    temp_streak = 0
    latest_completed_day = 0

    for d in days:
        if d.get("completed"):
            temp_streak += 1
            latest_completed_day = d["day_number"]
            if temp_streak > max_streak:
                max_streak = temp_streak
        else:
            temp_streak = 0

    # Current streak from latest completed day counting backwards
    current_streak = 0
    for d in reversed(days):
        if d.get("completed"):
            current_streak += 1
        elif current_streak > 0:
            break

    # Phase breakdown
    phase1_total = db.workout_days.count_documents({"phase": {"$regex": "Phase 1"}})
    phase1_done = db.workout_days.count_documents({"phase": {"$regex": "Phase 1"}, "completed": True})

    phase2_total = db.workout_days.count_documents({"phase": {"$regex": "Phase 2"}})
    phase2_done = db.workout_days.count_documents({"phase": {"$regex": "Phase 2"}, "completed": True})

    phase3_total = db.workout_days.count_documents({"phase": {"$regex": "Phase 3"}})
    phase3_done = db.workout_days.count_documents({"phase": {"$regex": "Phase 3"}, "completed": True})

    # Weight tracking
    start_weight = float(profile.get("start_weight_kg", 92.5))
    target_weight = float(profile.get("target_weight_kg", 82.0))

    # Find latest logged weight
    latest_weight_log = db.weight_logs.find_one(sort=[("day_number", -1)])
    current_weight = float(latest_weight_log["weight_kg"]) if latest_weight_log else start_weight

    total_loss = round(start_weight - current_weight, 2)
    remaining_loss = round(max(0.0, current_weight - target_weight), 2)
    goal_loss = round(start_weight - target_weight, 2)
    weight_pct = round((total_loss / goal_loss * 100), 1) if goal_loss > 0 and total_loss > 0 else 0.0

    return {
        "total_days": total_days,
        "completed_days": completed_days,
        "remaining_days": total_days - completed_days,
        "completion_percentage": round((completed_days / total_days) * 100, 1) if total_days else 0,
        "current_streak": current_streak,
        "max_streak": max_streak,
        "latest_completed_day": latest_completed_day,
        "phases": {
            "phase1": {
                "name": "Phase 1 – Foundation",
                "weeks": "Weeks 1–4 (Days 1–28)",
                "total": phase1_total,
                "completed": phase1_done,
                "pct": round((phase1_done / phase1_total * 100), 1) if phase1_total else 0
            },
            "phase2": {
                "name": "Phase 2 – Progress",
                "weeks": "Weeks 5–9 (Days 29–60)",
                "total": phase2_total,
                "completed": phase2_done,
                "pct": round((phase2_done / phase2_total * 100), 1) if phase2_total else 0
            },
            "phase3": {
                "name": "Phase 3 – Consolidate",
                "weeks": "Weeks 10–13 (Days 61–90)",
                "total": phase3_total,
                "completed": phase3_done,
                "pct": round((phase3_done / phase3_total * 100), 1) if phase3_total else 0
            }
        },
        "weight_stats": {
            "start_weight_kg": start_weight,
            "target_weight_kg": target_weight,
            "current_weight_kg": current_weight,
            "total_loss_kg": total_loss,
            "remaining_loss_kg": remaining_loss,
            "goal_loss_kg": goal_loss,
            "progress_percentage": min(100.0, max(0.0, weight_pct))
        }
    }

@router.get("/weight-history")
def get_weight_history():
    """Return historical weight logs and projected linear goal line."""
    db = get_db()
    profile = db.profile.find_one({"_id": "user_profile"}, {"_id": 0}) or {}
    start_weight = float(profile.get("start_weight_kg", 92.5))
    target_weight = float(profile.get("target_weight_kg", 82.0))

    logs = list(db.weight_logs.find({}, {"_id": 0}).sort("day_number", 1))

    # Compute ideal benchmark for every 5 days (from day 1 to 90)
    ideal_curve = []
    for day in range(1, 91, 5):
        # linear progression from start to target
        prog = (day - 1) / 89.0
        expected = round(start_weight - prog * (start_weight - target_weight), 2)
        ideal_curve.append({"day": day, "expected_weight": expected})

    return {
        "start_weight": start_weight,
        "target_weight": target_weight,
        "logs": logs,
        "ideal_curve": ideal_curve
    }

@router.post("/weight-log")
def create_weight_log(data: WeightLogCreateModel):
    """Log a direct weight entry."""
    db = get_db()
    day_num = data.day_number or 1
    day = db.workout_days.find_one({"day_number": day_num})
    date_display = data.date_display or (day.get("date_display", "") if day else "")

    doc = {
        "day_number": day_num,
        "date_display": date_display,
        "weight_kg": data.weight_kg,
        "notes": data.notes or "",
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    db.weight_logs.update_one({"day_number": day_num}, {"$set": doc}, upsert=True)
    if day:
        db.workout_days.update_one({"day_number": day_num}, {"$set": {"actual_weight_kg": data.weight_kg}})

    return {"status": "success", "log": doc}

@router.post("/seed")
def trigger_seed(force: bool = False):
    """Re-seed the database from CSV."""
    result = seed_database(force_reset=force)
    return result

@router.get("/export")
def export_data():
    """Export complete plan, user progress, and weight logs as JSON."""
    db = get_db()
    profile = db.profile.find_one({"_id": "user_profile"}, {"_id": 0})
    days = list(db.workout_days.find({}, {"_id": 0}).sort("day_number", 1))
    weight_logs = list(db.weight_logs.find({}, {"_id": 0}).sort("day_number", 1))
    coaching_notes = list(db.coaching_notes.find({}, {"_id": 0}).sort("rule_number", 1))

    return JSONResponse(
        content={
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "profile": profile,
            "coaching_notes": coaching_notes,
            "workout_days": days,
            "weight_logs": weight_logs
        },
        headers={
            "Content-Disposition": "attachment; filename=90days_workout_plan_backup.json"
        }
    )

