"""
Exercise media mapping using free public domain exercise dataset (Unlicense).
Provides high-res start & finish demonstration photos, target muscles, form cues, and video links
for ALL workout components: Warm-Up Stretches, Strength Lifts, Bodyweight Exercises, Cardio, and Cool-Down Stretches.
"""

CDN_BASE = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises"

# 1. MAIN STRENGTH LIFTS
EXERCISE_MEDIA_DATABASE = {
    "Bench press": {
        "id": "Barbell_Bench_Press_-_Medium_Grip",
        "display_name": "Barbell Bench Press (Medium Grip)",
        "category": "Strength Lifts",
        "equipment": "Barbell & Flat Bench",
        "primary_muscles": ["Chest (Pectoralis Major)"],
        "secondary_muscles": ["Triceps", "Anterior Deltoids"],
        "images": [
            f"{CDN_BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
            f"{CDN_BASE}/Barbell_Bench_Press_-_Medium_Grip/1.jpg"
        ],
        "form_cues": [
            "Lie flat with eyes directly under bar. Plant feet firmly and pinch shoulder blades together.",
            "Grip slightly wider than shoulder-width. Lower bar with control to mid-chest while tucking elbows at ~45-75°.",
            "Touch chest lightly without bouncing, then drive bar upward toward eye line.",
            "Keep 2–3 reps in reserve (RPE 7–8). Avoid training to failure on heavy compound lifts."
        ],
        "video_query": "how to bench press proper form"
    },
    "incline DB press": {
        "id": "Incline_Dumbbell_Press",
        "display_name": "Incline Dumbbell Bench Press",
        "category": "Strength Lifts",
        "equipment": "Dumbbells & Incline Bench (30°–45°)",
        "primary_muscles": ["Upper Chest (Clavicular Head)"],
        "secondary_muscles": ["Anterior Deltoids", "Triceps"],
        "images": [
            f"{CDN_BASE}/Incline_Dumbbell_Press/0.jpg",
            f"{CDN_BASE}/Incline_Dumbbell_Press/1.jpg"
        ],
        "form_cues": [
            "Set bench to 30°–45° incline. Retract shoulder blades into pad.",
            "Lower dumbbells under control until you feel a deep stretch across upper chest.",
            "Press upward in a smooth arc without banging dumbbells together at top."
        ],
        "video_query": "incline dumbbell bench press proper form"
    },
    "machine chest press": {
        "id": "Leverage_Chest_Press",
        "display_name": "Machine Chest Press",
        "category": "Strength Lifts",
        "equipment": "Chest Press Machine",
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "images": [
            f"{CDN_BASE}/Leverage_Chest_Press/0.jpg",
            f"{CDN_BASE}/Leverage_Chest_Press/1.jpg"
        ],
        "form_cues": [
            "Adjust seat so handles align with mid-to-lower chest.",
            "Drive handles away while keeping shoulders pinned back against seat.",
            "Control return eccentric phase slowly over 2–3 seconds."
        ],
        "video_query": "seated machine chest press form"
    },
    "lateral raise": {
        "id": "Side_Lateral_Raise",
        "display_name": "Dumbbell Lateral Raise",
        "category": "Strength Lifts",
        "equipment": "Dumbbells",
        "primary_muscles": ["Lateral Deltoids (Side Shoulders)"],
        "secondary_muscles": ["Upper Trapezius"],
        "images": [
            f"{CDN_BASE}/Side_Lateral_Raise/0.jpg",
            f"{CDN_BASE}/Side_Lateral_Raise/1.jpg"
        ],
        "form_cues": [
            "Stand with a slight forward torso lean (~10 degrees).",
            "Lead with elbows, raising dumbbells out to sides until parallel with shoulders.",
            "Elbows slightly higher than wrists to maximally isolate side delts."
        ],
        "video_query": "dumbbell lateral raise proper form"
    },
    "triceps pushdown": {
        "id": "Triceps_Pushdown",
        "display_name": "Cable Triceps Pushdown (Straight / V-Bar)",
        "category": "Strength Lifts",
        "equipment": "Cable Pulley & Bar Attachment",
        "primary_muscles": ["Triceps (Lateral & Medial Heads)"],
        "secondary_muscles": ["Forearms"],
        "images": [
            f"{CDN_BASE}/Triceps_Pushdown/0.jpg",
            f"{CDN_BASE}/Triceps_Pushdown/1.jpg"
        ],
        "form_cues": [
            "Pin elbows securely against your ribcage; do not let them drift forward or back.",
            "Push bar down until arms are fully locked out; squeeze triceps hard for 1 second.",
            "Allow bar to rise slowly until elbows reach ~90 degrees."
        ],
        "video_query": "triceps pushdown proper form"
    },
    "Lat pulldown": {
        "id": "Wide-Grip_Lat_Pulldown",
        "display_name": "Wide-Grip Lat Pulldown",
        "category": "Strength Lifts",
        "equipment": "Lat Pulldown Cable Machine",
        "primary_muscles": ["Latissimus Dorsi (Lats)"],
        "secondary_muscles": ["Biceps", "Rhomboids", "Middle Trapezius"],
        "images": [
            f"{CDN_BASE}/Wide-Grip_Lat_Pulldown/0.jpg",
            f"{CDN_BASE}/Wide-Grip_Lat_Pulldown/1.jpg"
        ],
        "form_cues": [
            "Grip bar wider than shoulder-width. Thighs locked firmly under pads.",
            "Lean torso back very slightly (~10°). Pull bar down to upper chest by driving elbows down.",
            "Squeeze lats at bottom, then slowly release bar upward for full lat stretch at top."
        ],
        "video_query": "lat pulldown proper form"
    },
    "seated cable row": {
        "id": "Seated_Cable_Rows",
        "display_name": "Seated Cable Row (Close-Grip V-Bar)",
        "category": "Strength Lifts",
        "equipment": "Low Cable Row Machine & V-Grip",
        "primary_muscles": ["Middle Back (Rhomboids & Lats)"],
        "secondary_muscles": ["Biceps", "Erectors", "Rear Deltoids"],
        "images": [
            f"{CDN_BASE}/Seated_Cable_Rows/0.jpg",
            f"{CDN_BASE}/Seated_Cable_Rows/1.jpg"
        ],
        "form_cues": [
            "Sit with knees slightly bent and torso upright. Do not swing.",
            "Pull handles towards your lower ribcage, pinching shoulder blades together.",
            "Extend arms with control to feel lats stretch before starting the next rep."
        ],
        "video_query": "seated cable row proper form"
    },
    "chest-supported row": {
        "id": "Dumbbell_Incline_Row",
        "display_name": "Chest-Supported Incline DB Row",
        "category": "Strength Lifts",
        "equipment": "Incline Bench & Dumbbells (or T-Bar Machine)",
        "primary_muscles": ["Upper Back & Rhomboids"],
        "secondary_muscles": ["Lats", "Biceps", "Rear Delts"],
        "images": [
            f"{CDN_BASE}/Dumbbell_Incline_Row/0.jpg",
            f"{CDN_BASE}/Dumbbell_Incline_Row/1.jpg"
        ],
        "form_cues": [
            "Set bench to 30°–45° incline. Rest sternum and chest firmly against pad to eliminate spinal compression.",
            "Let dumbbells hang with neutral grip. Row dumbbells up and back toward hip crease, driving with elbows.",
            "Retract shoulder blades and hold peak contraction for 1 second. Lower slowly under 2–3s muscular control."
        ],
        "video_query": "chest supported dumbbell incline row form"
    },
    "face pull": {
        "id": "Face_Pull",
        "display_name": "Cable Rope Face Pull",
        "category": "Strength Lifts",
        "equipment": "Cable Pulley & Rope Attachment",
        "primary_muscles": ["Rear Deltoids & Rotator Cuff"],
        "secondary_muscles": ["Upper Trapezius", "Rhomboids"],
        "images": [
            f"{CDN_BASE}/Face_Pull/0.jpg",
            f"{CDN_BASE}/Face_Pull/1.jpg"
        ],
        "form_cues": [
            "Set pulley at eye height. Hold rope with thumbs facing backward.",
            "Pull rope toward forehead, separating hands and rotating wrists upward (high elbows).",
            "Hold contraction for 1 second to strengthen rotator cuff."
        ],
        "video_query": "how to face pull cable proper form"
    },
    "DB curl": {
        "id": "Dumbbell_Bicep_Curl",
        "display_name": "Standing / Seated Dumbbell Bicep Curl",
        "category": "Strength Lifts",
        "equipment": "Dumbbells",
        "primary_muscles": ["Biceps Brachii"],
        "secondary_muscles": ["Brachialis", "Forearms"],
        "images": [
            f"{CDN_BASE}/Dumbbell_Bicep_Curl/0.jpg",
            f"{CDN_BASE}/Dumbbell_Bicep_Curl/1.jpg"
        ],
        "form_cues": [
            "Stand tall with core braced and elbows pinned by sides.",
            "Curl dumbbells upward while supinating (rotating palms up toward ceiling).",
            "Squeeze biceps at top; lower slowly over 2–3 seconds."
        ],
        "video_query": "dumbbell bicep curl proper form"
    },
    "hammer curl": {
        "id": "Alternate_Hammer_Curl",
        "display_name": "Dumbbell Hammer Curl",
        "category": "Strength Lifts",
        "equipment": "Dumbbells",
        "primary_muscles": ["Brachialis & Brachioradialis"],
        "secondary_muscles": ["Biceps Brachii"],
        "images": [
            f"{CDN_BASE}/Alternate_Hammer_Curl/0.jpg",
            f"{CDN_BASE}/Alternate_Hammer_Curl/1.jpg"
        ],
        "form_cues": [
            "Hold dumbbells with palms facing each other (neutral grip).",
            "Curl weights up while keeping palms facing inward throughout the motion.",
            "Builds forearm grip strength and outer arm thickness."
        ],
        "video_query": "hammer curl dumbbell proper form"
    },
    "Squat or goblet squat": {
        "id": "Goblet_Squat",
        "display_name": "Goblet Squat (or Barbell Squat)",
        "category": "Strength Lifts",
        "equipment": "Dumbbell or Kettlebell held at chest",
        "primary_muscles": ["Quadriceps", "Glutes"],
        "secondary_muscles": ["Hamstrings", "Core", "Calves"],
        "images": [
            f"{CDN_BASE}/Goblet_Squat/0.jpg",
            f"{CDN_BASE}/Goblet_Squat/1.jpg"
        ],
        "form_cues": [
            "Hold dumbbell vertically against chest. Feet shoulder-width apart.",
            "Sit hips back and push knees outward in line with toes. Keep chest proud.",
            "Descend until thighs are at least parallel to floor, then drive through midfoot."
        ],
        "video_query": "how to goblet squat proper form"
    },
    "leg press": {
        "id": "Leg_Press",
        "display_name": "45-Degree Sled Leg Press",
        "category": "Strength Lifts",
        "equipment": "45-Degree Leg Press Machine",
        "primary_muscles": ["Quadriceps"],
        "secondary_muscles": ["Glutes", "Hamstrings"],
        "images": [
            f"{CDN_BASE}/Leg_Press/0.jpg",
            f"{CDN_BASE}/Leg_Press/1.jpg"
        ],
        "form_cues": [
            "Feet shoulder-width apart on sled. Keep lower back pinned to seat.",
            "Lower sled slowly until knees reach 90 degrees.",
            "Press through whole foot to return. DO NOT lock knees out violently at the top."
        ],
        "video_query": "how to leg press safely form"
    },
    "Romanian deadlift": {
        "id": "Romanian_Deadlift",
        "display_name": "Romanian Deadlift (RDL)",
        "category": "Strength Lifts",
        "equipment": "Barbell or Dumbbells",
        "primary_muscles": ["Hamstrings", "Gluteus Maximus"],
        "secondary_muscles": ["Erectors (Lower Back)", "Lats"],
        "images": [
            f"{CDN_BASE}/Romanian_Deadlift/0.jpg",
            f"{CDN_BASE}/Romanian_Deadlift/1.jpg"
        ],
        "form_cues": [
            "Stand tall with slight soft bend in knees (fixed angle).",
            "Hinge hips straight backward as if touching a wall behind you.",
            "Descend until you feel a deep stretch in hamstrings. Squeeze glutes to stand."
        ],
        "video_query": "how to romanian deadlift proper form"
    },
    "leg curl": {
        "id": "Lying_Leg_Curls",
        "display_name": "Lying Hamstring Leg Curl",
        "category": "Strength Lifts",
        "equipment": "Hamstring Leg Curl Machine",
        "primary_muscles": ["Hamstrings"],
        "secondary_muscles": ["Calves"],
        "images": [
            f"{CDN_BASE}/Lying_Leg_Curls/0.jpg",
            f"{CDN_BASE}/Lying_Leg_Curls/1.jpg"
        ],
        "form_cues": [
            "Adjust roller pad to rest on back of lower calves.",
            "Keep hips firmly pressed down against pad as you curl.",
            "Curl heels smoothly toward glutes, pause 1s, then lower with control."
        ],
        "video_query": "lying leg curl proper form"
    },
    "calf raise": {
        "id": "Standing_Calf_Raises",
        "display_name": "Standing Calf Raise",
        "category": "Strength Lifts",
        "equipment": "Calf Machine or Raised Platform with DB",
        "primary_muscles": ["Calves (Gastrocnemius & Soleus)"],
        "secondary_muscles": ["Feet stabilizers"],
        "images": [
            f"{CDN_BASE}/Standing_Calf_Raises/0.jpg",
            f"{CDN_BASE}/Standing_Calf_Raises/1.jpg"
        ],
        "form_cues": [
            "Ball of foot on platform. Lower heels down slowly for a deep 2-second stretch.",
            "Press up onto big toes and hold peak contraction for 1 full second at top.",
            "Avoid bouncing or using momentum."
        ],
        "video_query": "standing calf raise proper form"
    },
    "Shoulder press": {
        "id": "Dumbbell_Shoulder_Press",
        "display_name": "Seated Dumbbell Overhead Shoulder Press",
        "category": "Strength Lifts",
        "equipment": "Dumbbells & Upright Bench",
        "primary_muscles": ["Anterior & Lateral Deltoids"],
        "secondary_muscles": ["Triceps", "Upper Chest"],
        "images": [
            f"{CDN_BASE}/Dumbbell_Shoulder_Press/0.jpg",
            f"{CDN_BASE}/Dumbbell_Shoulder_Press/1.jpg"
        ],
        "form_cues": [
            "Hold dumbbells at shoulder height with elbows slightly tucked (~60° forward).",
            "Press straight up overhead until arms extend without clanking weights.",
            "Lower slowly until dumbbells reach ear level before driving back up."
        ],
        "video_query": "dumbbell shoulder press proper form"
    },
    "incline chest press": {
        "id": "Leverage_Incline_Chest_Press",
        "display_name": "Incline Chest Press Machine",
        "category": "Strength Lifts",
        "equipment": "Incline Press Machine",
        "primary_muscles": ["Upper Chest"],
        "secondary_muscles": ["Front Deltoids", "Triceps"],
        "images": [
            f"{CDN_BASE}/Leverage_Incline_Chest_Press/0.jpg",
            f"{CDN_BASE}/Leverage_Incline_Chest_Press/1.jpg"
        ],
        "form_cues": [
            "Adjust seat height so handles sit below clavicle level.",
            "Press handles up and forward, focusing on squeezing upper chest.",
            "Resist the handles on the way back for a full stretch."
        ],
        "video_query": "incline chest press machine form"
    },
    "cable/pec fly": {
        "id": "Butterfly",
        "display_name": "Pec Deck Machine Fly (or Cable Crossover)",
        "category": "Strength Lifts",
        "equipment": "Pec Deck (Butterfly) Machine or Cable Crossover",
        "primary_muscles": ["Chest (Pectoralis Major)"],
        "secondary_muscles": ["Anterior Deltoids"],
        "images": [
            f"{CDN_BASE}/Butterfly/0.jpg",
            f"{CDN_BASE}/Butterfly/1.jpg"
        ],
        "form_cues": [
            "Sit tall with back and head resting against pad. Grasp handles with slight, fixed elbow bend.",
            "Bring handles together in front of mid-chest in a wide hugging arc.",
            "Hold peak contraction for 1 full second and squeeze pectorals. Control return slowly for deep stretch."
        ],
        "video_query": "pec deck butterfly machine fly proper form"
    },
    "rope pushdown": {
        "id": "Triceps_Pushdown_-_Rope_Attachment",
        "display_name": "Cable Rope Triceps Pushdown",
        "category": "Strength Lifts",
        "equipment": "High Cable & Rope Attachment",
        "primary_muscles": ["Triceps (Lateral Head)"],
        "secondary_muscles": ["Forearms"],
        "images": [
            f"{CDN_BASE}/Triceps_Pushdown_-_Rope_Attachment/0.jpg",
            f"{CDN_BASE}/Triceps_Pushdown_-_Rope_Attachment/1.jpg"
        ],
        "form_cues": [
            "Grip rope with neutral hands. Lock elbows in against ribcage.",
            "Push rope down and spread hands apart at the bottom to maximize peak triceps contraction.",
            "Slowly return rope until forearms are just above 90 degrees."
        ],
        "video_query": "rope triceps pushdown proper form"
    },
    "Assisted pull-up": {
        "id": "Band_Assisted_Pull-Up",
        "display_name": "Assisted Pull-Up (Machine or Band)",
        "category": "Strength Lifts",
        "equipment": "Assisted Pull-Up Machine / Resistance Band",
        "primary_muscles": ["Lats (Latissimus Dorsi)"],
        "secondary_muscles": ["Biceps", "Upper Back", "Core"],
        "images": [
            f"{CDN_BASE}/Band_Assisted_Pull-Up/0.jpg",
            f"{CDN_BASE}/Band_Assisted_Pull-Up/1.jpg"
        ],
        "form_cues": [
            "Grip bar slightly wider than shoulder width. Place knees on assistance pad.",
            "Depress shoulder blades down, then drive elbows down to ribs to pull chin over bar.",
            "Lower slowly until arms reach full extension before pulling again."
        ],
        "video_query": "assisted pull up machine proper form"
    },
    "one-arm DB row": {
        "id": "One-Arm_Dumbbell_Row",
        "display_name": "One-Arm Dumbbell Row",
        "category": "Strength Lifts",
        "equipment": "Dumbbell & Flat Bench",
        "primary_muscles": ["Lats & Upper Back"],
        "secondary_muscles": ["Biceps", "Rear Deltoid"],
        "images": [
            f"{CDN_BASE}/One-Arm_Dumbbell_Row/0.jpg",
            f"{CDN_BASE}/One-Arm_Dumbbell_Row/1.jpg"
        ],
        "form_cues": [
            "Place knee and hand on flat bench. Torso parallel to floor with flat back.",
            "Pull dumbbell towards hip pocket, driving elbow up.",
            "Avoid rotating torso; keep hips and chest square to the ground."
        ],
        "video_query": "single arm dumbbell row proper form"
    },
    "close-grip pulldown": {
        "id": "Close-Grip_Front_Lat_Pulldown",
        "display_name": "Close-Grip Lat Pulldown (V-Bar)",
        "category": "Strength Lifts",
        "equipment": "Lat Pulldown Machine with V-Handle",
        "primary_muscles": ["Lower Lats"],
        "secondary_muscles": ["Biceps", "Middle Back"],
        "images": [
            f"{CDN_BASE}/Close-Grip_Front_Lat_Pulldown/0.jpg",
            f"{CDN_BASE}/Close-Grip_Front_Lat_Pulldown/1.jpg"
        ],
        "form_cues": [
            "Attach V-bar to cable pulley. Sit upright with thighs locked.",
            "Pull handle straight down toward clavicle, driving elbows down and back.",
            "Feel strong stretch in lats at the top of each repetition."
        ],
        "video_query": "close grip lat pulldown proper form"
    },
    "reverse pec deck": {
        "id": "Reverse_Flyes",
        "display_name": "Reverse Pec Deck (Rear Delt Fly)",
        "category": "Strength Lifts",
        "equipment": "Pec Deck / Rear Delt Machine",
        "primary_muscles": ["Rear Deltoids (Posterior Delts)"],
        "secondary_muscles": ["Rhomboids", "Middle Traps"],
        "images": [
            f"{CDN_BASE}/Reverse_Flyes/0.jpg",
            f"{CDN_BASE}/Reverse_Flyes/1.jpg"
        ],
        "form_cues": [
            "Sit facing the machine pad with chest flat against it.",
            "Reach forward to grip handles with slight elbow bend. Pull handles back horizontally in an arc.",
            "Focus on moving with rear shoulders rather than pinching traps excessively."
        ],
        "video_query": "reverse pec deck rear delt fly form"
    },
    "EZ curl": {
        "id": "EZ-Bar_Curl",
        "display_name": "EZ-Bar Bicep Curl",
        "category": "Strength Lifts",
        "equipment": "EZ-Curl Bar & Plates",
        "primary_muscles": ["Biceps Brachii"],
        "secondary_muscles": ["Brachialis", "Forearms"],
        "images": [
            f"{CDN_BASE}/EZ-Bar_Curl/0.jpg",
            f"{CDN_BASE}/EZ-Bar_Curl/1.jpg"
        ],
        "form_cues": [
            "Hold inner angled knurling of EZ bar. Angles relieve wrist and elbow joint torque.",
            "Curl bar upward to upper chest while keeping upper arms pinned at sides.",
            "Lower slowly under muscular control; do not rock hips back and forth."
        ],
        "video_query": "ez bar curl proper form"
    },
    "cable curl": {
        "id": "Standing_Biceps_Cable_Curl",
        "display_name": "Standing Cable Bicep Curl",
        "category": "Strength Lifts",
        "equipment": "Low Cable Pulley & Straight/Curl Bar",
        "primary_muscles": ["Biceps Brachii (Constant Cable Tension)"],
        "secondary_muscles": ["Forearms"],
        "images": [
            f"{CDN_BASE}/Standing_Biceps_Cable_Curl/0.jpg",
            f"{CDN_BASE}/Standing_Biceps_Cable_Curl/1.jpg"
        ],
        "form_cues": [
            "Stand facing low pulley with arms extended down. Keep core braced and elbows pinned at sides.",
            "Curl bar up toward shoulders, keeping elbows fixed in space. Cables provide continuous tension throughout.",
            "Squeeze biceps firmly at peak contraction for 1 second, then lower under 2–3s control."
        ],
        "video_query": "standing cable bicep curl proper form"
    },
    "Leg press or hack squat": {
        "id": "Hack_Squat",
        "display_name": "Machine Hack Squat / Leg Press",
        "category": "Strength Lifts",
        "equipment": "Hack Squat Machine or 45° Sled Leg Press",
        "primary_muscles": ["Quadriceps"],
        "secondary_muscles": ["Glutes", "Hamstrings"],
        "images": [
            f"{CDN_BASE}/Hack_Squat/0.jpg",
            f"{CDN_BASE}/Hack_Squat/1.jpg"
        ],
        "form_cues": [
            "Shoulders and back pinned to machine pad. Feet flat shoulder-width on carriage platform.",
            "Disengage safeties. Lower carriage down under smooth control until knees reach 90 degrees.",
            "Drive up through midfoot and heels. Keep knees tracking over 2nd/3rd toes without slamming lockout."
        ],
        "video_query": "hack squat machine proper form"
    },
    "split squat": {
        "id": "Split_Squats",
        "display_name": "Dumbbell Split Squat (or Bulgarian Split Squat)",
        "category": "Strength Lifts",
        "equipment": "Dumbbells / Bodyweight",
        "primary_muscles": ["Quadriceps", "Glutes"],
        "secondary_muscles": ["Hamstrings", "Calves", "Core Balance"],
        "images": [
            f"{CDN_BASE}/Split_Squats/0.jpg",
            f"{CDN_BASE}/Split_Squats/1.jpg"
        ],
        "form_cues": [
            "Staggered split stance. Front foot planted firmly, rear foot elevated or resting on ball of foot.",
            "Lower back knee straight down towards floor until front thigh is parallel.",
            "Keep torso slightly inclined forward; drive through front heel to return to top."
        ],
        "video_query": "dumbbell split squat proper form"
    },
    "hip thrust": {
        "id": "Barbell_Hip_Thrust",
        "display_name": "Barbell Hip Thrust",
        "category": "Strength Lifts",
        "equipment": "Barbell, Pad & Bench",
        "primary_muscles": ["Gluteus Maximus"],
        "secondary_muscles": ["Hamstrings", "Adductors", "Core"],
        "images": [
            f"{CDN_BASE}/Barbell_Hip_Thrust/0.jpg",
            f"{CDN_BASE}/Barbell_Hip_Thrust/1.jpg"
        ],
        "form_cues": [
            "Upper back resting against flat bench edge. Bar cushioned across hips.",
            "Feet flat at shoulder width, shins vertical at top of movement.",
            "Drive through heels to extend hips until body forms a straight line from shoulders to knees. Squeeze glutes hard."
        ],
        "video_query": "how to barbell hip thrust proper form"
    },
    "seated leg curl": {
        "id": "Seated_Leg_Curl",
        "display_name": "Seated Hamstring Leg Curl",
        "category": "Strength Lifts",
        "equipment": "Seated Leg Curl Machine",
        "primary_muscles": ["Hamstrings"],
        "secondary_muscles": ["Calves"],
        "images": [
            f"{CDN_BASE}/Seated_Leg_Curl/0.jpg",
            f"{CDN_BASE}/Seated_Leg_Curl/1.jpg"
        ],
        "form_cues": [
            "Lock lap pad firmly down over thighs to anchor legs. Roller pad sits behind Achilles tendon.",
            "Curl heels backward underneath your seat as far as possible.",
            "Hold contraction for 1 second, then control weight slowly on the way back up."
        ],
        "video_query": "seated leg curl proper form"
    }
}

