import logging
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import MONGODB_URI, DATABASE_NAME

logger = logging.getLogger("workout_app")

_client = None

def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=7000,
            maxPoolSize=25,
            retryWrites=True
        )
    return _client

def get_db():
    client = get_client()
    return client[DATABASE_NAME]

def get_collection(name: str):
    db = get_db()
    return db[name]

def check_connection() -> dict:
    try:
        client = get_client()
        client.admin.command('ping')
        db = get_db()
        collections = db.list_collection_names()
        return {
            "status": "connected",
            "database": DATABASE_NAME,
            "collections": collections,
            "error": None
        }
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return {
            "status": "disconnected",
            "database": DATABASE_NAME,
            "collections": [],
            "error": str(e)
        }

def init_indexes():
    """Ensure indexes on workout_days collection."""
    try:
        db = get_db()
        db.workout_days.create_index([("day_number", ASCENDING)], unique=True)
        db.workout_days.create_index([("week_number", ASCENDING)])
        db.workout_days.create_index([("phase", ASCENDING)])
        db.workout_days.create_index([("completed", ASCENDING)])
        db.weight_logs.create_index([("recorded_at", ASCENDING)])
        logger.info("MongoDB indexes verified.")
    except Exception as e:
        logger.warning(f"Error creating indexes: {e}")

