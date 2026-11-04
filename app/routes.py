from datetime import datetime, timezone
import logging
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from app.database import get_db, check_connection
from app.models import DayUpdateModel, ProfileUpdateModel, WeightLogCreateModel
from app.seeder import seed_database
from app.exercise_media import EXERCISE_MEDIA_DATABASE, STRETCHES_AND_CARDIO_DATABASE, get_exercise_media
from app.calories import calculate_day_calories, get_exercise_met, calculate_set_calories
from app.catalog_service import query_vault, get_vault_filters

logger = logging.getLogger("workout_app")
router = APIRouter()

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

def calculate_day_completion(day: dict) -> float:
    """Calculate granular completion percentage based on items done.
    If any item is marked not done, reduce from 100% (do not force 100% just because completed=True)."""
    if not day:
        return 0.0

    warmups = day.get("warmup_stretches") or []
    warmup_total = len(warmups)
    warmup_done = sum(1 for s in warmups if s.get("completed"))

    exercises = day.get("parsed_exercises") or []
    sets_total = 0
    sets_done = 0
    for ex in exercises:
        sets = ex.get("logged_sets") or []
        if sets:
            sets_total += len(sets)
            sets_done += sum(1 for s in sets if s.get("completed"))
        else:
            target = ex.get("target") or ""
            m = re.match(r"^(\d+)", target)
            planned = int(m.group(1)) if m else 3
            sets_total += planned

    cond_raw = (day.get("bodyweight_conditioning") or "").lower()
    has_cond = bool(cond_raw and "optional" not in cond_raw and "no conditioning" not in cond_raw)
    cond_total = 1 if has_cond else 0
    cond_done = 1 if (has_cond and day.get("conditioning_completed")) else 0

    cardio_raw = (day.get("cardio") or "").lower()
    has_cardio = bool(cardio_raw and "none" not in cardio_raw and "optional" not in cardio_raw)
    cardio_total = 1 if has_cardio else 0
    cardio_done = 1 if (has_cardio and day.get("cardio_completed")) else 0

    cooldowns = day.get("cooldown_stretches") or []
    cooldown_total = len(cooldowns)
    cooldown_done = sum(1 for s in cooldowns if s.get("completed"))

    total = warmup_total + sets_total + cond_total + cardio_total + cooldown_total
    done = warmup_done + sets_done + cond_done + cardio_done + cooldown_done

    if total == 0:
        return 100.0 if day.get("completed") else 0.0

    pct = round((done / total) * 100.0, 1)
    if done < total and pct >= 100.0:
        pct = 99.0
    return pct

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

@router.get("/exercises/vault")
def get_vault_exercises_endpoint(
    group: Optional[str] = None,
    equipment: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(48, ge=1, le=100)
):
    """Query the unified 2,200+ exercise library with pagination, muscle/group, and equipment filters."""
    skip = (page - 1) * limit
    res = query_vault(group=group, equipment=equipment, search=search, skip=skip, limit=limit)
    res["page"] = page
    return res

@router.get("/exercises/vault/filters")
def get_vault_filters_endpoint():
    """Return live movement counts per category and equipment for the 2,200+ exercise library."""
    return get_vault_filters()

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
        logger.error(f"Error loading profile from database: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily syncing. Please try again in a few moments."
        )

@router.put("/profile")
def update_profile(data: ProfileUpdateModel):
    """Update profile metrics and targets."""
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    db.profile.update_one({"_id": "user_profile"}, {"$set": update_data}, upsert=True)
    invalidate_routes_cache()
    updated = db.profile.find_one({"_id": "user_profile"}, {"_id": 0})
    return {"status": "success", "profile": updated}

@router.get("/coaching-notes")
def get_coaching_notes():
    """Return the 8 coaching guidelines."""
    db = get_db()
    notes = list(db.coaching_notes.find({}, {"_id": 0}).sort("rule_number", 1))
    return {"notes": notes}