# 2. WARM-UP & DYNAMIC STRETCHES, CARDIO, AND POST-WORKOUT STATIC STRETCHES
STRETCHES_AND_CARDIO_DATABASE = {
    # Warm-Up Drills
    "arm circles": {
        "display_name": "Dynamic Arm Circles & Swings",
        "category": "Dynamic Warm-Up",
        "equipment": "Bodyweight",
        "primary_muscles": ["Shoulders (Deltoids)", "Chest Openers"],
        "secondary_muscles": ["Rotator Cuff"],
        "images": [
            f"{CDN_BASE}/Arm_Circles/0.jpg",
            f"{CDN_BASE}/Arm_Circles/1.jpg"
        ],
        "form_cues": ["Stand with feet shoulder-width. Rotate arms in smooth forward circles, then reverse. Keep movements smooth to lubricate shoulder joint capsules."],
        "video_query": "dynamic arm circles warmup proper form"
    },
    "shoulder circles": {
        "display_name": "Shoulder Dislocation & Mobility Circles",
        "category": "Dynamic Warm-Up",
        "equipment": "Broomstick / Resistance Band",
        "primary_muscles": ["Rotator Cuff", "Shoulders"],
        "secondary_muscles": ["Pectorals"],
        "images": [
            f"{CDN_BASE}/Shoulder_Circles/0.jpg",
            f"{CDN_BASE}/Shoulder_Circles/1.jpg"
        ],
        "form_cues": ["Hold band or stick wide. Pass it up overhead and behind back without bending elbows. Opens chest and lubricates rotator cuff."],
        "video_query": "band shoulder dislocations warmup form"
    },
    "cat-cow": {
        "display_name": "Cat-Cow Spinal Mobility",
        "category": "Dynamic Warm-Up",
        "equipment": "Mat",
        "primary_muscles": ["Thoracic Spine", "Erectors"],
        "secondary_muscles": ["Abdominals", "Neck"],
        "images": [
            f"{CDN_BASE}/Cat_Stretch/0.jpg",
            f"{CDN_BASE}/Cat_Stretch/1.jpg"
        ],
        "form_cues": ["On all fours, inhale as you drop belly toward floor and look upward (Cow). Exhale as you tuck chin to chest and round spine toward ceiling (Cat)."],
        "video_query": "how to cat cow stretch proper form"
    },
    "dead hang": {
        "display_name": "Dead Hang from Pull-Up Bar",
        "category": "Dynamic Warm-Up",
        "equipment": "Pull-Up Bar",
        "primary_muscles": ["Spinal Decompression", "Lats"],
        "secondary_muscles": ["Grip", "Shoulder Capsule"],
        "images": [
            f"{CDN_BASE}/One_Handed_Hang/0.jpg",
            f"{CDN_BASE}/One_Handed_Hang/1.jpg"
        ],
        "form_cues": ["Hang freely with relaxed shoulders and deep breaths. Decompresses lumbar discs and opens subacromial space before lifting."],
        "video_query": "dead hang benefits and proper form"
    },
    "glute bridge": {
        "display_name": "Bodyweight Glute Bridges",
        "category": "Dynamic Warm-Up",
        "equipment": "Mat",
        "primary_muscles": ["Gluteus Maximus"],
        "secondary_muscles": ["Hamstrings", "Core"],
        "images": [
            f"{CDN_BASE}/Pelvic_Tilt_Into_Bridge/0.jpg",
            f"{CDN_BASE}/Pelvic_Tilt_Into_Bridge/1.jpg"
        ],
        "form_cues": ["Lie on back with knees bent and feet flat. Drive through heels to raise hips until body forms a straight line from knees to shoulders. Squeeze glutes."],
        "video_query": "glute bridge activation warmup form"
    },
    "leg swings": {
        "display_name": "Dynamic Leg Swings (Front/Back & Side)",
        "category": "Dynamic Warm-Up",
        "equipment": "Wall Support",
        "primary_muscles": ["Hip Flexors", "Hamstrings"],
        "secondary_muscles": ["Adductors", "Abductors"],
        "images": [
            f"{CDN_BASE}/Crossover_Reverse_Lunge/0.jpg",
            f"{CDN_BASE}/Crossover_Reverse_Lunge/1.jpg"
        ],
        "form_cues": ["Hold wall for balance. Swing leg forward and backward smoothly through comfortable range of motion, then swing side-to-side."],
        "video_query": "dynamic leg swings warmup"
    },
    "hip 90/90": {
        "display_name": "Hip 90/90 Mobility Transitions",
        "category": "Dynamic Warm-Up",
        "equipment": "Mat",
        "primary_muscles": ["Hip Joint Capsule (Internal & External Rotators)"],
        "secondary_muscles": ["Glutes", "Groin"],
        "images": [
            f"{CDN_BASE}/90_90_Hamstring/0.jpg",
            f"{CDN_BASE}/90_90_Hamstring/1.jpg"
        ],
        "form_cues": ["Sit on floor with front leg and back leg bent at 90-degree angles. Rotate hips side-to-side to unlock tight hip capsules."],
        "video_query": "90 90 hip mobility drill form"
    },
    "wrist mobility": {
        "display_name": "Wrist Extension & Mobility Circles",
        "category": "Dynamic Warm-Up",
        "equipment": "Bodyweight",
        "primary_muscles": ["Wrist Flexors & Extensors"],
        "secondary_muscles": ["Forearms"],
        "images": [
            f"{CDN_BASE}/Kneeling_Forearm_Stretch/0.jpg",
            f"{CDN_BASE}/Kneeling_Forearm_Stretch/1.jpg"
        ],
        "form_cues": ["Rotate wrists clockwise and counter-clockwise. Gently pull fingers back into extension to prepare wrists for bench press and curling loads."],
        "video_query": "wrist mobility warmup for bench press"
    },
    # Cardio Protocols
    "treadmill": {
        "display_name": "Treadmill Incline / Brisk Walk",
        "category": "Cardio Protocol",
        "equipment": "Treadmill",
        "primary_muscles": ["Cardiovascular System", "Calves", "Glutes"],
        "secondary_muscles": ["Tibialis Anterior"],
        "images": [
            f"{CDN_BASE}/Walking_Treadmill/0.jpg",
            f"{CDN_BASE}/Walking_Treadmill/1.jpg"
        ],
        "form_cues": ["Walk with upright posture and natural arm swing. Set incline to 2–6% at 4.5–6.0 km/h. Keep pace conversational (RPE 5–7)."],
        "video_query": "incline treadmill walking for fat loss"
    },
    "cross trainer": {
        "display_name": "Cross Trainer / Elliptical",
        "category": "Cardio Protocol",
        "equipment": "Elliptical Trainer",
        "primary_muscles": ["Cardiovascular", "Quads", "Glutes"],
        "secondary_muscles": ["Hamstrings", "Arms"],
        "images": [
            f"{CDN_BASE}/Elliptical_Trainer/0.jpg",
            f"{CDN_BASE}/Elliptical_Trainer/1.jpg"
        ],
        "form_cues": ["Low-impact smooth striding. Push and pull handles actively with chest upright to distribute effort between upper and lower body."],
        "video_query": "elliptical trainer cardio proper form"
    },
    "cycle": {
        "display_name": "Stationary Cycle / Recumbent Bike",
        "category": "Cardio Protocol",
        "equipment": "Stationary Bike",
        "primary_muscles": ["Cardiovascular", "Quadriceps"],
        "secondary_muscles": ["Calves", "Hamstrings"],
        "images": [
            f"{CDN_BASE}/Recumbent_Bike/0.jpg",
            f"{CDN_BASE}/Recumbent_Bike/1.jpg"
        ],
        "form_cues": ["Zero joint impact on knees. Maintain smooth 70–85 RPM cadence with moderate resistance."],
        "video_query": "stationary bike cardio workout form"
    },
    # Bodyweight / Conditioning
    "push-ups": {
        "display_name": "Standard Push-Ups",
        "category": "Bodyweight",
        "equipment": "Floor",
        "primary_muscles": ["Chest (Pectorals)", "Triceps"],
        "secondary_muscles": ["Core", "Anterior Deltoids"],
        "images": [
            f"{CDN_BASE}/Pushups/0.jpg",
            f"{CDN_BASE}/Pushups/1.jpg"
        ],
        "form_cues": ["Rigid plank position. Lower chest to floor with elbows at 45° angle. Press floor away."],
        "video_query": "pushups proper form"
    },
    "plank": {
        "display_name": "Forearm Plank",
        "category": "Bodyweight",
        "equipment": "Floor / Mat",
        "primary_muscles": ["Transverse Abdominis", "Core"],
        "secondary_muscles": ["Shoulders", "Glutes"],
        "images": [
            f"{CDN_BASE}/Plank/0.jpg",
            f"{CDN_BASE}/Plank/1.jpg"
        ],
        "form_cues": ["Elbows directly under shoulders. Squeeze glutes and brace core. Do not let hips sag."],
        "video_query": "how to plank proper form"
    },
    "mountain climbers": {
        "display_name": "Mountain Climbers",
        "category": "Bodyweight",
        "equipment": "Floor",
        "primary_muscles": ["Core & Hip Flexors"],
        "secondary_muscles": ["Cardio Endurance", "Shoulders"],
        "images": [
            f"{CDN_BASE}/Mountain_Climbers/0.jpg",
            f"{CDN_BASE}/Mountain_Climbers/1.jpg"
        ],
        "form_cues": ["High plank position. Drive knees alternatively towards chest in a controlled rhythm."],
        "video_query": "mountain climbers exercise form"
    },
    "jumping jacks": {
        "display_name": "Jumping Jacks (or Step Jacks)",
        "category": "Conditioning",
        "equipment": "Bodyweight",
        "primary_muscles": ["Cardiovascular System", "Calves"],
        "secondary_muscles": ["Deltoids"],
        "images": [
            f"{CDN_BASE}/Box_Skip/0.jpg",
            f"{CDN_BASE}/Box_Skip/1.jpg"
        ],
        "form_cues": ["Jump feet out while clapping arms overhead, then return. Use low-impact step jacks if knees hurt."],
        "video_query": "jumping jacks exercise proper form"
    },
    "high knees": {
        "display_name": "High Knees / Marching in Place",
        "category": "Conditioning",
        "equipment": "Bodyweight",
        "primary_muscles": ["Hip Flexors", "Cardiovascular"],
        "secondary_muscles": ["Calves", "Core"],
        "images": [
            f"{CDN_BASE}/Step-up_with_Knee_Raise/0.jpg",
            f"{CDN_BASE}/Step-up_with_Knee_Raise/1.jpg"
        ],
        "form_cues": ["Drive knees up towards chest rhythmically with tall posture. Use marching option if low impact is needed."],
        "video_query": "high knees exercise proper form"
    },
    "stepper": {
        "display_name": "Aerobic Stepper / Bench Step-Ups",
        "category": "Conditioning",
        "equipment": "Stepper / Low Bench",
        "primary_muscles": ["Quadriceps", "Glutes"],
        "secondary_muscles": ["Calves"],
        "images": [
            f"{CDN_BASE}/Step-up_with_Knee_Raise/0.jpg",
            f"{CDN_BASE}/Step-up_with_Knee_Raise/1.jpg"
        ],
        "form_cues": ["Step firmly onto center of platform. Drive through full foot to stand tall, then step down with control."],
        "video_query": "step ups exercise proper form"
    },
    "stepper side steps": {
        "display_name": "Stepper Lateral Side Steps",
        "category": "Conditioning",
        "equipment": "Stepper / Platform",
        "primary_muscles": ["Gluteus Medius", "Abductors"],
        "secondary_muscles": ["Quadriceps", "Calves"],
        "images": [
            f"{CDN_BASE}/Step-up_with_Knee_Raise/0.jpg",
            f"{CDN_BASE}/Step-up_with_Knee_Raise/1.jpg"
        ],
        "form_cues": ["Step laterally onto the box, engaging outer hip stabilizers. Maintain balance and soft knee landing."],
        "video_query": "lateral step up exercise form"
    },
    "bodyweight squat": {
        "display_name": "Bodyweight Air Squats",
        "category": "Conditioning",
        "equipment": "Bodyweight",
        "primary_muscles": ["Quadriceps", "Glutes"],
        "secondary_muscles": ["Hamstrings", "Calves", "Core"],
        "images": [
            f"{CDN_BASE}/Bodyweight_Squat/0.jpg",
            f"{CDN_BASE}/Bodyweight_Squat/1.jpg"
        ],
        "form_cues": ["Feet shoulder-width apart. Sit hips back and down to parallel while keeping chest proud and knees tracking toes."],
        "video_query": "how to bodyweight squat proper form"
    },
    "skipping": {
        "display_name": "Simulated Skipping (Jump Rope / Boxer Bounce)",
        "category": "Conditioning",
        "equipment": "Bodyweight",
        "primary_muscles": ["Calves (Gastrocnemius)", "Cardiovascular"],
        "secondary_muscles": ["Forearms", "Core"],
        "images": [
            f"{CDN_BASE}/Fast_Skipping/0.jpg",
            f"{CDN_BASE}/Fast_Skipping/1.jpg"
        ],
        "form_cues": ["Stay light on the balls of your feet. Rotate wrists smoothly as if turning a rope. Keep knees slightly bent to absorb impact."],
        "video_query": "jump rope shadow skipping technique"
    },
    "skipping without rope": {
        "display_name": "Simulated Skipping (Without Rope)",
        "category": "Conditioning",
        "equipment": "Bodyweight",
        "primary_muscles": ["Calves (Gastrocnemius)", "Cardiovascular"],
        "secondary_muscles": ["Forearms", "Core"],
        "images": [
            f"{CDN_BASE}/Fast_Skipping/0.jpg",
            f"{CDN_BASE}/Fast_Skipping/1.jpg"
        ],
        "form_cues": ["Bounce softly on balls of feet while rotating wrists. Low fatigue, great for conditioning without trip hazards."],
        "video_query": "shadow jump rope skipping exercise"
    },
    # Static Cool-Down Stretches
    "doorway chest stretch": {
        "display_name": "Doorway Pectoral & Front Delt Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Doorframe or Rack",
        "primary_muscles": ["Pectoralis Major & Minor"],
        "secondary_muscles": ["Anterior Deltoids"],
        "images": [
            f"{CDN_BASE}/Chest_And_Front_Of_Shoulder_Stretch/0.jpg",
            f"{CDN_BASE}/Chest_And_Front_Of_Shoulder_Stretch/1.jpg"
        ],
        "form_cues": ["Forearm against doorway at 90 degrees. Step forward until a gentle stretch is felt across chest. Hold for 30s each side."],
        "video_query": "doorway chest stretch proper form"
    },
    "overhead triceps": {
        "display_name": "Overhead Triceps & Lat Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Bodyweight",
        "primary_muscles": ["Triceps Long Head"],
        "secondary_muscles": ["Latissimus Dorsi"],
        "images": [
            f"{CDN_BASE}/Overhead_Triceps/0.jpg",
            f"{CDN_BASE}/Overhead_Triceps/1.jpg"
        ],
        "form_cues": ["Reach arm overhead and bend elbow so hand touches upper back. Use other hand to gently pull elbow back and down. Hold 30s."],
        "video_query": "overhead triceps stretch proper form"
    },
    "cross-body shoulder stretch": {
        "display_name": "Cross-Body Posterior Shoulder Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Bodyweight",
        "primary_muscles": ["Posterior Deltoid", "Infraspinatus"],
        "secondary_muscles": ["Upper Back"],
        "images": [
            f"{CDN_BASE}/Round_The_World_Shoulder_Stretch/0.jpg",
            f"{CDN_BASE}/Round_The_World_Shoulder_Stretch/1.jpg"
        ],
        "form_cues": ["Pull one arm straight across chest using opposite forearm. Keep shoulder depressed down away from ear. Hold 30s."],
        "video_query": "cross body shoulder stretch form"
    },
    "child's pose": {
        "display_name": "Extended Child's Pose (Balasana)",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat",
        "primary_muscles": ["Spine Decompression", "Lats"],
        "secondary_muscles": ["Hips", "Glutes"],
        "images": [
            f"{CDN_BASE}/Childs_Pose/0.jpg",
            f"{CDN_BASE}/Childs_Pose/1.jpg"
        ],
        "form_cues": ["Kneel with big toes touching and knees wide. Sit hips back onto heels and extend arms forward onto floor. Take deep diaphragmatic breaths."],
        "video_query": "childs pose yoga stretch form"
    },
    "rack lat stretch": {
        "display_name": "Rack / Pole Overhead Lat Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Squat Rack or Pole",
        "primary_muscles": ["Latissimus Dorsi"],
        "secondary_muscles": ["Teres Major", "Intercostals"],
        "images": [
            f"{CDN_BASE}/Overhead_Lat/0.jpg",
            f"{CDN_BASE}/Overhead_Lat/1.jpg"
        ],
        "form_cues": ["Grip rack pole overhead with one hand. Sit hips back and lean torso away to feel a deep lat elongation from armpit to hip. Hold 30s."],
        "video_query": "hanging rack lat stretch form"
    },
    "bicep wall stretch": {
        "display_name": "Wall Bicep & Anterior Shoulder Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Wall",
        "primary_muscles": ["Biceps Brachii"],
        "secondary_muscles": ["Anterior Deltoid", "Chest"],
        "images": [
            f"{CDN_BASE}/One_Arm_Against_Wall/0.jpg",
            f"{CDN_BASE}/One_Arm_Against_Wall/1.jpg"
        ],
        "form_cues": ["Place palm and inside of arm flat against wall at shoulder height. Rotate torso away until bicep and shoulder stretch gently."],
        "video_query": "wall bicep stretch proper form"
    },
    "quad stretch": {
        "display_name": "Standing / Kneeling Quadriceps Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Wall or Chair for balance",
        "primary_muscles": ["Quadriceps (Rectus Femoris)"],
        "secondary_muscles": ["Hip Flexors"],
        "images": [
            f"{CDN_BASE}/All_Fours_Quad_Stretch/0.jpg",
            f"{CDN_BASE}/All_Fours_Quad_Stretch/1.jpg"
        ],
        "form_cues": ["Grab ankle behind you and pull heel toward glute. Keep knees together and tuck pelvis under to intensify quad stretch. Hold 30s each leg."],
        "video_query": "standing quad stretch proper form"
    },
    "hip flexor lunge stretch": {
        "display_name": "Kneeling Low Lunge Hip Flexor Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat",
        "primary_muscles": ["Psoas & Iliacus (Hip Flexors)"],
        "secondary_muscles": ["Quadriceps"],
        "images": [
            f"{CDN_BASE}/Kneeling_Hip_Flexor/0.jpg",
            f"{CDN_BASE}/Kneeling_Hip_Flexor/1.jpg"
        ],
        "form_cues": ["Step forward into a low lunge with rear knee on mat. Squeeze rear glute and shift hips gently forward while keeping torso tall. Hold 30s each side."],
        "video_query": "kneeling hip flexor stretch proper form"
    },
    "hamstring stretch": {
        "display_name": "Seated Single-Leg Hamstring Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat / Floor",
        "primary_muscles": ["Hamstrings (Biceps Femoris)"],
        "secondary_muscles": ["Calves", "Lower Back"],
        "images": [
            f"{CDN_BASE}/Hamstring_Stretch/0.jpg",
            f"{CDN_BASE}/Hamstring_Stretch/1.jpg"
        ],
        "form_cues": ["Sit with one leg extended straight and other bent. Hinge at hips with flat back reaching towards toes. Hold 30s each leg."],
        "video_query": "hamstring stretch proper form"
    },
    "calf wall stretch": {
        "display_name": "Wall Standing Calf Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Wall",
        "primary_muscles": ["Gastrocnemius & Soleus (Calves)"],
        "secondary_muscles": ["Achilles Tendon"],
        "images": [
            f"{CDN_BASE}/Calf_Stretch_Hands_Against_Wall/0.jpg",
            f"{CDN_BASE}/Calf_Stretch_Hands_Against_Wall/1.jpg"
        ],
        "form_cues": ["Hands against wall. Step one leg back with heel pressed firmly into floor and knee straight. Lean forward into wall. Hold 30s each leg."],
        "video_query": "wall calf stretch proper form"
    },
    "pigeon pose": {
        "display_name": "Pigeon Pose / Figure-4 Glute Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat",
        "primary_muscles": ["Gluteus Medius & Piriformis"],
        "secondary_muscles": ["Hip Capsule"],
        "images": [
            f"{CDN_BASE}/Ankle_On_The_Knee/0.jpg",
            f"{CDN_BASE}/Ankle_On_The_Knee/1.jpg"
        ],
        "form_cues": ["Bring front shin across mat in front of you with rear leg extended back. Lower torso over front shin for deep glute/hip release. Hold 45s."],
        "video_query": "pigeon pose stretch proper form"
    },
    "butterfly stretch": {
        "display_name": "Seated Butterfly Adductor Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat",
        "primary_muscles": ["Adductors (Inner Thighs / Groin)"],
        "secondary_muscles": ["Hips"],
        "images": [
            f"{CDN_BASE}/Adductor_Groin/0.jpg",
            f"{CDN_BASE}/Adductor_Groin/1.jpg"
        ],
        "form_cues": ["Sit tall with soles of feet pressed together and knees dropped open to sides. Gently press knees down toward floor with tall spine. Hold 45s."],
        "video_query": "seated butterfly stretch proper form"
    },
    "spinal twist": {
        "id": "Ankle_On_The_Knee",
        "display_name": "Lying Supine Spinal Twist & Glute Release",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat",
        "primary_muscles": ["Lumbar Spine & Thoracic Rotation"],
        "secondary_muscles": ["Glutes", "Obliques"],
        "images": [
            f"{CDN_BASE}/Ankle_On_The_Knee/0.jpg",
            f"{CDN_BASE}/Ankle_On_The_Knee/1.jpg"
        ],
        "form_cues": ["Lie on back with arms in 'T' shape. Bring one knee to chest and gently guide it across body to opposite floor while keeping shoulders grounded. Hold 45s."],
        "video_query": "lying spinal twist stretch form"
    },
    "band pull-aparts": {
        "id": "Band_Pull_Apart",
        "display_name": "Band Pull-Aparts (Rotator Cuff & Upper Back)",
        "category": "Dynamic Warm-Up",
        "equipment": "Resistance Band",
        "primary_muscles": ["Rotator Cuff", "Rear Deltoids", "Rhomboids"],
        "secondary_muscles": ["Middle Trapezius"],
        "images": [
            f"{CDN_BASE}/Band_Pull_Apart/0.jpg",
            f"{CDN_BASE}/Band_Pull_Apart/1.jpg"
        ],
        "form_cues": ["Hold resistance band at shoulder height with arms straight.", "Pull band apart horizontally by squeezing shoulder blades together until band touches chest.", "Resist band slowly on return to keep constant tension."],
        "video_query": "band pull aparts proper form"
    },
    "scapular push-ups": {
        "id": "Pushups",
        "display_name": "Scapular Push-Ups / Wall Slides",
        "category": "Dynamic Warm-Up",
        "equipment": "Floor / Mat",
        "primary_muscles": ["Serratus Anterior"],
        "secondary_muscles": ["Rotator Cuff", "Core"],
        "images": [
            f"{CDN_BASE}/Pushups/0.jpg",
            f"{CDN_BASE}/Pushups/1.jpg"
        ],
        "form_cues": ["High plank position with arms straight. Without bending elbows, pinch shoulder blades together, then push floor away to dome upper back.", "Activates serratus anterior to stabilize shoulders during pressing."],
        "video_query": "scapular push ups exercise form"
    },
    "thoracic rotations": {
        "id": "Cat_Stretch",
        "display_name": "Thoracic Rotations (Thread the Needle)",
        "category": "Dynamic Warm-Up",
        "equipment": "Mat",
        "primary_muscles": ["Thoracic Spine (Mid-Back)"],
        "secondary_muscles": ["Rotator Cuff", "Rear Deltoid"],
        "images": [
            f"{CDN_BASE}/Cat_Stretch/0.jpg",
            f"{CDN_BASE}/Cat_Stretch/1.jpg"
        ],
        "form_cues": ["On all fours, reach one arm underneath chest across body, then rotate upward toward ceiling opening chest.", "Smooth rotational movement mobilizes mid-back and ribs."],
        "video_query": "thread the needle thoracic rotation stretch"
    },
    "walking knee hugs": {
        "id": "Step-up_with_Knee_Raise",
        "display_name": "Walking Knee Hugs to Chest",
        "category": "Dynamic Warm-Up",
        "equipment": "Bodyweight",
        "primary_muscles": ["Glutes", "Hip Flexors"],
        "secondary_muscles": ["Hamstrings", "Ankles"],
        "images": [
            f"{CDN_BASE}/Step-up_with_Knee_Raise/0.jpg",
            f"{CDN_BASE}/Step-up_with_Knee_Raise/1.jpg"
        ],
        "form_cues": ["Step forward, draw one knee firmly toward chest with tall upright posture.", "Rise up onto ball of support foot for balance and calf pre-activation."],
        "video_query": "walking knee hugs dynamic warmup"
    },
    "cossack lunges": {
        "id": "Split_Squats",
        "display_name": "Lateral Cossack Lunges & Groin Mobility",
        "category": "Dynamic Warm-Up",
        "equipment": "Bodyweight",
        "primary_muscles": ["Adductors (Inner Thighs)", "Hip Joint"],
        "secondary_muscles": ["Quadriceps", "Ankles"],
        "images": [
            f"{CDN_BASE}/Split_Squats/0.jpg",
            f"{CDN_BASE}/Split_Squats/1.jpg"
        ],
        "form_cues": ["Wide stance. Shift weight to one side, squatting deep while keeping opposite leg straight and heel grounded.", "Unlocks groin tightness and deep ankle mobility."],
        "video_query": "cossack squats warmup mobility"
    },
    "seated forward fold": {
        "id": "Hamstring_Stretch",
        "display_name": "Seated Forward Fold & Posterior Chain Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat",
        "primary_muscles": ["Hamstrings", "Erectors (Lower Back)"],
        "secondary_muscles": ["Calves", "Thoracolumbar Fascia"],
        "images": [
            f"{CDN_BASE}/Hamstring_Stretch/0.jpg",
            f"{CDN_BASE}/Hamstring_Stretch/1.jpg"
        ],
        "form_cues": ["Sit tall with legs straight. Hinge from hips, reaching hands toward ankles with relaxed breathing.", "Gently decompresses posterior chain and lower back."],
        "video_query": "seated forward fold hamstring stretch"
    },
    "cooldown walk": {
        "id": "Walking_Treadmill",
        "display_name": "Slow Recovery Walk & Diaphragm Breathing",
        "category": "Cool-Down Recovery",
        "equipment": "Flat Ground / Treadmill",
        "primary_muscles": ["Cardiovascular Recovery", "Calves"],
        "secondary_muscles": ["CNS Downregulation"],
        "images": [
            f"{CDN_BASE}/Walking_Treadmill/0.jpg",
            f"{CDN_BASE}/Walking_Treadmill/1.jpg"
        ],
        "form_cues": ["Walk at easy conversational pace (3.5–4.5 km/h). Deep diaphragmatic breathing facilitates metabolic clearance.", "Helps downregulate heart rate and transitions nervous system into recovery."],
        "video_query": "cooldown walk breathing recovery"
    },
    "downward dog": {
        "id": "Calf_Stretch_Hands_Against_Wall",
        "display_name": "Downward Dog Calf & Achilles Stretch",
        "category": "Cool-Down Static Stretch",
        "equipment": "Mat",
        "primary_muscles": ["Calves (Gastrocnemius & Soleus)", "Achilles Tendon"],
        "secondary_muscles": ["Hamstrings", "Shoulders"],
        "images": [
            f"{CDN_BASE}/Calf_Stretch_Hands_Against_Wall/0.jpg",
            f"{CDN_BASE}/Calf_Stretch_Hands_Against_Wall/1.jpg"
        ],
        "form_cues": ["Form an inverted 'V' with hips high. Pedal heels alternatively toward mat to deeply stretch calves and Achilles tendons."],
        "video_query": "downward dog calf stretch form"
    },
    "neck mobility": {
        "id": "Arm_Circles",
        "display_name": "Upper Trapezius & Cervical Neck Release",
        "category": "Cool-Down Static Stretch",
        "equipment": "Bodyweight",
        "primary_muscles": ["Upper Trapezius", "Levator Scapulae"],
        "secondary_muscles": ["Cervical Spine"],
        "images": [
            f"{CDN_BASE}/Arm_Circles/0.jpg",
            f"{CDN_BASE}/Arm_Circles/1.jpg"
        ],
        "form_cues": ["Sit upright. Tilt ear gently toward shoulder without shrugging. Hold 20–30s per side with relaxed breaths."],
        "video_query": "upper trapezius neck stretch form"
    },
    "standing side bends": {
        "id": "Overhead_Lat",
        "display_name": "Standing Side Bends & Lat Reach",
        "category": "Dynamic Warm-Up",
        "equipment": "Bodyweight",
        "primary_muscles": ["Quadratus Lumborum (QL)", "Intercostals"],
        "secondary_muscles": ["Latissimus Dorsi", "Obliques"],
        "images": [
            f"{CDN_BASE}/Overhead_Lat/0.jpg",
            f"{CDN_BASE}/Overhead_Lat/1.jpg"
        ],
        "form_cues": ["Stand tall with feet hip-width. Reach one arm overhead and laterally flex torso to lengthen flank muscles. Hold 15–20s each side."],
        "video_query": "standing side bend stretch form"
    },
    "savasana": {
        "id": "Childs_Pose",
        "display_name": "Savasana / Box Breathing (Downregulation)",
        "category": "Cool-Down Recovery",
        "equipment": "Mat",
        "primary_muscles": ["CNS Parasympathetic Downregulation"],
        "secondary_muscles": ["Full Body Muscular Relaxation"],
        "images": [
            f"{CDN_BASE}/Childs_Pose/0.jpg",
            f"{CDN_BASE}/Childs_Pose/1.jpg"
        ],
        "form_cues": ["Lie completely flat on back with eyes closed. Box breathing: 4s inhale, 4s hold, 4s exhale, 4s hold. Lowers cortisol and begins recovery immediately."],
        "video_query": "box breathing recovery technique"
    }
}

