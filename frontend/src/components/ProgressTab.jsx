import React, { useMemo } from 'react';
import { Flame, Scale, TrendingDown, Target, Plus, CheckCircle2, Trash2 } from 'lucide-react';

export default function ProgressTab({ stats, weightHistory, onOpenWeightModal, onDeleteWeightLog }) {
  const ws = stats?.weight_stats || {
    start_weight_kg: 92.5,
    target_weight_kg: 82.0,
    current_weight_kg: 91.55,
    total_loss_kg: 0.95,
    remaining_loss_kg: 9.55,
    progress_percentage: 9.0,
  };

  // SVG Chart points calculation
  const chartData = useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) {
      return [
        { date: 'Start', weight: ws.start_weight_kg || 92.5 },
        { date: 'Current', weight: ws.current_weight_kg || 91.55 },
      ];
    }
    return [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [weightHistory, ws]);

  // SVG dimensions & scaling
  const minW = Math.min(80, ...chartData.map((d) => d.weight_kg || d.weight || 92));
  const maxW = Math.max(94, ...chartData.map((d) => d.weight_kg || d.weight || 92));
  const svgWidth = 600;
  const svgHeight = 180;
  const padding = 30;

  const points = chartData.map((d, idx) => {
    const val = d.weight_kg !== undefined ? d.weight_kg : d.weight;
    const x = padding + (idx / Math.max(1, chartData.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((val - minW) / Math.max(1, maxW - minW)) * (svgHeight - padding * 2);
    return { x, y, val, date: d.date };
  });

  // Target line y
  const targetY = svgHeight - padding - ((82.0 - minW) / Math.max(1, maxW - minW)) * (svgHeight - padding * 2);

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div class="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* 1. TRANSFORMATION HERO BANNER */}
      <div class="p-4 sm:p-6 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span class="text-[10px] font-black tracking-widest uppercase text-volt">Goal Transformation</span>
            <h2 class="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              {ws.start_weight_kg} kg <span class="text-volt">➔</span> {ws.target_weight_kg} kg
            </h2>
            <p class="text-xs text-zinc-400">
              {ws.total_loss_kg > 0 ? `${ws.total_loss_kg} kg dropped` : 'Journey started'} • {ws.remaining_loss_kg} kg to target
            </p>
          </div>

          <button
            onClick={onOpenWeightModal}
            class="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-black bg-volt text-dark-950 hover:bg-[#b8e600] flex items-center space-x-1.5 transition active:scale-95 shadow-lg shadow-volt/20"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>Log Today's Weigh-In</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div class="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
            <span class="text-zinc-400">Transformation Progress</span>
            <span class="text-volt">{ws.progress_percentage || 0}% Completed</span>
          </div>
          <div class="w-full h-3 rounded-full bg-dark-900 border border-white/[0.06] overflow-hidden p-0.5">
            <div
              class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-volt to-[#b8e600] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(4, ws.progress_percentage || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. FOUR VITALS SCOREBOARD TILES */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div class="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Active Streak</span>
          <div class="flex items-center space-x-1 text-amber-400">
            <Flame class="w-5 h-5 fill-amber-400" />
            <span class="text-xl sm:text-2xl font-black font-heading">{stats?.current_streak || 0}</span>
            <span class="text-xs text-zinc-400 font-bold">days</span>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Workouts Done</span>
          <div class="flex items-center space-x-1 text-emerald-400">
            <CheckCircle2 class="w-5 h-5 fill-emerald-400/20" />
            <span class="text-xl sm:text-2xl font-black font-heading">{stats?.completed_days || 0}</span>
            <span class="text-xs text-zinc-400 font-bold">/ 90</span>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Energy Burned</span>
          <div class="flex items-center space-x-1 text-volt">
            <Flame class="w-5 h-5" />
            <span class="text-xl sm:text-2xl font-black font-heading font-mono">
              {(stats?.total_calories_burned || 0).toLocaleString()}
            </span>
            <span class="text-xs text-zinc-400 font-bold">kcal</span>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Total Loss</span>
          <div class="flex items-center space-x-1 text-cyan-400">
            <TrendingDown class="w-5 h-5" />
            <span class="text-xl sm:text-2xl font-black font-heading font-mono">
              -{ws.total_loss_kg || 0}
            </span>
            <span class="text-xs text-zinc-400 font-bold">kg</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE WEIGHT WAVE SPLINE */}
      <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <Scale class="w-4 h-4 text-volt" />
            <span class="text-xs font-bold text-white font-heading">Weight Trajectory</span>
          </div>
          <span class="text-[10px] text-zinc-400 font-mono">Target: 82.0 kg</span>
        </div>

        <div class="w-full overflow-hidden bg-dark-900 rounded-xl p-2 border border-white/[0.04]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} class="w-full h-44">
            {/* Target Line */}
            {targetY >= 0 && targetY <= svgHeight && (
              <line
                x1={padding}
                y1={targetY}
                x2={svgWidth - padding}
                y2={targetY}
                stroke="#CCFF00"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.4"
              />
            )}

            {/* Polyline */}
            <polyline
              fill="none"
              stroke="#CCFF00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />

            {/* Points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#09090D" stroke="#CCFF00" strokeWidth="2.5" />
                <text
                  x={p.x}
                  y={p.y - 8}
                  fill="#f4f4f5"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {p.val} kg
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 4. PHASE BREAKDOWN CARDS */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          { key: 'phase1', title: 'Phase 1: Foundation', weeks: 'Weeks 1–4', target: 'Prime neural pathways & hypertrophy' },
          { key: 'phase2', title: 'Phase 2: Progress', weeks: 'Weeks 5–9', target: 'Progressive overload & fat burning' },
          { key: 'phase3', title: 'Phase 3: Consolidate', weeks: 'Weeks 10–13', target: 'Peak strength & muscle definition' },
        ].map((ph) => {
          const pData = stats?.phases?.[ph.key] || { completed: 0, total: 30, pct: 0 };
          return (
            <div key={ph.key} class="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06]">
              <span class="text-[10px] font-bold text-volt uppercase">{ph.weeks}</span>
              <h4 class="text-xs font-bold text-white font-heading mt-0.5">{ph.title}</h4>
              <p class="text-[11px] text-zinc-400 mt-1 mb-2 leading-tight">{ph.target}</p>
              <div class="flex items-center justify-between text-[10px] font-mono mb-1">
                <span class="text-zinc-500">Progress</span>
                <span class="font-bold text-zinc-300">{pData.completed}/{pData.total} ({pData.pct}%)</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-dark-900 overflow-hidden">
                <div class="h-full bg-volt rounded-full" style={{ width: `${pData.pct || 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. WEIGH-IN LOGS TABLE */}
      {weightHistory && weightHistory.length > 0 && (
        <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06]">
          <h4 class="text-xs font-bold text-white font-heading mb-3">Recent Weigh-In Records</h4>
          <div class="space-y-1.5 max-h-56 overflow-y-auto">
            {weightHistory.slice(0, 10).map((log, idx) => (
              <div
                key={log._id || idx}
                class="flex items-center justify-between p-2 rounded-xl bg-dark-900/60 border border-white/[0.04] text-xs font-mono"
              >
                <div>
                  <span class="text-zinc-400">{log.date || 'Today'}</span>
                  {log.notes && <span class="text-zinc-500 ml-2 italic text-[11px]">"{log.notes}"</span>}
                </div>
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-volt">{log.weight_kg} kg</span>
                  {onDeleteWeightLog && log._id && (
                    <button
                      onClick={() => onDeleteWeightLog(log._id)}
                      class="text-zinc-500 hover:text-rose-400 p-1"
                      title="Delete record"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
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

