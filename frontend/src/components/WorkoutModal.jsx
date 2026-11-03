import React, { useState, useEffect, useRef } from 'react';
import { X, Check, CheckCircle2, Flame, Timer, Scale, CloudCheck, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';
import { api } from '../services/api';
import { calculateDayCalories } from '../utils/calories';

export default function WorkoutModal({
  day,
  isOpen,
  onClose,
  onDayUpdated,
  onLaunchRestTimer,
  onOpenExerciseGuide,
}) {
  if (!isOpen || !day) return null;

  const [activeDay, setActiveDay] = useState(JSON.parse(JSON.stringify(day)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    setActiveDay(JSON.parse(JSON.stringify(day)));
  }, [day]);

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

  // Toggle Warmup / Cooldown stretch
  const toggleStretch = (listKey, idx) => {
    const clone = JSON.parse(JSON.stringify(activeDay));
    clone[listKey][idx].completed = !clone[listKey][idx].completed;
    clone.completion_percentage = calculateProgress(clone);
    sounds.playSetCheck();
    triggerAutoSave(clone);
  };

  // Log or Toggle Set
  const handleSetToggle = (exIdx, setIdx) => {
    const clone = JSON.parse(JSON.stringify(activeDay));
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

    clone.completion_percentage = calculateProgress(clone);
    triggerAutoSave(clone);
  };

  const handleSetInputChange = (exIdx, setIdx, field, value) => {
    const clone = JSON.parse(JSON.stringify(activeDay));
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
    const clone = JSON.parse(JSON.stringify(activeDay));
    clone.completed = checked;
    if (checked) {
      clone.completion_percentage = 100;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#CCFF00', '#10B981', '#ffffff'],
      });
      sounds.playTimerDone();
    }
    triggerAutoSave(clone);
  };

  const cal = calculateDayCalories(activeDay, activeDay.actual_weight_kg || 91.5);
  const pct = activeDay.completion_percentage || 0;

  return (
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div class="w-full sm:max-w-2xl bg-dark-850 border border-white/[0.1] rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div class="p-3.5 sm:p-4 border-b border-white/[0.08] bg-dark-900 flex items-center justify-between shrink-0">
          <div class="flex items-center space-x-2">
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
            <span class="text-[11px] font-mono font-bold text-volt hidden sm:inline">
              ~{cal.total_estimated_kcal} kcal
            </span>
            <button
              onClick={onClose}
              class="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. DYNAMIC WARM-UP & MOBILITY */}
          {activeDay.warmup_stretches && activeDay.warmup_stretches.length > 0 && (
            <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
                  <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">1</span>
                  <span>Dynamic Warm-Up Mobility</span>
                </div>
                <span class="text-[10px] text-zinc-400 font-mono">
                  {activeDay.warmup_stretches.filter((w) => w.completed).length}/{activeDay.warmup_stretches.length} Done
                </span>
              </div>

              <div class="space-y-1.5">
                {activeDay.warmup_stretches.map((stretch, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleStretch('warmup_stretches', idx)}
                    class={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                      stretch.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04]'
                    }`}
                  >
                    <div class="flex items-center space-x-2">
                      <div class={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                        stretch.completed ? 'bg-emerald-400 text-dark-950' : 'border border-zinc-600'
                      }`}>
                        {stretch.completed && <Check class="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span class={`text-xs ${stretch.completed ? 'text-zinc-400 line-through' : 'text-zinc-200 font-medium'}`}>
                        {stretch.name}
                      </span>
                    </div>
                    <span class="text-[10px] text-zinc-500 font-mono">{stretch.reps_or_time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. PRIMARY STRENGTH LIFTS */}
          <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
                <span class="w-5 h-5 rounded-md bg-volt/20 text-volt flex items-center justify-center text-[10px]">2</span>
                <span>Strength Lifts & Progressive Sets</span>
              </div>
              <button
                onClick={() => onLaunchRestTimer(90)}
                class="text-[10px] font-bold text-rose-400 flex items-center space-x-1 hover:underline"
              >
                <Timer class="w-3 h-3" />
                <span>Rest Timer</span>
              </button>
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

              return (
                <div key={exIdx} class="p-3 rounded-xl bg-dark-850 border border-white/[0.06] space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-xs font-bold text-white font-heading">{ex.name}</h4>
                      <span class="text-[10px] text-zinc-400 font-mono">Target: {ex.target}</span>
                    </div>

                    {ex.media && (
                      <button
                        onClick={() => onOpenExerciseGuide(ex.media)}
                        class="text-[10px] font-bold text-volt flex items-center space-x-0.5 hover:underline"
                      >
                        <span>Form Guide</span>
                        <ExternalLink class="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Set table */}
                  <div class="space-y-1">
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
                  <span class="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">3</span>
                  <span>Conditioning & Cardio</span>
                </div>
              </div>

              <div
                onClick={() => {
                  const clone = JSON.parse(JSON.stringify(activeDay));
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

          {/* 4. COOL-DOWN STRETCHES */}
          {activeDay.cooldown_stretches && activeDay.cooldown_stretches.length > 0 && (
            <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06]">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-white font-heading">
                  <span class="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">4</span>
                  <span>Cool-Down Static Stretches</span>
                </div>
                <span class="text-[10px] text-zinc-400 font-mono">
                  {activeDay.cooldown_stretches.filter((c) => c.completed).length}/{activeDay.cooldown_stretches.length} Done
                </span>
              </div>

              <div class="space-y-1.5">
                {activeDay.cooldown_stretches.map((stretch, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleStretch('cooldown_stretches', idx)}
                    class={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                      stretch.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-dark-850 hover:bg-white/5 border border-white/[0.04]'
                    }`}
                  >
                    <div class="flex items-center space-x-2">
                      <div class={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                        stretch.completed ? 'bg-emerald-400 text-dark-950' : 'border border-zinc-600'
                      }`}>
                        {stretch.completed && <Check class="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span class={`text-xs ${stretch.completed ? 'text-zinc-400 line-through' : 'text-zinc-200 font-medium'}`}>
                        {stretch.name}
                      </span>
                    </div>
                    <span class="text-[10px] text-zinc-500 font-mono">{stretch.reps_or_time}</span>
                  </div>
                ))}
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
        <div class="p-3 sm:p-4 border-t border-white/[0.08] bg-dark-900 flex items-center justify-between gap-3 shrink-0">
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
    </div>
  );
}
