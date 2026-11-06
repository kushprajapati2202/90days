import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Play } from 'lucide-react';
import { TbBarbell, TbStretching, TbStretching2, TbRun } from 'react-icons/tb';
import { FaFireFlameCurved, FaPersonRunning } from 'react-icons/fa6';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';
import { api } from '../services/api';
import { calculateDayCalories, calculateSetCalories, calculateExerciseTotalCalories } from '../utils/calories';
import { formatTimeOfDay, formatDuration, formatStopwatch } from '../utils/timeFormat';
import { getExerciseHistory, getPreviousSet, checkSetProgress } from '../utils/progressiveOverload';
import { parseConditioningAndCardio } from '../utils/conditioning';
import CelebrationModal from './CelebrationModal';

export default function InteractiveWorkoutSection({
  day,
  onDayUpdated,
  onLaunchRestTimer,
  onOpenExerciseGuide,
  stats,
  allDays = [],
  embedded = false,
}) {
  if (!day) return null;

  const [activeDay, setActiveDay] = useState(JSON.parse(JSON.stringify(day)));
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [collapsedExercises, setCollapsedExercises] = useState({});
  const autoSaveTimerRef = useRef(null);
  const activeDayNumberRef = useRef(day?.day_number);

  useEffect(() => {
    if (day && day.day_number !== activeDayNumberRef.current) {
      activeDayNumberRef.current = day.day_number;
      setActiveDay(JSON.parse(JSON.stringify(day)));
    }
  }, [day?.day_number]);

  // Live session running timer
  useEffect(() => {
    let interval = null;
    if (activeDay?.started_at && !activeDay?.completed) {
      const updateTimer = () => {
        const sTime = new Date(activeDay.started_at).getTime();
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((now - sTime) / 1000));
        if (diffSecs > 4 * 3600 && activeDay.ended_at) {
          const eTime = new Date(activeDay.ended_at).getTime();
          setSessionSeconds(Math.max(0, Math.floor((eTime - sTime) / 1000)));
        } else {
          setSessionSeconds(diffSecs);
        }
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDay?.started_at, activeDay?.ended_at, activeDay?.completed]);

  // Automatic timestamp stamping on ANY user logging action
  const stampActivityTimes = (clone) => {
    const nowIso = new Date().toISOString();
    if (!clone.started_at) {
      clone.started_at = nowIso;
    }
    clone.ended_at = nowIso;
    try {
      const s = new Date(clone.started_at).getTime();
      const dur = Math.max(1, Math.round((Date.now() - s) / 60000));
      if (!clone.actual_duration_min || Number(clone.actual_duration_min) <= 0) {
        clone.actual_duration_min = dur <= 240 ? dur : 60;
      } else if (dur <= 180 && Number(clone.actual_duration_min) > 0 && Number(clone.actual_duration_min) <= 180) {
        clone.actual_duration_min = dur;
      }
    } catch (_) {}
    return clone;
  };

  // Recalculate completion percentage
  const calculateProgress = (d) => {
    let total = 0;
    let done = 0;

    // warmups
    (d.warmup_stretches || []).forEach((w) => {
      total++;
      if (w.completed) done++;
    });

    // exercises
    (d.parsed_exercises || []).forEach((ex) => {
      const sets = ex.logged_sets || [];
      const count = sets.length || 3;
      total += count;
      done += sets.filter((s) => s.completed).length;
    });

    // conditioning
    if (d.bodyweight_conditioning && !d.bodyweight_conditioning.toLowerCase().includes('no conditioning')) {
      total++;
      if (d.conditioning_completed) done++;
    }

    // cardio
    if (d.cardio && !d.cardio.toLowerCase().includes('none') && !d.cardio.toLowerCase().includes('optional relaxed')) {
      total++;
      if (d.cardio_completed) done++;
    }

    // cooldowns
    (d.cooldown_stretches || []).forEach((c) => {
      total++;
      if (c.completed) done++;
    });

    if (total === 0) return d.completed ? 100 : 0;
    if (done >= total) return 100;
    const pct = Math.round((done / total) * 100);
    return pct >= 100 ? 99 : pct;
  };

  const triggerAutoSave = (updatedDay, immediateParentSync = true, debounceMs = 150) => {
    setActiveDay(updatedDay);
    setSaveStatus('saving');

    // Instant optimistic UI: parent state, progress bars, and localStorage refresh instantly (<1ms)
    if (immediateParentSync && onDayUpdated) {
      onDayUpdated(updatedDay);
    }

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await api.updateDay(updatedDay.day_number, {
          started_at: updatedDay.started_at || null,
          ended_at: updatedDay.ended_at || null,
          actual_weight_kg: updatedDay.actual_weight_kg ? Number(updatedDay.actual_weight_kg) : null,
          actual_steps: updatedDay.actual_steps ? Number(updatedDay.actual_steps) : null,
          actual_duration_min: updatedDay.actual_duration_min ? Number(updatedDay.actual_duration_min) : null,
          rpe_rating: updatedDay.rpe_rating ? Number(updatedDay.rpe_rating) : null,
          user_notes: updatedDay.user_notes || '',
          completed: !!updatedDay.completed,
          conditioning_completed: !!updatedDay.conditioning_completed,
          cardio_completed: !!updatedDay.cardio_completed,
          warmup_stretches: updatedDay.warmup_stretches,
          cooldown_stretches: updatedDay.cooldown_stretches,
          parsed_exercises: updatedDay.parsed_exercises,
        });
        setSaveStatus('saved');
        if (!immediateParentSync && onDayUpdated) {
          onDayUpdated(updatedDay);
        }
      } catch (e) {
        console.error('AutoSave failed:', e);
        setSaveStatus('error');
      }
    }, debounceMs);
  };

  // Toggle Warmup / Cooldown stretch
  const toggleStretch = (listKey, idx) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    clone[listKey][idx].completed = !clone[listKey][idx].completed;
    const newProgress = calculateProgress(clone);
    clone.completion_percentage = newProgress;
    sounds.playSetCheck();
    if (newProgress === 100) {
      if (!activeDay.completed) {
        const nowIso = new Date().toISOString();
        clone.completed = true;
        clone.completed_at = nowIso;
        clone.ended_at = nowIso;
        setShowCelebration(true);
      }
    } else {
      clone.completed = false;
      clone.completed_at = null;
    }
    triggerAutoSave(clone);
  };

  // Toggle Conditioning Drill or Cardio Item
  const toggleConditioningCardioItem = (item) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    sounds.playSetCheck();

    if (item.type === 'cardio') {
      clone.cardio_completed = !clone.cardio_completed;
    } else {
      const condItems = parseConditioningAndCardio(clone).filter((it) => it.type === 'conditioning');
      const allDrillIndices = condItems.map((_, i) => i);
      let currentDrills = Array.isArray(clone.conditioning_drills)
        ? [...clone.conditioning_drills]
        : (clone.conditioning_completed ? allDrillIndices : []);

      if (currentDrills.includes(item.index)) {
        currentDrills = currentDrills.filter((i) => i !== item.index);
      } else {
        currentDrills.push(item.index);
      }
      clone.conditioning_drills = currentDrills;
      clone.conditioning_completed = condItems.length > 0 && condItems.every((_, i) => currentDrills.includes(i));
    }

    const newProgress = calculateProgress(clone);
    clone.completion_percentage = newProgress;
    if (newProgress === 100) {
      if (!activeDay.completed) {
        const nowIso = new Date().toISOString();
        clone.completed = true;
        clone.completed_at = nowIso;
        clone.ended_at = nowIso;
        setShowCelebration(true);
      }
    } else {
      clone.completed = false;
      clone.completed_at = null;
    }
    triggerAutoSave(clone);
  };

  const isConditioningItemCompleted = (item) => {
    if (item.type === 'cardio') {
      return !!activeDay.cardio_completed;
    }
    if (activeDay.conditioning_completed) return true;
    if (Array.isArray(activeDay.conditioning_drills)) {
      return activeDay.conditioning_drills.includes(item.index);
    }
    return false;
  };

  // Log or Toggle Set
  const handleSetToggle = (exIdx, setIdx) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    const ex = clone.parsed_exercises[exIdx];
    if (!ex.logged_sets) ex.logged_sets = [];

    let planned = 3;
    if (ex.target) {
      const m = ex.target.match(/^(\d+)/);
      if (m) planned = parseInt(m[1], 10);
    }
    while (ex.logged_sets.length < planned) {
      ex.logged_sets.push({
        set_num: ex.logged_sets.length + 1,
        weight_kg: '',
        reps: '',
        completed: false,
      });
    }

    const set = ex.logged_sets[setIdx];
    const willBeCompleted = !set.completed;
    set.completed = willBeCompleted;

    if (willBeCompleted) {
      sounds.playSetCheck();
    }

    const newProgress = calculateProgress(clone);
    clone.completion_percentage = newProgress;

    // Only 100% completed when ALL tasks across warmups, exercises, conditioning, cardio, and cooldowns are finished!
    if (newProgress === 100) {
      if (!activeDay.completed) {
        const nowIso = new Date().toISOString();
        clone.completed = true;
        clone.completed_at = nowIso;
        clone.ended_at = nowIso;
        try {
          const s = new Date(clone.started_at || nowIso).getTime();
          const dur = Math.max(1, Math.round((Date.now() - s) / 60000));
          clone.actual_duration_min = dur <= 240 ? dur : 65;
        } catch (_) {
          clone.actual_duration_min = 65;
        }
        setShowCelebration(true);
      }
    } else {
      clone.completed = false;
      clone.completed_at = null;
    }
    triggerAutoSave(clone);
  };

  const handleSetInputChange = (exIdx, setIdx, field, value) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    const ex = clone.parsed_exercises[exIdx];
    if (!ex.logged_sets) ex.logged_sets = [];
    if (!ex.logged_sets[setIdx]) {
      ex.logged_sets[setIdx] = { set_num: setIdx + 1, weight_kg: '', reps: '', completed: false };
    }
    ex.logged_sets[setIdx][field] = value === '' ? '' : value;
    triggerAutoSave(clone, false, 300);
  };

  const handleAutofillPrevious = (exIdx, history) => {
    if (!history || !history.lastSession || !history.lastSession.sets) return;
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    const ex = clone.parsed_exercises[exIdx];
    if (!ex.logged_sets) ex.logged_sets = [];

    const pastSets = history.lastSession.sets;
    let targetCount = ex.logged_sets.length;
    if (targetCount === 0 && ex.target) {
      const m = ex.target.match(/^(\d+)/);
      targetCount = m ? parseInt(m[1], 10) : 3;
    }
    targetCount = Math.max(targetCount, pastSets.length);

    const updatedSets = [];
    for (let i = 0; i < targetCount; i++) {
      const past = pastSets[i] || history.topLastSet || pastSets[pastSets.length - 1];
      const existing = ex.logged_sets[i] || {};
      const w = Number(past?.weight_kg) || 0;
      const r = Number(past?.reps) || 0;
      updatedSets.push({
        set_num: i + 1,
        weight_kg: w > 0 ? w : '',
        reps: r > 0 ? r : '',
        completed: existing.completed || false,
      });
    }
    ex.logged_sets = updatedSets;
    triggerAutoSave(clone);
  };

  const toggleExerciseCollapse = (idx) => {
    setCollapsedExercises((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const userWeight = activeDay.actual_weight_kg || stats?.weight_stats?.current_weight_kg || 91.5;
  const cal = calculateDayCalories(activeDay, userWeight);
  const condCardioItems = parseConditioningAndCardio(activeDay);
  const isAllDone = !!activeDay.completed;
  const allExercisesDone = (activeDay.parsed_exercises || []).length > 0 &&
    (activeDay.parsed_exercises || []).every((ex) => {
      const sets = ex.logged_sets || [];
      return sets.length > 0 && sets.every((s) => s.completed);
    });

  return (
    <div className="space-y-4">
      {/* Session Timing Header Strip */}
      <div className="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.08] flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          {activeDay.started_at && !activeDay.completed ? (
            <span className="flex items-center space-x-2 text-volt font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-volt opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-volt" />
              </span>
              <span className="font-heading font-black text-[11px] tracking-wide">ACTIVE SESSION</span>
              <span className="font-mono text-white bg-dark-900 px-2 py-0.5 rounded-md border border-white/10 font-bold">
                ⏱ {formatStopwatch(sessionSeconds)}
              </span>
            </span>
          ) : activeDay.completed ? (
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-400/20" />
              <span>Session Completed • {activeDay.actual_duration_min || 65} mins total</span>
            </span>
          ) : (
            <span className="text-zinc-400 flex items-center space-x-1 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Timer starts on your first logged rep</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono">
          {activeDay.started_at && (
            <span className="text-zinc-400">
              Started {formatTimeOfDay(activeDay.started_at)}
              {activeDay.ended_at && ` • Last activity ${formatTimeOfDay(activeDay.ended_at)}`}
            </span>
          )}
        </div>
      </div>

      {/* 1. DYNAMIC WARM-UP & MOBILITY */}
      {activeDay.warmup_stretches && activeDay.warmup_stretches.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
              <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">1</span>
              <TbStretching2 className="w-4 h-4 text-amber-400" />
              <span>Dynamic Warm-Up Mobility</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="text-amber-400 font-bold">~25 kcal</span>
              <span className="text-zinc-400">
                {activeDay.warmup_stretches.filter((w) => w.completed).length}/{activeDay.warmup_stretches.length} Done
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {activeDay.warmup_stretches.map((stretch, idx) => {
              const thumb = stretch.gif_url || stretch.media?.gif_url || stretch.media?.images?.[0] || '';
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl transition flex items-center justify-between gap-3 ${
                    stretch.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {thumb ? (
                      <div
                        onClick={() => (stretch.media || stretch) && onOpenExerciseGuide && onOpenExerciseGuide({ ...(stretch.media || {}), name: stretch.name, prescribed_name: stretch.name, focus: stretch.focus })}
                        className="w-11 h-11 rounded-lg overflow-hidden bg-dark-950 shrink-0 border border-white/10 cursor-pointer relative group"
                        title="Tap to see form guide"
                      >
                        <img
                          src={thumb}
                          alt={stretch.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition"
                          onError={(e) => {
                            const staticImg = stretch.media?.images?.find((p) => !p.toLowerCase().includes('.gif'));
                            if (staticImg && e.currentTarget.src !== staticImg) {
                              e.currentTarget.src = staticImg;
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-dark-950 flex items-center justify-center shrink-0 border border-white/5 text-amber-400/70">
                        <TbStretching2 className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs truncate ${stretch.completed ? 'text-zinc-400 line-through' : 'text-zinc-200 font-semibold'}`}>
                        {stretch.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono block">{stretch.reps_or_time} • ~5 kcal</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStretch('warmup_stretches', idx)}
                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition active:scale-90 ${
                      stretch.completed ? 'bg-emerald-400 text-dark-950 font-bold' : 'border border-zinc-700 hover:border-zinc-500 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. PRIMARY STRENGTH LIFTS */}
      <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
            <span className="w-5 h-5 rounded-md bg-volt/20 text-volt flex items-center justify-center text-[10px] font-bold">2</span>
            <TbBarbell className="w-4 h-4 text-volt" />
            <span>Primary Strength Movements</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {(activeDay.parsed_exercises || []).length} Movements
          </span>
        </div>

        {allExercisesDone && (activeDay.completion_percentage || 0) < 100 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center space-x-2">
            <span className="font-bold">⚡ All main lifts completed!</span>
            <span className="text-zinc-300 text-[11px]">Finish remaining warm-up, cardio, and cool-down to reach 100%.</span>
          </div>
        )}

        <div className="space-y-3">
          {(activeDay.parsed_exercises || []).map((ex, exIdx) => {
            const history = getExerciseHistory(ex.name, activeDay.day_number, allDays);
            let plannedSetsCount = 3;
            if (ex.target) {
              const m = ex.target.match(/^(\d+)/);
              if (m) plannedSetsCount = parseInt(m[1], 10);
            }
            const sets = ex.logged_sets && ex.logged_sets.length > 0
              ? ex.logged_sets
              : Array.from({ length: plannedSetsCount }, (_, i) => ({ set_num: i + 1, weight_kg: '', reps: '', completed: false }));

            const doneCount = sets.filter((s) => s.completed).length;
            const setPct = Math.round((doneCount / Math.max(1, sets.length)) * 100);
            const isExDone = sets.length > 0 && doneCount === sets.length;
            const exCal = calculateExerciseTotalCalories(ex.name, sets.length, userWeight);
            const isCollapsed = collapsedExercises[exIdx];
            const thumbUrl = ex.gif_url || ex.media?.gif_url || ex.media?.images?.[0] || '';

            return (
              <div
                key={exIdx}
                className="rounded-2xl bg-dark-850/90 border border-white/[0.06] overflow-hidden transition"
              >
                {/* Exercise Header */}
                <div className="p-3 flex items-center justify-between gap-2 border-b border-white/[0.04]">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Media Thumbnail */}
                    {thumbUrl ? (
                      <div
                        onClick={() => (ex.media || ex) && onOpenExerciseGuide && onOpenExerciseGuide({ ...(ex.media || {}), name: ex.name, prescribed_name: ex.name, target: ex.target })}
                        className="w-12 h-12 rounded-xl overflow-hidden bg-dark-950 shrink-0 border border-white/10 cursor-pointer relative group"
                        title="Tap to see form guide"
                      >
                        <img
                          src={thumbUrl}
                          alt={ex.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition"
                          onError={(e) => {
                            const staticImg = ex.media?.images?.find((p) => !p.toLowerCase().includes('.gif'));
                            if (staticImg && e.currentTarget.src !== staticImg) {
                              e.currentTarget.src = staticImg;
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-dark-950 flex items-center justify-center shrink-0 text-volt border border-white/5">
                        <TbBarbell className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white truncate font-heading">{ex.name}</h4>
                        {isExDone && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400">
                            DONE ✓
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                        <span>Target: {ex.target || '3 sets'}</span>
                        {history && history.topLastSet && (
                          <>
                            <span>•</span>
                            <span className="text-volt font-bold">
                              Last: {history.topLastSet.weight_kg ? `${history.topLastSet.weight_kg}kg × ` : ''}{history.topLastSet.reps}r
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-amber-400 font-bold">~{exCal} kcal</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {history && history.lastSession && (
                      <button
                        type="button"
                        onClick={() => handleAutofillPrevious(exIdx, history)}
                        title="Autofill previous weights/reps"
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition"
                      >
                        Autofill
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExerciseCollapse(exIdx)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Set Logging Rows */}
                {!isCollapsed && (
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                      <div className="col-span-2">Set</div>
                      <div className="col-span-4 text-center">Weight (kg)</div>
                      <div className="col-span-4 text-center">Reps</div>
                      <div className="col-span-2 text-center">Done</div>
                    </div>

                    {sets.map((set, setIdx) => {
                      const prevSet = getPreviousSet(history, setIdx);
                      const progress = checkSetProgress(set.weight_kg, set.reps, prevSet?.weight_kg, prevSet?.reps);
                      const weightPlaceholder = prevSet?.weight_kg ? String(prevSet.weight_kg) : '50';
                      const repsPlaceholder = prevSet?.reps ? String(prevSet.reps) : '10';

                      return (
                        <div
                          key={setIdx}
                          className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition ${
                            set.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-900 border border-white/[0.04]'
                          }`}
                        >
                          <div className="col-span-2 flex items-center space-x-1">
                            <span className="w-5 h-5 rounded-md bg-white/5 text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                              {setIdx + 1}
                            </span>
                            {prevSet && (
                              <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline" title="Previous Session">
                                {prevSet.weight_kg ? `${prevSet.weight_kg}k` : `${prevSet.reps}r`}
                              </span>
                            )}
                          </div>

                          <div className="col-span-4 relative">
                            <input
                              type="number"
                              step="0.5"
                              value={
                                set.weight_kg === 0 || set.weight_kg === '0' || set.weight_kg === undefined || set.weight_kg === null || set.weight_kg === ''
                                  ? ''
                                  : set.weight_kg
                              }
                              onChange={(e) => handleSetInputChange(exIdx, setIdx, 'weight_kg', e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '0' || e.target.value === '0.0') {
                                  handleSetInputChange(exIdx, setIdx, 'weight_kg', '');
                                } else {
                                  e.target.select();
                                }
                              }}
                              placeholder={weightPlaceholder}
                              className="w-full bg-dark-850 border border-white/10 rounded-xl px-1.5 py-2 text-sm text-center font-bold text-white focus:outline-none focus:border-volt placeholder:text-zinc-600 min-h-[38px]"
                            />
                          </div>

                          <div className="col-span-4 relative">
                            <input
                              type="number"
                              value={
                                set.reps === 0 || set.reps === '0' || set.reps === undefined || set.reps === null || set.reps === ''
                                  ? ''
                                  : set.reps
                              }
                              onChange={(e) => handleSetInputChange(exIdx, setIdx, 'reps', e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '0') {
                                  handleSetInputChange(exIdx, setIdx, 'reps', '');
                                } else {
                                  e.target.select();
                                }
                              }}
                              placeholder={repsPlaceholder}
                              className="w-full bg-dark-850 border border-white/10 rounded-xl px-1.5 py-2 text-sm text-center font-bold text-white focus:outline-none focus:border-volt placeholder:text-zinc-600 min-h-[38px]"
                            />
                          </div>

                          <div className="col-span-2 flex flex-col items-center justify-center space-y-0.5">
                            <button
                              type="button"
                              onClick={() => handleSetToggle(exIdx, setIdx)}
                              className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition active:scale-90 ${
                                set.completed ? 'bg-emerald-400 text-dark-950 font-bold' : 'bg-white/5 border border-zinc-700 text-zinc-500 hover:text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            {progress && (
                              <span className={`text-[8px] leading-none px-1 py-0.5 rounded font-mono font-black uppercase ${
                                progress.isPR ? 'bg-amber-400 text-dark-950' : 'bg-white/10 text-zinc-400'
                              }`}>
                                {progress.label}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CONDITIONING & CARDIO */}
      {condCardioItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
              <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">3</span>
              <FaPersonRunning className="w-4 h-4 text-cyan-400" />
              <span>Conditioning & Cardio</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="text-amber-400 font-bold">
                ~{condCardioItems.reduce((acc, it) => acc + (it.calories || 40), 0)} kcal
              </span>
              <span className="text-zinc-400">
                {condCardioItems.filter((it) => isConditioningItemCompleted(it)).length}/{condCardioItems.length} Done
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {condCardioItems.map((item) => {
              const isDone = isConditioningItemCompleted(item);
              const thumb = item.gif_url || item.media?.gif_url || item.media?.images?.[0] || '';
              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-xl transition flex items-center justify-between gap-3 ${
                    isDone ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {thumb ? (
                      <div
                        onClick={() => (item.media || item) && onOpenExerciseGuide && onOpenExerciseGuide({ ...(item.media || {}), name: item.name || item.drill || item.activity, prescribed_name: item.name || item.drill || item.activity })}
                        className="w-11 h-11 rounded-lg overflow-hidden bg-dark-950 shrink-0 border border-white/10 cursor-pointer relative group"
                        title="Tap to see form guide"
                      >
                        <img
                          src={thumb}
                          alt={item.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition"
                          onError={(e) => {
                            const staticImg = item.media?.images?.find((p) => !p.toLowerCase().includes('.gif'));
                            if (staticImg && e.currentTarget.src !== staticImg) {
                              e.currentTarget.src = staticImg;
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-dark-950 flex items-center justify-center shrink-0 border border-white/5 text-cyan-400">
                        <FaPersonRunning className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs truncate ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-200 font-semibold'}`}>
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {item.prescription} • ~{item.calories} kcal
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleConditioningCardioItem(item)}
                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition active:scale-90 ${
                      isDone ? 'bg-emerald-400 text-dark-950 font-bold' : 'border border-zinc-700 hover:border-zinc-500 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. COOL-DOWN STRETCHES */}
      {activeDay.cooldown_stretches && activeDay.cooldown_stretches.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
              <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">4</span>
              <TbStretching className="w-4 h-4 text-purple-400" />
              <span>Cool-Down Static Stretches</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="text-amber-400 font-bold">~20 kcal</span>
              <span className="text-zinc-400">
                {activeDay.cooldown_stretches.filter((c) => c.completed).length}/{activeDay.cooldown_stretches.length} Done
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {activeDay.cooldown_stretches.map((stretch, idx) => {
              const thumb = stretch.gif_url || stretch.media?.gif_url || stretch.media?.images?.[0] || '';
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl transition flex items-center justify-between gap-3 ${
                    stretch.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {thumb ? (
                      <div
                        onClick={() => (stretch.media || stretch) && onOpenExerciseGuide && onOpenExerciseGuide({ ...(stretch.media || {}), name: stretch.name, prescribed_name: stretch.name, focus: stretch.focus })}
                        className="w-11 h-11 rounded-lg overflow-hidden bg-dark-950 shrink-0 border border-white/10 cursor-pointer relative group"
                        title="Tap to see form guide"
                      >
                        <img
                          src={thumb}
                          alt={stretch.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition"
                          onError={(e) => {
                            const staticImg = stretch.media?.images?.find((p) => !p.toLowerCase().includes('.gif'));
                            if (staticImg && e.currentTarget.src !== staticImg) {
                              e.currentTarget.src = staticImg;
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-dark-950 flex items-center justify-center shrink-0 border border-white/5 text-purple-400/70">
                        <TbStretching className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs truncate ${stretch.completed ? 'text-zinc-400 line-through' : 'text-zinc-200 font-semibold'}`}>
                        {stretch.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono block">{stretch.reps_or_time} • ~5 kcal</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStretch('cooldown_stretches', idx)}
                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition active:scale-90 ${
                      stretch.completed ? 'bg-emerald-400 text-dark-950 font-bold' : 'border border-zinc-700 hover:border-zinc-500 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SESSION METRICS & NOTES */}
      <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-3">
        <h4 className="text-xs font-bold text-white font-heading">Session Vitals & Notes</h4>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={activeDay.actual_weight_kg === 0 || activeDay.actual_weight_kg === '0' ? '' : (activeDay.actual_weight_kg || '')}
              onChange={(e) => {
                const clone = { ...activeDay, actual_weight_kg: e.target.value };
                triggerAutoSave(clone);
              }}
              onFocus={(e) => e.target.select()}
              placeholder="91.5"
              className="w-full bg-dark-850 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Steps</label>
            <input
              type="number"
              value={activeDay.actual_steps === 0 || activeDay.actual_steps === '0' ? '' : (activeDay.actual_steps || '')}
              onChange={(e) => {
                const clone = { ...activeDay, actual_steps: e.target.value };
                triggerAutoSave(clone);
              }}
              onFocus={(e) => e.target.select()}
              placeholder="8000"
              className="w-full bg-dark-850 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Duration (min)</label>
            <input
              type="number"
              value={activeDay.actual_duration_min === 0 || activeDay.actual_duration_min === '0' ? '' : (activeDay.actual_duration_min || '')}
              onChange={(e) => {
                const clone = { ...activeDay, actual_duration_min: e.target.value };
                triggerAutoSave(clone);
              }}
              onFocus={(e) => e.target.select()}
              placeholder="65"
              className="w-full bg-dark-850 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Joint Comfort & Notes</label>
          <textarea
            rows="2"
            value={activeDay.user_notes || ''}
            onChange={(e) => {
              const clone = { ...activeDay, user_notes: e.target.value };
              triggerAutoSave(clone);
            }}
            placeholder="e.g. Joints felt great, increased load on incline press..."
            className="w-full bg-dark-850 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-volt"
          />
        </div>
      </div>

      {/* Celebration Modal on 100% finish */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        day={activeDay}
        stats={stats}
        caloriesBurned={cal.total_completed_kcal || cal.total_estimated_kcal}
      />
    </div>
  );
}

