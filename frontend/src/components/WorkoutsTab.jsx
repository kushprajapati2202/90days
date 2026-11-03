import React, { useState, useMemo } from 'react';
import { Search, Flame, CheckCircle2, ChevronRight, RotateCcw, Dumbbell } from 'lucide-react';
import { calculateDayCalories } from '../utils/calories';

export default function WorkoutsTab({ allDays, stats, onOpenWorkoutModal }) {
  const [selectedWeek, setSelectedWeek] = useState(null); // null means All
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, push, pull, legs, recovery, completed, pending
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDays = useMemo(() => {
    return allDays.filter((day) => {
      // Week filter
      if (selectedWeek !== null && day.week_number !== selectedWeek) {
        return false;
      }

      // Category filter
      const type = (day.day_type || '').toLowerCase();
      if (selectedFilter === 'push' && !type.includes('push')) return false;
      if (selectedFilter === 'pull' && !type.includes('pull')) return false;
      if (selectedFilter === 'legs' && !type.includes('leg')) return false;
      if (selectedFilter === 'recovery' && !type.includes('recovery')) return false;
      if (selectedFilter === 'completed' && !day.completed) return false;
      if (selectedFilter === 'pending' && day.completed) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inType = type.includes(q);
        const inWorkout = (day.strength_workout || '').toLowerCase().includes(q);
        const inCardio = (day.cardio || '').toLowerCase().includes(q);
        const inExercises = (day.parsed_exercises || []).some((e) => e.name.toLowerCase().includes(q));
        if (!inType && !inWorkout && !inCardio && !inExercises) return false;
      }

      return true;
    });
  }, [allDays, selectedWeek, selectedFilter, searchQuery]);

  const resetFilters = () => {
    setSelectedWeek(null);
    setSelectedFilter('all');
    setSearchQuery('');
  };

  return (
    <div class="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* 1. HORIZONTAL WEEK SELECTOR SLIDER (W1 - W13) */}
      <div class="p-3 sm:p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-white font-heading">Program Schedule (13 Weeks)</span>
          {(selectedWeek !== null || selectedFilter !== 'all' || searchQuery) && (
            <button
              onClick={resetFilters}
              class="text-[11px] font-bold text-volt hover:underline flex items-center space-x-1"
            >
              <RotateCcw class="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedWeek(null)}
            class={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedWeek === null
                ? 'bg-volt text-dark-950 shadow-md shadow-volt/20'
                : 'bg-dark-900 text-zinc-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            All (90 Days)
          </button>

          {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => {
            const isDeload = w === 4 || w === 8 || w === 12;
            const isPeak = w === 13;
            const isSelected = selectedWeek === w;
            const weekStats = stats?.weeks?.[String(w)];
            const pct = weekStats?.pct || 0;

            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                class={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1 ${
                  isSelected
                    ? 'bg-volt text-dark-950 shadow-md shadow-volt/20'
                    : isDeload
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : isPeak
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : 'bg-dark-900 text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>W{w}</span>
                {isDeload && <span class="text-[9px]">⚡</span>}
                {pct > 0 && <span class="text-[10px] opacity-80">• {pct}%</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SEARCH & QUICK FILTER PILLS */}
      <div class="space-y-2">
        <div class="relative">
          <Search class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises, lifts (e.g. bench, squat, lats, rows)..."
            class="w-full bg-dark-850 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-volt"
          />
        </div>

        <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: `All (${allDays.length})` },
            { id: 'push', label: 'Push Lifts' },
            { id: 'pull', label: 'Pull Lifts' },
            { id: 'legs', label: 'Legs & Core' },
            { id: 'recovery', label: 'Recovery' },
            { id: 'completed', label: `Completed (${stats?.completed_days || 0})` },
            { id: 'pending', label: `Pending (${stats?.remaining_days || 0})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              class={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                selectedFilter === f.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-dark-850 text-zinc-400 hover:text-white border border-white/[0.04]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. WORKOUT DAYS GRID */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredDays.map((day) => {
          const isDone = !!day.completed;
          const isDeload = !!day.is_deload;
          const pct = day.completion_percentage !== undefined ? day.completion_percentage : (isDone ? 100 : 0);
          const cal = calculateDayCalories(day, stats?.weight_stats?.current_weight_kg || 91.5);
          const exercises = day.parsed_exercises || [];

          return (
            <div
              key={day.day_number}
              onClick={() => onOpenWorkoutModal(day)}
              class={`p-4 rounded-2xl transition cursor-pointer flex flex-col justify-between ${
                isDone
                  ? 'bg-dark-850 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm'
                  : pct > 0
                  ? 'bg-dark-850 border border-volt/40 hover:border-volt'
                  : 'bg-dark-850 border border-white/[0.06] hover:border-white/20'
              }`}
            >
              <div>
                {/* Header Strip */}
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="flex items-center space-x-2">
                    <span class={`text-[10px] font-black font-heading px-2 py-0.5 rounded ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : pct > 0
                        ? 'bg-volt/15 text-volt border border-volt/30'
                        : 'bg-white/10 text-zinc-300'
                    }`}>
                      DAY {day.day_number}
                    </span>
                    <span class="text-xs text-zinc-400 font-bold">{day.date_display} • W{day.week_number}</span>
                  </div>

                  <div class="flex items-center space-x-1.5">
                    {isDeload && (
                      <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        ⚡ DELOAD
                      </span>
                    )}
                    {isDone ? (
                      <CheckCircle2 class="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    ) : pct > 0 ? (
                      <span class="text-[10px] font-mono font-bold text-volt">{pct}%</span>
                    ) : null}
                  </div>
                </div>

                {/* Title */}
                <h3 class="text-base font-bold text-white font-heading mb-1">{day.day_type}</h3>
                <p class="text-xs text-zinc-400 line-clamp-2 mb-3">
                  {day.strength_workout || day.cardio || 'Active Recovery Routine'}
                </p>

                {/* Exercises Photo Thumbnails Strip */}
                {exercises.length > 0 && (
                  <div class="flex items-center space-x-1.5 mb-3 overflow-x-auto no-scrollbar">
                    {exercises.slice(0, 4).map((ex, i) => {
                      const thumb = ex.media?.images?.[0];
                      return thumb ? (
                        <div
                          key={i}
                          class="w-9 h-9 rounded-lg overflow-hidden bg-dark-950 border border-white/10 shrink-0"
                          title={ex.name}
                        >
                          <img src={thumb} alt={ex.name} class="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          key={i}
                          class="w-9 h-9 rounded-lg bg-dark-950 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-white/5 shrink-0"
                          title={ex.name}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                    {exercises.length > 4 && (
                      <div class="w-9 h-9 rounded-lg bg-dark-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                        +{exercises.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar & Footer Vitals */}
              <div>
                {/* Visual mini progress bar */}
                <div class="w-full h-1.5 rounded-full bg-dark-950 overflow-hidden mb-2">
                  <div
                    class={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-400' : 'bg-volt'}`}
                    style={{ width: `${Math.min(100, Math.max(pct > 0 ? 5 : 0, pct))}%` }}
                  />
                </div>

                <div class="pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                  <div class="flex items-center space-x-1 text-zinc-400">
                    <Flame class="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    <span class="font-mono">
                      {isDone ? `${cal.total_completed_kcal} kcal` : `~${cal.total_estimated_kcal} kcal`}
                    </span>
                    <span>•</span>
                    <span class={`font-bold ${isDone ? 'text-emerald-400' : pct > 0 ? 'text-volt' : 'text-zinc-500'}`}>
                      {pct}% Done
                    </span>
                  </div>

                  <div class="text-volt font-bold flex items-center space-x-0.5 hover:underline">
                    <span>Log Sets</span>
                    <ChevronRight class="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDays.length === 0 && (
        <div class="py-12 text-center text-zinc-400">
          <p class="text-sm font-semibold mb-2">No workouts match the current filter.</p>
          <button onClick={resetFilters} class="text-xs text-volt font-bold hover:underline">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
