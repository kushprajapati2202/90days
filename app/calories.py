"""Scientific calorie expenditure calculation module based on the Compendium of Physical Activities (Ainsworth et al.).
Endorsed by the American College of Sports Medicine (ACSM).

Energy Expenditure Formula:
    kcal / min = (MET * 3.5 * weight_kg) / 200
    Total kcal = kcal / min * duration_minutes
"""

import re
from typing import Dict, Any, List, Optional

# MET Reference Database (Compendium of Physical Activities)
MET_COMPOUND_HEAVY = 6.0     # Barbell Squats, Deadlifts, Heavy Presses, Rows
MET_COMPOUND_MODERATE = 5.0  # Lat pulldowns, Cable rows, Dumbbell presses
MET_ISOLATION = 3.8          # Bicep curls, Lateral raises, Tricep pushdowns, Leg curls
MET_BODYWEIGHT_HIIT = 7.5    # Burpees, Mountain climbers, Jump jacks, High knees
MET_BODYWEIGHT_STANDARD = 6.0 # Push-ups, Bodyweight squats
MET_CORE_HOLDS = 4.0         # Planks, Deadbugs, Bird dogs
MET_CARDIO_INCLINE_WALK = 5.3 # Treadmill incline brisk walk (4.5–5.5 km/h @ 3-5%)
MET_CARDIO_ELLIPTICAL = 6.8  # Cross trainer / elliptical moderate-vigorous
MET_CARDIO_BIKE = 6.5        # Stationary cycle moderate
MET_CARDIO_SKIP = 9.0        # Fast jump rope
MET_WARMUP_DYNAMIC = 3.2     # Dynamic mobility & activation
MET_COOLDOWN_STATIC = 2.5    # Static cool-down stretching
MET_RECOVERY_WALK = 3.5      # Relaxed recovery walk

def get_exercise_met(name: str) -> float:
    """Return validated MET value for a strength or conditioning movement."""
    if not name:
        return MET_ISOLATION
    lower = name.lower()

    # High Intensity Bodyweight
    if any(k in lower for k in ["burpee", "jumping jack", "mountain climber", "high knee", "box jump", "skipping"]):
        return MET_BODYWEIGHT_HIIT

    # Core Holds
    if any(k in lower for k in ["plank", "deadbug", "bird dog", "bird-dog", "hollow", "vacuum"]):
        return MET_CORE_HOLDS

    # Heavy Compound Lifts
    compound_heavy_keywords = [
        "squat", "deadlift", "bench press", "incline bench", "barbell row", 
        "overhead press", "military press", "shoulder press", "pull-up", 
        "pull up", "chin-up", "chin up", "dip", "leg press", "hack squat", 
        "romanian deadlift", "rdl", "hip thrust", "clean"
    ]
    if any(k in lower for k in compound_heavy_keywords):
        return MET_COMPOUND_HEAVY

    # Moderate Compound Lifts
    compound_mod_keywords = [
        "lat pulldown", "pulldown", "cable row", "t-bar", "chest press", 
        "dumbbell press", "incline dumbbell", "lunge", "split squat", 
        "push-up", "push up", "pec deck", "cable crossover"
    ]
    if any(k in lower for k in compound_mod_keywords):
        return MET_COMPOUND_MODERATE

    # Isolation Lifts
    return MET_ISOLATION

def calculate_set_calories(exercise_name: str, weight_kg: float = 90.0) -> float:
    """Calculate calories burned during 1 working set (active strain + inter-set recovery EPOC).
    1 heavy compound set ~ 1.0 min effective metabolic strain (approx 4.8 - 6.0 kcal).
    1 isolation set ~ 0.8 min effective metabolic strain (approx 2.5 - 3.5 kcal)."""
    met = get_exercise_met(exercise_name)
    rate_per_min = (met * 3.5 * weight_kg) / 200.0
    effective_mins = 1.0 if met >= 5.0 else 0.8
    return round(rate_per_min * effective_mins, 1)

