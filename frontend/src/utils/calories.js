// Scientific MET Calorie Calculations

export const EXERCISE_METS = {
  'bench press': 6.0,
  'incline db press': 6.0,
  'machine chest press': 5.0,
  'lateral raise': 3.8,
  'triceps pushdown': 3.8,
  'romanian deadlift': 6.0,
  'leg curl': 3.8,
  'seated leg curl': 3.8,
  'calf raise': 3.8,
  'lat pulldown': 5.5,
  'seated cable row': 5.5,
  'chest supported row': 5.5,
  'face pull': 3.8,
  'incline db curl': 3.8,
  'overhead triceps extension': 3.8,
  'leg press': 6.0,
  'hack squat': 6.0,
  'split squat': 6.0,
  'hip thrust': 6.0,
};

export function getExerciseMet(name = '') {
  const n = name.toLowerCase().trim();
  for (const [key, met] of Object.entries(EXERCISE_METS)) {
    if (n.includes(key)) return met;
  }
  return 5.0; // default moderate lift
}

export function calculateSetCalories(name = '', weightKg = 91.5) {
  const met = getExerciseMet(name);
  // ~45 sec work + 90 sec rest = 2.25 min / set
  const burn = met * 3.5 * weightKg / 200 * 0.75;
  return Math.round(burn * 10) / 10;
}

export function calculateDayCalories(day, weightKg = 91.5) {
  if (!day) return { total_estimated_kcal: 350, total_completed_kcal: 0 };

  let est = 0;
  let comp = 0;

  // 1. Warm-up
  const warmups = day.warmup_stretches || [];
  const warmupPerStretch = (2.5 * 3.5 * weightKg / 200) * 1.5; // ~5 kcal
  est += Math.round(warmups.length * warmupPerStretch);
  comp += Math.round(warmups.filter(w => w.completed).length * warmupPerStretch);

  // 2. Strength Sets
  const exercises = day.parsed_exercises || [];
  exercises.forEach(ex => {
    const setBurn = calculateSetCalories(ex.name, weightKg);
    const sets = ex.logged_sets || [];
    let plannedSets = 3;
    if (ex.target) {
      const m = ex.target.match(/^(\d+)/);
      if (m) plannedSets = parseInt(m[1], 10);
    }
    const totalSets = sets.length > 0 ? sets.length : plannedSets;
    const completedSets = sets.filter(s => s.completed).length;

    est += Math.round(setBurn * totalSets);
    comp += Math.round(setBurn * completedSets);
  });

  // 3. Conditioning
  const condRaw = (day.bodyweight_conditioning || '').toLowerCase();
  const hasCond = condRaw && !condRaw.includes('optional') && !condRaw.includes('no conditioning');
  if (hasCond) {
    const condBurn = Math.round((7.5 * 3.5 * weightKg / 200) * 8); // ~95 kcal
    est += condBurn;
    if (day.conditioning_completed) comp += condBurn;
  }

  // 4. Cardio
  const cardioRaw = (day.cardio || '').toLowerCase();
  const hasCardio = cardioRaw && !cardioRaw.includes('none') && !cardioRaw.includes('optional');
  if (hasCardio) {
    const cardioBurn = Math.round((5.3 * 3.5 * weightKg / 200) * 15); // ~100 kcal
    est += cardioBurn;
    if (day.cardio_completed) comp += cardioBurn;
  }

  // 5. Cool-down
  const cooldowns = day.cooldown_stretches || [];
  const cooldownPerStretch = (2.0 * 3.5 * weightKg / 200) * 1.0; // ~3.2 kcal
  est += Math.round(cooldowns.length * cooldownPerStretch);
  comp += Math.round(cooldowns.filter(c => c.completed).length * cooldownPerStretch);

  return {
    total_estimated_kcal: Math.max(est, 250),
    total_completed_kcal: comp,
  };
}