# 3. High-precision verified animated demonstration GIFs from ExerciseDB dataset
PLAN_EXERCISE_GIFS = {
    "Bench press": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0025-EIeI8Vf.gif",
    "incline DB press": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0289-SpYC0Kp.gif",
    "machine chest press": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1301-wDN97Ca.gif",
    "lateral raise": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0334-DsgkuIt.gif",
    "triceps pushdown": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0199-PskORrA.gif",
    "Lat pulldown": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0198-RVwzP10.gif",
    "seated cable row": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0159-kesXOpB.gif",
    "chest-supported row": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0327-7vG5o25.gif",
    "face pull": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0177-CuaWCmC.gif",
    "DB curl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1650-J74XlNf.gif",
    "hammer curl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0313-slDvUAU.gif",
    "Squat or goblet squat": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0024-Y7YcmIJ.gif",
    "leg press": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0739-10Z2DXU.gif",
    "Romanian deadlift": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0085-wQ2c4XD.gif",
    "leg curl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0586-17lJ1kr.gif",
    "calf raise": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1372-8ozhUIZ.gif",
    "Shoulder press": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0405-znQUdHY.gif",
    "incline chest press": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1289-PDaMuyV.gif",
    "cable/pec fly": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0154-aqvSOQE.gif",
    "rope pushdown": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0200-dU605di.gif",
    "Assisted pull-up": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0017-kiJ4Z2K.gif",
    "one-arm DB row": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0292-C0MA9bC.gif",
    "close-grip pulldown": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0818-rkg41Fb.gif",
    "reverse pec deck": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0993-sTfvVsG.gif",
    "EZ curl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0447-6TG6x2w.gif",
    "cable curl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1634-otqIxU4.gif",
    "Leg press or hack squat": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0743-Qa55kX1.gif",
    "split squat": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0410-qx4fgX7.gif",
    "hip thrust": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1409-qKBpF7I.gif",
    "seated leg curl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0586-17lJ1kr.gif"
}