def calculate_exercise_calories(exercise: dict, weight_kg: float = 90.0) -> dict:
    """Calculate estimated total and completed calories for a parsed exercise."""
    name = exercise.get("name") or exercise.get("raw") or "Exercise"
    sets = exercise.get("logged_sets") or []
    target = exercise.get("target") or ""

    if not sets:
        m = re.match(r"^(\d+)", target)
        planned_sets = int(m.group(1)) if m else 3
    else:
        planned_sets = len(sets)

    set_burn = calculate_set_calories(name, weight_kg)
    total_kcal = round(set_burn * max(1, planned_sets))

    completed_sets_count = sum(1 for s in sets if s.get("completed"))
    completed_kcal = round(set_burn * completed_sets_count)

    return {
        "name": name,
        "met": get_exercise_met(name),
        "set_burn_kcal": set_burn,
        "total_sets": planned_sets,
        "completed_sets": completed_sets_count,
        "total_kcal": total_kcal,
        "completed_kcal": completed_kcal
    }

def calculate_cardio_calories(cardio_text: str, is_completed: bool = False, weight_kg: float = 90.0) -> dict:
    """Calculate calories burned for cardio protocol based on duration and machine type."""
    if not cardio_text or "none" in cardio_text.lower() or "optional" in cardio_text.lower():
        return {"total_kcal": 0, "completed_kcal": 0, "duration_min": 0, "met": 0.0}

    lower = cardio_text.lower()
    met = MET_CARDIO_INCLINE_WALK
    if "cross trainer" in lower or "elliptical" in lower:
        met = MET_CARDIO_ELLIPTICAL
    elif "cycle" in lower or "bike" in lower:
        met = MET_CARDIO_BIKE
    elif "skip" in lower or "jump rope" in lower:
        met = MET_CARDIO_SKIP

    duration = 20
    m_range = re.search(r"(\d+)\s*[-–]\s*(\d+)\s*min", lower)
    if m_range:
        duration = int(m_range.group(1))
    else:
        m_single = re.search(r"(\d+)\s*min", lower)
        if m_single:
            duration = int(m_single.group(1))

    rate = (met * 3.5 * weight_kg) / 200.0
    total_kcal = round(rate * duration)
    completed_kcal = total_kcal if is_completed else 0

    return {
        "met": met,
        "duration_min": duration,
        "rate_per_min": round(rate, 1),
        "total_kcal": total_kcal,
        "completed_kcal": completed_kcal
    }

def calculate_conditioning_calories(conditioning_text: str, is_completed: bool = False, weight_kg: float = 90.0) -> dict:
    """Calculate calories for bodyweight conditioning circuit (default ~7-8 mins)."""
    if not conditioning_text or "optional" in conditioning_text.lower() or "no conditioning" in conditioning_text.lower():
        return {"total_kcal": 0, "completed_kcal": 0, "duration_min": 0, "met": 0.0}

    # Circuit duration estimation: ~2 mins per station/movement
    items = [p.strip() for p in conditioning_text.split(";") if p.strip()]
    duration = max(5, min(15, len(items) * 2)) if items else 7
    met = MET_BODYWEIGHT_HIIT

    rate = (met * 3.5 * weight_kg) / 200.0
    total_kcal = round(rate * duration)
    completed_kcal = total_kcal if is_completed else 0

    return {
        "met": met,
        "duration_min": duration,
        "total_kcal": total_kcal,
        "completed_kcal": completed_kcal
    }

