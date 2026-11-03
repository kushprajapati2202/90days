import React from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { FaStopwatch } from 'react-icons/fa6';
import { sounds } from '../utils/sound';

export default function RestTimer({ isOpen, onClose, secondsLeft, isRunning, onToggleRun, onReset, onSetPreset }) {
  if (!isOpen) return null;

  const format = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div class="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-72 bg-dark-850/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div class="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-3">
        <div class="flex items-center space-x-2 text-xs font-bold text-white">
          <FaStopwatch class="w-4 h-4 text-rose-400" />
          <span>Rest Interval Timer</span>
        </div>
        <button onClick={onClose} class="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition">
          <X class="w-4 h-4" />
        </button>
      </div>

      {/* Big Readout */}
      <div class="text-center py-2">
        <div class={`text-4xl font-black font-mono tracking-tight transition-colors ${isRunning ? 'text-volt' : 'text-zinc-300'}`}>
          {format(secondsLeft)}
        </div>
        <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1 block">
          {isRunning ? 'Interval Active' : 'Rest Paused'}
        </span>
      </div>

      {/* Preset Chips */}
      <div class="grid grid-cols-4 gap-1.5 my-3">
        {[45, 60, 90, 120].map((sec) => (
          <button
            key={sec}
            onClick={() => onSetPreset(sec)}
            class={`py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
              secondsLeft === sec
                ? 'bg-volt/20 text-volt border-volt/40'
                : 'bg-dark-900 text-zinc-300 border-white/[0.06] hover:bg-white/5'
            }`}
          >
            {sec}s
          </button>
        ))}
      </div>

      {/* Controls */}
      <div class="flex items-center space-x-2">
        <button
          onClick={onToggleRun}
          class={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition active:scale-95 ${
            isRunning
              ? 'bg-amber-400 hover:bg-amber-300 text-dark-950'
              : 'bg-volt hover:bg-[#b8e600] text-dark-950 shadow-lg shadow-volt/20'
          }`}
        >
          {isRunning ? (
            <>
              <Pause class="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play class="w-3.5 h-3.5 fill-current" />
              <span>Start Rest</span>
            </>
          )}
        </button>
        <button
          onClick={onReset}
          class="p-2 rounded-xl bg-dark-900 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/[0.06] transition"
          title="Reset Timer"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

