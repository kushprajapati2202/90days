import React from 'react';
import { TrendingDown, Target, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { FaFireFlameCurved, FaWeightScale } from 'react-icons/fa6';
import { TbBarbell } from 'react-icons/tb';
import WeightChart from './WeightChart';

export default function ProgressTab({ stats, weightHistory, onOpenWeightModal, onDeleteWeightLog }) {
  const ws = stats?.weight_stats || {
    start_weight_kg: 92.55,
    target_weight_kg: 82.0,
    current_weight_kg: 91.55,
    total_loss_kg: 1.0,
    remaining_loss_kg: 9.55,
    progress_percentage: 9.5,
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* 1. TRANSFORMATION HERO BANNER */}
      <div className="p-4 sm:p-6 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-volt">
              Goal Transformation
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              {ws.start_weight_kg} kg <span className="text-volt">➔</span> {ws.target_weight_kg} kg
            </h2>
            <p className="text-xs text-zinc-400">
              {ws.total_loss_kg > 0 ? `${ws.total_loss_kg} kg dropped` : 'Journey started'} • {ws.remaining_loss_kg} kg to target
            </p>
          </div>

          <button
            onClick={onOpenWeightModal}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-black bg-volt text-dark-950 hover:bg-volt-light flex items-center space-x-1.5 transition active:scale-95 shadow-lg shadow-volt/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Today's Weigh-In</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
            <span className="text-zinc-400">Transformation Progress</span>
            <span className="text-volt">{ws.progress_percentage || 0}% Completed</span>
          </div>
          <div className="w-full h-3 rounded-full bg-dark-900 border border-white/[0.06] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-volt to-[#b8e600] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(4, ws.progress_percentage || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. FOUR VITALS SCOREBOARD TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Active Streak
          </span>
          <div className="flex items-center space-x-1.5 text-amber-400">
            <FaFireFlameCurved className="w-5 h-5 text-amber-400" />
            <span className="text-xl sm:text-2xl font-black font-heading">{stats?.current_streak || 0}</span>
            <span className="text-xs text-zinc-400 font-bold">days</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Workouts Done
          </span>
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <TbBarbell className="w-5 h-5 text-emerald-400" />
            <span className="text-xl sm:text-2xl font-black font-heading">{stats?.completed_days || 0}</span>
            <span className="text-xs text-zinc-400 font-bold">/ 90</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Energy Burned
          </span>
          <div className="flex items-center space-x-1.5 text-volt">
            <FaFireFlameCurved className="w-5 h-5 text-volt" />
            <span className="text-xl sm:text-2xl font-black font-heading font-mono">
              {(stats?.total_calories_burned || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-400 font-bold">kcal</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Total Loss
          </span>
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <FaWeightScale className="w-5 h-5 text-cyan-400" />
            <span className="text-xl sm:text-2xl font-black font-heading font-mono">
              -{ws.total_loss_kg || 0}
            </span>
            <span className="text-xs text-zinc-400 font-bold">kg</span>
          </div>
        </div>
      </div>

      {/* 3. PREMIUM INTERACTIVE WEIGHT TRAJECTORY CHART */}
      <WeightChart
        weightHistory={weightHistory}
        startWeight={ws.start_weight_kg || 92.55}
        targetWeight={ws.target_weight_kg || 82.0}
        currentWeight={ws.current_weight_kg || 91.55}
        onOpenWeightModal={onOpenWeightModal}
      />

      {/* 4. PHASE BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          { key: 'phase1', title: 'Phase 1: Foundation', weeks: 'Weeks 1–4', target: 'Prime neural pathways & hypertrophy' },
          { key: 'phase2', title: 'Phase 2: Progress', weeks: 'Weeks 5–9', target: 'Progressive overload & fat burning' },
          { key: 'phase3', title: 'Phase 3: Consolidate', weeks: 'Weeks 10–13', target: 'Peak strength & muscle definition' },
        ].map((ph) => {
          const pData = stats?.phases?.[ph.key] || { completed: 0, total: 30, pct: 0 };
          return (
            <div key={ph.key} className="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
              <span className="text-[10px] font-bold text-volt uppercase">{ph.weeks}</span>
              <h4 className="text-xs font-bold text-white font-heading mt-0.5">{ph.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 mb-2 leading-tight">{ph.target}</p>
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-zinc-400">Progress</span>
                <span className="font-bold text-zinc-200">{pData.completed}/{pData.total} ({pData.pct}%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-dark-900 overflow-hidden">
                <div className="h-full bg-volt rounded-full" style={{ width: `${pData.pct || 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. WEIGH-IN LOGS TABLE */}
      {weightHistory && weightHistory.length > 0 && (
        <div className="p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <h4 className="text-xs font-bold text-white font-heading mb-3">Recent Weigh-In Records</h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {weightHistory.slice(0, 10).map((log, idx) => (
              <div
                key={log._id || idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900/60 border border-white/[0.04] text-xs font-mono"
              >
                <div>
                  <span className="text-zinc-300 font-semibold">{log.date_display || log.date || 'Today'}</span>
                  {log.day_number && <span className="text-zinc-500 text-[10px] ml-1.5">(Day {log.day_number})</span>}
                  {log.time_of_day && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded ml-1.5 font-bold uppercase ${
                        log.time_of_day === 'morning'
                          ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                          : 'bg-indigo-400/10 text-indigo-300 border border-indigo-400/20'
                      }`}
                    >
                      {log.time_of_day === 'morning' ? '☀️ Morning' : '🌙 Evening'}
                    </span>
                  )}
                  {log.notes && <span className="text-zinc-400 ml-2 italic text-[11px]">"{log.notes}"</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-volt">{log.weight_kg} kg</span>
                  {onDeleteWeightLog && log._id && (
                    <button
                      onClick={() => onDeleteWeightLog(log._id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
