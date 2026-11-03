import React from 'react';
import { Flame, Scale, Timer, Dumbbell, Calendar, TrendingUp, BookOpen } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, stats, onOpenWeightModal, onToggleTimer, timerRemaining, isTimerRunning }) {
  const currentWeight = stats?.weight_stats?.current_weight_kg || 91.55;
  const streak = stats?.current_streak || 0;

  const tabs = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'vault', label: 'Vault', icon: BookOpen },
  ];

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header class="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/[0.08] px-3 sm:px-6 py-2.5 transition-all">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div class="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('today')}>
          <div class="w-9 h-9 rounded-xl bg-volt flex items-center justify-center text-dark-950 font-black shadow-lg shadow-volt/20">
            <span class="font-heading text-lg tracking-tighter">90</span>
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-heading font-black text-sm sm:text-base tracking-wider text-white">90DAYS</span>
              <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-volt text-dark-950 uppercase tracking-widest">PRO</span>
            </div>
            <p class="text-[10px] text-zinc-400 font-semibold tracking-wide flex items-center space-x-1">
              <span>Kush</span>
              <span>•</span>
              <span class="text-volt">82.0 kg Goal</span>
            </p>
          </div>
        </div>

        {/* Desktop Segmented Navigation */}
        <nav class="hidden md:flex items-center p-1 rounded-xl bg-dark-850 border border-white/[0.06] space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                class={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-volt text-dark-950 shadow-md shadow-volt/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon class="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Vitals */}
        <div class="flex items-center space-x-2">
          {/* Streak Badge */}
          <div class="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-850 border border-white/[0.06] text-amber-400 font-bold text-xs">
            <Flame class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span class="font-heading">{streak}</span>
          </div>

          {/* Quick Weight Badge */}
          <button
            onClick={onOpenWeightModal}
            class="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-850 border border-white/[0.06] hover:border-volt/40 text-zinc-200 hover:text-white text-xs font-bold transition"
            title="Log Today's Weight"
          >
            <Scale class="w-3.5 h-3.5 text-volt" />
            <span class="font-mono">{currentWeight} kg</span>
          </button>

          {/* Rest Timer Button */}
          <button
            onClick={onToggleTimer}
            class={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition ${
              isTimerRunning
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-dark-850 hover:bg-white/10 text-zinc-300 border-white/[0.06]'
            }`}
            title="Rest Timer"
          >
            <Timer class="w-3.5 h-3.5 text-rose-400" />
            <span class="font-mono hidden sm:inline">{formatTimer(timerRemaining)}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

