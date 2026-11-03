"""
Unified Exercise Catalog Service.
Combines and normalizes all 2,200+ exercises across MongoDB Atlas collections:
- exercise_catalog_876 (Free-Exercise-DB: 876 rich exercises with CDN photos and multi-step instructions)
- exercise_catalog (ExerciseDB: 1,324 exercises with demonstration GIFs and anatomy targets)
- EXERCISE_MEDIA_DATABASE (64 core plan exercises)
"""

import re
import logging
from typing import Optional, Dict, List, Any
from app.database import get_db
from app.exercise_media import EXERCISE_MEDIA_DATABASE, STRETCHES_AND_CARDIO_DATABASE

logger = logging.getLogger("workout_app")

_CACHED_CATALOG: Optional[List[Dict[str, Any]]] = None

def map_body_group(category: Optional[str] = None, primary_muscles: Optional[List[str]] = None, body_part: Optional[str] = None, target_muscle: Optional[str] = None) -> str:
    """Normalize body group / muscle category into standard UI buckets."""
    parts = []
    if category:
        parts.append(str(category))
    if body_part:
        parts.append(str(body_part))
    if target_muscle:
        parts.append(str(target_muscle))
    if primary_muscles:
        parts.extend([str(m) for m in primary_muscles])
    text = " ".join(parts).lower()

    if any(k in text for k in ["chest", "pectoral", "pecs"]):
        return "Chest"
    if any(k in text for k in ["back", "lats", "latissimus", "middle back", "lower back", "upper back", "traps", "trapezius", "spine"]):
        return "Back"
    if any(k in text for k in ["shoulder", "deltoid", "delts", "neck", "levator"]):
        return "Shoulders"
    if any(k in text for k in ["bicep", "tricep", "forearm", "upper arms", "lower arms", "arm"]):
        return "Arms"
    if any(k in text for k in ["quad", "quadriceps", "hamstring", "glute", "calf", "calves", "upper legs", "lower legs", "abductor", "adductor", "leg"]):
        return "Legs & Glutes"
    if any(k in text for k in ["abs", "abdominal", "waist", "core", "serratus", "oblique"]):
        return "Core / Abs"
    if any(k in text for k in ["cardio", "plyometric", "cardiovascular"]):
        return "Cardio"
    if any(k in text for k in ["stretch", "mobility", "flexibility"]):
        return "Stretching"
    return "Strength & Other"

def normalize_equipment(eq: Optional[str]) -> str:
    """Normalize equipment into standard UI filter categories."""
    eq_str = (eq or "").lower()
    if "barbell" in eq_str or "olympic" in eq_str:
        return "Barbell"
    if "dumbbell" in eq_str:
        return "Dumbbell"
    if "cable" in eq_str:
        return "Cable"
    if any(k in eq_str for k in ["machine", "leverage", "smith", "sled", "assisted"]):
        return "Machine"
    if any(k in eq_str for k in ["body", "none"]):
        return "Bodyweight"
    if any(k in eq_str for k in ["band", "kettlebell", "ball", "rope", "wheel"]):
        return "Kettlebell & Bands"
    return "Other"

def split_cues(instructions: Any) -> List[str]:
    """Ensure instructions are a list of clean step strings."""
    if isinstance(instructions, list):
        return [str(s).strip() for s in instructions if str(s).strip()]
    if isinstance(instructions, str) and instructions.strip():
        # Split on sentence boundaries or numbering
        parts = re.split(r'(?:\.\s+|\n+|\r+)', instructions)
        return [p.strip() for p in parts if len(p.strip()) > 3]
    return []

