import React, { useState } from 'react';
import { Play, Pause, RotateCcw, X, Minimize2, Maximize2 } from 'lucide-react';
import { FaStopwatch } from 'react-icons/fa6';
import { sounds } from '../utils/sound';

export default function RestTimer({ isOpen, onClose, secondsLeft, isRunning, onToggleRun, onReset, onSetPreset }) {
  if (!isOpen) return null;

  const [isMinimized, setIsMinimized] = useState(false);

  const format = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Compact floating pill when minimized (prevents blocking exercise inputs during workout)
  if (isMinimized) {
    return (
      <aside aria-label="Rest timer" className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-[70] bg-dark-850/95 backdrop-blur-xl border border-volt/40 rounded-full px-3.5 py-2 shadow-2xl flex items-center space-x-2.5 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-1.5 text-xs font-black font-mono text-volt"
          title="Tap to expand timer"
        >
          <FaStopwatch className="w-3.5 h-3.5 text-rose-400" />
          <span>{format(secondsLeft)}</span>
        </button>

        <button
          onClick={onToggleRun}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-200 hover:text-white transition"
          title={isRunning ? 'Pause' : 'Resume'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5 fill-current text-amber-300" /> : <Play className="w-3.5 h-3.5 fill-current text-volt" />}
        </button>

        <button
          onClick={() => setIsMinimized(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
          title="Expand Rest Timer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-400"
          title="Close Timer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Rest timer" className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-[70] w-72 max-w-[calc(100vw-1.5rem)] bg-dark-850/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <FaStopwatch className="w-4 h-4 text-rose-400" />
          <span>Rest Interval Timer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            title="Minimize to floating pill"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            title="Close timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Big Readout */}
      <div className="text-center py-2">
        <div className={`text-4xl font-black font-mono tracking-tight transition-colors ${isRunning ? 'text-volt' : 'text-zinc-300'}`}>
          {format(secondsLeft)}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1 block">
          {isRunning ? 'Interval Active' : 'Rest Paused'}
        </span>
      </div>

      {/* Preset Chips */}
      <div className="grid grid-cols-4 gap-1.5 my-3">
        {[45, 60, 90, 120].map((sec) => (
          <button
            key={sec}
            onClick={() => onSetPreset(sec)}
            className={`py-2 text-xs font-mono font-bold rounded-xl border transition min-h-[38px] ${
              secondsLeft === sec
                ? 'bg-volt/20 text-volt border-volt/40 font-black'
                : 'bg-dark-900 text-zinc-300 border-white/[0.06] hover:bg-white/5'
            }`}
          >
            {sec}s
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleRun}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition active:scale-95 min-h-[44px] ${
            isRunning
              ? 'bg-amber-400 hover:bg-amber-300 text-dark-950'
              : 'bg-volt hover:bg-[#b8e600] text-dark-950 shadow-lg shadow-volt/20'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Rest</span>
            </>
          )}
        </button>
        <button
          onClick={onReset}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-dark-900 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/[0.06] transition"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
