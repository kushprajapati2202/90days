/**
 * Progressive Overload & Weight Memory Engine
 * Computes historical lifting performance, personal records, and progressive overload targets.
 */

/**
 * Find previous performance for a given movement prior to the current day.
 * @param {string} exerciseName - Name of the exercise
 * @param {number} currentDayNumber - Active day number
 * @param {Array} allDays - All days in the workout plan
 * @returns {Object|null} Historical lifting stats
 */
export function getExerciseHistory(exerciseName, currentDayNumber, allDays = []) {
  if (!exerciseName || !allDays || !Array.isArray(allDays) || allDays.length === 0) {
    return null;
  }

  const cleanName = exerciseName.trim().toLowerCase();
  let lastSession = null;
  let allRecordedSets = [];

  // Sort days ascending to ensure chronological evaluation
  const sortedDays = [...allDays].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));

  for (const day of sortedDays) {
    // Only look at days prior to current day
    if (day.day_number >= currentDayNumber) continue;

    const exercises = day.parsed_exercises || [];
    const matched = exercises.find((e) => {
      const eName = (e.name || '').trim().toLowerCase();
      return eName === cleanName || eName.includes(cleanName) || cleanName.includes(eName);
    });

    if (matched && matched.logged_sets && matched.logged_sets.length > 0) {
      // Filter sets with actual recorded numeric weight or reps
      const validSets = matched.logged_sets.filter((s) => {
        const w = Number(s.weight_kg) || 0;
        const r = Number(s.reps) || 0;
        return w > 0 || r > 0;
      });

      if (validSets.length > 0) {
        lastSession = {
          day_number: day.day_number,
          date_display: day.date_display,
          day_type: day.day_type,
          sets: validSets,
        };
        allRecordedSets.push(
          ...validSets.map((s) => ({ ...s, day_number: day.day_number }))
        );
      }
    }
  }

  if (!lastSession && allRecordedSets.length === 0) {
    return null;
  }

  // Find top set from the most recent session
  let topLastSet = null;
  if (lastSession && lastSession.sets.length > 0) {
    topLastSet = lastSession.sets.reduce((prev, curr) => {
      const prevW = Number(prev.weight_kg) || 0;
      const currW = Number(curr.weight_kg) || 0;
      const prevR = Number(prev.reps) || 0;
      const currR = Number(curr.reps) || 0;
      if (currW > prevW) return curr;
      if (currW === prevW && currR > prevR) return curr;
      return prev;
    }, lastSession.sets[0]);
  }

  // Find all-time personal best across the whole challenge
  let allTimeBest = null;
  if (allRecordedSets.length > 0) {
    allTimeBest = allRecordedSets.reduce((prev, curr) => {
      const prevW = Number(prev.weight_kg) || 0;
      const currW = Number(curr.weight_kg) || 0;
      const prevR = Number(prev.reps) || 0;
      const currR = Number(curr.reps) || 0;
      if (currW > prevW) return curr;
      if (currW === prevW && currR > prevR) return curr;
      return prev;
    }, allRecordedSets[0]);
  }

  // Generate actionable progressive overload guidance
  let overloadTip = '';
  if (topLastSet) {
    const topW = Number(topLastSet.weight_kg) || 0;
    const topR = Number(topLastSet.reps) || 0;
    if (topW > 0) {
      overloadTip = `Aim for ${topW} kg × ${topR + 1}+ reps, or +1–2.5 kg`;
    } else if (topR > 0) {
      overloadTip = `Aim for ${topR + 1}+ controlled reps`;
    }
  }

  return {
    lastSession,
    topLastSet,
    allTimeBest,
    overloadTip,
  };
}

/**
 * Get previous session stats for a specific set index (e.g. Set 1, Set 2).
 */
export function getPreviousSet(history, setIndex) {
  if (!history || !history.lastSession || !history.lastSession.sets) {
    return null;
  }
  const sets = history.lastSession.sets;
  if (sets[setIndex]) {
    return sets[setIndex];
  }
  // If user is doing more sets than last time, fallback to the top set
  return history.topLastSet || sets[sets.length - 1] || null;
}

/**
 * Compare current set against previous performance to detect personal records or overload gains.
 */
export function checkSetProgress(currentWeight, currentReps, prevWeight, prevReps) {
  const cW = Number(currentWeight) || 0;
  const cR = Number(currentReps) || 0;
  const pW = Number(prevWeight) || 0;
  const pR = Number(prevReps) || 0;

  if (cW <= 0 && cR <= 0) return null;
  if (pW <= 0 && pR <= 0) return null;

  const weightDiff = +(cW - pW).toFixed(1);
  const repsDiff = cR - pR;

  // Weight progression (e.g. +2.5 kg with matched or better reps)
  if (weightDiff > 0 && repsDiff >= 0) {
    return {
      isPR: true,
      label: `+${weightDiff} kg 🏆`,
      type: 'weight',
    };
  }

  // Weight progression with slightly fewer reps (still an overload if weight jumped)
  if (weightDiff >= 2.5 && repsDiff >= -2) {
    return {
      isPR: true,
      label: `+${weightDiff} kg 🔥`,
      type: 'weight',
    };
  }

  // Repetition progression at same weight
  if (weightDiff === 0 && repsDiff > 0) {
    return {
      isPR: true,
      label: `+${repsDiff} rep${repsDiff > 1 ? 's' : ''} ⚡`,
      type: 'reps',
    };
  }

  // Matched previous best
  if (weightDiff === 0 && repsDiff === 0 && cW > 0) {
    return {
      isPR: false,
      label: 'Matched ✓',
      type: 'matched',
    };
  }

  return null;
}
