import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Sparkles,
  Plus,
  Maximize2,
  Minimize2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { FaWeightScale } from 'react-icons/fa6';
import { TbTargetArrow } from 'react-icons/tb';

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
  const [timeframe, setTimeframe] = useState('ALL'); // '7D', '14D', '30D', 'ALL'
  const [viewMode, setViewMode] = useState('focused'); // 'focused' (zoomed in to progress) or 'runway' (full 82kg span)
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showTrend, setShowTrend] = useState(true);
  const svgRef = useRef(null);

  // 1. Normalize and sort weight logs
  const rawData = useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) {
      return [
        { id: 0, date: 'Start', dateDisplay: 'Start', weight: startWeight, notes: 'Target transformation start' },
        { id: 1, date: 'Today', dateDisplay: 'Today', weight: currentWeight, notes: 'Current progress' },
      ];
    }

    const sorted = [...weightHistory].sort((a, b) => {
      const da = new Date(a.recorded_at || a.date || 0);
      const db = new Date(b.recorded_at || b.date || 0);
      return da - db;
    });

    return sorted.map((item, idx) => {
      const w = item.weight_kg !== undefined ? Number(item.weight_kg) : Number(item.weight || currentWeight);
      const dStr = item.date_display || (item.date ? String(item.date).slice(5) : `D${idx + 1}`);
      const fullDate = item.recorded_at
        ? new Date(item.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : (item.date || `Entry ${idx + 1}`);
      return {
        id: item._id || idx,
        weight: w,
        dateDisplay: dStr,
        fullDate,
        dayNumber: item.day_number || (idx + 1),
        notes: item.notes || '',
        raw: item,
      };
    });
  }, [weightHistory, startWeight, currentWeight]);

  // 2. Filter based on selected timeframe
  const filteredData = useMemo(() => {
    if (timeframe === 'ALL' || rawData.length <= 2) return rawData;
    const count = timeframe === '7D' ? 7 : timeframe === '14D' ? 14 : 30;
    return rawData.slice(-count);
  }, [rawData, timeframe]);

  // 3. Dimensions & canvas margins
  const width = 640;
  const height = 260;
  const padLeft = 48;
  const padRight = 32;
  const padTop = 32;
  const padBottom = 38;

  // 4. Adaptive dynamic scaling
  const weights = filteredData.map((d) => d.weight);
  const dataMin = weights.length > 0 ? Math.min(...weights) : startWeight;
  const dataMax = weights.length > 0 ? Math.max(...weights) : startWeight;

  const { minW, maxW } = useMemo(() => {
    if (viewMode === 'focused') {
      const span = Math.max(0.6, dataMax - dataMin);
      const buffer = Math.max(0.35, span * 0.25);
      let calculatedMin = Number((dataMin - buffer).toFixed(1));
      let calculatedMax = Number((dataMax + buffer).toFixed(1));
      if (calculatedMax - calculatedMin < 1.2) {
        calculatedMin = Number((calculatedMin - 0.4).toFixed(1));
        calculatedMax = Number((calculatedMax + 0.4).toFixed(1));
      }
      return { minW: calculatedMin, maxW: calculatedMax };
    } else {
      // Runway view (shows all the way down to target weight)
      const calculatedMin = Math.floor(Math.min(targetWeight, dataMin) - 1);
      const calculatedMax = Math.ceil(Math.max(startWeight, dataMax) + 1);
      return { minW: calculatedMin, maxW: calculatedMax };
    }
  }, [viewMode, dataMin, dataMax, targetWeight, startWeight]);

  // 5. Map data points to SVG coordinates
  const points = useMemo(() => {
    if (filteredData.length === 0) return [];
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    return filteredData.map((d, i) => {
      const x = filteredData.length === 1
        ? padLeft + plotW / 2
        : padLeft + (i / (filteredData.length - 1)) * plotW;
      const normY = (d.weight - minW) / Math.max(0.1, maxW - minW);
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

  // Target line Y coordinate (if within bounds)
  const targetY = useMemo(() => {
    const plotH = height - padTop - padBottom;
    const norm = (targetWeight - minW) / Math.max(0.1, maxW - minW);
    return height - padBottom - norm * plotH;
  }, [targetWeight, minW, maxW]);

  // Start weight line Y coordinate
  const startY = useMemo(() => {
    const plotH = height - padTop - padBottom;
    const norm = (startWeight - minW) / Math.max(0.1, maxW - minW);
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

  // Linear Regression Trendline
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
    const denom = n * sumXX - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / denom;
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

  // Horizontal Grid Lines
  const gridSteps = useMemo(() => {
    const steps = [];
    const span = maxW - minW;
    let stepInterval = 0.5;
    if (span <= 1.4) stepInterval = 0.25;
    else if (span <= 3.2) stepInterval = 0.5;
    else if (span <= 6.5) stepInterval = 1.0;
    else if (span <= 14.0) stepInterval = 2.0;
    else stepInterval = 5.0;

    const startVal = Math.ceil(minW / stepInterval) * stepInterval;
    for (let w = startVal; w <= maxW; w += stepInterval) {
      const cleanW = Number(w.toFixed(2));
      const plotH = height - padTop - padBottom;
      const norm = (cleanW - minW) / Math.max(0.1, maxW - minW);
      const y = height - padBottom - norm * plotH;
      if (y >= padTop - 5 && y <= height - padBottom + 5) {
        steps.push({ weight: cleanW, y });
      }
    }
    return steps;
  }, [minW, maxW]);

  // Interactive Active Point
  const active = hoveredPoint || (points.length > 0 ? points[points.length - 1] : null);

  // Overall key metrics
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const latestWeight = latestPoint ? latestPoint.weight : currentWeight;
  const totalDropped = Number((startWeight - latestWeight).toFixed(2));
  const remainingToGoal = Number((latestWeight - targetWeight).toFixed(2));
  const minRecorded = points.length > 0 ? Math.min(...points.map((p) => p.weight)) : latestWeight;
  const progressPercent = Math.min(100, Math.max(0, Math.round((totalDropped / (startWeight - targetWeight)) * 100)));

  // Interactive Pointer & Touch Scrubbing
  const updateScrubPoint = (clientX) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const touchX = ((clientX - rect.left) / rect.width) * width;

    let closest = points[0];
    let minDist = Math.abs(points[0].x - touchX);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - touchX);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }
    setHoveredPoint(closest);
  };

  const handlePointerMove = (e) => {
    updateScrubPoint(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updateScrubPoint(e.touches[0].clientX);
    }
  };

  const handleLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-2xl space-y-4">
      {/* 1. Header with Current Stats, View Mode, and Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-volt/15 border border-volt/30 flex items-center justify-center text-volt">
              <FaWeightScale className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-heading">
              Bodyweight Trajectory
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-zinc-400 border border-white/10">
              {filteredData.length} Logs
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              {latestWeight.toFixed(2)}
              <span className="text-xs sm:text-sm font-bold text-zinc-400 font-mono ml-1">kg</span>
            </span>

            {totalDropped > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center space-x-1 shadow-sm">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{totalDropped} kg dropped</span>
              </span>
            ) : (
              <span className="text-xs text-zinc-400 font-mono">Baseline started</span>
            )}
          </div>
        </div>

        {/* View Controls: Scale Mode Toggle & Timeframes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom scale mode toggle */}
          <div className="flex items-center bg-dark-900 p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setViewMode('focused')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                viewMode === 'focused'
                  ? 'bg-volt text-dark-950 font-black shadow-md shadow-volt/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Zoom into your actual weigh-ins to see every drop clearly"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Detailed View</span>
            </button>
            <button
              onClick={() => setViewMode('runway')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                viewMode === 'runway'
                  ? 'bg-volt text-dark-950 font-black shadow-md shadow-volt/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Full 90-day runway down to your 82kg target"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Goal Runway</span>
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center space-x-1 bg-dark-900 p-1 rounded-xl border border-white/[0.06]">
            {['7D', '14D', '30D', 'ALL'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  timeframe === tf
                    ? 'bg-white/15 text-white font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {onOpenWeightModal && (
            <button
              onClick={onOpenWeightModal}
              className="p-1.5 rounded-xl bg-volt/10 text-volt border border-volt/30 hover:bg-volt hover:text-dark-950 transition active:scale-95"
              title="Record new weigh-in"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Inspection Deck (Tracks Touch/Hover without overlapping graph) */}
      {active && (
        <div className="p-3 rounded-2xl bg-dark-900/90 border border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5 transition">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-volt/10 border border-volt/25 flex items-center justify-center text-volt">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-white font-heading">
                  {active.dateDisplay}
                </span>
                {active.dayNumber && (
                  <span className="text-[10px] font-mono font-bold text-volt bg-volt/10 px-1.5 py-0.2 rounded">
                    Day {active.dayNumber}
                  </span>
                )}
                {active.fullDate && (
                  <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                    • {active.fullDate}
                  </span>
                )}
              </div>
              {active.notes && (
                <p className="text-[10px] text-zinc-400 italic line-clamp-1 max-w-sm">
                  "{active.notes}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-right">
            <div>
              <span className="text-xs text-zinc-400 block font-mono uppercase text-[9px] font-bold">
                Logged Weight
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {active.weight.toFixed(2)} kg
              </span>
            </div>

            {active.changeFromPrev !== 0 && (
              <div className="pl-3 border-l border-white/[0.08]">
                <span className="text-xs text-zinc-400 block font-mono uppercase text-[9px] font-bold">
                  vs Previous
                </span>
                <span
                  className={`text-xs font-mono font-black ${
                    active.changeFromPrev < 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {active.changeFromPrev > 0 ? `+${active.changeFromPrev}` : active.changeFromPrev} kg
                </span>
              </div>
            )}

            <div className="pl-3 border-l border-white/[0.08]">
              <span className="text-xs text-zinc-400 block font-mono uppercase text-[9px] font-bold">
                Total From Start
              </span>
              <span className="text-xs font-mono font-black text-volt">
                {active.totalLostSoFar > 0 ? `-${active.totalLostSoFar}` : active.totalLostSoFar} kg
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive SVG Curve Canvas */}
      <div className="relative bg-dark-900 rounded-2xl p-2 sm:p-3 border border-white/[0.06] overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 touch-none cursor-crosshair select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handleLeave}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleLeave}
        >
          <defs>
            {/* Glowing neon green gradient under curve */}
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#CCFF00" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0.0" />
            </linearGradient>

            {/* Neon line glow filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#CCFF00" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {gridSteps.map((step, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={step.y}
                x2={width - padRight}
                y2={step.y}
                stroke="#ffffff"
                strokeOpacity="0.08"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <text
                x={padLeft - 8}
                y={step.y + 3.5}
                fill="#a1a1aa"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="700"
                textAnchor="end"
              >
                {step.weight}
              </text>
            </g>
          ))}

          {/* Target Weight Goal Line (if in visible Y range) */}
          {targetY >= padTop && targetY <= height - padBottom && (
            <g>
              <line
                x1={padLeft}
                y1={targetY}
                x2={width - padRight}
                y2={targetY}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <rect
                x={width - padRight - 90}
                y={targetY - 11}
                width="90"
                height="18"
                rx="5"
                fill="#09090D"
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text
                x={width - padRight - 45}
                y={targetY + 2.5}
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                🎯 Goal: {targetWeight} kg
              </text>
            </g>
          )}

          {/* Start Weight Benchmark Line (if in visible Y range) */}
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
                y={startY - 5}
                fill="#a1a1aa"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                Start: {startWeight} kg
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
              strokeWidth="2"
              opacity="0.6"
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
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
            />
          )}

          {/* X Axis Date Labels */}
          {points.map((p, i) => {
            const shouldShow =
              points.length <= 10 ||
              i === 0 ||
              i === points.length - 1 ||
              i % Math.ceil(points.length / 6) === 0;

            if (!shouldShow) return null;

            return (
              <text
                key={`lbl-${i}`}
                x={p.x}
                y={height - 12}
                fill="#a1a1aa"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="700"
                textAnchor="middle"
              >
                {p.dateDisplay}
              </text>
            );
          })}

          {/* Data Points and Direct Value Callouts */}
          {points.map((p, i) => {
            const isHovered = hoveredPoint && hoveredPoint.id === p.id;
            const isLatest = !hoveredPoint && i === points.length - 1;
            const isFirst = i === 0;

            return (
              <g key={`pt-${i}`}>
                {/* Outer pulsing ring for active/hovered point */}
                {(isHovered || isLatest) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 10 : 8}
                    fill="#CCFF00"
                    fillOpacity={isHovered ? 0.35 : 0.2}
                    className="animate-pulse"
                  />
                )}

                {/* Point anchor */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : isLatest ? 5.5 : 4}
                  fill="#09090D"
                  stroke="#CCFF00"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  className="transition-all duration-150"
                />

                {/* Direct Weight Labels above points when point count is small (<= 7) */}
                {points.length <= 7 && (
                  <g>
                    <rect
                      x={p.x - 22}
                      y={p.y - 24}
                      width="44"
                      height="16"
                      rx="4"
                      fill="#121217"
                      stroke={isHovered || isLatest ? '#CCFF00' : 'rgba(255,255,255,0.15)'}
                      strokeWidth={isHovered || isLatest ? '1.2' : '0.8'}
                    />
                    <text
                      x={p.x}
                      y={p.y - 12}
                      fill={isHovered || isLatest ? '#CCFF00' : '#ffffff'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.weight.toFixed(2)}
                    </text>
                  </g>
                )}
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
              strokeOpacity="0.3"
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* Goal Indicator Pill if Target is below focused view */}
        {viewMode === 'focused' && targetWeight < minW && (
          <div className="absolute bottom-3 right-3 sm:right-4 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-dark-950/90 border border-sky-400/30 text-sky-300 text-xs shadow-lg backdrop-blur-md">
            <TbTargetArrow className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-[11px]">
              Goal Target: <span className="text-white font-mono">{targetWeight} kg</span> ({remainingToGoal} kg to go)
            </span>
            <button
              onClick={() => setViewMode('runway')}
              className="text-[10px] font-bold text-volt hover:underline ml-1"
            >
              Show Runway ➔
            </button>
          </div>
        )}
      </div>

      {/* 4. Progress Runway Bar (From Start to Goal) */}
      <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <TbTargetArrow className="w-4 h-4 text-volt" />
            <span className="font-bold text-white font-heading">
              Transformation Progress
            </span>
          </div>
          <span className="font-bold text-volt">
            {progressPercent}% Achieved ({totalDropped > 0 ? `-${totalDropped} kg` : '0 kg'} / -{Number((startWeight - targetWeight).toFixed(2))} kg)
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-dark-950 border border-white/[0.06] overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-volt via-emerald-400 to-cyan-400 transition-all duration-700 shadow-md shadow-volt/20"
            style={{ width: `${Math.max(4, Math.min(100, progressPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>Start: {startWeight} kg</span>
          <span>Current: {latestWeight.toFixed(2)} kg</span>
          <span className="text-sky-300 font-bold">Target: {targetWeight} kg</span>
        </div>
      </div>

      {/* 5. Vitals Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
            Starting Weight
          </span>
          <span className="text-base font-bold text-white font-mono">{startWeight} kg</span>
        </div>

        <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
            Lowest Weigh-In
          </span>
          <span className="text-base font-bold text-emerald-400 font-mono">
            {minRecorded.toFixed(2)} kg
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
            Total Dropped
          </span>
          <span className="text-base font-bold text-volt font-mono">
            {totalDropped > 0 ? `-${totalDropped} kg` : '0.00 kg'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-dark-900 border border-white/[0.04]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
            Remaining To Goal
          </span>
          <span className="text-base font-bold text-sky-400 font-mono">
            {remainingToGoal > 0 ? `${remainingToGoal} kg` : 'Goal Reached! 🎉'}
          </span>
        </div>
      </div>

      {/* 6. Chart Options & Controls Footer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1">
        <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-medium hover:text-white transition">
          <input
            type="checkbox"
            checked={showTrend}
            onChange={(e) => setShowTrend(e.target.checked)}
            className="accent-sky-400 rounded"
          />
          <span>Show Trajectory Trendline</span>
        </label>

        <span className="text-[10px] text-zinc-400 font-mono">
          Touch or drag across points to inspect daily weigh-ins
        </span>
      </div>
    </div>
  );
}