def calculate_warmup_calories(warmup_stretches: list, weight_kg: float = 90.0) -> dict:
    """Calculate dynamic warm-up calorie burn (~4-5 mins routine, ~5 kcal per stretch)."""
    count = len(warmup_stretches) if warmup_stretches else 5
    per_stretch = round((MET_WARMUP_DYNAMIC * 3.5 * weight_kg / 200.0) * 1.0, 1) # ~1 min each
    total_kcal = round(per_stretch * count)

    completed_count = sum(1 for s in warmup_stretches if s.get("completed")) if warmup_stretches else 0
    completed_kcal = round(per_stretch * completed_count)

    return {
        "count": count,
        "completed_count": completed_count,
        "per_stretch_kcal": per_stretch,
        "total_kcal": total_kcal,
        "completed_kcal": completed_kcal
    }

def calculate_cooldown_calories(cooldown_stretches: list, weight_kg: float = 90.0) -> dict:
    """Calculate static cool-down stretching calorie burn (~4 mins routine)."""
    count = len(cooldown_stretches) if cooldown_stretches else 5
    per_stretch = round((MET_COOLDOWN_STATIC * 3.5 * weight_kg / 200.0) * 0.8, 1)
    total_kcal = round(per_stretch * count)

    completed_count = sum(1 for s in cooldown_stretches if s.get("completed")) if cooldown_stretches else 0
    completed_kcal = round(per_stretch * completed_count)

    return {
        "count": count,
        "completed_count": completed_count,
        "per_stretch_kcal": per_stretch,
        "total_kcal": total_kcal,
        "completed_kcal": completed_kcal
    }

def calculate_day_calories(day: dict, weight_kg: float = 90.0) -> dict:
    """Calculate comprehensive calorie expenditure for a full day workout.
    Returns breakdown across warm-up, strength lifts, conditioning, cardio, and cool-down."""
    if not day:
        return {
            "total_estimated_kcal": 0,
            "total_completed_kcal": 0,
            "breakdown": {}
        }

    # 1. Warm-up
    warmups = day.get("warmup_stretches") or []
    warmup_res = calculate_warmup_calories(warmups, weight_kg)

    # 2. Strength Lifts
    exercises = day.get("parsed_exercises") or []
    ex_results = [calculate_exercise_calories(ex, weight_kg) for ex in exercises]
    strength_total = sum(r["total_kcal"] for r in ex_results)
    strength_completed = sum(r["completed_kcal"] for r in ex_results)

    # 3. Conditioning
    cond_text = day.get("bodyweight_conditioning") or ""
    cond_done = bool(day.get("conditioning_completed"))
    cond_res = calculate_conditioning_calories(cond_text, cond_done, weight_kg)

    # 4. Cardio
    cardio_text = day.get("cardio") or ""
    cardio_done = bool(day.get("cardio_completed"))
    cardio_res = calculate_cardio_calories(cardio_text, cardio_done, weight_kg)

    # 5. Cool-down
    cooldowns = day.get("cooldown_stretches") or []
    cooldown_res = calculate_cooldown_calories(cooldowns, weight_kg)

    total_est = (
        warmup_res["total_kcal"] + 
        strength_total + 
        cond_res["total_kcal"] + 
        cardio_res["total_kcal"] + 
        cooldown_res["total_kcal"]
    )

    total_done = (
        warmup_res["completed_kcal"] + 
        strength_completed + 
        cond_res["completed_kcal"] + 
        cardio_res["completed_kcal"] + 
        cooldown_res["completed_kcal"]
    )

    # Active Recovery Days (Relaxed walk)
    if total_est == 0 and "recovery" in (day.get("day_type") or "").lower():
        total_est = round((MET_RECOVERY_WALK * 3.5 * weight_kg / 200.0) * 30) # 30 min recovery walk ~ 165 kcal
        total_done = total_est if day.get("completed") else 0

    return {
        "weight_used_kg": weight_kg,
        "total_estimated_kcal": total_est,
        "total_completed_kcal": total_done,
        "exercises": ex_results,
        "breakdown": {
            "warmup": warmup_res,
            "strength": {"total_kcal": strength_total, "completed_kcal": strength_completed},
            "conditioning": cond_res,
            "cardio": cardio_res,
            "cooldown": cooldown_res
        }
    }