def enrich_day_exercise_gifs(d: dict) -> dict:
    """Enrich day exercises, warmups, and cooldowns with high-quality animated GIFs."""
    if not d:
        return d
    exercises = d.get("parsed_exercises") or []
    for ex in exercises:
        name = ex.get("name", "")
        media = get_exercise_media(name)
        if media:
            ex_media = dict(ex.get("media") or media)
            if media.get("gif_url"):
                ex_media["gif_url"] = media["gif_url"]
                ex["gif_url"] = media["gif_url"]
                imgs = [media["gif_url"]] + [img for img in (ex_media.get("images") or media.get("images") or []) if img != media["gif_url"]]
                ex_media["images"] = imgs
            ex["media"] = ex_media
    for stretch_list in ["warmup_stretches", "cooldown_stretches"]:
        for s in d.get(stretch_list) or []:
            name = s.get("name", "")
            media = get_exercise_media(name)
            if media:
                s_media = dict(s.get("media") or media)
                if media.get("gif_url"):
                    s_media["gif_url"] = media["gif_url"]
                    s["gif_url"] = media["gif_url"]
                    imgs = [media["gif_url"]] + [img for img in (s_media.get("images") or media.get("images") or []) if img != media["gif_url"]]
                    s_media["images"] = imgs
                s["media"] = s_media
    return d

_DAYS_CACHE = None
_STATS_CACHE = None
_WEIGHT_CACHE = None

def invalidate_routes_cache():
    global _DAYS_CACHE, _STATS_CACHE, _WEIGHT_CACHE
    _DAYS_CACHE = None
    _STATS_CACHE = None
    _WEIGHT_CACHE = None

@router.get("/days")
def get_days(
    week: Optional[int] = Query(None, ge=1, le=13),
    phase: Optional[str] = None,
    completed: Optional[bool] = None,
    is_deload: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get workout days with flexible filtering and instant memory caching."""
    global _DAYS_CACHE
    db = get_db()
    query = {}
    if isinstance(week, int):
        query["week_number"] = week
    if isinstance(phase, str) and phase:
        query["phase"] = {"$regex": phase, "$options": "i"}
    if isinstance(completed, bool):
        query["completed"] = completed
    if isinstance(is_deload, bool):
        query["is_deload"] = is_deload
    if isinstance(search, str) and search:
        query["$or"] = [
            {"day_type": {"$regex": search, "$options": "i"}},
            {"strength_workout": {"$regex": search, "$options": "i"}},
            {"cardio": {"$regex": search, "$options": "i"}},
            {"bodyweight_conditioning": {"$regex": search, "$options": "i"}},
            {"date_display": {"$regex": search, "$options": "i"}}
        ]

    # Return cached full days payload instantly when default full list is queried
    if not query and _DAYS_CACHE is not None:
        return _DAYS_CACHE

    try:
        days = list(db.workout_days.find(query, {"_id": 0}).sort("day_number", 1))
        if not days and not query:
            seed_database()
            days = list(db.workout_days.find({}, {"_id": 0}).sort("day_number", 1))
        for d in days:
            enrich_day_exercise_gifs(d)
            d["completion_percentage"] = calculate_day_completion(d)
            w = float(d.get("actual_weight_kg") or 90.0)
            d["calories"] = calculate_day_calories(d, w)
        result = {"total": len(days), "days": days}
        if not query:
            _DAYS_CACHE = result
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workout days: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily syncing. Please try again in a few moments."
        )

@router.get("/days/{day_number}")
def get_day(day_number: int):
    """Get single workout day details."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number}, {"_id": 0})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")
    enrich_day_exercise_gifs(day)
    w = float(day.get("actual_weight_kg") or 90.0)
    day["completion_percentage"] = calculate_day_completion(day)
    day["calories"] = calculate_day_calories(day, w)
    return day

