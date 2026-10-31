"""
Script to import the complete ExerciseDB dataset (1,324 exercises with animated GIFs)
into MongoDB Atlas collection `exercise_catalog`.
"""
import os
import json
import logging
from pymongo import ASCENDING, TEXT
from app.database import get_db

logger = logging.getLogger("workout_app")

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "exercisedb_1324.json")

def import_exercisedb_to_atlas():
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Exercise dump not found at {DATA_FILE}")

    print("Reading local ExerciseDB dump...")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    db = get_db()
    col = db["exercise_catalog"]

    docs = []
    for item in raw_data:
        ex_id = str(item.get("id", ""))
        name_raw = item.get("name", "")
        gif_path = item.get("gif_url", "")
        img_path = item.get("image", "")

        gif_cdn = f"https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/{gif_path}" if gif_path else ""
        img_cdn = f"https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/{img_path}" if img_path else ""

        inst = item.get("instructions")
        inst_en = ""
        if isinstance(inst, dict):
            inst_en = inst.get("en", "")
        elif isinstance(inst, list):
            inst_en = " ".join(inst)
        elif isinstance(inst, str):
            inst_en = inst

        doc = {
            "_id": f"ex_{ex_id}",
            "exercise_id": ex_id,
            "name": name_raw.title(),
            "body_part": item.get("body_part", "").title(),
            "target_muscle": item.get("target", "").title(),
            "secondary_muscles": [m.title() for m in item.get("secondary_muscles", [])],
            "equipment": item.get("equipment", "").title(),
            "category": item.get("category", "").title(),
            "instructions": inst_en,
            "gif_url": gif_cdn,
            "image_url": img_cdn,
            "video_query": f"how to do {name_raw} exercise proper form"
        }
        docs.append(doc)

    print(f"Uploading {len(docs)} exercises into MongoDB Atlas collection 'exercise_catalog'...")
    col.drop()
    col.insert_many(docs, ordered=False)

    col.create_index([("name", ASCENDING)])
    col.create_index([("body_part", ASCENDING)])
    col.create_index([("target_muscle", ASCENDING)])
    col.create_index([("equipment", ASCENDING)])

    total = col.count_documents({})
    print(f"MongoDB Atlas import complete! Total in 'exercise_catalog': {total}")
    return total

DATA_FILE_876 = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "free_exercise_db_876.json")

def import_free_exercise_db_to_atlas():
    if not os.path.exists(DATA_FILE_876):
        raise FileNotFoundError(f"Exercise dump not found at {DATA_FILE_876}")

    print("Reading local Free-Exercise-DB (876 exercises)...")
    with open(DATA_FILE_876, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    db = get_db()
    col = db["exercise_catalog_876"]

    cdn_base = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises"
    docs = []
    for item in raw_data:
        ex_id = str(item.get("id", ""))
        name_raw = item.get("name", "")
        images = [f"{cdn_base}/{img}" for img in item.get("images", [])]

        doc = {
            "_id": f"fedb_{ex_id}",
            "exercise_id": ex_id,
            "name": name_raw.title(),
            "force": (item.get("force") or "").lower(),
            "level": (item.get("level") or "Beginner").title(),
            "mechanic": (item.get("mechanic") or "Compound").title(),
            "equipment": (item.get("equipment") or "Body Only").title(),
            "category": (item.get("category") or "Strength").title(),
            "primary_muscles": [m.title() for m in (item.get("primaryMuscles") or []) if m],
            "secondary_muscles": [m.title() for m in (item.get("secondaryMuscles") or []) if m],
            "instructions": item.get("instructions") or [],
            "images": images,
            "video_query": f"how to do {name_raw} exercise proper form"
        }
        docs.append(doc)

    print(f"Uploading {len(docs)} exercises into MongoDB Atlas collection 'exercise_catalog_876'...")
    col.drop()
    col.insert_many(docs, ordered=False)

    col.create_index([("name", ASCENDING)])
    col.create_index([("level", ASCENDING)])
    col.create_index([("category", ASCENDING)])
    col.create_index([("equipment", ASCENDING)])

    total = col.count_documents({})
    print(f"MongoDB Atlas import complete! Total in 'exercise_catalog_876': {total}")
    return total

if __name__ == "__main__":
    import_exercisedb_to_atlas()
    import_free_exercise_db_to_atlas()