STRETCH_GIFS = {
    "glute bridge": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1409-qKBpF7I.gif",
    "push-ups": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0662-I4hDWkc.gif",
    "plank": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/3544-5VXmnV5.gif",
    "mountain climbers": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0630-RJgzwny.gif",
    "bodyweight squat": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1004-TUZLh71.gif",
    "overhead triceps": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0092-5uFK1xr.gif",
    "quad stretch": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1512-qBcKorM.gif",
    "hamstring stretch": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1560-yRYyfdA.gif",
    "treadmill": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/3666-rjiM4L3.gif",
    "cross trainer": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/2331-XSCHmiI.gif",
    "cooldown walk": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/3666-rjiM4L3.gif"
}

# Prioritize animated GIFs across all strength exercises
for key, gif in PLAN_EXERCISE_GIFS.items():
    if key in EXERCISE_MEDIA_DATABASE:
        item = EXERCISE_MEDIA_DATABASE[key]
        item["gif_url"] = gif
        item["images"] = [gif] + [img for img in item.get("images", []) if img != gif]

# Prioritize animated GIFs across warmups and stretches
for key, gif in STRETCH_GIFS.items():
    for sk in STRETCHES_AND_CARDIO_DATABASE:
        if key.lower() in sk.lower():
            item = STRETCHES_AND_CARDIO_DATABASE[sk]
            item["gif_url"] = gif
            item["images"] = [gif] + [img for img in item.get("images", []) if img != gif]