def build_unified_catalog() -> List[Dict[str, Any]]:
    """Build unified index of all exercises across collections."""
    global _CACHED_CATALOG
    catalog_map: Dict[str, Dict[str, Any]] = {}

    # 1. Start with 64 Core Plan exercises (top priority metadata)
    for k, v in EXERCISE_MEDIA_DATABASE.items():
        name = v.get("display_name") or v.get("name") or k
        key = name.strip().lower()
        catalog_map[key] = {
            "id": v.get("id", k),
            "name": name,
            "display_name": name,
            "category": v.get("category", "Strength"),
            "body_group": map_body_group(category=v.get("category"), primary_muscles=v.get("primary_muscles")),
            "equipment": normalize_equipment(v.get("equipment")),
            "raw_equipment": v.get("equipment") or "Gym Equipment",
            "level": "Plan Core",
            "primary_muscles": v.get("primary_muscles") or [],
            "secondary_muscles": v.get("secondary_muscles") or [],
            "images": v.get("images") or [],
            "form_cues": split_cues(v.get("form_cues") or v.get("instructions")),
            "video_query": v.get("video_query") or f"how to do {name} proper form",
            "is_plan": True,
        }

    for k, v in STRETCHES_AND_CARDIO_DATABASE.items():
        name = v.get("display_name") or v.get("name") or k
        key = name.strip().lower()
        if key not in catalog_map:
            catalog_map[key] = {
                "id": v.get("id", k),
                "name": name,
                "display_name": name,
                "category": v.get("category", "Stretching"),
                "body_group": map_body_group(category=v.get("category"), primary_muscles=v.get("primary_muscles")),
                "equipment": normalize_equipment(v.get("equipment")),
                "raw_equipment": v.get("equipment") or "Bodyweight",
                "level": "Plan Core",
                "primary_muscles": v.get("primary_muscles") or [],
                "secondary_muscles": v.get("secondary_muscles") or [],
                "images": v.get("images") or [],
                "form_cues": split_cues(v.get("form_cues") or v.get("instructions")),
                "video_query": v.get("video_query") or f"how to do {name} proper form",
                "is_plan": True,
            }

    # 2. Ingest Free-Exercise-DB (876 exercises with dual CDN photos)
    try:
        db = get_db()
        docs_876 = list(db["exercise_catalog_876"].find({}, {"_id": 0}))
        for d in docs_876:
            name = (d.get("name") or "").strip()
            if not name:
                continue
            key = name.lower()

            cues = split_cues(d.get("instructions"))
            imgs = [img for img in (d.get("images") or []) if img]
            prim = d.get("primary_muscles") or []
            sec = d.get("secondary_muscles") or []
            cat = d.get("category") or "Strength"
            eq = d.get("equipment")
            level = d.get("level") or "Beginner"

            if key in catalog_map:
                # Enrich existing plan exercise with CDN images if missing
                item = catalog_map[key]
                if not item.get("images"):
                    item["images"] = imgs
                if not item.get("form_cues") and cues:
                    item["form_cues"] = cues
            else:
                catalog_map[key] = {
                    "id": d.get("exercise_id") or key,
                    "name": name,
                    "display_name": name,
                    "category": cat,
                    "body_group": map_body_group(category=cat, primary_muscles=prim),
                    "equipment": normalize_equipment(eq),
                    "raw_equipment": eq or "Equipment",
                    "level": level,
                    "primary_muscles": prim,
                    "secondary_muscles": sec,
                    "images": imgs,
                    "form_cues": cues,
                    "video_query": d.get("video_query") or f"how to do {name} proper form",
                    "is_plan": False,
                }
    except Exception as e:
        logger.warning(f"Catalog 876 ingest warning: {e}")

    # 3. Ingest ExerciseDB (1,324 exercises with GIF demos)
    try:
        db = get_db()
        docs_1324 = list(db["exercise_catalog"].find({}, {"_id": 0}))
        for d in docs_1324:
            name = (d.get("name") or "").strip()
            if not name:
                continue
            key = name.lower()

            imgs = []
            if d.get("gif_url"):
                imgs.append(d["gif_url"])
            if d.get("image_url") and d["image_url"] not in imgs:
                imgs.append(d["image_url"])

            cues = split_cues(d.get("instructions"))
            prim = [d["target_muscle"].capitalize()] if d.get("target_muscle") else []
            sec = [m.capitalize() for m in (d.get("secondary_muscles") or [])]
            body_part = d.get("body_part") or "Strength"
            eq = d.get("equipment")

            if key in catalog_map:
                # Merge: add GIF animation and alternate photos
                item = catalog_map[key]
                if d.get("gif_url"):
                    item["gif_url"] = d["gif_url"]
                    # If item has no images or only 1, insert GIF
                    if d["gif_url"] not in item["images"]:
                        item["images"].append(d["gif_url"])
                if not item.get("form_cues") and cues:
                    item["form_cues"] = cues
            else:
                display = name.title()
                catalog_map[key] = {
                    "id": d.get("exercise_id") or key,
                    "name": display,
                    "display_name": display,
                    "category": body_part,
                    "body_group": map_body_group(body_part=body_part, target_muscle=d.get("target_muscle")),
                    "equipment": normalize_equipment(eq),
                    "raw_equipment": eq or "Gym Equipment",
                    "level": "All Levels",
                    "primary_muscles": prim,
                    "secondary_muscles": sec,
                    "images": imgs,
                    "gif_url": d.get("gif_url"),
                    "form_cues": cues,
                    "video_query": d.get("video_query") or f"how to do {display} proper form",
                    "is_plan": False,
                }
    except Exception as e:
        logger.warning(f"Catalog 1324 ingest warning: {e}")

    unified_list = list(catalog_map.values())
    # Sort: Plan exercises first, then alphabetical by name
    unified_list.sort(key=lambda x: (not x.get("is_plan", False), x.get("name", "").lower()))
    _CACHED_CATALOG = unified_list
    logger.info(f"Loaded unified exercise vault: {len(unified_list)} total exercises")
    return unified_list

