import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { TbBarbell } from 'react-icons/tb';
import { MdFitnessCenter } from 'react-icons/md';
import { FaFireFlameCurved, FaWeightScale, FaStopwatch } from 'react-icons/fa6';

export default function Navbar({ activeTab, setActiveTab, stats, onOpenWeightModal, onToggleTimer, timerRemaining, isTimerRunning }) {
  const currentWeight = stats?.weight_stats?.current_weight_kg || 91.55;
  const streak = stats?.current_streak || 0;

  const tabs = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'workouts', label: 'Workouts', icon: TbBarbell },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'vault', label: 'Library', icon: MdFitnessCenter },
  ];

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/[0.08] px-2.5 sm:px-6 header-safe-area pb-2.5 transition-all overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('today')}>
          <div className="w-9 h-9 rounded-xl bg-volt flex items-center justify-center text-dark-950 font-black shadow-lg shadow-volt/20 shrink-0">
            <span className="font-heading text-lg tracking-tighter">90</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-heading font-black text-sm sm:text-base tracking-wider text-white">90DAYS</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-volt text-dark-950 uppercase tracking-widest">PRO</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold tracking-wide hidden min-[360px]:flex items-center space-x-1">
              <span>Kush</span>
              <span>•</span>
              <span className="text-volt">82.0 kg Goal</span>
            </p>
          </div>
        </div>

        {/* Desktop Segmented Navigation */}
        <nav className="hidden md:flex items-center p-1 rounded-xl bg-dark-850 border border-white/[0.06] space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-volt text-dark-950 shadow-md shadow-volt/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Vitals (Touch target enhanced: min-h-[38px]) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Streak Badge */}
          <div className="flex items-center space-x-1 px-2 sm:px-2.5 py-2 rounded-xl bg-dark-850 border border-white/[0.06] text-amber-400 font-bold text-xs min-h-[38px]">
            <FaFireFlameCurved className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-heading">{streak}</span>
          </div>

          {/* Quick Weight Badge */}
          <button
            onClick={onOpenWeightModal}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-2 rounded-xl bg-dark-850 border border-white/[0.06] hover:border-volt/40 text-zinc-200 hover:text-white text-xs font-bold transition min-h-[38px] active:scale-95"
            title="Log Today's Weight"
          >
            <FaWeightScale className="w-3.5 h-3.5 text-volt shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">{currentWeight} kg</span>
          </button>

          {/* Rest Timer Button */}
          <button
            onClick={onToggleTimer}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-extrabold border transition min-h-[38px] active:scale-95 ${
              isTimerRunning
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-dark-850 hover:bg-white/10 text-zinc-300 border-white/[0.06]'
            }`}
            title="Rest Timer"
          >
            <FaStopwatch className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-mono hidden sm:inline">{formatTimer(timerRemaining)}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
