import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, ChevronRight, Sparkles, Clock, Sun, Moon, Calendar } from 'lucide-react';
import { TbBarbell } from 'react-icons/tb';
import { FaFireFlameCurved, FaWeightScale } from 'react-icons/fa6';
import { calculateDayCalories } from '../utils/calories';
import { formatTimeOfDay, getAutoTimeOfDay } from '../utils/timeFormat';
import InteractiveWorkoutSection from './InteractiveWorkoutSection';

export default function TodayTab({
  todayDay,
  allDays = [],
  stats,
  weightHistory = [],
  onOpenWorkoutModal,
  onOpenWeightModal,
  onQuickLogWeight,
  onSelectDay,
  onDayUpdated,
  onLaunchRestTimer,
  onOpenExerciseGuide,
}) {
  // Extract weight specifically recorded for this active day (or empty if future/unlogged)
  const getSelectedDayWeight = () => {
    if (!todayDay) return '';
    const log = (weightHistory || []).find(
      (w) => w.day_number === todayDay.day_number || (w.date_display && todayDay.date_display && w.date_display.trim() === todayDay.date_display.trim())
    );
    if (log && log.weight_kg !== undefined && log.weight_kg !== null) return String(log.weight_kg);
    if (todayDay.actual_weight_kg !== undefined && todayDay.actual_weight_kg !== null) return String(todayDay.actual_weight_kg);
    return '';
  };

  const [quickWeight, setQuickWeight] = useState(() => getSelectedDayWeight());
  const [weightSaveStatus, setWeightSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const weightDebounceRef = useRef(null);

  // Sync weigh-in value whenever selected day switches or weight logs update
  useEffect(() => {
    setQuickWeight(getSelectedDayWeight());
  }, [todayDay?.day_number, todayDay?.actual_weight_kg, weightHistory]);

  const dayLog = (weightHistory || []).find(
    (w) => w.day_number === todayDay?.day_number || (w.date_display && todayDay?.date_display && w.date_display.trim() === todayDay.date_display.trim())
  );
  const activeTimeOfDay = dayLog?.time_of_day || getAutoTimeOfDay();

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
  const pct = todayDay.completion_percentage !== undefined ? todayDay.completion_percentage : (todayDay.completed ? 100 : 0);
  const isCompleted = !!todayDay.completed && pct >= 100;
  const isDeload = !!todayDay.is_deload;
  const isStarted = !!todayDay.started_at;

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
  const handleWeightChange = (newVal) => {
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
          await onQuickLogWeight(num, activeTimeOfDay, todayDay.day_number);
        }
        setWeightSaveStatus('saved');
        setTimeout(() => setWeightSaveStatus('idle'), 2500);
      } catch (e) {
        setWeightSaveStatus('error');
      }
    }, 700);
  };

  // Gym closure window: 8 Nov 2026 to 14 Nov 2026
  const isGymClosureWindow = (() => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      });
      const parts = formatter.formatToParts(now);
      const dayNum = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
      const monthStr = parts.find((p) => p.type === 'month')?.value?.toLowerCase() || '';
      return monthStr === 'nov' && dayNum >= 8 && dayNum <= 14;
    } catch {
      return false;
    }
  })();

  return (
    <div className="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Gym Closure & Active Recovery Notice for Nov 8-14 */}
      {isGymClosureWindow && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30 text-lg">
              🏢
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-dark-950 uppercase tracking-wider">
                  Gym Closed (Nov 8 – 14)
                </span>
                <span className="text-xs text-amber-300 font-bold font-mono">
                  Active Recovery Week
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading mt-1">
                Calendar Paused • Day 9 Resumes Sunday, Nov 15!
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Your 90-day plan is safely shifted by +7 days so you don't miss any gym lifts. During this week, focus on:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-xs text-zinc-200">
                <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center space-x-1.5">
                  <span className="text-volt font-bold">👟 10k+</span>
                  <span>Daily Outdoor Steps</span>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center space-x-1.5">
                  <span className="text-cyan-400 font-bold">🥩 Protein</span>
                  <span>Maintain 1.6–2.0 g/kg</span>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center space-x-1.5">
                  <span className="text-purple-400 font-bold">🧘 Mobility</span>
                  <span>Core & gentle stretching</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. TODAY HERO CARD */}
      <div className="p-4 sm:p-6 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-2xl relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-volt/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Strip */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black font-heading ${
                isCompleted ? 'bg-volt text-dark-950' : 'bg-volt/15 text-volt border border-volt/30'
              }`}
            >
              DAY {todayDay.day_number} OF 90
            </span>
            <span className="text-xs text-zinc-400 font-bold">
              {todayDay.date_display} • Week {todayDay.week_number}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {isDeload && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⚡ DELOAD
              </span>
            )}
            {isCompleted && (
              <span className="flex items-center space-x-1 text-volt text-xs font-black">
                <CheckCircle2 className="w-4 h-4 fill-volt/20 text-volt" />
                <span>COMPLETED</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Workout Title */}
        <div className="mb-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight mb-1">
            {todayDay.day_type}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-2 leading-relaxed">
            {todayDay.strength_workout || todayDay.cardio || 'Active Recovery Routine'}
          </p>
        </div>

        {/* Muscle Focus Chips */}
        {primaryMuscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {primaryMuscles.map((muscle, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/5 text-zinc-300 border border-white/5 capitalize"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}

        {/* Workout Vitals Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-dark-900/90 border border-white/[0.06] mb-3 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Est. Energy</span>
            <span className="text-sm sm:text-base font-black text-volt font-heading">
              ~{cal.total_estimated_kcal.toLocaleString()} kcal
            </span>
            {cal.total_completed_kcal > 0 && (
              <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                🔥 {cal.total_completed_kcal} kcal burned
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Movements</span>
            <span className="text-sm sm:text-base font-black text-white font-heading">
              {(todayDay.parsed_exercises || []).length} Lifts
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              + Warmup & Stretch
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Completion</span>
            <span
              className={`text-sm sm:text-base font-black font-heading ${
                isCompleted || pct === 100 ? 'text-volt' : pct > 0 ? 'text-cyan-400' : 'text-zinc-400'
              }`}
            >
              {pct}% Done
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              {isCompleted ? 'Target Reached ✓' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Today's Workout Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-2 rounded-full bg-dark-950 border border-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-volt to-emerald-400 transition-all duration-500"
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
          <div className="w-full py-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-heading font-black text-sm flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
      <div className="p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white font-heading">Week {currentWeekNum} Consistency</span>
            <span className="text-[10px] text-zinc-400">({weekDays.filter((d) => d.completed).length}/7 Done)</span>
          </div>
          <span className="text-[11px] font-mono text-volt font-bold flex items-center space-x-1">
            {stats?.current_streak ? (
              <>
                <FaFireFlameCurved className="w-3.5 h-3.5 text-amber-400" />
                <span>{stats.current_streak} Day Streak</span>
              </>
            ) : (
              'Keep Pushing'
            )}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
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
                className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center relative ${
                  isToday
                    ? 'bg-volt/15 border-2 border-volt text-volt font-black shadow-lg shadow-volt/10'
                    : isDone
                    ? 'bg-white/5 border border-emerald-500/40 text-emerald-400 font-bold'
                    : 'bg-dark-900 border border-white/[0.04] text-zinc-400 hover:border-white/20'
                }`}
              >
                {/* Month with Date */}
                <div className="flex items-center space-x-0.5 text-[10px] font-bold uppercase mb-1">
                  <span>{dayDate}</span>
                  {dayMonth && <span className="text-zinc-500 text-[9px] font-semibold">{dayMonth}</span>}
                </div>

                {/* Status Circle */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center my-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <span className={`text-[11px] font-mono font-bold ${isToday ? 'text-volt font-black' : 'text-zinc-500'}`}>
                      D{d.day_number}
                    </span>
                  )}
                </div>

                {/* Day focus chip */}
                <span className="text-[8px] font-mono font-bold truncate max-w-full px-1 text-zinc-400 mt-0.5">
                  {d.day_type ? d.day_type.split(' ')[0] : 'Rest'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. AUTO-SAVING WEIGH-IN ROW (Timing automatically decided by entry time) */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-white/[0.06] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt shrink-0">
              <FaWeightScale className="w-5 h-5 text-volt" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white font-heading">Body Weight Tracker</span>
                {stats?.weight_stats?.total_loss_kg > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    -{stats.weight_stats.total_loss_kg} kg overall
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                {quickWeight
                  ? `Day ${todayDay.day_number} (${todayDay.date_display}) reading`
                  : `No weigh-in logged for Day ${todayDay.day_number}`}
              </p>
            </div>
          </div>

          {/* Morning / Evening Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-white/10 self-start sm:self-center">
            {activeTimeOfDay === 'morning' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-300">Morning Weigh-In</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold text-indigo-300">Evening Weigh-In</span>
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/[0.04]">
          <div className="relative w-36">
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
              placeholder="--.-"
              className="w-full bg-dark-900 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
            />
            <span className="absolute right-2.5 top-2 text-[10px] text-zinc-500 font-bold">kg</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenWeightModal}
              title="Open weight log history"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. EMBEDDED INTERACTIVE WORKOUT LOGGER */}
      <div id="interactive-logger" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TbBarbell className="w-4 h-4 text-volt" />
            <h3 className="text-xs font-bold text-white font-heading">
              Interactive Training Logger • Day {todayDay.day_number}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
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