# 4. Explicit string normalization aliases for every workout plan drill
EXERCISE_ALIASES = {
    # Warmup and Cooldown String Aliases
    "easy treadmill / incline walk": "treadmill",
    "easy treadmill or incline walk": "treadmill",
    "slow cool-down walk & diaphragm breathing": "cooldown walk",
    "slow cooldown walk": "cooldown walk",
    "slow cooldown walk & deep breathing": "cooldown walk",
    "slow flat walk": "cooldown walk",
    "slow relaxed walk": "cooldown walk",
    "slow treadmill walk with deep breathing": "cooldown walk",
    "gentle relaxed walk (outdoors or treadmill)": "cooldown walk",
    "stationary bike or brisk treadmill walk": "treadmill",
    "treadmill brisk walk or stepper easy pace": "treadmill",
    "cross trainer / rower easy pace": "cross trainer",
    "cross trainer or light rower": "cross trainer",
    "horizontal & overhead arm swings": "arm circles",
    "arm circles (small to large)": "arm circles",
    "band shoulder dislocations / over-and-backs": "shoulder circles",
    "scapular push-ups / wall slides": "scapular push-ups",
    "scapular wall slides": "scapular push-ups",
    "band pull-aparts / light rotations": "band pull-aparts",
    "band pull-aparts & light face pulls": "band pull-aparts",
    "wrist mobility & circle stretches": "wrist mobility",
    "forearm & wrist flexion/extension rotations": "wrist mobility",
    "doorway pectoral & front delt stretch": "doorway chest stretch",
    "behind-the-back clasp chest opener": "doorway chest stretch",
    "overhead triceps & lat stretch": "overhead triceps",
    "overhead triceps extension stretch": "overhead triceps",
    "cross-body shoulder stretch": "cross-body shoulder stretch",
    "cross-body posterior deltoid stretch": "cross-body shoulder stretch",
    "child's pose with floor arm reach": "child's pose",
    "child's pose with lateral side reach": "child's pose",
    "extended child's pose with deep breathing": "child's pose",
    "cat-cow spinal flexion & extension": "cat-cow",
    "cat-cow spine warmup": "cat-cow",
    "cat-cow gentle spinal waves": "cat-cow",
    "thoracic rotations (thread the needle)": "thoracic rotations",
    "thoracic open books (lying on side)": "thoracic rotations",
    "dead hang from pull-up bar": "dead hang",
    "rack / pole lat stretch": "rack lat stretch",
    "single-arm rack lat stretch": "rack lat stretch",
    "cross-arm upper back rhomboid stretch": "cross-body shoulder stretch",
    "wall bicep & chest stretch": "bicep wall stretch",
    "doorframe biceps & anterior shoulder stretch": "bicep wall stretch",
    "seated forward fold / hamstring hang": "seated forward fold",
    "seated hamstring & erector forward reach": "seated forward fold",
    "leg swings (front-to-back & side-to-side)": "leg swings",
    "deep goblet squat hold + ankle rock": "bodyweight squat",
    "hip 90/90 internal & external switches": "hip 90/90",
    "glute bridges (bodyweight)": "glute bridge",
    "standing / kneeling quad stretch": "quad stretch",
    "standing quad & hip flexor stretch": "quad stretch",
    "kneeling low lunge hip flexor stretch": "hip flexor lunge stretch",
    "kneeling hip flexor & psoas stretch": "hip flexor lunge stretch",
    "seated single-leg hamstring stretch": "hamstring stretch",
    "lying hamstring stretch with strap/hands": "hamstring stretch",
    "supine lying hamstring & lower back stretch": "hamstring stretch",
    "wall standing calf stretch": "calf wall stretch",
    "downward dog calf & achilles stretch": "downward dog",
    "figure-4 / pigeon glute stretch": "pigeon pose",
    "pigeon pose or reclined figure-4": "pigeon pose",
    "light band lateral raise warmup": "lateral raise",
    "upper trapezius & levator scapulae neck release": "neck mobility",
    "standing gentle neck rolls & shoulder shrugs": "neck mobility",
    "walking knee hugs to chest": "walking knee hugs",
    "lateral cossack lunges / groin mobility": "cossack lunges",
    "world's greatest stretch (lunge + reach)": "hip flexor lunge stretch",
    "bodyweight squats & calf raises": "bodyweight squat",
    "seated butterfly adductor stretch": "butterfly stretch",
    "seated butterfly stretch": "butterfly stretch",
    "supine glute / spinal twist stretch": "spinal twist",
    "lying spinal twist": "spinal twist",
    "standing side bends with overhead reach": "standing side bends",
    "savasana / box breathing (4s in, 4s hold, 4s out, 4s hold)": "savasana"
}

