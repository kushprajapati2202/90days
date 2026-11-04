import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, ChevronRight, Sparkles, Clock, Sun, Moon, Calendar } from 'lucide-react';
import { TbBarbell } from 'react-icons/tb';
import { FaFireFlameCurved, FaWeightScale } from 'react-icons/fa6';
import { calculateDayCalories } from '../utils/calories';
import { formatTimeOfDay } from '../utils/timeFormat';
import InteractiveWorkoutSection from './InteractiveWorkoutSection';

export default function TodayTab({
  todayDay,
  allDays = [],
  stats,
  onOpenWorkoutModal,
  onOpenWeightModal,
  onQuickLogWeight,
  onSelectDay,
  onDayUpdated,
  onLaunchRestTimer,
  onOpenExerciseGuide,
}) {
  const [quickWeight, setQuickWeight] = useState(stats?.weight_stats?.current_weight_kg || '');
  const [weightTimeOfDay, setWeightTimeOfDay] = useState('morning');
  const [weightSaveStatus, setWeightSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const weightDebounceRef = useRef(null);

  useEffect(() => {
    if (stats?.weight_stats?.current_weight_kg) {
      setQuickWeight(stats.weight_stats.current_weight_kg);
    }
  }, [stats?.weight_stats?.current_weight_kg]);

  if (!todayDay) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-volt border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Loading today's workout program...</p>
      </div>
    );
  }

  const userWeight = stats?.weight_stats?.current_weight_kg || 91.5;
  const cal = calculateDayCalories(todayDay, userWeight);
  const isCompleted = !!todayDay.completed;
  const isDeload = !!todayDay.is_deload;
  const isStarted = !!todayDay.started_at;
  const pct = isCompleted ? 100 : (todayDay.completion_percentage !== undefined ? todayDay.completion_percentage : 0);

  // Primary muscle extraction
  let primaryMuscles = [];
  if (todayDay.parsed_exercises) {
    todayDay.parsed_exercises.forEach((ex) => {
      if (ex.media?.primary_muscles) primaryMuscles.push(...ex.media.primary_muscles);
    });
  }
  primaryMuscles = [...new Set(primaryMuscles)].slice(0, 4);

  // Week days for Consistency Capsule (Monday to Sunday around today)
  const currentWeekNum = todayDay.week_number || 1;
  const weekDays = allDays.filter((d) => d.week_number === currentWeekNum).slice(0, 7);

  // Auto-Save Weight Handler
  const handleWeightChange = (newVal, timing = weightTimeOfDay) => {
    setQuickWeight(newVal);
    if (weightDebounceRef.current) clearTimeout(weightDebounceRef.current);

    const num = parseFloat(newVal);
    if (!num || isNaN(num) || num < 30 || num > 300) {
      setWeightSaveStatus('idle');
      return;
    }

    setWeightSaveStatus('saving');
    weightDebounceRef.current = setTimeout(async () => {
      try {
        if (onQuickLogWeight) {
          await onQuickLogWeight(num, timing, todayDay.day_number);
        }
        setWeightSaveStatus('saved');
        setTimeout(() => setWeightSaveStatus('idle'), 2500);
      } catch (e) {
        setWeightSaveStatus('error');
      }
    }, 700);
  };

  const handleTimingToggle = (timing) => {
    setWeightTimeOfDay(timing);
    const num = parseFloat(quickWeight);
    if (num && !isNaN(num) && num >= 30) {
      handleWeightChange(num, timing);
    }
  };

  return (
    <div class="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* 1. TODAY HERO CARD */}
      <div class="p-4 sm:p-6 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-2xl relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div class="absolute -right-16 -top-16 w-48 h-48 bg-volt/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Strip */}
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center space-x-2">
            <span
              class={`px-2.5 py-1 rounded-lg text-xs font-black font-heading ${
                isCompleted ? 'bg-volt text-dark-950' : 'bg-volt/15 text-volt border border-volt/30'
              }`}
            >
              DAY {todayDay.day_number} OF 90
            </span>
            <span class="text-xs text-zinc-400 font-bold">
              {todayDay.date_display} • Week {todayDay.week_number}
            </span>
          </div>

          <div class="flex items-center space-x-1.5">
            {isDeload && (
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⚡ DELOAD
              </span>
            )}
            {isCompleted && (
              <span class="flex items-center space-x-1 text-volt text-xs font-black">
                <CheckCircle2 class="w-4 h-4 fill-volt/20 text-volt" />
                <span>COMPLETED</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Workout Title */}
        <div class="mb-3">
          <h1 class="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight mb-1">
            {todayDay.day_type}
          </h1>
          <p class="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-2 leading-relaxed">
            {todayDay.strength_workout || todayDay.cardio || 'Active Recovery Routine'}
          </p>
        </div>

        {/* Muscle Focus Chips */}
        {primaryMuscles.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mb-4">
            {primaryMuscles.map((muscle, idx) => (
              <span
                key={idx}
                class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/5 text-zinc-300 border border-white/5 capitalize"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}

        {/* Workout Vitals Strip */}
        <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-dark-900/90 border border-white/[0.06] mb-3 text-center">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Est. Energy</span>
            <span class="text-sm sm:text-base font-black text-volt font-heading">
              ~{cal.total_estimated_kcal.toLocaleString()} kcal
            </span>
            {cal.total_completed_kcal > 0 && (
              <span class="text-[10px] text-emerald-400 font-mono block mt-0.5">
                🔥 {cal.total_completed_kcal} kcal burned
              </span>
            )}
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Movements</span>
            <span class="text-sm sm:text-base font-black text-white font-heading">
              {(todayDay.parsed_exercises || []).length} Lifts
            </span>
            <span class="text-[10px] text-zinc-500 font-mono block mt-0.5">
              + Warmup & Stretch
            </span>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Completion</span>
            <span
              class={`text-sm sm:text-base font-black font-heading ${
                isCompleted || pct === 100 ? 'text-volt' : pct > 0 ? 'text-cyan-400' : 'text-zinc-400'
              }`}
            >
              {pct}% Done
            </span>
            <span class="text-[10px] text-zinc-500 font-mono block mt-0.5">
              {isCompleted ? 'Target Reached ✓' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Today's Workout Progress Bar */}
        <div class="mb-4">
          <div class="w-full h-2 rounded-full bg-dark-950 border border-white/[0.06] overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-volt to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(pct > 0 ? 5 : 0, pct))}%` }}
            />
          </div>
        </div>

        {/* Session Status Banner */}
        {isStarted && (
          <div className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-dark-900 border border-volt/25 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {!isCompleted && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-volt opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCompleted ? 'bg-emerald-400' : 'bg-volt'}`} />
              </span>
              <div>
                <span className="font-bold text-white text-xs block">
                  {isCompleted ? 'Workout Session Completed' : 'Live Workout In Progress'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Started {formatTimeOfDay(todayDay.started_at)}
                  {todayDay.ended_at && ` • Last activity ${formatTimeOfDay(todayDay.ended_at)}`}
                  {todayDay.actual_duration_min && ` • ${todayDay.actual_duration_min} min`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Action Button - Appropriate for completed state (does NOT jump forward) */}
        {isCompleted ? (
          <div class="w-full py-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-heading font-black text-sm flex items-center justify-center space-x-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>Today's Workout Complete ✓</span>
          </div>
        ) : (
          <button
            onClick={() => {
              const el = document.getElementById('interactive-logger');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-3.5 px-4 rounded-2xl font-heading font-black text-sm transition flex items-center justify-center space-x-2 shadow-xl bg-volt text-dark-950 hover:bg-volt-light shadow-volt/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isStarted ? "Continue Today's Workout" : "Start Today's Workout"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. WEEKLY CONSISTENCY CAPSULES (Shows Month + Dates) */}
      <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-white font-heading">Week {currentWeekNum} Consistency</span>
            <span class="text-[10px] text-zinc-400">({weekDays.filter((d) => d.completed).length}/7 Done)</span>
          </div>
          <span class="text-[11px] font-mono text-volt font-bold flex items-center space-x-1">
            {stats?.current_streak ? (
              <>
                <FaFireFlameCurved class="w-3.5 h-3.5 text-amber-400" />
                <span>{stats.current_streak} Day Streak</span>
              </>
            ) : (
              'Keep Pushing'
            )}
          </span>
        </div>

        <div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {weekDays.map((d) => {
            const isToday = d.day_number === todayDay.day_number;
            const isDone = !!d.completed;
            const dayParts = (d.date_display || '').split(' ');
            const dayDate = dayParts[0] || `D${d.day_number}`;
            const dayMonth = dayParts[1] || '';

            return (
              <button
                key={d.day_number}
                type="button"
                onClick={() => onSelectDay && onSelectDay(d)}
                class={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center relative ${
                  isToday
                    ? 'bg-volt/15 border-2 border-volt text-volt font-black shadow-lg shadow-volt/10'
                    : isDone
                    ? 'bg-white/5 border border-emerald-500/40 text-emerald-400 font-bold'
                    : 'bg-dark-900 border border-white/[0.04] text-zinc-400 hover:border-white/20'
                }`}
              >
                {/* Month with Date */}
                <div class="flex items-center space-x-0.5 text-[10px] font-bold uppercase mb-1">
                  <span>{dayDate}</span>
                  {dayMonth && <span class="text-zinc-500 text-[9px] font-semibold">{dayMonth}</span>}
                </div>

                {/* Status Circle */}
                <div class="w-6 h-6 rounded-full flex items-center justify-center my-0.5">
                  {isDone ? (
                    <CheckCircle2 class="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <span class={`text-[11px] font-mono font-bold ${isToday ? 'text-volt font-black' : 'text-zinc-500'}`}>
                      D{d.day_number}
                    </span>
                  )}
                </div>

                {/* Day focus chip */}
                <span class="text-[8px] font-mono font-bold truncate max-w-full px-1 text-zinc-400 mt-0.5">
                  {d.day_type ? d.day_type.split(' ')[0] : 'Rest'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. AUTO-SAVING WEIGH-IN ROW WITH MORNING / EVENING OPTIONS */}
      <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06] space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt shrink-0">
              <FaWeightScale class="w-5 h-5 text-volt" />
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-white font-heading">Body Weight Tracker</span>
                {stats?.weight_stats?.total_loss_kg > 0 && (
                  <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    -{stats.weight_stats.total_loss_kg} kg overall
                  </span>
                )}
              </div>
              <p class="text-[11px] text-zinc-400">
                {weightTimeOfDay === 'morning'
                  ? 'Fasting morning weigh-in'
                  : 'Evening / post-workout weigh-in'}
              </p>
            </div>
          </div>

          {/* Morning / Evening Toggle Options */}
          <div class="flex items-center p-1 rounded-xl bg-dark-900 border border-white/10 self-start sm:self-center">
            <button
              type="button"
              onClick={() => handleTimingToggle('morning')}
              class={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition ${
                weightTimeOfDay === 'morning'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sun class="w-3 h-3 text-amber-400" />
              <span>Morning</span>
            </button>
            <button
              type="button"
              onClick={() => handleTimingToggle('evening')}
              class={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition ${
                weightTimeOfDay === 'evening'
                  ? 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Moon class="w-3 h-3 text-indigo-400" />
              <span>Evening</span>
            </button>
          </div>
        </div>

        {/* Input & Auto-Save Status */}
        <div class="flex items-center justify-between gap-3 pt-1 border-t border-white/[0.04]">
          <div class="relative w-36">
            <input
              type="number"
              step="0.05"
              value={quickWeight === 0 || quickWeight === '0' ? '' : quickWeight}
              onChange={(e) => handleWeightChange(e.target.value)}
              onFocus={(e) => {
                if (e.target.value === '0' || e.target.value === '0.0') {
                  setQuickWeight('');
                } else {
                  e.target.select();
                }
              }}
              placeholder="91.5"
              class="w-full bg-dark-900 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
            />
            <span class="absolute right-2.5 top-2 text-[10px] text-zinc-500 font-bold">kg</span>
          </div>

          <div class="flex items-center space-x-2">
            <span
              class={`text-[11px] font-mono font-bold transition ${
                weightSaveStatus === 'saving'
                  ? 'text-amber-400'
                  : weightSaveStatus === 'saved'
                  ? 'text-emerald-400'
                  : 'text-zinc-500'
              }`}
            >
              {weightSaveStatus === 'saving'
                ? 'Auto-saving...'
                : weightSaveStatus === 'saved'
                ? 'Auto-saved ✓'
                : 'Auto-saves on typing'}
            </span>
            <button
              type="button"
              onClick={onOpenWeightModal}
              title="Open weight log history"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition"
            >
              <Calendar class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div class="text-[10px] text-zinc-500 font-mono">
          Note: Past readings are recorded as evening readings by default.
        </div>
      </div>

      {/* 4. EMBEDDED INTERACTIVE WORKOUT LOGGER */}
      <div id="interactive-logger" class="space-y-3 pt-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <TbBarbell class="w-4 h-4 text-volt" />
            <h3 class="text-xs font-bold text-white font-heading">
              Interactive Training Logger • Day {todayDay.day_number}
            </h3>
          </div>
          <span class="text-[10px] font-mono text-zinc-400">
            {(todayDay.parsed_exercises || []).length} Movements • Live Tracker
          </span>
        </div>

        <InteractiveWorkoutSection
          day={todayDay}
          onDayUpdated={onDayUpdated}
          onLaunchRestTimer={onLaunchRestTimer}
          onOpenExerciseGuide={onOpenExerciseGuide}
          stats={stats}
          allDays={allDays}
          embedded={true}
        />
      </div>
    </div>
  );
}
