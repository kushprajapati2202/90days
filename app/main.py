import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import router
from app.database import init_indexes, check_connection
from app.seeder import seed_database
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("workout_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure indexes and seed data if not present
    logger.info("Initializing 90-Day Workout Application...")
    conn = check_connection()
    if conn["status"] == "connected":
        logger.info("MongoDB Atlas connected successfully.")
        init_indexes()
        # Seed if empty
        from app.database import get_db
        db = get_db()
        if db.workout_days.count_documents({}) == 0:
            logger.info("Database empty, running initial seed...")
            seed_database()
    else:
        logger.warning(f"Could not connect to MongoDB Atlas at startup: {conn.get('error')}")
    yield
    logger.info("Shutting down 90-Day Workout Application.")

app = FastAPI(
    title="90-Day Fat-Loss & Strength Tracker",
    description="Full-stack tracker for the 90-day transformation plan with MongoDB Atlas backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def fix_vercel_path(request: Request, call_next):
    # Restore original path if rewritten by Vercel serverless functions
    matched_path = request.headers.get("x-matched-path") or request.headers.get("x-invoke-path")
    if matched_path:
        clean_path = matched_path.split("?")[0]
        if not clean_path.startswith("/api") and not clean_path.startswith("/docs") and not clean_path.startswith("/openapi") and not clean_path.startswith("/static"):
            clean_path = f"/api{clean_path}"
        request.scope["path"] = clean_path
    elif request.scope.get("path", "").startswith("/api/index.py"):
        subpath = request.scope["path"][len("/api/index.py"):]
        if not subpath.startswith("/api") and not subpath.startswith("/docs") and not subpath.startswith("/openapi") and not subpath.startswith("/static"):
            subpath = f"/api{subpath}" if subpath else "/api"
        request.scope["path"] = subpath
    return await call_next(request)

# Register API router
app.include_router(router)

# Mount static files (support both /style.css and /static/style.css)
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static_dir")
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static_root")

