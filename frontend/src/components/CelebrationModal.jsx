import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';
import { FaTrophy, FaFireFlameCurved, FaWeightScale, FaStopwatch, FaBolt } from 'react-icons/fa6';
import confetti from 'canvas-confetti';
import { formatTimeOfDay, formatDuration } from '../utils/timeFormat';
import { sounds } from '../utils/sound';

export default function CelebrationModal({
  isOpen,
  onClose,
  day,
  stats,
  caloriesBurned = 0,
  onOpenWeightModal,
}) {
  if (!isOpen || !day) return null;

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Multi-stage celebratory confetti explosion
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#CCFF00', '#10B981', '#38BDF8', '#F59E0B', '#FFFFFF'],
      });

      const t1 = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.65 },
          colors: ['#CCFF00', '#10B981'],
        });
      }, 250);

      const t2 = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.65 },
          colors: ['#CCFF00', '#38BDF8'],
        });
      }, 450);

      try {
        sounds.playTimerDone();
      } catch (_) {}

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  const streak = Math.max(1, (stats?.current_streak || 0) + (day.completed ? 0 : 1));
  const weight = day.actual_weight_kg || stats?.weight_stats?.current_weight_kg || 91.55;
  const duration = day.actual_duration_min || 45;
  const totalCompletedDays = (stats?.completed_days || 0) + (day.completed ? 0 : 1);
  const progressPct = Math.round((totalCompletedDays / 90) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md bg-dark-850 border border-volt/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden text-center space-y-4">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-volt/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-zinc-400 hover:text-white w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy / Medal Celebration Badge */}
        <div className="relative inline-block mx-auto pt-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-volt/30 to-emerald-500/10 border-2 border-volt flex items-center justify-center text-volt shadow-xl shadow-volt/20 mx-auto">
            <FaTrophy className="w-9 h-9 text-volt" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-dark-950 text-[10px] font-black uppercase font-mono tracking-wider shadow">
            100% DONE
          </span>
        </div>

        {/* Appreciation Headline */}
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-volt block">
            Outstanding Discipline
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
            Workout Crushed!
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
            Day {day.day_number} of your 90-day transformation is officially complete. You pushed through every rep!
          </p>
        </div>

        {/* 4 Core Achievement Tiles */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 text-left">
          {/* Streak Card */}
          <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.06] relative overflow-hidden">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Consistency Streak</span>
              <FaFireFlameCurved className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black font-heading text-amber-400 font-mono">
                {streak}
              </span>
              <span className="text-xs font-bold text-zinc-400">days</span>
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Unbroken momentum</span>
          </div>

          {/* Calories Burned Card */}
          <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.06]">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Energy Burned</span>
              <FaFireFlameCurved className="w-3.5 h-3.5 text-volt" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black font-heading text-volt font-mono">
                {caloriesBurned || 420}
              </span>
              <span className="text-xs font-bold text-zinc-400">kcal</span>
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5">MET energy output</span>
          </div>

          {/* Today's Weight Card */}
          <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.06]">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Today's Weight</span>
              <FaWeightScale className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black font-heading text-white font-mono">
                {Number(weight).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-zinc-400">kg</span>
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              Goal: {stats?.weight_stats?.target_weight_kg || 82.0} kg
            </span>
          </div>

          {/* Workout Time & Duration Card */}
          <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.06]">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Workout Time</span>
              <FaStopwatch className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black font-heading text-emerald-400 font-mono">
                {duration}
              </span>
              <span className="text-xs font-bold text-zinc-400">min</span>
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
              {day.started_at ? `Started ${formatTimeOfDay(day.started_at)}` : 'Full session logged'}
            </span>
          </div>
        </div>

        {/* Transformation 90-Day Progress Bar */}
        <div className="p-3 rounded-2xl bg-dark-900/80 border border-white/[0.04] space-y-1.5 text-left">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400 font-bold">Transformation Journey</span>
            <span className="text-volt font-bold">{totalCompletedDays}/90 Days ({progressPct}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-dark-950 border border-white/[0.06] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-volt to-[#b8e600] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-2xl font-heading font-black text-sm bg-volt text-dark-950 hover:bg-volt-light active:scale-[0.98] transition flex items-center justify-center space-x-2 shadow-xl shadow-volt/20"
          >
            <span>Claim Workout & Continue</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}