@router.put("/days/{day_number}")
@router.patch("/days/{day_number}")
def update_day(day_number: int, data: DayUpdateModel):
    """Update workout day progress, weight, sets, steps, notes, and session start/end time."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")

    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    now_iso = datetime.now(timezone.utc).isoformat()

    # Session Timing Auto-measurement:
    # 1. If start_time not set yet and activity is being logged or started, set started_at
    if "started_at" not in update_fields and not day.get("started_at"):
        # Check if user logged any exercise set or stretch
        has_logged_activity = False
        if "parsed_exercises" in update_fields:
            for ex in update_fields.get("parsed_exercises") or []:
                for s in ex.get("logged_sets") or []:
                    if s.get("completed") or s.get("weight_kg") or s.get("reps"):
                        has_logged_activity = True
                        break
        if "warmup_stretches" in update_fields:
            if any(w.get("completed") for w in update_fields.get("warmup_stretches") or []):
                has_logged_activity = True
        if "cooldown_stretches" in update_fields:
            if any(c.get("completed") for c in update_fields.get("cooldown_stretches") or []):
                has_logged_activity = True
        if update_fields.get("conditioning_completed") or update_fields.get("cardio_completed"):
            has_logged_activity = True

        if has_logged_activity:
            update_fields["started_at"] = now_iso

    # 2. Update ended_at to the current timestamp whenever activity is logged
    if "ended_at" not in update_fields:
        update_fields["ended_at"] = now_iso

    # 3. Calculate actual_duration_min from started_at and ended_at
    active_start = update_fields.get("started_at") or day.get("started_at")
    active_end = update_fields.get("ended_at") or day.get("ended_at") or now_iso
    if active_start and active_end:
        try:
            s_dt = datetime.fromisoformat(active_start.replace("Z", "+00:00"))
            e_dt = datetime.fromisoformat(active_end.replace("Z", "+00:00"))
            dur_mins = max(1, int(round((e_dt - s_dt).total_seconds() / 60.0)))
            if dur_mins > 240:
                dur_mins = 65
            if not update_fields.get("actual_duration_min"):
                update_fields["actual_duration_min"] = dur_mins
        except Exception:
            pass

    # Handle completion timestamp
    if "completed" in update_fields:
        if update_fields["completed"] and not day.get("completed"):
            update_fields["completed_at"] = now_iso
            update_fields["ended_at"] = now_iso
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
    if updated:
        pct = calculate_day_completion(updated)
        # AUTO-SYNC: If exercises are 100% completed, automatically consider day as completed
        if pct >= 100.0:
            if not updated.get("completed"):
                now_iso = datetime.now(timezone.utc).isoformat()
                db.workout_days.update_one(
                    {"day_number": day_number},
                    {"$set": {"completed": True, "completed_at": now_iso}}
                )
                updated["completed"] = True
                updated["completed_at"] = now_iso
        else:
            # If exercises are not 100% completed, day is not considered completed
            warmups = updated.get("warmup_stretches") or []
            exercises = updated.get("parsed_exercises") or []
            cooldowns = updated.get("cooldown_stretches") or []
            has_items = bool(warmups or exercises or cooldowns or updated.get("bodyweight_conditioning") or updated.get("cardio"))
            if has_items and updated.get("completed"):
                db.workout_days.update_one(
                    {"day_number": day_number},
                    {"$set": {"completed": False, "completed_at": None}}
                )
                updated["completed"] = False
                updated["completed_at"] = None

        enrich_day_exercise_gifs(updated)
        updated["completion_percentage"] = pct
        w = float(updated.get("actual_weight_kg") or 90.0)
        updated["calories"] = calculate_day_calories(updated, w)
    invalidate_routes_cache()
    return {"status": "success", "day": updated}

@router.post("/days/{day_number}/start")
def start_workout_session(day_number: int):
    """Start or resume the active workout session, capturing start_time."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    update = {"ended_at": now_iso}
    if not day.get("started_at"):
        update["started_at"] = now_iso

    db.workout_days.update_one({"day_number": day_number}, {"$set": update})
    updated = db.workout_days.find_one({"day_number": day_number}, {"_id": 0})
    enrich_day_exercise_gifs(updated)
    w = float(updated.get("actual_weight_kg") or 90.0)
    updated["completion_percentage"] = calculate_day_completion(updated)
    updated["calories"] = calculate_day_calories(updated, w)
    invalidate_routes_cache()
    return {"status": "started", "started_at": updated.get("started_at"), "day": updated}

