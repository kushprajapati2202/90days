from typing import Optional, List, Any
from pydantic import BaseModel, Field

class StretchItem(BaseModel):
    name: str
    reps_or_time: Optional[str] = ""
    focus: Optional[str] = ""
    completed: bool = False

class ExerciseLogSet(BaseModel):
    set_num: int
    weight_kg: Optional[float] = None
    reps: Optional[int] = None
    completed: bool = False

class ExerciseItem(BaseModel):
    raw: Optional[str] = ""
    name: str
    target: Optional[str] = ""
    logged_sets: Optional[List[dict]] = []

class DayUpdateModel(BaseModel):
    completed: Optional[bool] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    actual_weight_kg: Optional[float] = None
    actual_steps: Optional[int] = None
    actual_duration_min: Optional[int] = None
    rpe_rating: Optional[float] = None
    user_notes: Optional[str] = None
    parsed_exercises: Optional[List[dict]] = None
    warmup_stretches: Optional[List[dict]] = None
    cooldown_stretches: Optional[List[dict]] = None
    conditioning_completed: Optional[bool] = None
    cardio_completed: Optional[bool] = None

class ProfileUpdateModel(BaseModel):
    user_name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    start_weight_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    gym_timing: Optional[str] = None
    structure: Optional[str] = None
    philosophy: Optional[str] = None
    intensity_guide: Optional[str] = None

class WeightLogCreateModel(BaseModel):
    day_number: Optional[int] = None
    weight_kg: float
    notes: Optional[str] = ""
    date_display: Optional[str] = None
    time_of_day: Optional[str] = "auto"
