import React, { useState } from 'react';
import { Play, CheckCircle2, Flame, Scale, ChevronRight, Dumbbell, Sparkles } from 'lucide-react';
import { calculateDayCalories } from '../utils/calories';

export default function TodayTab({
  todayDay,
  allDays,
  stats,
  onOpenWorkoutModal,
  onOpenWeightModal,
  onQuickLogWeight,
  onSelectDay,
}) {
  const [quickWeight, setQuickWeight] = useState(stats?.weight_stats?.current_weight_kg || '');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightSavedToast, setWeightSavedToast] = useState(false);

  if (!todayDay) {
    return (
      <div class="py-12 text-center">
        <div class="w-8 h-8 border-2 border-volt border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p class="text-xs text-zinc-400">Loading today's workout program...</p>
      </div>
    );
  }

  const cal = calculateDayCalories(todayDay, stats?.weight_stats?.current_weight_kg || 91.5);
  const isCompleted = !!todayDay.completed;
  const isDeload = !!todayDay.is_deload;

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

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!quickWeight) return;
    setIsSavingWeight(true);
    try {
      await onQuickLogWeight(quickWeight);
      setWeightSavedToast(true);
      setTimeout(() => setWeightSavedToast(false), 2500);
    } finally {
      setIsSavingWeight(false);
    }
  };

  return (
    <div class="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* 1. TODAY HERO CARD (Whoop / Hevy Dark Athletic Style) */}
      <div class="p-4 sm:p-6 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-2xl relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div class="absolute -right-16 -top-16 w-48 h-48 bg-volt/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Strip */}
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center space-x-2">
            <span class={`px-2.5 py-1 rounded-lg text-xs font-black font-heading ${
              isCompleted ? 'bg-volt text-dark-950' : 'bg-volt/15 text-volt border border-volt/30'
            }`}>
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
        <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-dark-900/90 border border-white/[0.06] mb-4 text-center">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Est. Energy</span>
            <span class="text-sm sm:text-base font-black text-volt font-heading">
              ~{cal.total_estimated_kcal.toLocaleString()} kcal
            </span>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Movements</span>
            <span class="text-sm sm:text-base font-black text-white font-heading">
              {(todayDay.parsed_exercises || []).length} Lifts
            </span>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Session Status</span>
            <span class={`text-sm sm:text-base font-black font-heading ${
              isCompleted ? 'text-volt' : (todayDay.completion_percentage > 0 ? 'text-cyan-400' : 'text-zinc-400')
            }`}>
              {isCompleted ? '100% Done' : `${todayDay.completion_percentage || 0}% Done`}
            </span>
          </div>
        </div>

        {/* Main Action Launch Button */}
        <button
          onClick={() => onOpenWorkoutModal(todayDay)}
          class="w-full py-3.5 px-4 rounded-2xl font-heading font-black text-sm text-dark-950 bg-volt hover:bg-[#b8e600] active:scale-[0.98] transition flex items-center justify-center space-x-2 shadow-xl shadow-volt/20"
        >
          <Play class="w-4 h-4 fill-dark-950" />
          <span>{isCompleted ? 'Review / Edit Workout Session' : 'Start Today\'s Workout'}</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      {/* 2. WEEKLY CONSISTENCY CAPSULES (Mon - Sun) */}
      <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-white font-heading">Week {currentWeekNum} Consistency</span>
            <span class="text-[10px] text-zinc-400">({weekDays.filter((d) => d.completed).length}/7 Done)</span>
          </div>
          <span class="text-[11px] font-mono text-volt font-bold">
            {stats?.current_streak ? `🔥 ${stats.current_streak} Day Streak` : 'Keep Pushing'}
          </span>
        </div>

        <div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {weekDays.map((d) => {
            const isToday = d.day_number === todayDay.day_number;
            const isDone = !!d.completed;
            const dayName = d.date_display ? d.date_display.split(' ')[0] : `D${d.day_number}`;

            return (
              <button
                key={d.day_number}
                onClick={() => onSelectDay(d)}
                class={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center ${
                  isToday
                    ? 'bg-volt/15 border-2 border-volt text-volt font-black'
                    : isDone
                    ? 'bg-white/5 border border-emerald-500/40 text-emerald-400 font-bold'
                    : 'bg-dark-900 border border-white/[0.04] text-zinc-400 hover:border-white/20'
                }`}
              >
                <span class="text-[10px] font-bold uppercase mb-1">{dayName}</span>
                <div class="w-6 h-6 rounded-full flex items-center justify-center">
                  {isDone ? (
                    <CheckCircle2 class="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <span class={`text-xs font-mono font-bold ${isToday ? 'text-volt' : 'text-zinc-500'}`}>
                      {d.day_number}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. QUICK MORNING WEIGH-IN ROW */}
      <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt">
            <Scale class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-white font-heading">Morning Weigh-In</span>
              {stats?.weight_stats?.total_loss_kg > 0 && (
                <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  -{stats.weight_stats.total_loss_kg} kg overall
                </span>
              )}
            </div>
            <p class="text-[11px] text-zinc-400">Step on the scale fasting after morning wake-up</p>
          </div>
        </div>

        <form onSubmit={handleWeightSubmit} class="flex items-center space-x-2">
          <div class="relative w-28">
            <input
              type="number"
              step="0.05"
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
              placeholder="91.5"
              class="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-volt"
            />
            <span class="absolute right-2.5 top-2.5 text-[10px] text-zinc-500 font-bold">kg</span>
          </div>

          <button
            type="submit"
            disabled={isSavingWeight}
            class="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-volt hover:text-dark-950 text-white transition active:scale-95 disabled:opacity-50"
          >
            {isSavingWeight ? 'Saving...' : weightSavedToast ? 'Logged ✓' : 'Save'}
          </button>
        </form>
      </div>

      {/* 4. TODAY'S MOVEMENTS PREVIEW LIST */}
      <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-white font-heading">Movements Breakdown</span>
          <button
            onClick={() => onOpenWorkoutModal(todayDay)}
            class="text-[11px] font-bold text-volt hover:underline flex items-center space-x-1"
          >
            <span>Open Interactive Logger</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="space-y-2">
          {(todayDay.parsed_exercises || []).map((ex, idx) => {
            const sets = ex.logged_sets || [];
            const doneSets = sets.filter((s) => s.completed).length;
            const totalSets = sets.length || 3;
            const isAllDone = sets.length > 0 && doneSets === totalSets;

            return (
              <div
                key={idx}
                onClick={() => onOpenWorkoutModal(todayDay)}
                class="flex items-center justify-between p-2.5 rounded-xl bg-dark-900/80 border border-white/[0.04] hover:border-white/15 transition cursor-pointer"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-7 h-7 rounded-lg bg-dark-800 flex items-center justify-center text-xs font-mono font-bold text-zinc-400">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white">{ex.name}</h4>
                    <span class="text-[10px] text-zinc-400 font-mono">Target: {ex.target || '3 sets'}</span>
                  </div>
                </div>

                <div class="flex items-center space-x-2">
                  <span class={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    isAllDone ? 'bg-volt/15 text-volt border border-volt/30' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {doneSets}/{totalSets} Sets
                  </span>
                  <ChevronRight class="w-4 h-4 text-zinc-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