def get_cached_catalog() -> List[Dict[str, Any]]:
    """Return in-memory cached catalog or initialize it."""
    global _CACHED_CATALOG
    if _CACHED_CATALOG is None:
        return build_unified_catalog()
    return _CACHED_CATALOG

def query_vault(
    group: Optional[str] = None,
    equipment: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 48
) -> Dict[str, Any]:
    """
    Search and filter across the complete 2,200+ exercise library.
    Defaults to returning ALL exercises when no filters are set.
    """
    catalog = get_cached_catalog()

    filtered = catalog

    # 1. Body / Muscle Group filter
    if group and group.lower() not in ["all", ""]:
        grp_lower = group.lower()
        if grp_lower in ["legs", "glutes", "legs & glutes"]:
            filtered = [e for e in filtered if e.get("body_group") == "Legs & Glutes"]
        elif grp_lower in ["core", "abs", "core / abs", "waist"]:
            filtered = [e for e in filtered if e.get("body_group") == "Core / Abs"]
        else:
            filtered = [e for e in filtered if e.get("body_group", "").lower() == grp_lower]

    # 2. Equipment filter
    if equipment and equipment.lower() not in ["all", "all equipment", ""]:
        eq_lower = equipment.lower()
        filtered = [
            e for e in filtered
            if e.get("equipment", "").lower() == eq_lower or eq_lower in (e.get("raw_equipment") or "").lower()
        ]

    # 3. Search query
    if search and search.strip():
        q = search.lower().strip()
        filtered = [
            e for e in filtered
            if (
                q in e.get("name", "").lower()
                or q in e.get("display_name", "").lower()
                or q in e.get("equipment", "").lower()
                or q in (e.get("raw_equipment") or "").lower()
                or q in e.get("body_group", "").lower()
                or q in e.get("category", "").lower()
                or any(q in m.lower() for m in e.get("primary_muscles", []))
                or any(q in m.lower() for m in e.get("secondary_muscles", []))
            )
        ]

    total = len(filtered)
    paged = filtered[skip : skip + limit]

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total,
        "exercises": paged,
    }

def get_vault_filters() -> Dict[str, Any]:
    """Return counts for every category and equipment type across the full catalog."""
    catalog = get_cached_catalog()
    groups: Dict[str, int] = {}
    equipment: Dict[str, int] = {}

    for e in catalog:
        bg = e.get("body_group") or "Strength & Other"
        groups[bg] = groups.get(bg, 0) + 1

        eq = e.get("equipment") or "Other"
        equipment[eq] = equipment.get(eq, 0) + 1

    return {
        "total": len(catalog),
        "groups": groups,
        "equipment": equipment,
    }
