import React, { useState, useEffect, useRef } from 'react';
import { X, Check, CheckCircle2, Flame, Timer, Scale, CloudCheck, Sparkles, ChevronDown, ChevronUp, ExternalLink, Dumbbell, Play, StopCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';
import { api } from '../services/api';
import { calculateDayCalories, calculateSetCalories, calculateExerciseTotalCalories, getExerciseMet } from '../utils/calories';
import { formatTimeOfDay, formatDuration, formatStopwatch } from '../utils/timeFormat';
import CelebrationModal from './CelebrationModal';

export default function WorkoutModal({
  day,
  isOpen,
  onClose,
  onDayUpdated,
  onLaunchRestTimer,
  onOpenExerciseGuide,
  stats,
}) {
  if (!isOpen || !day) return null;

  const [activeDay, setActiveDay] = useState(JSON.parse(JSON.stringify(day)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    setActiveDay(JSON.parse(JSON.stringify(day)));
  }, [day]);

  // Live session running timer
  useEffect(() => {
    let interval = null;
    if (activeDay?.started_at && !activeDay?.completed) {
      const updateTimer = () => {
        const sTime = new Date(activeDay.started_at).getTime();
        const now = Date.now();
        setSessionSeconds(Math.max(0, Math.floor((now - sTime) / 1000)));
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDay?.started_at, activeDay?.completed]);

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
      clone.actual_duration_min = dur;
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

    // cooldowns
    (d.cooldown_stretches || []).forEach((c) => {
      total++;
      if (c.completed) done++;
    });

    if (total === 0) return d.completed ? 100 : 0;
    return Math.round((done / total) * 100);
  };

  const triggerAutoSave = (updatedDay) => {
    setActiveDay(updatedDay);
    setSaveStatus('saving');

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
        if (onDayUpdated) onDayUpdated(updatedDay);
      } catch (e) {
        console.error('AutoSave failed:', e);
        setSaveStatus('error');
      }
    }, 600);
  };

  const handleStartWorkoutSession = () => {
    const clone = JSON.parse(JSON.stringify(activeDay));
    const nowIso = new Date().toISOString();
    clone.started_at = nowIso;
    clone.ended_at = nowIso;
    clone.actual_duration_min = 1;
    triggerAutoSave(clone);
    sounds.playSetCheck();
  };

  const handleFinishWorkoutSession = () => {
    const clone = JSON.parse(JSON.stringify(activeDay));
    const nowIso = new Date().toISOString();
    if (!clone.started_at) clone.started_at = nowIso;
    clone.ended_at = nowIso;
    clone.completed = true;
    clone.completed_at = nowIso;
    clone.completion_percentage = 100;
    try {
      const s = new Date(clone.started_at).getTime();
      const dur = Math.max(1, Math.round((Date.now() - s) / 60000));
      clone.actual_duration_min = dur;
    } catch (_) {
      clone.actual_duration_min = 45;
    }
    triggerAutoSave(clone);
    setShowCelebration(true);
  };

  // Toggle Warmup / Cooldown stretch
  const toggleStretch = (listKey, idx) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    clone[listKey][idx].completed = !clone[listKey][idx].completed;
    const newProgress = calculateProgress(clone);
    clone.completion_percentage = newProgress;
    sounds.playSetCheck();
    if (newProgress === 100 && !activeDay.completed) {
      clone.completed = true;
      clone.completed_at = new Date().toISOString();
      setShowCelebration(true);
    }
    triggerAutoSave(clone);
  };

  // Log or Toggle Set
  const handleSetToggle = (exIdx, setIdx) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    const ex = clone.parsed_exercises[exIdx];
    if (!ex.logged_sets) ex.logged_sets = [];

    // Ensure sets exist
    let planned = 3;
    if (ex.target) {
      const m = ex.target.match(/^(\d+)/);
      if (m) planned = parseInt(m[1], 10);
    }
    while (ex.logged_sets.length < planned) {
      ex.logged_sets.push({
        set_num: ex.logged_sets.length + 1,
        weight_kg: 0,
        reps: 10,
        completed: false,
      });
    }

    const set = ex.logged_sets[setIdx];
    const willBeCompleted = !set.completed;
    set.completed = willBeCompleted;

    if (willBeCompleted) {
      sounds.playSetCheck();
      onLaunchRestTimer(90); // auto launch 90s rest
    }

    const newProgress = calculateProgress(clone);
    clone.completion_percentage = newProgress;
    if (newProgress === 100 && !activeDay.completed) {
      clone.completed = true;
      clone.completed_at = new Date().toISOString();
      setShowCelebration(true);
    }
    triggerAutoSave(clone);
  };

  const handleSetInputChange = (exIdx, setIdx, field, value) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    const ex = clone.parsed_exercises[exIdx];
    if (!ex.logged_sets) ex.logged_sets = [];
    if (!ex.logged_sets[setIdx]) {
      ex.logged_sets[setIdx] = { set_num: setIdx + 1, weight_kg: 0, reps: 10, completed: false };
    }
    ex.logged_sets[setIdx][field] = Number(value) || 0;
    triggerAutoSave(clone);
  };

  // Toggle Entire Day Complete
  const handleToggleDayComplete = (checked) => {
    const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
    clone.completed = checked;
    if (checked) {
      clone.completion_percentage = 100;
      clone.completed_at = new Date().toISOString();
      setShowCelebration(true);
    } else {
      clone.completed_at = null;
    }
    triggerAutoSave(clone);
  };

  const userWeight = activeDay.actual_weight_kg || 91.5;
  const cal = calculateDayCalories(activeDay, userWeight);
  const pct = activeDay.completion_percentage !== undefined ? activeDay.completion_percentage : (activeDay.completed ? 100 : 0);

  return (
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div class="w-full sm:max-w-2xl bg-dark-850 border border-white/[0.1] rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Mobile Drag Pill */}
        <div class="sm:hidden w-10 h-1 bg-white/25 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Sticky Header */}
        <div class="p-3.5 sm:p-4 border-b border-white/[0.08] bg-dark-900 shrink-0 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="px-2.5 py-1 rounded-lg text-xs font-black font-heading bg-volt text-dark-950">
                DAY {activeDay.day_number}
              </span>
              <div>
                <h2 class="text-xs sm:text-sm font-bold text-white font-heading line-clamp-1">
                  {activeDay.day_type}
                </h2>
                <span class="text-[10px] text-zinc-400 font-mono">
                  {activeDay.date_display} • Week {activeDay.week_number}
                </span>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <button
                onClick={() => onLaunchRestTimer(90)}
                class="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 text-rose-400 text-[11px] font-bold border border-white/5 flex items-center space-x-1"
                title="Launch Rest Timer"
              >
                <Timer class="w-3.5 h-3.5" />
                <span class="font-mono">90s Rest</span>
              </button>

              <button
                onClick={onClose}
                class="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Live Session Progress Bar & Calories Indicator */}
          <div class="pt-1">
            <div class="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
              <span class="text-zinc-400 flex items-center space-x-1">
                <span>Progress:</span>
                <span class={pct === 100 ? 'text-volt' : 'text-white'}>{pct}% Done</span>
              </span>
              <span class="text-amber-400 flex items-center space-x-1">
                <Flame class="w-3.5 h-3.5 fill-amber-400 inline" />
                <span>{cal.total_completed_kcal} / {cal.total_estimated_kcal} kcal</span>
              </span>
            </div>
            <div class="w-full h-2 rounded-full bg-dark-950 border border-white/[0.06] overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-volt to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(pct > 0 ? 4 : 0, pct))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Workout Session Timing Strip */}
        <div class="px-3.5 sm:px-4 py-2.5 bg-dark-850 border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            {activeDay.started_at && !activeDay.completed ? (
              <span class="flex items-center space-x-2 text-volt font-bold">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-volt opacity-75" />
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-volt" />
                </span>
                <span class="font-heading font-black text-[11px] tracking-wide">ACTIVE SESSION</span>
                <span class="font-mono text-white bg-dark-900 px-2 py-0.5 rounded-md border border-white/10 font-bold">
                  ⏱ {formatStopwatch(sessionSeconds)}
                </span>
              </span>
            ) : activeDay.completed ? (
              <span class="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <CheckCircle2 class="w-3.5 h-3.5 fill-emerald-400/20" />
                <span>Session Complete • {activeDay.actual_duration_min || 45} mins total</span>
              </span>
            ) : (
              <span class="text-zinc-400 flex items-center space-x-1 text-[11px]">
                <Clock class="w-3.5 h-3.5 text-zinc-500" />
                <span>Timer auto-starts on your first logged rep</span>
              </span>
            )}
          </div>

          <div class="flex items-center space-x-2 text-[11px] font-mono">
            {activeDay.started_at && (
              <span class="text-zinc-400 hidden sm:inline">
                Started {formatTimeOfDay(activeDay.started_at)}
                {activeDay.ended_at && ` • Last activity ${formatTimeOfDay(activeDay.ended_at)}`}
              </span>
            )}

            {!activeDay.started_at ? (
              <button
                type="button"
                onClick={handleStartWorkoutSession}
                class="px-2.5 py-1 rounded-lg bg-volt text-dark-950 hover:bg-volt-light font-black text-[11px] shadow-sm shadow-volt/20 transition flex items-center space-x-1"
              >
                <Play class="w-3 h-3 fill-dark-950" />
                <span>Start Timer</span>
              </button>
            ) : !activeDay.completed ? (
              <button
                type="button"
                onClick={handleFinishWorkoutSession}
                class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-400 hover:text-dark-950 font-bold text-[11px] border border-emerald-500/30 transition flex items-center space-x-1"
              >
                <span>Finish Session ✓</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. DYNAMIC WARM-UP & MOBILITY */}
          {activeDay.warmup_stretches && activeDay.warmup_stretches.length > 0 && (
            <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
                  <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Dynamic Warm-Up Mobility</span>
                </div>
                <div class="flex items-center space-x-2 text-[10px] font-mono">
                  <span class="text-amber-400 font-bold">~25 kcal</span>
                  <span class="text-zinc-400">
                    {activeDay.warmup_stretches.filter((w) => w.completed).length}/{activeDay.warmup_stretches.length} Done
                  </span>
                </div>
              </div>

              <div class="space-y-2">
                {activeDay.warmup_stretches.map((stretch, idx) => {
                  const thumb = stretch.media?.images?.[0] || '';
                  return (
                    <div
                      key={idx}
                      class={`p-2 rounded-xl transition flex items-center justify-between gap-3 ${
                        stretch.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04]'
                      }`}
                    >
                      <div class="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Thumbnail image if available */}
                        {thumb ? (
                          <div
                            onClick={() => stretch.media && onOpenExerciseGuide(stretch.media)}
                            class="w-11 h-11 rounded-lg overflow-hidden bg-dark-950 shrink-0 border border-white/10 cursor-pointer relative group"
                            title="Tap to see form guide"
                          >
                            <img src={thumb} alt={stretch.name} class="w-full h-full object-cover object-center group-hover:scale-105 transition" />
                          </div>
                        ) : (
                          <div class="w-11 h-11 rounded-lg bg-dark-950 flex items-center justify-center shrink-0 border border-white/5 text-zinc-600">
                            <Sparkles class="w-4 h-4 text-amber-400/60" />
                          </div>
                        )}

                        <div class="flex-1 min-w-0">
                          <h4 class={`text-xs truncate ${stretch.completed ? 'text-zinc-400 line-through' : 'text-zinc-200 font-semibold'}`}>
                            {stretch.name}
                          </h4>
                          <span class="text-[10px] text-zinc-500 font-mono block">{stretch.reps_or_time} • ~5 kcal</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleStretch('warmup_stretches', idx)}
                        class={`w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-90 ${
                          stretch.completed ? 'bg-emerald-400 text-dark-950 font-bold' : 'border border-zinc-700 hover:border-zinc-500 text-transparent'
                        }`}
                      >
                        <Check class="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. PRIMARY STRENGTH LIFTS (WITH EXERCISE PHOTOS & CALORIES) */}
          <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
                <span class="w-5 h-5 rounded-md bg-volt/20 text-volt flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Strength Lifts & Progressive Sets</span>
              </div>
              <span class="text-[10px] text-zinc-400 font-mono">
                {(activeDay.parsed_exercises || []).length} Movements
              </span>
            </div>

            {(activeDay.parsed_exercises || []).map((ex, exIdx) => {
              let plannedSetsCount = 3;
              if (ex.target) {
                const m = ex.target.match(/^(\d+)/);
                if (m) plannedSetsCount = parseInt(m[1], 10);
              }
              const sets = ex.logged_sets && ex.logged_sets.length > 0
                ? ex.logged_sets
                : Array.from({ length: plannedSetsCount }, (_, i) => ({ set_num: i + 1, weight_kg: 0, reps: 10, completed: false }));

              const doneCount = sets.filter((s) => s.completed).length;
              const setPct = Math.round((doneCount / Math.max(1, sets.length)) * 100);
              const setBurn = calculateSetCalories(ex.name, userWeight);
              const exTotalCal = calculateExerciseTotalCalories(ex.name, sets.length, userWeight);
              const met = getExerciseMet(ex.name);
              const thumbUrl = ex.media?.images?.[0] || '';

              return (
                <div key={exIdx} class="p-3 rounded-2xl bg-dark-850 border border-white/[0.06] space-y-2.5">
                  {/* Top Row: Exercise Thumbnail + Title + Calorie Burn */}
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Photo Thumbnail (Tap to open full guide) */}
                      {thumbUrl ? (
                        <div
                          onClick={() => ex.media && onOpenExerciseGuide(ex.media)}
                          class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-dark-950 shrink-0 border border-white/10 hover:border-volt/80 transition cursor-pointer relative group shadow-md"
                          title="Tap to see proper form and muscle demonstration"
                        >
                          <img
                            src={thumbUrl}
                            alt={ex.name}
                            class="w-full h-full object-cover object-center group-hover:scale-105 transition"
                          />
                          <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                        </div>
                      ) : (
                        <div class="w-14 h-14 rounded-xl bg-dark-950 flex items-center justify-center shrink-0 border border-white/10 text-zinc-600">
                          <Dumbbell class="w-6 h-6" />
                        </div>
                      )}

                      {/* Title & Metadata */}
                      <div class="flex-1 min-w-0">
                        <h4 class="text-xs sm:text-sm font-bold text-white font-heading truncate">
                          {ex.name}
                        </h4>
                        <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span class="text-[10px] text-zinc-400 font-mono font-bold">
                            Target: {ex.target}
                          </span>
                          <span class="text-zinc-600">•</span>
                          {/* Calorie burn badge */}
                          <span class="text-[10px] text-amber-400 font-mono font-bold flex items-center space-x-0.5">
                            <Flame class="w-3 h-3 fill-amber-400" />
                            <span>~{exTotalCal} kcal</span>
                          </span>
                          <span class="text-zinc-600">•</span>
                          <span class="text-[10px] text-zinc-500 font-mono">
                            MET {met} (~{setBurn} kcal/set)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Set completion badge & Form Guide Button */}
                    <div class="flex flex-col items-end space-y-1 shrink-0">
                      <span class={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        setPct === 100
                          ? 'bg-volt/15 text-volt border border-volt/30'
                          : doneCount > 0
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-white/5 text-zinc-400'
                      }`}>
                        {doneCount}/{sets.length} Sets ({setPct}%)
                      </span>

                      {ex.media && (
                        <button
                          type="button"
                          onClick={() => onOpenExerciseGuide(ex.media)}
                          class="text-[10px] font-bold text-volt flex items-center space-x-0.5 hover:underline"
                        >
                          <span>Guide</span>
                          <ExternalLink class="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Set table */}
                  <div class="space-y-1 pt-1 border-t border-white/[0.04]">
                    <div class="grid grid-cols-12 gap-1 text-[10px] font-mono uppercase text-zinc-500 text-center px-1">
                      <span class="col-span-2 text-left">Set</span>
                      <span class="col-span-4">Weight (kg)</span>
                      <span class="col-span-4">Reps</span>
                      <span class="col-span-2">Done</span>
                    </div>

                    {sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        class={`grid grid-cols-12 gap-1 items-center p-1 rounded-lg text-xs font-mono transition ${
                          set.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-900 border border-white/[0.03]'
                        }`}
                      >
                        <span class="col-span-2 text-zinc-400 font-bold px-1">{set.set_num || setIdx + 1}</span>
                        <div class="col-span-4">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weight_kg !== undefined ? set.weight_kg : ''}
                            onChange={(e) => handleSetInputChange(exIdx, setIdx, 'weight_kg', e.target.value)}
                            placeholder="kg"
                            class="w-full bg-dark-850 border border-white/10 rounded px-1.5 py-1 text-xs text-center font-bold text-white focus:outline-none focus:border-volt"
                          />
                        </div>
                        <div class="col-span-4">
                          <input
                            type="number"
                            value={set.reps !== undefined ? set.reps : ''}
                            onChange={(e) => handleSetInputChange(exIdx, setIdx, 'reps', e.target.value)}
                            placeholder="reps"
                            class="w-full bg-dark-850 border border-white/10 rounded px-1.5 py-1 text-xs text-center font-bold text-white focus:outline-none focus:border-volt"
                          />
                        </div>
                        <div class="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleSetToggle(exIdx, setIdx)}
                            class={`w-6 h-6 rounded-md flex items-center justify-center transition active:scale-90 ${
                              set.completed
                                ? 'bg-emerald-400 text-dark-950 font-bold'
                                : 'bg-white/5 border border-zinc-700 text-zinc-500 hover:text-white'
                            }`}
                          >
                            <Check class="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. CONDITIONING & CARDIO */}
          {activeDay.bodyweight_conditioning && (
            <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
                  <span class="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Conditioning & Cardio</span>
                </div>
                <span class="text-[10px] text-amber-400 font-mono font-bold">~95 kcal</span>
              </div>

              <div
                onClick={() => {
                  const clone = stampActivityTimes(JSON.parse(JSON.stringify(activeDay)));
                  clone.conditioning_completed = !clone.conditioning_completed;
                  clone.completion_percentage = calculateProgress(clone);
                  sounds.playSetCheck();
                  triggerAutoSave(clone);
                }}
                class={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between ${
                  activeDay.conditioning_completed
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04] text-zinc-300'
                }`}
              >
                <div class="flex items-center space-x-2">
                  <div class={`w-5 h-5 rounded-md flex items-center justify-center ${
                    activeDay.conditioning_completed ? 'bg-emerald-400 text-dark-950' : 'border border-zinc-600'
                  }`}>
                    {activeDay.conditioning_completed && <Check class="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <p class="text-xs font-medium leading-relaxed">{activeDay.bodyweight_conditioning}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. COOL-DOWN STRETCHES (WITH PHOTOS) */}
          {activeDay.cooldown_stretches && activeDay.cooldown_stretches.length > 0 && (
            <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
                  <span class="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>Cool-Down Static Stretches</span>
                </div>
                <div class="flex items-center space-x-2 text-[10px] font-mono">
                  <span class="text-amber-400 font-bold">~20 kcal</span>
                  <span class="text-zinc-400">
                    {activeDay.cooldown_stretches.filter((c) => c.completed).length}/{activeDay.cooldown_stretches.length} Done
                  </span>
                </div>
              </div>

              <div class="space-y-2">
                {activeDay.cooldown_stretches.map((stretch, idx) => {
                  const thumb = stretch.media?.images?.[0] || '';
                  return (
                    <div
                      key={idx}
                      class={`p-2 rounded-xl transition flex items-center justify-between gap-3 ${
                        stretch.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04]'
                      }`}
                    >
                      <div class="flex items-center space-x-3 flex-1 min-w-0">
                        {thumb ? (
                          <div
                            onClick={() => stretch.media && onOpenExerciseGuide(stretch.media)}
                            class="w-11 h-11 rounded-lg overflow-hidden bg-dark-950 shrink-0 border border-white/10 cursor-pointer relative group"
                            title="Tap to see form guide"
                          >
                            <img src={thumb} alt={stretch.name} class="w-full h-full object-cover object-center group-hover:scale-105 transition" />
                          </div>
                        ) : (
                          <div class="w-11 h-11 rounded-lg bg-dark-950 flex items-center justify-center shrink-0 border border-white/5 text-zinc-600">
                            <Sparkles class="w-4 h-4 text-purple-400/60" />
                          </div>
                        )}

                        <div class="flex-1 min-w-0">
                          <h4 class={`text-xs truncate ${stretch.completed ? 'text-zinc-400 line-through' : 'text-zinc-200 font-semibold'}`}>
                            {stretch.name}
                          </h4>
                          <span class="text-[10px] text-zinc-500 font-mono block">{stretch.reps_or_time} • ~3.2 kcal</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleStretch('cooldown_stretches', idx)}
                        class={`w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-90 ${
                          stretch.completed ? 'bg-emerald-400 text-dark-950 font-bold' : 'border border-zinc-700 hover:border-zinc-500 text-transparent'
                        }`}
                      >
                        <Check class="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. SESSION METRICS & NOTES */}
          <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-3">
            <h4 class="text-xs font-bold text-white font-heading">Session Vitals & Logs</h4>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={activeDay.actual_weight_kg || ''}
                  onChange={(e) => {
                    const clone = { ...activeDay, actual_weight_kg: e.target.value };
                    triggerAutoSave(clone);
                  }}
                  placeholder="91.5"
                  class="w-full bg-dark-850 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Steps</label>
                <input
                  type="number"
                  value={activeDay.actual_steps || ''}
                  onChange={(e) => {
                    const clone = { ...activeDay, actual_steps: e.target.value };
                    triggerAutoSave(clone);
                  }}
                  placeholder="8000"
                  class="w-full bg-dark-850 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Duration (min)</label>
                <input
                  type="number"
                  value={activeDay.actual_duration_min || ''}
                  onChange={(e) => {
                    const clone = { ...activeDay, actual_duration_min: e.target.value };
                    triggerAutoSave(clone);
                  }}
                  placeholder="65"
                  class="w-full bg-dark-850 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label class="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Joint Comfort & Notes</label>
              <textarea
                rows="2"
                value={activeDay.user_notes || ''}
                onChange={(e) => {
                  const clone = { ...activeDay, user_notes: e.target.value };
                  triggerAutoSave(clone);
                }}
                placeholder="e.g. Joints felt great, increased load on incline press..."
                class="w-full bg-dark-850 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-volt"
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div class="p-3 sm:p-4 border-t border-white/[0.08] bg-dark-900 flex items-center justify-between gap-3 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <label class="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!activeDay.completed}
              onChange={(e) => handleToggleDayComplete(e.target.checked)}
              class="w-4 h-4 rounded bg-dark-800 border-zinc-600 text-volt focus:ring-0 cursor-pointer"
            />
            <span class="text-xs font-black text-white font-heading">Mark Completed</span>
          </label>

          <div class="flex items-center space-x-2">
            <span class="text-[11px] text-zinc-400 font-mono">
              {saveStatus === 'saving' ? 'Saving...' : 'Auto-saved ✓'}
            </span>
            <button
              onClick={onClose}
              class="px-4 py-2 rounded-xl text-xs font-bold bg-volt text-dark-950 hover:bg-[#b8e600] active:scale-95 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* 100% Completion Appreciation Celebration Modal */}
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
