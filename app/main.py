import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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

@app.get("/api")
@app.get("/api/index.py")
def root_api(request: Request):
    return {
        "status": "connected",
        "scope_path": request.scope.get("path"),
        "raw_path": request.scope.get("raw_path", b"").decode("utf-8", "ignore"),
        "headers": dict(request.headers),
        "url": str(request.url),
    }

# Register API router across standard and serverless prefixes
app.include_router(router, prefix="/api")
app.include_router(router, prefix="")
app.include_router(router, prefix="/api/index.py/api")
app.include_router(router, prefix="/api/index.py")

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": f"Route '{request.scope.get('path')}' not found on server",
            "scope_path": request.scope.get("path")
        }
    )

# Mount static files (support both /style.css and /static/style.css)
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static_dir")
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static_root")