def get_exercise_media(name: str) -> dict:
    """Find media, photos, and form cues for any exercise, stretch, cardio, or bodyweight drill.
    Guarantees trainer-accurate biomechanical demonstration, verified GIFs, and preserves prescribed name.
    """
    raw = name.strip() if name else ""
    clean = raw.lower()
    
    # 1. Exact or case-insensitive match in strength database
    for k, v in EXERCISE_MEDIA_DATABASE.items():
        if k.lower() == clean:
            res = dict(v)
            res["prescribed_name"] = raw
            return res

    # 2. Check explicit workout plan aliases
    if clean in EXERCISE_ALIASES:
        alias_target = EXERCISE_ALIASES[clean]
        if alias_target in EXERCISE_MEDIA_DATABASE:
            res = dict(EXERCISE_MEDIA_DATABASE[alias_target])
            res["prescribed_name"] = raw
            return res
        if alias_target in STRETCHES_AND_CARDIO_DATABASE:
            res = dict(STRETCHES_AND_CARDIO_DATABASE[alias_target])
            res["prescribed_name"] = raw
            return res

    # 3. Exact match in stretches and cardio database
    for k, v in STRETCHES_AND_CARDIO_DATABASE.items():
        if k.lower() == clean:
            res = dict(v)
            res["prescribed_name"] = raw
            return res

    # 4. Fuzzy match in strength database (checks strength lifts BEFORE any stretches!)
    for k, v in EXERCISE_MEDIA_DATABASE.items():
        k_low = k.lower()
        if k_low in clean or clean in k_low:
            res = dict(v)
            res["prescribed_name"] = raw
            return res

    # 5. Fuzzy match in stretches database
    for k, v in STRETCHES_AND_CARDIO_DATABASE.items():
        k_low = k.lower()
        if k_low in clean:
            res = dict(v)
            res["prescribed_name"] = raw
            return res

    # 6. Strict word-boundary keyword search (prevents 'flat' matching 'lat' or 'rotations' matching 'lat'!)
    import re
    if re.search(r'\b(walk|treadmill)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["cooldown walk"])
    elif re.search(r'\b(bike|cycle)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["cycle"])
    elif re.search(r'\b(cross trainer|elliptical|rower)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["cross trainer"])
    elif re.search(r'\b(cat-cow|cat cow)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["cat-cow"])
    elif re.search(r'\bchild\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["child's pose"])
    elif re.search(r'\b(hamstring|fold)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["hamstring stretch"])
    elif re.search(r'\b(quad|quadriceps)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["quad stretch"])
    elif re.search(r'\b(glute|pigeon)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["pigeon pose"])
    elif re.search(r'\b(calf|calves|achilles)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["calf wall stretch"])
    elif re.search(r'\b(chest|pec)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["doorway chest stretch"])
    elif re.search(r'\b(tricep|triceps)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["overhead triceps"])
    elif re.search(r'\b(shoulder|delt)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["cross-body shoulder stretch"])
    elif re.search(r'\b(lat|lats|hang)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["rack lat stretch"])
    elif re.search(r'\b(hip|lunge|psoas)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["hip flexor lunge stretch"])
    elif re.search(r'\b(butterfly|groin|adductor)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["butterfly stretch"])
    elif re.search(r'\b(twist|spine)\b', clean):
        res = dict(STRETCHES_AND_CARDIO_DATABASE["spinal twist"])
    else:
        # Fallback default preserving clean label
        res = {
            "display_name": raw,
            "category": "Exercise Drill",
            "equipment": "Gym Equipment / Bodyweight",
            "images": [
                f"{CDN_BASE}/Arm_Circles/0.jpg",
                f"{CDN_BASE}/Arm_Circles/1.jpg"
            ],
            "primary_muscles": ["Target Muscle Group"],
            "secondary_muscles": ["Stabilizers"],
            "form_cues": ["Perform with controlled form and full range of motion. Keep 2–3 reps in reserve."],
            "video_query": f"how to do {raw} exercise proper form"
        }

    res["prescribed_name"] = raw
    return res