@router.post("/days/{day_number}/finish")
def finish_workout_session(day_number: int):
    """Finish the workout session, record end_time and compute final duration in minutes."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    start_iso = day.get("started_at") or now_iso
    dur_mins = 45
    try:
        s_dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
        e_dt = datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
        dur_mins = max(1, int(round((e_dt - s_dt).total_seconds() / 60.0)))
        if dur_mins > 240:
            dur_mins = 65
    except Exception:
        pass

    update = {
        "completed": True,
        "completed_at": now_iso,
        "ended_at": now_iso,
        "started_at": start_iso,
        "actual_duration_min": dur_mins,
    }
    db.workout_days.update_one({"day_number": day_number}, {"$set": update})
    updated = db.workout_days.find_one({"day_number": day_number}, {"_id": 0})
    w = float(updated.get("actual_weight_kg") or 90.0)
    updated["completion_percentage"] = calculate_day_completion(updated)
    updated["calories"] = calculate_day_calories(updated, w)
    invalidate_routes_cache()
    return {"status": "finished", "actual_duration_min": dur_mins, "day": updated}

@router.post("/days/{day_number}/toggle")
def toggle_day_completion(day_number: int):
    """Quick toggle day completion.
    When marked completed, marks all exercises/sets/stretches done (100%).
    When unmarked, resets them to incomplete (0%)."""
    db = get_db()
    day = db.workout_days.find_one({"day_number": day_number})
    if not day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")

    new_status = not day.get("completed", False)

    warmups = day.get("warmup_stretches") or []
    for w in warmups:
        w["completed"] = new_status

    exercises = day.get("parsed_exercises") or []
    for ex in exercises:
        sets = ex.get("logged_sets") or []
        if not sets:
            target = ex.get("target") or ""
            m = re.match(r"^(\d+)", target)
            planned = int(m.group(1)) if m else 3
            sets = [{"set_num": i + 1, "weight_kg": "", "reps": "", "completed": new_status} for i in range(planned)]
            ex["logged_sets"] = sets
        else:
            for s in sets:
                s["completed"] = new_status

    cooldowns = day.get("cooldown_stretches") or []
    for c in cooldowns:
        c["completed"] = new_status

    update = {
        "completed": new_status,
        "completed_at": datetime.now(timezone.utc).isoformat() if new_status else None,
        "warmup_stretches": warmups,
        "parsed_exercises": exercises,
        "cooldown_stretches": cooldowns,
        "conditioning_completed": new_status,
        "cardio_completed": new_status,
    }
    db.workout_days.update_one({"day_number": day_number}, {"$set": update})
    updated_day = db.workout_days.find_one({"day_number": day_number}, {"_id": 0})
    pct = calculate_day_completion(updated_day)
    w = float(updated_day.get("actual_weight_kg") or 90.0) if updated_day else 90.0
    calories = calculate_day_calories(updated_day, w) if updated_day else {}
    if updated_day:
        updated_day["calories"] = calories
    invalidate_routes_cache()
    return {
        "status": "success",
        "day_number": day_number,
        "completed": new_status,
        "completed_at": update["completed_at"],
        "completion_percentage": pct,
        "calories": calories,
        "day": updated_day
    }

@router.get("/stats")
def get_stats():
    """Calculate overall 90-day progress, streak, weight tracking, phase breakdowns with fast caching."""
    global _STATS_CACHE
    if _STATS_CACHE is not None:
        return _STATS_CACHE

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

    # Week breakdown
    weeks_stats = {}
    for w in range(1, 14):
        w_total = db.workout_days.count_documents({"week_number": w})
        w_done = db.workout_days.count_documents({"week_number": w, "completed": True})
        weeks_stats[str(w)] = {
            "week_number": w,
            "total": w_total,
            "completed": w_done,
            "pct": round((w_done / w_total * 100), 1) if w_total else 0.0
        }

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

    total_calories_burned = 0
    all_days = list(db.workout_days.find({}))
    for d in all_days:
        if d.get("completed"):
            w = float(d.get("actual_weight_kg") or current_weight or 90.0)
            c = calculate_day_calories(d, w)
            total_calories_burned += c.get("total_completed_kcal", 0)

    stats_result = {
        "total_days": total_days,
        "total_calories_burned": total_calories_burned,
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
        "weeks": weeks_stats,
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
    _STATS_CACHE = stats_result
    return stats_result

@router.get("/weight-history")
@router.get("/weight/history")
def get_weight_history():
    """Return historical weight logs and projected linear goal line with memory caching."""
    global _WEIGHT_CACHE
    if _WEIGHT_CACHE is not None:
        return _WEIGHT_CACHE

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

    result = {
        "start_weight": start_weight,
        "target_weight": target_weight,
        "logs": logs,
        "history": logs,
        "ideal_curve": ideal_curve
    }
    _WEIGHT_CACHE = result
    return result

@router.post("/weight-log")
@router.post("/weight")
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

    invalidate_routes_cache()
    return {"status": "success", "log": doc}

@router.delete("/weight/{day_num}")
@router.delete("/weight-log/{day_num}")
def delete_weight_log(day_num: int):
    """Delete a weight log entry."""
    db = get_db()
    db.weight_logs.delete_one({"day_number": day_num})
    invalidate_routes_cache()
    return {"status": "success"}

@router.post("/seed")
def trigger_seed(force: bool = False):
    """Re-seed the database from CSV."""
    invalidate_routes_cache()
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

