import React, { useState, useMemo, useRef } from 'react';
import { Scale, Target, TrendingDown, Calendar, Sparkles, ChevronRight, Info } from 'lucide-react';

// Generates smooth cubic bezier path for an array of {x, y} points
function getSmoothSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export default function WeightChart({
  weightHistory = [],
  startWeight = 92.55,
  targetWeight = 82.0,
  currentWeight = 91.55,
  onOpenWeightModal,
}) {
  const [timeframe, setTimeframe] = useState('ALL'); // '7D', '30D', '90D', 'ALL'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showTarget, setShowTarget] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  const svgRef = useRef(null);

  // Normalize and sort weight logs
  const rawData = useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) {
      return [
        { date: 'Start', dateDisplay: 'Start', weight: startWeight, notes: 'Target transformation start' },
        { date: 'Today', dateDisplay: 'Today', weight: currentWeight, notes: 'Current progress' },
      ];
    }

    const sorted = [...weightHistory].sort((a, b) => {
      const da = new Date(a.recorded_at || a.date || 0);
      const db = new Date(b.recorded_at || b.date || 0);
      return da - db;
    });

    return sorted.map((item, idx) => {
      const w = item.weight_kg !== undefined ? Number(item.weight_kg) : Number(item.weight || currentWeight);
      const dStr = item.date_display || (item.date ? String(item.date).slice(5) : `Entry ${idx + 1}`);
      const fullDate = item.recorded_at ? new Date(item.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : (item.date || 'Weigh-In');
      return {
        id: item._id || idx,
        weight: w,
        dateDisplay: dStr,
        fullDate,
        dayNumber: item.day_number || null,
        notes: item.notes || '',
        raw: item,
      };
    });
  }, [weightHistory, startWeight, currentWeight]);

  // Filter based on selected timeframe
  const filteredData = useMemo(() => {
    if (timeframe === 'ALL' || rawData.length <= 2) return rawData;
    const count = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
    return rawData.slice(-count);
  }, [rawData, timeframe]);

  // Dimensions & bounds
  const width = 640;
  const height = 220;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const weights = filteredData.map((d) => d.weight);
  const minW = Math.floor(Math.min(targetWeight - 1, ...weights) - 1);
  const maxW = Math.ceil(Math.max(startWeight + 1, ...weights) + 1);

  // Map to SVG coordinates
  const points = useMemo(() => {
    if (filteredData.length === 0) return [];
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    return filteredData.map((d, i) => {
      const x = filteredData.length === 1
        ? padLeft + plotW / 2
        : padLeft + (i / (filteredData.length - 1)) * plotW;
      const normY = (d.weight - minW) / Math.max(1, maxW - minW);
      const y = height - padBottom - normY * plotH;

      const prev = i > 0 ? filteredData[i - 1].weight : null;
      const changeFromPrev = prev !== null ? Number((d.weight - prev).toFixed(2)) : 0;
      const totalLostSoFar = Number((startWeight - d.weight).toFixed(2));

      return {
        ...d,
        x,
        y,
        changeFromPrev,
        totalLostSoFar,
      };
    });
  }, [filteredData, minW, maxW, startWeight]);

  // Target line Y coordinate
  const targetY = useMemo(() => {
    const plotH = height - padTop - padBottom;
    const norm = (targetWeight - minW) / Math.max(1, maxW - minW);
    return height - padBottom - norm * plotH;
  }, [targetWeight, minW, maxW]);

  // Start weight line Y
  const startY = useMemo(() => {
    const plotH = height - padTop - padBottom;
    const norm = (startWeight - minW) / Math.max(1, maxW - minW);
    return height - padBottom - norm * plotH;
  }, [startWeight, minW, maxW]);

  // SVG Paths
  const splinePath = useMemo(() => getSmoothSplinePath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = height - padBottom;
    return `${splinePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [splinePath, points]);

  // Simple Linear Regression Trendline
  const trendlinePoints = useMemo(() => {
    if (!showTrend || points.length < 2) return null;
    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += points[i].x;
      sumY += points[i].y;
      sumXY += points[i].x * points[i].y;
      sumXX += points[i].x * points[i].x;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    const firstX = points[0].x;
    const lastX = points[n - 1].x;
    return {
      x1: firstX,
      y1: slope * firstX + intercept,
      x2: lastX,
      y2: slope * lastX + intercept,
    };
  }, [points, showTrend]);

  // Grid steps (horizontal lines)
  const gridSteps = useMemo(() => {
    const steps = [];
    const stepSize = Math.max(1, Math.round((maxW - minW) / 4));
    for (let w = Math.ceil(minW / stepSize) * stepSize; w <= maxW; w += stepSize) {
      const plotH = height - padTop - padBottom;
      const norm = (w - minW) / Math.max(1, maxW - minW);
      const y = height - padBottom - norm * plotH;
      steps.push({ weight: w, y });
    }
    return steps;
  }, [minW, maxW]);

  // Interactive active point (hovered or latest point)
  const active = hoveredPoint || (points.length > 0 ? points[points.length - 1] : null);

  // Overall key metrics
  const latestWeight = points.length > 0 ? points[points.length - 1].weight : currentWeight;
  const totalDropped = Number((startWeight - latestWeight).toFixed(2));
  const remainingToGoal = Number((latestWeight - targetWeight).toFixed(2));
  const minRecorded = Math.min(...points.map((p) => p.weight));

  // Handle pointer scrub
  const handlePointerMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    // Find closest point by X coordinate
    let closest = points[0];
    let minDist = Math.abs(points[0].x - mouseX);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }
    setHoveredPoint(closest);
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-2xl space-y-4">
      {/* 1. Header with Current Metric & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-volt/15 border border-volt/30 flex items-center justify-center text-volt">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-heading">
              Bodyweight Trajectory
            </span>
          </div>

          <div className="flex items-baseline space-x-2.5">
            <span className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              {latestWeight.toFixed(2)}
              <span className="text-xs sm:text-sm font-bold text-zinc-400 font-mono ml-1">kg</span>
            </span>

            {totalDropped > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{totalDropped} kg overall</span>
              </span>
            ) : (
              <span className="text-xs text-zinc-400 font-mono">Baseline</span>
            )}
          </div>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center space-x-1 bg-dark-900 p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
          {['7D', '30D', '90D', 'ALL'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeframe === tf
                  ? 'bg-volt text-dark-950 font-black shadow-md shadow-volt/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive SVG Spline Canvas */}
      <div className="relative bg-dark-900 rounded-2xl p-2 sm:p-3 border border-white/[0.05] overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 touch-none cursor-crosshair select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* Glowing neon green gradient under curve */}
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#CCFF00" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0.0" />
            </linearGradient>

            {/* Neon line glow filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#CCFF00" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines */}
          {gridSteps.map((step, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={step.y}
                x2={width - padRight}
                y2={step.y}
                stroke="#ffffff"
                strokeOpacity="0.05"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={step.y + 3}
                fill="#71717a"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                {step.weight}
              </text>
            </g>
          ))}

          {/* Start Weight Benchmark Line */}
          {startY >= padTop && startY <= height - padBottom && (
            <g>
              <line
                x1={padLeft}
                y1={startY}
                x2={width - padRight}
                y2={startY}
                stroke="#71717a"
                strokeDasharray="2 3"
                strokeWidth="1"
                opacity="0.4"
              />
              <text
                x={width - padRight}
                y={startY - 4}
                fill="#a1a1aa"
                fontSize="8.5"
                fontFamily="monospace"
                textAnchor="end"
              >
                Start ({startWeight} kg)
              </text>
            </g>
          )}

          {/* Target Weight Goal Line (82.0 kg) */}
          {showTarget && targetY >= padTop && targetY <= height - padBottom && (
            <g>
              <line
                x1={padLeft}
                y1={targetY}
                x2={width - padRight}
                y2={targetY}
                stroke="#CCFF00"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <rect
                x={width - padRight - 85}
                y={targetY - 10}
                width="85"
                height="16"
                rx="4"
                fill="#121217"
                stroke="#CCFF00"
                strokeWidth="0.8"
                opacity="0.9"
              />
              <text
                x={width - padRight - 42}
                y={targetY + 2}
                fill="#CCFF00"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                🎯 Goal: {targetWeight} kg
              </text>
            </g>
          )}

          {/* Linear Trendline */}
          {trendlinePoints && (
            <line
              x1={trendlinePoints.x1}
              y1={trendlinePoints.y1}
              x2={trendlinePoints.x2}
              y2={trendlinePoints.y2}
              stroke="#38bdf8"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              opacity="0.5"
            />
          )}

          {/* Gradient Filled Area */}
          {areaPath && <path d={areaPath} fill="url(#weightAreaGrad)" />}

          {/* Smooth Curving Spline Line */}
          {splinePath && (
            <path
              d={splinePath}
              fill="none"
              stroke="#CCFF00"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
            />
          )}

          {/* X Axis Date Labels */}
          {points.map((p, i) => {
            // Filter labels on mobile to avoid overcrowding
            const shouldShow =
              points.length <= 8 ||
              i === 0 ||
              i === points.length - 1 ||
              i % Math.ceil(points.length / 5) === 0;

            if (!shouldShow) return null;

            return (
              <text
                key={`lbl-${i}`}
                x={p.x}
                y={height - 12}
                fill="#71717a"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="600"
                textAnchor="middle"
              >
                {p.dateDisplay}
              </text>
            );
          })}

          {/* Data Points */}
          {points.map((p, i) => {
            const isHovered = hoveredPoint && hoveredPoint.id === p.id;
            const isLatest = !hoveredPoint && i === points.length - 1;

            return (
              <g key={`pt-${i}`}>
                {/* Outer pulsing ring for latest / active point */}
                {(isHovered || isLatest) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 9 : 7}
                    fill="#CCFF00"
                    fillOpacity={isHovered ? 0.35 : 0.2}
                    className="animate-pulse"
                  />
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5 : isLatest ? 4.5 : 3.5}
                  fill="#09090D"
                  stroke="#CCFF00"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Vertical Guideline for Hovered Point */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padTop}
              x2={hoveredPoint.x}
              y2={height - padBottom}
              stroke="#ffffff"
              strokeOpacity="0.25"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>

        {/* 3. Floating Interactive Tooltip */}
        {active && (
          <div
            className="absolute top-3 left-3 sm:left-4 bg-dark-950/90 backdrop-blur-md border border-white/10 rounded-xl p-2.5 shadow-xl text-left pointer-events-none transition-all duration-150 min-w-[140px]"
          >
            <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 font-mono mb-0.5">
              <Calendar className="w-3 h-3 text-volt" />
              <span>{active.fullDate || active.dateDisplay}</span>
              {active.dayNumber && <span className="text-volt font-bold">• Day {active.dayNumber}</span>}
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-base font-extrabold text-white font-heading font-mono">
                {active.weight.toFixed(2)} kg
              </span>
              {active.changeFromPrev !== 0 && (
                <span
                  className={`text-[10px] font-mono font-bold ${
                    active.changeFromPrev < 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {active.changeFromPrev > 0 ? `+${active.changeFromPrev}` : active.changeFromPrev} kg
                </span>
              )}
            </div>

            {active.notes && (
              <p className="text-[10px] text-zinc-300 italic mt-0.5 max-w-[180px] line-clamp-1">
                "{active.notes}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* 4. Chart Controls & Toggles */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1">
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-medium hover:text-white transition">
            <input
              type="checkbox"
              checked={showTarget}
              onChange={(e) => setShowTarget(e.target.checked)}
              className="accent-[#CCFF00] rounded"
            />
            <span>Goal Target Line ({targetWeight} kg)</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-medium hover:text-white transition">
            <input
              type="checkbox"
              checked={showTrend}
              onChange={(e) => setShowTrend(e.target.checked)}
              className="accent-sky-400 rounded"
            />
            <span>Trajectory Trend</span>
          </label>
        </div>

        <span className="text-[10px] text-zinc-400 font-mono">
          Touch or drag across points to inspect daily change
        </span>
      </div>

      {/* 5. Vitals Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-white/[0.04]">
        <div className="p-2.5 rounded-xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-0.5">
            Starting Weight
          </span>
          <span className="text-sm font-bold text-white font-mono">{startWeight} kg</span>
        </div>

        <div className="p-2.5 rounded-xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-0.5">
            Lowest Weigh-In
          </span>
          <span className="text-sm font-bold text-emerald-400 font-mono">{minRecorded.toFixed(2)} kg</span>
        </div>

        <div className="p-2.5 rounded-xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-0.5">
            Total Dropped
          </span>
          <span className="text-sm font-bold text-volt font-mono">
            {totalDropped > 0 ? `-${totalDropped} kg` : '0 kg'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-0.5">
            Remaining To Goal
          </span>
          <span className="text-sm font-bold text-sky-400 font-mono">
            {remainingToGoal > 0 ? `${remainingToGoal} kg` : 'Goal Reached!'}
          </span>
        </div>
      </div>
    </div>
  );
}

